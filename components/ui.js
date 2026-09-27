'use client';
import { useState } from 'react';
import { useSchool } from './SchoolProvider';
import { ICONS, letter } from '@/lib/school';

const BADGE = {Paid:'ok',Active:'ok','On loan':'ok',Partial:'warn',Unpaid:'warn',Overdue:'bad',Inactive:'mute',Graduated:'mute',Transferred:'mute',Students:'navy',Parents:'warn',Staff:'ok',Everyone:'mute'};
export const Badge = ({ t }) => <span className={`badge ${BADGE[t]||'mute'}`}>{t}</span>;

export const LetterBadge = ({ x }) => x==null||x==='' ? <span className="muted">—</span>
  : <span className={`badge ${x>=70?'ok':x>=40?'warn':'bad'}`}>{letter(x)}</span>;

export const Icon = ({ id }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[id]}/></svg>
);

export const Options = ({ list }) => list.map(o => { const [v,l] = Array.isArray(o)?o:[o,o]; return <option key={v} value={v}>{l}</option>; });

export function Bars({ data, max=100, fmt=v=>v, color='var(--navy-ink)' }){
  const step=64, bw=32, h=170, w=Math.max(data.length*step+20,300);
  return <div className="scroll"><svg viewBox={`0 0 ${w} ${h+40}`} width={w} height={h+40} role="img">
    {[0,.5,1].map(f => { const y = 12 + h - f*h; return <line key={f} className="grid" x1="0" x2={w} y1={y} y2={y}/>; })}
    {data.map((d,i) => { const x=i*step+22, bh = d.value==null?0:Math.max(2,d.value/max*h);
      return <g key={i}>
        <rect x={x} y={12+h-bh} width={bw} height={bh} rx="3" fill={d.color||color}><title>{`${d.label}: ${d.value==null?'no data':fmt(d.value)}`}</title></rect>
        <text x={x+bw/2} y={8+h-bh} textAnchor="middle" className="cv">{d.value==null?'':fmt(d.value)}</text>
        <text x={x+bw/2} y={h+32} textAnchor="middle" className="cl">{d.label}</text>
      </g>; })}
  </svg></div>;
}

export const DataTable = ({ heads, rows, empty='Nothing here yet.' }) => (
  <div className="tablewrap"><div className="scroll"><table>
    <thead><tr>{heads.map((h,i) => <th key={i} className={h.startsWith('#')?'num':''}>{h.replace(/^#/,'')}</th>)}</tr></thead>
    <tbody>{rows.length ? rows : <tr><td colSpan={heads.length} className="empty">{empty}</td></tr>}</tbody>
  </table></div></div>
);

// Modal body for a data-entry form. onSave(values, draft) mutates the draft;
// returning a string rejects the save and shows it as a toast.
// Alternatively, action(values) is an async save (e.g. an API call) that
// resolves to an error string or nothing.
export function FormBody({ fields, values, onSave, action, submit='Save' }){
  const { update, toast, closeModal } = useSchool();
  const [busy, setBusy] = useState(false);
  const vals = values || {};
  const onSubmit = async e => {
    e.preventDefault();
    if (busy) return;
    const o = Object.fromEntries(new FormData(e.target));
    fields.forEach(f => { if (f.type==='number') o[f.k] = Number(o[f.k]); });
    let err;
    if (action){ setBusy(true); err = await action(o); setBusy(false); }
    else err = update(D => onSave(o, D));
    if (err){ toast(err); return; }
    closeModal();
  };
  return <form className="grid-form" onSubmit={onSubmit}>
    {fields.map(f => {
      const v = vals[f.k] ?? f.def ?? '';
      const common = { name:f.k, required:!!f.req, defaultValue:v, ...(f.attr||{}) };
      const inp = f.type==='select' ? <select {...common}><Options list={f.opts}/></select>
        : f.type==='textarea' ? <textarea rows={4} {...common}/>
        : <input type={f.type||'text'} {...common}/>;
      return <label key={f.k} className={f.wide?'wide':''}><span>{f.label}</span>{inp}</label>;
    })}
    <div className="factions wide"><button type="button" className="btn ghost" onClick={closeModal}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : submit}</button></div>
  </form>;
}

// Confirmation dialog. fn(draft) mutates the data; or action() is an async
// operation that resolves to an error string or nothing.
export function ConfirmBody({ text, label, doneMsg, fn, action }){
  const { update, toast, closeModal } = useSchool();
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (action){
      setBusy(true); const err = await action(); setBusy(false);
      if (err){ toast(err); return; }
    } else update(fn);
    closeModal(); toast(doneMsg);
  };
  return <>
    <p style={{marginTop:0}}>{text}</p>
    <div className="factions">
      <button className="btn ghost" onClick={closeModal}>Cancel</button>
      <button className="btn danger" disabled={busy} onClick={go}>{busy ? 'Working…' : label}</button>
    </div>
  </>;
}
