import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createApp } from "./index.js";
import {
  createStore,
  authenticateUser,
  saveUsers,
  loadPersistedUsers,
  hashPassword,
  verifyPassword,
} from "./store.js";
import { generateOpaqueToken, hashOpaqueToken } from "./auth.js";
import { runBackup } from "./backup.js";

test("createStore seeds a demo workspace", () => {
  const store = createStore();

  assert.equal(store.workspace.name, "Aurora Labs");
  assert.ok(store.users.length >= 2);
  assert.ok(store.tasks.length >= 1);
});

test("authenticateUser accepts the demo user", () => {
  const store = createStore();
  const user = authenticateUser(store, "adrian@teamsync.app", "demo1234");

  assert.ok(user);
  assert.equal(user.email, "adrian@teamsync.app");
  assert.equal(user.password, undefined);
});

test("authenticateUser rejects invalid credentials", () => {
  const store = createStore();
  const user = authenticateUser(store, "adrian@teamsync.app", "wrong-password");

  assert.equal(user, null);
});

test("auth API returns the logged-in user for session restoration", async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const loginResponse = await fetch(
      `http://127.0.0.1:${port}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "adrian@teamsync.app",
          password: "demo1234",
        }),
      },
    );

    const loginPayload = await loginResponse.json();
    assert.equal(loginResponse.status, 200);
    assert.equal(loginPayload.user.email, "adrian@teamsync.app");

    const meResponse = await fetch(
      `http://127.0.0.1:${port}/api/auth/me?userId=${loginPayload.user.id}`,
    );

    const mePayload = await meResponse.json();
    assert.equal(meResponse.status, 200);
    assert.equal(mePayload.user.id, loginPayload.user.id);
    assert.equal(mePayload.user.email, "adrian@teamsync.app");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("users API creates a pending invited member and adds them to selected teams", async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const loginResponse = await fetch(
      `http://127.0.0.1:${port}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "adrian@teamsync.app",
          password: "demo1234",
        }),
      },
    );
    const loginPayload = await loginResponse.json();
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${loginPayload.token}`,
    };

    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "Jordan Lee",
        email: "jordan@company.com",
        role: "member",
        teamIds: ["t1"],
      }),
    });

    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.user.email, "jordan@company.com");
    assert.equal(payload.user.pending, true);
    assert.ok(payload.user.password === undefined);

    const teamResponse = await fetch(`http://127.0.0.1:${port}/api/teams/t1`);
    const teamPayload = await teamResponse.json();
    assert.ok(teamPayload.memberIds.includes(payload.user.id));
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("unauthenticated requests to sensitive endpoints are rejected", async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Guest", email: "guest@company.com" }),
    });
    assert.equal(response.status, 401);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("a guest cannot invite members or change roles", async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const loginResponse = await fetch(
      `http://127.0.0.1:${port}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "zoe@teamsync.app",
          password: "demo1234",
        }),
      },
    );
    const loginPayload = await loginResponse.json();
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${loginPayload.token}`,
    };

    const inviteResponse = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ name: "Bob", email: "bob@company.com" }),
    });
    assert.equal(inviteResponse.status, 403);

    const roleResponse = await fetch(
      `http://127.0.0.1:${port}/api/users/u2`,
      {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ role: "admin" }),
      },
    );
    assert.equal(roleResponse.status, 403);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("registered users survive a store recreation when persistence is enabled", () => {
  const file = join(
    tmpdir(),
    `teamsync-users-${process.pid}-${Date.now()}.json`,
  );
  process.env.TEAMSYNC_DATA_FILE = file;

  try {
    const first = createStore({ persist: true });
    first.users.push({
      id: "u-new",
      name: "Casey Doe",
      email: "casey@teamsync.app",
      password: "password123",
      role: "member",
      presence: "online",
    });
    saveUsers(first);

    const recreated = createStore({ persist: true });
    assert.ok(
      recreated.users.some((user) => user.email === "casey@teamsync.app"),
    );
    assert.equal(
      authenticateUser(recreated, "casey@teamsync.app", "password123")?.id,
      "u-new",
    );
  } finally {
    delete process.env.TEAMSYNC_DATA_FILE;
    rmSync(file, { force: true });
  }
});

test("sqlite-backed persistence keeps auth records across restarts", () => {
  const dbPath = join(
    tmpdir(),
    `teamsync-sqlite-${process.pid}-${Date.now()}.db`,
  );
  process.env.TEAMSYNC_USE_SQLITE = "true";
  process.env.TEAMSYNC_DATABASE_PATH = dbPath;

  try {
    const first = createStore({ persist: true });
    first.users.push({
      id: "u-sqlite",
      name: "Riley Stone",
      email: "riley@teamsync.app",
      password: "securepass",
      role: "member",
      presence: "online",
    });
    saveUsers(first);

    const persisted = loadPersistedUsers();
    assert.ok(persisted.some((user) => user.email === "riley@teamsync.app"));

    const recreated = createStore({ persist: true });
    assert.equal(
      authenticateUser(recreated, "riley@teamsync.app", "securepass")?.id,
      "u-sqlite",
    );
  } finally {
    delete process.env.TEAMSYNC_USE_SQLITE;
    delete process.env.TEAMSYNC_DATABASE_PATH;
    rmSync(dbPath, { force: true });
  }
});

test("hashPassword produces a verifiable non-plaintext hash", () => {
  const hash = hashPassword("demo1234");

  assert.notEqual(hash, "demo1234");
  assert.match(hash, /^\$2[aby]\$/);
  assert.equal(verifyPassword("demo1234", hash), true);
  assert.equal(verifyPassword("wrong-password", hash), false);
});

test("createStore migrates plaintext seed passwords to bcrypt hashes", () => {
  const store = createStore();
  const user = store.users.find((entry) => entry.email === "adrian@teamsync.app");

  assert.ok(user);
  assert.match(user.password, /^\$2[aby]\$/);
  assert.equal(verifyPassword("demo1234", user.password), true);
});

test("registration stores a bcrypt hash, not the plaintext password", async () => {
  const dbPath = join(
    tmpdir(),
    `teamsync-register-${process.pid}-${Date.now()}.db`,
  );
  process.env.TEAMSYNC_USE_SQLITE = "true";
  process.env.TEAMSYNC_DATABASE_PATH = dbPath;

  const app = createApp({ persist: true });
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alex Morgan",
        email: "alex@teamsync.app",
        password: "hunter2secret",
      }),
    });

    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.user.password, undefined);

    const persisted = loadPersistedUsers();
    const stored = persisted.find(
      (user) => user.email === "alex@teamsync.app",
    );
    assert.ok(stored);
    assert.match(stored.password, /^\$2[aby]\$/);
    assert.equal(verifyPassword("hunter2secret", stored.password), true);

    const loginResponse = await fetch(
      `http://127.0.0.1:${port}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "alex@teamsync.app",
          password: "hunter2secret",
        }),
      },
    );
    const loginPayload = await loginResponse.json();
    assert.equal(loginResponse.status, 200);
    assert.equal(loginPayload.user.email, "alex@teamsync.app");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    delete process.env.TEAMSYNC_USE_SQLITE;
    delete process.env.TEAMSYNC_DATABASE_PATH;
    rmSync(dbPath, { force: true });
  }
});

test("login issues a JWT and /api/auth/me validates it", async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const loginResponse = await fetch(
      `http://127.0.0.1:${port}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "adrian@teamsync.app",
          password: "demo1234",
        }),
      },
    );

    const loginPayload = await loginResponse.json();
    assert.equal(loginResponse.status, 200);
    assert.ok(loginPayload.token);
    assert.ok(loginPayload.token.split(".").length === 3);

    const setCookie = loginResponse.headers.get("set-cookie");
    assert.ok(setCookie);
    assert.match(setCookie, /teamsync_session=/);
    assert.match(setCookie, /HttpOnly/i);

    const meResponse = await fetch(`http://127.0.0.1:${port}/api/auth/me`, {
      headers: { Authorization: `Bearer ${loginPayload.token}` },
    });
    const mePayload = await meResponse.json();
    assert.equal(meResponse.status, 200);
    assert.equal(mePayload.user.id, loginPayload.user.id);

    const badResponse = await fetch(
      `http://127.0.0.1:${port}/api/auth/me`,
      {
        headers: { Authorization: "Bearer invalid.token.here" },
      },
    );
    assert.equal(badResponse.status, 401);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("logout clears the session cookie", async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const loginResponse = await fetch(
      `http://127.0.0.1:${port}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "adrian@teamsync.app",
          password: "demo1234",
        }),
      },
    );
    const loginPayload = await loginResponse.json();

    const logoutResponse = await fetch(
      `http://127.0.0.1:${port}/api/auth/logout`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${loginPayload.token}` },
      },
    );
    assert.equal(logoutResponse.status, 200);

    const logoutCookie = logoutResponse.headers.get("set-cookie");
    assert.ok(logoutCookie);
    assert.match(logoutCookie, /teamsync_session=;/);
    assert.match(logoutCookie, /(Max-Age=0|Expires=Thu, 01 Jan 1970)/);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("invite flow stores a hashed invite token and accept-invite activates the member", async () => {
  const dbPath = join(
    tmpdir(),
    `teamsync-invite-${process.pid}-${Date.now()}.db`,
  );
  process.env.TEAMSYNC_USE_SQLITE = "true";
  process.env.TEAMSYNC_DATABASE_PATH = dbPath;

  const rawInviteToken = "known-invite-token-xyz789";
  const seeded = createStore({ persist: true });
  seeded.users.push({
    id: "u-invited",
    name: "New Member",
    email: "newmember@company.com",
    password: hashPassword(`invite-${Date.now()}`),
    role: "member",
    pending: true,
    presence: "offline",
    invite: {
      tokenHash: hashOpaqueToken(rawInviteToken),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    },
  });
  saveUsers(seeded);

  const app = createApp({ persist: true });
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const badAccept = await fetch(
      `http://127.0.0.1:${port}/api/auth/accept-invite`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "bad-token", password: "password123" }),
      },
    );
    assert.equal(badAccept.status, 400);

    const acceptResponse = await fetch(
      `http://127.0.0.1:${port}/api/auth/accept-invite`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: rawInviteToken,
          password: "password123",
        }),
      },
    );
    assert.equal(acceptResponse.status, 201);
    const acceptPayload = await acceptResponse.json();
    assert.equal(acceptPayload.user.pending, false);
    assert.ok(acceptPayload.token);

    const loginResponse = await fetch(
      `http://127.0.0.1:${port}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "newmember@company.com",
          password: "password123",
        }),
      },
    );
    assert.equal(loginResponse.status, 200);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    delete process.env.TEAMSYNC_USE_SQLITE;
    delete process.env.TEAMSYNC_DATABASE_PATH;
    rmSync(dbPath, { force: true });
  }
});

test("invite API stores a hashed token on the pending member", async () => {
  const dbPath = join(
    tmpdir(),
    `teamsync-invite-api-${process.pid}-${Date.now()}.db`,
  );
  process.env.TEAMSYNC_USE_SQLITE = "true";
  process.env.TEAMSYNC_DATABASE_PATH = dbPath;

  const app = createApp({ persist: true });
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const loginResponse = await fetch(
      `http://127.0.0.1:${port}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "adrian@teamsync.app",
          password: "demo1234",
        }),
      },
    );
    const loginPayload = await loginResponse.json();

    const inviteResponse = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${loginPayload.token}`,
      },
      body: JSON.stringify({
        name: "Invitee Person",
        email: "invitee@company.com",
        role: "member",
        teamIds: ["t1"],
      }),
    });
    const invitePayload = await inviteResponse.json();
    assert.equal(inviteResponse.status, 201);
    assert.equal(invitePayload.user.pending, true);
    assert.ok(invitePayload.user.invite === undefined);

    const persisted = loadPersistedUsers();
    const invited = persisted.find(
      (user) => user.email === "invitee@company.com",
    );
    assert.ok(invited.invite?.tokenHash);
    assert.match(invited.invite.tokenHash, /^[0-9a-f]{64}$/);
    assert.ok(invited.invite.expiresAt > Date.now());
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    delete process.env.TEAMSYNC_USE_SQLITE;
    delete process.env.TEAMSYNC_DATABASE_PATH;
    rmSync(dbPath, { force: true });
  }
});

test("email rate limiter throttles repeated reset requests for one address", async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    for (let i = 0; i < 3; i += 1) {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "adrian@teamsync.app" }),
        },
      );
      assert.equal(response.status, 200);
    }

    const limited = await fetch(
      `http://127.0.0.1:${port}/api/auth/forgot-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "adrian@teamsync.app" }),
      },
    );
    assert.equal(limited.status, 429);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("admin overview is restricted to admins and returns usage metrics", async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const guestLogin = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "zoe@teamsync.app", password: "demo1234" }),
    });
    const guestPayload = await guestLogin.json();

    const forbidden = await fetch(
      `http://127.0.0.1:${port}/api/admin/overview`,
      {
        headers: { Authorization: `Bearer ${guestPayload.token}` },
      },
    );
    assert.equal(forbidden.status, 403);

    const adminLogin = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "adrian@teamsync.app", password: "demo1234" }),
    });
    const adminPayload = await adminLogin.json();

    const overview = await fetch(
      `http://127.0.0.1:${port}/api/admin/overview`,
      {
        headers: { Authorization: `Bearer ${adminPayload.token}` },
      },
    );
    assert.equal(overview.status, 200);
    const data = await overview.json();
    assert.ok(data.metrics.members >= 2);
    assert.ok(data.metrics.tasks >= 1);
    assert.ok(data.roleCounts.owner === 1);
    assert.ok(Array.isArray(data.recentActivity));
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("opaque reset tokens are hashed before storage", () => {
  const raw = generateOpaqueToken();
  const hash = hashOpaqueToken(raw);

  assert.equal(raw.length, 64);
  assert.notEqual(hash, raw);
  assert.equal(hashOpaqueToken(raw), hash);
});

test("password reset flow changes the password and invalidates old sessions", async () => {
  const dbPath = join(
    tmpdir(),
    `teamsync-reset-${process.pid}-${Date.now()}.db`,
  );
  process.env.TEAMSYNC_USE_SQLITE = "true";
  process.env.TEAMSYNC_DATABASE_PATH = dbPath;

  const rawToken = "known-reset-token-abc123";
  const seeded = createStore({ persist: true });
  const target = seeded.users.find(
    (user) => user.email === "adrian@teamsync.app",
  );
  target.passwordReset = {
    tokenHash: hashOpaqueToken(rawToken),
    expiresAt: Date.now() + 30 * 60 * 1000,
  };
  saveUsers(seeded);

  const app = createApp({ persist: true });
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const existingSession = await fetch(
      `http://127.0.0.1:${port}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "adrian@teamsync.app",
          password: "demo1234",
        }),
      },
    );
    const oldToken = (await existingSession.json()).token;

    const badReset = await fetch(
      `http://127.0.0.1:${port}/api/auth/reset-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "wrong-token",
          password: "newpassword123",
        }),
      },
    );
    assert.equal(badReset.status, 400);

    const validReset = await fetch(
      `http://127.0.0.1:${port}/api/auth/reset-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: rawToken,
          password: "newpassword123",
        }),
      },
    );
    assert.equal(validReset.status, 200);

    const oldSessionCheck = await fetch(
      `http://127.0.0.1:${port}/api/auth/me`,
      {
        headers: { Authorization: `Bearer ${oldToken}` },
      },
    );
    assert.equal(oldSessionCheck.status, 401);

    const newLogin = await fetch(
      `http://127.0.0.1:${port}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "adrian@teamsync.app",
          password: "newpassword123",
        }),
      },
    );
    assert.equal(newLogin.status, 200);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    delete process.env.TEAMSYNC_USE_SQLITE;
    delete process.env.TEAMSYNC_DATABASE_PATH;
    rmSync(dbPath, { force: true });
  }
});

test("runBackup creates a restorable SQLite snapshot when persistence is on", async () => {
  const dbPath = join(tmpdir(), `teamsync-backup-${process.pid}-${Date.now()}.db`);
  const backupDir = join(
    tmpdir(),
    `teamsync-backups-${process.pid}-${Date.now()}`,
  );

  process.env.TEAMSYNC_USE_SQLITE = "true";
  process.env.TEAMSYNC_DATABASE_PATH = dbPath;
  process.env.TEAMSYNC_BACKUP_DIR = backupDir;

  try {
    const store = createStore({ persist: true });
    saveUsers(store);
    assert.ok(existsSync(dbPath));

    const result = runBackup();
    assert.equal(result.ok, true);
    assert.ok(existsSync(result.destination));
    assert.ok(result.bytes > 0);

    const { DatabaseSync } = await import("node:sqlite");
    const snapshot = new DatabaseSync(result.destination);
    try {
      const count = snapshot.prepare("SELECT COUNT(*) AS count FROM users").get();
      assert.ok(count.count >= 1);
    } finally {
      snapshot.close();
    }
  } finally {
    delete process.env.TEAMSYNC_USE_SQLITE;
    delete process.env.TEAMSYNC_DATABASE_PATH;
    delete process.env.TEAMSYNC_BACKUP_DIR;
    rmSync(dbPath, { force: true });
    rmSync(backupDir, { recursive: true, force: true });
  }
});
