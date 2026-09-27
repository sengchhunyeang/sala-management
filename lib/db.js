// Server-only PostgreSQL access.
// - students: one row per student (full CRUD via /api/students).
// - school_data: everything else, as one JSONB document (row id 1).
import { Pool, types } from 'pg';
import { randomBytes } from 'crypto';
import { STATUSES } from '@/lib/school';

types.setTypeParser(1082, v => v); // DATE columns stay 'YYYY-MM-DD' strings

// Hosted databases (e.g. Supabase) need SSL; a local server does not.
const url = process.env.DATABASE_URL || '';
const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);
const pool = globalThis.__salaPool ??= new Pool({
  connectionString: url.replace(/[?&]sslmode=[^&]*/, ''),
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS school_data (
  id int PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS students (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  gender text NOT NULL DEFAULT 'Female',
  dob date,
  class_id text,
  status text NOT NULL DEFAULT 'Active',
  guardian text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`;

let ready = null;
function ensureTables(){
  ready ??= pool.query(SCHEMA).catch(e => { ready = null; throw e; });
  return ready;
}

// ---------- school_data (everything except students) ----------

export async function loadData(){
  await ensureTables();
  const { rows } = await pool.query('SELECT data FROM school_data WHERE id = 1');
  const data = rows[0]?.data ?? null;
  if (data?.students){ // older documents kept students inline: move them to the table
    if (data.students.length) await importStudents(data.students);
    await saveData(data);
    delete data.students;
  }
  return data;
}

export async function saveData(data){
  await ensureTables();
  const { students, ...rest } = data; // students live in their own table
  await pool.query(
    `INSERT INTO school_data (id, data, updated_at) VALUES (1, $1, now())
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [JSON.stringify(rest)]);
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
    const data = await loadData();
    if (!data?.classes?.some(c => c.id === s.classId)) throw new ValidationError('That class does not exist');
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
export async function importStudents(list){
  await ensureTables();
  let n = 0;
  for (const o of list){
    if (!o?.id || !o?.code || !o?.name) continue;
    const r = await pool.query(
      `INSERT INTO students (id, code, name, gender, dob, class_id, status, guardian, phone, address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING`,
      [o.id, o.code, o.name, o.gender === 'Male' ? 'Male' : 'Female', o.dob || null, o.classId || null,
       STATUSES.includes(o.status) ? o.status : 'Active', o.guardian || '', o.phone || '', o.address || '']);
    n += r.rowCount;
  }
  return n;
}
