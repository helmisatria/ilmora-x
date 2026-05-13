import { createFileRoute, Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  createTryoutAdmin,
  createTryoutFromWorkbookAdmin,
  getTryoutWorkbookAdmin,
  listCategoriesAdmin,
  listTryoutsAdmin,
} from "../../lib/admin-functions";

type CategoryRow = Awaited<ReturnType<typeof listCategoriesAdmin>>[number];
type TryoutRow = Awaited<ReturnType<typeof listTryoutsAdmin>>[number];
type AccessLevel = "free" | "premium";
type QuestionAccessLevel = "free" | "premium";
type ContentStatus = "draft" | "published" | "unpublished";
type CorrectOption = "A" | "B" | "C" | "D" | "E";

type TryoutForm = {
  title: string;
  description: string;
  categoryId: string;
  durationMinutes: string;
  accessLevel: AccessLevel;
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

const emptyForm: TryoutForm = {
  title: "",
  description: "",
  categoryId: "",
  durationMinutes: "30",
  accessLevel: "free",
};

export const Route = createFileRoute("/admin/tryouts")({
  loader: async () => {
    const [categories, tryouts] = await Promise.all([
      listCategoriesAdmin(),
      listTryoutsAdmin(),
    ]);

    return { categories, tryouts };
  },
  head: () => ({
    meta: [
      { title: "Try-outs — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminTryoutsPage,
});

function AdminTryoutsPage() {
  const location = useLocation();

  if (location.pathname !== "/admin/tryouts") {
    return <Outlet />;
  }

  const { categories, tryouts } = Route.useLoaderData() as {
    categories: CategoryRow[];
    tryouts: TryoutRow[];
  };
  const router = useRouter();
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    categoryId: categories[0]?.id ?? "",
  }));
  const [busyAction, setBusyAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
      const XLSX = await import("xlsx");
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        makeSheet(XLSX, tryoutSheetHeaders, [makeSampleTryoutRow()]),
        "tryout",
      );
      XLSX.utils.book_append_sheet(
        workbook,
        makeSheet(XLSX, questionSheetHeaders, makeSampleQuestionRows()),
        "questions",
      );

      saveWorkbook(XLSX, workbook, `ilmorax-tryout-sample-${formatTimestamp(new Date())}.xlsx`);
    } catch {
      setErrorMessage("Sample workbook was not downloaded.");
    } finally {
      setBusyAction("");
    }
  };

  const importNewWorkbook = async (file: File | undefined) => {
    if (!file) return;

    setBusyAction("import-new");
    setErrorMessage("");

    try {
      const workbookData = await readTryoutWorkbook(file);
      await createTryoutFromWorkbookAdmin({
        data: {
          tryout: workbookData.tryout,
          questions: workbookData.questions,
        },
      });
      resetForm();
      await refresh();
    } catch {
      setErrorMessage("New Try-out workbook was not imported. Check both sheets and duplicate titles.");
    } finally {
      setBusyAction("");
    }
  };

  const downloadWorkbook = async (tryoutId: string) => {
    setBusyAction(`download:${tryoutId}`);
    setErrorMessage("");

    try {
      const workbookData = await getTryoutWorkbookAdmin({ data: { tryoutId } });
      const XLSX = await import("xlsx");
      const workbook = XLSX.utils.book_new();
      const tryoutRows = [toTryoutSheetRow(workbookData.tryout)];
      const questionRows = workbookData.questions.map(toQuestionSheetRow);

      XLSX.utils.book_append_sheet(
        workbook,
        makeSheet(XLSX, tryoutSheetHeaders, tryoutRows),
        "tryout",
      );
      XLSX.utils.book_append_sheet(
        workbook,
        makeSheet(XLSX, questionSheetHeaders, questionRows),
        "questions",
      );

      saveWorkbook(XLSX, workbook, `${workbookData.tryout.slug || "tryout"}-workbook-${formatTimestamp(new Date())}.xlsx`);
    } catch {
      setErrorMessage("Try-out workbook was not downloaded.");
    } finally {
      setBusyAction("");
    }
  };

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

function FileUpload({
  accept,
  busy,
  compact,
  placeholder,
  onFileSelect,
}: {
  accept: string;
  busy: boolean;
  compact?: boolean;
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

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={busy}
        className="admin-button-ghost"
        type="button"
      >
        <UploadIcon className="w-3.5 h-3.5" />
        {fileName || placeholder}
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

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M4 20h4L18.5 9.5a2.8 2.8 0 1 0-4-4L4 16v4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m14.5 5.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function toTryoutSheetRow(tryout: Awaited<ReturnType<typeof getTryoutWorkbookAdmin>>["tryout"]) {
  return {
    title: tryout.title,
    description: tryout.description,
    category_id: tryout.categoryId,
    duration_minutes: tryout.durationMinutes,
    access_level: tryout.accessLevel,
    status: tryout.status,
  };
}

function toQuestionSheetRow(question: Awaited<ReturnType<typeof getTryoutWorkbookAdmin>>["questions"][number]) {
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

function makeSampleTryoutRow() {
  return {
    title: "UKAI Try-out Sample",
    description: "Sample Try-out description. Replace this with the real Student-facing description.",
    category_id: "farmakologi",
    duration_minutes: 30,
    access_level: "free",
    status: "draft",
  };
}

function makeSampleQuestionRows() {
  return [
    {
      question_id: "",
      sort_order: 1,
      category_id: "farmakologi",
      sub_category_id: "farmakologi-antibiotik",
      question_text: "Mekanisme kerja penisilin adalah:",
      option_a: "Menghambat sintesis protein",
      option_b: "Menghambat sintesis dinding sel",
      option_c: "Menghambat replikasi DNA",
      option_d: "Menghambat sintesis folat",
      option_e: "",
      correct_option: "B",
      explanation: "Penisilin menghambat sintesis dinding sel bakteri dengan mengikat protein pengikat penisilin.",
      video_url: "",
      access_level: "free",
      status: "draft",
    },
    {
      question_id: "",
      sort_order: 2,
      category_id: "farmakologi",
      sub_category_id: "farmakologi-nsaid",
      question_text: "NSAID yang paling selektif terhadap COX-2:",
      option_a: "Ibuprofen",
      option_b: "Celecoxib",
      option_c: "Aspirin",
      option_d: "Diklofenak",
      option_e: "",
      correct_option: "B",
      explanation: "Celecoxib adalah NSAID selektif COX-2 yang menurunkan risiko gangguan gastrointestinal.",
      video_url: "",
      access_level: "free",
      status: "draft",
    },
  ];
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

function normalizeQuestionAccessLevel(value: unknown): QuestionAccessLevel {
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTimestamp(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}-${hours}-${minutes}`;
}
