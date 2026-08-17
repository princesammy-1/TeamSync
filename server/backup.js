/**
 * Backup the TeamSync data store.
 *
 * When SQLite persistence is enabled (TEAMSYNC_USE_SQLITE=true) the source is
 * server/.data/teamsync.db (or TEAMSYNC_DATABASE_PATH). We create a consistent
 * snapshot with SQLite's VACUUM INTO, which produces a standalone copy even
 * while the app is running.
 *
 * When the JSON store is used, server/.data/users.json is copied instead.
 *
 * Backups are written to server/.data/backups (or TEAMSYNC_BACKUP_DIR) and
 * pruned so only the newest TEAMSYNC_BACKUP_KEEP (default 14) are retained.
 *
 * Usage:
 *   node server/backup.js            # one-shot backup
 *   npm run backup                   # same
 *
 * Configure pruning / location via env vars, or cron it in production:
 *   0 2 * * * cd /path/to/teamsync && node server/backup.js >> /var/log/teamsync-backup.log 2>&1
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

import { createLogger } from "./logger.js";
import { isPostgresPersistenceEnabled } from "./store.js";

const logger = createLogger();

const SERVER_DIR = dirname(fileURLToPath(import.meta.url));

function sourceDatabasePath() {
  return (
    process.env.TEAMSYNC_DATABASE_PATH ||
    join(SERVER_DIR, ".data", "teamsync.db")
  );
}

function sourceJsonPath() {
  return (
    process.env.TEAMSYNC_DATA_FILE ||
    join(SERVER_DIR, ".data", "users.json")
  );
}

function backupDirectory() {
  return (
    process.env.TEAMSYNC_BACKUP_DIR ||
    join(SERVER_DIR, ".data", "backups")
  );
}

function timestampName(extension) {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace("T", "-")
    .replace(/\..+/, "");
  return `teamsync-${stamp}${extension}`;
}

function pruneBackups(directory, keep) {
  const files = (() => {
    try {
      return readdirSync(directory)
        .filter((name) => name.startsWith("teamsync-"))
        .map((name) => ({ name, time: statSync(join(directory, name)).mtimeMs }))
        .sort((a, b) => b.time - a.time);
    } catch {
      return [];
    }
  })();

  for (const file of files.slice(keep)) {
    unlinkSync(join(directory, file.name));
    logger.info("Pruned old backup", { file: file.name });
  }

  return files.length;
}

export function runBackup() {
  const dir = backupDirectory();
  mkdirSync(dir, { recursive: true });

  if (isPostgresPersistenceEnabled()) {
    logger.warn(
      "Postgres mode: local file backups are disabled; rely on the managed database provider's backups",
    );
    return { ok: true, reason: "postgres-managed" };
  }

  const useSqlite = process.env.TEAMSYNC_USE_SQLITE === "true";
  const keep = Number(process.env.TEAMSYNC_BACKUP_KEEP) || 14;

  if (useSqlite) {
    const source = sourceDatabasePath();
    if (!existsSync(source)) {
      logger.warn("No SQLite database found; nothing to back up", { source });
      return { ok: false, reason: "missing-database" };
    }

    const destination = join(dir, timestampName(".db"));
    // VACUUM INTO requires the target to not already exist.
    if (existsSync(destination)) unlinkSync(destination);
    const db = new DatabaseSync(source);
    try {
      db.exec(`VACUUM INTO '${destination.replace(/'/g, "''")}'`);
    } finally {
      db.close();
    }

    const size = statSync(destination).size;
    const total = pruneBackups(dir, keep);
    logger.info("SQLite backup created", {
      destination: basename(destination),
      bytes: size,
      retained: total,
    });
    return { ok: true, destination, bytes: size, retained: total };
  }

  const source = sourceJsonPath();
  if (!existsSync(source)) {
    logger.warn("No JSON store found; nothing to back up", { source });
    return { ok: false, reason: "missing-store" };
  }

  const destination = join(dir, timestampName(".json"));
  writeFileSync(destination, readFileSync(source));
  const size = statSync(destination).size;
  const total = pruneBackups(dir, keep);
  logger.info("JSON store backup created", {
    destination: basename(destination),
    bytes: size,
    retained: total,
  });
  return { ok: true, destination, bytes: size, retained: total };
}

const isDirectRun = process.argv[1]
  ? resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Milliseconds until the next scheduled backup hour (UTC). Used to arm the
 * in-process backup timer. Returns 0 when `now` is exactly the target hour.
 */
export function nextBackupDelayMs(hourUtc = 2, now = new Date()) {
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hourUtc,
      0,
      0,
      0,
    ),
  );
  if (next.getTime() < now.getTime()) {
    next.setTime(next.getTime() + MS_PER_DAY);
  }
  return next.getTime() - now.getTime();
}

/**
 * Arm a daily backup that runs inside the service process. Render cron jobs
 * cannot access a service's persistent disk, so on Render this is the only
 * way to snapshot the SQLite database on the mounted disk. Returns a function
 * that stops the schedule (useful in tests).
 */
export function scheduleBackups({ hourUtc = 2, log = logger } = {}) {
  let timer;
  function arm() {
    timer = setTimeout(() => {
      try {
        runBackup();
      } catch (error) {
        log.error("Scheduled backup failed", { error: error.message });
      }
      arm();
    }, nextBackupDelayMs(hourUtc));
  }
  arm();
  return () => clearTimeout(timer);
}

if (isDirectRun) {
  const result = runBackup();
  if (!result.ok) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}