import { ValidationError, deleteStudent, getStudent, updateStudent } from '@/lib/db';

export const dynamic = 'force-dynamic';

const fail = e => Response.json({ error: e.message }, { status: e instanceof ValidationError ? 400 : 500 });
const notFound = () => Response.json({ error: 'Student not found' }, { status: 404 });

// GET /api/students/:id
export async function GET(_req, { params }){
  try { const s = await getStudent((await params).id); return s ? Response.json({ student: s }) : notFound(); }
  catch(e){ return fail(e); }
}

// PUT /api/students/:id: update every editable field
export async function PUT(req, { params }){
  try { const s = await updateStudent((await params).id, await req.json()); return s ? Response.json({ student: s }) : notFound(); }
  catch(e){ return fail(e); }
}

// DELETE /api/students/:id
export async function DELETE(_req, { params }){
  try { return (await deleteStudent((await params).id)) ? Response.json({ ok: true }) : notFound(); }
  catch(e){ return fail(e); }
}
