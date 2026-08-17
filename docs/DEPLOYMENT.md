# Deployment guide

TeamSync is deployed as two services:

- **API** (Express + Postgres persistence) — deployed on **Render**.
- **Frontend** (Vite static build) — deployed on **Vercel**.

`render.yaml` and `vercel.json` in the repo root drive both. The E2E suite
(`npm run test:e2e`) boots the real API + built frontend to validate the same
flows in CI or locally.

## 1. Deploy the API to Render

1. Push the repo to GitHub.
2. In Render, **New → Blueprint**, select the repo. Render reads `render.yaml`
   and creates the web service plus the Postgres database.
3. Set the `sync: false` env vars (Render marks them for manual entry):

   | Var | Value |
   | --- | --- |
   | `SESSION_SECRET` | strong random string (`openssl rand -hex 32`) |
   | `TEAMSYNC_ALLOWED_ORIGINS` | your frontend origin(s), e.g. `https://teamsync.vercel.app` |
   | `TEAMSYNC_APP_URL` | your frontend origin (used in email links) |
   | `EMAIL_PROVIDER` | `resend`, `mailgun`, or `smtp` (leave blank = console logs) |
   | `RESEND_API_KEY` / `MAILGUN_*` / `SMTP_*` / `EMAIL_FROM` | provider keys |
   | `ERROR_REPORTING_URL` | optional external error endpoint |

   > The API **refuses to start** in production without `SESSION_SECRET`
   > (fail-fast, see `server/auth.js`).

4. Render provisions a free managed **Postgres** database (`teamsync-db`) and
   injects its connection string as `DATABASE_URL`. The API detects Postgres
   from `DATABASE_URL` (`TEAMSYNC_USE_SQLITE=false`) and persists users/auth
   records there, so registrations and invite/reset tokens survive restarts
   and redeploys. No persistent disk is needed — this keeps the service on the
   free plan.

### Backups

The managed Postgres owns the durable copy of auth records, so no in-process
file backups run in production. The SQLite/JSON local paths still support
`npm run backup` (see [`docs/DISASTER_RECOVERY.md`](./DISASTER_RECOVERY.md));
in Postgres mode the command logs a notice to rely on the provider's backups.
Export data manually with `pg_dump` against `DATABASE_URL` if you need a
snapshot before the provider's next backup window.

## 2. Deploy the frontend to Vercel

1. In Vercel, **New Project → Import** the repo (framework preset: Vite).
2. Add the env var `VITE_API_BASE_URL` pointing at the Render API origin,
   e.g. `https://teamsync-api.onrender.com`.
3. Build settings default to `npm run build` with output `dist`. `vercel.json`
   rewrites all routes to `index.html` for client-side routing.
4. Deploy. Every push to the default branch triggers a redeploy.

### CORS & cookies across origins

- The frontend on Vercel and the API on Render are **cross-origin**, so:
  - `TEAMSYNC_ALLOWED_ORIGINS` must include the Vercel origin exactly.
  - The API sets cookies with `SameSite=None; Secure` in production
    (`server/auth.js`), which works cross-origin over HTTPS.
  - The frontend also sends `Authorization: Bearer <token>` alongside cookies,
    so auth works even where third-party cookies are blocked.

## 3. Production readiness checks

After both deploys:

- `GET https://teamsync-api.onrender.com/api/ready` → `{"ok":true,"persist":true}`.
- Register a new account on the live site; confirm the row persists after a
  Render restart.
- Send yourself a password reset from `https://teamsync.vercel.app/forgot-password`
  and confirm the email link (needs `EMAIL_PROVIDER` configured) points to the
  live frontend via `TEAMSYNC_APP_URL`.
- Trigger a failed request and confirm `LOG_LEVEL` output appears in Render logs
  and, if configured, `ERROR_REPORTING_URL` receives the error.

## 4. Scaling beyond a single instance

The API keeps the full store in memory and persists only users/auth to Postgres,
so it is single-instance today. Before scaling to multiple API replicas, migrate
the remaining collections (tasks, chat, meetings, files) to Postgres. The plan
and schema are documented in [`docs/DATABASE.md`](./DATABASE.md).