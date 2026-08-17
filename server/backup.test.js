import test from "node:test";
import assert from "node:assert/strict";
import { nextBackupDelayMs } from "./backup.js";

test("nextBackupDelayMs returns ms until today's target hour", () => {
  const now = new Date("2026-08-17T01:00:00.000Z");
  assert.equal(nextBackupDelayMs(2, now), 60 * 60 * 1000);
});

test("nextBackupDelayMs rolls to the next day when the hour has passed", () => {
  const now = new Date("2026-08-17T03:00:00.000Z");
  assert.equal(nextBackupDelayMs(2, now), 23 * 60 * 60 * 1000);
});

test("nextBackupDelayMs is zero exactly at the target hour", () => {
  const now = new Date("2026-08-17T02:00:00.000Z");
  assert.equal(nextBackupDelayMs(2, now), 0);
});

test("nextBackupDelayMs honours a custom hour", () => {
  const now = new Date("2026-08-17T10:30:00.000Z");
  assert.equal(nextBackupDelayMs(12, now), 90 * 60 * 1000);
});