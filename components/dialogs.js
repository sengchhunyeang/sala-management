'use client';
import { useSchool } from './SchoolProvider';
import { Badge, ConfirmBody, FormBody, LetterBadge } from './ui';
import { api } from '@/lib/api';
import { SUBJECTS, STATUSES, addDays, avgScore, byId, classOpts, classStudents, clsName, fmtDate, iso, money, pct, rateFor, stuName, tName, today, uid } from '@/lib/school';

function StudentProfile({ id }){
  const { S, role, closeModal } = useSchool();
  const d = useDialogs();
  const x = byId(S.students,id); if (!x) return <p className="muted">This student has been removed.</p>;
  const bal = S.fees.filter(f => f.studentId===id).reduce((a,f)=>a+Math.max(0,f.amount-f.paid),0);
  const att = {P:0,L:0,A:0}; Object.values(S.attendance).forEach(r => { if (r[id]) att[r[id]]++; });
  const exRows = S.exams.map(e => ({e, a:avgScore(S,(ee,s,sid)=>ee===e.id&&sid===id)})).filter(r => r.a!=null);
  return <>
    <div className="kv">
      <div><span>Student ID</span>{x.code}</div><div><span>Class</span>{clsName(S,x.classId)}</div>
      <div><span>Gender</span>{x.gender}</div><div><span>Date of birth</span>{fmtDate(x.dob)}</div>
      <div><span>Guardian</span>{x.guardian}</div><div><span>Phone</span>{x.phone}</div>
      <div><span>Address</span>{x.address||'—'}</div><div><span>Status</span><Badge t={x.status}/></div>
    </div>
    <div className="panel" style={{marginBottom:12}}><div className="tally">
      <span><b>{pct(rateFor(S,(d,c,s)=>s===id))}</b>attendance</span><span><b>{att.L}</b>late</span><span><b>{att.A}</b>absent</span>
      <span><b style={{color:bal?'var(--bad)':'var(--ok)'}}>{money(bal)}</b>fees owed</span>
    </div></div>
    <h3 style={{fontSize:16,margin:'12px 0 8px'}}>Exam results</h3>
    {exRows.length ? <table><thead><tr><th>Exam</th><th className="num">Average</th><th>Grade</th><th></th></tr></thead><tbody>
      {exRows.map(r => <tr key={r.e.id}><td>{r.e.name}</td><td className="num">{r.a.toFixed(1)}</td><td><LetterBadge x={r.a}/></td>
        <td><button className="icon-btn" onClick={() => d.reportCard(id, r.e.id)}>Report card</button></td></tr>)}
    </tbody></table> : <p className="muted">No results yet.</p>}
    <div className="factions" style={{marginTop:16}}>
      <button className="btn ghost" onClick={closeModal}>Close</button>
      {role!=='Accountant' && <button className="btn primary" onClick={() => d.stuForm(id)}>Edit student</button>}
    </div>
  </>;
}

function ReportCard({ sid, exId }){
  const { S, closeModal } = useSchool();
  const x = byId(S.students,sid), e = byId(S.exams,exId); if (!x||!e) return null;
  const rows = SUBJECTS.map(s => [s, S.grades[`${exId}|${s}|${sid}`]]).filter(r => r[1]!==''&&r[1]!=null);
  const avg = rows.length ? rows.reduce((a,r)=>a+Number(r[1]),0)/rows.length : null;
  const mates = classStudents(S,x.classId).map(m => ({id:m.id, a:avgScore(S,(ee,s,i)=>ee===exId&&i===m.id)})).filter(m=>m.a!=null).sort((a,b)=>b.a-a.a);
  const rank = mates.findIndex(m => m.id===sid)+1;
  const remark = avg==null?'':avg>=85?'Outstanding work. Keep it up.':avg>=70?'Strong results with room to stretch further.':avg>=55?'Steady progress. Focus on the weaker subjects.':avg>=40?'Passing, but needs more consistent effort.':'Below the pass mark. Please arrange a meeting with the homeroom teacher.';
  return <>
    <div className="kv">
      <div><span>Student</span><b>{x.name}</b></div><div><span>Class</span>{clsName(S,x.classId)}</div>
      <div><span>Exam</span>{e.name}</div><div><span>Homeroom teacher</span>{tName(S,byId(S.classes,x.classId)?.teacherId)}</div>
    </div>
    {rows.length ? <>
      <table><thead><tr><th>Subject</th><th className="num">Score</th><th>Grade</th></tr></thead><tbody>
        {rows.map(r => <tr key={r[0]}><td>{r[0]}</td><td className="num">{r[1]}</td><td><LetterBadge x={Number(r[1])}/></td></tr>)}
        <tr><td><b>Average</b></td><td className="num"><b>{avg.toFixed(1)}</b></td><td><LetterBadge x={avg}/></td></tr>
      </tbody></table>
      <div className="panel" style={{marginTop:12}}>
        <div className="tally"><span><b>{rank||'—'}</b>of {mates.length} in class</span><span><b>{pct(rateFor(S,(d,c,s)=>s===sid))}</b>attendance</span></div>
        <p style={{margin:'10px 0 0'}}>{remark}</p>
      </div>
    </> : <p className="muted">No scores recorded for this exam.</p>}
    <div className="factions" style={{marginTop:14}}><button className="btn primary" onClick={closeModal}>Done</button></div>
  </>;
}

function Receipt({ id }){
  const { S, closeModal } = useSchool();
  const p = byId(S.payments,id), f = p && byId(S.fees,p.feeId); if (!f) return null;
  return <>
    <div className="kv">
      <div><span>School</span><b>{S.settings.school}</b></div><div><span>Receipt no.</span>{p.id.toUpperCase()}</div>
      <div><span>Student</span>{stuName(S,f.studentId)}</div><div><span>Class</span>{clsName(S,byId(S.students,f.studentId)?.classId)}</div>
      <div><span>For</span>{f.item}, {f.term}</div><div><span>Date</span>{fmtDate(p.date)}</div>
      <div><span>Method</span>{p.method}</div><div><span>Amount paid</span><b>{money(p.amount)}</b></div>
      <div><span>Balance remaining</span>{money(Math.max(0,f.amount-f.paid))}</div>
    </div>
    <div className="factions"><button className="btn primary" onClick={closeModal}>Done</button></div>
  </>;
}

export function useDialogs(){
  const { S, openModal, toast, setUi, update } = useSchool();
  const form = (title, fields, values, onSave, submit) => openModal(title, <FormBody key={Math.random()} fields={fields} values={values} onSave={onSave} submit={submit}/>);
  const confirm = (title, text, label, doneMsg, fn) => openModal(title, <ConfirmBody text={text} label={label} doneMsg={doneMsg} fn={fn}/>);
  // Like confirm, but action() is async and resolves to an error string or nothing.
  const confirmAsync = (title, text, label, doneMsg, action) => openModal(title, <ConfirmBody text={text} label={label} doneMsg={doneMsg} action={action}/>);

  return {
    form, confirm, confirmAsync,
    stuProfile: id => openModal(stuName(S,id), <StudentProfile id={id}/>),
    reportCard: (sid, exId) => openModal('Report card', <ReportCard sid={sid} exId={exId}/>),
    receipt: id => openModal('Payment receipt', <Receipt id={id}/>),
    stuForm(id){
      if (!S.classes.length){ toast('Add a class before enrolling students'); return; }
      const x = id && byId(S.students,id);
      const fields = [
        {k:'name',label:'Full name',req:true,wide:true},
        {k:'gender',label:'Gender',type:'select',opts:['Female','Male']},
        {k:'dob',label:'Date of birth',type:'date'},
        {k:'classId',label:'Class',type:'select',opts:classOpts(S)},
        {k:'status',label:'Status',type:'select',opts:STATUSES,def:'Active'},
        {k:'guardian',label:'Parent or guardian',req:true},
        {k:'phone',label:'Guardian phone',type:'tel',req:true},
        {k:'address',label:'Address',wide:true}
      ];
      // Saved to the students table first; the local copy is updated from the server's reply.
      const action = async o => {
        try {
          if (x){
            const { student } = await api('PUT', `/api/students/${x.id}`, o);
            update(D => { Object.assign(byId(D.students,x.id), student); });
            toast('Student updated');
          } else {
            const { student } = await api('POST', '/api/students', o);
            update(D => { D.students.push(student);
              D.fees.push({id:uid('f'), studentId:student.id, term:D.settings.term, item:'Tuition', amount:180, paid:0, due:iso(addDays(new Date(),14))}); });
            toast('Student enrolled and tuition invoice created');
          }
        } catch(e){ return e.message; }
      };
      openModal(x ? 'Edit student' : 'Enrol a new student',
        <FormBody key={Math.random()} fields={fields} values={x} action={action} submit={x ? 'Save changes' : 'Enrol student'}/>);
    },
    // Deletes the student row, then their attendance, grades, invoices and loans.
    async removeStudent(id){
      try { await api('DELETE', `/api/students/${id}`); }
      catch(e){ if (e.message !== 'Student not found') return e.message; }
      update(D => {
        D.students = D.students.filter(x=>x.id!==id);
        const fids = D.fees.filter(f=>f.studentId===id).map(f=>f.id);
        D.fees = D.fees.filter(f=>f.studentId!==id);
        D.payments = D.payments.filter(p=>!fids.includes(p.feeId));
        Object.values(D.attendance).forEach(r => delete r[id]);
        Object.keys(D.grades).forEach(k => { if (k.endsWith('|'+id)) delete D.grades[k]; });
        D.books.forEach(b => b.loans = b.loans.filter(l=>l.studentId!==id));
      });
    },
    teaForm(id){
      const t = id && byId(S.teachers,id);
      form(t?'Edit teacher':'Add teacher', [
        {k:'name',label:'Full name',req:true,wide:true},
        {k:'subject',label:'Main subject',type:'select',opts:SUBJECTS},
        {k:'status',label:'Status',type:'select',opts:['Active','Inactive'],def:'Active'},
        {k:'phone',label:'Phone',type:'tel',req:true},
        {k:'email',label:'Email',type:'email'},
        {k:'joined',label:'Joined on',type:'date',def:today()}
      ], t, (o, D) => { if (t) Object.assign(byId(D.teachers,t.id),o); else D.teachers.push({id:uid('t'),...o}); toast(t?'Teacher updated':'Teacher added'); }, t?'Save changes':'Add teacher');
    },
    clsForm(id){
      const c = id && byId(S.classes,id);
      form(c?'Edit class':'Add class', [
        {k:'name',label:'Class name',req:true,attr:{placeholder:'Grade 10C'}},
        {k:'room',label:'Room',req:true},
        {k:'teacherId',label:'Homeroom teacher',type:'select',opts:[['','Unassigned'],...S.teachers.map(t=>[t.id,t.name])]},
        {k:'capacity',label:'Capacity',type:'number',def:40,attr:{min:1}}
      ], c, (o, D) => { if (c) Object.assign(byId(D.classes,c.id),o); else D.classes.push({id:uid('c'), grade:Number((o.name.match(/\d+/)||[0])[0]), ...o}); toast(c?'Class updated':'Class added'); }, c?'Save changes':'Add class');
    },
    bookForm(id){
      const b = id && byId(S.books,id);
      form(b?'Edit book':'Add book', [
        {k:'title',label:'Title',req:true,wide:true},{k:'author',label:'Author',req:true},
        {k:'category',label:'Category',type:'select',opts:['Textbook','Reference','Science','History','ICT','Fiction','Other']},
        {k:'copies',label:'Copies',type:'number',def:1,attr:{min:1}}
      ], b, (o, D) => {
        if (b){ const db = byId(D.books,b.id); if (o.copies < db.loans.length) return `${db.loans.length} copies are on loan, so copies can't be lower than that`; Object.assign(db,o); }
        else D.books.push({id:uid('b'),loans:[],...o});
        toast(b?'Book updated':'Book added');
      }, b?'Save changes':'Add book');
    },
    examForm(){
      form('Schedule exam', [
        {k:'name',label:'Exam name',req:true,wide:true},{k:'term',label:'Term',type:'select',opts:['Term 1','Term 2'],def:S.settings.term},{k:'date',label:'Start date',type:'date',req:true}
      ], null, (o, D) => { const id = uid('e'); D.exams.push({id,...o}); D.events.push({id:uid('v'), title:o.name+' begins', date:o.date, type:'Exam'}); setUi({gExam:id}); toast('Exam scheduled and added to the calendar'); }, 'Schedule exam');
    }
  };
}
