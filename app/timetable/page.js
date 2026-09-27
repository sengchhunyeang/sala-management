'use client';
import { useSchool } from '@/components/SchoolProvider';
import { Options } from '@/components/ui';
import { DAYS, PERIODS, SUBJECTS, byId, classOpts } from '@/lib/school';

const blank = () => Object.fromEntries(DAYS.map(d => [d, PERIODS.map(() => '')]));

export default function Timetable(){
  const { S, ui, setUi, update, toast } = useSchool();
  const cls = byId(S.classes, ui.ttClass) ? ui.ttClass : S.classes[0]?.id || '';
  if (!cls) return <div className="panel empty">Add a class first.</div>;
  const t = S.timetable[cls] || blank();
  const teacherFor = sub => S.teachers.find(x => x.subject===sub)?.name || '';
  const counts = {}; DAYS.forEach(d => t[d].forEach(s => { if (s) counts[s] = (counts[s]||0)+1; }));
  const set = (d, i, v) => { update(D => { (D.timetable[cls] ||= blank())[d][i] = v; }); toast('Timetable updated'); };
  return <>
    <div className="bar"><label className="field">Class<select value={cls} onChange={e => setUi({ttClass:e.target.value})}><Options list={classOpts(S)}/></select></label>
      <p className="grow muted small" style={{margin:0}}>Pick a subject in any slot to change it. Lunch break runs 11:15–13:30.</p></div>
    <div className="tablewrap"><div className="scroll"><table className="tt">
      <thead><tr><th className="period">Period</th>{DAYS.map(d => <th key={d}>{d}</th>)}</tr></thead>
      <tbody>{PERIODS.map((p,i) => <tr key={p}><th className="period">{p}</th>{DAYS.map(d => <td key={d}>
        <select value={t[d][i]} onChange={e => set(d, i, e.target.value)} aria-label={`${d} ${p}`}><option value="">Free period</option><Options list={SUBJECTS}/></select>
        <div className="teacher">{teacherFor(t[d][i])}</div>
      </td>)}</tr>)}</tbody>
    </table></div></div>
    <div className="panel" style={{marginTop:14}}><h3>Periods per week</h3><div className="tally">
      {Object.keys(counts).length ? Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([s,n]) => <span key={s}><b>{n}</b>{s}</span>) : <span className="muted">No subjects scheduled.</span>}
    </div></div>
  </>;
}
