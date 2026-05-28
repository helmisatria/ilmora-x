import { useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { FileUpload } from "../../components/admin/TryoutWorkbookImport";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  createCategoryAdmin,
  createSubCategoryAdmin,
  createTopicAdmin,
  deleteSubCategoryAdmin,
  deleteTopicAdmin,
  getSubCategoryDeletionPreviewAdmin,
  getTopicDeletionPreviewAdmin,
  importTaxonomyWorkbookAdmin,
  listCategoryOptionsAdmin,
  updateCategoryAdmin,
  updateSubCategoryAdmin,
  updateTopicAdmin,
} from "./admin-taxonomy-functions";
import {
  readTaxonomyWorkbook,
  type TaxonomyWorkbookChange,
  type TaxonomyWorkbookPreview,
} from "./admin-taxonomy-workbook";
import * as taxonomyWorkbookSheets from "./admin-taxonomy-workbook-sheets";

type CategoryRow = Awaited<ReturnType<typeof listCategoryOptionsAdmin>>[number];
type DeletionPreview =
  | Awaited<ReturnType<typeof getSubCategoryDeletionPreviewAdmin>>
  | Awaited<ReturnType<typeof getTopicDeletionPreviewAdmin>>;
type TaxonomyWorkbookFilePreview = TaxonomyWorkbookPreview & { fileName: string };

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

type TopicForm = {
  subCategoryId: string;
  topicId: string;
  name: string;
  sortOrder: string;
};

const defaultColor = "#205072";

export function AdminCategoriesPage({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [newCategory, setNewCategory] = useState<CategoryForm>(() => makeNewCategoryForm(categories));
  const [newSubCategories, setNewSubCategories] = useState<Record<string, SubCategoryForm>>({});
  const [newTopics, setNewTopics] = useState<Record<string, TopicForm>>({});
  const [editingCategory, setEditingCategory] = useState<CategoryForm | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategoryForm | null>(null);
  const [editingTopic, setEditingTopic] = useState<TopicForm | null>(null);
  const [deletionPreview, setDeletionPreview] = useState<DeletionPreview | null>(null);
  const [taxonomyWorkbookPreview, setTaxonomyWorkbookPreview] = useState<TaxonomyWorkbookFilePreview | null>(null);
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

  const createTopic = async (subCategoryId: string) => {
    const form = getTopicDraft(subCategoryId, newTopics, categories);
    const payload = toTopicPayload(form);

    if (!payload) {
      setErrorMessage("Topic name and sort order are required.");
      return;
    }

    setBusyAction(`create-topic:${subCategoryId}`);
    setErrorMessage("");

    try {
      await createTopicAdmin({ data: payload });
      setNewTopics({
        ...newTopics,
        [subCategoryId]: {
          ...makeNewTopicForm(subCategoryId, categories),
          sortOrder: String(payload.sortOrder + 10),
        },
      });
      await refresh();
    } catch {
      setErrorMessage("Topic was not created. Check for a duplicate name or slug.");
    } finally {
      setBusyAction("");
    }
  };

  const updateTopic = async () => {
    if (!editingTopic) return;

    const payload = toTopicPayload(editingTopic);

    if (!payload) {
      setErrorMessage("Topic name and sort order are required.");
      return;
    }

    setBusyAction(`topic:${editingTopic.topicId}`);
    setErrorMessage("");

    try {
      await updateTopicAdmin({
        data: {
          topicId: editingTopic.topicId,
          name: payload.name,
          sortOrder: payload.sortOrder,
        },
      });
      setEditingTopic(null);
      await refresh();
    } catch {
      setErrorMessage("Topic was not updated. Check for a duplicate name.");
    } finally {
      setBusyAction("");
    }
  };

  const previewSubCategoryDeletion = async (subCategoryId: string) => {
    setBusyAction(`delete-preview:sub-category:${subCategoryId}`);
    setErrorMessage("");

    try {
      const preview = await getSubCategoryDeletionPreviewAdmin({ data: { subCategoryId } });

      setDeletionPreview(preview);
    } catch {
      setErrorMessage("Sub-category deletion could not be checked.");
    } finally {
      setBusyAction("");
    }
  };

  const previewTopicDeletion = async (topicId: string) => {
    setBusyAction(`delete-preview:topic:${topicId}`);
    setErrorMessage("");

    try {
      const preview = await getTopicDeletionPreviewAdmin({ data: { topicId } });

      setDeletionPreview(preview);
    } catch {
      setErrorMessage("Topic deletion could not be checked.");
    } finally {
      setBusyAction("");
    }
  };

  const confirmDeletion = async () => {
    if (!deletionPreview?.canDelete) return;

    const nodeId = deletionPreview.node.id;

    setBusyAction(`delete-confirm:${deletionPreview.kind}:${nodeId}`);
    setErrorMessage("");

    try {
      if (deletionPreview.kind === "topic") {
        await deleteTopicAdmin({ data: { topicId: nodeId } });
      } else {
        await deleteSubCategoryAdmin({ data: { subCategoryId: nodeId } });
      }

      setDeletionPreview(null);
      await refresh();
    } catch {
      setErrorMessage("Taxonomy node was not removed. Recheck content usage and try again.");
    } finally {
      setBusyAction("");
    }
  };

  const downloadTaxonomyWorkbook = async () => {
    setBusyAction("taxonomy-download");
    setErrorMessage("");

    try {
      const latestCategories = await listCategoryOptionsAdmin();
      const XLSX = await import("xlsx");
      const workbook = taxonomyWorkbookSheets.makeTaxonomyWorkbook(XLSX, latestCategories);
      const fileName = taxonomyWorkbookSheets.makeTaxonomyWorkbookFileName(new Date());

      taxonomyWorkbookSheets.saveWorkbook(XLSX, workbook, fileName);
    } catch {
      setErrorMessage("Taxonomy workbook was not downloaded.");
    } finally {
      setBusyAction("");
    }
  };

  const previewTaxonomyWorkbook = async (file: File) => {
    setBusyAction("taxonomy-preview");
    setErrorMessage("");

    try {
      const preview = await readTaxonomyWorkbook(file, categories);

      setTaxonomyWorkbookPreview({
        ...preview,
        fileName: file.name,
      });
    } catch {
      setErrorMessage("Taxonomy workbook could not be read. Upload a valid .xlsx file.");
    } finally {
      setBusyAction("");
    }
  };

  const confirmTaxonomyWorkbookImport = async () => {
    if (!taxonomyWorkbookPreview?.data) return;
    if (taxonomyWorkbookPreview.issues.length > 0) return;

    setBusyAction("taxonomy-import");
    setErrorMessage("");

    try {
      await importTaxonomyWorkbookAdmin({
        data: taxonomyWorkbookPreview.data,
      });
      setTaxonomyWorkbookPreview(null);
      await refresh();
    } catch {
      setErrorMessage("Taxonomy workbook was not imported. Check for server-side validation errors.");
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

  const updateTopicDraft = (subCategoryId: string, nextForm: TopicForm) => {
    setNewTopics({
      ...newTopics,
      [subCategoryId]: nextForm,
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
            Manage the three-level taxonomy used by Questions, Student Evaluation, and Materi links.
          </p>
        </header>

        {errorMessage && (
          <p className="admin-alert">
            {errorMessage}
          </p>
        )}

        {taxonomyWorkbookPreview && (
          <TaxonomyWorkbookPreviewPanel
            preview={taxonomyWorkbookPreview}
            busy={busyAction === "taxonomy-import"}
            onCancel={() => setTaxonomyWorkbookPreview(null)}
            onConfirm={confirmTaxonomyWorkbookImport}
          />
        )}

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <div>
              <h2 className="admin-panel-title">Excel Import / Export</h2>
              <p className="mt-1 text-xs font-semibold text-stone-500">
                Download the current taxonomy, edit it in Excel, then preview and confirm the upsert.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 p-5 sm:p-6">
            <button
              type="button"
              onClick={downloadTaxonomyWorkbook}
              disabled={busyAction === "taxonomy-download"}
              className="admin-button-secondary"
            >
              <DownloadIcon />
              {busyAction === "taxonomy-download" ? "Preparing..." : "Download workbook"}
            </button>
            <FileUpload
              accept=".xlsx"
              busy={busyAction === "taxonomy-preview" || busyAction === "taxonomy-import"}
              placeholder="Upload workbook"
              onFileSelect={previewTaxonomyWorkbook}
            />
          </div>
        </section>

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
                {categories.length} categories, {countSubCategories(categories)} sub-categories, {countTopics(categories)} topics
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
                    {category.subCategories.length} sub · {countCategoryTopics(category)} topics
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
                      const topicDraft = getTopicDraft(subCategory.id, newTopics, categories);

                      return (
                        <div key={subCategory.id} className="category-tree-subtree">
                          <div className="category-tree-child category-tree-child-subcategory">
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
                                isDeleteBusy={busyAction === `delete-preview:sub-category:${subCategory.id}`}
                                onEdit={() => setEditingSubCategory(toSubCategoryForm(category.id, subCategory))}
                                onCancel={() => setEditingSubCategory(null)}
                                onSave={updateSubCategory}
                                onDelete={() => previewSubCategoryDeletion(subCategory.id)}
                              />
                              <div className="category-tree-meta-cell">
                                <MetaLine id={subCategory.id} slug={subCategory.slug} />
                              </div>
                            </div>
                          </div>
                          <div className="category-tree-topic-list">
                            {subCategory.topics.map((topic) => {
                              const topicForm = editingTopic?.topicId === topic.id
                                ? editingTopic
                                : toTopicForm(subCategory.id, topic);
                              const isEditingTopic = editingTopic?.topicId === topic.id;

                              return (
                                <div key={topic.id} className="category-tree-child category-tree-child-topic">
                                  <div className="category-tree-branch" aria-hidden="true" />
                                  <div className="category-tree-child-grid">
                                    <TextInput
                                      label="Topic"
                                      value={topicForm.name}
                                      disabled={!isEditingTopic}
                                      compact
                                      onChange={(name) => setEditingTopic({ ...topicForm, name })}
                                    />
                                    <TextInput
                                      label="Sort"
                                      value={topicForm.sortOrder}
                                      disabled={!isEditingTopic}
                                      compact
                                      onChange={(sortOrder) => setEditingTopic({ ...topicForm, sortOrder })}
                                    />
                                    <CategoryActions
                                      isEditing={isEditingTopic}
                                      isBusy={busyAction === `topic:${topic.id}`}
                                      isDeleteBusy={busyAction === `delete-preview:topic:${topic.id}`}
                                      onEdit={() => setEditingTopic(toTopicForm(subCategory.id, topic))}
                                      onCancel={() => setEditingTopic(null)}
                                      onSave={updateTopic}
                                      onDelete={() => previewTopicDeletion(topic.id)}
                                    />
                                    <div className="category-tree-meta-cell">
                                      <MetaLine id={topic.id} slug={topic.slug} />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            <div className="category-tree-child category-tree-child-topic category-tree-new-child">
                              <div className="category-tree-branch" aria-hidden="true" />
                              <div className="category-tree-child-grid">
                                <TextInput
                                  label="New topic"
                                  value={topicDraft.name}
                                  compact
                                  onChange={(name) => updateTopicDraft(subCategory.id, { ...topicDraft, name })}
                                />
                                <TextInput
                                  label="Sort"
                                  value={topicDraft.sortOrder}
                                  compact
                                  onChange={(sortOrder) => updateTopicDraft(subCategory.id, { ...topicDraft, sortOrder })}
                                />
                                <div className="category-tree-action-cell">
                                  <button
                                    type="button"
                                    onClick={() => createTopic(subCategory.id)}
                                    disabled={busyAction === `create-topic:${subCategory.id}`}
                                    className="admin-button-secondary category-tree-action-button w-full"
                                  >
                                    {busyAction === `create-topic:${subCategory.id}` ? "Saving..." : "Add"}
                                  </button>
                                </div>
                              </div>
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

                    <div className="category-tree-child category-tree-child-subcategory category-tree-new-child">
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

        <TaxonomyDeletionDialog
          preview={deletionPreview}
          isBusy={Boolean(deletionPreview && busyAction === `delete-confirm:${deletionPreview.kind}:${deletionPreview.node.id}`)}
          onClose={() => setDeletionPreview(null)}
          onConfirm={confirmDeletion}
        />
      </div>
    </main>
  );
}

function CategoryActions({
  isEditing,
  isBusy,
  isDeleteBusy,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: {
  isEditing: boolean;
  isBusy: boolean;
  isDeleteBusy?: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete?: () => void;
}) {
  if (!isEditing) {
    return (
      <div className="category-tree-action-cell gap-2">
        <button type="button" onClick={onEdit} className="admin-button-secondary category-tree-action-button w-full">
          Edit
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleteBusy}
            className="admin-button-danger category-tree-action-button w-full"
          >
            {isDeleteBusy ? "Checking..." : "Remove"}
          </button>
        )}
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

function TaxonomyWorkbookPreviewPanel({
  preview,
  busy,
  onCancel,
  onConfirm,
}: {
  preview: TaxonomyWorkbookFilePreview;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const canImport = Boolean(preview.data) && preview.issues.length === 0;
  const createdChanges = getWorkbookChanges(preview.changes, "create");
  const updatedChanges = getWorkbookChanges(preview.changes, "update");
  const unchangedChanges = getWorkbookChanges(preview.changes, "unchanged");

  return (
    <section className="admin-panel mt-6">
      <div className="admin-panel-header">
        <div>
          <h2 className="admin-panel-title">Workbook preview</h2>
          <p className="mt-1 text-xs font-semibold text-stone-400">{preview.fileName}</p>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6">
        {preview.issues.length > 0 && (
          <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-4">
            <h3 className="text-sm font-bold text-rose-800">Fix these rows before importing</h3>
            <div className="mt-3 grid gap-2">
              {preview.issues.map((issue, index) => (
                <p key={`${issue.sheet}:${issue.row}:${issue.field}:${index}`} className="m-0 text-sm font-semibold text-rose-700">
                  {formatWorkbookIssue(issue)}
                </p>
              ))}
            </div>
          </div>
        )}

        {canImport && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <WorkbookMetric label="Create" value={createdChanges.length} tone="create" />
              <WorkbookMetric label="Update" value={updatedChanges.length} tone="update" />
              <WorkbookMetric label="Unchanged" value={unchangedChanges.length} tone="unchanged" />
            </div>

            {createdChanges.length === 0 && updatedChanges.length === 0 ? (
              <p className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-500">
                No creates or updates were detected. Importing this workbook will leave the taxonomy unchanged.
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <WorkbookChangeGroup title="Rows to create" changes={createdChanges} emptyLabel="No new rows." />
                <WorkbookChangeGroup title="Rows to update" changes={updatedChanges} emptyLabel="No changed rows." />
              </div>
            )}
          </>
        )}

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onCancel} className="admin-button-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canImport || busy}
            className="admin-button-primary"
          >
            {busy ? "Importing..." : "Import workbook"}
          </button>
        </div>
      </div>
    </section>
  );
}

function WorkbookMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "create" | "update" | "unchanged";
}) {
  const className = {
    create: "border-emerald-200 bg-emerald-50 text-emerald-700",
    update: "border-amber-200 bg-amber-50 text-amber-800",
    unchanged: "border-stone-200 bg-stone-50 text-stone-500",
  }[tone];

  return <MetricCard label={label} value={value} className={className} />;
}

function WorkbookChangeGroup({
  title,
  changes,
  emptyLabel,
}: {
  title: string;
  changes: TaxonomyWorkbookChange[];
  emptyLabel: string;
}) {
  return (
    <section className="grid gap-2">
      <h3 className="text-sm font-extrabold text-stone-800">{title}</h3>
      <div className="grid gap-2">
        {changes.map((change, index) => (
          <WorkbookChangeRow key={`${change.level}:${change.id}:${change.name}:${index}`} change={change} />
        ))}
        {changes.length === 0 && (
          <p className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-500">
            {emptyLabel}
          </p>
        )}
      </div>
    </section>
  );
}

function WorkbookChangeRow({ change }: { change: TaxonomyWorkbookChange }) {
  const parentLabel = change.parentName ? ` under ${change.parentName}` : "";
  const fieldLabel = change.changedFields.length > 0
    ? `Fields: ${change.changedFields.join(", ")}`
    : "No field changes";

  return (
    <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
      <p className="text-sm font-bold text-stone-700">
        {change.level}: {change.name}{parentLabel}
      </p>
      <p className="mt-1 text-xs font-semibold text-stone-500">
        {change.id ? `${change.id} · ` : ""}{fieldLabel}
      </p>
    </div>
  );
}

function getWorkbookChanges(changes: TaxonomyWorkbookChange[], action: TaxonomyWorkbookChange["action"]) {
  return changes.filter((change) => change.action === action);
}

function TaxonomyDeletionDialog({
  preview,
  isBusy,
  onClose,
  onConfirm,
}: {
  preview: DeletionPreview | null;
  isBusy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!preview) return null;

  const hasQuestionUsage = preview.usage.questionCount > 0;
  const hasMateriUsage = preview.usage.materiCount > 0;
  const hasChildTopics = preview.childTopicCount > 0;
  const title = preview.canDelete ? `Remove ${preview.kind}` : `${preview.kind} cannot be removed yet`;

  return (
    <Dialog open onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="gap-2 border-b border-stone-100 p-5">
          <DialogTitle className="capitalize">{title}</DialogTitle>
          <DialogDescription className="text-stone-500">
            {preview.node.path}
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[62dvh] gap-5 overflow-y-auto p-5">
          {preview.canDelete ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900">
              This will permanently remove the unused {preview.kind}. Historical Attempts keep their saved taxonomy names.
            </p>
          ) : (
            <>
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
                Update the affected content first, then remove this {preview.kind}.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <UsageMetric label="Questions" value={preview.usage.questionCount} active={hasQuestionUsage} />
                <UsageMetric label="Materi" value={preview.usage.materiCount} active={hasMateriUsage} />
                <UsageMetric label="Child topics" value={preview.childTopicCount} active={hasChildTopics} />
              </div>

              {hasChildTopics && (
                <PreviewSection title="Remove child Topics first">
                  {preview.childTopics.map((topic) => (
                    <PreviewRow key={topic.id} title={topic.name} meta={topic.id} />
                  ))}
                  {preview.childTopicCount > preview.childTopics.length && (
                    <p className="text-xs font-semibold text-stone-500">
                      +{preview.childTopicCount - preview.childTopics.length} more Topics
                    </p>
                  )}
                </PreviewSection>
              )}

              {hasQuestionUsage && (
                <PreviewSection title="Questions to reclassify">
                  {preview.usage.questions.map((question) => (
                    <QuestionUsageRow key={question.id} question={question} />
                  ))}
                  {preview.usage.questionCount > preview.usage.questions.length && (
                    <p className="text-xs font-semibold text-stone-500">
                      +{preview.usage.questionCount - preview.usage.questions.length} more Questions
                    </p>
                  )}
                </PreviewSection>
              )}

              {hasMateriUsage && (
                <PreviewSection title="Materi to reclassify">
                  {preview.usage.materi.map((item) => (
                    <PreviewRow key={item.id} title={item.title} meta={`${item.status} · ${item.id}`} />
                  ))}
                  {preview.usage.materiCount > preview.usage.materi.length && (
                    <p className="text-xs font-semibold text-stone-500">
                      +{preview.usage.materiCount - preview.usage.materi.length} more Materi
                    </p>
                  )}
                </PreviewSection>
              )}
            </>
          )}
        </div>

        <DialogFooter className="justify-end border-t border-stone-100 p-5">
          <button type="button" onClick={onClose} className="admin-button-secondary">
            {preview.canDelete ? "Cancel" : "Close"}
          </button>
          {preview.canDelete && (
            <button type="button" onClick={onConfirm} disabled={isBusy} className="admin-button-danger">
              {isBusy ? "Removing..." : "Remove"}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UsageMetric({ label, value, active }: { label: string; value: number; active: boolean }) {
  const className = active
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-stone-200 bg-stone-50 text-stone-500";

  return <MetricCard label={label} value={value} className={className} />;
}

function MetricCard({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${className}`}>
      <p className="text-[11px] font-black uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function formatWorkbookIssue(issue: TaxonomyWorkbookPreview["issues"][number]) {
  const rowLabel = issue.row ? ` row ${issue.row}` : "";
  const fieldLabel = issue.field ? ` / ${issue.field}` : "";

  return `${issue.sheet}${rowLabel}${fieldLabel}: ${issue.message}`;
}

function PreviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h3 className="text-sm font-extrabold text-stone-800">{title}</h3>
      <div className="grid gap-2">
        {children}
      </div>
    </section>
  );
}

function QuestionUsageRow({ question }: { question: DeletionPreview["usage"]["questions"][number] }) {
  const isShared = question.tryouts.length > 1;

  return (
    <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm font-semibold leading-6 text-stone-700">{truncateText(question.questionText, 140)}</p>
        <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-stone-500">
          {question.status}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {question.tryouts.length === 0 && (
          <span className="admin-meta-tag">Not assigned to a Try-out</span>
        )}
        {question.tryouts.map((tryout) => (
          <a key={tryout.id} href={`/admin/tryouts/${tryout.id}`} className="admin-meta-tag text-primary hover:text-primary-dark">
            {tryout.title}
          </a>
        ))}
        {isShared && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-amber-800">
            Shared
          </span>
        )}
      </div>
    </div>
  );
}

function PreviewRow({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
      <p className="text-sm font-bold text-stone-700">{title}</p>
      <p className="mt-1 text-xs font-semibold text-stone-500">{meta}</p>
    </div>
  );
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;

  return `${value.slice(0, maxLength - 1).trim()}...`;
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
        className={`admin-control disabled:cursor-not-allowed ${compact ? "category-tree-control" : "disabled:opacity-60"}`}
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

function DownloadIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M8 2v7m0 0 3-3m-3 3L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 10v2.5A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function makeNewTopicForm(subCategoryId: string, categories: CategoryRow[]): TopicForm {
  const subCategory = findSubCategory(categories, subCategoryId);

  return {
    subCategoryId,
    topicId: "",
    name: "",
    sortOrder: String(getNextSortOrder(subCategory?.topics ?? [])),
  };
}

function getSubCategoryDraft(
  categoryId: string,
  drafts: Record<string, SubCategoryForm>,
  categories: CategoryRow[] = [],
) {
  return drafts[categoryId] ?? makeNewSubCategoryForm(categoryId, categories);
}

function getTopicDraft(
  subCategoryId: string,
  drafts: Record<string, TopicForm>,
  categories: CategoryRow[] = [],
) {
  return drafts[subCategoryId] ?? makeNewTopicForm(subCategoryId, categories);
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

function toTopicForm(
  subCategoryId: string,
  topic: CategoryRow["subCategories"][number]["topics"][number],
): TopicForm {
  return {
    subCategoryId,
    topicId: topic.id,
    name: topic.name,
    sortOrder: String(topic.sortOrder),
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

function toTopicPayload(form: TopicForm) {
  const sortOrder = parseSortOrder(form.sortOrder);

  if (!form.subCategoryId) return null;
  if (!form.name.trim()) return null;
  if (sortOrder === null) return null;

  return {
    subCategoryId: form.subCategoryId,
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

function countTopics(categories: CategoryRow[]) {
  return categories.reduce((total, category) => total + countCategoryTopics(category), 0);
}

function countCategoryTopics(category: CategoryRow) {
  return category.subCategories.reduce((total, subCategory) => total + subCategory.topics.length, 0);
}

function findSubCategory(categories: CategoryRow[], subCategoryId: string) {
  for (const category of categories) {
    const subCategory = category.subCategories.find((item) => item.id === subCategoryId);

    if (subCategory) return subCategory;
  }

  return null;
}
