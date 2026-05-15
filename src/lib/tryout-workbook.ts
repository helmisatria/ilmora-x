import { normalizeTryoutAccessLevel as normalizeDomainTryoutAccessLevel } from "./domain/premium-access";

export type AccessLevel = "free" | "premium";
export type ContentStatus = "draft" | "published" | "unpublished";
export type CorrectOption = "A" | "B" | "C" | "D" | "E";
export type QuestionAccessLevel = "free" | "premium";

export type CategoryOption = {
  id: string;
  name: string;
  subCategories?: { id: string; name: string }[];
};

export type TryoutWorkbookTryout = {
  title: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  durationMinutes: number;
  accessLevel: AccessLevel;
  status: ContentStatus;
};

export type TryoutWorkbookQuestion = {
  questionId?: string;
  sortOrder: number;
  categoryId: string;
  categoryName?: string;
  subCategoryId: string;
  subCategoryName?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  correctOption: CorrectOption;
  explanation: string;
  videoUrl?: string;
  accessLevel: QuestionAccessLevel;
  status: ContentStatus;
};

export type TryoutWorkbookData = {
  tryout: TryoutWorkbookTryout;
  questions: TryoutWorkbookQuestion[];
};

export type WorkbookValidationIssue = {
  sheet: "tryout" | "questions" | "workbook";
  row?: number;
  field?: string;
  message: string;
};

export type WorkbookTaxonomyAction = {
  sheet: "tryout" | "questions";
  row: number;
  field: "category_name" | "sub_category_name";
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
  question_text?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  option_e?: string;
  correct_option?: string;
  explanation?: string;
  video_url?: string;
  access_level?: string;
  status?: string;
};

export const tryoutSheetHeaders = [
  "title",
  "description",
  "category_id",
  "category_name",
  "duration_minutes",
  "access_level",
  "status",
] as const;

export const questionSheetHeaders = [
  "question_id",
  "sort_order",
  "category_id",
  "category_name",
  "sub_category_id",
  "sub_category_name",
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

export async function readTryoutWorkbook(file: File, categories: CategoryOption[]) {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const tryoutSheet = workbook.Sheets.tryout;
  const questionsSheet = workbook.Sheets.questions;
  const issues: WorkbookValidationIssue[] = [];
  const taxonomyActions: WorkbookTaxonomyAction[] = [];

  if (!tryoutSheet) {
    issues.push({ sheet: "workbook", message: "Missing tryout sheet." });
  }

  if (!questionsSheet) {
    issues.push({ sheet: "workbook", message: "Missing questions sheet." });
  }

  if (!tryoutSheet || !questionsSheet) {
    return { data: null, issues, taxonomyActions };
  }

  addMissingHeaderIssues("tryout", getSheetHeaders(XLSX, tryoutSheet), requiredTryoutSheetHeaders, issues);
  addMissingHeaderIssues("questions", getSheetHeaders(XLSX, questionsSheet), requiredQuestionSheetHeaders, issues);

  const [tryoutRow] = XLSX.utils.sheet_to_json<TryoutSheetRow>(tryoutSheet, { defval: "" });
  const questionRows = XLSX.utils
    .sheet_to_json<QuestionSheetRow>(questionsSheet, { defval: "" })
    .filter((row) => !isEmptyQuestionRow(row));

  if (!tryoutRow) {
    issues.push({ sheet: "tryout", row: 2, message: "Try-out sheet must include one row." });
    return { data: null, issues, taxonomyActions };
  }

  const data = {
    tryout: toTryoutWorkbookTryout(tryoutRow),
    questions: questionRows.map(toTryoutWorkbookQuestion),
  };

  validateTryoutRow(tryoutRow, data.tryout, categories, issues, taxonomyActions);
  validateQuestionRows(questionRows, data.questions, categories, issues, taxonomyActions);

  return { data, issues, taxonomyActions };
}

export function makeSampleTryoutRow() {
  return {
    title: "UKAI Try-out Sample",
    description: "Sample Try-out description. Replace this with the real Student-facing description.",
    category_id: "",
    category_name: "Farmakologi",
    duration_minutes: 30,
    access_level: "free",
    status: "draft",
  };
}

export function makeSampleQuestionRows() {
  return [
    {
      question_id: "",
      sort_order: 1,
      category_id: "",
      category_name: "Farmakologi",
      sub_category_id: "",
      sub_category_name: "Antibiotik",
      question_text: "Mekanisme kerja penisilin adalah:",
      option_a: "Menghambat sintesis protein",
      option_b: "Menghambat sintesis dinding sel",
      option_c: "Menghambat replikasi DNA",
      option_d: "Menghambat sintesis folat",
      option_e: "",
      correct_option: "B",
      explanation: "Penisilin menghambat sintesis dinding sel bakteri dengan mengikat protein pengikat penisilin.",
      video_url: "",
      access_level: "free",
      status: "draft",
    },
    {
      question_id: "",
      sort_order: 2,
      category_id: "",
      category_name: "Farmakologi",
      sub_category_id: "",
      sub_category_name: "NSAID",
      question_text: "NSAID yang paling selektif terhadap COX-2:",
      option_a: "Ibuprofen",
      option_b: "Celecoxib",
      option_c: "Aspirin",
      option_d: "Diklofenak",
      option_e: "",
      correct_option: "B",
      explanation: "Celecoxib adalah NSAID selektif COX-2 yang menurunkan risiko gangguan gastrointestinal.",
      video_url: "",
      access_level: "free",
      status: "draft",
    },
  ];
}

export function makeSheet(
  XLSX: typeof import("xlsx"),
  headers: readonly string[],
  rows: Record<string, string | number | null | undefined>[],
) {
  const sheet = XLSX.utils.aoa_to_sheet([Array.from(headers)]);

  if (rows.length === 0) {
    return sheet;
  }

  XLSX.utils.sheet_add_json(sheet, rows, {
    header: Array.from(headers),
    skipHeader: true,
    origin: "A2",
  });

  return sheet;
}

export function saveWorkbook(XLSX: typeof import("xlsx"), workbook: import("xlsx").WorkBook, fileName: string) {
  const workbookBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  const blob = new Blob([workbookBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function toTryoutSheetRow(tryout: TryoutWorkbookTryout) {
  return {
    title: tryout.title,
    description: tryout.description,
    category_id: tryout.categoryId,
    category_name: tryout.categoryName ?? "",
    duration_minutes: tryout.durationMinutes,
    access_level: tryout.accessLevel,
    status: tryout.status,
  };
}

export function toQuestionSheetRow(question: TryoutWorkbookQuestion & { questionId?: string }) {
  return {
    question_id: question.questionId ?? "",
    sort_order: question.sortOrder,
    category_id: question.categoryId,
    category_name: question.categoryName ?? "",
    sub_category_id: question.subCategoryId,
    sub_category_name: question.subCategoryName ?? "",
    question_text: question.questionText,
    option_a: question.optionA,
    option_b: question.optionB,
    option_c: question.optionC,
    option_d: question.optionD,
    option_e: question.optionE ?? "",
    correct_option: question.correctOption,
    explanation: question.explanation,
    video_url: question.videoUrl ?? "",
    access_level: question.accessLevel,
    status: question.status,
  };
}

export function formatTimestamp(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}-${hours}-${minutes}`;
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
      message: `Missing ${header} column.`,
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
    sortOrder: numberValue(row.sort_order) || index + 1,
    categoryId: textValue(row.category_id),
    categoryName: optionalTextValue(row.category_name),
    subCategoryId: textValue(row.sub_category_id),
    subCategoryName: optionalTextValue(row.sub_category_name),
    questionText: textValue(row.question_text),
    optionA: textValue(row.option_a),
    optionB: textValue(row.option_b),
    optionC: textValue(row.option_c),
    optionD: textValue(row.option_d),
    optionE: optionalTextValue(row.option_e),
    correctOption: normalizeCorrectOption(row.correct_option),
    explanation: textValue(row.explanation),
    videoUrl: optionalTextValue(row.video_url),
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

    issues.push({ sheet: "tryout", row: getRowNumber(raw, 2), field, message: `${field} is required.` });
  }

  if (!Number.isInteger(tryout.durationMinutes) || tryout.durationMinutes < 1 || tryout.durationMinutes > 300) {
    issues.push({ sheet: "tryout", row: getRowNumber(raw, 2), field: "duration_minutes", message: "duration_minutes must be an integer from 1 to 300." });
  }

  if (!isAccessLevel(raw.access_level)) {
    issues.push({ sheet: "tryout", row: getRowNumber(raw, 2), field: "access_level", message: "access_level must be free or premium." });
  }

  if (!isContentStatus(raw.status)) {
    issues.push({ sheet: "tryout", row: getRowNumber(raw, 2), field: "status", message: "status must be draft, published, or unpublished." });
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
    issues.push({ sheet: "questions", row: 2, message: "At least one Question row is required." });
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

      issues.push({ sheet: "questions", row: rowNumber, field, message: `${field} is required.` });
    }

    if (!Number.isInteger(question.sortOrder) || question.sortOrder < 1 || question.sortOrder > 1000) {
      issues.push({ sheet: "questions", row: rowNumber, field: "sort_order", message: "sort_order must be an integer from 1 to 1000." });
    }

    resolveSubCategoryReference({
      row: rowNumber,
      category,
      subCategoryId: question.subCategoryId,
      subCategoryName: question.subCategoryName,
      issues,
      taxonomyActions,
    });

    if (!isCorrectOption(raw.correct_option)) {
      issues.push({ sheet: "questions", row: rowNumber, field: "correct_option", message: "correct_option must be A, B, C, D, or E." });
    }

    if (question.correctOption === "E" && !question.optionE) {
      issues.push({ sheet: "questions", row: rowNumber, field: "option_e", message: "option_e is required when correct_option is E." });
    }

    if (!isAccessLevel(raw.access_level)) {
      issues.push({ sheet: "questions", row: rowNumber, field: "access_level", message: "access_level must be free or premium." });
    }

    if (!isContentStatus(raw.status)) {
      issues.push({ sheet: "questions", row: rowNumber, field: "status", message: "status must be draft, published, or unpublished." });
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
    message: `${field} duplicates row ${existingRow}.`,
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

    issues.push({ sheet, row, field: "category_id", message: "category_id does not match an existing Category." });
    return null;
  }

  if (!categoryName) {
    issues.push({ sheet, row, field: "category_name", message: "category_id or category_name is required." });
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
  if (!category) return;

  if (subCategoryId) {
    if (!category.id) {
      issues.push({ sheet: "questions", row, field: "sub_category_id", message: "Use sub_category_name when category_name will create a new Category." });
      return;
    }

    if (category.subCategories?.some((item) => item.id === subCategoryId)) return;

    issues.push({ sheet: "questions", row, field: "sub_category_id", message: "sub_category_id does not belong to category_id." });
    return;
  }

  if (!subCategoryName) {
    issues.push({ sheet: "questions", row, field: "sub_category_name", message: "sub_category_id or sub_category_name is required." });
    return;
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

function normalizeTryoutAccessLevel(value: unknown): AccessLevel {
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

function normalizeCorrectOption(value: unknown): CorrectOption {
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
