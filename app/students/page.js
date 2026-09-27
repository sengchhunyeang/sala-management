'use client';
import { useSchool } from '@/components/SchoolProvider';
import { useDialogs } from '@/components/dialogs';
import { Badge, DataTable, Options } from '@/components/ui';
import { STATUSES, classOpts, clsName, pct, rateFor, stuName } from '@/lib/school';

export default function Students(){
  const { S, ui, setUi, role } = useSchool();
  const d = useDialogs();
  const q = ui.q.trim().toLowerCase();
  const canEdit = role !== 'Accountant';
  const list = S.students.filter(x => (!ui.cls || x.classId===ui.cls) && (!ui.st || x.status===ui.st) &&
    (!q || (x.name+' '+x.code+' '+x.guardian+' '+x.phone).toLowerCase().includes(q)));
  const remove = id => d.confirmAsync('Remove student?', `${stuName(S,id)} and their attendance, grades and invoices will be deleted. To keep their records, set the status to Transferred instead.`, 'Remove student', 'Student removed',
    () => d.removeStudent(id));
  const rows = list.map(x => <tr key={x.id}>
    <td className="muted">{x.code}</td>
    <td><button className="link" onClick={() => d.stuProfile(x.id)}>{x.name}</button></td>
    <td>{x.gender}</td><td>{clsName(S,x.classId)}</td>
    <td>{x.guardian}</td><td>{x.phone}</td>
    <td className="num">{pct(rateFor(S,(dd,c,s)=>s===x.id))}</td>
    <td><Badge t={x.status}/></td>
    <td style={{whiteSpace:'nowrap'}}>{canEdit && <><button className="icon-btn" onClick={() => d.stuForm(x.id)}>Edit</button><button className="icon-btn del" onClick={() => remove(x.id)}>Remove</button></>}</td>
  </tr>);
  return <>
    <div className="bar">
      <label className="field grow">Search<input type="search" value={ui.q} onChange={e => setUi({q:e.target.value})} placeholder="Name, student ID, guardian or phone"/></label>
      <label className="field">Class<select value={ui.cls} onChange={e => setUi({cls:e.target.value})}><option value="">All classes</option><Options list={classOpts(S)}/></select></label>
      <label className="field">Status<select value={ui.st} onChange={e => setUi({st:e.target.value})}><option value="">Any status</option><Options list={STATUSES}/></select></label>
      {canEdit && <button className="btn primary" onClick={() => d.stuForm()}>Enrol student</button>}
    </div>
    <p className="small muted" style={{margin:'-4px 0 10px'}}>Showing {list.length} of {S.students.length} students</p>
    <DataTable heads={['Student ID','Name','Gender','Class','Guardian','Phone','#Attendance','Status','']} rows={rows} empty="No students match these filters. Try clearing the search."/>
  </>;
}
