'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSchool } from './SchoolProvider';
import { Icon } from './ui';
import { PAGES, ROLES, feeStatus, href, overdueLoans, pageFromPath, unmarkedToday } from '@/lib/school';

function Modal(){
  const { modal, closeModal } = useSchool();
  const body = useRef(null), lastFocus = useRef(null);
  const open = !!modal;
  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement;
    const onKey = e => { if (e.key==='Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const f = lastFocus.current; if (f && document.contains(f)) f.focus();
    };
  }, [open, closeModal]);
  useEffect(() => { const f = body.current?.querySelector('input,select,textarea,button'); f && f.focus(); }, [modal]);
  if (!modal) return null;
  return <div className="modal" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
    <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="mtitle">
      <div className="dhead"><h2 id="mtitle">{modal.title}</h2><button className="x" onClick={closeModal} aria-label="Close">×</button></div>
      <div className="mbody" ref={body}>{modal.content}</div>
    </div>
  </div>;
}

export default function Shell({ children }){
  const { S, ui, role, setRole, toast, toastMsg, closeModal, loadError } = useSchool();
  const path = usePathname(), router = useRouter();
  const [sideOpen, setSideOpen] = useState(false);
  const cur = pageFromPath(path);
  const allowed = ROLES[role].includes(cur) && PAGES.some(p => p[0]===cur);
  const label = PAGES.find(x => x[0]===cur)?.[1] || 'Dashboard';

  useEffect(() => { setSideOpen(false); closeModal(); }, [path, closeModal]);
  useEffect(() => { if (S && !allowed) router.replace('/'); }, [S, allowed, router]);
  useEffect(() => { if (S) document.title = label + ' – ' + S.settings.school; }, [S, label]);

  if (loadError) return <div className="app"><div className="card" style={{margin:'40px auto', maxWidth:520}}>
    <h3>Cannot reach the database</h3>
    <p className="small">{loadError}</p>
    <p className="small">Check that PostgreSQL is running and that DATABASE_URL in .env.local is correct, then reload.</p>
  </div></div>;
  if (!S || !ui) return <div className="app" />;

  const counts = {attendance: unmarkedToday(S).length, fees: S.fees.filter(f => feeStatus(f)==='Overdue').length, library: overdueLoans(S).length};
  let grp = null;
  const nav = [];
  PAGES.filter(p => ROLES[role].includes(p[0])).forEach(([id,text,g]) => {
    if (g !== grp){ grp = g; if (g) nav.push(<div key={'g'+g} className="ngroup">{g}</div>); }
    nav.push(<Link key={id} href={href(id)} className={id===cur?'on':''} aria-current={id===cur?'page':undefined}>
      <Icon id={id}/>{text}{counts[id] ? <span className="count" title="Needs attention">{counts[id]}</span> : null}
    </Link>);
  });

  return <>
    <div className="app">
      <aside className={`side ${sideOpen?'open':''}`} aria-label="Main navigation">
        <div className="brand">
          <div className="mark" aria-hidden="true">ស</div>
          <div><div className="bname">{S.settings.school}</div><div className="bsub">Academic year {S.settings.year}</div></div>
        </div>
        <nav>{nav}</nav>
        <div className="side-foot">
          <label>Signed in as
            <select aria-label="Role" value={role} onChange={e => { setRole(e.target.value); toast('Viewing as ' + e.target.value); }}>
              <option>Admin</option><option>Teacher</option><option>Accountant</option>
            </select>
          </label>
        </div>
      </aside>
      <div className="scrim" onClick={() => setSideOpen(false)}></div>
      <div className="main">
        <header className="top">
          <button className="burger" onClick={() => setSideOpen(true)} aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>
          <h1>{label}</h1>
          <span className="date">{new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
        </header>
        <main className="view">{allowed ? children : null}</main>
      </div>
    </div>
    <Modal/>
    <div className={`toast ${toastMsg.show?'show':''}`} role="status" aria-live="polite">{toastMsg.text}</div>
  </>;
}
