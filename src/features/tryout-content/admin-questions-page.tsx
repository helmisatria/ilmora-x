import { getSafeErrorMessage } from "../../lib/user-errors";
import { useRouter } from "@tanstack/react-router";
import { cloneElement, isValidElement, useEffect, useId, useMemo, useState } from "react";
import { QuestionPictureField } from "../../components/admin/QuestionPictureField";
import {
  createQuestionAdmin,
  listQuestionsAdmin,
  publishQuestionAdmin,
  unpublishQuestionAdmin,
  updateQuestionAdmin,
} from "./admin-question-functions";
import { listCategoryOptionsAdmin } from "../admin/admin-taxonomy-functions";

type CategoryOption = Awaited<ReturnType<typeof listCategoryOptionsAdmin>>[number];
type QuestionRow = Awaited<ReturnType<typeof listQuestionsAdmin>>[number];
type AccessLevel = "free" | "premium";
type CorrectOption = "A" | "B" | "C" | "D" | "E";

type QuestionForm = {
  expectedUpdatedAt: string;
  id: string;
  categoryId: string;
  subCategoryId: string;
  topicId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctOption: CorrectOption;
  explanation: string;
  videoUrl: string;
  pictureUrl: string;
  accessLevel: AccessLevel;
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

const correctOptions: CorrectOption[] = ["A", "B", "C", "D", "E"];

export type AdminQuestionsPageData = {
  categories: CategoryOption[];
  questions: QuestionRow[];
};

export function AdminQuestionsPage({ categories, questions }: AdminQuestionsPageData) {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => setIsHydrated(true), []);
  const [form, setForm] = useState(() => createInitialForm(categories));
  const [busyAction, setBusyAction] = useState("");
  const [search, setSearch] = useState("");
  const filteredQuestions = questions.filter((question) => [question.questionText, question.categoryName, question.subCategoryName, question.topicName].join(" ").toLowerCase().includes(search.trim().toLowerCase()));
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedSubCategories = useMemo(() => {
    return categories.find((category) => category.id === form.categoryId)?.subCategories ?? [];
  }, [categories, form.categoryId]);
  const selectedTopics = useMemo(() => {
    return selectedSubCategories.find((subCategory) => subCategory.id === form.subCategoryId)?.topics ?? [];
  }, [selectedSubCategories, form.subCategoryId]);

  const isEditing = form.id.length > 0;

  const refresh = async () => {
    await router.invalidate();
  };

  const resetForm = () => {
    setForm(createInitialForm(categories));
    setErrorMessage("");
  };

  const updateCategory = (categoryId: string) => {
    const subCategory = categories.find((category) => category.id === categoryId)?.subCategories[0];

    setForm({
      ...form,
      categoryId,
      subCategoryId: subCategory?.id ?? "",
      topicId: subCategory?.topics?.[0]?.id ?? "",
    });
  };

  const updateSubCategory = (subCategoryId: string) => {
    const topicId = selectedSubCategories.find((subCategory) => subCategory.id === subCategoryId)?.topics?.[0]?.id ?? "";

    setForm({
      ...form,
      subCategoryId,
      topicId,
    });
  };

  const editQuestion = (question: QuestionRow) => {
    setForm({
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
    });
    setErrorMessage("");
  };

  const saveQuestion = async () => {
    const validationMessage = getQuestionValidationMessage(form);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setSuccessMessage("");
    setBusyAction("save");
    setErrorMessage("");

    const payload = toQuestionPayload(form);

    try {
      if (isEditing) {
        await updateQuestionAdmin({ data: { ...payload, questionId: form.id, expectedUpdatedAt: form.expectedUpdatedAt } });
      } else {
        await createQuestionAdmin({ data: payload });
      }

      resetForm();
      await refresh();
      setSuccessMessage("Perubahan tersimpan.");
    } catch (error) {
      setErrorMessage(getSafeErrorMessage(error, "Soal belum disimpan. Periksa kategori, subkategori, topik, dan isian wajib."));
    } finally {
      setBusyAction("");
    }
  };

  const setPublication = async (questionId: string, nextStatus: "published" | "unpublished") => {
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

        {successMessage && <p role="status" className="mt-4 text-sm text-emerald-700">{successMessage}</p>}
        {errorMessage && (
          <p role="alert" className="admin-alert">
            {errorMessage}
          </p>
        )}

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">{isEditing ? "Ubah soal" : "Buat soal"}</h2>
          </div>

          <div className="grid gap-5 p-5 sm:p-6">
            <p className="text-sm text-stone-600">Jika daftar kategori, subkategori, atau topik kosong, <a href="/admin/categories" className="underline">tambahkan di halaman Kategori</a> lebih dulu.</p>
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Kategori">
                <select
                  value={form.categoryId}
                  onChange={(event) => updateCategory(event.target.value)}
                  className="admin-control"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Subkategori">
                <select
                  value={form.subCategoryId}
                  onChange={(event) => updateSubCategory(event.target.value)}
                  className="admin-control"
                >
                  {selectedSubCategories.map((subCategory) => (
                    <option key={subCategory.id} value={subCategory.id}>
                      {subCategory.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Topik">
                <select
                  value={form.topicId}
                  onChange={(event) => setForm({ ...form, topicId: event.target.value })}
                  className="admin-control"
                >
                  {selectedTopics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Teks soal">
              <textarea
                value={form.questionText}
                onChange={(event) => setForm({ ...form, questionText: event.target.value })}
                className="admin-control min-h-28"
                placeholder="Tulis soal seperti yang akan dibaca peserta."
              />
            </Field>

            <div className="grid gap-5 md:grid-cols-2">
              <TextInput label="Pilihan A" value={form.optionA} onChange={(optionA) => setForm({ ...form, optionA })} />
              <TextInput label="Pilihan B" value={form.optionB} onChange={(optionB) => setForm({ ...form, optionB })} />
              <TextInput label="Pilihan C" value={form.optionC} onChange={(optionC) => setForm({ ...form, optionC })} />
              <TextInput label="Pilihan D" value={form.optionD} onChange={(optionD) => setForm({ ...form, optionD })} />
              <TextInput label="Pilihan E, opsional" value={form.optionE} onChange={(optionE) => setForm({ ...form, optionE })} />

              <Field label="Kunci jawaban">
                <select
                  value={form.correctOption}
                  onChange={(event) => setForm({ ...form, correctOption: event.target.value as CorrectOption })}
                  className="admin-control"
                >
                  {correctOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Pembahasan">
              <textarea
                value={form.explanation}
                onChange={(event) => setForm({ ...form, explanation: event.target.value })}
                className="admin-control min-h-28"
                placeholder="Jelaskan alasan jawaban benar agar peserta dapat belajar."
              />
            </Field>

            <div className="grid gap-5 md:grid-cols-2">
              <TextInput label="Tautan video pembahasan, opsional" value={form.videoUrl} onChange={(videoUrl) => setForm({ ...form, videoUrl })} />
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

            <QuestionPictureField
              value={form.pictureUrl}
              busy={Boolean(busyAction)}
              onChange={(pictureUrl) => setForm({ ...form, pictureUrl })}
              onError={setErrorMessage}
            />

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={saveQuestion}
                disabled={Boolean(busyAction)}
                className="admin-button-primary"
                type="button"
              >
                {isEditing ? "Simpan perubahan" : "Buat soal"}
              </button>
              {isEditing && (
                <button
                  disabled={Boolean(busyAction)}
                  onClick={resetForm}
                  className="admin-button-secondary"
                  type="button"
                >
                  Batal
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Bank soal</h2>
            <label>Cari soal<input className="admin-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Teks soal, kategori, atau topik" /></label>
          </div>

          <div>
            {filteredQuestions.map((question) => (
              <div key={question.id} className="admin-list-row">
                <div className="admin-list-content">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-[15px] font-bold text-stone-800 tracking-tight line-clamp-2">{question.questionText}</h3>
                    <StatusPill status={question.status} />
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="admin-meta-tag first:before:hidden">{question.categoryName}</span>
                    <span className="admin-meta-tag">{question.subCategoryName}</span>
                    <span className="admin-meta-tag">{question.topicName}</span>
                    <span className="admin-meta-tag">Kunci {question.correctOption}</span>
                    <span className="admin-meta-tag capitalize">{question.accessLevel === "free" ? "Gratis" : "Premium"}</span>
                  </div>
                </div>

                <div className="admin-list-actions">
                  <p className="text-xs font-semibold text-stone-400 shrink-0">Diubah {formatDate(question.updatedAt)}</p>
                  <div className="admin-list-actions-bar">
                    <button
                      disabled={Boolean(busyAction)}
                      onClick={() => editQuestion(question)}
                      className="admin-button-ghost"
                      type="button"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                      Ubah
                    </button>
                    <PublicationButton
                      question={question}
                      busy={Boolean(busyAction)}
                      onChange={setPublication}
                    />
                  </div>
                </div>
              </div>
            ))}

            {filteredQuestions.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-stone-400">{questions.length === 0 ? "Belum ada soal. Isi formulir untuk membuat soal pertama." : "Tidak ada soal yang cocok. Coba kata lain."}</p>
              </div>
            )}
          </div>
        </section>
      </fieldset>
    </main>
  );
}

function Header() {
  return (
    <header className="admin-header">
      <a href="/admin" className="admin-back-link">Admin</a>
      <h1 className="admin-title">Soal</h1>
      <p className="admin-description">
        Kelola soal yang dapat dipakai di beberapa try-out. Perubahan di bank soal berlaku untuk semua try-out yang memakai soal tersebut.
      </p>
    </header>
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

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="admin-control"
      />
    </Field>
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

function getQuestionValidationMessage(form: QuestionForm) {
  if (!form.categoryId || !form.subCategoryId || !form.topicId) {
    return "Pilih kategori, subkategori, dan topik.";
  }

  if (!form.questionText.trim() || !form.explanation.trim()) {
    return "Isi teks soal dan pembahasan.";
  }

  if (!form.optionA.trim() || !form.optionB.trim() || !form.optionC.trim() || !form.optionD.trim()) {
    return "Isi pilihan jawaban A, B, C, dan D.";
  }

  if (form.correctOption === "E" && !form.optionE.trim()) {
    return "Isi pilihan E karena kunci jawaban adalah E.";
  }

  return "";
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
