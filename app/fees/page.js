'use client';
import { useSchool } from '@/components/SchoolProvider';
import { useDialogs } from '@/components/dialogs';
import { Badge, DataTable, Options } from '@/components/ui';
import { addDays, byId, classOpts, clsName, feeStatus, fmtDate, iso, money, stuName, today, uid } from '@/lib/school';

export default function Fees(){
  const { S, ui, setUi, toast } = useSchool();
  const d = useDialogs();
  const q = ui.feeQ.trim().toLowerCase();
  const list = S.fees.filter(f => (!ui.feeF || feeStatus(f)===ui.feeF) && (!q || stuName(S,f.studentId).toLowerCase().includes(q)));
  const billed = S.fees.reduce((a,f)=>a+f.amount,0), got = S.fees.reduce((a,f)=>a+Math.min(f.paid,f.amount),0);
  const od = S.fees.filter(f=>feeStatus(f)==='Overdue');

  const pay = id => { const f = byId(S.fees,id), bal = +(f.amount - f.paid).toFixed(2);
    d.form(`Record payment for ${stuName(S,f.studentId)}`, [
      {k:'amount',label:`Amount (balance ${money(bal)})`,type:'number',def:bal,attr:{min:0.01, max:bal, step:0.01},req:true},
      {k:'method',label:'Method',type:'select',opts:['Cash','ABA transfer','Wing','ACLEDA','Other']},
      {k:'date',label:'Date received',type:'date',def:today(),req:true}
    ], null, (o, D) => { if (!(o.amount>0) || o.amount>bal+0.001) return 'Enter an amount between $0.01 and the balance'; byId(D.fees,id).paid += o.amount; D.payments.push({id:uid('p'), feeId:id, ...o}); toast('Payment recorded'); }, 'Record payment'); };
  const create = () => d.form('Create invoices', [
    {k:'item',label:'Item',req:true,def:'Tuition',wide:true},
    {k:'target',label:'Bill',type:'select',opts:[['all','All active students'],...classOpts(S)]},
    {k:'term',label:'Term',type:'select',opts:['Term 1','Term 2'],def:S.settings.term},
    {k:'amount',label:'Amount per student (USD)',type:'number',def:180,attr:{min:1, step:0.01},req:true},
    {k:'due',label:'Due date',type:'date',def:iso(addDays(new Date(),30)),req:true}
  ], null, (o, D) => { const targets = D.students.filter(s => s.status==='Active' && (o.target==='all' || s.classId===o.target));
    let n = 0; targets.forEach(s => { if (D.fees.some(f=>f.studentId===s.id && f.term===o.term && f.item===o.item)) return; D.fees.push({id:uid('f'), studentId:s.id, term:o.term, item:o.item, amount:o.amount, paid:0, due:o.due}); n++; });
    toast(n ? `${n} invoices created` : 'Everyone in that group already has this invoice'); }, 'Create invoices');
  const remove = id => d.confirm('Delete invoice?', `This removes the invoice for ${stuName(S,byId(S.fees,id).studentId)} and its payment history.`, 'Delete invoice', 'Invoice deleted', D => { D.fees = D.fees.filter(f=>f.id!==id); D.payments = D.payments.filter(p=>p.feeId!==id); });

  const rows = list.map(f => { const st = feeStatus(f), s = byId(S.students,f.studentId); return <tr key={f.id}>
    <td><b>{stuName(S,f.studentId)}</b><div className="small muted">{s?clsName(S,s.classId):''}</div></td>
    <td>{f.item}<div className="small muted">{f.term}</div></td>
    <td className="num">{money(f.amount)}</td><td className="num">{money(f.paid)}</td><td className="num"><b>{money(Math.max(0,f.amount-f.paid))}</b></td>
    <td>{fmtDate(f.due)}</td><td><Badge t={st}/></td>
    <td style={{whiteSpace:'nowrap'}}>{st!=='Paid' && <button className="btn sm gold" onClick={() => pay(f.id)}>Record payment</button>}<button className="icon-btn del" onClick={() => remove(f.id)}>Delete</button></td>
  </tr>; });
  const recent = [...S.payments].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);
  return <>
    <div className="stats" style={{marginTop:0,marginBottom:18}}>
      <div className="stat"><div className="l">Billed</div><div className="v">{money(billed)}</div></div>
      <div className="stat g"><div className="l">Collected</div><div className="v">{money(got)}</div><div className="progress"><i style={{width:`${billed?got/billed*100:0}%`}}></i></div></div>
      <div className="stat k"><div className="l">Outstanding</div><div className="v">{money(billed-got)}</div></div>
      <div className="stat r"><div className="l">Overdue invoices</div><div className="v">{od.length}</div></div>
    </div>
    <div className="bar">
      <label className="field grow">Search<input type="search" value={ui.feeQ} onChange={e => setUi({feeQ:e.target.value})} placeholder="Student name"/></label>
      <label className="field">Status<select value={ui.feeF} onChange={e => setUi({feeF:e.target.value})}><option value="">All invoices</option><Options list={['Paid','Partial','Unpaid','Overdue']}/></select></label>
      <button className="btn primary" onClick={create}>Create invoices</button>
    </div>
    <DataTable heads={['Student','Item','#Amount','#Paid','#Balance','Due','Status','']} rows={rows} empty="No invoices match this filter."/>
    <div className="panel" style={{marginTop:18}}><h3>Recent payments</h3>
      {recent.length ? <div className="scroll"><table><thead><tr><th>Date</th><th>Student</th><th>Method</th><th className="num">Amount</th><th></th></tr></thead><tbody>
        {recent.map(p => { const f = byId(S.fees,p.feeId); return <tr key={p.id}><td>{fmtDate(p.date)}</td><td>{f?stuName(S,f.studentId):'—'}</td><td>{p.method}</td><td className="num">{money(p.amount)}</td>
          <td><button className="icon-btn" onClick={() => d.receipt(p.id)}>View receipt</button></td></tr>; })}
      </tbody></table></div> : <p className="muted">No payments recorded.</p>}
    </div>
  </>;
}
