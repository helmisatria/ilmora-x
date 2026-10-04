import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import * as XLSX from "xlsx";
import { makeSampleWorkbook } from "../../src/features/tryout-content/tryout-workbook-sheets";

const state = resolve("e2e/.auth/admin.json");
const baseURL = process.env.E2E_BASE_URL ?? "https://staging.ilmorax.com";
// These tests create and edit content. Never run against a deployed database.
test.skip(!["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname) || !existsSync(state), "Requires local app and local admin session.");
test.use({ storageState: existsSync(state) ? state : undefined });

async function createTryout(page: Page, title: string) {
  await page.goto("/admin/tryouts");
  await expect(page.locator("[data-admin-ready=true]")).toBeVisible();
  await page.getByLabel("Judul", { exact: true }).fill(title);
  await page.getByLabel("Deskripsi", { exact: true }).fill("Latihan admin lokal");
  await page.getByRole("button", { name: "Buat try-out", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Perubahan tersimpan.");
  await page.locator(".admin-list-row").filter({ has: page.getByRole("heading", { name: title, exact: true }) }).getByRole("link", { name: "Kelola soal" }).click();
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
}

async function addQuestion(page: Page, text: string, status = "published") {
  await page.getByRole("button", { name: "Tambah soal", exact: true }).click();
  const editor = page.locator("#question-editor");
  await editor.getByLabel("Teks soal", { exact: true }).fill(text);
  for (const option of ["A", "B", "C", "D"]) await editor.getByLabel(`Pilihan ${option}`, { exact: true }).fill(`Jawaban ${option}`);
  await editor.getByLabel("Kunci jawaban", { exact: true }).selectOption("B");
  await editor.getByLabel("Pembahasan", { exact: true }).fill("Jawaban B benar karena alasan pengujian.");
  await editor.getByLabel("Status", { exact: true }).selectOption(status);
  await editor.getByRole("button", { name: "Simpan soal", exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.locator(".admin-list-row").filter({ hasText: text })).toHaveCount(1);
}

function workbookPayload(title: string, mutate?: (book: XLSX.WorkBook) => void) {
  const book = makeSampleWorkbook(XLSX, []);
  book.Sheets.tryout.A2 = { t: "s", v: title };
  mutate?.(book);
  return { name: "soal.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: XLSX.write(book, { type: "buffer", bookType: "xlsx" }) };
}

async function exportPayload(page: Page, mutate?: (book: XLSX.WorkBook) => void) {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Unduh Excel", exact: true }).click();
  const download = await downloadPromise;
  const book = XLSX.read(readFileSync((await download.path())!));
  mutate?.(book);
  return { name: "hasil-unduhan.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: XLSX.write(book, { type: "buffer", bookType: "xlsx" }) };
}

test.setTimeout(60_000);
const run = Date.now();
test("manual create, required fields, answer and pembahasan persist, cancel and publish safeguards", async ({ page }) => {
  const title = `QA manual ${run}`;
  await createTryout(page, title);
  await page.getByRole("button", { name: "Tayangkan", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(/Tayangkan minimal satu soal/);
  await page.getByRole("button", { name: "Tambah soal", exact: true }).click();
  await page.locator("#question-editor").getByRole("button", { name: "Simpan soal" }).click();
  await expect(page.getByRole("alert")).toHaveText("Isi teks soal dan pembahasan.");
  await page.locator("#question-editor").getByRole("button", { name: "Batal", exact: true }).click();
  await addQuestion(page, `Soal manual ${run}`);
  await page.getByRole("button", { name: "Tayangkan", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sembunyikan", exact: true })).toBeVisible();
  await page.reload();
  const row = page.locator(".admin-list-row").filter({ hasText: `Soal manual ${run}` });
  await expect(row).toContainText("Kunci jawaban: B");
  await expect(row).toContainText("Jawaban B benar karena alasan pengujian.");
  page.once("dialog", (dialog) => dialog.dismiss());
  await row.getByRole("button", { name: "Keluarkan", exact: true }).click();
  await expect(row).toHaveCount(1);
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Keluarkan", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(/minimal satu soal tayang/);
  await page.goto("/admin/questions");
  await expect(page.locator("[data-admin-ready=true]")).toBeVisible();
  await page.getByLabel("Cari soal").fill(`Soal manual ${run}`);
  const bankRow = page.locator(".admin-list-row");
  await expect(bankRow).toHaveCount(1);
  await bankRow.getByRole("button", { name: "Sembunyikan", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(/satu-satunya soal tayang/);
  await expect(bankRow).toContainText("Tayang");
});

test("draft questions, edit key/explanation, duplicate order and E validation, safe removal", async ({ page }) => {
  await createTryout(page, `QA draft ${run}`);
  await addQuestion(page, `QA draft pertama ${run}`, "draft");
  await addQuestion(page, `QA draft kedua ${run}`, "draft");
  const row = page.locator(".admin-list-row").filter({ hasText: `QA draft kedua ${run}` });
  await row.getByRole("button", { name: "Ubah", exact: true }).click();
  const editor = page.locator("#question-editor");
  await editor.getByLabel("Nomor urut", { exact: true }).fill("1");
  await editor.getByRole("button", { name: "Simpan soal", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(/Nomor urut 1 sudah dipakai/);
  await editor.getByLabel("Nomor urut", { exact: true }).fill("2");
  await editor.getByLabel("Kunci jawaban", { exact: true }).selectOption("E");
  await editor.getByRole("button", { name: "Simpan soal", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(/Isi pilihan E/);
  await editor.getByLabel("Pilihan E, opsional", { exact: true }).fill("Jawaban E");
  await editor.getByLabel("Pembahasan", { exact: true }).fill("Pembahasan diubah untuk jawaban E.");
  await editor.getByRole("button", { name: "Simpan soal", exact: true }).click();
  await expect(editor).toHaveCount(0);
  await page.reload();
  await expect(row).toContainText("Kunci jawaban: E");
  await expect(row).toContainText("Pembahasan diubah untuk jawaban E.");
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Keluarkan", exact: true }).click();
  await expect(row).toHaveCount(0);
});

test("Excel preview cancel, malformed upload clears old preview, corrections can be reuploaded", async ({ page }) => {
  await page.goto("/admin/tryouts");
  await expect(page.locator("[data-admin-ready=true]")).toBeVisible();
  const title = `QA excel ${run}`;
  await page.locator('input[type="file"][accept=".xlsx"]').setInputFiles(workbookPayload(title));
  const preview = page.locator("section").filter({ has: page.getByRole("heading", { name: "Periksa isi Excel" }) });
  await expect(preview.getByRole("button", { name: "Buat try-out", exact: true })).toBeEnabled();
  await expect(preview).toContainText("Pembahasan:");
  await preview.getByRole("button", { name: "Batal", exact: true }).click();
  await expect(preview).toHaveCount(0);
  await expect(page.getByRole("heading", { name: title, exact: true })).toHaveCount(0);
  await page.locator('input[type="file"][accept=".xlsx"]').setInputFiles(workbookPayload(title));
  await expect(preview).toBeVisible();
  await page.locator('input[type="file"][accept=".xlsx"]').setInputFiles({ name: "rusak.xlsx", mimeType: "application/octet-stream", buffer: Buffer.from([0xff, 0, 1, 2, 3]) });
  await expect(page.getByRole("heading", { name: title, exact: true })).toHaveCount(0);
  await page.locator('input[type="file"][accept=".xlsx"]').setInputFiles(workbookPayload(title, (book) => { book.Sheets.questions.B2 = { t: "n", v: 0 }; }));
  await expect(preview).toContainText("questions baris 2 / sort_order");
  await expect(preview.getByRole("button", { name: "Buat try-out", exact: true })).toBeDisabled();
  await page.locator('input[type="file"][accept=".xlsx"]').setInputFiles(workbookPayload(title));
  await preview.getByRole("button", { name: "Buat try-out", exact: true }).click();
  await expect(preview).toHaveCount(0);
  await expect(page.getByRole("heading", { name: title, exact: true })).toHaveCount(1);
  const row = page.locator(".admin-list-row").filter({ has: page.getByRole("heading", { name: title, exact: true }) });
  const downloadPromise = page.waitForEvent("download");
  await row.getByRole("button", { name: "Excel", exact: true }).click();
  const download = await downloadPromise;
  const book = XLSX.read(readFileSync((await download.path())!));
  const questions = XLSX.utils.sheet_to_json<Record<string, string>>(book.Sheets.questions);
  expect(questions).toHaveLength(2);
  expect(questions[0].correct_option).toBe("B");
  expect(questions[0].explanation).toContain("Penisilin");
  expect(book.Sheets.panduan).toBeDefined();
});

test("mobile admin form does not overflow and can go back", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/tryouts");
  await expect(page.locator("[data-admin-ready=true]")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Buat try-out", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator(".admin-list-row").first().getByRole("link", { name: "Kelola soal" }).click();
  await page.getByRole("link", { name: "Try-out", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Buat try-out", exact: true })).toBeVisible();
});

test("the admin downloads the formatted Indonesian sample and it has the required sheets", async ({ page }) => {
  await page.goto("/admin/tryouts");
  await expect(page.locator("[data-admin-ready=true]")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Unduh contoh Excel", exact: true }).click();
  const download = await downloadPromise;
  const book = XLSX.read(readFileSync((await download.path())!));
  expect(book.SheetNames).toEqual(expect.arrayContaining(["panduan", "tryout", "questions", "guideline"]));
  expect(XLSX.utils.sheet_to_csv(book.Sheets.panduan)).toContain("mengganti seluruh daftar soal");
});

const secondAdminState = resolve("e2e/.auth/admin-b.json");
const staleMessage = /Admin lain sudah mengubah data ini\. Salin isian/;

// Independent sessions model two admins who loaded the same revision.
test.describe("two admin sessions", () => {
  test.skip(!existsSync(secondAdminState), "Prepare the second local Admin session with e2e/prepare-local.ts.");

  test("stale metadata stays available to copy and reload shows the saved title", async ({ page, browser }) => {
    await createTryout(page, `QA stale metadata ${run}`);
    const other = await browser.newContext({ storageState: secondAdminState });
    try {
      const second = await other.newPage();
      await second.goto(page.url());
      await expect(second.locator("[data-admin-ready=true]")).toBeVisible();
      await second.getByLabel("Judul", { exact: true }).fill(`QA unsaved metadata ${run}`);
      await page.getByLabel("Judul", { exact: true }).fill(`QA saved metadata ${run}`);
      await page.getByRole("button", { name: "Simpan perubahan", exact: true }).click();
      await expect(page.getByRole("status")).toHaveText("Perubahan tersimpan.");
      await second.getByRole("button", { name: "Simpan perubahan", exact: true }).click();
      await expect(second.getByRole("alert")).toHaveText(staleMessage);
      await expect(second.getByLabel("Judul", { exact: true })).toHaveValue(`QA unsaved metadata ${run}`);
      await expect(second.getByLabel("Judul", { exact: true })).toBeEnabled();
      await second.reload();
      await expect(second.getByLabel("Judul", { exact: true })).toHaveValue(`QA saved metadata ${run}`);
    } finally {
      await other.close();
    }
  });

  test("stale tryout question keeps the unsaved answer and explanation", async ({ page, browser }) => {
    await createTryout(page, `QA stale question ${run}`);
    const text = `QA concurrent question ${run}`;
    await addQuestion(page, text);
    const other = await browser.newContext({ storageState: secondAdminState });
    try {
      const second = await other.newPage();
      await second.goto(page.url());
      await expect(second.locator("[data-admin-ready=true]")).toBeVisible();
      for (const admin of [page, second]) {
        await admin.locator(".admin-list-row").filter({ hasText: text }).getByRole("button", { name: "Ubah", exact: true }).click();
      }
      const firstEditor = page.locator("#question-editor");
      const secondEditor = second.locator("#question-editor");
      await firstEditor.getByLabel("Kunci jawaban", { exact: true }).selectOption("C");
      await firstEditor.getByLabel("Pembahasan", { exact: true }).fill("Pembahasan admin A tersimpan.");
      await secondEditor.getByLabel("Kunci jawaban", { exact: true }).selectOption("D");
      await secondEditor.getByLabel("Pembahasan", { exact: true }).fill("Pembahasan admin B belum tersimpan.");
      await firstEditor.getByRole("button", { name: "Simpan soal", exact: true }).click();
      await expect(firstEditor).toHaveCount(0);
      await secondEditor.getByRole("button", { name: "Simpan soal", exact: true }).click();
      await expect(second.getByRole("alert")).toHaveText(staleMessage);
      await expect(secondEditor.getByLabel("Pembahasan", { exact: true })).toHaveValue("Pembahasan admin B belum tersimpan.");
      await expect(secondEditor.getByLabel("Kunci jawaban", { exact: true })).toHaveValue("D");
      await expect(secondEditor.getByLabel("Pembahasan", { exact: true })).toBeEnabled();
      await second.reload();
      const row = second.locator(".admin-list-row").filter({ hasText: text });
      await expect(row).toContainText("Kunci jawaban: C");
      await expect(row).toContainText("Pembahasan admin A tersimpan.");
    } finally {
      await other.close();
    }
  });

  test("stale bank question keeps unsaved text and rejects overwriting the newer explanation", async ({ page, browser }) => {
    await createTryout(page, `QA stale bank ${run}`);
    const text = `QA concurrent bank ${run}`;
    await addQuestion(page, text);
    const detailURL = page.url();
    const other = await browser.newContext({ storageState: secondAdminState });
    try {
      const second = await other.newPage();
      for (const admin of [page, second]) {
        await admin.goto("/admin/questions");
        await expect(admin.locator("[data-admin-ready=true]")).toBeVisible();
        await admin.getByLabel("Cari soal").fill(text);
        await admin.locator(".admin-list-row").getByRole("button", { name: "Ubah", exact: true }).click();
      }
      await page.getByLabel("Pembahasan", { exact: true }).fill("Pembahasan bank admin A.");
      await second.getByLabel("Pembahasan", { exact: true }).fill("Pembahasan bank admin B belum tersimpan.");
      await page.getByRole("button", { name: "Simpan perubahan", exact: true }).click();
      await expect(page.getByRole("status")).toHaveText("Perubahan tersimpan.");
      await second.getByRole("button", { name: "Simpan perubahan", exact: true }).click();
      await expect(second.getByRole("alert")).toHaveText(staleMessage);
      await expect(second.getByLabel("Pembahasan", { exact: true })).toHaveValue("Pembahasan bank admin B belum tersimpan.");
      await expect(second.getByLabel("Pembahasan", { exact: true })).toBeEnabled();
      await second.goto(detailURL);
      await expect(second.locator(".admin-list-row").filter({ hasText: text })).toContainText("Pembahasan bank admin A.");
    } finally {
      await other.close();
    }
  });

  test("stale Excel preview stays visible after a competing save and does not replace it", async ({ page, browser }) => {
    await createTryout(page, `QA stale Excel ${run}`);
    await addQuestion(page, `QA retained before stale import ${run}`);
    const other = await browser.newContext({ storageState: secondAdminState });
    try {
      const second = await other.newPage();
      await second.goto(page.url());
      await expect(second.locator("[data-admin-ready=true]")).toBeVisible();
      const payload = await exportPayload(second, book => { book.Sheets.tryout.A2 = { t: "s", v: `QA stale import ${run}` }; });
      await second.locator('input[type="file"][accept=".xlsx"]').setInputFiles(payload);
      const preview = second.locator("section").filter({ has: second.getByRole("heading", { name: "Periksa isi Excel" }) });
      const importButton = preview.getByRole("button", { name: "Simpan isi Excel", exact: true });
      await expect(importButton).toBeEnabled();
      await page.getByLabel("Judul", { exact: true }).fill(`QA saved before import ${run}`);
      await page.getByRole("button", { name: "Simpan perubahan", exact: true }).click();
      await expect(page.getByRole("status")).toHaveText("Perubahan tersimpan.");
      await importButton.click();
      await expect(preview.getByRole("alert")).toHaveText(staleMessage);
      await expect(preview).toContainText(`QA stale import ${run}`);
      await expect(importButton).toBeEnabled();
      await second.reload();
      await expect(second.getByLabel("Judul", { exact: true })).toHaveValue(`QA saved before import ${run}`);
      await expect(second.locator(".admin-list-row")).toHaveCount(1);
      await expect(second.locator(".admin-list-row")).toContainText(`QA retained before stale import ${run}`);
    } finally {
      await other.close();
    }
  });

  test("old offline and legacy Excel files are blocked after reload, while a fresh export can replace content", async ({ page, browser }) => {
    await createTryout(page, `QA offline Excel ${run}`);
    const text = `QA offline question ${run}`;
    await addQuestion(page, text);
    const oldFile = await exportPayload(page);
    const other = await browser.newContext({ storageState: secondAdminState });
    try {
      const second = await other.newPage();
      await second.goto(page.url());
      await expect(second.locator("[data-admin-ready=true]")).toBeVisible();
      await page.getByLabel("Judul", { exact: true }).fill(`QA newer than export ${run}`);
      await page.getByRole("button", { name: "Simpan perubahan", exact: true }).click();
      await expect(page.getByRole("status")).toHaveText("Perubahan tersimpan.");
      await second.reload();
      await expect(second.locator("[data-admin-ready=true]")).toBeVisible();
      const upload = second.locator('input[type="file"][accept=".xlsx"]');
      const preview = second.locator("section").filter({ has: second.getByRole("heading", { name: "Periksa isi Excel" }) });
      const confirm = preview.getByRole("button", { name: "Simpan isi Excel", exact: true });
      await upload.setInputFiles(oldFile);
      await expect(preview).toContainText("sudah tertinggal dari perubahan terbaru");
      await expect(confirm).toBeDisabled();
      await expect(second.getByLabel("Judul", { exact: true })).toHaveValue(`QA newer than export ${run}`);
      await upload.setInputFiles(workbookPayload(`QA legacy replacement ${run}`));
      await expect(preview).toContainText("belum memiliki versi sumber");
      await expect(confirm).toBeDisabled();
      const freshFile = await exportPayload(second, book => {
        book.Sheets.tryout.A2 = { t: "s", v: `QA fresh export saved ${run}` };
        const headers = XLSX.utils.sheet_to_json<string[]>(book.Sheets.questions, { header: 1 })[0];
        for (const [header, value] of [["correct_option", "C"], ["explanation", "Pembahasan dari unduhan terbaru."], ["picture_url", "https://example.test/fresh.png"]]) {
          book.Sheets.questions[XLSX.utils.encode_cell({ r: 1, c: headers.indexOf(header) })] = { t: "s", v: value };
        }
      });
      await upload.setInputFiles(freshFile);
      await expect(confirm).toBeEnabled();
      await confirm.click();
      await expect(preview).toHaveCount(0);
      await second.reload();
      await expect(second.getByLabel("Judul", { exact: true })).toHaveValue(`QA fresh export saved ${run}`);
      const row = second.locator(".admin-list-row").filter({ hasText: text });
      await expect(row).toContainText("Kunci jawaban: C");
      await expect(row).toContainText("Pembahasan dari unduhan terbaru.");
      await row.getByRole("button", { name: "Ubah", exact: true }).click();
      await expect(second.locator("#question-editor").getByLabel("Gambar soal, opsional", { exact: true })).toHaveValue("https://example.test/fresh.png");
    } finally {
      await other.close();
    }
  });
});
