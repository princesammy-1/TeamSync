import { test as base, expect } from "@playwright/test";

export const test = base;

export const DEMO_OWNER = { email: "adrian@teamsync.app", password: "demo1234" };
export const DEMO_MEMBER = { email: "zoe@teamsync.app", password: "demo1234" };

export async function login(page, { email, password }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/app(\/|$)/, { timeout: 15_000 });
}

export async function expectToast(page, text) {
  await expect(page.getByText(text).first()).toBeVisible({ timeout: 10_000 });
}