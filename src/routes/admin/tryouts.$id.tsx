import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  getTryoutWorkbookAdmin,
  importTryoutWorkbookAdmin,
  listCategoriesAdmin,
  publishTryoutAdmin,
  unpublishTryoutAdmin,
  updateTryoutAdmin,
} from "../../lib/admin-functions";

type TryoutWorkbook = Awaited<ReturnType<typeof getTryoutWorkbookAdmin>>;
type CategoryRow = Awaited<ReturnType<typeof listCategoriesAdmin>>[number];
type AccessLevel = "free" | "premium";
type ContentStatus = "draft" | "published" | "unpublished";
type CorrectOption = "A" | "B" | "C" | "D" | "E";

type TryoutForm = {
  title: string;
  description: string;
  categoryId: string;
  durationMinutes: string;
  accessLevel: AccessLevel;
};

type TryoutWorkbookTryout = {
  title: string;
  description: string;
  categoryId: string;
  durationMinutes: number;
  accessLevel: AccessLevel;
  status: ContentStatus;
};

type TryoutWorkbookQuestion = {
  questionId?: string;
  sortOrder: number;
  categoryId: string;
  subCategoryId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  correctOption: CorrectOption;
  explanation: string;
  videoUrl?: string;
  accessLevel: "free" | "premium";
  status: ContentStatus;
};

type TryoutSheetRow = {
  title?: string;
  description?: string;
  category_id?: string;
  duration_minutes?: number | string;
  access_level?: string;
  status?: string;
};

type QuestionSheetRow = {
  question_id?: string;
  sort_order?: number | string;
  category_id?: string;
  sub_category_id?: string;
  question_text?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  option_e?: string;
  correct_option?: string;
  explanation?: string;
  video_url?: string;
  access_level?: string;
  status?: string;
};

const tryoutSheetHeaders = [
  "title",
  "description",
  "category_id",
  "duration_minutes",
  "access_level",
  "status",
] as const;

const questionSheetHeaders = [
  "question_id",
  "sort_order",
  "category_id",
  "sub_category_id",
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

export const Route = createFileRoute("/admin/tryouts/$id")({
  loader: async ({ params }) => {
    const [workbook, categories] = await Promise.all([
      getTryoutWorkbookAdmin({ data: { tryoutId: params.id } }),
      listCategoriesAdmin(),
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
    accessLevel: normalizeTryoutAccessLevel(workbook.tryout.accessLevel),
  }));
  const [busyAction, setBusyAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
      const tryoutRows = [toTryoutSheetRow(workbook.tryout)];
      const questionRows = workbook.questions.map(toQuestionSheetRow);

      XLSX.utils.book_append_sheet(
        wb,
        makeSheet(XLSX, tryoutSheetHeaders, tryoutRows),
        "tryout",
      );
      XLSX.utils.book_append_sheet(
        wb,
        makeSheet(XLSX, questionSheetHeaders, questionRows),
        "questions",
      );

      const slug = workbook.tryout.slug || "tryout";
      saveWorkbook(XLSX, wb, `${slug}-workbook-${formatTimestamp(new Date())}.xlsx`);
    } catch {
      setErrorMessage("Try-out workbook was not downloaded.");
    } finally {
      setBusyAction("");
    }
  };

  const importWorkbook = async (file: File | undefined) => {
    if (!file) return;

    setBusyAction("import");
    setErrorMessage("");

    try {
      const workbookData = await readTryoutWorkbook(file);
      await importTryoutWorkbookAdmin({
        data: {
          tryoutId,
          tryout: workbookData.tryout,
          questions: workbookData.questions,
        },
      });
      await refresh();
    } catch {
      setErrorMessage("Try-out workbook was not imported. Check both sheets and required fields.");
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

function FileUpload({
  accept,
  busy,
  placeholder,
  onFileSelect,
}: {
  accept: string;
  busy: boolean;
  placeholder: string;
  onFileSelect: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    }
    event.currentTarget.value = "";
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={`admin-file-upload ${fileName ? "admin-file-upload-active" : ""}`}
      type="button"
    >
      <UploadIcon className="w-4 h-4 shrink-0" />
      <span className="truncate">{fileName || placeholder}</span>
      <input
        ref={inputRef}
        onChange={handleChange}
        disabled={busy}
        className="sr-only"
        type="file"
        accept={accept}
      />
    </button>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 15V3m0 0L7 8m5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 17.5V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

function toTryoutSheetRow(tryout: TryoutWorkbook["tryout"]) {
  return {
    title: tryout.title,
    description: tryout.description,
    category_id: tryout.categoryId,
    duration_minutes: tryout.durationMinutes,
    access_level: tryout.accessLevel,
    status: tryout.status,
  };
}

function toQuestionSheetRow(question: TryoutWorkbook["questions"][number]) {
  return {
    question_id: question.questionId,
    sort_order: question.sortOrder,
    category_id: question.categoryId,
    sub_category_id: question.subCategoryId,
    question_text: question.questionText,
    option_a: question.optionA,
    option_b: question.optionB,
    option_c: question.optionC,
    option_d: question.optionD,
    option_e: question.optionE,
    correct_option: question.correctOption,
    explanation: question.explanation,
    video_url: question.videoUrl,
    access_level: question.accessLevel,
    status: question.status,
  };
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

  return sheet;
}

function saveWorkbook(XLSX: typeof import("xlsx"), workbook: import("xlsx").WorkBook, fileName: string) {
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

async function readTryoutWorkbook(file: File) {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const tryoutSheet = workbook.Sheets.tryout;
  const questionsSheet = workbook.Sheets.questions;

  if (!tryoutSheet || !questionsSheet) {
    throw new Error("Workbook must include tryout and questions sheets.");
  }

  const [tryoutRow] = XLSX.utils.sheet_to_json<TryoutSheetRow>(tryoutSheet, { defval: "" });
  const questionRows = XLSX.utils.sheet_to_json<QuestionSheetRow>(questionsSheet, { defval: "" });

  if (!tryoutRow) {
    throw new Error("Try-out sheet must include one row.");
  }

  return {
    tryout: {
      title: textValue(tryoutRow.title),
      description: textValue(tryoutRow.description),
      categoryId: textValue(tryoutRow.category_id),
      durationMinutes: numberValue(tryoutRow.duration_minutes),
      accessLevel: normalizeTryoutAccessLevel(tryoutRow.access_level),
      status: normalizeContentStatus(tryoutRow.status),
    },
    questions: questionRows.map((row, index) => ({
      questionId: optionalTextValue(row.question_id),
      sortOrder: numberValue(row.sort_order) || index + 1,
      categoryId: textValue(row.category_id),
      subCategoryId: textValue(row.sub_category_id),
      questionText: textValue(row.question_text),
      optionA: textValue(row.option_a),
      optionB: textValue(row.option_b),
      optionC: textValue(row.option_c),
      optionD: textValue(row.option_d),
      optionE: optionalTextValue(row.option_e),
      correctOption: normalizeCorrectOption(row.correct_option),
      explanation: textValue(row.explanation),
      videoUrl: optionalTextValue(row.video_url),
      accessLevel: normalizeQuestionAccessLevel(row.access_level),
      status: normalizeContentStatus(row.status),
    })),
  };
}

function textValue(value: unknown) {
  return String(value ?? "").trim();
}

function optionalTextValue(value: unknown) {
  const text = textValue(value);
  if (!text) return undefined;
  return text;
}

function numberValue(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number;
}

function normalizeTryoutAccessLevel(value: unknown): AccessLevel {
  const accessLevel = textValue(value).toLowerCase();
  if (accessLevel === "premium" || accessLevel === "platinum") return "premium";
  return "free";
}

function normalizeQuestionAccessLevel(value: unknown): "free" | "premium" {
  const accessLevel = textValue(value).toLowerCase();
  if (accessLevel === "premium") return "premium";
  return "free";
}

function normalizeContentStatus(value: unknown): ContentStatus {
  const status = textValue(value).toLowerCase();
  if (status === "published" || status === "unpublished") {
    return status;
  }
  return "draft";
}

function normalizeCorrectOption(value: unknown): CorrectOption {
  const option = textValue(value).toUpperCase();
  if (option === "B" || option === "C" || option === "D" || option === "E") {
    return option;
  }
  return "A";
}

function formatTimestamp(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}-${hours}-${minutes}`;
}
