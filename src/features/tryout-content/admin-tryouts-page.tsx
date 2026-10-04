import { Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { cloneElement, isValidElement, useEffect, useId, useState } from "react";
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
      setErrorMessage("Isi judul, deskripsi, dan kategori.");
      return;
    }

    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 300) {
      setErrorMessage("Isi durasi dengan angka bulat 1 sampai 300 menit.");
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
      durationMinutes,
      accessLevel: form.accessLevel,
    };

    try {
      await createTryoutAdmin({ data: payload });
      resetForm();
      await refresh();
      setSuccessMessage("Perubahan tersimpan.");
    } catch {
      setErrorMessage("Try-out belum dibuat. Periksa isian dan gunakan judul yang berbeda.");
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
        <header className="admin-header">
          <a href="/admin" className="admin-back-link">Admin</a>
          <h1 className="admin-title">Try-out</h1>
          <p className="admin-description">
            Buat try-out, tambahkan soal dan pembahasan, lalu tayangkan saat siap.
          </p>
        </header>

        {successMessage && <p role="status" className="mt-4 text-sm text-emerald-700">{successMessage}</p>}
        {errorMessage && !workbookPreview && (
          <p role="alert" className="admin-alert">
            {errorMessage}
          </p>
        )}

        {categories.length === 0 && <p className="admin-alert">Belum ada kategori. <a href="/admin/categories" className="underline">Tambahkan kategori</a> sebelum membuat try-out lewat formulir. Anda juga dapat mengisi nama kategori di Excel.</p>}
        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Buat try-out</h2>
          </div>

          <div className="grid gap-5 p-5 sm:p-6">
            <Field label="Judul">
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="admin-control"
                placeholder="UKAI Try-out 1"
              />
            </Field>

            <Field label="Deskripsi">
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="admin-control min-h-24"
                placeholder="Penjelasan singkat untuk peserta sebelum mengerjakan try-out."
              />
            </Field>

            <Field label="Ikon">
              <TryoutIconField
                value={form.icon}
                accent={categories.find((category) => category.id === form.categoryId)?.color ?? "#205072"}
                onChange={(icon) => setForm({ ...form, icon })}
                onError={setErrorMessage}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Kategori">
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

              <Field label="Durasi dalam menit">
                <input
                  value={form.durationMinutes}
                  onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })}
                  className="admin-control"
                  inputMode="numeric"
                />
              </Field>

              <Field label="Akses">
                <select
                  value={form.accessLevel}
                  onChange={(event) => setForm({ ...form, accessLevel: event.target.value as AccessLevel })}
                  className="admin-control"
                >
                  <option value="free">Gratis</option>
                  <option value="premium">Premium</option>
                </select>
              </Field>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={saveTryout}
                disabled={Boolean(busyAction)}
                className="admin-button-primary"
                type="button"
              >
                Buat try-out
              </button>
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
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Buat dari Excel</h2>
          </div>

          <div className="grid gap-5 p-5 sm:p-6 sm:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-semibold text-stone-600 leading-relaxed">
                Unduh contoh Excel. Baca lembar panduan, ganti isi lembar tryout dan questions, lalu unggah. Periksa pratinjau sebelum menyimpan.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
              <button
                onClick={downloadSampleWorkbook}
                disabled={Boolean(busyAction)}
                className="admin-button-secondary whitespace-nowrap"
                type="button"
              >
                <DownloadIcon className="w-4 h-4" />
                Unduh contoh Excel
              </button>
              <FileUpload
                accept=".xlsx"
                busy={Boolean(busyAction)}
                placeholder="Unggah Excel"
                onFileSelect={(file) => importNewWorkbook(file)}
              />
            </div>
          </div>
        </section>

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Daftar try-out</h2>
            <label>Cari try-out<input className="admin-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Judul atau kategori" /></label>
          </div>

          <div>
            {filteredTryouts.map((tryout) => (
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
                    <span className="admin-meta-tag">{tryout.durationMinutes} menit</span>
                    <span className="admin-meta-tag capitalize">{tryout.accessLevel === "free" ? "Gratis" : "Premium"}</span>
                  </div>
                </div>

                <div className="admin-list-actions">
                  <p className="text-xs font-semibold text-stone-400 shrink-0">Diubah {formatDate(tryout.updatedAt)}</p>
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
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-stone-400">{tryouts.length === 0 ? "Belum ada try-out. Buat lewat formulir atau unggah Excel." : "Tidak ada try-out yang cocok. Coba kata lain."}</p>
              </div>
            )}
          </div>
        </section>
      </fieldset>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  const isControl = isValidElement(children) && typeof children.type === "string";
  return (
    <div className="block">
      {isControl ? <label htmlFor={id} className="mb-2 block text-sm font-bold text-stone-700">{label}</label>
        : <span className="mb-2 block text-sm font-bold text-stone-700">{label}</span>}
      {isControl ? cloneElement(children as React.ReactElement<{ id?: string }>, { id }) : children}
    </div>
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
