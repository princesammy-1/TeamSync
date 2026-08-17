# Database: persistence model & managed upgrade path

## Current model

TeamSync runs a **single-instance, in-process store**. All collections are
loaded from seed data (`src/data/index.js`) into memory at boot. Only **users /
auth records** are persisted, in one of three modes (checked in this order):

| Mode | Backing store | Env vars |
| --- | --- | --- |
| Postgres (production) | Managed Postgres (`users` table, JSONB payload) | `DATABASE_URL` (auto-selected unless `TEAMSYNC_USE_SQLITE=true`; `TEAMSYNC_USE_POSTGRES=true` also forces it) |
| SQLite (local/tests) | `server/.data/teamsync.db` via `node:sqlite` | `TEAMSYNC_USE_SQLITE=true`, `TEAMSYNC_DATABASE_PATH` |
| JSON (default) | `server/.data/users.json` | `TEAMSYNC_DATA_FILE` |

`saveUsers(store)` is the single write funnel in all three modes; for Postgres
it is a fire-and-forget facade over a connection pool (see `server/store.js`),
so the call sites in `server/index.js` need no changes. Reads happen once at
boot via `loadPersistedUsersFromPostgres()` when Postgres is enabled.

The store object is created by `createStore()` and exposes plain arrays:

```
workspace, users, teams, tasks, chatRooms, chatMessages,
meetings, events, files, notifications, activities
```

This design is great for the bootcamp/demo stage (zero infra, restart = fresh
seed data) but is **not multi-instance safe**: each API replica has its own
copy of state, and mutations never cross replicas.

## When to migrate

Migrate to a managed Postgres database when you need **any** of:

- Horizontal scaling (2+ API instances behind a load balancer).
- Zero-data-loss persistence for all collections (not just users).
- Point-in-time recovery, managed backups, and failover.
- Fine-grained audit of chat, tasks, files, and meetings.

Recommended managed options:
- **Render Postgres** — same vendor as the API (see `render.yaml`); free tier available.
- **Supabase** — generous free tier, has Postgres + auth + storage.
- **Neon** — serverless Postgres with branching (great for preview deploys).

## Migration plan

### Step 1 — Schema

Create these tables (users must store the same columns `sanitizeUser` /
`requireAuth` rely on today):

```sql
CREATE TABLE users (
  id             TEXT PRIMARY KEY,
  email          TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  password       TEXT NOT NULL,          -- bcrypt hash
  role           TEXT NOT NULL DEFAULT 'member',
  status         TEXT NOT NULL DEFAULT 'active',
  pending        INTEGER NOT NULL DEFAULT 0,
  invite         TEXT,                    -- SHA-256 hash of invite token
  password_reset TEXT,                    -- SHA-256 hash of reset token
  session_version INTEGER NOT NULL DEFAULT 0,
  ...collections...,                      -- workspace/team columns for other tables
  created_at     TEXT NOT NULL
);
-- plus teams, tasks, chat_rooms, chat_messages, meetings, events,
-- files, notifications, activities
```

Store JSON-shaped extra fields as `TEXT` columns (serialized), matching the
existing in-memory shape to keep the API code stable.

### Step 2 — Connection pool

Add `pg` and build a single `Pool` in `server/db.js`:

```js
import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export default pool;
```

Use `pool.query(...)` in transaction wrappers and replace every
`store.collection` read/write in `server/index.js` with a query. Keep
`createStore()`'s shape by building the same arrays from the rows on each
request (or introduce a thin data-access layer returning the same shapes).

### Step 3 — Flip the env switch

- Set `DATABASE_URL` on Render/Vercel (render.yaml already reserves it).
- Keep the JSON/SQLite path behind a flag so local dev and the test suite
  still run with zero infra:
  ```sh
  # local dev (unchanged)
  npm run dev
  # production (managed DB)
  DATABASE_URL=postgres://... npm start
  ```

### Step 4 — Seed once, then delete the in-memory seed fallback

Write a one-off `server/scripts/seed.js` that upserts `src/data/index.js`
content into Postgres, then gate `createStore()` seeding behind
`process.env.NODE_ENV !== "production"`.

## Compatibility notes

- `authenticateUser`, `requireAuth`, and `sanitizeUser` operate on user
  objects — keep the same field names (`sessionVersion`, `pending`, `invite`,
  `passwordReset`) or adapt `server/auth.js`.
- `saveUsers(store)` is the single write funnel today; make it a thin facade
  over the pool so the call sites in `server/index.js` need no changes.
- bcrypt hashes are portable — move them into the `users.password` column as-is.
- The backup story becomes: enable the managed provider's automated backups
  and point `docs/DISASTER_RECOVERY.md` at provider tooling instead of
  `server/backup.js`.

## Testing

Keep the in-memory/SQLite path as the fast test double and add a
`DATABASE_URL`-gated suite (`describe.skip` unless `DATABASE_URL` is set) that
runs the same API tests against Postgres in CI.