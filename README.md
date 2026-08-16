# TeamSync

TeamSync is a collaboration workspace for teams to manage tasks, meetings, files, chat, and team invites in one calmer workflow.

## What is included

- React + Vite frontend (route-level code splitting)
- Express API backend for auth, workspace, users, tasks, meetings, and searches
- Demo workspace seeded with founder and team data
- Secure auth: bcrypt password hashing, JWT sessions (httpOnly cookie + Bearer), password reset, session invalidation on password change
- Role-based access control (owner / admin / member / guest) enforced on the API and in the UI
- Email delivery for invitations and password resets (Resend / Mailgun / SMTP, with console fallback and rate limiting)
- Founder/admin dashboard with usage metrics and activity
- SQLite persistence path for user/auth data, plus automated backups
- Structured JSON logging with secret redaction and optional error reporting

## Local setup

1. Install dependencies
   npm install

2. Create your environment file
   Copy .env.example to .env and adjust values if needed.

3. Start the app
   npm run dev

This runs:

- Vite frontend on http://localhost:4173
- Express API on http://localhost:3001

## Demo login

- Email: adrian@teamsync.app
- Password: demo1234

## Production readiness notes

TeamSync is launch-ready for a small team:

- Real auth: bcrypt password hashing, JWT sessions, password reset + change, invite flow with hashed tokens.
- RBAC enforced server-side on all privileged endpoints.
- Email delivery (invite + reset) via Resend/Mailgun/SMTP, console fallback for local dev.
- Persistent SQLite store for user/auth data with automated daily backups.
- Structured logging, request tracing, and optional external error reporting.
- Admin dashboard for the founder.
- Deployment configs for Render (API + backups) and Vercel (frontend).

### Suggested production hosting stack

- Frontend: Vercel
- Backend API: Render (render.yaml included)
- Database: SQLite on a persistent disk today; migrate to Supabase/Neon Postgres before scaling (docs/DATABASE.md)
- Secrets: environment variables managed in the host dashboard

### Deployment

Follow the step-by-step guide in `docs/DEPLOYMENT.md`.

## Documentation

- `docs/API.md` — API reference and RBAC summary
- `docs/DEPLOYMENT.md` — Render + Vercel deployment guide
- `docs/DATABASE.md` — persistence model and Postgres migration plan
- `docs/DISASTER_RECOVERY.md` — backups and restore procedures
- `docs/TERMS.md`, `docs/PRIVACY.md` — legal docs

## Key scripts

- npm run dev — local frontend + backend
- npm run build — production frontend build
- npm run test:server — backend regression tests (21)
- npm run test:e2e — Playwright browser tests (10, boots API + built frontend)
- npm run backup — one-shot data backup
- npm run start — backend server entrypoint

## Security baseline currently in place

- security headers on API responses (CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy)
- CORS origin restrictions
- request rate limiting + per-recipient email rate limiting
- bcrypt password hashing (never plaintext)
- httpOnly session cookies, `SameSite=None; Secure` in production
- opaque invite/reset tokens stored only as SHA-256 hashes
- secret redaction in structured logs
- API refuses to start in production without SESSION_SECRET
- no secrets checked into source control

## Founder note

This project is structured to be extended into a real SaaS product. Auth,
RBAC, email, admin tooling, backups, and deployment configs are in place. The
remaining work before public launch is deploying with real accounts/secrets
(see `docs/DEPLOYMENT.md`) and, before scaling to multiple API instances,
migrating to a managed Postgres database (see `docs/DATABASE.md`).
