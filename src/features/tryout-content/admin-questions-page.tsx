import { getSafeErrorMessage } from "../../lib/user-errors";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AdminPanelHeader } from "../../components/admin/AdminPanelHeader";
import { useUnsavedChangesGuard } from "../../components/admin/useUnsavedChangesGuard";
import {
  createQuestionAdmin,
  listQuestionsAdmin,
  publishQuestionAdmin,
  unpublishQuestionAdmin,
  updateQuestionAdmin,
} from "./admin-question-functions";
import { listCategoryOptionsAdmin } from "../admin/admin-taxonomy-functions";
import { QuestionEditor, type QuestionSaveMode } from "./question-editor";
import { isSameQuestion, makeNextQuestion, type QuestionEditorValues } from "./question-editor-form";

type CategoryOption = Awaited<ReturnType<typeof listCategoryOptionsAdmin>>[number];
type QuestionRow = Awaited<ReturnType<typeof listQuestionsAdmin>>[number];
type QuestionForm = QuestionEditorValues & {
  expectedUpdatedAt: string;
  id: string;
};

const emptyForm: QuestionForm = {
  expectedUpdatedAt: "",
  id: "",
  categoryId: "",
  subCategoryId: "",
  topicId: "",
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  optionE: "",
  correctOption: "A",
  explanation: "",
  videoUrl: "",
  pictureUrl: "",
  accessLevel: "free",
};

const ARRIVAL_EASING = "cubic-bezier(0.23, 1, 0.32, 1)";

export type AdminQuestionsPageData = {
  categories: CategoryOption[];
  questions: QuestionRow[];
};

export function AdminQuestionsPage({ categories, questions }: AdminQuestionsPageData) {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => setIsHydrated(true), []);
  const [form, setForm] = useState<QuestionForm>(() => createInitialForm(categories));
  const [savedForm, setSavedForm] = useState(form);
  // Remounts the editor so its validation and preview start fresh.
  const [editorKey, setEditorKey] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const bankRef = useRef<HTMLElement>(null);
  const arrivalRef = useRef<Animation | null>(null);
  const [busyAction, setBusyAction] = useState("");
  const [search, setSearch] = useState("");
  const filteredQuestions = questions.filter((question) => [question.questionText, question.categoryName, question.subCategoryName, question.topicName].join(" ").toLowerCase().includes(search.trim().toLowerCase()));
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTarget, setErrorTarget] = useState<"editor" | "bank">("editor");
  const isDirty = !isSameQuestion(form, savedForm);
  useUnsavedChangesGuard(isDirty);

  useEffect(() => () => arrivalRef.current?.cancel(), []);

  const isEditing = form.id.length > 0;

  const refresh = async () => {
    await router.invalidate();
  };

  const loadForm = (nextForm: QuestionForm) => {
    setForm(nextForm);
    setSavedForm(nextForm);
    setEditorKey((key) => key + 1);
    setErrorMessage("");
  };

  const resetForm = () => loadForm(createInitialForm(categories));

  // Jump straight to the panel, then play a short arrival cue so the jump stays easy to follow.
  // Keyboard activation (click detail 0) skips the cue to stay instant.
  const revealPanel = (panel: HTMLElement | null, viaKeyboard: boolean) => {
    if (!panel) return;

    arrivalRef.current?.cancel();
    arrivalRef.current = null;
    panel.scrollIntoView({ block: "start", behavior: "instant" });
    if (viaKeyboard || typeof panel.animate !== "function") return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    arrivalRef.current = panel.animate(
      reduceMotion
        ? [{ opacity: 0.6 }, { opacity: 1 }]
        : [{ opacity: 0.6, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: reduceMotion ? 120 : 200, easing: ARRIVAL_EASING },
    );
  };

  const focusEditor = (viaKeyboard: boolean) => {
    requestAnimationFrame(() => {
      editorRef.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus({ preventScroll: true });
      revealPanel(editorRef.current, viaKeyboard);
    });
  };

  const focusBank = (viaKeyboard: boolean) => {
    bankRef.current?.focus({ preventScroll: true });
    revealPanel(bankRef.current, viaKeyboard);
  };

  const canDiscardChanges = () => !isDirty || window.confirm("Buang perubahan soal yang belum disimpan?");

  const startNewQuestion = (viaKeyboard: boolean) => {
    if (!canDiscardChanges()) return;

    resetForm();
    setSuccessMessage("");
    focusEditor(viaKeyboard);
  };

  const editQuestion = (question: QuestionRow, viaKeyboard: boolean) => {
    if (!canDiscardChanges()) return;

    const nextForm: QuestionForm = {
      expectedUpdatedAt: question.updatedAt,
      id: question.id,
      categoryId: question.categoryId,
      subCategoryId: question.subCategoryId,
      topicId: question.topicId,
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      optionE: question.optionE ?? "",
      correctOption: question.correctOption,
      explanation: question.explanation,
      videoUrl: question.videoUrl ?? "",
      pictureUrl: question.pictureUrl ?? "",
      accessLevel: question.accessLevel,
    };
    loadForm(nextForm);
    setSuccessMessage("");
    focusEditor(viaKeyboard);
  };

  // The editor validates before calling this.
  const saveQuestion = async (mode: QuestionSaveMode) => {
    if (busyAction) return;

    setErrorTarget("editor");
    setSuccessMessage("");
    setBusyAction(mode);
    setErrorMessage("");

    const payload = toQuestionPayload(form);

    try {
      if (isEditing) {
        await updateQuestionAdmin({ data: { ...payload, questionId: form.id, expectedUpdatedAt: form.expectedUpdatedAt } });
      } else {
        await createQuestionAdmin({ data: payload });
      }

      await refresh();
      if (!isEditing) setSearch("");
      setSuccessMessage("Perubahan tersimpan.");

      if (mode === "save-next") {
        loadForm({ ...makeNextQuestion(form), expectedUpdatedAt: "", id: "" });
        focusEditor(true);
        return;
      }

      resetForm();
      focusBank(false);
    } catch (error) {
      setErrorMessage(getSafeErrorMessage(error, "Soal belum disimpan. Periksa kategori, subkategori, topik, dan isian wajib."));
    } finally {
      setBusyAction("");
    }
  };

  const setPublication = async (questionId: string, nextStatus: "published" | "unpublished") => {
    setErrorTarget("bank");
    setSuccessMessage("");
    setBusyAction(`publish:${questionId}`);
    setErrorMessage("");

    try {
      if (nextStatus === "published") {
        await publishQuestionAdmin({ data: { questionId, expectedUpdatedAt: questions.find((question) => question.id === questionId)!.updatedAt } });
      } else {
        await unpublishQuestionAdmin({ data: { questionId, expectedUpdatedAt: questions.find((question) => question.id === questionId)!.updatedAt } });
      }

      await refresh();
      setSuccessMessage("Perubahan tersimpan.");
    } catch (error) {
      setErrorMessage(getSafeErrorMessage(error, "Status soal belum berubah. Coba lagi."));
    } finally {
      setBusyAction("");
    }
  };

  return (
    <main className="admin-shell page-enter">
      <fieldset className="admin-lane min-w-0" disabled={!isHydrated || Boolean(busyAction)} data-admin-ready={isHydrated}>
        <Header />

        <section ref={bankRef} id="question-bank" tabIndex={-1} className="admin-panel mt-6 scroll-mt-20 sm:scroll-mt-6" aria-labelledby="question-bank-title">
          <AdminPanelHeader
            id="question-bank-title"
            title="Bank soal"
            badge={<span className="admin-count" aria-live="polite">{search.trim() ? `${filteredQuestions.length} / ${questions.length}` : questions.length}</span>}
            description="Cari teks soal, kategori, subkategori, atau topik."
            actions={
              <>
                <label className="relative block w-full sm:w-48 lg:w-64">
                  <span className="sr-only">Cari soal</span>
                  <SearchIcon />
                  <input type="search" className="admin-control pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Teks soal, kategori, atau topik" />
                </label>
                <button type="button" onClick={(event) => startNewQuestion(event.detail === 0)} className="admin-button-primary">Tambah soal</button>
              </>
            }
          />
          {successMessage && <p role="status" className="border-b border-stone-100 p-4 text-xs font-semibold text-emerald-700">{successMessage}</p>}
          {errorMessage && errorTarget === "bank" && <p role="alert" className="admin-alert mx-4 mb-3">{errorMessage}</p>}

          <div>
            {filteredQuestions.map((question) => (
              <div key={question.id} className={`admin-list-row flex flex-col gap-2 border-t border-stone-100 px-3 py-2.5 transition-colors duration-150 first:border-t-0 last:rounded-b-xl sm:flex-row sm:items-center sm:gap-3 sm:px-4 ${form.id === question.id ? "bg-primary-tint" : "hover:bg-stone-50/70"}`}>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-100 bg-stone-50 text-stone-500" aria-hidden="true">
                    <QuestionIcon />
                  </div>
                  <div className="admin-list-content">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="line-clamp-2 break-words text-[13.5px] font-bold leading-5 text-stone-800">{question.questionText}</h3>
                      <StatusPill status={question.status} />
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span className={`admin-meta-tag ${question.accessLevel === "free" ? "text-emerald-700" : "text-amber-700"}`}>{question.accessLevel === "free" ? "Gratis" : "Premium"}</span>
                      <span className="admin-meta-tag">{question.categoryName}</span>
                      <span className="admin-meta-tag">{question.subCategoryName}</span>
                      <span className="admin-meta-tag">{question.topicName}</span>
                      <span className="admin-meta-tag">Kunci {question.correctOption}</span>
                      <span className="admin-meta-tag">Diubah {formatDate(question.updatedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="admin-list-actions pl-12 sm:pl-0">
                  <div className="admin-list-actions-bar">
                    <button disabled={Boolean(busyAction)} onClick={(event) => editQuestion(question, event.detail === 0)} className="admin-button-ghost" type="button">
                      <PencilIcon className="h-3.5 w-3.5" />
                      Ubah
                    </button>
                    <PublicationButton question={question} busy={Boolean(busyAction)} onChange={setPublication} />
                  </div>
                </div>
              </div>
            ))}
            {filteredQuestions.length === 0 && (
              <div className="rounded-b-xl p-8 text-center">
                <p className="text-sm font-semibold text-stone-500">{questions.length === 0 ? "Belum ada soal. Tambahkan soal pertama lewat formulir." : "Tidak ada soal yang cocok. Coba kata lain."}</p>
                {search.trim() && <button type="button" onClick={() => setSearch("")} className="admin-button-ghost mt-3">Hapus pencarian</button>}
              </div>
            )}
          </div>
        </section>

        <div ref={editorRef} className="scroll-mt-20 sm:scroll-mt-6">
          <QuestionEditor
            key={editorKey}
            layout="panel"
            title={isEditing ? "Ubah soal" : "Buat soal"}
            description={isEditing
              ? "Perubahan berlaku untuk semua try-out yang memakai soal ini."
              : "Soal baru disimpan sebagai draf. Tayangkan saat soal siap digunakan."}
            headerActions={<a href="#question-bank" className="insights-link" onClick={(event) => {
              event.preventDefault();
              focusBank(event.detail === 0);
            }}>Kembali ke bank soal ↑</a>}
            values={form}
            initialValues={savedForm}
            categories={categories}
            saveLabel={isEditing ? "Simpan perubahan" : "Buat soal"}
            savingMode={busyAction === "save" || busyAction === "save-next" ? busyAction : null}
            busy={Boolean(busyAction)}
            serverMessage={errorTarget === "editor" ? errorMessage : ""}
            allowSaveAndNext={!isEditing}
            onChange={(values) => setForm({ ...form, ...values })}
            onSave={saveQuestion}
            onCancel={isEditing || isDirty ? () => {
              resetForm();
              focusBank(false);
            } : undefined}
            onPictureError={(message) => {
              setErrorTarget("editor");
              setErrorMessage(message);
            }}
          />
        </div>
      </fieldset>
    </main>
  );
}

function Header() {
  return (
    <header className="admin-header">
      <a href="/admin" className="admin-back-link">Admin</a>
      <h1 className="admin-title">Bank soal</h1>
      <p className="admin-description">
        Kelola soal yang dapat dipakai di beberapa try-out. Perubahan di bank soal berlaku untuk semua try-out yang memakai soal tersebut.
      </p>
    </header>
  );
}

function PublicationButton({
  question,
  busy,
  onChange,
}: {
  question: QuestionRow;
  busy: boolean;
  onChange: (questionId: string, nextStatus: "published" | "unpublished") => void;
}) {
  if (question.status === "published") {
    return (
      <button
        onClick={() => onChange(question.id, "unpublished")}
        disabled={busy}
        className="admin-button-ghost text-amber-600 hover:text-amber-700 hover:bg-amber-50"
        type="button"
      >
        <EyeOffIcon className="w-3.5 h-3.5" />
        Sembunyikan
      </button>
    );
  }

  return (
    <button
      onClick={() => onChange(question.id, "published")}
      disabled={busy}
      className="admin-button-success"
      type="button"
    >
      <EyeIcon className="w-3.5 h-3.5" />
      Tayangkan
    </button>
  );
}

function StatusPill({ status }: { status: QuestionRow["status"] }) {
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" fill="none" aria-hidden="true">
      <path d="m20 20-4.2-4.2M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 13h8M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function createInitialForm(categories: CategoryOption[]) {
  const firstCategory = categories[0];
  const firstSubCategory = firstCategory?.subCategories[0];
  const firstTopic = firstSubCategory?.topics?.[0];

  return {
    ...emptyForm,
    categoryId: firstCategory?.id ?? "",
    subCategoryId: firstSubCategory?.id ?? "",
    topicId: firstTopic?.id ?? "",
  };
}

function toQuestionPayload(form: QuestionForm) {
  return {
    categoryId: form.categoryId,
    subCategoryId: form.subCategoryId,
    topicId: form.topicId,
    questionText: form.questionText,
    optionA: form.optionA,
    optionB: form.optionB,
    optionC: form.optionC,
    optionD: form.optionD,
    optionE: form.optionE,
    correctOption: form.correctOption,
    explanation: form.explanation,
    videoUrl: form.videoUrl,
    pictureUrl: form.pictureUrl,
    accessLevel: form.accessLevel,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
