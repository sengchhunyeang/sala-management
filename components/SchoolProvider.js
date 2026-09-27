'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ROLES, emptyData, today } from '@/lib/school';
import { api } from '@/lib/api';

const KEY = 'sala-sms-v1';
const Ctx = createContext(null);
export const useSchool = () => useContext(Ctx);

// Students are stored in their own table and changed through /api/students,
// so they are left out of the document save.
const putData = ({ students, ...rest }) => api('PUT', '/api/data', rest);

export default function SchoolProvider({ children }){
  const [S, setS] = useState(null);
  const ref = useRef(null);
  const [ui, setUiState] = useState(null);
  const [role, setRoleState] = useState('Admin');
  const [modal, setModal] = useState(null);
  const [toastMsg, setToastMsg] = useState({ text:'', show:false });
  const toastTimer = useRef(null);
  const saving = useRef({ busy:false, next:null });
  const [loadError, setLoadError] = useState(null);

  const toast = useCallback(text => {
    setToastMsg({ text, show:true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(t => ({ ...t, show:false })), 2400);
  }, []);

  // Saves to PostgreSQL one request at a time; if several updates happen while
  // a save is in flight, only the latest state is sent next.
  const persist = useCallback(async data => {
    const q = saving.current;
    q.next = data;
    if (q.busy) return;
    q.busy = true;
    while (q.next){
      const d = q.next; q.next = null;
      try { await putData(d); }
      catch(e){ toast('Could not save to database: ' + e.message); }
    }
    q.busy = false;
  }, [toast]);

  useEffect(() => {
    (async () => {
      let data = null;
      try {
        data = (await api('GET', '/api/data')).data;
        if (!data){
          // First run against an empty database: move any browser-stored data across
          // (the server imports its students into the students table).
          try { const raw = localStorage.getItem(KEY); if (raw) data = JSON.parse(raw); } catch(e){}
          if (!data) data = emptyData();
          await api('PUT', '/api/data', data);
        }
        data.students = (await api('GET', '/api/students')).students;
      } catch(e){ setLoadError(e.message); return; }
      try { const r = localStorage.getItem(KEY+'-role'); if (r && ROLES[r]) setRoleState(r); } catch(e){}
      const TODAY = today();
      ref.current = data;
      setS(data);
      setUiState({q:'', cls:'', st:'Active', attClass:'', attDate:TODAY, gExam:'', gClass:'', gSub:'Mathematics', ttClass:'', feeF:'', feeQ:'', cal:TODAY.slice(0,7), repExam:''});
    })();
  }, []);

  // Runs fn against a draft copy of the data. If fn returns a string, it is
  // treated as a validation error: nothing is saved and the string is returned.
  const update = useCallback(fn => {
    const draft = structuredClone(ref.current);
    const res = fn(draft);
    if (typeof res === 'string') return res;
    ref.current = draft; setS(draft); persist(draft);
  }, [persist]);

  const setUi = useCallback(patch => setUiState(u => ({ ...u, ...patch })), []);
  const setRole = useCallback(r => { setRoleState(r); try { localStorage.setItem(KEY+'-role', r); } catch(e){} }, []);
  const openModal = useCallback((title, content) => setModal({ title, content }), []);
  const closeModal = useCallback(() => setModal(null), []);

  const value = useMemo(() => ({ S, update, ui, setUi, role, setRole, modal, openModal, closeModal, toast, toastMsg, loadError }),
    [S, update, ui, setUi, role, setRole, modal, openModal, closeModal, toast, toastMsg, loadError]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
