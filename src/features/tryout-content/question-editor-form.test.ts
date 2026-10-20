import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getNextSortOrder,
  getServerFieldError,
  isSameQuestion,
  makeNextQuestion,
  parsePastedOptions,
  parsePastedQuestion,
  validateQuestion,
  type QuestionEditorValues,
} from "./question-editor-form";
import { getTryoutServerFieldError, validateTryoutDetails } from "./tryout-details-form";

const filled: QuestionEditorValues = {
  categoryId: "cat",
  subCategoryId: "sub",
  topicId: "topic",
  questionText: "Obat pilihan?",
  optionA: "A1",
  optionB: "B1",
  optionC: "C1",
  optionD: "D1",
  optionE: "",
  correctOption: "B",
  explanation: "Karena B.",
  videoUrl: "",
  pictureUrl: "",
  accessLevel: "free",
  sortOrder: "3",
  status: "draft",
};

test("a complete question has no errors", () => {
  const result = validateQuestion(filled);

  assert.deepEqual(result.errors, {});
  assert.equal(result.summary, "");
  assert.equal(result.firstInvalidField, null);
});

test("an empty question marks each required field and keeps the known summary", () => {
  const result = validateQuestion({ ...filled, questionText: " ", optionA: "", optionD: "", explanation: "" });

  assert.equal(result.summary, "Isi teks soal dan pembahasan.");
  assert.equal(result.errors.questionText, "Teks soal wajib diisi.");
  assert.equal(result.errors.optionA, "Pilihan A wajib diisi.");
  assert.equal(result.errors.optionD, "Pilihan D wajib diisi.");
  assert.equal(result.errors.explanation, "Pembahasan wajib diisi.");
  assert.equal(result.firstInvalidField, "questionText");
});

test("answer key E needs option E", () => {
  const result = validateQuestion({ ...filled, correctOption: "E" });

  assert.equal(result.summary, "Isi pilihan E karena kunci jawaban adalah E.");
  assert.equal(result.firstInvalidField, "optionE");
});

test("sort order must be a whole number from 1 to 1000", () => {
  for (const sortOrder of ["0", "1001", "2.5", "", "abc"]) {
    assert.equal(validateQuestion({ ...filled, sortOrder }).errors.sortOrder, "Isi angka 1 sampai 1000.", sortOrder);
  }

  assert.equal(validateQuestion({ ...filled, sortOrder: "1000" }).errors.sortOrder, undefined);
  assert.equal(validateQuestion({ ...filled, sortOrder: undefined }).errors.sortOrder, undefined);
});

test("server sort order conflicts point at the sort order field", () => {
  assert.deepEqual(getServerFieldError("Nomor urut 1 sudah dipakai. Pilih nomor lain."), { sortOrder: "Nomor ini sudah dipakai soal lain." });
  assert.deepEqual(getServerFieldError("Admin lain sudah mengubah data ini."), {});
});

test("dirty check compares every field", () => {
  assert.equal(isSameQuestion(filled, { ...filled }), true);
  assert.equal(isSameQuestion(filled, { ...filled, optionC: "C2" }), false);
  assert.equal(isSameQuestion(filled, { ...filled, status: "published" }), false);
});

test("the next question keeps taxonomy, access, and status but clears the content", () => {
  const next = makeNextQuestion({ ...filled, accessLevel: "premium", status: "published", pictureUrl: "x" }, 4);

  assert.equal(next.categoryId, "cat");
  assert.equal(next.topicId, "topic");
  assert.equal(next.accessLevel, "premium");
  assert.equal(next.status, "published");
  assert.equal(next.sortOrder, "4");
  assert.equal(next.questionText, "");
  assert.equal(next.optionB, "");
  assert.equal(next.pictureUrl, "");
  assert.equal(next.correctOption, "A");
  assert.equal(getNextSortOrder([1, 7, 3]), 8);
  assert.equal(getNextSortOrder([]), 1);
});

test("a pasted question with labelled options and a key fills the editor", () => {
  const parsed = parsePastedQuestion([
    "Pasien 45 tahun datang dengan keluhan nyeri dada.",
    "Obat pilihan pertama adalah?",
    "A. Aspirin",
    "B) Nitrogliserin",
    "(C) Morfin",
    "d. Oksigen",
    "   yang dilembapkan",
    "E. Heparin",
    "Kunci: B",
  ].join("\n"));

  assert.deepEqual(parsed, {
    questionText: "Pasien 45 tahun datang dengan keluhan nyeri dada.\nObat pilihan pertama adalah?",
    options: {
      optionA: "Aspirin",
      optionB: "Nitrogliserin",
      optionC: "Morfin",
      optionD: "Oksigen yang dilembapkan",
      optionE: "Heparin",
    },
    correctOption: "B",
  });
});

test("plain text without options A to D is not treated as a pasted question", () => {
  assert.equal(parsePastedQuestion("Satu baris soal"), null);
  assert.equal(parsePastedQuestion("Soal\nA. satu\nB. dua"), null);
});

test("lines pasted into an option fill the following options", () => {
  assert.deepEqual(parsePastedOptions("Aspirin\nNitrogliserin\nMorfin\nOksigen", "A"), {
    optionA: "Aspirin",
    optionB: "Nitrogliserin",
    optionC: "Morfin",
    optionD: "Oksigen",
  });
  assert.deepEqual(parsePastedOptions("C. Morfin\nD. Oksigen", "C"), { optionC: "Morfin", optionD: "Oksigen" });
  assert.equal(parsePastedOptions("Satu baris", "A"), null);
  assert.equal(parsePastedOptions("1\n2\n3", "D"), null);
});

test("try-out details report each missing field with the known summary", () => {
  const result = validateTryoutDetails({ title: "", description: "", icon: "", categoryId: "", durationMinutes: "30", accessLevel: "free" });

  assert.equal(result.summary, "Isi judul, deskripsi, dan kategori.");
  assert.equal(result.errors.title, "Judul wajib diisi.");
  assert.equal(result.errors.description, "Deskripsi wajib diisi.");
  assert.equal(result.errors.categoryId, "Pilih kategori.");
  assert.equal(result.firstInvalidField, "title");
});

test("try-out duration must be 1 to 300 minutes", () => {
  const base = { title: "T", description: "D", icon: "", categoryId: "c", accessLevel: "free" as const };

  assert.equal(validateTryoutDetails({ ...base, durationMinutes: "301" }).summary, "Isi durasi dengan angka bulat 1 sampai 300 menit.");
  assert.equal(validateTryoutDetails({ ...base, durationMinutes: "1.5" }).errors.durationMinutes, "Isi angka 1 sampai 300.");
  assert.equal(validateTryoutDetails({ ...base, durationMinutes: "300" }).summary, "");
});

test("the next bank question has no sort order to carry over", () => {
  const { sortOrder, status, ...bankQuestion } = filled;
  const next = makeNextQuestion(bankQuestion);

  assert.equal(next.sortOrder, undefined);
  assert.equal(next.categoryId, "cat");
  assert.equal(next.questionText, "");
});

test("a taken try-out title points at the title field", () => {
  assert.deepEqual(getTryoutServerFieldError("Judul try-out sudah dipakai. Gunakan judul lain."), { title: "Judul ini sudah dipakai try-out lain." });
  assert.deepEqual(getTryoutServerFieldError("Admin lain sudah mengubah data ini."), {});
});
