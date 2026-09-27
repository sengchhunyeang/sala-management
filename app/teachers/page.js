'use client';
import { useSchool } from '@/components/SchoolProvider';
import { useDialogs } from '@/components/dialogs';
import { Badge, DataTable } from '@/components/ui';
import { fmtDate, tName } from '@/lib/school';

export default function Teachers(){
  const { S } = useSchool();
  const d = useDialogs();
  const remove = id => d.confirm('Remove teacher?', `${tName(S,id)} will be removed. Classes they lead will show as unassigned.`, 'Remove teacher', 'Teacher removed', D => { D.teachers = D.teachers.filter(t=>t.id!==id); });
  return <>
    <div className="bar"><p className="grow muted" style={{margin:0}}>{S.teachers.length} staff members</p><button className="btn primary" onClick={() => d.teaForm()}>Add teacher</button></div>
    <DataTable heads={['Name','Subject','Homeroom','Phone','Email','Joined','Status','']} empty="No teachers yet. Add your first staff member."
      rows={S.teachers.map(t => { const home = S.classes.filter(c=>c.teacherId===t.id).map(c=>c.name).join(', '); return <tr key={t.id}>
        <td><b>{t.name}</b></td><td>{t.subject}</td>
        <td>{home || <span className="muted">—</span>}</td>
        <td>{t.phone}</td><td>{t.email}</td><td>{fmtDate(t.joined)}</td><td><Badge t={t.status}/></td>
        <td style={{whiteSpace:'nowrap'}}><button className="icon-btn" onClick={() => d.teaForm(t.id)}>Edit</button><button className="icon-btn del" onClick={() => remove(t.id)}>Remove</button></td>
      </tr>; })}/>
  </>;
}
