export const iso = d => { const z = new Date(d); z.setMinutes(z.getMinutes() - z.getTimezoneOffset()); return z.toISOString().slice(0,10); };
export const addDays = (d,n) => { const z = new Date(d); z.setDate(z.getDate()+n); return z; };
export const fmtDate = s => s ? new Date(s+'T00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—';
export const money = n => '$' + Number(n||0).toLocaleString('en-US',{maximumFractionDigits:2});
export const latestExam = S => [...S.exams].filter(e => e.date <= today()).sort((a,b) => b.date.localeCompare(a.date))[0] || null;
export const uid = p => p + Math.random().toString(36).slice(2,8);
export const pct = v => v == null ? '—' : Math.round(v*100) + '%';
export const today = () => iso(new Date());
export const DAYS = ['Mon','Tue','Wed','Thu','Fri'];
export const PERIODS = ['7:00–8:00','8:00–9:00','9:15–10:15','10:15–11:15','13:30–14:30','14:30–15:30'];
export const SUBJECTS = ['Khmer','Mathematics','Physics','Chemistry','Biology','English','History','Geography','ICT','Physical education'];
export const STATUSES = ['Active','Inactive','Transferred','Graduated'];

export function emptyData(){
  return {settings:{school:'Sala Secondary School', year:'2026–2027', term:'Term 1', passMark:40}, teachers:[], classes:[], students:[], attendance:{}, exams:[], grades:{}, fees:[], payments:[], books:[], notices:[], events:[], timetable:{}};
}
// Selectors. Each takes the school state S first.
export const byId = (arr,id) => arr.find(x => x.id === id);
export const clsName = (S,id) => byId(S.classes,id)?.name || 'No class';
export const stuName = (S,id) => byId(S.students,id)?.name || 'Removed student';
export const tName = (S,id) => byId(S.teachers,id)?.name || 'Unassigned';
export const classStudents = (S,cid) => S.students.filter(x => x.classId === cid && x.status === 'Active');
export const classOpts = S => S.classes.map(c => [c.id,c.name]);
export function feeStatus(f){ if (f.paid >= f.amount) return 'Paid'; if (f.due < today()) return 'Overdue'; if (f.paid > 0) return 'Partial'; return 'Unpaid'; }
export const letter = x => x>=85?'A':x>=70?'B':x>=55?'C':x>=40?'D':'F';
export function attDates(S){ return [...new Set(Object.keys(S.attendance).map(k => k.split('|')[0]))].sort(); }
export function rateFor(S, filter){ let t=0,p=0;
  for (const [k,rec] of Object.entries(S.attendance)){ const [d,c] = k.split('|');
    for (const [sid,v] of Object.entries(rec)){ if (!filter(d,c,sid)) continue; t++; if (v !== 'A') p++; } }
  return t ? p/t : null; }
export function avgScore(S, filter){ let t=0,n=0; for (const [k,v] of Object.entries(S.grades)){ const [e,sub,sid] = k.split('|'); if (v===''||v==null||!filter(e,sub,sid)) continue; t+=Number(v); n++; } return n ? t/n : null; }
export function overdueLoans(S){ const TODAY = today(), out=[]; S.books.forEach(b => b.loans.forEach(l => { if (l.due < TODAY) out.push({b,l}); })); return out; }
export function unmarkedToday(S){ const wd = new Date().getDay(); if (wd===0||wd===6) return []; const TODAY = today(); return S.classes.filter(c => !S.attendance[TODAY+'|'+c.id]); }

export const ICONS = {
  dashboard:'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z',
  students:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  teachers:'M22 10 12 5 2 10l10 5 10-5zM6 12v5c3 2 9 2 12 0v-5',
  classes:'M3 21V8l9-5 9 5v13M9 21v-6h6v6',
  attendance:'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9',
  gradebook:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5M8 7h8M8 11h6',
  timetable:'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18',
  fees:'M3 6h18v12H3zM3 10h18M7 15h3',
  library:'M4 4h4v16H4zM10 4h4v16h-4zM15.5 5.5l3.9-1 3.6 14.6-3.9 1z',
  notices:'M3 10v4l12 5V5zM15 8a4 4 0 0 1 0 8M6 15v4h3v-3',
  calendar:'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4',
  reports:'M4 20V10M10 20V4M16 20v-7M21 20H3',
  settings:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4'
};
export const PAGES = [
  ['dashboard','Dashboard',''],
  ['students','Students','People'],['teachers','Teachers','People'],['classes','Classes','People'],
  ['attendance','Attendance','Academics'],['gradebook','Exams & grades','Academics'],['timetable','Timetable','Academics'],
  ['fees','Fees & payments','Operations'],['library','Library','Operations'],['notices','Notices','Operations'],['calendar','Calendar','Operations'],
  ['reports','Reports','Insights'],['settings','Settings','Insights']
];
export const ROLES = {
  Admin: PAGES.map(p => p[0]),
  Teacher: ['dashboard','students','classes','attendance','gradebook','timetable','library','notices','calendar'],
  Accountant: ['dashboard','students','fees','reports','notices','calendar']
};
export const href = id => id === 'dashboard' ? '/' : '/' + id;
export const pageFromPath = path => (path || '/').split('/')[1] || 'dashboard';
