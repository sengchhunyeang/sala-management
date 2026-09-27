'use client';
import { useRouter } from 'next/navigation';
import { useSchool } from '@/components/SchoolProvider';
import { useDialogs } from '@/components/dialogs';
import { avgScore, byId, classStudents, clsName, latestExam, pct, rateFor, tName } from '@/lib/school';

export default function Classes(){
  const { S, role, setUi, toast } = useSchool();
  const d = useDialogs();
  const router = useRouter();
  const isAdmin = role === 'Admin';
  const exam = latestExam(S);
  const remove = id => {
    if (S.students.some(s=>s.classId===id)) { toast('Move or remove its students before removing this class'); return; }
    d.confirm('Remove class?', `${clsName(S,id)} will be removed along with its timetable.`, 'Remove class', 'Class removed', D => { D.classes = D.classes.filter(c=>c.id!==id); delete D.timetable[id]; });
  };
  return <>
    <div className="bar"><p className="grow muted" style={{margin:0}}>{S.classes.length} classes, {S.students.filter(s=>s.status==='Active').length} active students</p>{isAdmin && <button className="btn primary" onClick={() => d.clsForm()}>Add class</button>}</div>
    <div className="cards">{S.classes.length ? S.classes.map(c => { const n = classStudents(S,c.id).length, avg = exam && avgScore(S,(e,sub,sid)=>e===exam.id && byId(S.students,sid)?.classId===c.id); return <div className="ccard" key={c.id}>
      <h3>{c.name}</h3>
      <div className="small muted">{c.room}, homeroom teacher {tName(S,c.teacherId)}</div>
      <div className="small" style={{marginTop:6}}>{n} of {c.capacity} seats filled</div>
      <div className="progress"><i style={{width:`${Math.min(100,n/c.capacity*100)}%`,background:'var(--navy-ink)'}}></i></div>
      <div className="small" style={{marginTop:6}}>Attendance {pct(rateFor(S,(dd,cc)=>cc===c.id))}, {exam ? exam.name.toLowerCase() : 'exam'} average {avg==null?'—':avg.toFixed(1)}</div>
      <div className="actions"><button className="btn sm" onClick={() => { setUi({cls:c.id, st:'Active', q:''}); router.push('/students'); }}>View students</button>
        {isAdmin && <><button className="icon-btn" onClick={() => d.clsForm(c.id)}>Edit</button><button className="icon-btn del" onClick={() => remove(c.id)}>Remove</button></>}</div>
    </div>; }) : <div className="panel empty">No classes yet.</div>}</div>
  </>;
}
