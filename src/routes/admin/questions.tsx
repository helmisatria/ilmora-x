import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  createQuestionAdmin,
  listCategoryOptionsAdmin,
  listQuestionsAdmin,
  publishQuestionAdmin,
  unpublishQuestionAdmin,
  updateQuestionAdmin,
} from "../../lib/admin-functions";

type CategoryOption = Awaited<ReturnType<typeof listCategoryOptionsAdmin>>[number];
type QuestionRow = Awaited<ReturnType<typeof listQuestionsAdmin>>[number];
type AccessLevel = "free" | "premium";
type CorrectOption = "A" | "B" | "C" | "D" | "E";

type QuestionForm = {
  id: string;
  categoryId: string;
  subCategoryId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctOption: CorrectOption;
  explanation: string;
  videoUrl: string;
  accessLevel: AccessLevel;
};

const emptyForm: QuestionForm = {
  id: "",
  categoryId: "",
  subCategoryId: "",
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  optionE: "",
  correctOption: "A",
  explanation: "",
  videoUrl: "",
  accessLevel: "free",
};

const correctOptions: CorrectOption[] = ["A", "B", "C", "D", "E"];

export const Route = createFileRoute("/admin/questions")({
  loader: async () => {
    const [categories, questions] = await Promise.all([
      listCategoryOptionsAdmin(),
      listQuestionsAdmin(),
    ]);

    return { categories, questions };
  },
  head: () => ({
    meta: [
      { title: "Questions — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminQuestionsPage,
});

function AdminQuestionsPage() {
  const { categories, questions } = Route.useLoaderData() as {
    categories: CategoryOption[];
    questions: QuestionRow[];
  };
  const router = useRouter();
  const [form, setForm] = useState(() => createInitialForm(categories));
  const [busyAction, setBusyAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedSubCategories = useMemo(() => {
    return categories.find((category) => category.id === form.categoryId)?.subCategories ?? [];
  }, [categories, form.categoryId]);

  const isEditing = form.id.length > 0;

  const refresh = async () => {
    await router.invalidate();
  };

  const resetForm = () => {
    setForm(createInitialForm(categories));
    setErrorMessage("");
  };

  const updateCategory = (categoryId: string) => {
    const subCategoryId = categories.find((category) => category.id === categoryId)?.subCategories[0]?.id ?? "";

    setForm({
      ...form,
      categoryId,
      subCategoryId,
    });
  };

  const editQuestion = (question: QuestionRow) => {
    setForm({
      id: question.id,
      categoryId: question.categoryId,
      subCategoryId: question.subCategoryId,
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      optionE: question.optionE ?? "",
      correctOption: question.correctOption,
      explanation: question.explanation,
      videoUrl: question.videoUrl ?? "",
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

    setBusyAction("save");
    setErrorMessage("");

    const payload = toQuestionPayload(form);

    try {
      if (isEditing) {
        await updateQuestionAdmin({ data: { ...payload, questionId: form.id } });
      } else {
        await createQuestionAdmin({ data: payload });
      }

      resetForm();
      await refresh();
    } catch {
      setErrorMessage("Question was not saved. Check the selected taxonomy and required fields.");
    } finally {
      setBusyAction("");
    }
  };

  const setPublication = async (questionId: string, nextStatus: "published" | "unpublished") => {
    setBusyAction(`publish:${questionId}`);
    setErrorMessage("");

    try {
      if (nextStatus === "published") {
        await publishQuestionAdmin({ data: { questionId } });
      } else {
        await unpublishQuestionAdmin({ data: { questionId } });
      }

      await refresh();
    } catch {
      setErrorMessage("Question publication status was not updated.");
    } finally {
      setBusyAction("");
    }
  };

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane">
        <Header />

        {errorMessage && (
          <p className="admin-alert">
            {errorMessage}
          </p>
        )}

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">{isEditing ? "Edit Question" : "Create Question"}</h2>
          </div>

          <div className="grid gap-5 p-5 sm:p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Category">
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

              <Field label="Sub-category">
                <select
                  value={form.subCategoryId}
                  onChange={(event) => setForm({ ...form, subCategoryId: event.target.value })}
                  className="admin-control"
                >
                  {selectedSubCategories.map((subCategory) => (
                    <option key={subCategory.id} value={subCategory.id}>
                      {subCategory.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Question">
              <textarea
                value={form.questionText}
                onChange={(event) => setForm({ ...form, questionText: event.target.value })}
                className="admin-control min-h-28"
                placeholder="Write the Question exactly as Students should see it."
              />
            </Field>

            <div className="grid gap-5 md:grid-cols-2">
              <TextInput label="Option A" value={form.optionA} onChange={(optionA) => setForm({ ...form, optionA })} />
              <TextInput label="Option B" value={form.optionB} onChange={(optionB) => setForm({ ...form, optionB })} />
              <TextInput label="Option C" value={form.optionC} onChange={(optionC) => setForm({ ...form, optionC })} />
              <TextInput label="Option D" value={form.optionD} onChange={(optionD) => setForm({ ...form, optionD })} />
              <TextInput label="Option E" value={form.optionE} onChange={(optionE) => setForm({ ...form, optionE })} />

              <Field label="Correct option">
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

            <Field label="Explanation">
              <textarea
                value={form.explanation}
                onChange={(event) => setForm({ ...form, explanation: event.target.value })}
                className="admin-control min-h-28"
                placeholder="Explain why the answer is correct."
              />
            </Field>

            <div className="grid gap-5 md:grid-cols-2">
              <TextInput label="Video URL" value={form.videoUrl} onChange={(videoUrl) => setForm({ ...form, videoUrl })} />
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
                onClick={saveQuestion}
                disabled={busyAction === "save" || categories.length === 0}
                className="admin-button-primary"
                type="button"
              >
                {isEditing ? "Save changes" : "Create Question"}
              </button>
              {isEditing && (
                <button
                  onClick={resetForm}
                  className="admin-button-secondary"
                  type="button"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Question Bank</h2>
          </div>

          <div>
            {questions.map((question) => (
              <div key={question.id} className="admin-list-row">
                <div className="admin-list-content">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-[15px] font-bold text-stone-800 tracking-tight line-clamp-2">{question.questionText}</h3>
                    <StatusPill status={question.status} />
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="admin-meta-tag first:before:hidden">{question.categoryName}</span>
                    <span className="admin-meta-tag">{question.subCategoryName}</span>
                    <span className="admin-meta-tag">Correct {question.correctOption}</span>
                    <span className="admin-meta-tag capitalize">{question.accessLevel}</span>
                  </div>
                </div>

                <div className="admin-list-actions">
                  <p className="text-xs font-semibold text-stone-400 shrink-0">Updated {formatDate(question.updatedAt)}</p>
                  <div className="admin-list-actions-bar">
                    <button
                      onClick={() => editQuestion(question)}
                      className="admin-button-ghost"
                      type="button"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <PublicationButton
                      question={question}
                      busy={busyAction === `publish:${question.id}`}
                      onChange={setPublication}
                    />
                  </div>
                </div>
              </div>
            ))}

            {questions.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-stone-400">No Questions found yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="admin-header">
      <a href="/admin" className="admin-back-link">Admin</a>
      <h1 className="admin-title">Questions</h1>
      <p className="admin-description">
        Search, edit, publish, and unpublish Questions from the shared Question bank.
      </p>
    </header>
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
        Unpublish
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
      Publish
    </button>
  );
}

function StatusPill({ status }: { status: QuestionRow["status"] }) {
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

  return {
    ...emptyForm,
    categoryId: firstCategory?.id ?? "",
    subCategoryId: firstSubCategory?.id ?? "",
  };
}

function getQuestionValidationMessage(form: QuestionForm) {
  if (!form.categoryId || !form.subCategoryId) {
    return "Category and sub-category are required.";
  }

  if (!form.questionText.trim() || !form.explanation.trim()) {
    return "Question and explanation are required.";
  }

  if (!form.optionA.trim() || !form.optionB.trim() || !form.optionC.trim() || !form.optionD.trim()) {
    return "Options A, B, C, and D are required.";
  }

  if (form.correctOption === "E" && !form.optionE.trim()) {
    return "Option E is required when the correct option is E.";
  }

  return "";
}

function toQuestionPayload(form: QuestionForm) {
  return {
    categoryId: form.categoryId,
    subCategoryId: form.subCategoryId,
    questionText: form.questionText,
    optionA: form.optionA,
    optionB: form.optionB,
    optionC: form.optionC,
    optionD: form.optionD,
    optionE: form.optionE,
    correctOption: form.correctOption,
    explanation: form.explanation,
    videoUrl: form.videoUrl,
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
