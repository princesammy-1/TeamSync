import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";
import bcrypt from "bcryptjs";
import { seedData } from "../src/data/index.js";

const BCRYPT_ROUNDS = 10;

function isBcryptHash(value) {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);
}

export function hashPassword(password) {
  return bcrypt.hashSync(String(password ?? ""), BCRYPT_ROUNDS);
}

export function verifyPassword(password, storedHash) {
  if (!isBcryptHash(storedHash)) return false;
  return bcrypt.compareSync(String(password ?? ""), storedHash);
}

function migratePlaintextPasswords(users) {
  let migrated = false;
  for (const user of users) {
    if (user.password && !isBcryptHash(user.password)) {
      user.password = hashPassword(user.password);
      migrated = true;
    }
  }
  return migrated;
}

function usersFilePath() {
  return (
    process.env.TEAMSYNC_DATA_FILE ||
    join(dirname(fileURLToPath(import.meta.url)), ".data", "users.json")
  );
}

function sqliteDatabasePath() {
  return (
    process.env.TEAMSYNC_DATABASE_PATH ||
    join(dirname(fileURLToPath(import.meta.url)), ".data", "teamsync.db")
  );
}

function isSqlitePersistenceEnabled() {
  return process.env.TEAMSYNC_USE_SQLITE === "true";
}

function openSqliteDatabase() {
  const file = sqliteDatabasePath();
  mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL
    );
  `);
  return db;
}

function withSqliteDatabase(callback) {
  const db = openSqliteDatabase();
  try {
    return callback(db);
  } finally {
    db.close();
  }
}

export function isPostgresPersistenceEnabled() {
  if (!process.env.DATABASE_URL) return false;
  const explicitPostgres = process.env.TEAMSYNC_USE_POSTGRES === "true";
  const sqliteExplicitlyChosen = process.env.TEAMSYNC_USE_SQLITE === "true";
  return explicitPostgres || !sqliteExplicitlyChosen;
}

let pgPool = null;
let pgWriteQueue = Promise.resolve();

function pgSslConfig(connectionString) {
  try {
    const url = new URL(connectionString);
    const mode = String(url.searchParams.get("sslmode") ?? "").toLowerCase();
    if (mode === "disable") return undefined;
  } catch {
    // Invalid URL — fall through to a safe default.
  }
  return { rejectUnauthorized: false };
}

function getPgPool() {
  if (!pgPool) {
    pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: pgSslConfig(process.env.DATABASE_URL),
      max: 10,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    });
    pgPool.on("error", (error) => {
      // eslint-disable-next-line no-console
      console.error("[postgres] idle client error:", error.message);
    });
  }
  return pgPool;
}

export async function ensurePgSchema() {
  if (!isPostgresPersistenceEnabled()) return;
  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL
    )
  `);
}

export async function loadPersistedUsersFromPostgres() {
  if (!isPostgresPersistenceEnabled()) return [];
  await ensurePgSchema();
  const { rows } = await getPgPool().query(
    "SELECT payload FROM users ORDER BY id",
  );
  return rows.map((row) => row.payload);
}

export async function closePgPool() {
  if (pgPool) {
    const pool = pgPool;
    pgPool = null;
    pgWriteQueue = Promise.resolve();
    await pool.end();
  }
}

/**
 * Postgres facade over the existing saveUsers funnel. Call sites in the API
 * stay synchronous; writes are serialized through a queue and errors are
 * logged rather than thrown so the API never crashes on a failed write.
 */
export function saveUsersPostgres(users) {
  const pool = getPgPool();
  pgWriteQueue = pgWriteQueue.then(async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM users");
      for (const user of users) {
        await client.query(
          "INSERT INTO users (id, payload) VALUES ($1, $2::jsonb)",
          [user.id, JSON.stringify(user)],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // client may already be broken
      }
      // eslint-disable-next-line no-console
      console.error("[postgres] saveUsers failed:", error.message);
    } finally {
      client.release();
    }
  });
  return pgWriteQueue;
}

export function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

export function loadPersistedUsers() {
  if (isSqlitePersistenceEnabled()) {
    try {
      return withSqliteDatabase((db) => {
        const rows = db
          .prepare("SELECT payload FROM users ORDER BY rowid ASC")
          .all();
        return rows.map((row) => JSON.parse(row.payload));
      });
    } catch {
      return [];
    }
  }

  try {
    const file = usersFilePath();
    if (!existsSync(file)) return [];
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

export function saveUsers(storeOrUsers) {
  const users = Array.isArray(storeOrUsers)
    ? storeOrUsers
    : storeOrUsers.users;

  if (isPostgresPersistenceEnabled()) {
    return saveUsersPostgres(users);
  }

  if (isSqlitePersistenceEnabled()) {
    withSqliteDatabase((db) => {
      const insert = db.prepare(
        "INSERT INTO users (id, payload) VALUES (?, ?)",
      );
      db.exec("BEGIN IMMEDIATE");
      db.exec("DELETE FROM users");
      for (const user of users) {
        insert.run(user.id, JSON.stringify(user));
      }
      db.exec("COMMIT");
    });
    return;
  }

  const file = usersFilePath();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(users, null, 2));
}

export function createStore({ persist = false, persistedUsers = null } = {}) {
  const users = cloneData(seedData.users);

  if (persist) {
    const persisted = persistedUsers ?? loadPersistedUsers();
    if (persisted.length) {
      const byEmail = new Map(
        users.concat(persisted).map((user) => [user.email, user]),
      );
      users.splice(0, users.length, ...byEmail.values());
    }
  }

  const migrated = migratePlaintextPasswords(users);
  if (persist && migrated) saveUsers(users);

  return {
    workspace: cloneData(seedData.workspace),
    users,
    teams: cloneData(seedData.teams),
    tasks: cloneData(seedData.tasks),
    chatRooms: cloneData(seedData.chatRooms),
    chatMessages: cloneData(seedData.chatMessages),
    meetings: cloneData(seedData.meetings),
    events: cloneData(seedData.events),
    files: cloneData(seedData.files),
    notifications: cloneData(seedData.notifications),
    activities: cloneData(seedData.activities),
  };
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { password: _password, invite: _invite, passwordReset: _reset, ...safeUser } = user;
  return safeUser;
}

export function authenticateUser(store, email, password) {
  const normalizedEmail = String(email ?? "")
    .trim()
    .toLowerCase();
  const user = store.users.find(
    (candidate) => candidate.email.toLowerCase() === normalizedEmail,
  );

  if (!user || !verifyPassword(password, user.password)) {
    return null;
  }

  return sanitizeUser(user);
}
