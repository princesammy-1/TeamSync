import { expect } from "@playwright/test";
import { test, login, DEMO_OWNER, expectToast } from "./helpers.js";

test("landing page loads and links to login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible();
});

test("login with demo owner lands on the dashboard", async ({ page }) => {
  await login(page, DEMO_OWNER);
  await expect(page).toHaveURL(/\/app(\/|$)/);
  await expectToast(page, "Welcome back, Adrian");
  await expect(page.getByText("Aurora Labs")).toBeVisible();
});

test("login with an invalid password shows an error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(DEMO_OWNER.email);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText(/invalid email or password/i)).toBeVisible();
});

test("logout returns the user to the login page", async ({ page }) => {
  await login(page, DEMO_OWNER);
  await page.getByLabel("Open user menu").click();
  await page.getByRole("menuitem", { name: /log out|sign out/i }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("a registered account can sign in", async ({ page }) => {
  const email = `e2e-${Date.now()}@teamsync.app`;
  await page.goto("/register");
  await page.getByLabel("Full name").fill("E2E Tester");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill("e2epassword123");
  await page.getByLabel("Confirm").fill("e2epassword123");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/app(\/|$)/, { timeout: 15_000 });

  await page.getByLabel("Open user menu").click();
  await page.getByRole("menuitem", { name: /log out|sign out/i }).click();
  await expect(page).toHaveURL(/\/login$/);

  await login(page, { email, password: "e2epassword123" });
  await expectToast(page, "Welcome back, E2E");
});

test("forgot password shows a confirmation message", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(DEMO_OWNER.email);
  await page.getByRole("button", { name: /send reset link|reset/i }).click();
  await expect(page.getByText(/reset link|check your email/i).first()).toBeVisible();
});