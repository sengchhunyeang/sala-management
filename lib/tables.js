// How the in-memory school document maps to database tables (students excluded:
// they have their own API). Shared by the browser (to work out which rows changed)
// and the server (to validate and write them, and to rebuild the document).
import { DAYS, PERIODS } from '@/lib/school';

// Each table: key fields, then field -> [column, type]. Types: text, int, num, date, bool.
export const TABLES = {
  settings:   { key:['id'], cols:{ id:['id','int'], school:['school','text'], year:['year','text'], term:['term','text'], passMark:['pass_mark','int'] } },
  teachers:   { key:['id'], cols:{ id:['id','text'], name:['name','text'], subject:['subject','text'], status:['status','text'], phone:['phone','text'], email:['email','text'], joined:['joined_on','date'] } },
  classes:    { key:['id'], cols:{ id:['id','text'], name:['name','text'], room:['room','text'], grade:['grade','int'], capacity:['capacity','int'], teacherId:['teacher_id','text'] } },
  exams:      { key:['id'], cols:{ id:['id','text'], name:['name','text'], term:['term','text'], date:['start_date','date'] } },
  attendance: { key:['date','classId','studentId'], cols:{ date:['att_date','date'], classId:['class_id','text'], studentId:['student_id','text'], mark:['mark','text'] } },
  grades:     { key:['examId','subject','studentId'], cols:{ examId:['exam_id','text'], subject:['subject','text'], studentId:['student_id','text'], score:['score','num'] } },
  fees:       { key:['id'], cols:{ id:['id','text'], studentId:['student_id','text'], term:['term','text'], item:['item','text'], amount:['amount','num'], paid:['paid','num'], due:['due_on','date'] } },
  payments:   { key:['id'], cols:{ id:['id','text'], feeId:['fee_id','text'], amount:['amount','num'], method:['method','text'], date:['paid_on','date'] } },
  books:      { key:['id'], cols:{ id:['id','text'], title:['title','text'], author:['author','text'], category:['category','text'], copies:['copies','int'] } },
  loans:      { key:['id'], cols:{ id:['id','text'], bookId:['book_id','text'], studentId:['student_id','text'], out:['lent_on','date'], due:['due_on','date'] } },
  notices:    { key:['id'], cols:{ id:['id','text'], title:['title','text'], audience:['audience','text'], pinned:['pinned','bool'], body:['body','text'], date:['posted_on','date'] } },
  events:     { key:['id'], cols:{ id:['id','text'], title:['title','text'], date:['event_date','date'], type:['type','text'] } },
  timetable:  { key:['classId','day','period'], cols:{ classId:['class_id','text'], day:['day','text'], period:['period','int'], subject:['subject','text'] } },
};

// Normalises one field to what the column stores ('' dates become null, etc).
function norm(type, v){
  if (type === 'text') return v == null ? '' : String(v);
  if (type === 'date') return v ? String(v).slice(0,10) : null;
  if (type === 'bool') return !!v;
  if (v === '' || v == null) return null;
  const n = Number(v); return Number.isFinite(n) ? (type === 'int' ? Math.round(n) : n) : null;
}

// Picks and normalises the known fields of a row, in a fixed order.
export function cleanRow(table, o){
  const out = {};
  for (const [f,[,type]] of Object.entries(TABLES[table].cols)) out[f] = norm(type, o?.[f]);
  return out;
}
export const rowKey = (table, r) => TABLES[table].key.map(k => r[k]).join('|');

// Document -> { table: { key: row } }.
export function flatten(S){
  const out = Object.fromEntries(Object.keys(TABLES).map(t => [t, {}]));
  const add = (t, o) => { const r = cleanRow(t, o); out[t][rowKey(t, r)] = r; };
  if (S.settings) add('settings', { id:1, ...S.settings });
  for (const t of ['teachers','classes','exams','fees','payments','notices','events']) (S[t] || []).forEach(o => add(t, o));
  (S.books || []).forEach(b => { add('books', b); (b.loans || []).forEach(l => add('loans', { ...l, bookId:b.id })); });
  for (const [k, rec] of Object.entries(S.attendance || {})){
    const [date, classId] = k.split('|');
    for (const [studentId, mark] of Object.entries(rec || {})) if (mark) add('attendance', { date, classId, studentId, mark });
  }
  for (const [k, score] of Object.entries(S.grades || {})){
    if (score === '' || score == null) continue;
    const [examId, subject, studentId] = k.split('|'); add('grades', { examId, subject, studentId, score });
  }
  for (const [classId, days] of Object.entries(S.timetable || {}))
    for (const [day, list] of Object.entries(days || {})) (list || []).forEach((subject, period) => { if (subject) add('timetable', { classId, day, period, subject }); });
  return out;
}

// Rows changed between two flatten() results: { table: { upsert:[rows], delete:[keyRows] } }.
export function diffRows(prev, next){
  const out = {};
  for (const t of Object.keys(TABLES)){
    const a = prev[t] || {}, b = next[t] || {}, upsert = [], del = [];
    for (const k in b) if (!(k in a) || JSON.stringify(a[k]) !== JSON.stringify(b[k])) upsert.push(b[k]);
    for (const k in a) if (!(k in b)) del.push(Object.fromEntries(TABLES[t].key.map(f => [f, a[k][f]])));
    if (upsert.length || del.length) out[t] = { upsert, delete: del };
  }
  return out;
}

// { table: [rows] } (as read from the database) -> document without students.
export function assemble(rows){
  const date = v => v ?? '';
  const S = { settings:null, teachers:[], classes:[], attendance:{}, exams:[], grades:{}, fees:[], payments:[], books:[], notices:[], events:[], timetable:{} };
  const s = rows.settings?.[0];
  if (s){ const { id, ...rest } = s; S.settings = rest; }
  S.teachers = (rows.teachers || []).map(r => ({ ...r, joined:date(r.joined) }));
  S.classes = rows.classes || [];
  S.exams = (rows.exams || []).map(r => ({ ...r, date:date(r.date) }));
  S.fees = (rows.fees || []).map(r => ({ ...r, due:date(r.due) }));
  S.payments = (rows.payments || []).map(r => ({ ...r, date:date(r.date) }));
  S.notices = (rows.notices || []).map(r => ({ ...r, date:date(r.date) }));
  S.events = (rows.events || []).map(r => ({ ...r, date:date(r.date) }));
  const books = new Map((rows.books || []).map(b => [b.id, { ...b, loans:[] }]));
  (rows.loans || []).forEach(({ bookId, ...l }) => books.get(bookId)?.loans.push({ ...l, out:date(l.out), due:date(l.due) }));
  S.books = [...books.values()];
  (rows.attendance || []).forEach(r => { (S.attendance[`${r.date}|${r.classId}`] ||= {})[r.studentId] = r.mark; });
  (rows.grades || []).forEach(r => { S.grades[`${r.examId}|${r.subject}|${r.studentId}`] = r.score; });
  (rows.timetable || []).forEach(r => {
    const t = S.timetable[r.classId] ||= Object.fromEntries(DAYS.map(d => [d, PERIODS.map(() => '')]));
    if (t[r.day] && r.period < PERIODS.length) t[r.day][r.period] = r.subject;
  });
  return S;
}
