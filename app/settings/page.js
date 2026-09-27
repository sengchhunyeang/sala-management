'use client';
import { useSchool } from '@/components/SchoolProvider';
import { useDialogs } from '@/components/dialogs';
import { LetterBadge, Options } from '@/components/ui';
import { emptyData } from '@/lib/school';
import { api } from '@/lib/api';

export default function Settings(){
  const { S, update, toast } = useSchool();
  const d = useDialogs();
  const onSubmit = e => {
    e.preventDefault();
    const o = Object.fromEntries(new FormData(e.target));
    update(D => { Object.assign(D.settings, {school:o.school.trim(), year:o.year.trim(), term:o.term, passMark:Math.max(0,Math.min(100,Number(o.passMark)||40))}); });
    toast('Settings saved');
  };
  const reset = () => d.confirmAsync('Clear all data?', 'Every student, teacher, class, grade, invoice and other record will be permanently deleted. School settings are kept.', 'Clear data', 'All data cleared',
    async () => {
      try { await api('DELETE', '/api/students'); } catch(e){ return e.message; }
      update(D => { const settings = D.settings; Object.assign(D, emptyData(), { settings }); });
    });
  return <div className="cols" style={{marginTop:0}}>
    <div className="panel"><h3>School profile</h3>
      <form className="grid-form" onSubmit={onSubmit} key={JSON.stringify(S.settings)}>
        <label className="wide"><span>School name</span><input name="school" defaultValue={S.settings.school} required/></label>
        <label><span>Academic year</span><input name="year" defaultValue={S.settings.year} required/></label>
        <label><span>Current term</span><select name="term" defaultValue={S.settings.term}><Options list={['Term 1','Term 2']}/></select></label>
        <label><span>Pass mark</span><input name="passMark" type="number" min="0" max="100" defaultValue={S.settings.passMark}/></label>
        <div className="factions wide"><button className="btn primary">Save settings</button></div>
      </form>
    </div>
    <div className="panel"><h3>Grading scale</h3>
      <table><thead><tr><th>Grade</th><th>Score</th><th>Meaning</th></tr></thead><tbody>
        <tr><td><LetterBadge x={90}/></td><td>85–100</td><td>Excellent</td></tr><tr><td><LetterBadge x={75}/></td><td>70–84</td><td>Very good</td></tr>
        <tr><td><LetterBadge x={60}/></td><td>55–69</td><td>Good</td></tr><tr><td><LetterBadge x={45}/></td><td>40–54</td><td>Fair</td></tr>
        <tr><td><LetterBadge x={10}/></td><td>0–39</td><td>Needs improvement</td></tr>
      </tbody></table>
    </div>
    <div className="panel"><h3>Roles and access</h3>
      <p className="small" style={{marginTop:0}}>Switch roles at the bottom of the sidebar to preview what each person sees.</p>
      <ul className="todo small">
        <li><span className="dot"></span><div><b>Admin</b> can use every module, including settings and staff records.</div></li>
        <li><span className="dot g"></span><div><b>Teacher</b> sees students, classes, attendance, grades, timetable, library, notices and calendar.</div></li>
        <li><span className="dot r"></span><div><b>Accountant</b> sees students, fees and payments, reports, notices and calendar.</div></li>
      </ul>
    </div>
    <div className="panel"><h3>Data</h3>
      <p className="small" style={{marginTop:0}}>Records are saved in the PostgreSQL database. Clearing deletes every record but keeps the school settings.</p>
      <button className="btn danger" onClick={reset}>Clear all data</button>
    </div>
  </div>;
}
