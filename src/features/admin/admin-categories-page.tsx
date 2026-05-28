import { useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  createCategoryAdmin,
  createSubCategoryAdmin,
  listCategoryOptionsAdmin,
  updateCategoryAdmin,
  updateSubCategoryAdmin,
} from "./admin-taxonomy-functions";

type CategoryRow = Awaited<ReturnType<typeof listCategoryOptionsAdmin>>[number];

type CategoryForm = {
  categoryId: string;
  name: string;
  color: string;
  sortOrder: string;
};

type SubCategoryForm = {
  categoryId: string;
  subCategoryId: string;
  name: string;
  sortOrder: string;
};

const defaultColor = "#205072";

export function AdminCategoriesPage({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [newCategory, setNewCategory] = useState<CategoryForm>(() => makeNewCategoryForm(categories));
  const [newSubCategories, setNewSubCategories] = useState<Record<string, SubCategoryForm>>({});
  const [editingCategory, setEditingCategory] = useState<CategoryForm | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategoryForm | null>(null);
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<Set<string>>(() => new Set());
  const [busyAction, setBusyAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const refresh = async () => {
    await router.invalidate();
  };

  const createCategory = async () => {
    const payload = toCategoryPayload(newCategory);

    if (!payload) {
      setErrorMessage("Category name and sort order are required.");
      return;
    }

    setBusyAction("create-category");
    setErrorMessage("");

    try {
      await createCategoryAdmin({ data: payload });
      await refresh();
      setNewCategory({
        ...makeNewCategoryForm(categories),
        sortOrder: String(payload.sortOrder + 10),
      });
    } catch {
      setErrorMessage("Category was not created. Check for a duplicate name or slug.");
    } finally {
      setBusyAction("");
    }
  };

  const updateCategory = async () => {
    if (!editingCategory) return;

    const payload = toCategoryPayload(editingCategory);

    if (!payload) {
      setErrorMessage("Category name and sort order are required.");
      return;
    }

    setBusyAction(`category:${editingCategory.categoryId}`);
    setErrorMessage("");

    try {
      await updateCategoryAdmin({
        data: {
          ...payload,
          categoryId: editingCategory.categoryId,
        },
      });
      setEditingCategory(null);
      await refresh();
    } catch {
      setErrorMessage("Category was not updated. Check for a duplicate name.");
    } finally {
      setBusyAction("");
    }
  };

  const createSubCategory = async (categoryId: string) => {
    const form = getSubCategoryDraft(categoryId, newSubCategories);
    const payload = toSubCategoryPayload(form);

    if (!payload) {
      setErrorMessage("Sub-category name and sort order are required.");
      return;
    }

    setBusyAction(`create-sub-category:${categoryId}`);
    setErrorMessage("");

    try {
      await createSubCategoryAdmin({ data: payload });
      setNewSubCategories({
        ...newSubCategories,
        [categoryId]: {
          ...makeNewSubCategoryForm(categoryId, categories),
          sortOrder: String(payload.sortOrder + 10),
        },
      });
      await refresh();
    } catch {
      setErrorMessage("Sub-category was not created. Check for a duplicate name or slug.");
    } finally {
      setBusyAction("");
    }
  };

  const updateSubCategory = async () => {
    if (!editingSubCategory) return;

    const payload = toSubCategoryPayload(editingSubCategory);

    if (!payload) {
      setErrorMessage("Sub-category name and sort order are required.");
      return;
    }

    setBusyAction(`sub-category:${editingSubCategory.subCategoryId}`);
    setErrorMessage("");

    try {
      await updateSubCategoryAdmin({
        data: {
          subCategoryId: editingSubCategory.subCategoryId,
          name: payload.name,
          sortOrder: payload.sortOrder,
        },
      });
      setEditingSubCategory(null);
      await refresh();
    } catch {
      setErrorMessage("Sub-category was not updated. Check for a duplicate name.");
    } finally {
      setBusyAction("");
    }
  };

  const updateSubCategoryDraft = (categoryId: string, nextForm: SubCategoryForm) => {
    setNewSubCategories({
      ...newSubCategories,
      [categoryId]: nextForm,
    });
  };

  const toggleCategory = (categoryId: string) => {
    const nextCategoryIds = new Set(collapsedCategoryIds);

    if (nextCategoryIds.has(categoryId)) {
      nextCategoryIds.delete(categoryId);
      setCollapsedCategoryIds(nextCategoryIds);
      return;
    }

    nextCategoryIds.add(categoryId);
    setCollapsedCategoryIds(nextCategoryIds);
  };

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane">
        <header className="admin-header">
          <a href="/admin" className="admin-back-link">Admin</a>
          <h1 className="admin-title">Categories</h1>
          <p className="admin-description">
            Manage the two-level taxonomy used by Try-outs, Questions, Student Evaluation, and Materi links.
          </p>
        </header>

        {errorMessage && (
          <p className="admin-alert">
            {errorMessage}
          </p>
        )}

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Create Category</h2>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-[1fr_120px_130px_auto]">
            <TextInput label="Name" value={newCategory.name} onChange={(name) => setNewCategory({ ...newCategory, name })} />
            <Field label="Color">
              <input
                type="color"
                value={newCategory.color}
                onChange={(event) => setNewCategory({ ...newCategory, color: event.target.value })}
                className="admin-control h-11 p-1"
              />
            </Field>
            <TextInput label="Sort" value={newCategory.sortOrder} onChange={(sortOrder) => setNewCategory({ ...newCategory, sortOrder })} />
            <div className="flex items-end">
              <button
                type="button"
                onClick={createCategory}
                disabled={busyAction === "create-category"}
                className="admin-button-primary w-full"
              >
                {busyAction === "create-category" ? "Saving..." : "Create"}
              </button>
            </div>
          </div>
        </section>

        <section className="admin-panel mt-6 overflow-hidden">
          <div className="admin-panel-header flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="admin-panel-title">Category Tree</h2>
              <p className="mt-1 text-xs font-semibold text-stone-500">
                {categories.length} categories, {countSubCategories(categories)} sub-categories
              </p>
            </div>
          </div>

          <div className="divide-y divide-stone-100">
          {categories.map((category) => {
            const categoryForm = editingCategory?.categoryId === category.id ? editingCategory : toCategoryForm(category);
            const isEditingCategory = editingCategory?.categoryId === category.id;
            const subCategoryDraft = getSubCategoryDraft(category.id, newSubCategories, categories);
            const isCollapsed = collapsedCategoryIds.has(category.id);

            return (
              <article key={category.id} className="category-tree-group">
                <div className="category-tree-row category-tree-row-parent">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className="category-tree-toggle"
                    aria-label={isCollapsed ? `Expand ${category.name}` : `Collapse ${category.name}`}
                    aria-expanded={!isCollapsed}
                  >
                    <ChevronIcon isOpen={!isCollapsed} />
                  </button>

                  <span
                    className="category-tree-swatch"
                    style={{ backgroundColor: category.color ?? defaultColor }}
                    aria-hidden="true"
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold tracking-tight text-stone-800">{category.name}</p>
                    <MetaLine id={category.id} slug={category.slug} />
                  </div>

                  <span className="category-tree-count">
                    {category.subCategories.length} sub
                  </span>

                  {!isEditingCategory && (
                    <button
                      type="button"
                      onClick={() => setEditingCategory(toCategoryForm(category))}
                      className="admin-button-secondary category-tree-row-action"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditingCategory && (
                  <div className="category-tree-edit-row">
                    <TextInput
                      label="Category name"
                      value={categoryForm.name}
                      compact
                      onChange={(name) => setEditingCategory({ ...categoryForm, name })}
                    />
                    <Field label="Color" compact>
                      <input
                        type="color"
                        value={categoryForm.color}
                        onChange={(event) => setEditingCategory({ ...categoryForm, color: event.target.value })}
                        className="admin-control h-9 p-1"
                      />
                    </Field>
                    <TextInput
                      label="Sort"
                      value={categoryForm.sortOrder}
                      compact
                      onChange={(sortOrder) => setEditingCategory({ ...categoryForm, sortOrder })}
                    />
                    <CategoryActions
                      isEditing
                      isBusy={busyAction === `category:${category.id}`}
                      onEdit={() => setEditingCategory(toCategoryForm(category))}
                      onCancel={() => setEditingCategory(null)}
                      onSave={updateCategory}
                    />
                  </div>
                )}

                {!isCollapsed && (
                  <div className="category-tree-children">
                    {category.subCategories.map((subCategory) => {
                      const subCategoryForm = editingSubCategory?.subCategoryId === subCategory.id
                        ? editingSubCategory
                        : toSubCategoryForm(category.id, subCategory);
                      const isEditingSubCategory = editingSubCategory?.subCategoryId === subCategory.id;

                      return (
                        <div key={subCategory.id} className="category-tree-child">
                          <div className="category-tree-branch" aria-hidden="true" />
                          <div className="category-tree-child-grid">
                            <div className="category-tree-name-cell">
                              <TextInput
                                label="Name"
                                value={subCategoryForm.name}
                                disabled={!isEditingSubCategory}
                                compact
                                onChange={(name) => setEditingSubCategory({ ...subCategoryForm, name })}
                              />
                            </div>
                            <TextInput
                              label="Sort"
                              value={subCategoryForm.sortOrder}
                              disabled={!isEditingSubCategory}
                              compact
                              onChange={(sortOrder) => setEditingSubCategory({ ...subCategoryForm, sortOrder })}
                            />
                            <CategoryActions
                              isEditing={isEditingSubCategory}
                              isBusy={busyAction === `sub-category:${subCategory.id}`}
                              onEdit={() => setEditingSubCategory(toSubCategoryForm(category.id, subCategory))}
                              onCancel={() => setEditingSubCategory(null)}
                              onSave={updateSubCategory}
                            />
                            <div className="category-tree-meta-cell">
                              <MetaLine id={subCategory.id} slug={subCategory.slug} />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {category.subCategories.length === 0 && (
                      <p className="category-tree-empty">
                        No sub-categories yet.
                      </p>
                    )}

                    <div className="category-tree-child category-tree-new-child">
                      <div className="category-tree-branch" aria-hidden="true" />
                      <div className="category-tree-child-grid">
                        <TextInput
                          label="New sub-category"
                          value={subCategoryDraft.name}
                          compact
                          onChange={(name) => updateSubCategoryDraft(category.id, { ...subCategoryDraft, name })}
                        />
                        <TextInput
                          label="Sort"
                          value={subCategoryDraft.sortOrder}
                          compact
                          onChange={(sortOrder) => updateSubCategoryDraft(category.id, { ...subCategoryDraft, sortOrder })}
                        />
                        <div className="category-tree-action-cell">
                          <button
                            type="button"
                            onClick={() => createSubCategory(category.id)}
                            disabled={busyAction === `create-sub-category:${category.id}`}
                            className="admin-button-secondary category-tree-action-button w-full"
                          >
                            {busyAction === `create-sub-category:${category.id}` ? "Saving..." : "Add"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
          </div>
        </section>
      </div>
    </main>
  );
}

function CategoryActions({
  isEditing,
  isBusy,
  onEdit,
  onCancel,
  onSave,
}: {
  isEditing: boolean;
  isBusy: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!isEditing) {
    return (
      <div className="category-tree-action-cell">
        <button type="button" onClick={onEdit} className="admin-button-secondary category-tree-action-button w-full">
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="category-tree-action-cell gap-2">
      <button type="button" onClick={onCancel} className="admin-button-secondary category-tree-action-button">
        Cancel
      </button>
      <button type="button" onClick={onSave} disabled={isBusy} className="admin-button-primary category-tree-action-button">
        {isBusy ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function TextInput({
  label,
  value,
  disabled,
  compact,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  compact?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} compact={compact}>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`admin-control disabled:cursor-not-allowed disabled:opacity-60 ${compact ? "category-tree-control" : ""}`}
      />
    </Field>
  );
}

function Field({ label, compact, children }: { label: string; compact?: boolean; children: ReactNode }) {
  return (
    <label className={`grid ${compact ? "gap-1" : "gap-2"}`}>
      <span className="text-[11px] font-black uppercase tracking-wide text-stone-500">{label}</span>
      {children}
    </label>
  );
}

function MetaLine({ id, slug }: { id: string; slug: string }) {
  return (
    <div className="mt-1 flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-[10px] font-bold uppercase tracking-wide text-stone-400">
      <span>ID: <code className="normal-case text-stone-500">{id}</code></span>
      <span>Slug: <code className="normal-case text-stone-500">{slug}</code></span>
    </div>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
      fill="none"
      aria-hidden="true"
    >
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function makeNewCategoryForm(categories: CategoryRow[]): CategoryForm {
  return {
    categoryId: "",
    name: "",
    color: defaultColor,
    sortOrder: String(getNextSortOrder(categories)),
  };
}

function makeNewSubCategoryForm(categoryId: string, categories: CategoryRow[]): SubCategoryForm {
  const category = categories.find((item) => item.id === categoryId);

  return {
    categoryId,
    subCategoryId: "",
    name: "",
    sortOrder: String(getNextSortOrder(category?.subCategories ?? [])),
  };
}

function getSubCategoryDraft(
  categoryId: string,
  drafts: Record<string, SubCategoryForm>,
  categories: CategoryRow[] = [],
) {
  return drafts[categoryId] ?? makeNewSubCategoryForm(categoryId, categories);
}

function toCategoryForm(category: CategoryRow): CategoryForm {
  return {
    categoryId: category.id,
    name: category.name,
    color: category.color ?? defaultColor,
    sortOrder: String(category.sortOrder),
  };
}

function toSubCategoryForm(
  categoryId: string,
  subCategory: CategoryRow["subCategories"][number],
): SubCategoryForm {
  return {
    categoryId,
    subCategoryId: subCategory.id,
    name: subCategory.name,
    sortOrder: String(subCategory.sortOrder),
  };
}

function toCategoryPayload(form: CategoryForm) {
  const sortOrder = parseSortOrder(form.sortOrder);

  if (!form.name.trim()) return null;
  if (sortOrder === null) return null;

  return {
    name: form.name,
    color: form.color,
    sortOrder,
  };
}

function toSubCategoryPayload(form: SubCategoryForm) {
  const sortOrder = parseSortOrder(form.sortOrder);

  if (!form.categoryId) return null;
  if (!form.name.trim()) return null;
  if (sortOrder === null) return null;

  return {
    categoryId: form.categoryId,
    name: form.name,
    sortOrder,
  };
}

function parseSortOrder(value: string) {
  const sortOrder = Number(value);

  if (!Number.isInteger(sortOrder)) return null;
  if (sortOrder < 0 || sortOrder > 10000) return null;

  return sortOrder;
}

function getNextSortOrder(items: Array<{ sortOrder: number }>) {
  if (items.length === 0) return 10;

  return Math.max(...items.map((item) => item.sortOrder)) + 10;
}

function countSubCategories(categories: CategoryRow[]) {
  return categories.reduce((total, category) => total + category.subCategories.length, 0);
}
