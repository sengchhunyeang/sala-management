import { STATUSES } from '@/lib/school';

// OpenAPI 3 description of the student REST API, served at /api/openapi and shown at /api-docs.
const error = { description: '', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } };
const err = description => ({ ...error, description });
const one = description => ({ description, content: { 'application/json': { schema: {
  type: 'object', properties: { student: { $ref: '#/components/schemas/Student' } } } } } });
const ok = { description: 'Done', content: { 'application/json': { schema: {
  type: 'object', properties: { ok: { type: 'boolean', example: true } } } } } };
const idParam = { name: 'id', in: 'path', required: true, description: 'Student id (e.g. s1a2b3c4d), not the STU code', schema: { type: 'string' } };
const body = { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StudentInput' } } } };

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Sala School Management: Students API',
    version: '1.0.0',
    description: 'CRUD for the `students` table. The server assigns `id` and `code` (STU-###). There is no authentication yet.',
  },
  servers: [{ url: '/' }],
  tags: [{ name: 'Students' }],
  paths: {
    '/api/students': {
      get: {
        tags: ['Students'], summary: 'List every student', operationId: 'listStudents',
        responses: {
          200: { description: 'All students, ordered by code', content: { 'application/json': { schema: {
            type: 'object', properties: { students: { type: 'array', items: { $ref: '#/components/schemas/Student' } } } } } } },
          500: err('Database error'),
        },
      },
      post: {
        tags: ['Students'], summary: 'Enrol a student', operationId: 'createStudent', requestBody: body,
        responses: { 201: one('The created student'), 400: err('Validation error'), 500: err('Database error') },
      },
      delete: {
        tags: ['Students'], summary: 'Delete ALL students',
        description: '**Destructive:** removes every row in the `students` table (used by Settings → Clear all data). It does not clean up attendance, grades or other records.',
        operationId: 'deleteAllStudents',
        responses: { 200: ok, 500: err('Database error') },
      },
    },
    '/api/students/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Students'], summary: 'Get one student', operationId: 'getStudent',
        responses: { 200: one('The student'), 404: err('Student not found'), 500: err('Database error') },
      },
      put: {
        tags: ['Students'], summary: 'Update a student',
        description: 'Replaces every editable field: send the whole object, since omitted fields fall back to their defaults.',
        operationId: 'updateStudent', requestBody: body,
        responses: { 200: one('The updated student'), 400: err('Validation error'), 404: err('Student not found'), 500: err('Database error') },
      },
      delete: {
        tags: ['Students'], summary: 'Delete a student',
        description: 'Deletes the row only. The web app also cleans up the student\'s attendance, grades and loans; this endpoint does not.',
        operationId: 'deleteStudent',
        responses: { 200: ok, 404: err('Student not found'), 500: err('Database error') },
      },
    },
  },
  components: {
    schemas: {
      StudentInput: {
        type: 'object', required: ['name', 'guardian', 'phone'],
        properties: {
          name: { type: 'string', example: 'ZZ Test Student' },
          gender: { type: 'string', enum: ['Female', 'Male'], default: 'Female', description: 'Anything other than "Male" is stored as Female' },
          dob: { type: 'string', format: 'date', nullable: true, example: '2010-05-14' },
          classId: { type: 'string', nullable: true, description: 'Must be an existing class id' },
          status: { type: 'string', enum: STATUSES, default: 'Active' },
          guardian: { type: 'string', example: 'ZZ Test Guardian' },
          phone: { type: 'string', example: '012 345 678' },
          address: { type: 'string', example: 'Phnom Penh' },
        },
      },
      Student: {
        allOf: [
          { type: 'object', properties: {
            id: { type: 'string', readOnly: true, example: 's1a2b3c4d' },
            code: { type: 'string', readOnly: true, example: 'STU-004' },
          } },
          { $ref: '#/components/schemas/StudentInput' },
        ],
      },
      Error: { type: 'object', properties: { error: { type: 'string', example: 'Full name is required' } } },
    },
  },
};
