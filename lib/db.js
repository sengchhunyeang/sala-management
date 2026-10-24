// Server-only PostgreSQL access.
// - students: one row per student (full CRUD via /api/students).
// - every other module has its own table (see lib/tables.js); the browser sends
//   only the rows that changed through /api/data.
import { Pool, types } from 'pg';
import { randomBytes } from 'crypto';
import { STATUSES } from '@/lib/school';
import { TABLES, assemble, cleanRow, flatten } from '@/lib/tables';
import { SCHEMA } from '@/lib/schema.mjs';

types.setTypeParser(1082, v => v); // DATE columns stay 'YYYY-MM-DD' strings
types.setTypeParser(1700, v => v == null ? null : Number(v)); // NUMERIC as JS numbers

// Hosted databases (e.g. Supabase, Neon) need SSL; a local server does not.
// sslmode/channel_binding are dropped from the URL because `ssl` below sets SSL.
const url = process.env.DATABASE_URL || '';
const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);
function connectionString(){
  if (!url) return url;
  const u = new URL(url);
  u.searchParams.delete('sslmode');
  u.searchParams.delete('channel_binding');
  return u.toString();
}
const pool = globalThis.__salaPool ??= new Pool({
  connectionString: connectionString(),
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

let ready = null;
function ensureTables(){
  ready ??= (async () => {
    await pool.query(SCHEMA);
    await inTransaction(migrateLegacy);
  })().catch(e => { ready = null; throw e; });
  return ready;
}

async function inTransaction(fn){
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch(e){ await client.query('ROLLBACK').catch(() => {}); throw e; }
  finally { client.release(); }
}

// Older versions kept everything in one JSONB row (school_data). Copy it into the
// tables once, then rename the old table to school_data_legacy as a backup.
async function migrateLegacy(client){
  await client.query('SELECT pg_advisory_xact_lock(4202)');
  const { rows:[r] } = await client.query(`SELECT to_regclass('public.school_data') AS t, to_regclass('public.school_data_legacy') AS l`);
  if (!r.t) return;
  const { rows } = await client.query('SELECT data FROM school_data WHERE id = 1');
  if (rows[0]?.data) await importDocument(rows[0].data, client);
  await client.query(`ALTER TABLE school_data RENAME TO ${r.l ? 'school_data_legacy_' + Date.now() : 'school_data_legacy'}`);
}

// ---------- school records (everything except students) ----------

const q = s => `"${s}"`;
const upsertSql = {}, deleteSql = {}, selectSql = {};
for (const [t, d] of Object.entries(TABLES)){
  const fields = Object.keys(d.cols), col = f => q(d.cols[f][0]);
  const keys = d.key.map(col), rest = fields.filter(f => !d.key.includes(f)).map(col);
  upsertSql[t] = `INSERT INTO ${t} (${fields.map(col)}) VALUES (${fields.map((_, i) => '$' + (i + 1))})
    ON CONFLICT (${keys}) DO ${rest.length ? 'UPDATE SET ' + rest.map(c => `${c} = EXCLUDED.${c}`) : 'NOTHING'}`;
  deleteSql[t] = `DELETE FROM ${t} WHERE ${keys.map((c, i) => `${c} = $${i + 1}`).join(' AND ')}`;
  selectSql[t] = `SELECT ${fields.map(f => `${col(f)} AS ${q(f)}`)} FROM ${t} ORDER BY ${keys}`;
}

// Applies { table: { upsert:[rows], delete:[keyRows] } } inside the caller's transaction.
async function writeRows(client, changes){
  for (const [t, ch] of Object.entries(changes)){
    const d = TABLES[t];
    if (!d) throw new ValidationError('Unknown table: ' + t);
    for (const k of ch.delete || []) await client.query(deleteSql[t], d.key.map(f => k?.[f]));
    for (const o of ch.upsert || []){
      const r = cleanRow(t, o);
      if (d.key.some(f => r[f] == null || r[f] === '')) throw new ValidationError(`A ${t} row is missing its ${d.key.join('/')}`);
      await client.query(upsertSql[t], Object.values(r));
    }
  }
}

// The whole document (without students), or null when the database is empty.
export async function loadData(){
  await ensureTables();
  const rows = {};
  await Promise.all(Object.keys(TABLES).map(async t => { rows[t] = (await pool.query(selectSql[t])).rows; }));
  return rows.settings.length ? assemble(rows) : null;
}

// Saves the rows the browser changed, all or nothing.
export async function saveChanges(changes){
  await ensureTables();
  if (!changes || typeof changes !== 'object') throw new ValidationError('Invalid changes');
  await inTransaction(c => writeRows(c, changes));
}

// Writes a whole document (first run, or an older format), students included.
export async function importDocument(doc, client){
  if (!client){ await ensureTables(); return inTransaction(c => importDocument(doc, c)); }
  if (Array.isArray(doc.students) && doc.students.length) await importStudents(doc.students, client);
  const all = flatten(doc);
  await writeRows(client, Object.fromEntries(Object.entries(all).map(([t, m]) => [t, { upsert:Object.values(m) }])));
}

// ---------- students ----------

const COLS = `id, code, name, gender, dob, class_id AS "classId", status, guardian, phone, address`;

export class ValidationError extends Error {}

// Checks and cleans a student payload. Returns the fields to store.
async function clean(o){
  const s = {
    name: String(o.name ?? '').trim(),
    gender: o.gender === 'Male' ? 'Male' : 'Female',
    dob: o.dob ? String(o.dob) : null,
    classId: o.classId ? String(o.classId) : null,
    status: o.status || 'Active',
    guardian: String(o.guardian ?? '').trim(),
    phone: String(o.phone ?? '').trim(),
    address: String(o.address ?? '').trim(),
  };
  if (!s.name) throw new ValidationError('Full name is required');
  if (!s.guardian) throw new ValidationError('Parent or guardian is required');
  if (!s.phone) throw new ValidationError('Guardian phone is required');
  if (!STATUSES.includes(s.status)) throw new ValidationError('Unknown status: ' + s.status);
  if (s.dob && !/^\d{4}-\d{2}-\d{2}$/.test(s.dob)) throw new ValidationError('Date of birth must be YYYY-MM-DD');
  if (s.classId){
    const { rowCount } = await pool.query('SELECT 1 FROM classes WHERE id = $1', [s.classId]);
    if (!rowCount) throw new ValidationError('That class does not exist');
  }
  return s;
}

export async function listStudents(){
  await ensureTables();
  const { rows } = await pool.query(`SELECT ${COLS} FROM students ORDER BY code`);
  return rows;
}

export async function getStudent(id){
  await ensureTables();
  const { rows } = await pool.query(`SELECT ${COLS} FROM students WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function createStudent(o){
  await ensureTables();
  const s = await clean(o);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(4201)'); // serialise code numbering
    const { rows:[m] } = await client.query(
      `SELECT COALESCE(MAX(NULLIF(regexp_replace(code, '\\D', '', 'g'), '')::int), 0) + 1 AS n FROM students`);
    const id = 's' + randomBytes(4).toString('hex');
    const code = 'STU-' + String(m.n).padStart(3, '0');
    const { rows } = await client.query(
      `INSERT INTO students (id, code, name, gender, dob, class_id, status, guardian, phone, address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING ${COLS}`,
      [id, code, s.name, s.gender, s.dob, s.classId, s.status, s.guardian, s.phone, s.address]);
    await client.query('COMMIT');
    return rows[0];
  } catch(e){ await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}

export async function updateStudent(id, o){
  await ensureTables();
  const s = await clean(o);
  const { rows } = await pool.query(
    `UPDATE students SET name=$2, gender=$3, dob=$4, class_id=$5, status=$6, guardian=$7, phone=$8, address=$9, updated_at=now()
     WHERE id = $1 RETURNING ${COLS}`,
    [id, s.name, s.gender, s.dob, s.classId, s.status, s.guardian, s.phone, s.address]);
  return rows[0] ?? null;
}

export async function deleteStudent(id){
  await ensureTables();
  const { rowCount } = await pool.query('DELETE FROM students WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function deleteAllStudents(){
  await ensureTables();
  await pool.query('DELETE FROM students');
}

// Copies students from older storage (browser or JSON document), keeping their ids and codes.
export async function importStudents(list, client){
  if (!client) await ensureTables();
  const db = client || pool;
  let n = 0;
  for (const o of list){
    if (!o?.id || !o?.code || !o?.name) continue;
    const r = await db.query(
      `INSERT INTO students (id, code, name, gender, dob, class_id, status, guardian, phone, address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING`,
      [o.id, o.code, o.name, o.gender === 'Male' ? 'Male' : 'Female', o.dob || null, o.classId || null,
       STATUSES.includes(o.status) ? o.status : 'Active', o.guardian || '', o.phone || '', o.address || '']);
    n += r.rowCount;
  }
  return n;
}
