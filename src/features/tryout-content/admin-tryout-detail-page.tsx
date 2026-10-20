import { useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminPanelHeader } from "../../components/admin/AdminPanelHeader";
import { useUnsavedChangesGuard } from "../../components/admin/useUnsavedChangesGuard";
import { TryoutIcon } from "../../components/TryoutIcon";
import { getSafeErrorMessage } from "../../lib/user-errors";
import { FileUpload, WorkbookPreviewPanel, type WorkbookPreview } from "../../components/admin/TryoutWorkbookImport";
import {
  getTryoutWorkbookAdmin,
  addTryoutQuestionAdmin,
  importTryoutWorkbookAdmin,
  publishTryoutAdmin,
  removeTryoutQuestionAdmin,
  unpublishTryoutAdmin,
  updateTryoutQuestionAdmin,
  updateTryoutAdmin,
} from "./admin-tryout-functions";
import { listCategoryOptionsAdmin } from "../admin/admin-taxonomy-functions";
import { QuestionEditor, type QuestionSaveMode } from "./question-editor";
import {
  getNextSortOrder,
  getServerFieldError,
  isSameQuestion,
  makeNextQuestion,
  type ContentStatus,
  type QuestionEditorValues,
  type QuestionFieldErrors,
} from "./question-editor-form";
import { getTryoutServerFieldError, validateTryoutDetails, type TryoutDetailsErrors, type TryoutDetailsValues } from "./tryout-details-form";
import { TryoutDetailsFields } from "./tryout-details-fields";
import * as tryoutWorkbook from "./tryout-workbook";
import * as tryoutWorkbookSheets from "./tryout-workbook-sheets";

type TryoutWorkbook = Awaited<ReturnType<typeof getTryoutWorkbookAdmin>>;
type TryoutQuestion = TryoutWorkbook["questions"][number];
type CategoryRow = Awaited<ReturnType<typeof listCategoryOptionsAdmin>>[number];

type TryoutForm = TryoutDetailsValues & { expectedUpdatedAt: string };

type QuestionDraft = {
  // Remounts the editor so focus and validation start fresh.
  key: number;
  questionId: string;
  expectedUpdatedAt: string;
  values: QuestionEditorValues;
  initialValues: QuestionEditorValues;
};

const discardQuestionMessage = "Buang perubahan soal yang belum disimpan?";

export type AdminTryoutDetailPageData = {
  workbook: TryoutWorkbook;
  categories: CategoryRow[];
};

function toTryoutForm(tryout: TryoutWorkbook["tryout"]): TryoutForm {
  return {
    expectedUpdatedAt: tryout.updatedAt,
    title: tryout.title,
    description: tryout.description,
    icon: tryout.icon ?? "",
    categoryId: tryout.categoryId,
    durationMinutes: String(tryout.durationMinutes),
    accessLevel: tryout.accessLevel,
  };
}

function toQuestionValues(question: TryoutQuestion): QuestionEditorValues {
  return {
    sortOrder: String(question.sortOrder),
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
    status: question.status,
  };
}

export function AdminTryoutDetailPage({ workbook, categories }: AdminTryoutDetailPageData) {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => setIsHydrated(true), []);
  const tryoutId = workbook.tryout.id;

  const [form, setForm] = useState<TryoutForm>(() => toTryoutForm(workbook.tryout));
  const [showDetailsValidation, setShowDetailsValidation] = useState(false);
  const [detailsServerErrors, setDetailsServerErrors] = useState<TryoutDetailsErrors>({});
  const [busyAction, setBusyAction] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewRevision, setPreviewRevision] = useState("");
  const [workbookPreview, setWorkbookPreview] = useState<WorkbookPreview | null>(null);
  const [questionDraft, setQuestionDraft] = useState<QuestionDraft | null>(null);
  const [questionServerErrors, setQuestionServerErrors] = useState<QuestionFieldErrors>({});
  const [nextQuestion, setNextQuestion] = useState<{ saved: QuestionEditorValues; savedFromRevision: string } | null>(null);
  const [questionSearch, setQuestionSearch] = useState("");
  const draftKey = useRef(0);
  useEffect(() => {
    setForm(toTryoutForm(workbook.tryout));
  }, [workbook.tryout.id, workbook.tryout.title, workbook.tryout.description, workbook.tryout.icon,
    workbook.tryout.categoryId, workbook.tryout.durationMinutes, workbook.tryout.accessLevel, workbook.tryout.updatedAt]);
  useEffect(() => {
    if (!successMessage) return;

    const timeout = window.setTimeout(() => setSuccessMessage(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);
  useEffect(() => {
    if (questionDraft) document.getElementById("question-editor")?.scrollIntoView({ block: "start" });
  }, [questionDraft?.key]);
  // "Simpan & tambah lagi" opens the next blank question only after the
  // refreshed workbook arrives, so it carries the latest revision and number.
  useEffect(() => {
    if (!nextQuestion || workbook.tryout.updatedAt === nextQuestion.savedFromRevision) return;

    openQuestion("", makeNextQuestion(nextQuestion.saved, getNextSortOrder(workbook.questions.map((item) => item.sortOrder))));
    setNextQuestion(null);
  }, [nextQuestion, workbook.tryout.updatedAt]);
  const { categoryNames, subCategoryNames, topicNames } = useMemo(() => {
    const subCategories = categories.flatMap((category) => category.subCategories);

    return {
      categoryNames: new Map(categories.map((category) => [category.id, category.name])),
      subCategoryNames: new Map(subCategories.map((subCategory) => [subCategory.id, subCategory.name])),
      topicNames: new Map(subCategories.flatMap((subCategory) => subCategory.topics).map((topic) => [topic.id, topic.name])),
    };
  }, [categories]);
  const publishedQuestionCount = workbook.questions.filter((question) => question.status === "published").length;

  const detailsValidation = validateTryoutDetails(form);
  const detailsErrors: TryoutDetailsErrors = { ...(showDetailsValidation ? detailsValidation.errors : {}), ...detailsServerErrors };
  const hasChanges =
    form.title !== workbook.tryout.title ||
    form.description !== workbook.tryout.description ||
    form.icon !== (workbook.tryout.icon ?? "") ||
    form.categoryId !== workbook.tryout.categoryId ||
    form.durationMinutes.trim() !== String(workbook.tryout.durationMinutes) ||
    form.accessLevel !== workbook.tryout.accessLevel;
  const isQuestionDirty = Boolean(questionDraft && !isSameQuestion(questionDraft.values, questionDraft.initialValues));
  useUnsavedChangesGuard(hasChanges || isQuestionDirty);

  const refresh = async () => {
    await router.invalidate();
  };

  const updateForm = (patch: Partial<TryoutDetailsValues>) => {
    setForm({ ...form, ...patch });
    setDetailsServerErrors({});
  };

  const focusDetailsField = (field: string) => {
    const control = document.querySelector<HTMLElement>(`#details [data-field="${field}"]`);
    control?.focus({ preventScroll: true });
    control?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const saveTryout = async () => {
    if (busyAction) return;

    if (detailsValidation.firstInvalidField) {
      setShowDetailsValidation(true);
      setErrorMessage(detailsValidation.summary);
      focusDetailsField(detailsValidation.firstInvalidField);
      return;
    }

    setSuccessMessage("");
    setBusyAction("save");
    setErrorMessage("");

    try {
      await updateTryoutAdmin({
        data: {
          expectedUpdatedAt: form.expectedUpdatedAt,
          title: form.title,
          description: form.description,
          icon: form.icon,
          categoryId: form.categoryId,
          durationMinutes: Number(form.durationMinutes),
          accessLevel: form.accessLevel,
          tryoutId,
        },
      });
      await refresh();
      setShowDetailsValidation(false);
      setSuccessMessage("Perubahan tersimpan.");
    } catch (error) {
      const message = getSafeErrorMessage(error, "Perubahan belum disimpan. Periksa isian lalu coba lagi.");
      setErrorMessage(message);
      setDetailsServerErrors(getTryoutServerFieldError(message));
    } finally {
      setBusyAction("");
    }
  };

  const setPublication = async (nextStatus: "published" | "unpublished") => {
    if (nextStatus === "published" && publishedQuestionCount === 0) {
      setErrorMessage("Tayangkan minimal satu soal sebelum menayangkan try-out ini.");
      return;
    }

    setSuccessMessage("");
    setBusyAction("publish");
    setErrorMessage("");

    try {
      if (nextStatus === "published") {
        await publishTryoutAdmin({ data: { tryoutId, expectedUpdatedAt: workbook.tryout.updatedAt } });
      } else {
        await unpublishTryoutAdmin({ data: { tryoutId, expectedUpdatedAt: workbook.tryout.updatedAt } });
      }
      await refresh();
      setSuccessMessage("Perubahan tersimpan.");
    } catch (error) {
      setErrorMessage(getSafeErrorMessage(error, "Status belum berubah. Coba lagi."));
    } finally {
      setBusyAction("");
    }
  };

  const canLeaveQuestion = () => !isQuestionDirty || window.confirm(discardQuestionMessage);

  const openQuestion = (questionId: string, values: QuestionEditorValues) => {
    draftKey.current += 1;
    setQuestionDraft({
      key: draftKey.current,
      questionId,
      expectedUpdatedAt: workbook.tryout.updatedAt,
      values,
      initialValues: values,
    });
    setQuestionServerErrors({});
    setErrorMessage("");
  };

  const closeQuestion = () => {
    setQuestionDraft(null);
    setQuestionServerErrors({});
    setErrorMessage("");
  };

  const addQuestion = () => {
    if (!canLeaveQuestion()) return;

    const category = categories.find((item) => item.id === form.categoryId) ?? categories[0];
    const subCategory = category?.subCategories[0];
    openQuestion("", {
      sortOrder: String(getNextSortOrder(workbook.questions.map((item) => item.sortOrder))),
      categoryId: category?.id ?? "", subCategoryId: subCategory?.id ?? "", topicId: subCategory?.topics?.[0]?.id ?? "",
      questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", optionE: "", correctOption: "A",
      explanation: "", videoUrl: "", pictureUrl: "", accessLevel: "free", status: "draft",
    });
  };

  const editQuestion = (question: TryoutQuestion) => {
    if (!canLeaveQuestion()) return;

    openQuestion(question.questionId, toQuestionValues(question));
  };

  const saveQuestion = async (mode: QuestionSaveMode) => {
    if (!questionDraft || busyAction) return;

    const { values } = questionDraft;
    setSuccessMessage("");
    setBusyAction(`question-${mode}`);
    setErrorMessage("");
    setQuestionServerErrors({});

    try {
      const save = questionDraft.questionId ? updateTryoutQuestionAdmin : addTryoutQuestionAdmin;
      await save({
        data: {
          tryoutId,
          questionId: questionDraft.questionId,
          expectedUpdatedAt: questionDraft.expectedUpdatedAt,
          sortOrder: Number(values.sortOrder),
          categoryId: values.categoryId,
          subCategoryId: values.subCategoryId,
          topicId: values.topicId,
          questionText: values.questionText,
          optionA: values.optionA,
          optionB: values.optionB,
          optionC: values.optionC,
          optionD: values.optionD,
          optionE: values.optionE,
          correctOption: values.correctOption,
          explanation: values.explanation,
          videoUrl: values.videoUrl,
          pictureUrl: values.pictureUrl,
          accessLevel: values.accessLevel,
          status: values.status ?? "draft",
        },
      });

      setQuestionDraft(null);
      if (mode === "save-next") setNextQuestion({ saved: values, savedFromRevision: workbook.tryout.updatedAt });
      await refresh();
      setSuccessMessage("Perubahan tersimpan.");
    } catch (error) {
      const message = getSafeErrorMessage(error, "Soal belum disimpan. Periksa nomor urut dan isian.");
      setErrorMessage(message);
      setQuestionServerErrors(getServerFieldError(message));
    } finally {
      setBusyAction("");
    }
  };

  const deleteQuestion = async (question: TryoutQuestion) => {
    const confirmed = window.confirm("Keluarkan soal ini dari try-out? Soal tetap ada di bank soal. Riwayat jawaban peserta tetap tersimpan.");

    if (!confirmed) return;

    setSuccessMessage("");
    setBusyAction(`question-delete:${question.questionId}`);
    setErrorMessage("");

    try {
      await removeTryoutQuestionAdmin({
        data: {
          tryoutId,
          questionId: question.questionId,
          expectedUpdatedAt: workbook.tryout.updatedAt,
        },
      });

      if (questionDraft?.questionId === question.questionId) {
        setQuestionDraft(null);
      }

      await refresh();
      setSuccessMessage("Perubahan tersimpan.");
    } catch (error) {
      setErrorMessage(getSafeErrorMessage(error, "Soal belum dikeluarkan. Coba lagi."));
    } finally {
      setBusyAction("");
    }
  };

  const downloadWorkbook = async () => {
    setSuccessMessage("");
    setBusyAction("download");
    setErrorMessage("");

    try {
      const latestCategories = await listCategoryOptionsAdmin();
      const XLSX = await import("xlsx");
      const latestWorkbook = await getTryoutWorkbookAdmin({ data: { tryoutId } });
      const exportedWorkbook = tryoutWorkbookSheets.makeTryoutWorkbook(XLSX, latestWorkbook, latestCategories);
      const fileName = tryoutWorkbookSheets.makeTryoutWorkbookFileName(workbook.tryout.slug, new Date());

      tryoutWorkbookSheets.saveWorkbook(XLSX, exportedWorkbook, fileName);
    } catch {
      setErrorMessage("File Excel belum terunduh. Coba lagi.");
    } finally {
      setBusyAction("");
    }
  };

  const importWorkbook = async (file: File | undefined) => {
    if (!file) return;

    setWorkbookPreview(null);
    setPreviewRevision(workbook.tryout.updatedAt);
    setSuccessMessage("");
    setBusyAction("preview-import");
    setErrorMessage("");

    try {
      const result = await tryoutWorkbook.readTryoutWorkbook(file, categories, workbook.tryout);

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

  const confirmWorkbookImport = async () => {
    if (!workbookPreview?.data || workbookPreview.issues.length > 0) return;

    setSuccessMessage("");
    setBusyAction("import");
    setErrorMessage("");

    try {
      await importTryoutWorkbookAdmin({
        data: {
          tryoutId,
          expectedUpdatedAt: previewRevision,
          source: workbookPreview.data.source,
          tryout: workbookPreview.data.tryout,
          questions: workbookPreview.data.questions,
        },
      });
      setQuestionDraft(null);
      setWorkbookPreview(null);
      await refresh();
      setSuccessMessage("Perubahan tersimpan.");
    } catch (error) {
      setErrorMessage(getSafeErrorMessage(error, "Excel belum disimpan. Periksa isian lalu coba lagi."));
    } finally {
      setBusyAction("");
    }
  };

  const resetTryoutForm = () => {
    setForm(toTryoutForm(workbook.tryout));
    setShowDetailsValidation(false);
    setDetailsServerErrors({});
    setErrorMessage("");
  };

  const isPublished = workbook.tryout.status === "published";
  const tryoutCategory = categories.find((category) => category.id === workbook.tryout.categoryId);
  const accent = tryoutCategory?.color ?? "#205072";
  const draftQuestionCount = workbook.questions.filter((question) => question.status === "draft").length;
  const hiddenQuestionCount = workbook.questions.filter((question) => question.status === "unpublished").length;
  const normalizedSearch = questionSearch.trim().toLowerCase();
  const visibleQuestions = normalizedSearch
    ? workbook.questions.filter((question) =>
        `${question.questionText} ${question.explanation}`.toLowerCase().includes(normalizedSearch))
    : workbook.questions;
  const isNewQuestion = Boolean(questionDraft && !questionDraft.questionId);
  const showPageError = Boolean(errorMessage) && !workbookPreview && !questionDraft;
  const publishHint = getPublishHint({ isPublished, hasChanges, publishedQuestionCount });

  const questionEditor = questionDraft && (
    <QuestionEditor
      key={questionDraft.key}
      layout="inline"
      title={questionDraft.questionId ? `Ubah soal nomor ${questionDraft.initialValues.sortOrder}` : "Soal baru"}
      values={questionDraft.values}
      initialValues={questionDraft.initialValues}
      categories={categories}
      saveLabel="Simpan soal"
      savingMode={busyAction === "question-save" ? "save" : busyAction === "question-save-next" ? "save-next" : null}
      busy={Boolean(busyAction)}
      serverMessage={errorMessage}
      serverFieldErrors={questionServerErrors}
      autoFocus
      allowSaveAndNext={!questionDraft.questionId}
      onChange={(values) => {
        setQuestionDraft({ ...questionDraft, values });
        setQuestionServerErrors({});
      }}
      onSave={saveQuestion}
      onCancel={closeQuestion}
      onPictureError={setErrorMessage}
    />
  );

  return (
    <main className="admin-shell page-enter">
      <fieldset className="admin-lane min-w-0" disabled={!isHydrated || Boolean(busyAction)} data-admin-ready={isHydrated}>
        <header className="admin-header flex flex-col gap-4 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <a href="/admin/tryouts" className="admin-back-link">Try-out</a>
            <div className="mt-2 flex min-w-0 items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
                style={{ color: accent, background: `${accent}14`, borderColor: `${accent}26` }}
                aria-hidden="true"
              >
                <TryoutIcon icon={workbook.tryout.icon} tryoutId={tryoutId} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <h1 className="admin-title min-w-0 break-words">{workbook.tryout.title}</h1>
                  <StatusPill status={workbook.tryout.status} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span className={`admin-meta-tag ${workbook.tryout.accessLevel === "free" ? "text-emerald-700" : "text-amber-700"}`}>
                    {workbook.tryout.accessLevel === "free" ? "Gratis" : "Premium"}
                  </span>
                  <span className="admin-meta-tag">{tryoutCategory?.name ?? workbook.tryout.categoryId}</span>
                  <span className="admin-meta-tag">{workbook.tryout.durationMinutes} menit</span>
                  <span className="admin-meta-tag">{workbook.questions.length} soal</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-1.5 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <a href="#details" className="admin-button-secondary">
                <PencilIcon className="h-3.5 w-3.5" />
                Ubah detail
              </a>
              {isPublished ? (
                <button
                  onClick={() => setPublication("unpublished")}
                  disabled={Boolean(busyAction)}
                  className="admin-button-secondary text-amber-700 hover:border-amber-200 hover:bg-amber-50"
                  type="button"
                >
                  <EyeOffIcon className="h-3.5 w-3.5" />
                  Sembunyikan
                </button>
              ) : (
                <button
                  onClick={() => setPublication("published")}
                  disabled={Boolean(busyAction) || hasChanges}
                  className="admin-button-success"
                  type="button"
                >
                  <EyeIcon className="h-3.5 w-3.5" />
                  Tayangkan
                </button>
              )}
            </div>
            <p className={`text-xs font-medium ${publishHint.tone === "warning" ? "text-amber-700" : "text-stone-500"}`}>{publishHint.text}</p>
          </div>
        </header>

        <section className="admin-panel mt-6" aria-labelledby="questions-title">
          <AdminPanelHeader
            id="questions-title"
            title="Soal"
            badge={<span className="admin-count">{workbook.questions.length}</span>}
            description={
              workbook.questions.length === 0
                ? "Peserta hanya mengerjakan soal berstatus Tayang."
                : `${publishedQuestionCount} tayang, ${draftQuestionCount} draf, ${hiddenQuestionCount} disembunyikan. Peserta hanya mengerjakan soal Tayang.`
            }
            actions={
              <>
                {workbook.questions.length > 0 && (
                  <label className="relative block w-full sm:w-56">
                    <span className="sr-only">Cari soal</span>
                    <SearchIcon />
                    <input
                      type="search"
                      className="admin-control pl-9"
                      value={questionSearch}
                      onChange={(event) => setQuestionSearch(event.target.value)}
                      placeholder="Cari teks soal"
                    />
                  </label>
                )}
                <button type="button" className="admin-button-primary" onClick={addQuestion} disabled={Boolean(busyAction)}>
                  <PlusIcon className="h-3.5 w-3.5" />
                  Tambah soal
                </button>
              </>
            }
          />

          <div>
            {isNewQuestion && questionEditor}

            {workbook.questions.length === 0 && !isNewQuestion && (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-bold text-stone-700">Belum ada soal</p>
                <p className="mx-auto mt-1 max-w-sm text-xs font-medium text-stone-500">
                  Tambah soal satu per satu, atau <a href="#excel" className="font-bold text-primary underline">unggah Excel</a> untuk banyak soal sekaligus.
                </p>
                <button type="button" className="admin-button-primary mt-4" onClick={addQuestion} disabled={Boolean(busyAction)}>
                  <PlusIcon className="h-3.5 w-3.5" />
                  Tambah soal pertama
                </button>
              </div>
            )}

            {workbook.questions.length > 0 && visibleQuestions.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-semibold text-stone-500">Tidak ada soal yang cocok dengan "{questionSearch.trim()}".</p>
                <button type="button" className="admin-button-ghost mt-2" onClick={() => setQuestionSearch("")}>
                  Hapus pencarian
                </button>
              </div>
            )}

            {visibleQuestions.map((question, index) => {
              if (questionDraft?.questionId && questionDraft.questionId === question.questionId) {
                return <div key={question.questionId}>{questionEditor}</div>;
              }

              return (
                <div
                  key={question.questionId ?? `q-${index}`}
                  className="admin-list-row flex flex-col gap-2 border-t border-stone-100 px-3 py-3 first:border-t-0 last:rounded-b-xl sm:flex-row sm:items-start sm:gap-3 sm:px-4"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xs font-bold tabular-nums text-stone-500">
                      {question.sortOrder}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-stone-800">{question.questionText}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <StatusPill status={question.status} />
                        <span className={`admin-meta-tag first:before:hidden ${question.accessLevel === "free" ? "text-emerald-700" : "text-amber-700"}`}>
                          {question.accessLevel === "free" ? "Gratis" : "Premium"}
                        </span>
                        <span className="admin-meta-tag font-bold text-stone-700">Kunci jawaban: {question.correctOption}</span>
                        <span className="admin-meta-tag min-w-0 max-w-full">
                          <span className="truncate">{[
                            categoryNames.get(question.categoryId) ?? question.categoryId,
                            subCategoryNames.get(question.subCategoryId) ?? question.subCategoryId,
                            topicNames.get(question.topicId) ?? question.topicId,
                          ].join(" / ")}</span>
                        </span>
                      </div>
                      {question.explanation && (
                        <p className="mt-1 line-clamp-1 text-xs text-stone-400">
                          <span className="font-semibold text-stone-500">Pembahasan:</span> {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="admin-list-actions-bar shrink-0 pl-10 sm:pl-0">
                    <button
                      disabled={Boolean(busyAction)}
                      onClick={() => editQuestion(question)}
                      className="admin-button-ghost"
                      type="button"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                      Ubah
                    </button>
                    <button
                      onClick={() => deleteQuestion(question)}
                      disabled={Boolean(busyAction)}
                      className="admin-button-ghost text-red-600 hover:bg-red-50 hover:text-red-700"
                      type="button"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      Keluarkan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="excel" className="admin-panel mt-6 scroll-mt-4" aria-labelledby="excel-title">
          <AdminPanelHeader
            id="excel-title"
            title="Kelola lewat Excel"
            description="Unduh Excel terbaru, ubah soalnya, lalu unggah. Kamu bisa cek pratinjau sebelum menyimpan."
          />
          <div className="grid gap-3 p-4">
            <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
              <button
                onClick={downloadWorkbook}
                disabled={Boolean(busyAction)}
                className="admin-button-secondary"
                type="button"
              >
                <DownloadIcon className="h-4 w-4" />
                Unduh Excel
              </button>
              <FileUpload
                accept=".xlsx"
                busy={Boolean(busyAction)}
                placeholder="Unggah Excel"
                dropHint="atau seret file ke sini"
                onFileSelect={(file) => importWorkbook(file)}
              />
            </div>
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Excel mengganti seluruh daftar soal try-out ini. Soal yang tidak ada di Excel keluar dari try-out. Riwayat peserta tetap tersimpan.
            </p>
          </div>
        </section>

        {workbookPreview && (
          <WorkbookPreviewPanel
            preview={workbookPreview}
            busy={Boolean(busyAction)}
            errorMessage={errorMessage}
            confirmLabel="Simpan isi Excel"
            onCancel={() => setWorkbookPreview(null)}
            onConfirm={confirmWorkbookImport}
          />
        )}

        <section id="details" className="admin-panel mt-6 scroll-mt-4" aria-labelledby="details-title">
          <AdminPanelHeader
            id="details-title"
            title="Detail try-out"
            badge={hasChanges && <span className="admin-status-pill border-amber-200 bg-amber-50 text-amber-700">Belum disimpan</span>}
            description="Judul, ikon, dan info yang dilihat peserta di katalog."
          />

          <div
            className="grid gap-4 p-4"
            onKeyDown={(event) => {
              if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) return;

              event.preventDefault();
              if (hasChanges) saveTryout();
            }}
          >
            <TryoutDetailsFields
              values={form}
              errors={detailsErrors}
              categories={categories}
              tryoutId={tryoutId}
              onChange={updateForm}
              onIconError={setErrorMessage}
            />

            <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
              <button
                onClick={saveTryout}
                disabled={Boolean(busyAction) || !hasChanges}
                className="admin-button-primary"
                type="button"
              >
                {busyAction === "save" ? "Menyimpan..." : "Simpan perubahan"}
              </button>
              {hasChanges && (
                <button onClick={resetTryoutForm} disabled={Boolean(busyAction)} className="admin-button-ghost" type="button">
                  Batalkan perubahan
                </button>
              )}
            </div>
          </div>
        </section>
      </fieldset>

      {(successMessage || showPageError) && (
        <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6">
          {showPageError ? (
            <div role="alert" className="pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 text-[13px] font-semibold text-red-700 shadow-lg">
              <span className="min-w-0 flex-1">{errorMessage}</span>
              <button type="button" className="shrink-0 text-xs font-bold text-stone-400 hover:text-stone-600" onClick={() => setErrorMessage("")}>
                Tutup
              </button>
            </div>
          ) : (
            <p role="status" className="pointer-events-auto rounded-xl border border-emerald-200 bg-white px-4 py-3 text-[13px] font-semibold text-emerald-700 shadow-lg">
              {successMessage}
            </p>
          )}
        </div>
      )}
    </main>
  );
}

function getPublishHint({
  isPublished,
  hasChanges,
  publishedQuestionCount,
}: {
  isPublished: boolean;
  hasChanges: boolean;
  publishedQuestionCount: number;
}): { text: string; tone: "muted" | "warning" } {
  if (isPublished) return { text: "Peserta bisa melihat dan mengerjakan try-out ini.", tone: "muted" };
  if (hasChanges) return { text: "Simpan perubahan detail dulu sebelum menayangkan.", tone: "warning" };
  if (publishedQuestionCount === 0) return { text: "Tayangkan minimal satu soal dulu.", tone: "warning" };

  return { text: `${publishedQuestionCount} soal tayang siap dikerjakan peserta.`, tone: "muted" };
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" fill="none" aria-hidden="true">
      <path d="m20 20-4.2-4.2M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function StatusPill({ status }: { status: ContentStatus }) {
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

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 6 18 20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
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
