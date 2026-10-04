import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const adminState = resolve("e2e/.auth/admin-b.json");
const studentState = resolve("e2e/.auth/free-student.json");
test.skip(!existsSync(adminState) || !existsSync(studentState), "Requires the local ordinary Admin and Student QA sessions.");
test.use({ storageState: existsSync(adminState) ? adminState : undefined });

test("ordinary Admin can save and reset Leaderboard settings, while Students cannot save", async ({ page, playwright }) => {
  await page.goto("/admin/leaderboard");
  await expect(page.getByRole("heading", { name: "Leaderboard settings", exact: true })).toBeVisible();
  const threshold = page.getByLabel("New threshold", { exact: true });
  const reset = page.getByRole("button", { name: /^Use (env var|default)/ });
  const original = await threshold.inputValue();
  const hadOverride = await reset.count() > 0;
  const replacement = Number(original) < 10000 ? Number(original) + 1 : 9999;
  const panel = page.locator("section.admin-panel").filter({ has: threshold });

  try {
    await threshold.fill(String(replacement));
    const savedRequest = page.waitForRequest((request) => request.method() === "POST" && request.url().includes("_serverFn"));
    await page.getByRole("button", { name: "Save threshold", exact: true }).click();
    const mutation = await savedRequest;
    await expect(panel.getByText(String(replacement), { exact: true })).toBeVisible();
    await page.reload();
    await expect(threshold).toHaveValue(String(replacement));
    await expect(panel.getByText("Admin setting", { exact: true })).toBeVisible();

    const student = await playwright.request.newContext({ storageState: studentState });
    try {
      const headers = mutation.headers();
      const response = await student.post(mutation.url(), {
        data: mutation.postDataBuffer()!,
        headers: {
          "content-type": headers["content-type"],
          "x-tsr-serverfn": headers["x-tsr-serverfn"] ?? "true",
        },
      });
      expect(await response.text()).toContain("Admin access is required.");
    } finally {
      await student.dispose();
    }
  } finally {
    if (hadOverride) {
      await threshold.fill(original);
      await page.getByRole("button", { name: "Save threshold", exact: true }).click();
      await expect(panel.getByText(original, { exact: true })).toBeVisible();
    } else if (await reset.isVisible()) {
      await reset.click();
      await expect(reset).not.toBeVisible();
    }
    await page.reload();
    await expect(threshold).toHaveValue(original);
  }
});
