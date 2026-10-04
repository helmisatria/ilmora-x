import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const adminState = resolve("e2e/.auth/admin-b.json");
test.skip(!existsSync(adminState), "Requires the local ordinary Admin QA session.");
test.use({ storageState: existsSync(adminState) ? adminState : undefined });

for (const width of [1280, 390]) {
  test(`ordinary Admin sees a styled Monitoring restriction at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/admin/monitoring");
    const card = page.locator("section.admin-panel");
    await expect(card.getByRole("heading", { name: "Super Admin access required" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Finalize|Rerun/ })).toHaveCount(0);
    const dimensions = await card.locator("svg").evaluate((icon) => {
      const rect = icon.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    expect(dimensions).toEqual({ width: 24, height: 24 });
    expect(Number.parseFloat(await card.evaluate((node) => getComputedStyle(node).borderRadius))).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await card.getByRole("link", { name: "Back to Admin" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  });
}

test("Monitoring restriction is styled before JavaScript loads", async ({ browser }) => {
  const context = await browser.newContext({ storageState: adminState, javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    const response = await page.goto(`${test.info().project.use.baseURL}/admin/monitoring`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Super Admin access required" })).toBeVisible();
    expect(Number.parseFloat(await page.locator("section.admin-panel").evaluate((node) => getComputedStyle(node).borderRadius))).toBeGreaterThan(0);
    expect(await page.locator('head link[rel="stylesheet"]').count()).toBeGreaterThan(0);
  } finally {
    await context.close();
  }
});

test("root error page retains its stylesheet and bounded icon", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Admin", exact: true })).toBeVisible();
  await page.route("**/_serverFn/**", (route) => route.abort("failed"));
  await page.getByRole("link", { name: "Open Student App" }).click();
  await expect(page.getByRole("heading", { name: "Sesi ini tidak bisa dimuat" })).toBeVisible();
  const icon = page.locator("main svg");
  expect(await icon.evaluate((node) => node.getBoundingClientRect().width)).toBe(28);
  expect(await page.locator('head link[rel="stylesheet"]').count()).toBeGreaterThan(0);
  await page.unroute("**/_serverFn/**");
  await page.getByRole("link", { name: "Kembali ke Dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
