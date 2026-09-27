'use client';
import { useSchool } from '@/components/SchoolProvider';
import { DataTable, Options } from '@/components/ui';
import { byId, classOpts, classStudents, pct, rateFor, today } from '@/lib/school';

const NAMES = {P:'Present',L:'Late',A:'Absent'};

export default function Attendance(){
  const { S, ui, setUi, update, toast } = useSchool();
  const cls = byId(S.classes, ui.attClass) ? ui.attClass : S.classes[0]?.id || '';
  const key = ui.attDate+'|'+cls, rec = S.attendance[key] || {};
  const list = classStudents(S,cls);
  const wd = new Date(ui.attDate+'T00:00').getDay();
  const c = {P:0,L:0,A:0}; list.forEach(x => { if (rec[x.id]) c[rec[x.id]]++; });
  const un = list.length - c.P - c.L - c.A;
  const mark = (ids, v) => update(D => { const r = D.attendance[key] || (D.attendance[key] = {}); ids.forEach(id => { r[id] = v; }); });
  const rows = list.map(x => <tr key={x.id}>
    <td><b>{x.name}</b><div className="small muted">{x.code}</div></td>
    <td><div className="seg" role="group" aria-label={`Attendance for ${x.name}`}>{['P','L','A'].map(v =>
      <button key={v} className={v} aria-pressed={rec[x.id]===v} onClick={() => mark([x.id], v)}>{NAMES[v]}</button>)}</div></td>
    <td className="num">{pct(rateFor(S,(d,cc,s)=>s===x.id))}</td>
    <td>{x.guardian}<div className="small muted">{x.phone}</div></td>
  </tr>);
  return <>
    <div className="bar">
      <label className="field">Class<select value={cls} onChange={e => setUi({attClass:e.target.value})}><Options list={classOpts(S)}/></select></label>
      <label className="field">Date<input type="date" value={ui.attDate} max={today()} onChange={e => { if (e.target.value) setUi({attDate:e.target.value}); }}/></label>
      <div className="grow"></div>
      <button className="btn gold" onClick={() => { mark(list.map(x => x.id), 'P'); toast('Everyone marked present'); }}>Mark everyone present</button>
    </div>
    {(wd===0||wd===6) && <div className="note">This date is a weekend. Choose a school day unless you are recording a special session.</div>}
    <div className="panel" style={{marginBottom:14}}><div className="tally">
      <span><b style={{color:'var(--ok)'}}>{c.P}</b>present</span><span><b style={{color:'var(--warn)'}}>{c.L}</b>late</span>
      <span><b style={{color:'var(--bad)'}}>{c.A}</b>absent</span><span><b>{un}</b>not marked</span>
      <span className="small muted" style={{marginLeft:'auto'}}>Changes save as you click. Guardian contacts are listed for follow-up.</span>
    </div></div>
    <DataTable heads={['Student','Status','#Term attendance','Guardian']} rows={rows} empty="No active students in this class."/>
  </>;
}
