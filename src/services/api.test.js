import test from "node:test";
import assert from "node:assert/strict";

import { requestJson, ApiError } from "./mockApi.js";

test("requestJson parses successful JSON responses", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify({ ok: true, service: "teamsync-api" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  try {
    const data = await requestJson("/api/health");
    assert.deepEqual(data, { ok: true, service: "teamsync-api" });
  } finally {
    global.fetch = originalFetch;
  }
});

test("requestJson surfaces backend errors as ApiError", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () =>
    new Response(JSON.stringify({ message: "Invalid email or password." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });

  try {
    await assert.rejects(
      () => requestJson("/api/auth/login", { method: "POST" }),
      (error) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.message, "Invalid email or password.");
        assert.equal(error.status, 401);
        return true;
      },
    );
  } finally {
    global.fetch = originalFetch;
  }
});
