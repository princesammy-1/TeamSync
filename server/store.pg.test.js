import test from "node:test";
import assert from "node:assert/strict";

import {
  createStore,
  ensurePgSchema,
  loadPersistedUsersFromPostgres,
  saveUsers,
  closePgPool,
} from "./store.js";

const enabled =
  process.env.TEAMSYNC_USE_POSTGRES === "true" &&
  Boolean(process.env.DATABASE_URL);

test("postgres persistence round-trips users through the store funnel", { skip: !enabled }, async () => {
  const seed = createStore({ persist: true }).users;

  await ensurePgSchema();
  await saveUsers(seed);
  const persisted = await loadPersistedUsersFromPostgres();

  assert.ok(persisted.length >= seed.length);
  const byId = new Map(persisted.map((user) => [user.id, user]));
  for (const user of seed) {
    assert.deepEqual(byId.get(user.id), user);
  }

  await closePgPool();
});

test("postgres store recreation restores persisted auth records", { skip: !enabled }, async () => {
  await ensurePgSchema();

  const first = createStore({ persist: true });
  const registered = {
    id: "pg-test-user",
    email: "pgtest@teamsync.app",
    name: "PG Test",
    password: "$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVW",
    role: "member",
    status: "active",
    pending: 0,
    invite: null,
    passwordReset: null,
    sessionVersion: 0,
    createdAt: new Date().toISOString(),
  };
  first.users.push(registered);
  saveUsers(first);

  await new Promise((resolve) => setTimeout(resolve, 500));

  const persisted = await loadPersistedUsersFromPostgres();
  const recreated = createStore({ persist: true, persistedUsers: persisted });
  const restored = recreated.users.find((user) => user.id === registered.id);

  assert.ok(restored);
  assert.equal(restored.email, "pgtest@teamsync.app");

  await closePgPool();
});