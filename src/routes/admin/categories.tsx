import { createFileRoute, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  createCategoryAdmin,
  createSubCategoryAdmin,
  listCategoryOptionsAdmin,
  updateCategoryAdmin,
  updateSubCategoryAdmin,
} from "../../lib/admin-functions";

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

export const Route = createFileRoute("/admin/categories")({
  loader: async () => {
    const categories = await listCategoryOptionsAdmin();

    return { categories };
  },
  head: () => ({
    meta: [
      { title: "Categories — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const { categories } = Route.useLoaderData() as { categories: CategoryRow[] };
  const router = useRouter();
  const [newCategory, setNewCategory] = useState<CategoryForm>(() => makeNewCategoryForm(categories));
  const [newSubCategories, setNewSubCategories] = useState<Record<string, SubCategoryForm>>({});
  const [editingCategory, setEditingCategory] = useState<CategoryForm | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategoryForm | null>(null);
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

        <section className="mt-6 space-y-4">
          {categories.map((category) => {
            const categoryForm = editingCategory?.categoryId === category.id ? editingCategory : toCategoryForm(category);
            const isEditingCategory = editingCategory?.categoryId === category.id;
            const subCategoryDraft = getSubCategoryDraft(category.id, newSubCategories, categories);

            return (
              <article key={category.id} className="admin-panel">
                <div className="admin-panel-header">
                  <div className="min-w-0">
                    <h2 className="admin-panel-title">{category.name}</h2>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide text-stone-400">
                      <span>ID: <code className="normal-case text-stone-500">{category.id}</code></span>
                      <span>Slug: <code className="normal-case text-stone-500">{category.slug}</code></span>
                    </div>
                  </div>
                  <span
                    className="h-8 w-8 rounded-full border border-stone-200"
                    style={{ backgroundColor: category.color ?? defaultColor }}
                    aria-hidden="true"
                  />
                </div>

                <div className="grid gap-4 border-b border-stone-100 p-5 md:grid-cols-[1fr_120px_130px_auto]">
                  <TextInput
                    label="Category name"
                    value={categoryForm.name}
                    disabled={!isEditingCategory}
                    onChange={(name) => setEditingCategory({ ...categoryForm, name })}
                  />
                  <Field label="Color">
                    <input
                      type="color"
                      value={categoryForm.color}
                      disabled={!isEditingCategory}
                      onChange={(event) => setEditingCategory({ ...categoryForm, color: event.target.value })}
                      className="admin-control h-11 p-1 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </Field>
                  <TextInput
                    label="Sort"
                    value={categoryForm.sortOrder}
                    disabled={!isEditingCategory}
                    onChange={(sortOrder) => setEditingCategory({ ...categoryForm, sortOrder })}
                  />
                  <CategoryActions
                    isEditing={isEditingCategory}
                    isBusy={busyAction === `category:${category.id}`}
                    onEdit={() => setEditingCategory(toCategoryForm(category))}
                    onCancel={() => setEditingCategory(null)}
                    onSave={updateCategory}
                  />
                </div>

                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black uppercase tracking-wide text-stone-500">Sub-categories</h3>
                    <span className="text-xs font-bold text-stone-400">{category.subCategories.length} total</span>
                  </div>

                  <div className="space-y-3">
                    {category.subCategories.map((subCategory) => {
                      const subCategoryForm = editingSubCategory?.subCategoryId === subCategory.id
                        ? editingSubCategory
                        : toSubCategoryForm(category.id, subCategory);
                      const isEditingSubCategory = editingSubCategory?.subCategoryId === subCategory.id;

                      return (
                        <div key={subCategory.id} className="grid gap-3 rounded-lg border border-stone-100 bg-stone-50/70 p-3 md:grid-cols-[1fr_120px_auto]">
                          <div>
                            <TextInput
                              label="Name"
                              value={subCategoryForm.name}
                              disabled={!isEditingSubCategory}
                              onChange={(name) => setEditingSubCategory({ ...subCategoryForm, name })}
                            />
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide text-stone-400">
                              <span>ID: <code className="normal-case text-stone-500">{subCategory.id}</code></span>
                              <span>Slug: <code className="normal-case text-stone-500">{subCategory.slug}</code></span>
                            </div>
                          </div>
                          <TextInput
                            label="Sort"
                            value={subCategoryForm.sortOrder}
                            disabled={!isEditingSubCategory}
                            onChange={(sortOrder) => setEditingSubCategory({ ...subCategoryForm, sortOrder })}
                          />
                          <CategoryActions
                            isEditing={isEditingSubCategory}
                            isBusy={busyAction === `sub-category:${subCategory.id}`}
                            onEdit={() => setEditingSubCategory(toSubCategoryForm(category.id, subCategory))}
                            onCancel={() => setEditingSubCategory(null)}
                            onSave={updateSubCategory}
                          />
                        </div>
                      );
                    })}

                    {category.subCategories.length === 0 && (
                      <p className="rounded-lg border border-dashed border-stone-200 p-4 text-sm font-semibold text-stone-500">
                        No Sub-categories yet.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 rounded-lg border border-dashed border-stone-200 p-3 md:grid-cols-[1fr_120px_auto]">
                    <TextInput
                      label="New Sub-category"
                      value={subCategoryDraft.name}
                      onChange={(name) => updateSubCategoryDraft(category.id, { ...subCategoryDraft, name })}
                    />
                    <TextInput
                      label="Sort"
                      value={subCategoryDraft.sortOrder}
                      onChange={(sortOrder) => updateSubCategoryDraft(category.id, { ...subCategoryDraft, sortOrder })}
                    />
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => createSubCategory(category.id)}
                        disabled={busyAction === `create-sub-category:${category.id}`}
                        className="admin-button-secondary w-full"
                      >
                        {busyAction === `create-sub-category:${category.id}` ? "Saving..." : "Add"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
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
      <div className="flex items-end">
        <button type="button" onClick={onEdit} className="admin-button-secondary w-full">
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <button type="button" onClick={onCancel} className="admin-button-secondary">
        Cancel
      </button>
      <button type="button" onClick={onSave} disabled={isBusy} className="admin-button-primary">
        {isBusy ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function TextInput({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="admin-control disabled:cursor-not-allowed disabled:opacity-60"
      />
    </Field>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-wide text-stone-500">{label}</span>
      {children}
    </label>
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
