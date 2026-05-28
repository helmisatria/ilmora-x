import type {
  CategoryOption,
  TryoutWorkbookQuestion,
  TryoutWorkbookTryout,
} from "./tryout-content-types";

type TryoutWorkbookSheetData = {
  tryout: TryoutWorkbookTryout;
  questions: Array<TryoutWorkbookQuestion & { questionId?: string }>;
};

const tryoutSheetHeaders = [
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

const guidelineSheetHeaders = [
  "sheet",
  "column",
  "required",
  "possible_values",
  "notes",
] as const;

function makeSampleTryoutRow() {
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

function makeSampleQuestionRows() {
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

function makeGuidelineRows(categories: CategoryOption[]) {
  return [
    ...makeTryoutGuidelineRows(categories),
    ...makeQuestionGuidelineRows(categories),
    ...makeCategoryGuidelineRows(categories),
  ];
}

export function makeSampleWorkbook(XLSX: typeof import("xlsx"), categories: CategoryOption[]) {
  return makeWorkbookFromRows(XLSX, {
    tryoutRows: [makeSampleTryoutRow()],
    questionRows: makeSampleQuestionRows(),
    categories,
  });
}

export function makeTryoutWorkbook(
  XLSX: typeof import("xlsx"),
  data: TryoutWorkbookSheetData,
  categories: CategoryOption[],
) {
  return makeWorkbookFromRows(XLSX, {
    tryoutRows: [toTryoutSheetRow(data.tryout)],
    questionRows: data.questions.map(toQuestionSheetRow),
    categories,
  });
}

export function makeSampleWorkbookFileName(date: Date) {
  return `ilmorax-tryout-sample-${formatTimestamp(date)}.xlsx`;
}

export function makeTryoutWorkbookFileName(slug: string | null | undefined, date: Date) {
  return `${slug || "tryout"}-workbook-${formatTimestamp(date)}.xlsx`;
}

function makeSheet(
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

  sheet["!cols"] = headers.map((header) => ({
    wch: getColumnWidth(header, rows),
  }));

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

function toTryoutSheetRow(tryout: TryoutWorkbookTryout) {
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

function toQuestionSheetRow(question: TryoutWorkbookQuestion & { questionId?: string }) {
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

function formatTimestamp(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}-${hours}-${minutes}`;
}

function makeWorkbookFromRows(
  XLSX: typeof import("xlsx"),
  {
    tryoutRows,
    questionRows,
    categories,
  }: {
    tryoutRows: Record<string, string | number | null | undefined>[];
    questionRows: Record<string, string | number | null | undefined>[];
    categories: CategoryOption[];
  },
) {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    makeSheet(XLSX, tryoutSheetHeaders, tryoutRows),
    "tryout",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    makeSheet(XLSX, questionSheetHeaders, questionRows),
    "questions",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    makeSheet(XLSX, guidelineSheetHeaders, makeGuidelineRows(categories)),
    "guideline",
  );

  return workbook;
}

function makeTryoutGuidelineRows(categories: CategoryOption[]) {
  return [
    makeGuidelineRow("tryout", "title", "Yes", "Any text", "Name shown to students and admins."),
    makeGuidelineRow("tryout", "description", "Yes", "Any text", "Short student-facing description."),
    makeGuidelineRow("tryout", "category_id", "Use category_id or category_name", getCategoryIdsText(categories), "Use an existing Category ID when available."),
    makeGuidelineRow("tryout", "category_name", "Use category_id or category_name", getCategoryNamesText(categories), "Use an existing Category name or type a new one to create it during import."),
    makeGuidelineRow("tryout", "duration_minutes", "Yes", "1-300", "Whole number of minutes."),
    makeGuidelineRow("tryout", "access_level", "Yes", "free, premium", "Controls who can access this Try-out."),
    makeGuidelineRow("tryout", "status", "Yes", "draft, published, unpublished", "Use draft while preparing content."),
  ];
}

function makeQuestionGuidelineRows(categories: CategoryOption[]) {
  return [
    makeGuidelineRow("questions", "question_id", "No", "Existing Question ID", "Leave blank to create a new Question. Use the exported ID to update an existing Question."),
    makeGuidelineRow("questions", "sort_order", "Yes", "1-1000", "Question order inside the Try-out. Must be unique."),
    makeGuidelineRow("questions", "category_id", "Use category_id or category_name", getCategoryIdsText(categories), "Use an existing Category ID when available."),
    makeGuidelineRow("questions", "category_name", "Use category_id or category_name", getCategoryNamesText(categories), "Use an existing Category name or type a new one to create it during import."),
    makeGuidelineRow("questions", "sub_category_id", "Use sub_category_id or sub_category_name", getSubCategoryIdsText(categories), "Must belong to the selected category_id."),
    makeGuidelineRow("questions", "sub_category_name", "Use sub_category_id or sub_category_name", getSubCategoryNamesText(categories), "Use an existing Sub-category name or type a new one to create it during import."),
    makeGuidelineRow("questions", "question_text", "Yes", "Any text", "Question prompt shown to students."),
    makeGuidelineRow("questions", "option_a", "Yes", "Any text", "Answer option A."),
    makeGuidelineRow("questions", "option_b", "Yes", "Any text", "Answer option B."),
    makeGuidelineRow("questions", "option_c", "Yes", "Any text", "Answer option C."),
    makeGuidelineRow("questions", "option_d", "Yes", "Any text", "Answer option D."),
    makeGuidelineRow("questions", "option_e", "Only when correct_option is E", "Any text or blank", "Leave blank when this question only has A-D options."),
    makeGuidelineRow("questions", "correct_option", "Yes", "A, B, C, D, E", "Must match one filled option column."),
    makeGuidelineRow("questions", "explanation", "Yes", "Any text", "Shown in the review or discussion flow."),
    makeGuidelineRow("questions", "video_url", "No", "Valid URL or blank", "Optional supporting video URL."),
    makeGuidelineRow("questions", "access_level", "Yes", "free, premium", "Controls who can access this Question."),
    makeGuidelineRow("questions", "status", "Yes", "draft, published, unpublished", "Published Try-outs need published Questions."),
  ];
}

function makeCategoryGuidelineRows(categories: CategoryOption[]) {
  if (categories.length === 0) {
    return [
      makeGuidelineRow("reference", "category_id", "Reference", "No existing categories loaded", "Admins can use category_name to create a Category during import."),
    ];
  }

  return categories.flatMap((category) => {
    const categoryRow = makeGuidelineRow("reference", "category_id", "Reference", category.id, category.name);
    const subCategoryRows = (category.subCategories ?? []).map((subCategory) => (
      makeGuidelineRow("reference", "sub_category_id", "Reference", subCategory.id, `${subCategory.name} under category_id ${category.id}`)
    ));

    return [categoryRow, ...subCategoryRows];
  });
}

function makeGuidelineRow(
  sheet: string,
  column: string,
  required: string,
  possibleValues: string,
  notes: string,
) {
  return {
    sheet,
    column,
    required,
    possible_values: possibleValues,
    notes,
  };
}

function getCategoryIdsText(categories: CategoryOption[]) {
  if (categories.length === 0) return "Use category_name";

  return categories.map((category) => category.id).join(", ");
}

function getCategoryNamesText(categories: CategoryOption[]) {
  if (categories.length === 0) return "Any new Category name";

  return `${categories.map((category) => category.name).join(", ")} or a new Category name`;
}

function getSubCategoryIdsText(categories: CategoryOption[]) {
  const subCategoryIds = categories.flatMap((category) => (
    (category.subCategories ?? []).map((subCategory) => subCategory.id)
  ));

  if (subCategoryIds.length === 0) return "Use sub_category_name";

  return subCategoryIds.join(", ");
}

function getSubCategoryNamesText(categories: CategoryOption[]) {
  const subCategoryNames = categories.flatMap((category) => (
    (category.subCategories ?? []).map((subCategory) => subCategory.name)
  ));

  if (subCategoryNames.length === 0) return "Any new Sub-category name";

  return `${subCategoryNames.join(", ")} or a new Sub-category name`;
}

function getColumnWidth(
  header: string,
  rows: Record<string, string | number | null | undefined>[],
) {
  const longestValueLength = rows.reduce((longestLength, row) => {
    const valueLength = String(row[header] ?? "").length;

    return Math.max(longestLength, valueLength);
  }, header.length);

  return Math.min(Math.max(longestValueLength + 2, 12), 72);
}
