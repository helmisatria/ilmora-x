import { Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { TryoutIcon } from "../../components/TryoutIcon";
import { TryoutIconField } from "../../components/admin/TryoutIconField";
import { FileUpload, WorkbookPreviewPanel, type WorkbookPreview } from "../../components/admin/TryoutWorkbookImport";
import { getSafeErrorMessage } from "../../lib/user-errors";
import {
  createTryoutAdmin,
  createTryoutFromWorkbookAdmin,
  getTryoutWorkbookAdmin,
  listTryoutsAdmin,
} from "./admin-tryout-functions";
import { listCategoryOptionsAdmin } from "../admin/admin-taxonomy-functions";
import * as tryoutWorkbook from "./tryout-workbook";
import * as tryoutWorkbookSheets from "./tryout-workbook-sheets";

type CategoryRow = Awaited<ReturnType<typeof listCategoryOptionsAdmin>>[number];
type TryoutRow = Awaited<ReturnType<typeof listTryoutsAdmin>>[number];
type AccessLevel = "free" | "premium";

type TryoutForm = {
  title: string;
  description: string;
  icon: string;
  categoryId: string;
  durationMinutes: string;
  accessLevel: AccessLevel;
};

const emptyForm: TryoutForm = {
  title: "",
  description: "",
  icon: "",
  categoryId: "",
  durationMinutes: "30",
  accessLevel: "free",
};

export type AdminTryoutsPageData = {
  categories: CategoryRow[];
  tryouts: TryoutRow[];
};

export function AdminTryoutsPage({ categories, tryouts }: AdminTryoutsPageData) {
  const location = useLocation();
  const router = useRouter();
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    categoryId: categories[0]?.id ?? "",
  }));
  const [busyAction, setBusyAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [workbookPreview, setWorkbookPreview] = useState<WorkbookPreview | null>(null);
  const isIndexRoute = location.pathname.replace(/\/+$/, "") === "/admin/tryouts";

  const refresh = async () => {
    await router.invalidate();
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? "",
    });
    setErrorMessage("");
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

    const payload = {
      title: form.title,
      description: form.description,
      icon: form.icon,
      categoryId: form.categoryId,
      durationMinutes,
      accessLevel: form.accessLevel,
    };

    try {
      await createTryoutAdmin({ data: payload });
      resetForm();
      await refresh();
    } catch {
      setErrorMessage("Try-out was not created. Check for duplicate titles or invalid fields.");
    } finally {
      setBusyAction("");
    }
  };

  const downloadSampleWorkbook = async () => {
    setBusyAction("sample");
    setErrorMessage("");

    try {
      const latestCategories = await listCategoryOptionsAdmin();
      const XLSX = await import("xlsx");
      const workbook = tryoutWorkbookSheets.makeSampleWorkbook(XLSX, latestCategories);
      const fileName = tryoutWorkbookSheets.makeSampleWorkbookFileName(new Date());

      tryoutWorkbookSheets.saveWorkbook(XLSX, workbook, fileName);
    } catch {
      setErrorMessage("Sample workbook was not downloaded.");
    } finally {
      setBusyAction("");
    }
  };

  const importNewWorkbook = async (file: File | undefined) => {
    if (!file) return;

    setBusyAction("preview-new");
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

  const confirmNewWorkbookImport = async () => {
    if (!workbookPreview?.data || workbookPreview.issues.length > 0) return;

    setBusyAction("import-new");
    setErrorMessage("");

    try {
      await createTryoutFromWorkbookAdmin({
        data: {
          tryout: workbookPreview.data.tryout,
          questions: workbookPreview.data.questions,
        },
      });
      setWorkbookPreview(null);
      resetForm();
      await refresh();
    } catch (error) {
      setErrorMessage(getSafeErrorMessage(error, "New Try-out workbook was not imported. Check for duplicate titles or server-side validation errors."));
    } finally {
      setBusyAction("");
    }
  };

  const downloadWorkbook = async (tryoutId: string) => {
    setBusyAction(`download:${tryoutId}`);
    setErrorMessage("");

    try {
      const [workbookData, latestCategories] = await Promise.all([
        getTryoutWorkbookAdmin({ data: { tryoutId } }),
        listCategoryOptionsAdmin(),
      ]);
      const XLSX = await import("xlsx");
      const workbook = tryoutWorkbookSheets.makeTryoutWorkbook(XLSX, workbookData, latestCategories);
      const fileName = tryoutWorkbookSheets.makeTryoutWorkbookFileName(workbookData.tryout.slug, new Date());

      tryoutWorkbookSheets.saveWorkbook(XLSX, workbook, fileName);
    } catch {
      setErrorMessage("Try-out workbook was not downloaded.");
    } finally {
      setBusyAction("");
    }
  };

  if (!isIndexRoute) {
    return <Outlet />;
  }

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane">
        <header className="admin-header">
          <a href="/admin" className="admin-back-link">Admin</a>
          <h1 className="admin-title">Try-outs</h1>
          <p className="admin-description">
            Create, edit, publish, and unpublish Try-outs from real database content.
          </p>
        </header>

        {errorMessage && (
          <p className="admin-alert">
            {errorMessage}
          </p>
        )}

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Create Try-out</h2>
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

            <Field label="Icon">
              <TryoutIconField
                value={form.icon}
                accent={categories.find((category) => category.id === form.categoryId)?.color ?? "#205072"}
                onChange={(icon) => setForm({ ...form, icon })}
                onError={setErrorMessage}
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
                disabled={busyAction === "save" || categories.length === 0}
                className="admin-button-primary"
                type="button"
              >
                Create Try-out
              </button>
            </div>
          </div>
        </section>

        {workbookPreview && (
          <WorkbookPreviewPanel
            preview={workbookPreview}
            busy={busyAction === "import-new"}
            errorMessage={errorMessage}
            confirmLabel="Create Try-out"
            onCancel={() => setWorkbookPreview(null)}
            onConfirm={confirmNewWorkbookImport}
          />
        )}

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Create from Excel</h2>
          </div>

          <div className="grid gap-5 p-5 sm:p-6 sm:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-semibold text-stone-600 leading-relaxed">
                Download the sample workbook, fill in the tryout and questions sheets, then upload to create a new Try-out.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
              <button
                onClick={downloadSampleWorkbook}
                disabled={busyAction === "sample"}
                className="admin-button-secondary whitespace-nowrap"
                type="button"
              >
                <DownloadIcon className="w-4 h-4" />
                Download sample
              </button>
              <FileUpload
                accept=".xlsx"
                busy={busyAction === "import-new"}
                placeholder="Upload workbook"
                onFileSelect={(file) => importNewWorkbook(file)}
              />
            </div>
          </div>
        </section>

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Current Try-outs</h2>
          </div>

          <div>
            {tryouts.map((tryout) => (
              <div key={tryout.id} className="admin-list-row">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-stone-100 bg-stone-50 text-stone-500"
                  aria-hidden="true"
                >
                  <TryoutIcon icon={tryout.icon} tryoutId={tryout.id} />
                </div>
                <div className="admin-list-content">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-[15px] font-bold text-stone-800 tracking-tight">{tryout.title}</h3>
                    <StatusPill status={tryout.status} />
                  </div>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-stone-500">{tryout.description}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="admin-meta-tag first:before:hidden">{tryout.categoryName}</span>
                    <span className="admin-meta-tag">{tryout.durationMinutes} min</span>
                    <span className="admin-meta-tag capitalize">{tryout.accessLevel}</span>
                  </div>
                </div>

                <div className="admin-list-actions">
                  <p className="text-xs font-semibold text-stone-400 shrink-0">Updated {formatDate(tryout.updatedAt)}</p>
                  <div className="admin-list-actions-bar">
                    <Link
                      to="/admin/tryouts/$id"
                      params={{ id: tryout.id }}
                      className="admin-button-ghost"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                      Details
                    </Link>
                    <button
                      onClick={() => downloadWorkbook(tryout.id)}
                      disabled={busyAction === `download:${tryout.id}`}
                      className="admin-button-ghost"
                      type="button"
                    >
                      <DownloadIcon className="w-3.5 h-3.5" />
                      Excel
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {tryouts.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-stone-400">No Try-outs found yet.</p>
              </div>
            )}
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

function StatusPill({ status }: { status: TryoutRow["status"] }) {
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

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M4 20h4L18.5 9.5a2.8 2.8 0 1 0-4-4L4 16v4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m14.5 5.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
