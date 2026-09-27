# Sala School Management

School management app for Sala Secondary School (Cambodia): students, teachers, classes, attendance, exams and grades, timetable, fees and payments, library, notices, calendar, reports and settings. Theme is Forest Green & Copper, with Khmer-friendly fonts.

## Stack
- Next.js 16 (App Router, Turbopack), React 19, plain JavaScript (no TypeScript), no CSS framework.
- Every page is a client component. Fonts come from `next/font/google`: Kantumruy Pro (`--f-body`, includes the Khmer subset) and Bricolage Grotesque (`--f-display`).
- Commands: `npm run dev` (port 3000), `npm run build`, `npm start`, `npm run db:init` (creates the tables; also creates the database when its name isn't `postgres`).
- Development is on Windows. Use the PowerShell tool; Git Bash here has no `git` or `head`.

## Database (Supabase PostgreSQL)
- **Server:** Supabase project `school-management`, ref `stihlplruxeqpdzlvjyk`, region `ap-southeast-2`, PostgreSQL 17.
  - The app reaches it through the **Session pooler**, `aws-0-ap-southeast-2.pooler.supabase.com:5432`, database `postgres`, user `postgres.stihlplruxeqpdzlvjyk`.
  - The direct host `db.stihlplruxeqpdzlvjyk.supabase.co` is IPv6-only and can't be reached from this PC.
- **Connection:** `DATABASE_URL` in `.env.local`, which is git-ignored. Never put the password in a committed file.
  - URL-encode `@ # / :` in the password (`%40 %23 %2F %3A`).
  - `lib/db.js` turns on SSL automatically for any non-local host and strips `sslmode` from the URL.
- **Password resets:** resetting the database password in the Supabase dashboard breaks the app until `.env.local` is updated and the dev server is restarted. The `pg` Pool is cached on `globalThis`, so a running server keeps using the old connections.
  - After a reset, the pooler can take about 30 seconds to accept the new password.
- **Access path:** browser → Next.js API routes → `pg` Pool (`lib/db.js`, server-only) → Postgres.
  - The app does **not** use `@supabase/supabase-js` or the publishable key.
  - `NEXT_PUBLIC_SUPABASE_URL` and the `sb_publishable_…` key would only matter for Supabase Auth or Storage later.
- **Tables:** `lib/db.js` creates them on first use with `CREATE TABLE IF NOT EXISTS` (`SCHEMA`). `scripts/db-init.mjs` has the same SQL.
  - `students`: one row per student. Columns are `id` (text PK), `code` (unique, STU-###), `name`, `gender`, `dob` (date), `class_id`, `status`, `guardian`, `phone`, `address`, `created_at` and `updated_at`.
    - REST CRUD is in `app/api/students/route.js` (GET list, POST create, DELETE all) and `app/api/students/[id]/route.js` (GET, PUT, DELETE).
    - The server assigns `id` and `code`. Code numbering is `max+1` under an advisory lock, so a deleted top code gets reused.
    - The server validates name, guardian, phone, status, the date format, and that the class exists (classes live in `school_data`). A validation error returns 400; a missing student returns 404.
    - DATE columns come back as `'YYYY-MM-DD'` strings (type parser 1082).
  - `school_data`: everything else (settings, teachers, classes, attendance, exams, grades, fees, payments, books, notices, events, timetable) as one JSONB row, id 1.
    - It's served by `app/api/data/route.js` (GET/PUT), and the whole document is sent on every save.
    - `saveData` never stores `students`. If a PUT still includes a `students` array (a first-run import from the browser), those rows are imported with `ON CONFLICT DO NOTHING`.
    - `loadData` moves any legacy inline `students` into the table.
- **Client:**
  - `lib/api.js` `api(method, url, body)` throws an Error carrying the server's message.
  - `SchoolProvider` loads `/api/data` and `/api/students` and merges the students into `S.students`.
  - `persist` strips `students` and sends one PUT at a time, sending only the latest state next.
  - A failed load sets `loadError`, and `Shell` then shows a "Cannot reach the database" card.
  - A failed save shows a toast.
- **Student CRUD in the UI:** call the API first, then mirror the server's reply into `S` with `update()`.
  - `stuForm` uses `FormBody`'s async `action` prop.
  - Removing a student uses `d.confirmAsync` plus `d.removeStudent(id)`, which deletes the row and then cleans up that student's fees, payments, attendance, grades and loans in the document.
  - Settings → Clear all data calls `DELETE /api/students` and then resets the document, keeping the settings.
- **Local fallback:** the old local PostgreSQL 18 database (`sala_sms` on `localhost:5432`, user `postgres`) is still in `.env.local` as `LOCAL_DATABASE_URL`, plus a commented-out `DATABASE_URL`. It's no longer used.
- **Browser storage:** the role is still kept in `localStorage` (`sala-sms-v1-role`). Old `localStorage` data (`sala-sms-v1`) is imported only when the database has no `school_data` row.
- **Testing:** create, edit and delete only your own clearly named test rows (for example "ZZ Test …"). Never pick "the first row"; see the History entry below.
## Structure
- `app/layout.js`: fonts, `SchoolProvider`, `Shell`.
- `app/globals.css`: all styles, ported from the original `index.html`. Colors are tokens on `:root`, with dark-mode overrides.
- `app/<module>/page.js`: one route per module. `/` is the dashboard.
- `components/SchoolProvider.js`: the context, read with `useSchool()`. It provides:
  - `S`: the school data.
  - `update(fn)`: runs `fn` on a `structuredClone` draft. If `fn` returns a string, that string is a validation error and nothing is saved. Otherwise the draft is committed and persisted to `/api/data` (without students).
  - `ui`/`setUi`: filter state that is shared across pages.
  - `role`/`setRole`, `openModal`/`closeModal`, `toast`, `loadError`.
- `components/Shell.js`: sidebar nav (grouped, with attention counts), top bar, modal (Escape and backdrop close it, focus is restored), toast. If the current role can't access a route, it redirects to `/`. It shows the database error card when `loadError` is set.
- `components/dialogs.js`: the `useDialogs()` hook: `form`, `confirm`, `confirmAsync`, `stuForm`, `removeStudent`, `teaForm`, `clsForm`, `bookForm`, `examForm`, `stuProfile`, `reportCard`, `receipt`.
  - Form `onSave(values, D)` mutates the draft `D`. Look records up by id in `D`, never mutate `S`.
- `components/ui.js`: `Badge`, `LetterBadge`, `Icon`, `Options`, `Bars` (SVG bar chart), `DataTable` (a `#` prefix on a heading means a numeric column), `FormBody`, `ConfirmBody`.
  - `FormBody` takes either a sync `onSave(values, D)` or an async `action(values)` that resolves to an error string or nothing. `ConfirmBody` takes either `fn(D)` or an async `action()`. Both disable their button while busy.
- `lib/school.js`: date and money helpers, constants (`DAYS`, `PERIODS`, `SUBJECTS`, `STATUSES`, `PAGES`, `ROLES`, `ICONS`), `emptyData()`, and selectors that take `S` first (`rateFor`, `avgScore`, `feeStatus`, `latestExam`, …). It's shared by the client and the server; `lib/db.js` imports `STATUSES`.
- `lib/db.js`: server-only Postgres access (Pool, schema, `loadData`/`saveData`, student CRUD, `importStudents`, `ValidationError`).
- `lib/api.js`: the browser fetch helper.
- `app/api/data/route.js`, `app/api/students/route.js`, `app/api/students/[id]/route.js`: API routes (`dynamic = 'force-dynamic'`).
- `scripts/db-init.mjs`: `npm run db:init`, run with `node --env-file=.env.local`.

## Data model notes
- Attendance is keyed `"YYYY-MM-DD|classId"` and maps to `{studentId: 'P'|'L'|'A'}`.
- Grades are keyed `"examId|Subject|studentId"` and map to a score from 0 to 100.
- The timetable is `timetable[classId][Day]` and holds an array of subjects, one per period.
- Roles: Admin sees everything; Teacher and Accountant see subsets (see `ROLES`).
- Grade letters: A 85+, B 70–84, C 55–69, D 40–54, F below 40. The pass mark is in settings (default 40).

## History
- Originally a single `index.html` with vanilla JS, deployed on Vercel.
- **2026-09-26**: Converted to Next.js.
  - Hash routes became real routes, and HTML string templates became React components.
  - Removed `index.html` and `vercel.json`.
  - The production build passed. In a browser test, every page rendered, and attendance, grade entry, enrolment and role redirects all worked.
- **2026-09-26**: Removed the hardcoded sample data.
  - `seed()` became `emptyData()`, so the app starts empty except for the default settings.
  - The Settings button changed from "Reset sample data" to "Clear all data", which keeps the settings.
  - UI filter defaults no longer hardcode `c1` or `e2`.
  - Gradebook and Reports fall back to the latest past exam; Gradebook shows an empty state when there are no exams.
  - The Classes cards show the latest exam's average instead of a hardcoded midterm.
- **2026-09-26**: Moved storage from `localStorage` to local PostgreSQL 18.
  - Added the `pg` dependency, `lib/db.js`, `app/api/data/route.js`, `scripts/db-init.mjs` and `npm run db:init`.
  - Created the `sala_sms` database with the `school_data` table as a single JSONB document.
  - The provider loads and saves through the API, with serialized saves.
  - First load imports existing browser data into the database.
- **2026-09-26**: Students got real CRUD in their own `students` table.
  - Added the REST routes, server-side id and code generation, and validation.
  - Added the async `FormBody`/`ConfirmBody` paths, `confirmAsync` and `removeStudent`.
  - Clear all data now also empties the table.
  - Existing students were migrated out of the JSON document.
  - Verified: API status codes (201/200/400/404), and enrol, edit, reload and remove in the browser, with no console errors.
  - **Incident:** a test script updated and then deleted the user's real student STU-001 because it took the first row of the list. It was restored by hand with the same id and values (only `created_at` changed). Test only on rows the test creates.
- **2026-09-26**: Moved to Supabase.
  - Added automatic SSL for non-local hosts, and `db:init` now skips `CREATE DATABASE` for `postgres`.
  - Found the pooler host by probing regions (`aws-0-ap-southeast-2` answered with "password authentication failed", the others with "tenant not found").
  - Copied all local data into Supabase with a one-off script (1 `school_data` row, 3 students) and checked that the two databases matched.
  - The user reset the DB password twice during setup. The current one is in `.env.local`.
  - End-to-end test against Supabase: connection, tables, API reads, validation, create/read/update/delete of a throwaway "ZZ Supabase Test" student (then deleted), and the user's rows unchanged all passed.
  - Encryption was confirmed on this PC's side (TLS 1.3). The `pg_stat_ssl` check reports false through the pooler, and that's expected.
  - Checked in the Supabase Table Editor: both tables are present, with the user's students.
  - At the end of the session the database had 4 students (STU-001 to STU-004, the latest one "ContentPlan", added by the user), 1 class ("Grade 10A", real data), 1 teacher and 5 invoices.

## Open items
- **Security, not yet done:** Row Level Security (RLS) is off on `students` and `school_data`, and the Table Editor shows "Add RLS policy". Anyone with the project URL and the publishable key (which was shared in chat) may be able to read and write these tables through Supabase's Data API.
  - Proposed fix: `ALTER TABLE students ENABLE ROW LEVEL SECURITY; ALTER TABLE school_data ENABLE ROW LEVEL SECURITY;` with no policies. The app connects as `postgres`, which bypasses RLS, so it keeps working.
  - Waiting for the user to say yes.
- The DB password was pasted in chat. Consider resetting it once more and putting the new one straight into `.env.local`, then restarting the dev server.
- There's no login or authentication yet. Roles only switch in the UI. Add auth before deploying anywhere public. Supabase Auth is an option, and it would use `NEXT_PUBLIC_SUPABASE_URL` and the publishable key.
- For a Vercel deploy, set `DATABASE_URL` in the project's environment variables.
  - Use the **Transaction pooler** there: the same URL as `.env.local` but with port `6543`. Serverless instances each open their own `pg` Pool, and the Session pooler (5432) runs out of connections. 6543 was tested with the app's credentials and its `pg_advisory_xact_lock`, and both work.
  - No `vercel.json` is needed; Vercel detects Next.js.
- Other modules (teachers, classes, attendance, grades, fees, library, notices, calendar, timetable) still live in the single `school_data` JSONB document. Saves are last-write-wins across users. The same pattern as students could split them out one module at a time.
- The empty-data change was only partly checked in the browser. Not yet checked with no data: gradebook, timetable, fees, library, notices, calendar and reports.
- The dev server was started from the Claude session, so it stops when the session ends. Run `npm run dev` yourself.
- The Next.js conversion was committed and pushed to `origin/main` (github.com/sengchhunyeang/sala-management) on 2026-09-27. Make sure `.env.local` stays out of commits; `.gitignore` covers `.env*.local`.
