import { openapi } from '@/lib/openapi';

// GET /api/openapi: the OpenAPI spec for the students API
export function GET(){
  return Response.json(openapi);
}
