# Disaster Recovery & Backup

## What is persisted

TeamSync currently persists **user accounts and auth data** (bcrypt password
hashes, session versions, invite/password-reset tokens). Everything else
(workspace, teams, tasks, chats, meetings, events, files metadata,
notifications, activity log) is seeded from `src/data/index.js` at startup.

Persistence mode is controlled by `TEAMSYNC_USE_SQLITE`:

| `TEAMSYNC_USE_SQLITE` | Store location | Env override |
| --- | --- | --- |
| `true` | `server/.data/teamsync.db` (SQLite) | `TEAMSYNC_DATABASE_PATH` |
| unset/false | `server/.data/users.json` (JSON) | `TEAMSYNC_DATA_FILE` |

Both locations live under `server/.data/`, which is git-ignored.

## Taking backups

Run a one-shot backup:

```sh
npm run backup
```

This writes a consistent snapshot to `server/.data/backups/` (override with
`TEAMSYNC_BACKUP_DIR`) named `teamsync-YYYYMMDD-HHMMSS.db` (or `.json`).

- SQLite mode uses `VACUUM INTO`, which produces a consistent copy **even while
  the app is running** — no downtime required.
- JSON mode is a simple file copy.

Old snapshots are pruned automatically; keep the newest
`TEAMSYNC_BACKUP_KEEP` (default `14`).

### Scheduling

- **On Render**: the API arms a daily in-process backup automatically when
  `TEAMSYNC_PERSIST=true` (see `docs/DEPLOYMENT.md`). Render cron jobs cannot
  access the service's persistent disk, so no external cron is needed.
- **Self-hosted**: recommended cron (daily, 02:00 UTC). Logs go to the app's
  JSON logger.

```
0 2 * * * cd /path/to/teamsync && node server/backup.js >> /var/log/teamsync-backup.log 2>&1
```

### Off-site copies

For real durability, copy `server/.data/backups/` off the box after each run:

- S3 / GCS / B2: `aws s3 sync server/.data/backups s3://teamsync-backups/`
- Restic/Rclone: `rclone sync server/.data/backups remote:teamsync-backups`

## Restoring

### SQLite mode

1. Stop the API (`Ctrl+C` or `systemctl stop teamsync`).
2. Replace the database:
   ```sh
   cp server/.data/backups/teamsync-20260815-123154.db server/.data/teamsync.db
   ```
   (or set `TEAMSYNC_DATABASE_PATH` to point at the snapshot directly).
3. Start the API. On boot, `createStore({ persist: true })` loads users from
   the database; seed data for non-persisted collections is re-seeded.

### JSON mode

1. Stop the API.
2. ```sh
   cp server/.data/backups/teamsync-20260815-123154.json server/.data/users.json
   ```
3. Start the API.

### Verification

After restoring, confirm:

- `GET /api/ready` returns `{"ok":true,"ready":true,"persist":true}`.
- Log in with a known account: `POST /api/auth/login`.
- `GET /api/users` lists the expected members.

## Recovery time objectives

| Scenario | Impact | Recovery |
| --- | --- | --- |
| `.db`/`.json` lost | New registrations/invites/resets lost since last backup | Restore newest snapshot, accept ≤24h (or last cron run) data loss |
| Instance/container destroyed | Same as above | Redeploy from git; copy backups dir, restore snapshot |
| Whole region/account lost | Everything unless off-site backups exist | Restore from off-site copy |

Because non-auth data is re-seeded from source at boot, a full restore only
requires the auth snapshot plus a redeploy of the latest build.

## Production note

The in-process SQLite store is single-instance. For multi-instance
deployments, see `docs/DATABASE.md` — migrate to a managed Postgres instance
so all replicas share one database and the snapshot/restore story becomes the
managed provider's responsibility.