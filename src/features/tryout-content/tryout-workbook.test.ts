import assert from "node:assert/strict";
import test from "node:test";
import * as XLSX from "xlsx";
import { readTryoutWorkbook } from "./tryout-workbook";
import { makeSampleWorkbook, makeTryoutWorkbook } from "./tryout-workbook-sheets";
import { sameWorkbookQuestionContent, toQuestionInsertValues } from "./tryout-question-content-values";

function file(book: XLSX.WorkBook) {
  return new File([XLSX.write(book, { type: "buffer", bookType: "xlsx" })], "soal.xlsx");
}
async function sample(mutate?: (book: XLSX.WorkBook) => void) {
  const book = makeSampleWorkbook(XLSX, []); mutate?.(book);
  return readTryoutWorkbook(file(book), []);
}

test("the downloaded sample imports and explains the workflow in Indonesian", async () => {
  const book = makeSampleWorkbook(XLSX, []);
  const result = await readTryoutWorkbook(file(book), []);
  assert.deepEqual(result.issues, []);
  assert.equal(result.data?.questions.length, 2);
  assert.equal(result.data?.questions[0].correctOption, "B");
  assert.match(XLSX.utils.sheet_to_csv(book.Sheets.panduan), /mengganti seluruh daftar soal/);
});

test("zero and blank order do not silently turn into a valid order", async () => {
  for (const value of [0, "", -1, 1.5, "satu"]) {
    const result = await sample((book) => { book.Sheets.questions.B2 = { t: typeof value === "number" ? "n" : "s", v: value }; });
    assert.ok(result.issues.some((issue) => issue.field === "sort_order" && issue.row === 2));
  }
});

test("extra tryout rows and duplicate orders are rejected with row information", async () => {
  const result = await sample((book) => {
    XLSX.utils.sheet_add_aoa(book.Sheets.tryout, [["Tryout tambahan", "Deskripsi", "", "Farmakologi", 30, "free", "draft"]], { origin: "A3" });
    book.Sheets.questions.B3 = { t: "n", v: 1 };
  });
  assert.ok(result.issues.some((issue) => issue.sheet === "tryout" && issue.message.includes("satu baris")));
  assert.ok(result.issues.some((issue) => issue.field === "sort_order" && issue.row === 3 && issue.message.includes("baris 2")));
});

test("published tryout without published questions is rejected before import", async () => {
  const result = await sample((book) => { book.Sheets.tryout.G2 = { t: "s", v: "published" }; });
  assert.ok(result.issues.some((issue) => issue.field === "status" && issue.sheet === "tryout"));
});

test("missing sheets, headers, required answers, and missing option E are actionable", async () => {
  const missing = await sample((book) => { delete book.Sheets.questions; book.SheetNames = book.SheetNames.filter((name) => name !== "questions"); });
  assert.equal(missing.data, null);
  assert.match(missing.issues[0].message, /Lembar questions/);
  const result = await sample((book) => {
    book.Sheets.questions.I1 = { t: "s", v: "wrong_header" };
    book.Sheets.questions.J2 = { t: "s", v: "" };
    book.Sheets.questions.O2 = { t: "s", v: "E" };
  });
  assert.ok(result.issues.some((issue) => issue.field === "question_text" && issue.row === 1));
  assert.ok(result.issues.some((issue) => issue.field === "option_a" && issue.row === 2));
  assert.ok(result.issues.some((issue) => issue.field === "option_e" && issue.row === 2));
});

test("invalid statuses, access, URLs, durations, and oversized titles are rejected", async () => {
  const result = await sample((book) => {
    book.Sheets.tryout.A2 = { t: "s", v: "x".repeat(161) };
    book.Sheets.tryout.E2 = { t: "n", v: 301 };
    book.Sheets.questions.Q2 = { t: "s", v: "javascript:alert(1)" };
    // Header lookup avoids dependence on optional column positions.
    const headers = XLSX.utils.sheet_to_json<string[]>(book.Sheets.questions, { header: 1 })[0];
    for (const [header, value] of [["status", "tayang"], ["access_level", "platinum"]]) {
      book.Sheets.questions[XLSX.utils.encode_cell({ r: 1, c: headers.indexOf(header) })] = { t: "s", v: value };
    }
  });
  for (const field of ["title", "duration_minutes", "video_url", "status", "access_level"]) assert.ok(result.issues.some((issue) => issue.field === field));
});

test("images, key, pembahasan and taxonomy names survive workbook round trip", async () => {
  const result = await sample();
  assert.ok(result.data);
  result.data.questions[0].pictureUrl = "https://example.test/question.png";
  result.data.questions[0].questionId = "old-question";
  const id = "source-tryout";
  const updatedAt = "2026-10-04T11:00:00.000Z";
  const exported = makeTryoutWorkbook(XLSX, { ...result.data, tryout: { ...result.data.tryout, id, updatedAt } }, []);
  const imported = await readTryoutWorkbook(file(exported), []);
  assert.deepEqual(imported.data, { ...result.data, source: { version: 1, tryoutId: id, updatedAt } });
  const values = toQuestionInsertValues(imported.data!.questions[0]);
  assert.equal(values.pictureUrl, "https://example.test/question.png");
  assert.equal(values.correctOption, "B");
  assert.equal(values.explanation, result.data.questions[0].explanation);
  assert.equal(sameWorkbookQuestionContent(values, imported.data!.questions[0]), true);
});

test("legacy workbook does not tell the importer to erase an existing image", async () => {
  const result = await sample((book) => {
    // Previous templates ended with video_url, access_level and status.
    const rows = XLSX.utils.sheet_to_json<unknown[]>(book.Sheets.questions, { header: 1 });
    const column = rows[0].indexOf("picture_url");
    rows.forEach((row) => row.splice(column, 1));
    book.Sheets.questions = XLSX.utils.aoa_to_sheet(rows);
  });
  assert.deepEqual(result.issues, []);
  assert.equal(result.data?.questions[0].pictureUrl, undefined);
});

test("exports bind replacements to their tryout and revision while samples remain valid for creation", async () => {
  const result = await sample();
  assert.ok(result.data);
  const target = { id: "source-tryout", updatedAt: "2026-10-04T11:00:00.000Z" };
  const exported = makeTryoutWorkbook(XLSX, { ...result.data, tryout: { ...result.data.tryout, ...target } }, []);
  const current = await readTryoutWorkbook(file(exported), [], target);
  assert.deepEqual(current.issues, []);
  assert.deepEqual(current.data?.source, { version: 1, tryoutId: target.id, updatedAt: target.updatedAt });
  assert.equal(exported.Workbook?.Sheets?.find(sheet => sheet.name === "_ilmorax")?.Hidden, 1);

  const stale = await readTryoutWorkbook(file(exported), [], { ...target, updatedAt: "2026-10-04T11:00:00.001Z" });
  assert.ok(stale.issues.some(issue => issue.message.includes("sudah tertinggal")));
  const wrongTryout = await readTryoutWorkbook(file(exported), [], { ...target, id: "other-tryout" });
  assert.ok(wrongTryout.issues.some(issue => issue.message.includes("try-out lain")));
  const legacy = await readTryoutWorkbook(file(makeSampleWorkbook(XLSX, [])), [], target);
  assert.ok(legacy.issues.some(issue => issue.message.includes("belum memiliki versi sumber")));
  assert.deepEqual(result.issues, []);
});

test("malformed or duplicated source metadata cannot be imported", async () => {
  const result = await sample();
  assert.ok(result.data);
  const target = { id: "source-tryout", updatedAt: "2026-10-04T11:00:00.000Z" };
  for (const sourceRows of [
    [{ version: 1, tryoutId: target.id, updatedAt: "invalid" }],
    [{ version: 99, tryoutId: target.id, updatedAt: target.updatedAt }],
    [{ version: 1, tryoutId: "", updatedAt: target.updatedAt }],
    [1, 2].map(() => ({ version: 1, tryoutId: target.id, updatedAt: target.updatedAt })),
  ]) {
    const book = makeTryoutWorkbook(XLSX, { ...result.data, tryout: { ...result.data.tryout, ...target } }, []);
    book.Sheets._ilmorax = XLSX.utils.json_to_sheet(sourceRows);
    const imported = await readTryoutWorkbook(file(book), [], target);
    assert.ok(imported.issues.some(issue => issue.message.includes("tidak dapat dibaca")));
  }
});
