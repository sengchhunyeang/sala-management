'use client';
import { useSchool } from '@/components/SchoolProvider';
import { useDialogs } from '@/components/dialogs';
import { Bars, Options } from '@/components/ui';
import { SUBJECTS, avgScore, byId, clsName, latestExam, letter, pct, rateFor } from '@/lib/school';

export default function Reports(){
  const { S, ui, setUi } = useSchool();
  const d = useDialogs();
  const ex = byId(S.exams, ui.repExam) ? ui.repExam : (latestExam(S) || S.exams[0])?.id || '', pass = S.settings.passMark;
  const byClassAtt = S.classes.map(c => ({label:c.name.replace('Grade ',''), value:Math.round((rateFor(S,(dd,cc)=>cc===c.id)||0)*100)}));
  const subs = SUBJECTS.filter(s => avgScore(S,(e,sub)=>e===ex&&sub===s)!=null);
  const bySub = subs.map(s => ({label:s.slice(0,4), value:Math.round(avgScore(S,(e,sub)=>e===ex&&sub===s)), color:'var(--gold)'}));
  const dist = {A:0,B:0,C:0,D:0,F:0};
  Object.entries(S.grades).forEach(([k,v]) => { if (k.startsWith(ex+'|') && v!=='' && v!=null) dist[letter(Number(v))]++; });
  const distMax = Math.max(1,...Object.values(dist));
  const feeByClass = S.classes.map(c => { const fs = S.fees.filter(f => byId(S.students,f.studentId)?.classId===c.id); const b = fs.reduce((a,f)=>a+f.amount,0), p = fs.reduce((a,f)=>a+Math.min(f.paid,f.amount),0); return {label:c.name.replace('Grade ',''), value:b?Math.round(p/b*100):0, color:'var(--red)'}; });
  const actives = S.students.filter(s=>s.status==='Active');
  const ranked = actives.map(s => ({s, a:avgScore(S,(e,sub,sid)=>e===ex&&sid===s.id)})).filter(x=>x.a!=null).sort((a,b)=>b.a-a.a);
  const risk = actives.map(s => ({s, att:rateFor(S,(dd,c,sid)=>sid===s.id), a:avgScore(S,(e,sub,sid)=>e===ex&&sid===s.id)})).filter(x => (x.att!=null&&x.att<.85) || (x.a!=null&&x.a<pass));
  const bad = {color:'var(--bad)',fontWeight:600};
  return <>
    <div className="bar"><label className="field">Exam for academic reports<select value={ex} onChange={e => setUi({repExam:e.target.value})}><Options list={S.exams.map(e=>[e.id,e.name])}/></select></label></div>
    <div className="cols" style={{marginTop:0}}>
      <div className="panel"><h3>Attendance by class</h3><Bars data={byClassAtt} fmt={v=>v+'%'}/></div>
      <div className="panel"><h3>Average score by subject</h3>{bySub.length ? <Bars data={bySub}/> : <p className="muted">No scores for this exam yet.</p>}</div>
      <div className="panel"><h3>Grade distribution</h3><Bars data={Object.entries(dist).map(([l,v])=>({label:l,value:v,color:l==='F'?'var(--red)':l==='D'?'var(--gold)':'var(--navy-ink)'}))} max={distMax}/></div>
      <div className="panel"><h3>Fee collection by class</h3><Bars data={feeByClass} fmt={v=>v+'%'}/></div>
    </div>
    <div className="cols">
      <div className="panel"><h3>Top 10 students</h3>{ranked.length ? <div className="scroll"><table><thead><tr><th className="num">Rank</th><th>Student</th><th>Class</th><th className="num">Average</th></tr></thead><tbody>
        {ranked.slice(0,10).map((x,i) => <tr key={x.s.id}><td className="num">{i+1}</td><td>{x.s.name}</td><td>{clsName(S,x.s.classId)}</td><td className="num">{x.a.toFixed(1)}</td></tr>)}
      </tbody></table></div> : <p className="muted">No scores yet.</p>}</div>
      <div className="panel"><h3>Students who may need support</h3><p className="small muted" style={{marginTop:-6}}>Attendance below 85% or an exam average below the pass mark.</p>
        {risk.length ? <div className="scroll"><table><thead><tr><th>Student</th><th>Class</th><th className="num">Attendance</th><th className="num">Average</th></tr></thead><tbody>
          {risk.map(x => <tr key={x.s.id}><td><button className="link" onClick={() => d.stuProfile(x.s.id)}>{x.s.name}</button></td><td>{clsName(S,x.s.classId)}</td>
            <td className="num" style={x.att!=null&&x.att<.85?bad:undefined}>{pct(x.att)}</td>
            <td className="num" style={x.a!=null&&x.a<pass?bad:undefined}>{x.a==null?'—':x.a.toFixed(1)}</td></tr>)}
        </tbody></table></div> : <p className="muted">No students flagged.</p>}
      </div>
    </div>
  </>;
}
