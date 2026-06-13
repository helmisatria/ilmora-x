import type { TaxonomyTreeCategory } from "./admin-taxonomy-workbook";

const categorySheetHeaders = ["category_slug", "name", "color", "sort_order"] as const;
const subCategorySheetHeaders = ["category_slug", "sub_category_slug", "name", "sort_order"] as const;
const topicSheetHeaders = ["category_slug", "sub_category_slug", "topic_slug", "name", "sort_order"] as const;
const guidelineSheetHeaders = ["sheet", "column", "required", "notes"] as const;

export function makeTaxonomyWorkbook(
  XLSX: typeof import("xlsx"),
  categories: TaxonomyTreeCategory[],
) {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    makeSheet(XLSX, categorySheetHeaders, makeCategoryRows(categories)),
    "categories",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    makeSheet(XLSX, subCategorySheetHeaders, makeSubCategoryRows(categories)),
    "sub_categories",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    makeSheet(XLSX, topicSheetHeaders, makeTopicRows(categories)),
    "topics",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    makeSheet(XLSX, guidelineSheetHeaders, makeGuidelineRows()),
    "guideline",
  );

  return workbook;
}

export function makeTaxonomyWorkbookFileName(date: Date) {
  return `ilmorax-taxonomy-${formatTimestamp(date)}.xlsx`;
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

function makeCategoryRows(categories: TaxonomyTreeCategory[]) {
  return categories.map((category) => ({
    category_slug: category.slug,
    name: category.name,
    color: category.color ?? "",
    sort_order: category.sortOrder,
  }));
}

function makeSubCategoryRows(categories: TaxonomyTreeCategory[]) {
  return categories.flatMap((category) => (
    category.subCategories.map((subCategory) => ({
      category_slug: category.slug,
      sub_category_slug: subCategory.slug,
      name: subCategory.name,
      sort_order: subCategory.sortOrder,
    }))
  ));
}

function makeTopicRows(categories: TaxonomyTreeCategory[]) {
  return categories.flatMap((category) => (
    category.subCategories.flatMap((subCategory) => (
      subCategory.topics.map((topic) => ({
        category_slug: category.slug,
        sub_category_slug: subCategory.slug,
        topic_slug: topic.slug,
        name: topic.name,
        sort_order: topic.sortOrder,
      }))
    ))
  ));
}

function makeGuidelineRows() {
  return [
    {
      sheet: "categories",
      column: "category_slug",
      required: "No",
      notes: "Keep the existing slug to update a Category. Leave blank to create or reuse by exact name.",
    },
    {
      sheet: "categories",
      column: "name",
      required: "Yes",
      notes: "Category names are matched case-insensitively after trimming spaces.",
    },
    {
      sheet: "categories",
      column: "color",
      required: "No",
      notes: "Optional display color, usually a hex value like #205072.",
    },
    {
      sheet: "categories",
      column: "sort_order",
      required: "Yes",
      notes: "Integer from 0 to 10000. Lower values appear first.",
    },
    {
      sheet: "sub_categories",
      column: "category_slug",
      required: "Yes",
      notes: "Must reference an existing Category from the downloaded workbook.",
    },
    {
      sheet: "sub_categories",
      column: "sub_category_slug",
      required: "No",
      notes: "Keep the existing slug to update a Sub-category. Leave blank to create or reuse by name within its Category.",
    },
    {
      sheet: "sub_categories",
      column: "name",
      required: "Yes",
      notes: "Sub-category names are unique within the referenced Category.",
    },
    {
      sheet: "sub_categories",
      column: "sort_order",
      required: "Yes",
      notes: "Integer from 0 to 10000. Lower values appear first.",
    },
    {
      sheet: "topics",
      column: "category_slug",
      required: "Yes",
      notes: "Must reference the Category that owns the Sub-category.",
    },
    {
      sheet: "topics",
      column: "sub_category_slug",
      required: "Yes",
      notes: "Must reference an existing Sub-category within the Category from the downloaded workbook.",
    },
    {
      sheet: "topics",
      column: "topic_slug",
      required: "No",
      notes: "Keep the existing slug to update a Topic. Leave blank to create or reuse by name within its Sub-category.",
    },
    {
      sheet: "topics",
      column: "name",
      required: "Yes",
      notes: "Topic names are unique within the referenced Sub-category.",
    },
    {
      sheet: "topics",
      column: "sort_order",
      required: "Yes",
      notes: "Integer from 0 to 10000. Lower values appear first.",
    },
    {
      sheet: "all",
      column: "missing rows",
      required: "No",
      notes: "Rows missing from the uploaded workbook are left unchanged. Import never deletes taxonomy rows.",
    },
    {
      sheet: "all",
      column: "preview",
      required: "Yes",
      notes: "The Admin UI previews creates and updates before applying the all-or-nothing import.",
    },
  ];
}

function makeSheet(
  XLSX: typeof import("xlsx"),
  headers: readonly string[],
  rows: Record<string, string | number | null | undefined>[],
) {
  const sheet = XLSX.utils.aoa_to_sheet([Array.from(headers)]);

  if (rows.length > 0) {
    XLSX.utils.sheet_add_json(sheet, rows, {
      header: Array.from(headers),
      skipHeader: true,
      origin: "A2",
    });
  }

  sheet["!cols"] = headers.map((header) => ({
    wch: getColumnWidth(header, rows),
  }));

  return sheet;
}

function getColumnWidth(header: string, rows: Record<string, string | number | null | undefined>[]) {
  const contentWidth = rows.reduce((width, row) => {
    const value = row[header];

    if (value === null || value === undefined) return width;

    return Math.max(width, String(value).length);
  }, header.length);

  return Math.min(Math.max(contentWidth + 2, 12), 70);
}

function formatTimestamp(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}-${hours}-${minutes}`;
}
