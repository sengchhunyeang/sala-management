import { ValidationError, importDocument, loadData, saveChanges } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Validation and constraint errors (Postgres class 23, 22) are the caller's fault.
const fail = e => Response.json({ error: e.message },
  { status: e instanceof ValidationError || /^2[23]/.test(e.code || '') ? 400 : 500 });

export async function GET(){
  try { return Response.json({ data: await loadData() }); }
  catch(e){ return fail(e); }
}

// Body is either { changes: { table: { upsert:[rows], delete:[keys] } } } with the rows
// the browser changed (students excluded: they go through /api/students), or
// { import: document } to load a whole document on first run (students included).
export async function PUT(req){
  try {
    const body = await req.json();
    if (body?.import){
      if (!body.import.settings) return Response.json({ error: 'Invalid data' }, { status: 400 });
      await importDocument(body.import);
    } else await saveChanges(body?.changes);
    return Response.json({ ok: true });
  } catch(e){ return fail(e); }
}
