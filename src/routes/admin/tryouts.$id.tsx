import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { FileUpload, WorkbookPreviewPanel, type WorkbookPreview } from "../../components/admin/TryoutWorkbookImport";
import {
  getTryoutWorkbookAdmin,
  importTryoutWorkbookAdmin,
  listCategoryOptionsAdmin,
  publishTryoutAdmin,
  unpublishTryoutAdmin,
  updateTryoutAdmin,
} from "../../lib/admin-functions";
import * as tryoutWorkbook from "../../lib/tryout-workbook";

type TryoutWorkbook = Awaited<ReturnType<typeof getTryoutWorkbookAdmin>>;
type CategoryRow = Awaited<ReturnType<typeof listCategoryOptionsAdmin>>[number];
type AccessLevel = "free" | "premium";
type ContentStatus = "draft" | "published" | "unpublished";

type TryoutForm = {
  title: string;
  description: string;
  categoryId: string;
  durationMinutes: string;
  accessLevel: AccessLevel;
};

export const Route = createFileRoute("/admin/tryouts/$id")({
  loader: async ({ params }) => {
    const [workbook, categories] = await Promise.all([
      getTryoutWorkbookAdmin({ data: { tryoutId: params.id } }),
      listCategoryOptionsAdmin(),
    ]);

    return { workbook, categories };
  },
  head: ({ params }) => ({
    meta: [
      { title: `Try-out Detail — IlmoraX Admin` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminTryoutDetailPage,
});

function AdminTryoutDetailPage() {
  const { workbook, categories } = Route.useLoaderData() as {
    workbook: TryoutWorkbook;
    categories: CategoryRow[];
  };
  const router = useRouter();
  const tryoutId = workbook.tryout.id;

  const [form, setForm] = useState<TryoutForm>(() => ({
    title: workbook.tryout.title,
    description: workbook.tryout.description,
    categoryId: workbook.tryout.categoryId,
    durationMinutes: String(workbook.tryout.durationMinutes),
    accessLevel: workbook.tryout.accessLevel,
  }));
  const [busyAction, setBusyAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [workbookPreview, setWorkbookPreview] = useState<WorkbookPreview | null>(null);

  const refresh = async () => {
    await router.invalidate();
  };

  const saveTryout = async () => {
    const durationMinutes = Number(form.durationMinutes);

    if (!form.title.trim() || !form.description.trim() || !form.categoryId) {
      setErrorMessage("Title, description, and category are required.");
      return;
    }

    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 300) {
      setErrorMessage("Duration must be between 1 and 300 minutes.");
      return;
    }

    setBusyAction("save");
    setErrorMessage("");

    try {
      await updateTryoutAdmin({
        data: {
          title: form.title,
          description: form.description,
          categoryId: form.categoryId,
          durationMinutes,
          accessLevel: form.accessLevel,
          tryoutId,
        },
      });
      await refresh();
    } catch {
      setErrorMessage("Try-out was not saved. Check for duplicate titles or invalid fields.");
    } finally {
      setBusyAction("");
    }
  };

  const setPublication = async (nextStatus: "published" | "unpublished") => {
    setBusyAction("publish");
    setErrorMessage("");

    try {
      if (nextStatus === "published") {
        await publishTryoutAdmin({ data: { tryoutId } });
      } else {
        await unpublishTryoutAdmin({ data: { tryoutId } });
      }
      await refresh();
    } catch {
      setErrorMessage("Publication status was not updated.");
    } finally {
      setBusyAction("");
    }
  };

  const downloadWorkbook = async () => {
    setBusyAction("download");
    setErrorMessage("");

    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      const tryoutRows = [tryoutWorkbook.toTryoutSheetRow(workbook.tryout)];
      const questionRows = workbook.questions.map(tryoutWorkbook.toQuestionSheetRow);

      XLSX.utils.book_append_sheet(
        wb,
        tryoutWorkbook.makeSheet(XLSX, tryoutWorkbook.tryoutSheetHeaders, tryoutRows),
        "tryout",
      );
      XLSX.utils.book_append_sheet(
        wb,
        tryoutWorkbook.makeSheet(XLSX, tryoutWorkbook.questionSheetHeaders, questionRows),
        "questions",
      );

      const slug = workbook.tryout.slug || "tryout";
      tryoutWorkbook.saveWorkbook(XLSX, wb, `${slug}-workbook-${tryoutWorkbook.formatTimestamp(new Date())}.xlsx`);
    } catch {
      setErrorMessage("Try-out workbook was not downloaded.");
    } finally {
      setBusyAction("");
    }
  };

  const importWorkbook = async (file: File | undefined) => {
    if (!file) return;

    setBusyAction("preview-import");
    setErrorMessage("");

    try {
      const result = await tryoutWorkbook.readTryoutWorkbook(file, categories);

      setWorkbookPreview({
        fileName: file.name,
        data: result.data,
        issues: result.issues,
        taxonomyActions: result.taxonomyActions,
      });
    } catch {
      setErrorMessage("Workbook could not be read. Upload a valid .xlsx file.");
    } finally {
      setBusyAction("");
    }
  };

  const confirmWorkbookImport = async () => {
    if (!workbookPreview?.data || workbookPreview.issues.length > 0) return;

    setBusyAction("import");
    setErrorMessage("");

    try {
      await importTryoutWorkbookAdmin({
        data: {
          tryoutId,
          tryout: workbookPreview.data.tryout,
          questions: workbookPreview.data.questions,
        },
      });
      setWorkbookPreview(null);
      await refresh();
    } catch {
      setErrorMessage("Try-out workbook was not imported. Check for server-side validation errors.");
    } finally {
      setBusyAction("");
    }
  };

  const hasChanges =
    form.title !== workbook.tryout.title ||
    form.description !== workbook.tryout.description ||
    form.categoryId !== workbook.tryout.categoryId ||
    Number(form.durationMinutes) !== workbook.tryout.durationMinutes ||
    form.accessLevel !== workbook.tryout.accessLevel;

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane">
        <header className="admin-header">
          <a href="/admin/tryouts" className="admin-back-link">Try-outs</a>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="admin-title">{workbook.tryout.title}</h1>
            <StatusPill status={workbook.tryout.status} />
          </div>
          <p className="admin-description">{workbook.tryout.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="admin-meta-tag first:before:hidden">{categories.find((c) => c.id === workbook.tryout.categoryId)?.name ?? workbook.tryout.categoryId}</span>
            <span className="admin-meta-tag">{workbook.tryout.durationMinutes} min</span>
            <span className="admin-meta-tag capitalize">{workbook.tryout.accessLevel}</span>
            <span className="admin-meta-tag">{workbook.questions.length} questions</span>
          </div>
        </header>

        {errorMessage && (
          <p className="admin-alert">
            {errorMessage}
          </p>
        )}

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Edit Try-out</h2>
          </div>

          <div className="grid gap-5 p-5 sm:p-6">
            <Field label="Title">
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="admin-control"
                placeholder="UKAI Try-out 1"
              />
            </Field>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="admin-control min-h-24"
                placeholder="Short description shown to Students before starting."
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Category">
                <select
                  value={form.categoryId}
                  onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                  className="admin-control"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Duration">
                <input
                  value={form.durationMinutes}
                  onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })}
                  className="admin-control"
                  inputMode="numeric"
                />
              </Field>

              <Field label="Access">
                <select
                  value={form.accessLevel}
                  onChange={(event) => setForm({ ...form, accessLevel: event.target.value as AccessLevel })}
                  className="admin-control"
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
              </Field>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={saveTryout}
                disabled={busyAction === "save" || !hasChanges}
                className="admin-button-primary"
                type="button"
              >
                {busyAction === "save" ? "Saving..." : "Save changes"}
              </button>
              {workbook.tryout.status === "published" ? (
                <button
                  onClick={() => setPublication("unpublished")}
                  disabled={busyAction === "publish"}
                  className="admin-button-ghost text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  type="button"
                >
                  <EyeOffIcon className="w-3.5 h-3.5" />
                  Unpublish
                </button>
              ) : (
                <button
                  onClick={() => setPublication("published")}
                  disabled={busyAction === "publish"}
                  className="admin-button-success"
                  type="button"
                >
                  <EyeIcon className="w-3.5 h-3.5" />
                  Publish
                </button>
              )}
            </div>
          </div>
        </section>

        {workbookPreview && (
          <WorkbookPreviewPanel
            preview={workbookPreview}
            busy={busyAction === "import"}
            confirmLabel="Import workbook"
            onCancel={() => setWorkbookPreview(null)}
            onConfirm={confirmWorkbookImport}
          />
        )}

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Excel Import / Export</h2>
          </div>

          <div className="flex flex-wrap gap-3 p-5 sm:p-6">
            <button
              onClick={downloadWorkbook}
              disabled={busyAction === "download"}
              className="admin-button-secondary"
              type="button"
            >
              <DownloadIcon className="w-4 h-4" />
              Download workbook
            </button>
            <FileUpload
              accept=".xlsx"
              busy={busyAction === "import"}
              placeholder="Upload workbook"
              onFileSelect={(file) => importWorkbook(file)}
            />
          </div>
        </section>

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Questions ({workbook.questions.length})</h2>
          </div>

          <div>
            {workbook.questions.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-stone-400">No questions assigned yet. Import a workbook to add questions.</p>
              </div>
            )}

            {workbook.questions.map((question, index) => (
              <div key={question.questionId ?? `q-${index}`} className="admin-list-row">
                <div className="admin-list-content">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-500">
                      {question.sortOrder}
                    </span>
                    <h3 className="text-[15px] font-bold text-stone-800 tracking-tight leading-snug">
                      {question.questionText}
                    </h3>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="admin-meta-tag first:before:hidden">{question.categoryId}</span>
                    <span className="admin-meta-tag">{question.subCategoryId}</span>
                    <span className="admin-meta-tag capitalize">{question.accessLevel}</span>
                    <span className="admin-meta-tag">Answer: {question.correctOption}</span>
                    <StatusPill status={question.status} />
                  </div>
                  {question.explanation && (
                    <p className="mt-1.5 text-sm text-stone-400 line-clamp-2">{question.explanation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-stone-700">{label}</span>
      {children}
    </label>
  );
}

function StatusPill({ status }: { status: ContentStatus }) {
  const config = {
    draft: {
      className: "border-stone-200 bg-stone-100 text-stone-600",
      label: "Draft",
    },
    published: {
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      label: "Published",
    },
    unpublished: {
      className: "border-amber-200 bg-amber-50 text-amber-700",
      label: "Unpublished",
    },
  };

  const { className, label } = config[status];

  return (
    <span className={`admin-status-pill ${className}`}>
      {label}
    </span>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 15V3m0 0L7 8m5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 17.5V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2.5M7 15l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M9.9 4.2A10.1 10.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.5 3.7m-4.8 3.3A10 10 0 0 1 1 12s4-8 11-8a10 10 0 0 1 4.2.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 1 23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
