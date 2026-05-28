export type TaxonomyWorkbookCategory = {
  categoryId?: string;
  name: string;
  color?: string;
  sortOrder: number;
};

export type TaxonomyWorkbookSubCategory = {
  subCategoryId?: string;
  categoryId: string;
  name: string;
  sortOrder: number;
};

export type TaxonomyWorkbookTopic = {
  topicId?: string;
  subCategoryId: string;
  name: string;
  sortOrder: number;
};

export type TaxonomyWorkbookData = {
  categories: TaxonomyWorkbookCategory[];
  subCategories: TaxonomyWorkbookSubCategory[];
  topics: TaxonomyWorkbookTopic[];
};

export type TaxonomyWorkbookIssue = {
  sheet: "categories" | "sub_categories" | "topics" | "workbook";
  row?: number;
  field?: string;
  message: string;
};

export type TaxonomyWorkbookChange = {
  level: "Category" | "Sub-category" | "Topic";
  action: "create" | "update" | "unchanged";
  name: string;
  id?: string;
  parentName?: string;
  changedFields: string[];
};

export type TaxonomyWorkbookPreview = {
  data: TaxonomyWorkbookData | null;
  issues: TaxonomyWorkbookIssue[];
  changes: TaxonomyWorkbookChange[];
};

export type TaxonomyTreeCategory = {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  subCategories: {
    id: string;
    name: string;
    sortOrder: number;
    topics: {
      id: string;
      name: string;
      sortOrder: number;
    }[];
  }[];
};

type CategorySheetRow = {
  __rowNum__?: number;
  category_id?: string;
  name?: string;
  color?: string;
  sort_order?: number | string;
};

type SubCategorySheetRow = {
  __rowNum__?: number;
  sub_category_id?: string;
  category_id?: string;
  name?: string;
  sort_order?: number | string;
};

type TopicSheetRow = {
  __rowNum__?: number;
  topic_id?: string;
  sub_category_id?: string;
  name?: string;
  sort_order?: number | string;
};

type ChangedFieldRule = {
  field: string;
  changed: boolean;
};

const categoryHeaders = ["category_id", "name", "color", "sort_order"] as const;
const subCategoryHeaders = ["sub_category_id", "category_id", "name", "sort_order"] as const;
const topicHeaders = ["topic_id", "sub_category_id", "name", "sort_order"] as const;

export async function readTaxonomyWorkbook(file: File, currentTaxonomy: TaxonomyTreeCategory[]) {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const categorySheet = workbook.Sheets.categories;
  const subCategorySheet = workbook.Sheets.sub_categories;
  const topicSheet = workbook.Sheets.topics;
  const issues: TaxonomyWorkbookIssue[] = [];

  if (!categorySheet) {
    issues.push({ sheet: "workbook", message: "Missing categories sheet." });
  }

  if (!subCategorySheet) {
    issues.push({ sheet: "workbook", message: "Missing sub_categories sheet." });
  }

  if (!topicSheet) {
    issues.push({ sheet: "workbook", message: "Missing topics sheet." });
  }

  if (!categorySheet || !subCategorySheet || !topicSheet) {
    return { data: null, issues, changes: [] };
  }

  addMissingHeaderIssues("categories", getSheetHeaders(XLSX, categorySheet), categoryHeaders, issues);
  addMissingHeaderIssues("sub_categories", getSheetHeaders(XLSX, subCategorySheet), subCategoryHeaders, issues);
  addMissingHeaderIssues("topics", getSheetHeaders(XLSX, topicSheet), topicHeaders, issues);

  const categoryRows = XLSX.utils
    .sheet_to_json<CategorySheetRow>(categorySheet, { defval: "" })
    .filter((row) => !isEmptyCategoryRow(row));
  const subCategoryRows = XLSX.utils
    .sheet_to_json<SubCategorySheetRow>(subCategorySheet, { defval: "" })
    .filter((row) => !isEmptySubCategoryRow(row));
  const topicRows = XLSX.utils
    .sheet_to_json<TopicSheetRow>(topicSheet, { defval: "" })
    .filter((row) => !isEmptyTopicRow(row));
  const data = {
    categories: categoryRows.map(toWorkbookCategory),
    subCategories: subCategoryRows.map(toWorkbookSubCategory),
    topics: topicRows.map(toWorkbookTopic),
  };
  const preview = previewTaxonomyWorkbook(data, currentTaxonomy, issues);

  return preview;
}

export function previewTaxonomyWorkbook(
  data: TaxonomyWorkbookData,
  currentTaxonomy: TaxonomyTreeCategory[],
  startingIssues: TaxonomyWorkbookIssue[] = [],
): TaxonomyWorkbookPreview {
  const issues = [...startingIssues];
  const indexes = makeTaxonomyIndexes(currentTaxonomy);

  validateCategoryRows(data.categories, indexes, issues);
  validateSubCategoryRows(data.subCategories, indexes, issues);
  validateTopicRows(data.topics, indexes, issues);

  if (issues.length > 0) {
    return { data, issues, changes: [] };
  }

  return {
    data,
    issues,
    changes: [
      ...previewCategoryChanges(data.categories, indexes),
      ...previewSubCategoryChanges(data.subCategories, indexes),
      ...previewTopicChanges(data.topics, indexes),
    ],
  };
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
  sheet: TaxonomyWorkbookIssue["sheet"],
  headers: Set<string>,
  expectedHeaders: readonly string[],
  issues: TaxonomyWorkbookIssue[],
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

function toWorkbookCategory(row: CategorySheetRow): TaxonomyWorkbookCategory {
  return {
    categoryId: optionalTextValue(row.category_id),
    name: textValue(row.name),
    color: optionalTextValue(row.color),
    sortOrder: numberValue(row.sort_order),
  };
}

function toWorkbookSubCategory(row: SubCategorySheetRow): TaxonomyWorkbookSubCategory {
  return {
    subCategoryId: optionalTextValue(row.sub_category_id),
    categoryId: textValue(row.category_id),
    name: textValue(row.name),
    sortOrder: numberValue(row.sort_order),
  };
}

function toWorkbookTopic(row: TopicSheetRow): TaxonomyWorkbookTopic {
  return {
    topicId: optionalTextValue(row.topic_id),
    subCategoryId: textValue(row.sub_category_id),
    name: textValue(row.name),
    sortOrder: numberValue(row.sort_order),
  };
}

function validateCategoryRows(
  rows: TaxonomyWorkbookCategory[],
  indexes: ReturnType<typeof makeTaxonomyIndexes>,
  issues: TaxonomyWorkbookIssue[],
) {
  const seenTargetIds = new Set<string>();
  const seenNames = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const target = resolveTaxonomyCategory(row, indexes);
    const nameKey = makeNameKey(row.name);

    addCommonRowIssues("categories", rowNumber, row.name, row.sortOrder, issues);

    if (row.categoryId && !target) {
      issues.push({
        sheet: "categories",
        row: rowNumber,
        field: "category_id",
        message: "category_id must reference an existing Category.",
      });
    }

    if (target && seenTargetIds.has(target.id)) {
      issues.push({
        sheet: "categories",
        row: rowNumber,
        field: "category_id",
        message: "This Category is listed more than once.",
      });
    }

    if (nameKey && seenNames.has(nameKey)) {
      issues.push({
        sheet: "categories",
        row: rowNumber,
        field: "name",
        message: "Category names must be unique in the workbook.",
      });
    }

    const conflictingCategory = indexes.categoryByName.get(nameKey);
    if (conflictingCategory && conflictingCategory.id !== target?.id) {
      issues.push({
        sheet: "categories",
        row: rowNumber,
        field: "name",
        message: "Another Category already uses this name.",
      });
    }

    if (row.color && row.color.length > 40) {
      issues.push({
        sheet: "categories",
        row: rowNumber,
        field: "color",
        message: "color must be 40 characters or fewer.",
      });
    }

    if (target) seenTargetIds.add(target.id);
    if (nameKey) seenNames.add(nameKey);
  });
}

function validateSubCategoryRows(
  rows: TaxonomyWorkbookSubCategory[],
  indexes: ReturnType<typeof makeTaxonomyIndexes>,
  issues: TaxonomyWorkbookIssue[],
) {
  const seenTargetIds = new Set<string>();
  const seenScopedNames = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const parent = indexes.categoryById.get(row.categoryId);
    const target = resolveTaxonomySubCategory(row, indexes);
    const scopedName = makeScopedNameKey(row.categoryId, row.name);

    addCommonRowIssues("sub_categories", rowNumber, row.name, row.sortOrder, issues);

    if (!row.categoryId) {
      issues.push({
        sheet: "sub_categories",
        row: rowNumber,
        field: "category_id",
        message: "category_id is required.",
      });
    } else if (!parent) {
      issues.push({
        sheet: "sub_categories",
        row: rowNumber,
        field: "category_id",
        message: "category_id must reference an existing Category.",
      });
    }

    if (row.subCategoryId && !target) {
      issues.push({
        sheet: "sub_categories",
        row: rowNumber,
        field: "sub_category_id",
        message: "sub_category_id must reference an existing Sub-category.",
      });
    }

    if (target && target.categoryId !== row.categoryId) {
      issues.push({
        sheet: "sub_categories",
        row: rowNumber,
        field: "category_id",
        message: "Existing Sub-categories cannot move to another Category through workbook import.",
      });
    }

    if (target && seenTargetIds.has(target.id)) {
      issues.push({
        sheet: "sub_categories",
        row: rowNumber,
        field: "sub_category_id",
        message: "This Sub-category is listed more than once.",
      });
    }

    if (scopedName && seenScopedNames.has(scopedName)) {
      issues.push({
        sheet: "sub_categories",
        row: rowNumber,
        field: "name",
        message: "Sub-category names must be unique within the same Category in the workbook.",
      });
    }

    const conflictingSubCategory = indexes.subCategoryByScopedName.get(scopedName);
    if (conflictingSubCategory && conflictingSubCategory.id !== target?.id) {
      issues.push({
        sheet: "sub_categories",
        row: rowNumber,
        field: "name",
        message: "Another Sub-category already uses this name in this Category.",
      });
    }

    if (target) seenTargetIds.add(target.id);
    if (scopedName) seenScopedNames.add(scopedName);
  });
}

function validateTopicRows(
  rows: TaxonomyWorkbookTopic[],
  indexes: ReturnType<typeof makeTaxonomyIndexes>,
  issues: TaxonomyWorkbookIssue[],
) {
  const seenTargetIds = new Set<string>();
  const seenScopedNames = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const parent = indexes.subCategoryById.get(row.subCategoryId);
    const target = resolveTaxonomyTopic(row, indexes);
    const scopedName = makeScopedNameKey(row.subCategoryId, row.name);

    addCommonRowIssues("topics", rowNumber, row.name, row.sortOrder, issues);

    if (!row.subCategoryId) {
      issues.push({
        sheet: "topics",
        row: rowNumber,
        field: "sub_category_id",
        message: "sub_category_id is required.",
      });
    } else if (!parent) {
      issues.push({
        sheet: "topics",
        row: rowNumber,
        field: "sub_category_id",
        message: "sub_category_id must reference an existing Sub-category.",
      });
    }

    if (row.topicId && !target) {
      issues.push({
        sheet: "topics",
        row: rowNumber,
        field: "topic_id",
        message: "topic_id must reference an existing Topic.",
      });
    }

    if (target && target.subCategoryId !== row.subCategoryId) {
      issues.push({
        sheet: "topics",
        row: rowNumber,
        field: "sub_category_id",
        message: "Existing Topics cannot move to another Sub-category through workbook import.",
      });
    }

    if (target && seenTargetIds.has(target.id)) {
      issues.push({
        sheet: "topics",
        row: rowNumber,
        field: "topic_id",
        message: "This Topic is listed more than once.",
      });
    }

    if (scopedName && seenScopedNames.has(scopedName)) {
      issues.push({
        sheet: "topics",
        row: rowNumber,
        field: "name",
        message: "Topic names must be unique within the same Sub-category in the workbook.",
      });
    }

    const conflictingTopic = indexes.topicByScopedName.get(scopedName);
    if (conflictingTopic && conflictingTopic.id !== target?.id) {
      issues.push({
        sheet: "topics",
        row: rowNumber,
        field: "name",
        message: "Another Topic already uses this name in this Sub-category.",
      });
    }

    if (target) seenTargetIds.add(target.id);
    if (scopedName) seenScopedNames.add(scopedName);
  });
}

function addCommonRowIssues(
  sheet: "categories" | "sub_categories" | "topics",
  row: number,
  name: string,
  sortOrder: number,
  issues: TaxonomyWorkbookIssue[],
) {
  if (!name.trim()) {
    issues.push({ sheet, row, field: "name", message: "name is required." });
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) {
    issues.push({ sheet, row, field: "sort_order", message: "sort_order must be an integer from 0 to 10000." });
  }
}

function previewCategoryChanges(
  rows: TaxonomyWorkbookCategory[],
  indexes: ReturnType<typeof makeTaxonomyIndexes>,
): TaxonomyWorkbookChange[] {
  return rows.map((row) => {
    const target = resolveTaxonomyCategory(row, indexes);

    if (!target) {
      return {
        level: "Category",
        action: "create",
        name: row.name,
        changedFields: ["name", "color", "sort_order"],
      };
    }

    const changedFields = getChangedFields([
      { field: "name", changed: target.name !== row.name },
      { field: "color", changed: (target.color ?? "") !== (row.color ?? "") },
      { field: "sort_order", changed: target.sortOrder !== row.sortOrder },
    ]);

    return {
      level: "Category",
      action: changedFields.length > 0 ? "update" : "unchanged",
      id: target.id,
      name: row.name,
      changedFields,
    };
  });
}

function previewSubCategoryChanges(
  rows: TaxonomyWorkbookSubCategory[],
  indexes: ReturnType<typeof makeTaxonomyIndexes>,
): TaxonomyWorkbookChange[] {
  return rows.map((row) => {
    const target = resolveTaxonomySubCategory(row, indexes);
    const parent = indexes.categoryById.get(row.categoryId);

    if (!target) {
      return {
        level: "Sub-category",
        action: "create",
        name: row.name,
        parentName: parent?.name,
        changedFields: ["name", "sort_order"],
      };
    }

    const changedFields = getChangedFields([
      { field: "name", changed: target.name !== row.name },
      { field: "sort_order", changed: target.sortOrder !== row.sortOrder },
    ]);

    return {
      level: "Sub-category",
      action: changedFields.length > 0 ? "update" : "unchanged",
      id: target.id,
      name: row.name,
      parentName: parent?.name,
      changedFields,
    };
  });
}

function previewTopicChanges(
  rows: TaxonomyWorkbookTopic[],
  indexes: ReturnType<typeof makeTaxonomyIndexes>,
): TaxonomyWorkbookChange[] {
  return rows.map((row) => {
    const target = resolveTaxonomyTopic(row, indexes);
    const parent = indexes.subCategoryById.get(row.subCategoryId);

    if (!target) {
      return {
        level: "Topic",
        action: "create",
        name: row.name,
        parentName: parent?.name,
        changedFields: ["name", "sort_order"],
      };
    }

    const changedFields = getChangedFields([
      { field: "name", changed: target.name !== row.name },
      { field: "sort_order", changed: target.sortOrder !== row.sortOrder },
    ]);

    return {
      level: "Topic",
      action: changedFields.length > 0 ? "update" : "unchanged",
      id: target.id,
      name: row.name,
      parentName: parent?.name,
      changedFields,
    };
  });
}

function getChangedFields(rules: ChangedFieldRule[]) {
  return rules
    .filter((rule) => rule.changed)
    .map((rule) => rule.field);
}

export function resolveTaxonomyCategory(
  row: Pick<TaxonomyWorkbookCategory, "categoryId" | "name">,
  indexes: ReturnType<typeof makeTaxonomyIndexes>,
) {
  if (row.categoryId) {
    return indexes.categoryById.get(row.categoryId) ?? null;
  }

  return indexes.categoryByName.get(makeNameKey(row.name)) ?? null;
}

export function resolveTaxonomySubCategory(
  row: Pick<TaxonomyWorkbookSubCategory, "subCategoryId" | "categoryId" | "name">,
  indexes: ReturnType<typeof makeTaxonomyIndexes>,
) {
  if (row.subCategoryId) {
    return indexes.subCategoryById.get(row.subCategoryId) ?? null;
  }

  return indexes.subCategoryByScopedName.get(makeScopedNameKey(row.categoryId, row.name)) ?? null;
}

export function resolveTaxonomyTopic(
  row: Pick<TaxonomyWorkbookTopic, "topicId" | "subCategoryId" | "name">,
  indexes: ReturnType<typeof makeTaxonomyIndexes>,
) {
  if (row.topicId) {
    return indexes.topicById.get(row.topicId) ?? null;
  }

  return indexes.topicByScopedName.get(makeScopedNameKey(row.subCategoryId, row.name)) ?? null;
}

export function makeTaxonomyIndexes(currentTaxonomy: TaxonomyTreeCategory[]) {
  const categoryById = new Map<string, TaxonomyTreeCategory>();
  const categoryByName = new Map<string, TaxonomyTreeCategory>();
  const subCategoryById = new Map<string, TaxonomyTreeCategory["subCategories"][number] & { categoryId: string }>();
  const subCategoryByScopedName = new Map<string, TaxonomyTreeCategory["subCategories"][number] & { categoryId: string }>();
  const topicById = new Map<string, TaxonomyTreeCategory["subCategories"][number]["topics"][number] & { subCategoryId: string }>();
  const topicByScopedName = new Map<string, TaxonomyTreeCategory["subCategories"][number]["topics"][number] & { subCategoryId: string }>();

  for (const category of currentTaxonomy) {
    categoryById.set(category.id, category);
    categoryByName.set(makeNameKey(category.name), category);

    for (const subCategory of category.subCategories) {
      const indexedSubCategory = { ...subCategory, categoryId: category.id };

      subCategoryById.set(subCategory.id, indexedSubCategory);
      subCategoryByScopedName.set(makeScopedNameKey(category.id, subCategory.name), indexedSubCategory);

      for (const topic of subCategory.topics) {
        const indexedTopic = { ...topic, subCategoryId: subCategory.id };

        topicById.set(topic.id, indexedTopic);
        topicByScopedName.set(makeScopedNameKey(subCategory.id, topic.name), indexedTopic);
      }
    }
  }

  return {
    categoryById,
    categoryByName,
    subCategoryById,
    subCategoryByScopedName,
    topicById,
    topicByScopedName,
  };
}

function isEmptyCategoryRow(row: CategorySheetRow) {
  return !textValue(row.category_id) && !textValue(row.name) && !textValue(row.color) && !textValue(row.sort_order);
}

function isEmptySubCategoryRow(row: SubCategorySheetRow) {
  return !textValue(row.sub_category_id) && !textValue(row.category_id) && !textValue(row.name) && !textValue(row.sort_order);
}

function isEmptyTopicRow(row: TopicSheetRow) {
  return !textValue(row.topic_id) && !textValue(row.sub_category_id) && !textValue(row.name) && !textValue(row.sort_order);
}

function numberValue(value: unknown) {
  if (typeof value === "number") return value;

  const parsedValue = Number(textValue(value));

  if (Number.isFinite(parsedValue)) return parsedValue;

  return NaN;
}

function optionalTextValue(value: unknown) {
  const text = textValue(value);

  if (!text) return undefined;

  return text;
}

function textValue(value: unknown) {
  if (value === null || value === undefined) return "";

  return String(value).trim();
}

function makeNameKey(value: string) {
  return value.trim().toLowerCase();
}

function makeScopedNameKey(parentId: string, name: string) {
  const nameKey = makeNameKey(name);

  if (!parentId || !nameKey) return "";

  return `${parentId}::${nameKey}`;
}
