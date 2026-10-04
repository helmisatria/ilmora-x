import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const adminState = resolve("e2e/.auth/admin-b.json");
const studentState = resolve("e2e/.auth/free-student.json");
test.skip(!existsSync(adminState) || !existsSync(studentState), "Requires the local ordinary Admin and Student QA sessions.");
test.use({ storageState: existsSync(adminState) ? adminState : undefined });

test("ordinary Admin can open and save badge settings, while Students cannot save", async ({ page, playwright }) => {
  await page.goto("/admin/badges");
  await expect(page.getByRole("heading", { name: "Badge settings", exact: true })).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: "BADGE-001" });
  const edit = row.getByRole("button", { name: "Edit", exact: true });
  await edit.click();
  const dialog = page.getByRole("dialog");
  const name = dialog.getByLabel("Name shown to Students", { exact: false });
  const original = await name.inputValue();
  const replacement = `Badge QA ${Date.now()}`;

  try {
    await name.fill(replacement);
    const savedRequest = page.waitForRequest((request) => request.method() === "POST" && request.url().includes("_serverFn"));
    await dialog.getByRole("button", { name: "Save Badge", exact: true }).click();
    const mutation = await savedRequest;
    await expect(dialog).not.toBeVisible();
    await expect(row).toContainText(replacement);
    await page.reload();
    await expect(row).toContainText(replacement);

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
    if (await dialog.isVisible()) await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await edit.click();
    await name.fill(original);
    await dialog.getByRole("button", { name: "Save Badge", exact: true }).click();
    await expect(dialog).not.toBeVisible();
  }
});
