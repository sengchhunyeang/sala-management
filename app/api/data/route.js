import { importStudents, loadData, saveData } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(){
  try { return Response.json({ data: await loadData() }); }
  catch(e){ return Response.json({ error: e.message }, { status: 500 }); }
}

// Saves everything except students (those go through /api/students).
// If the payload still has a students array (first-run import from the
// browser), those students are imported without overwriting existing rows.
export async function PUT(req){
  try {
    const data = await req.json();
    if (!data || typeof data !== 'object' || !data.settings) return Response.json({ error: 'Invalid data' }, { status: 400 });
    if (Array.isArray(data.students) && data.students.length) await importStudents(data.students);
    await saveData(data);
    return Response.json({ ok: true });
  } catch(e){ return Response.json({ error: e.message }, { status: 500 }); }
}
