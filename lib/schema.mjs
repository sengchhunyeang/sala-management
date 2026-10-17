// Table definitions, shared by lib/db.js (runs on first use) and scripts/db-init.mjs.
// Column names must match lib/tables.js.
export const SCHEMA = `
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
);
CREATE TABLE IF NOT EXISTS settings (
  id int PRIMARY KEY CHECK (id = 1),
  school text NOT NULL DEFAULT '',
  year text NOT NULL DEFAULT '',
  term text NOT NULL DEFAULT '',
  pass_mark int CHECK (pass_mark BETWEEN 0 AND 100)
);
CREATE TABLE IF NOT EXISTS teachers (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  joined_on date
);
CREATE TABLE IF NOT EXISTS classes (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  room text NOT NULL DEFAULT '',
  grade int,
  capacity int,
  teacher_id text NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS exams (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  term text NOT NULL DEFAULT '',
  start_date date
);
CREATE TABLE IF NOT EXISTS attendance (
  att_date date NOT NULL,
  class_id text NOT NULL,
  student_id text NOT NULL,
  mark text NOT NULL CHECK (mark IN ('P','L','A')),
  PRIMARY KEY (att_date, class_id, student_id)
);
CREATE INDEX IF NOT EXISTS attendance_student_idx ON attendance (student_id);
CREATE TABLE IF NOT EXISTS grades (
  exam_id text NOT NULL,
  subject text NOT NULL,
  student_id text NOT NULL,
  score numeric(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  PRIMARY KEY (exam_id, subject, student_id)
);
CREATE INDEX IF NOT EXISTS grades_student_idx ON grades (student_id);
CREATE TABLE IF NOT EXISTS fees (
  id text PRIMARY KEY,
  student_id text NOT NULL DEFAULT '',
  term text NOT NULL DEFAULT '',
  item text NOT NULL DEFAULT '',
  amount numeric(12,2),
  paid numeric(12,2),
  due_on date
);
CREATE INDEX IF NOT EXISTS fees_student_idx ON fees (student_id);
CREATE TABLE IF NOT EXISTS payments (
  id text PRIMARY KEY,
  fee_id text NOT NULL DEFAULT '',
  amount numeric(12,2),
  method text NOT NULL DEFAULT '',
  paid_on date
);
CREATE INDEX IF NOT EXISTS payments_fee_idx ON payments (fee_id);
CREATE TABLE IF NOT EXISTS books (
  id text PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  author text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  copies int
);
CREATE TABLE IF NOT EXISTS loans (
  id text PRIMARY KEY,
  book_id text NOT NULL DEFAULT '',
  student_id text NOT NULL DEFAULT '',
  lent_on date,
  due_on date
);
CREATE INDEX IF NOT EXISTS loans_book_idx ON loans (book_id);
CREATE TABLE IF NOT EXISTS notices (
  id text PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  audience text NOT NULL DEFAULT '',
  pinned boolean NOT NULL DEFAULT false,
  body text NOT NULL DEFAULT '',
  posted_on date
);
CREATE TABLE IF NOT EXISTS events (
  id text PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  event_date date,
  type text NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS timetable (
  class_id text NOT NULL,
  day text NOT NULL,
  period int NOT NULL,
  subject text NOT NULL,
  PRIMARY KEY (class_id, day, period)
);`;
