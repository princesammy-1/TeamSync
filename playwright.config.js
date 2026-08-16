import { defineConfig } from "@playwright/test";

const API_PORT = 3101;
const WEB_PORT = 4180;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${WEB_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "npm run dev:server",
      url: `http://127.0.0.1:${API_PORT}/api/health`,
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        ...process.env,
        PORT: String(API_PORT),
      },
    },
    {
      command: `npm run preview -- --port ${WEB_PORT} --host 127.0.0.1`,
      url: `http://127.0.0.1:${WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        ...process.env,
        TEAMSYNC_API_URL: `http://127.0.0.1:${API_PORT}`,
      },
    },
  ],
});