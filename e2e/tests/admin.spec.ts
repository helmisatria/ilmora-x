import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const authFile = resolve("e2e/.auth/admin.json");
test.skip(!existsSync(authFile), "Capture an Admin session with pnpm test:e2e:auth admin.");
test.use({ storageState: authFile });

test("Admin can search and filter Students, then open their Evaluation", async ({ page }) => {
  await page.goto("/admin/users");
  await page.waitForLoadState("networkidle");
  const panel = page.locator("section.admin-panel").filter({
    has: page.getByRole("heading", { name: "Students", exact: true }),
  });
  const rows = panel.locator(".admin-list-row");
  await expect(rows.first()).toBeVisible();

  const first = rows.first();
  const email = (await first.locator("p").first().innerText()).trim();
  const studentName = (await first.getByRole("link").first().innerText()).trim();
  const status = (await first.getByText(/^(Active|Suspended)$/).first().innerText()).toLowerCase();
  const access = (await first.getByText(/^(Premium|Free)$/).first().innerText()).toLowerCase();

  const search = panel.getByRole("searchbox", { name: "Search Students by name or email" });
  await search.fill(studentName);
  await expect(rows.filter({ hasText: email })).toHaveCount(1);
  await search.fill(email);
  await expect(rows).toHaveCount(1);
  await panel.getByLabel("Account status").selectOption(status === "active" ? "suspended" : "active");
  await expect(rows).toHaveCount(0);
  await panel.getByLabel("Account status").selectOption(status);
  await panel.getByLabel("Premium access").selectOption(access === "premium" ? "free" : "premium");
  await expect(rows).toHaveCount(0);
  await panel.getByLabel("Premium access").selectOption(access);
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(email);

  await rows.first().getByRole("link", { name: "Evaluation" }).click();
  await expect(page).toHaveURL(/\/admin\/users\/[^/]+$/);
  await expect(page.getByRole("heading", { name: studentName, exact: true })).toBeVisible();
});

test("Insights separates recent activity from lifetime learning results", async ({ page }) => {
  await page.goto("/admin/insights");
  await expect(page.getByRole("heading", { name: "Insights" })).toBeVisible();

  for (const label of [
    "New students",
    "Active students",
    "Premium students",
    "Free students",
    "Completed attempts",
    "Answered questions",
  ]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Category performance" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent activity" })).toBeVisible();
  await expect(page.getByText("All completed attempts · lifetime", { exact: true })).toBeVisible();
  await expect(page.getByText(/Based on [\d.]+ completed attempts?/)).toBeVisible();
  await page.getByRole("link", { name: "Review reports" }).click();
  await expect(page).toHaveURL(/\/admin\/reports$/);
});

test("Insights remains readable on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/insights");
  await expect(page.getByRole("heading", { name: "Learning activity" })).toBeVisible();
  await page.getByRole("heading", { name: "Content library" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "Content library" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("Monitoring reports a finalized previous week from its snapshot", async ({ page }) => {
  await page.goto("/admin/monitoring");
  await expect(page.getByRole("heading", { name: "Previous week finalized" })).toBeVisible();
  await expect(page.getByText(/Expected week: \d{4}-\d{2}-\d{2}/)).toBeVisible();
  await expect(page.getByText(/Latest snapshot: \d{4}-\d{2}-\d{2}/)).toBeVisible();
});

test("overdue Checkouts do not remain Pending", async ({ page }) => {
  await page.goto("/admin/payments");
  const panel = page.locator("section.admin-panel").filter({
    has: page.getByRole("heading", { name: "Recent Checkouts" }),
  });
  await expect(panel.getByRole("table")).toBeVisible();

  const pendingRows = await panel.getByRole("row").filter({
    has: page.getByText(/^pending$/i),
  }).all();

  for (const row of pendingRows) {
    const timeline = await row.getByRole("cell").nth(5).innerText();
    const expiresAt = parseJakartaExpiry(timeline);
    expect(expiresAt, `Pending Checkout is overdue: ${timeline}`).toBeGreaterThan(Date.now());
  }
});

test("profile join date matches the Admin account record and the dev switch follows the environment", async ({ page }) => {
  await page.goto("/profile");
  const emailRow = page.getByText("Email", { exact: true }).locator("..");
  const joinedRow = page.getByText("Bergabung", { exact: true }).locator("..");
  const email = (await emailRow.innerText()).replace(/^Email\s*/i, "").trim();
  const profileJoined = (await joinedRow.innerText()).replace(/^Bergabung\s*/i, "").trim();
  const isLocal = ["localhost", "127.0.0.1"].includes(new URL(process.env.E2E_BASE_URL ?? "https://staging.ilmorax.com").hostname);
  const expectDevControls = process.env.E2E_EXPECT_DEV_CONTROLS === undefined
    ? isLocal
    : process.env.E2E_EXPECT_DEV_CONTROLS === "1";
  await expect(page.getByRole("checkbox", { name: "CONFIG TOGGLE Premium user" })).toHaveCount(expectDevControls ? 1 : 0);

  await page.goto("/admin/users");
  await page.waitForLoadState("networkidle");
  const panel = page.locator("section.admin-panel").filter({
    has: page.getByRole("heading", { name: "Students", exact: true }),
  });
  await panel.getByRole("searchbox", { name: "Search Students by name or email" }).fill(email);
  const account = panel.locator(".admin-list-row");
  await expect(account).toHaveCount(1);
  const adminJoined = await account.getByText(/^Joined /).innerText();
  expect(dateParts(profileJoined)).toEqual(dateParts(adminJoined));
});

function dateParts(value: string) {
  const match = value.match(/(\d{1,2})\s+([\p{L}]+)\s+(\d{4})/u);
  expect(match, `Could not read join date: ${value}`).not.toBeNull();
  return [Number(match![1]), match![2].slice(0, 3).toLowerCase(), Number(match![3])];
}

function parseJakartaExpiry(value: string) {
  const match = value.match(/Expires\s+(\d{1,2})\s+([\p{L}]+)\s+(\d{4}),\s+(\d{1,2})\.(\d{2})/u);
  expect(match, `Could not read Checkout expiry: ${value}`).not.toBeNull();
  const months = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agu", "sep", "okt", "nov", "des"];
  const month = months.indexOf(match![2].slice(0, 3).toLowerCase());
  expect(month, `Unknown month in Checkout expiry: ${value}`).toBeGreaterThanOrEqual(0);
  return Date.UTC(Number(match![3]), month, Number(match![1]), Number(match![4]) - 7, Number(match![5]));
}
