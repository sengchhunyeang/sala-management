# sala-management

Sala School Management, a Next.js (App Router) app for students, teachers, classes, attendance, grades, timetable, fees, library, notices, calendar and reports.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Structure

- `app/` – one route per module (`/`, `/students`, `/attendance`, …), plus `layout.js` and `globals.css`
- `components/SchoolProvider.js` – app state (school data, filters, role, modal, toast), persisted to `localStorage`
- `components/Shell.js` – sidebar, top bar, role-based access, modal and toast
- `components/dialogs.js` – forms, profile, report card and receipt dialogs
- `components/ui.js` – shared UI pieces (badges, bar chart, tables, form/confirm bodies)
- `lib/school.js` – sample data, constants and selectors

Data is stored in the browser only (`localStorage` key `sala-sms-v1`).
