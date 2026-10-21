import { Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TryoutIcon } from "../../components/TryoutIcon";
import { AdminEmptyState } from "../../components/admin/AdminEmptyState";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPanelHeader } from "../../components/admin/AdminPanelHeader";
import { AdminSearchField } from "../../components/admin/AdminSearchField";
import { useUnsavedChangesGuard } from "../../components/admin/useUnsavedChangesGuard";
import { FileUpload, WorkbookPreviewPanel, type WorkbookPreview } from "../../components/admin/TryoutWorkbookImport";
import { getSafeErrorMessage } from "../../lib/user-errors";
import {
  createTryoutAdmin,
  createTryoutFromWorkbookAdmin,
  getTryoutWorkbookAdmin,
  listTryoutsAdmin,
} from "./admin-tryout-functions";
import { listCategoryOptionsAdmin } from "../admin/admin-taxonomy-functions";
import { AdminTryoutCatalogOrder } from "./admin-tryout-catalog-order";
import { TryoutDetailsFields } from "./tryout-details-fields";
import { getTryoutServerFieldError, validateTryoutDetails, type TryoutDetailsErrors, type TryoutDetailsValues } from "./tryout-details-form";
import * as tryoutWorkbook from "./tryout-workbook";
import * as tryoutWorkbookSheets from "./tryout-workbook-sheets";

type CategoryRow = Awaited<ReturnType<typeof listCategoryOptionsAdmin>>[number];
type TryoutRow = Awaited<ReturnType<typeof listTryoutsAdmin>>[number];
const emptyForm: TryoutDetailsValues = {
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
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => setIsHydrated(true), []);
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    categoryId: categories[0]?.id ?? "",
  }));
  const [search, setSearch] = useState("");
  const filteredTryouts = tryouts.filter((tryout) => `${tryout.title} ${tryout.categoryName}`.toLowerCase().includes(search.trim().toLowerCase()));
  const [busyAction, setBusyAction] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [workbookPreview, setWorkbookPreview] = useState<WorkbookPreview | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [serverErrors, setServerErrors] = useState<TryoutDetailsErrors>({});
  const isIndexRoute = location.pathname.replace(/\/+$/, "") === "/admin/tryouts";
  const validation = validateTryoutDetails(form);
  const errors: TryoutDetailsErrors = { ...(showValidation ? validation.errors : {}), ...serverErrors };
  const isDirty = Boolean(form.title.trim() || form.description.trim() || form.icon) ||
    form.durationMinutes !== emptyForm.durationMinutes || form.accessLevel !== emptyForm.accessLevel;
  // This page stays mounted under the detail route, so only guard the list itself.
  useUnsavedChangesGuard(isIndexRoute && isDirty && !busyAction);

  const refresh = async () => {
    await router.invalidate();
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? "",
    });
    setShowValidation(false);
    setServerErrors({});
    setErrorMessage("");
  };

  const updateForm = (patch: Partial<TryoutDetailsValues>) => {
    setForm({ ...form, ...patch });
    setServerErrors({});
  };

  const focusCreateField = (field: string) => {
    const control = document.querySelector<HTMLElement>(`#create-tryout [data-field="${field}"]`);
    control?.focus({ preventScroll: true });
    control?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  // A new try-out has no questions yet, so open it right away to add them.
  const saveTryout = async () => {
    if (busyAction) return;

    if (validation.firstInvalidField) {
      setShowValidation(true);
      setErrorMessage(validation.summary);
      focusCreateField(validation.firstInvalidField);
      return;
    }

    setSuccessMessage("");
    setBusyAction("save");
    setErrorMessage("");

    const payload = {
      title: form.title,
      description: form.description,
      icon: form.icon,
      categoryId: form.categoryId,
      durationMinutes: Number(form.durationMinutes),
      accessLevel: form.accessLevel,
    };

    try {
      const { tryoutId } = await createTryoutAdmin({ data: payload });
      resetForm();
      await router.navigate({ to: "/admin/tryouts/$id", params: { id: tryoutId } });
    } catch (error) {
      const message = getSafeErrorMessage(error, "Try-out belum dibuat. Periksa isian dan gunakan judul yang berbeda.");
      setErrorMessage(message);
      setServerErrors(getTryoutServerFieldError(message));
      focusCreateField("title");
    } finally {
      setBusyAction("");
    }
  };

  const downloadSampleWorkbook = async () => {
    setSuccessMessage("");
    setBusyAction("sample");
    setErrorMessage("");

    try {
      const response = await fetch("/templates/ilmorax-tryout-sample.xlsx");
      if (!response.ok) throw new Error("Template unavailable");
      tryoutWorkbookSheets.saveWorkbookBlob(await response.blob(), tryoutWorkbookSheets.makeSampleWorkbookFileName(new Date()));
    } catch {
      setErrorMessage("Contoh Excel belum terunduh. Coba lagi.");
    } finally {
      setBusyAction("");
    }
  };

  const importNewWorkbook = async (file: File | undefined) => {
    if (!file) return;

    setWorkbookPreview(null);
    setSuccessMessage("");
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
      setErrorMessage("File tidak dapat dibaca. Gunakan file .xlsx dari contoh Excel atau hasil unduhan.");
    } finally {
      setBusyAction("");
    }
  };

  const confirmNewWorkbookImport = async () => {
    if (!workbookPreview?.data || workbookPreview.issues.length > 0) return;

    setSuccessMessage("");
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
      setSuccessMessage("Perubahan tersimpan.");
    } catch (error) {
      setErrorMessage(getSafeErrorMessage(error, "Try-out belum dibuat. Periksa isian dan gunakan judul yang berbeda."));
    } finally {
      setBusyAction("");
    }
  };

  const downloadWorkbook = async (tryoutId: string) => {
    setSuccessMessage("");
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
      setErrorMessage("File Excel belum terunduh. Coba lagi.");
    } finally {
      setBusyAction("");
    }
  };

  if (!isIndexRoute) {
    return <Outlet />;
  }

  return (
    <main className="admin-shell page-enter">
      <fieldset className="admin-lane min-w-0" disabled={!isHydrated || Boolean(busyAction)} data-admin-ready={isHydrated}>
        <AdminPageHeader
          title="Try-out"
          description="Buat try-out, tambahkan soal dan pembahasan, lalu tayangkan saat siap."
          actions={
            tryouts.some((tryout) => tryout.status === "published") && (
              <a href="#catalog-order" className="insights-link">Atur urutan di katalog peserta ↓</a>
            )
          }
        />

        {successMessage && <p role="status" className="mt-4 text-sm text-emerald-700">{successMessage}</p>}
        {errorMessage && !workbookPreview && (
          <p role="alert" className="admin-alert">
            {errorMessage}
          </p>
        )}

        {categories.length === 0 && <p className="admin-alert">Belum ada kategori. <a href="/admin/categories" className="underline">Tambahkan kategori</a> sebelum membuat try-out lewat formulir. Anda juga dapat mengisi nama kategori di Excel.</p>}
        <section id="create-tryout" className="admin-panel mt-6 scroll-mt-6">
          <AdminPanelHeader
            title="Buat try-out"
            badge={isDirty && <span className="admin-status-pill border-amber-200 bg-amber-50 text-amber-700">Belum disimpan</span>}
            description="Isi detail dasar. Setelah dibuat, halaman try-out terbuka untuk menambah soal."
          />

          <div
            className="grid gap-4 p-4"
            onKeyDown={(event) => {
              if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) return;

              event.preventDefault();
              saveTryout();
            }}
          >
            <TryoutDetailsFields
              values={form}
              errors={errors}
              categories={categories}
              onChange={updateForm}
              onIconError={setErrorMessage}
            />

            <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
              <button
                onClick={saveTryout}
                disabled={Boolean(busyAction)}
                className="admin-button-primary"
                type="button"
              >
                {busyAction === "save" ? "Membuat..." : "Buat try-out"}
              </button>
              {isDirty && (
                <button onClick={resetForm} disabled={Boolean(busyAction)} className="admin-button-ghost" type="button">
                  Kosongkan
                </button>
              )}
              <span className="ml-auto hidden text-[11px] font-medium text-stone-400 md:inline">
                <kbd className="admin-kbd">Ctrl/⌘ Enter</kbd> buat
              </span>
            </div>
          </div>
        </section>

        {workbookPreview && (
          <WorkbookPreviewPanel
            preview={workbookPreview}
            busy={Boolean(busyAction)}
            errorMessage={errorMessage}
            confirmLabel="Buat try-out"
            onCancel={() => setWorkbookPreview(null)}
            onConfirm={confirmNewWorkbookImport}
          />
        )}

        <section className="admin-panel mt-6">
          <AdminPanelHeader
            title="Buat dari Excel"
            description="Unduh contoh, baca lembar panduan, isi lembar tryout dan questions, lalu unggah. Kamu bisa cek pratinjau sebelum menyimpan."
          />

          <div className="grid gap-3 p-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <div>
              <button
                onClick={downloadSampleWorkbook}
                disabled={Boolean(busyAction)}
                className="admin-button-secondary whitespace-nowrap"
                type="button"
              >
                <DownloadIcon className="w-4 h-4" />
                Unduh contoh Excel
              </button>
            </div>
            <FileUpload
                accept=".xlsx"
                busy={Boolean(busyAction)}
                placeholder="Unggah Excel"
                dropHint="atau seret file ke sini"
                onFileSelect={(file) => importNewWorkbook(file)}
              />
          </div>
        </section>

        <AdminTryoutCatalogOrder tryouts={tryouts} />

        <section className="admin-panel mt-6">
          <AdminPanelHeader
            title="Daftar try-out"
            badge={<span className="admin-count">{tryouts.length}</span>}
            description="Semua try-out, termasuk draf dan yang disembunyikan."
            actions={
              <AdminSearchField
                label="Cari try-out"
                value={search}
                onChange={setSearch}
                placeholder="Cari judul atau kategori"
              />
            }
          />

          <div>
            {filteredTryouts.map((tryout) => (
              <div key={tryout.id} className="admin-list-row flex flex-col gap-2 border-t border-stone-100 px-3 py-2.5 transition-colors duration-150 first:border-t-0 last:rounded-b-xl hover:bg-stone-50/70 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-100 bg-stone-50 text-stone-500"
                    aria-hidden="true"
                  >
                    <TryoutIcon icon={tryout.icon} tryoutId={tryout.id} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className="truncate text-[13.5px] font-bold text-stone-800">{tryout.title}</h3>
                      <StatusPill status={tryout.status} />
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span className={`admin-meta-tag ${tryout.accessLevel === "free" ? "text-emerald-700" : "text-amber-700"}`}>
                        {tryout.accessLevel === "free" ? "Gratis" : "Premium"}
                      </span>
                      <span className="admin-meta-tag">{tryout.categoryName}</span>
                      <span className="admin-meta-tag">{tryout.durationMinutes} menit</span>
                      <span className="admin-meta-tag">Diubah {formatDate(tryout.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-0.5 pl-12 sm:pl-0">
                  <div className="admin-list-actions-bar">
                    <Link
                      to="/admin/tryouts/$id"
                      params={{ id: tryout.id }}
                      className="admin-button-ghost"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                      Kelola soal
                    </Link>
                    <button
                      onClick={() => downloadWorkbook(tryout.id)}
                      disabled={Boolean(busyAction)}
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

            {filteredTryouts.length === 0 && (
              <AdminEmptyState
                title={tryouts.length === 0 ? "Belum ada try-out. Buat lewat formulir atau unggah Excel." : "Tidak ada try-out yang cocok. Coba kata lain."}
                action={search.trim() && (
                  <button type="button" onClick={() => setSearch("")} className="admin-button-ghost">
                    Hapus pencarian
                  </button>
                )}
              />
            )}
          </div>
        </section>
      </fieldset>
    </main>
  );
}

function StatusPill({ status }: { status: TryoutRow["status"] }) {
  const config = {
    draft: {
      className: "border-stone-200 bg-stone-100 text-stone-600",
      label: "Draf",
    },
    published: {
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      label: "Tayang",
    },
    unpublished: {
      className: "border-amber-200 bg-amber-50 text-amber-700",
      label: "Disembunyikan",
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
      <path d="M12 3v12m0 0-5-5m5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
