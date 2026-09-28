import { expect, test } from "@playwright/test";

test("staging health and Google login are available", async ({ page, request }) => {
  const health = await request.get("/api/healthz");
  expect(health.ok()).toBeTruthy();
  expect(await health.json()).toMatchObject({ status: "ok", database: "connected" });

  await page.goto("/auth/login");
  await expect(page.getByRole("button", { name: /Masuk dengan Google/ })).toBeVisible();
});

test("protected pages redirect signed-out visitors to login", async ({ page }) => {
  await page.goto("/evaluation");
  await expect(page).toHaveURL(/\/auth\/login(?:\?|$)/);

  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/auth\/login(?:\?|$)/);
});
