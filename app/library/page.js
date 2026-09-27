'use client';
import { useSchool } from '@/components/SchoolProvider';
import { useDialogs } from '@/components/dialogs';
import { Badge, DataTable } from '@/components/ui';
import { addDays, byId, clsName, fmtDate, iso, stuName, today, uid } from '@/lib/school';

export default function Library(){
  const { S, update, toast } = useSchool();
  const d = useDialogs();
  const TODAY = today();
  const loans = []; S.books.forEach(b => b.loans.forEach(l => loans.push({b,l})));
  loans.sort((a,b) => a.l.due.localeCompare(b.l.due));

  const remove = id => { const b = byId(S.books,id); if (b.loans.length){ toast('Mark all copies returned before removing this book'); return; }
    d.confirm('Remove book?', `"${b.title}" will be removed from the catalogue.`, 'Remove book', 'Book removed', D => { D.books = D.books.filter(x=>x.id!==id); }); };
  const lend = id => { const b = byId(S.books,id);
    d.form(`Lend "${b.title}"`, [
      {k:'studentId',label:'Borrower',type:'select',opts:S.students.filter(s=>s.status==='Active').map(s=>[s.id,`${s.name} (${clsName(S,s.classId)})`]),wide:true},
      {k:'due',label:'Return by',type:'date',def:iso(addDays(new Date(),14)),req:true}
    ], null, (o, D) => { const db = byId(D.books,id); if (db.loans.length >= db.copies) return 'No copies left to lend'; db.loans.push({id:uid('l'), studentId:o.studentId, out:today(), due:o.due}); toast('Book lent'); }, 'Lend book'); };
  const giveBack = (bid, lid) => { update(D => { const b = byId(D.books,bid); b.loans = b.loans.filter(l=>l.id!==lid); }); toast('Book returned'); };

  return <>
    <div className="bar"><p className="grow muted" style={{margin:0}}>{S.books.reduce((a,b)=>a+Number(b.copies),0)} copies across {S.books.length} titles, {loans.length} on loan</p><button className="btn primary" onClick={() => d.bookForm()}>Add book</button></div>
    <DataTable heads={['Title','Author','Category','#Copies','#Available','']} empty="The catalogue is empty. Add your first book."
      rows={S.books.map(b => { const av = b.copies - b.loans.length; return <tr key={b.id}>
        <td><b>{b.title}</b></td><td>{b.author}</td><td>{b.category}</td><td className="num">{b.copies}</td>
        <td className="num">{av>0 ? av : <span className="badge bad">None left</span>}</td>
        <td style={{whiteSpace:'nowrap'}}>{av>0 && <button className="btn sm" onClick={() => lend(b.id)}>Lend</button>}<button className="icon-btn" onClick={() => d.bookForm(b.id)}>Edit</button><button className="icon-btn del" onClick={() => remove(b.id)}>Remove</button></td>
      </tr>; })}/>
    <div className="panel" style={{marginTop:18}}><h3>Books on loan</h3>
      {loans.length ? <div className="scroll"><table><thead><tr><th>Book</th><th>Borrower</th><th>Lent</th><th>Due back</th><th>Status</th><th></th></tr></thead><tbody>
        {loans.map(({b,l}) => <tr key={l.id}><td>{b.title}</td><td>{stuName(S,l.studentId)}</td><td>{fmtDate(l.out)}</td><td>{fmtDate(l.due)}</td><td><Badge t={l.due<TODAY?'Overdue':'On loan'}/></td>
          <td><button className="btn sm" onClick={() => giveBack(b.id, l.id)}>Mark returned</button></td></tr>)}
      </tbody></table></div> : <p className="muted">No books are on loan.</p>}
    </div>
  </>;
}
