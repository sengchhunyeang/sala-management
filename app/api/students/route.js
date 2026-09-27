import { ValidationError, createStudent, deleteAllStudents, listStudents } from '@/lib/db';

export const dynamic = 'force-dynamic';

const fail = e => Response.json({ error: e.message }, { status: e instanceof ValidationError ? 400 : 500 });

// GET /api/students: every student
export async function GET(){
  try { return Response.json({ students: await listStudents() }); }
  catch(e){ return fail(e); }
}

// POST /api/students: enrol one student. The server assigns id and code.
export async function POST(req){
  try { return Response.json({ student: await createStudent(await req.json()) }, { status: 201 }); }
  catch(e){ return fail(e); }
}

// DELETE /api/students: remove every student (Settings → Clear all data)
export async function DELETE(){
  try { await deleteAllStudents(); return Response.json({ ok: true }); }
  catch(e){ return fail(e); }
}
