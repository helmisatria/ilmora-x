import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const authFile = resolve("e2e/.auth/free-student.json");
test.skip(!existsSync(authFile), "Capture a free Student session with pnpm test:e2e:auth free-student.");
test.use({ storageState: authFile });

test("free Evaluation shows real category totals without placeholder Sub-category scores", async ({ page }) => {
  await page.goto("/evaluation");
  await expect(page.getByText("Free", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Unlock Breakdown" }).first()).toBeVisible();
  await expect(page.getByText("Sub-kategori 1", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Sub-kategori 2", { exact: true })).toHaveCount(0);
  await expect(page.getByText("3/5 soal benar", { exact: true })).toHaveCount(0);
  await expect(page.getByText("2/5 soal benar", { exact: true })).toHaveCount(0);
});
