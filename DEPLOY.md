# Deploy

The app is deployed on Vercel from GitHub. **Pushing `main` to `origin` deploys it**: Vercel builds every push automatically.

- Repo: https://github.com/sengchhunyeang/sala-management (branch `main`)
- Host: Vercel, framework preset Next.js (set in `vercel.json`)
- Production database: Supabase (`school-management`, ref `stihlplruxeqpdzlvjyk`, region `ap-southeast-2`)

Run the commands below in PowerShell from the project folder.

## 1. Check

```powershell
git status --short     # see what will be committed
npm run build          # must pass; Vercel runs the same build
```

Before committing, make sure:

- `.env.local` is **not** in the list. It holds the database passwords, and `.gitignore` covers it with `.env*.local`.
- No test rows were left in the database (look for "ZZ Test …" students).

## 2. Commit and push

```powershell
git add -A
git status --short     # check again: no .env.local
git commit -m "Describe the change"
git push origin main
```

## 3. Verify

1. Open the Vercel dashboard → project → **Deployments**, and wait for the new deployment to show **Ready**.
   - If it fails, open the build log. `STATIC_BUILD_NO_OUT_DIR` means the framework preset isn't Next.js: check `vercel.json` and the project settings.
2. Open the production site:
   - The dashboard loads, with no "Cannot reach the database" card.
   - `/students` lists the students.
   - `/api/data` and `/api/students` return JSON.

## Vercel environment variables (one-time setup)

Set these in Vercel → project → Settings → **Environment Variables**:

| Name | Value |
|---|---|
| `DATABASE_URL` | The Supabase **Transaction pooler** connection string, port **6543**: `postgresql://postgres.stihlplruxeqpdzlvjyk:<password>@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres` |

- Use port 6543, not 5432. The Session pooler (5432) runs out of connections on serverless.
- URL-encode `@ # / :` in the password as `%40 %23 %2F %3A`.
- The password is in `.env.local`, in the commented-out Supabase line, and in the Supabase dashboard → Project Settings → Database. Never commit it.
- After changing a variable, redeploy: Deployments → ⋯ → **Redeploy**.

## Things to know

- **Local and production use different databases.** Local dev uses `sala_sms` on localhost, and production uses Supabase. Data you enter locally does not appear in production.
- **The first deploy of the per-module tables migrates Supabase.** Supabase still has the old single `school_data` row. The first request copies it into the new tables and renames the old table `school_data_legacy`, which is kept as a backup. Check the data afterwards.
- **There is no login yet.** Anyone with the URL can read and change the data, including through `/api-docs` (Swagger), which can delete every student. Keep the URL private until there's auth.
- **Rollback:** in Vercel → Deployments, open an earlier Ready deployment → ⋯ → **Promote to Production**. Or revert in git and push:

  ```powershell
  git revert HEAD
  git push origin main
  ```
