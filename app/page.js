'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSchool } from '@/components/SchoolProvider';
import { Bars } from '@/components/ui';
import { attDates, feeStatus, fmtDate, money, overdueLoans, pct, rateFor, today, unmarkedToday } from '@/lib/school';

export default function Dashboard(){
  const { S, setUi } = useSchool();
  const router = useRouter();
  const TODAY = today();
  const dates = attDates(S).slice(-10);
  const active = S.students.filter(x => x.status==='Active');
  const girls = active.filter(x => x.gender==='Female').length;
  const due = S.fees.reduce((a,f) => a+f.amount, 0), paid = S.fees.reduce((a,f) => a+Math.min(f.paid,f.amount), 0);
  const overdue = S.fees.filter(f => feeStatus(f)==='Overdue');
  const unmarked = unmarkedToday(S);
  const todayRate = rateFor(S, d => d===TODAY);
  const lastRate = dates.length ? rateFor(S, d => d===dates.at(-1)) : null;
  const h = new Date().getHours(), greet = h<12?'Good morning':h<17?'Good afternoon':'Good evening';
  const up = S.events.filter(e => e.date>=TODAY).sort((a,b) => a.date.localeCompare(b.date)).slice(0,5);
  const notices = [...S.notices].sort((a,b) => (b.pinned-a.pinned) || b.date.localeCompare(a.date)).slice(0,3);
  const loans = overdueLoans(S);
  const nextExam = S.exams.filter(e => e.date>=TODAY).sort((a,b) => a.date.localeCompare(b.date))[0];
  const todos = [];
  if (unmarked.length) todos.push(<li key="att"><span className="dot r"></span><div><b>{unmarked.length} of {S.classes.length} classes</b> have no attendance for today.<br/><Link className="link" href="/attendance">Take attendance</Link></div></li>);
  if (overdue.length) todos.push(<li key="fee"><span className="dot r"></span><div><b>{overdue.length} overdue invoice{overdue.length>1?'s':''}</b> totalling {money(overdue.reduce((a,f)=>a+f.amount-f.paid,0))}.<br/><button className="link" onClick={() => { setUi({feeF:'Overdue', feeQ:''}); router.push('/fees'); }}>Review overdue fees</button></div></li>);
  if (loans.length) todos.push(<li key="lib"><span className="dot g"></span><div><b>{loans.length} library book{loans.length>1?'s':''}</b> past the return date.<br/><Link className="link" href="/library">See loans</Link></div></li>);
  if (nextExam) todos.push(<li key="exam"><span className="dot"></span><div><b>{nextExam.name}</b> starts {fmtDate(nextExam.date)}.<br/><Link className="link" href="/calendar">Open calendar</Link></div></li>);
  if (!todos.length) todos.push(<li key="ok"><span className="dot ok"></span><div>Everything is up to date.</div></li>);

  return <>
    <section className="hello">
      <div style={{position:'relative',zIndex:1}}>
        <p>{new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
        <h2>{greet}. Here&apos;s how {S.settings.school} is doing today.</h2>
      </div>
      <div className="term">{S.settings.term}, {S.settings.year}</div>
    </section>
    <div className="stats">
      <div className="stat"><div className="l">Enrolled students</div><div className="v">{active.length}</div><div className="small muted">{girls} girls and {active.length-girls} boys in {S.classes.length} classes</div></div>
      <div className="stat k"><div className="l">Teaching staff</div><div className="v">{S.teachers.filter(t=>t.status==='Active').length}</div><div className="small muted">1 teacher for every {Math.round(active.length/Math.max(1,S.teachers.length))} students</div></div>
      <div className={`stat ${unmarked.length?'r':''}`}><div className="l">Attendance today</div><div className="v">{pct(todayRate)}</div><div className="small muted">{todayRate==null?`Not taken yet. Last school day was ${pct(lastRate)}.`:`${S.classes.length-unmarked.length} of ${S.classes.length} classes marked`}</div></div>
      <div className="stat g"><div className="l">Fees collected this term</div><div className="v">{money(paid)}</div><div className="small muted">of {money(due)} billed</div><div className="progress"><i style={{width:`${due?paid/due*100:0}%`}}></i></div></div>
    </div>
    <div className="cols wide-left">
      <div className="panel"><div className="panel-head"><h3>Attendance, last {dates.length} school days</h3><span className="small muted">Present or late</span></div>
        {dates.length ? <Bars data={dates.map(d => ({label:new Date(d+'T00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'}), value:Math.round(rateFor(S,x=>x===d)*100)}))} fmt={v=>v+'%'}/> : <p className="empty">No attendance recorded yet.</p>}
      </div>
      <div className="panel"><h3>Needs attention</h3><ul className="todo">{todos}</ul></div>
    </div>
    <div className="cols">
      <div className="panel"><div className="panel-head"><h3>Latest notices</h3><Link className="link" href="/notices">All notices</Link></div>
        <ul className="todo">{notices.length ? notices.map(n => <li key={n.id}><span className={`dot ${n.pinned?'g':''}`}></span><div><b>{n.title}</b><br/><span className="small muted">{fmtDate(n.date)}, for {n.audience.toLowerCase()}</span></div></li>) : <li>No notices.</li>}</ul>
      </div>
      <div className="panel"><div className="panel-head"><h3>Coming up</h3><Link className="link" href="/calendar">Open calendar</Link></div>
        <ul className="todo">{up.length ? up.map(e => <li key={e.id}><span className={`dot ${e.type==='Exam'?'r':e.type==='Holiday'?'g':''}`}></span><div><b>{e.title}</b><br/><span className="small muted">{fmtDate(e.date)}, {e.type.toLowerCase()}</span></div></li>) : <li>No upcoming events.</li>}</ul>
      </div>
    </div>
  </>;
}
