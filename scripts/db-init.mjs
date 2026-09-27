// Creates the database named in DATABASE_URL (if missing) and the school_data table.
// Run with: npm run db:init
import pg from 'pg';

const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete('sslmode');
const dbName = url.pathname.slice(1);
// Hosted databases (e.g. Supabase) need SSL; a local server does not.
const ssl = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ? false : { rejectUnauthorized: false };

// Hosted services give you a ready-made "postgres" database; only create others.
if (dbName !== 'postgres'){
  const admin = new URL(url); admin.pathname = '/postgres';
  const c1 = new pg.Client({ connectionString: admin.toString(), ssl });
  await c1.connect();
  const { rowCount } = await c1.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (!rowCount){ await c1.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`); console.log(`Created database ${dbName}`); }
  else console.log(`Database ${dbName} already exists`);
  await c1.end();
}

const c2 = new pg.Client({ connectionString: url.toString(), ssl });
await c2.connect();
await c2.query(`CREATE TABLE IF NOT EXISTS school_data (
  id int PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS students (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  gender text NOT NULL DEFAULT 'Female',
  dob date,
  class_id text,
  status text NOT NULL DEFAULT 'Active',
  guardian text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
)`);
console.log('Tables school_data and students are ready');
await c2.end();
