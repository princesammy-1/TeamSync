import { expect } from "@playwright/test";
import { test, login, DEMO_OWNER, DEMO_MEMBER } from "./helpers.js";

test("admin dashboard is reachable for an owner", async ({ page }) => {
  await login(page, DEMO_OWNER);
  await page.goto("/app/admin");
  await expect(page).toHaveURL(/\/app\/admin/);
  await expect(page.getByText("Founder").first()).toBeVisible();
  await expect(page.getByText(/members|seats|tasks|usage/i).first()).toBeVisible();
});

test("a member is redirected away from the admin dashboard", async ({ page }) => {
  await login(page, DEMO_MEMBER);
  await page.goto("/app/admin");
  await expect(page).not.toHaveURL(/\/app\/admin/);
  await expect(page).toHaveURL(/\/app(\/|$)/);
});

test("the sidebar does not show the admin link to a member", async ({ page }) => {
  await login(page, DEMO_MEMBER);
  await expect(page.getByRole("link", { name: /admin/i })).toHaveCount(0);
});

test("the sidebar shows the admin link to an owner", async ({ page }) => {
  await login(page, DEMO_OWNER);
  await expect(page.getByRole("link", { name: /admin/i })).toBeVisible();
});