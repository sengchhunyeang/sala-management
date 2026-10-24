# Sala School Management

School management app for Sala Secondary School (Cambodia): students, teachers, classes, attendance, exams and grades, timetable, reports and settings. Theme is Navy, White & Red (since 2026-10-17; was Forest Green & Copper), with Khmer-friendly fonts. The logo comes from `LogoSchool.jpg` in the root (a watermarked 123RF stock preview, kept out of git on purpose; it needs a licence or a replacement before real public use). Crops: `app/icon.png` (favicon), `app/apple-icon.png`, `public/logo-mark.png` (sidebar `.mark`) and `public/logo.png` (database-error card). It was added, reverted to the old "ស" `icon.svg`, and re-added on 2026-10-24 at the user's request. Phones (≤720px) get a bottom tab bar (`.tabbar` in `Shell.js`, `TABS`) with the first four pages the role can open plus "More", which opens the sidebar drawer; the burger is hidden there. Tables become labelled cards at ≤900px (`.stack`). In `globals.css` the token names are historical: `--navy*` is navy, `--gold`/`--gold-2` hold the red accent, and `--red` is the deeper danger red.

## Stack
- Next.js 16 (App Router, Turbopack), React 19, plain JavaScript (no TypeScript), no CSS framework.
- Every page is a client component. Fonts come from `next/font/google`: Kantumruy Pro (`--f-body`, includes the Khmer subset) and Bricolage Grotesque (`--f-display`).
- Commands: `npm run dev` (port 3000), `npm run build`, `npm start`, `npm run db:init` (creates the tables; also creates the database when its name isn't `postgres`).
- Development is on Windows. Use the PowerShell tool; Git Bash here has no `git` or `head`.

## Database (Local PostgreSQL 18)
- **Server:** PostgreSQL 18 on `localhost:5432`, database `sala_sms`, user `postgres` (password in `.env.local`).
- **Connection:** `DATABASE_URL` in `.env.local`, which is git-ignored. Never put the password in a committed file.
  - `lib/db.js` turns on SSL automatically for any non-local host and strips `sslmode` from the URL; SSL is off for localhost.
- **Previous Supabase setup:** Supabase project `school-management`, ref `stihlplruxeqpdzlvjyk`, region `ap-southeast-2` is commented out in `.env.local`. Uncomment and swap to go back to it.
- **Access path:** browser → Next.js API routes → `pg` Pool (`lib/db.js`, server-only) → Postgres.
  - The app does **not** use `@supabase/supabase-js` or the publishable key.
  - `NEXT_PUBLIC_SUPABASE_URL` and the `sb_publishable_…` key would only matter for Supabase Auth or Storage later.
- **Tables:** `lib/db.js` creates them on first use with `CREATE TABLE IF NOT EXISTS` (`SCHEMA`). `scripts/db-init.mjs` has the same SQL.
  - `students`: one row per student. Columns are `id` (text PK), `code` (unique, STU-###), `name`, `gender`, `dob` (date), `class_id`, `status`, `guardian`, `phone`, `address`, `created_at` and `updated_at`.
    - REST CRUD is in `app/api/students/route.js` (GET list, POST create, DELETE all) and `app/api/students/[id]/route.js` (GET, PUT, DELETE).
    - The server assigns `id` and `code`. Code numbering is `max+1` under an advisory lock, so a deleted top code gets reused.
    - The server validates name, guardian, phone, status, the date format, and that the class exists (in the `classes` table). A validation error returns 400; a missing student returns 404.
    - DATE columns come back as `'YYYY-MM-DD'` strings (type parser 1082); NUMERIC comes back as JS numbers (1700).
  - **One table per module** (since 2026-09-27): `settings` (single row, id 1), `teachers`, `classes`, `exams`, `attendance` (PK date+class+student, mark P/L/A), `grades` (PK exam+subject+student, score 0–100), `fees`, `payments` (no UI since 2026-10-17, data kept), `books`, `loans` (with `book_id`), `notices`, `events` (these four have had no UI since 2026-10-17, data kept), `timetable` (PK class+day+period, only non-empty slots).
    - SQL is in `lib/schema.mjs` (used by `lib/db.js` and `scripts/db-init.mjs`). The field ↔ column map is `TABLES` in `lib/tables.js`; keep the two in sync. No foreign keys: removed records can leave orphans the UI shows as "Removed student" etc.
    - `lib/tables.js` is shared: `flatten(S)` turns the document into `{table: {key: row}}`, `diffRows(prev, next)` gives `{table: {upsert, delete}}`, and `assemble(rows)` rebuilds the document on load.
    - `app/api/data/route.js`: GET returns the assembled document (null when `settings` is empty). PUT takes `{changes}` (applied in one transaction, all or nothing) or `{import: document}` for a first run (students included). Unknown tables, missing keys and constraint violations return 400.
    - Migration: on first use, an old `school_data` JSONB row is copied into the tables and the table is renamed `school_data_legacy` (kept as a backup). Local `sala_sms` was migrated on 2026-09-27; Supabase still has the old `school_data` layout and migrates the first time the app connects to it.
- **Client:**
  - `lib/api.js` `api(method, url, body)` throws an Error carrying the server's message.
  - `SchoolProvider` loads `/api/data` and `/api/students` and merges the students into `S.students`.
  - `persist` diffs `flatten(state)` against the last saved `flatten()` and PUTs only the changed rows, one request at a time. The baseline only advances after a successful save, so a failed save is retried with the next change.
  - A failed load sets `loadError`, and `Shell` then shows a "Cannot reach the database" card.
  - A failed save shows a toast.
- **Student CRUD in the UI:** call the API first, then mirror the server's reply into `S` with `update()`.
  - `stuForm` uses `FormBody`'s async `action` prop.
  - Removing a student uses `d.confirmAsync` plus `d.removeStudent(id)`, which deletes the row and then cleans up that student's fees, payments, attendance, grades and loans in the document.
  - Settings → Clear all data calls `DELETE /api/students` and then resets the document, keeping the settings.
- **Local database (active for local dev since 2026-09-27):** `.env.local` `DATABASE_URL` points at local PostgreSQL 18 (`sala_sms` on `localhost:5432`, user `postgres`); the Supabase URL is commented out just above it. Swap the `#` to go back to Supabase and restart the dev server. The two databases are not synced: at the switch, local had 3 students and Supabase had 5. Vercel still needs the Supabase URL (port 6543).
- **Browser storage:** the role is still kept in `localStorage` (`sala-sms-v1-role`). Old `localStorage` data (`sala-sms-v1`) is imported only when the database has no `settings` row.
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
- `lib/db.js`: server-only Postgres access (Pool, legacy migration, `loadData`/`saveChanges`/`importDocument`, student CRUD, `importStudents`, `ValidationError`).
- `lib/tables.js`: table map and `flatten`/`diffRows`/`assemble` (client and server). `lib/schema.mjs`: the `CREATE TABLE` SQL.
- `lib/api.js`: the browser fetch helper.
- `app/api/data/route.js`, `app/api/students/route.js`, `app/api/students/[id]/route.js`: API routes (`dynamic = 'force-dynamic'`).
- `scripts/db-init.mjs`: `npm run db:init`, run with `node --env-file=.env.local`.
- Swagger (students API only): `lib/openapi.js` is the OpenAPI 3 spec, served as JSON at `/api/openapi`. `app/api-docs/route.js` serves Swagger UI at `/api-docs` (a route handler, so it renders outside the Shell; it loads `swagger-ui-dist` from unpkg). Update the spec when the student routes or `clean()` change.

## PWA (since 2026-10-24)
- `app/manifest.js` → `/manifest.webmanifest` (standalone, navy theme, icons in `public/icons/`: 192, 512 and a maskable 512, all cropped from `LogoSchool.jpg`). `layout.js` sets `appleWebApp` and the `viewport` theme colour.
- `public/sw.js` is hand-written (no plugin; `next-pwa` doesn't work with Turbopack). Cache-first for `/_next/static`, icons and images; network-first for page navigations with a cached fallback; `/api/*` is never cached. Bump `VERSION` in it after changing it. `next.config.mjs` serves it with `no-cache`.
- `components/PwaSetup.js` `usePwa()` registers the worker in **production builds only** (so `npm run dev` never serves a stale cache) and reports `canPrompt`, `installed` and `ios`. `Shell` puts an "Install app" button in the top bar, hidden when running as the installed app. Click: opens the browser's install prompt (Chrome, Edge, Android); otherwise (iPhone Safari, Firefox) shows `InstallHelp` steps in a modal.
- Offline, the app shell opens from cache and `Shell` shows "You are offline" instead of the database message. Data can't be read or saved offline.
- To test: `npm run build` then `npx next start -p 3001` (the dev server on 3000 has no service worker).

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
- **2026-09-27**: Switched local dev to the local `sala_sms` database and split every module into its own table.
  - Added `lib/tables.js` and `lib/schema.mjs`; `/api/data` now takes changed rows instead of the whole document.
  - The running dev server migrated `sala_sms` as soon as the code changed (the user had the app open); `school_data` became `school_data_legacy`. Counts matched the old document (settings, 1 teacher, 1 class, 3 invoices).
  - Verified: an API test that writes, updates and deletes a "zz" row in every table (plus bad mark, score > 100 and unknown table → 400, and rollback on failure) left the database exactly as before; unit tests of `diffRows` for remove student, timetable, grade clear and Clear all data; production build; all 13 pages load. Not yet clicked through in a browser.
- **2026-09-27 (session 2)**: Switched back to local PostgreSQL for development.
  - The user provided local database credentials (PostgreSQL 18, `localhost:5432`, user `postgres`, database `sala_sms`). `.env.local` already had these as the active `DATABASE_URL`.
  - Commented out the Supabase connection string in `.env.local`; it can be restored by swapping the comments.
  - Full codebase review: read every file (all 30+ source files) to understand the architecture, data flow, component structure, and database schema end to end. Updated the Database section of this file to reflect the local setup.

- **2026-10-17**: Retheme to Navy, White & Red, with a favicon (`app/icon.svg`). Removed the Fees & payments feature from the UI: the `/fees` page, the nav entry, the Accountant role's access, the dashboard fee stat and overdue to-do, the Reports fee chart, the student profile balance, the receipt dialog, the auto tuition invoice on enrolment, and `feeStatus`. The `fees`/`payments` tables, the `TABLES` mapping and the 3 invoices are kept on purpose, so the data still loads and the feature can come back. `removeStudent` still cleans up a student's invoices. Production build passed.
- **2026-10-17**: Removed the whole Operations group (Library, Notices, Calendar) from the UI the same way: the routes, nav entries, role access, `bookForm`, `overdueLoans`, the dashboard's library to-do, Latest notices and Coming up panels, the sidebar library count, the `cal` UI state and the `.notice`/`.cal`/`.ev` styles. Scheduling an exam no longer adds a calendar event, and the dashboard's next-exam link now goes to `/gradebook`. The `books`, `loans`, `notices` and `events` tables and their `TABLES` mapping are kept. Production build passed.

- **2026-10-24**: On a new PC (no local Postgres, no `.env.local`), connected to **Neon** (project `snowy-art-18666136`, branch `production`, `ap-southeast-1`, pooled host, database `neondb`). `.env.local` now holds only the Neon `DATABASE_URL`. `lib/db.js` and `db-init.mjs` now strip both `sslmode` and `channel_binding` via `URL` parsing (Neon URLs carry both). Neon started empty; Supabase and the old PC's local data were not copied. Verified: `db:init`, production build, and students API create/read/update/delete (plus a 400 and a 404) on a "ZZ Neon Test" row, then deleted.

## Deploy
- Follow `DEPLOY.md`: run `npm run build`, commit, then `git push origin main`. Vercel builds every push to `main`.

## Open items
- There's no login or authentication yet. Roles only switch in the UI. Add auth before deploying anywhere public.
- For a Vercel deploy, set `DATABASE_URL` in the project's environment variables. Use the Supabase connection string (currently commented out in `.env.local`).
  - Use the **Transaction pooler** (port `6543`) for serverless; the Session pooler (5432) runs out of connections.
  - `vercel.json` sets `framework: nextjs`. The Vercel project was still on the static preset from the `index.html` days, so builds failed with `STATIC_BUILD_NO_OUT_DIR` (no `public` folder) until 2026-10-17.
- Row-level saves still overwrite a row if two users edit the same record at once (last write wins per row). The browser also doesn't see other users' changes until a reload.
- The empty-data change was only partly checked in the browser. Not yet checked with no data: gradebook, timetable, fees, library, notices, calendar and reports.
- None of the recent work is committed to git yet (branch `main`). Make sure `.env.local` stays out of commits; `.gitignore` covers `.env*.local`.
