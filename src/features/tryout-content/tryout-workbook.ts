import { normalizeTryoutAccessLevel as normalizeDomainTryoutAccessLevel } from "../premium-access/premium-access";
import { questionSheetHeaders } from "./tryout-workbook-sheets";
import { getWorkbookSourceError, workbookSourceSchema } from "./tryout-workbook-source";
import type {
  CategoryOption,
  ContentStatus,
  QuestionAccessLevel,
  QuestionOption,
  TryoutAccessLevel,
  TryoutWorkbookQuestion,
  TryoutWorkbookTryout,
  TryoutWorkbookInput,
} from "./tryout-content-types";

export type {
  CategoryOption,
  ContentStatus,
  QuestionAccessLevel,
  QuestionOption as CorrectOption,
  QuestionOption,
  TryoutAccessLevel,
  TryoutWorkbookQuestion,
  TryoutWorkbookTryout,
};

export type TryoutWorkbookData = TryoutWorkbookInput;

export type WorkbookValidationIssue = {
  sheet: "tryout" | "questions" | "workbook";
  row?: number;
  field?: string;
  message: string;
};

export type WorkbookTaxonomyAction = {
  sheet: "tryout" | "questions";
  row: number;
  field: "category_name" | "sub_category_name" | "topic_name";
  name: string;
  parentName?: string;
  mode: "reuse" | "create";
};

type TryoutSheetRow = {
  __rowNum__?: number;
  title?: string;
  description?: string;
  category_id?: string;
  category_name?: string;
  duration_minutes?: number | string;
  access_level?: string;
  status?: string;
};

type QuestionSheetRow = {
  __rowNum__?: number;
  question_id?: string;
  sort_order?: number | string;
  category_id?: string;
  category_name?: string;
  sub_category_id?: string;
  sub_category_name?: string;
  topic_id?: string;
  topic_name?: string;
  question_text?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  option_e?: string;
  correct_option?: string;
  explanation?: string;
  video_url?: string;
  picture_url?: string;
  access_level?: string;
  status?: string;
};

const requiredTryoutFields = [
  "title",
  "description",
  "duration_minutes",
  "access_level",
  "status",
] as const;

const requiredTryoutSheetHeaders = [
  "title",
  "description",
  "category_id",
  "duration_minutes",
  "access_level",
  "status",
] as const;

const requiredQuestionFields = [
  "sort_order",
  "question_text",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_option",
  "explanation",
  "access_level",
  "status",
] as const;

const requiredQuestionSheetHeaders = [
  "question_id",
  "sort_order",
  "category_id",
  "sub_category_id",
  "topic_id",
  "question_text",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "option_e",
  "correct_option",
  "explanation",
  "video_url",
  "access_level",
  "status",
] as const;

function isWebUrl(value: string) {
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}

export async function readTryoutWorkbook(
  file: File, categories: CategoryOption[], target?: { id: string; updatedAt: string },
) {
  if (!file.name.toLowerCase().endsWith(".xlsx") || file.size > 10 * 1024 * 1024) {
    return { data: null, issues: [{ sheet: "workbook" as const, message: "Gunakan file .xlsx dengan ukuran maksimal 10 MB." }], taxonomyActions: [] };
  }
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const tryoutSheet = workbook.Sheets.tryout;
  const questionsSheet = workbook.Sheets.questions;
  const issues: WorkbookValidationIssue[] = [];
  const taxonomyActions: WorkbookTaxonomyAction[] = [];

  if (!tryoutSheet) {
    issues.push({ sheet: "workbook", message: "Lembar tryout tidak ada. Gunakan contoh Excel dari halaman admin." });
  }

  if (!questionsSheet) {
    issues.push({ sheet: "workbook", message: "Lembar questions tidak ada. Gunakan contoh Excel dari halaman admin." });
  }

  if (!tryoutSheet || !questionsSheet) {
    return { data: null, issues, taxonomyActions };
  }

  addMissingHeaderIssues("tryout", getSheetHeaders(XLSX, tryoutSheet), requiredTryoutSheetHeaders, issues);
  addMissingHeaderIssues("questions", getSheetHeaders(XLSX, questionsSheet), requiredQuestionSheetHeaders, issues);

  const tryoutRows = XLSX.utils.sheet_to_json<TryoutSheetRow>(tryoutSheet, { defval: "" });
  const [tryoutRow] = tryoutRows;
  if (tryoutRows.length > 1) issues.push({ sheet: "tryout", message: "Isi hanya satu baris try-out. Hapus baris tambahan." });
  const questionRows = XLSX.utils
    .sheet_to_json<QuestionSheetRow>(questionsSheet, { defval: "" })
    .filter((row) => !isEmptyQuestionRow(row));

  if (!tryoutRow) {
    issues.push({ sheet: "tryout", row: 2, message: "Isi satu baris try-out pada baris 2." });
    return { data: null, issues, taxonomyActions };
  }

  const data: TryoutWorkbookData = {
    tryout: toTryoutWorkbookTryout(tryoutRow),
    questions: questionRows.map(toTryoutWorkbookQuestion),
  };

  const sourceSheet = workbook.Sheets._ilmorax;
  if (sourceSheet) {
    const rows = XLSX.utils.sheet_to_json(sourceSheet);
    const parsed = workbookSourceSchema.safeParse(rows[0]);
    if (rows.length !== 1 || !parsed.success) {
      issues.push({ sheet: "workbook", message: "Versi sumber file Excel tidak dapat dibaca. Unduh Excel terbaru dari try-out ini." });
    } else {
      data.source = parsed.data;
    }
  }
  if (target) {
    const sourceError = getWorkbookSourceError(data.source, target);
    if (sourceError) issues.push({ sheet: "workbook", message: sourceError });
  }

  if (questionRows.length > 500) issues.push({ sheet: "questions", message: "Maksimal 500 soal per try-out. Pisahkan soal ke try-out lain." });
  if (data.tryout.status === "published" && !data.questions.some((question) => question.status === "published")) {
    issues.push({ sheet: "tryout", row: 2, field: "status", message: "Try-out published harus memiliki minimal satu soal published. Gunakan draft saat masih menyiapkan soal." });
  }
  validateTryoutRow(tryoutRow, data.tryout, categories, issues, taxonomyActions);
  validateQuestionRows(questionRows, data.questions, categories, issues, taxonomyActions);

  return { data, issues, taxonomyActions };
}

function getSheetHeaders(
  XLSX: typeof import("xlsx"),
  sheet: import("xlsx").WorkSheet,
) {
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false });
  const headerRow = rows[0] ?? [];

  return new Set(headerRow.map((header) => textValue(header)));
}

function addMissingHeaderIssues(
  sheet: "tryout" | "questions",
  headers: Set<string>,
  expectedHeaders: readonly string[],
  issues: WorkbookValidationIssue[],
) {
  for (const header of expectedHeaders) {
    if (headers.has(header)) continue;

    issues.push({
      sheet,
      row: 1,
      field: header,
      message: `Kolom ${header} tidak ada. Unduh contoh Excel terbaru dan pertahankan nama kolom.`,
    });
  }
}

function toTryoutWorkbookTryout(row: TryoutSheetRow): TryoutWorkbookTryout {
  return {
    title: textValue(row.title),
    description: textValue(row.description),
    categoryId: textValue(row.category_id),
    categoryName: optionalTextValue(row.category_name),
    durationMinutes: numberValue(row.duration_minutes),
    accessLevel: normalizeTryoutAccessLevel(row.access_level),
    status: normalizeContentStatus(row.status),
  };
}

function toTryoutWorkbookQuestion(row: QuestionSheetRow, index: number): TryoutWorkbookQuestion {
  return {
    questionId: optionalTextValue(row.question_id),
    sortOrder: numberValue(row.sort_order),
    categoryId: textValue(row.category_id),
    categoryName: optionalTextValue(row.category_name),
    subCategoryId: textValue(row.sub_category_id),
    subCategoryName: optionalTextValue(row.sub_category_name),
    topicId: textValue(row.topic_id),
    topicName: optionalTextValue(row.topic_name),
    questionText: textValue(row.question_text),
    optionA: textValue(row.option_a),
    optionB: textValue(row.option_b),
    optionC: textValue(row.option_c),
    optionD: textValue(row.option_d),
    optionE: optionalTextValue(row.option_e),
    correctOption: normalizeCorrectOption(row.correct_option),
    explanation: textValue(row.explanation),
    videoUrl: optionalTextValue(row.video_url),
    pictureUrl: row.picture_url === undefined ? undefined : textValue(row.picture_url),
    accessLevel: normalizeQuestionAccessLevel(row.access_level),
    status: normalizeContentStatus(row.status),
  };
}

function validateTryoutRow(
  raw: TryoutSheetRow,
  tryout: TryoutWorkbookTryout,
  categories: CategoryOption[],
  issues: WorkbookValidationIssue[],
  taxonomyActions: WorkbookTaxonomyAction[],
) {
  for (const field of requiredTryoutFields) {
    if (textValue(raw[field])) continue;

    issues.push({ sheet: "tryout", row: getRowNumber(raw, 2), field, message: `Kolom ${field} wajib diisi. Lihat lembar panduan untuk contoh isian.` });
  }

  if (tryout.title.length > 160) issues.push({ sheet: "tryout", row: getRowNumber(raw, 2), field: "title", message: "Judul maksimal 160 karakter." });
  if (tryout.description.length > 500) issues.push({ sheet: "tryout", row: getRowNumber(raw, 2), field: "description", message: "Deskripsi maksimal 500 karakter." });
  if (!Number.isInteger(tryout.durationMinutes) || tryout.durationMinutes < 1 || tryout.durationMinutes > 300) {
    issues.push({ sheet: "tryout", row: getRowNumber(raw, 2), field: "duration_minutes", message: "Isi durasi dengan angka bulat 1 sampai 300 menit." });
  }

  if (!isAccessLevel(raw.access_level)) {
    issues.push({ sheet: "tryout", row: getRowNumber(raw, 2), field: "access_level", message: "Isi free untuk gratis atau premium untuk akses berbayar." });
  }

  if (!isContentStatus(raw.status)) {
    issues.push({ sheet: "tryout", row: getRowNumber(raw, 2), field: "status", message: "Isi draft untuk draf, published untuk tayang, atau unpublished untuk disembunyikan." });
  }

  resolveCategoryReference({
    sheet: "tryout",
    row: getRowNumber(raw, 2),
    categoryId: tryout.categoryId,
    categoryName: tryout.categoryName,
    categories,
    issues,
    taxonomyActions,
  });
}

function validateQuestionRows(
  rawRows: QuestionSheetRow[],
  questions: TryoutWorkbookQuestion[],
  categories: CategoryOption[],
  issues: WorkbookValidationIssue[],
  taxonomyActions: WorkbookTaxonomyAction[],
) {
  const questionIds = new Map<string, number>();
  const sortOrders = new Map<number, number>();
  const questionTexts = new Map<string, number>();

  if (questions.length === 0) {
    issues.push({ sheet: "questions", row: 2, message: "Isi minimal satu soal pada lembar questions." });
    return;
  }

  rawRows.forEach((raw, index) => {
    const question = questions[index];
    const rowNumber = getRowNumber(raw, index + 2);
    const category = resolveCategoryReference({
      sheet: "questions",
      row: rowNumber,
      categoryId: question.categoryId,
      categoryName: question.categoryName,
      categories,
      issues,
      taxonomyActions,
    });

    for (const field of requiredQuestionFields) {
      if (textValue(raw[field])) continue;

      issues.push({ sheet: "questions", row: rowNumber, field, message: `Kolom ${field} wajib diisi. Lihat lembar panduan untuk contoh isian.` });
    }

    if (!Number.isInteger(question.sortOrder) || question.sortOrder < 1 || question.sortOrder > 1000) {
      issues.push({ sheet: "questions", row: rowNumber, field: "sort_order", message: "Isi nomor urut dengan angka bulat 1 sampai 1000." });
    }

    const subCategory = resolveSubCategoryReference({
      row: rowNumber,
      category,
      subCategoryId: question.subCategoryId,
      subCategoryName: question.subCategoryName,
      issues,
      taxonomyActions,
    });
    resolveTopicReference({
      row: rowNumber,
      subCategory,
      topicId: question.topicId,
      topicName: question.topicName,
      issues,
      taxonomyActions,
    });

    if (!isCorrectOption(raw.correct_option)) {
      issues.push({ sheet: "questions", row: rowNumber, field: "correct_option", message: "Isi kunci jawaban A, B, C, D, atau E." });
    }

    if (question.correctOption === "E" && !question.optionE) {
      issues.push({ sheet: "questions", row: rowNumber, field: "option_e", message: "Isi pilihan E karena kunci jawaban adalah E." });
    }

    if (!isAccessLevel(raw.access_level)) {
      issues.push({ sheet: "questions", row: rowNumber, field: "access_level", message: "Isi free untuk gratis atau premium untuk akses berbayar." });
    }

    if (!isContentStatus(raw.status)) {
      issues.push({ sheet: "questions", row: rowNumber, field: "status", message: "Isi draft untuk draf, published untuk tayang, atau unpublished untuk disembunyikan." });
    }

    for (const field of ["video_url", "picture_url"] as const) {
      const value = textValue(raw[field]);
      if (value && !isWebUrl(value)) issues.push({ sheet: "questions", row: rowNumber, field, message: "Isi tautan lengkap yang diawali https:// atau http://, atau kosongkan." });
    }
    addDuplicateIssue(question.questionId, questionIds, rowNumber, "question_id", issues);
    addDuplicateIssue(String(question.sortOrder), sortOrders, rowNumber, "sort_order", issues);
    addDuplicateIssue(question.questionText.toLowerCase(), questionTexts, rowNumber, "question_text", issues);
  });
}

function addDuplicateIssue(
  value: string | undefined,
  rowsByValue: Map<string | number, number>,
  rowNumber: number,
  field: string,
  issues: WorkbookValidationIssue[],
) {
  if (!value) return;

  const existingRow = rowsByValue.get(value);

  if (!existingRow) {
    rowsByValue.set(value, rowNumber);
    return;
  }

  issues.push({
    sheet: "questions",
    row: rowNumber,
    field,
    message: `Isian ${field} sama dengan baris ${existingRow}. Gunakan isian yang berbeda.`,
  });
}

function resolveCategoryReference({
  sheet,
  row,
  categoryId,
  categoryName,
  categories,
  issues,
  taxonomyActions,
}: {
  sheet: "tryout" | "questions";
  row: number;
  categoryId: string;
  categoryName?: string;
  categories: CategoryOption[];
  issues: WorkbookValidationIssue[];
  taxonomyActions: WorkbookTaxonomyAction[];
}) {
  if (categoryId) {
    const category = categories.find((item) => item.id === categoryId);

    if (category) return category;

    issues.push({ sheet, row, field: "category_id", message: "ID kategori tidak ditemukan. Kosongkan category_id lalu isi category_name." });
    return null;
  }

  if (!categoryName) {
    issues.push({ sheet, row, field: "category_name", message: "Isi nama kategori pada category_name. ID boleh kosong." });
    return null;
  }

  const category = categories.find((item) => sameName(item.name, categoryName));

  addTaxonomyAction(taxonomyActions, {
    sheet,
    row,
    field: "category_name",
    name: categoryName,
    mode: category ? "reuse" : "create",
  });

  if (category) return category;

  return {
    id: "",
    name: categoryName,
    subCategories: [],
  };
}

function resolveSubCategoryReference({
  row,
  category,
  subCategoryId,
  subCategoryName,
  issues,
  taxonomyActions,
}: {
  row: number;
  category: CategoryOption | null;
  subCategoryId: string;
  subCategoryName?: string;
  issues: WorkbookValidationIssue[];
  taxonomyActions: WorkbookTaxonomyAction[];
}) {
  if (!category) return null;

  if (subCategoryId) {
    if (!category.id) {
      issues.push({ sheet: "questions", row, field: "sub_category_id", message: "Kosongkan sub_category_id. Isi sub_category_name karena kategori ini baru." });
      return null;
    }

    const subCategory = category.subCategories?.find((item) => item.id === subCategoryId);

    if (subCategory) return subCategory;

    issues.push({ sheet: "questions", row, field: "sub_category_id", message: "Subkategori tidak sesuai dengan kategori. Periksa nama atau ID subkategori." });
    return null;
  }

  if (!subCategoryName) {
    issues.push({ sheet: "questions", row, field: "sub_category_name", message: "Isi nama subkategori pada sub_category_name. ID boleh kosong." });
    return null;
  }

  const subCategory = category.subCategories?.find((item) => sameName(item.name, subCategoryName));

  addTaxonomyAction(taxonomyActions, {
    sheet: "questions",
    row,
    field: "sub_category_name",
    name: subCategoryName,
    parentName: category.name,
    mode: subCategory ? "reuse" : "create",
  });

  if (subCategory) return subCategory;

  return {
    id: "",
    name: subCategoryName,
    topics: [],
  };
}

function resolveTopicReference({
  row,
  subCategory,
  topicId,
  topicName,
  issues,
  taxonomyActions,
}: {
  row: number;
  subCategory: NonNullable<CategoryOption["subCategories"]>[number] | null;
  topicId: string;
  topicName?: string;
  issues: WorkbookValidationIssue[];
  taxonomyActions: WorkbookTaxonomyAction[];
}) {
  if (!subCategory) return;

  if (topicId) {
    if (!subCategory.id) {
      issues.push({ sheet: "questions", row, field: "topic_id", message: "Kosongkan topic_id. Isi topic_name karena subkategori ini baru." });
      return;
    }

    if (subCategory.topics?.some((item) => item.id === topicId)) return;

    issues.push({ sheet: "questions", row, field: "topic_id", message: "Topik tidak sesuai dengan subkategori. Periksa nama atau ID topik." });
    return;
  }

  if (!topicName) {
    issues.push({ sheet: "questions", row, field: "topic_name", message: "Isi nama topik pada topic_name. ID boleh kosong." });
    return;
  }

  const topic = subCategory.topics?.find((item) => sameName(item.name, topicName));

  addTaxonomyAction(taxonomyActions, {
    sheet: "questions",
    row,
    field: "topic_name",
    name: topicName,
    parentName: subCategory.name,
    mode: topic ? "reuse" : "create",
  });
}

function addTaxonomyAction(
  taxonomyActions: WorkbookTaxonomyAction[],
  action: WorkbookTaxonomyAction,
) {
  const key = getTaxonomyActionKey(action);
  const alreadyAdded = taxonomyActions.some((item) => getTaxonomyActionKey(item) === key);

  if (alreadyAdded) return;

  taxonomyActions.push(action);
}

function getTaxonomyActionKey(action: WorkbookTaxonomyAction) {
  return [
    action.field,
    action.mode,
    normalizeName(action.parentName ?? ""),
    normalizeName(action.name),
  ].join(":");
}

function sameName(left: string, right: string) {
  return normalizeName(left) === normalizeName(right);
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function isEmptyQuestionRow(row: QuestionSheetRow) {
  return questionSheetHeaders.every((header) => !textValue(row[header]));
}

function textValue(value: unknown) {
  return String(value ?? "").trim();
}

function optionalTextValue(value: unknown) {
  const text = textValue(value);

  if (!text) return undefined;

  return text;
}

function numberValue(value: unknown) {
  const number = Number(value);

  if (!Number.isFinite(number)) return 0;

  return number;
}

function normalizeTryoutAccessLevel(value: unknown): TryoutAccessLevel {
  const accessLevel = textValue(value).toLowerCase();

  return normalizeDomainTryoutAccessLevel(accessLevel);
}

function normalizeQuestionAccessLevel(value: unknown): QuestionAccessLevel {
  const accessLevel = textValue(value).toLowerCase();

  if (accessLevel === "premium") return "premium";

  return "free";
}

function normalizeContentStatus(value: unknown): ContentStatus {
  const status = textValue(value).toLowerCase();

  if (status === "published" || status === "unpublished") {
    return status;
  }

  return "draft";
}

function normalizeCorrectOption(value: unknown): QuestionOption {
  const option = textValue(value).toUpperCase();

  if (option === "B" || option === "C" || option === "D" || option === "E") {
    return option;
  }

  return "A";
}

function isAccessLevel(value: unknown) {
  const accessLevel = textValue(value).toLowerCase();

  return accessLevel === "free" || accessLevel === "premium";
}

function isContentStatus(value: unknown) {
  const status = textValue(value).toLowerCase();

  return status === "draft" || status === "published" || status === "unpublished";
}

function isCorrectOption(value: unknown) {
  const option = textValue(value).toUpperCase();

  return option === "A" || option === "B" || option === "C" || option === "D" || option === "E";
}

function getRowNumber(row: { __rowNum__?: number }, fallback: number) {
  if (typeof row.__rowNum__ === "number") {
    return row.__rowNum__ + 1;
  }

  return fallback;
}
