'use client';
import { useSchool } from '@/components/SchoolProvider';
import { useDialogs } from '@/components/dialogs';
import { Badge } from '@/components/ui';
import { byId, fmtDate, today, uid } from '@/lib/school';

export default function Notices(){
  const { S, role, update, toast } = useSchool();
  const d = useDialogs();
  const list = [...S.notices].sort((a,b) => (b.pinned-a.pinned) || b.date.localeCompare(a.date));
  const canEdit = role !== 'Accountant';
  const post = () => d.form('Post notice', [
    {k:'title',label:'Title',req:true,wide:true},
    {k:'audience',label:'Audience',type:'select',opts:['Everyone','Students','Parents','Staff']},
    {k:'pinned',label:'Pin to top',type:'select',opts:[['','No'],['1','Yes']]},
    {k:'body',label:'Message',type:'textarea',req:true,wide:true}
  ], null, (o, D) => { D.notices.push({id:uid('n'), date:today(), ...o, pinned:!!o.pinned}); toast('Notice posted'); }, 'Post notice');
  const pin = id => { const pinned = !byId(S.notices,id).pinned; update(D => { byId(D.notices,id).pinned = pinned; }); toast(pinned?'Pinned':'Unpinned'); };
  const remove = id => d.confirm('Delete notice?', 'This notice will be removed for everyone.', 'Delete notice', 'Notice deleted', D => { D.notices = D.notices.filter(n=>n.id!==id); });
  return <>
    <div className="bar"><p className="grow muted" style={{margin:0}}>Pinned notices appear first on everyone&apos;s dashboard.</p>{canEdit && <button className="btn primary" onClick={post}>Post notice</button>}</div>
    {list.length ? list.map(n => <article key={n.id} className={`notice ${n.pinned?'pinned':''}`}>
      <div className="row"><Badge t={n.audience}/><span className="small muted">{fmtDate(n.date)}{n.pinned?', pinned':''}</span></div>
      <h3>{n.title}</h3><p>{n.body}</p>
      {canEdit && <div className="row" style={{marginTop:10}}><button className="icon-btn" onClick={() => pin(n.id)}>{n.pinned?'Unpin':'Pin to top'}</button><button className="icon-btn del" onClick={() => remove(n.id)}>Delete</button></div>}
    </article>) : <div className="panel empty">No notices yet. Post one to reach students, parents or staff.</div>}
  </>;
}
