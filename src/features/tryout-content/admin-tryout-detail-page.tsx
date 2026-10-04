import { useRouter } from "@tanstack/react-router";
import { cloneElement, isValidElement, useEffect, useId, useMemo, useState } from "react";
import { QuestionPictureField } from "../../components/admin/QuestionPictureField";
import { TryoutIconField } from "../../components/admin/TryoutIconField";
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
import * as tryoutWorkbook from "./tryout-workbook";
import * as tryoutWorkbookSheets from "./tryout-workbook-sheets";

type TryoutWorkbook = Awaited<ReturnType<typeof getTryoutWorkbookAdmin>>;
type TryoutQuestion = TryoutWorkbook["questions"][number];
type CategoryRow = Awaited<ReturnType<typeof listCategoryOptionsAdmin>>[number];
type AccessLevel = "free" | "premium";
type ContentStatus = "draft" | "published" | "unpublished";
type CorrectOption = "A" | "B" | "C" | "D" | "E";

type TryoutForm = {
  expectedUpdatedAt: string;
  title: string;
  description: string;
  icon: string;
  categoryId: string;
  durationMinutes: string;
  accessLevel: AccessLevel;
};

type QuestionForm = {
  expectedUpdatedAt: string;
  questionId: string;
  sortOrder: string;
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
  status: ContentStatus;
};

const correctOptions: CorrectOption[] = ["A", "B", "C", "D", "E"];

export type AdminTryoutDetailPageData = {
  workbook: TryoutWorkbook;
  categories: CategoryRow[];
};

export function AdminTryoutDetailPage({ workbook, categories }: AdminTryoutDetailPageData) {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => setIsHydrated(true), []);
  const tryoutId = workbook.tryout.id;

  const [form, setForm] = useState<TryoutForm>(() => ({
    expectedUpdatedAt: workbook.tryout.updatedAt,
    title: workbook.tryout.title,
    description: workbook.tryout.description,
    icon: workbook.tryout.icon ?? "",
    categoryId: workbook.tryout.categoryId,
    durationMinutes: String(workbook.tryout.durationMinutes),
    accessLevel: workbook.tryout.accessLevel,
  }));
  const [busyAction, setBusyAction] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewRevision, setPreviewRevision] = useState("");
  const [workbookPreview, setWorkbookPreview] = useState<WorkbookPreview | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionForm | null>(null);
  useEffect(() => {
    setForm({ expectedUpdatedAt: workbook.tryout.updatedAt, title: workbook.tryout.title, description: workbook.tryout.description,
      icon: workbook.tryout.icon ?? "", categoryId: workbook.tryout.categoryId,
      durationMinutes: String(workbook.tryout.durationMinutes), accessLevel: workbook.tryout.accessLevel });
  }, [workbook.tryout.id, workbook.tryout.title, workbook.tryout.description, workbook.tryout.icon,
    workbook.tryout.categoryId, workbook.tryout.durationMinutes, workbook.tryout.accessLevel, workbook.tryout.updatedAt]);
  useEffect(() => {
    if (questionForm) document.getElementById("question-editor")?.scrollIntoView({ block: "start" });
  }, [questionForm?.questionId]);
  const publishedQuestionCount = workbook.questions.filter((question) => question.status === "published").length;

  const selectedSubCategories = useMemo(() => {
    if (!questionForm) return [];

    return categories.find((category) => category.id === questionForm.categoryId)?.subCategories ?? [];
  }, [categories, questionForm]);
  const selectedTopics = useMemo(() => {
    if (!questionForm) return [];

    return selectedSubCategories.find((subCategory) => subCategory.id === questionForm.subCategoryId)?.topics ?? [];
  }, [selectedSubCategories, questionForm]);

  const refresh = async () => {
    await router.invalidate();
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

    try {
      await updateTryoutAdmin({
        data: {
          expectedUpdatedAt: form.expectedUpdatedAt,
          title: form.title,
          description: form.description,
          icon: form.icon,
          categoryId: form.categoryId,
          durationMinutes,
          accessLevel: form.accessLevel,
          tryoutId,
        },
      });
      await refresh();
      setSuccessMessage("Perubahan tersimpan.");
    } catch (error) {
      setErrorMessage(getSafeErrorMessage(error, "Perubahan belum disimpan. Periksa isian lalu coba lagi."));
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

  const addQuestion = () => {
    const category = categories.find((item) => item.id === form.categoryId) ?? categories[0];
    const subCategory = category?.subCategories[0];
    setQuestionForm({
      expectedUpdatedAt: workbook.tryout.updatedAt,
      questionId: "", sortOrder: String(Math.max(0, ...workbook.questions.map((item) => item.sortOrder)) + 1),
      categoryId: category?.id ?? "", subCategoryId: subCategory?.id ?? "", topicId: subCategory?.topics?.[0]?.id ?? "",
      questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", optionE: "", correctOption: "A",
      explanation: "", videoUrl: "", pictureUrl: "", accessLevel: "free", status: "draft",
    });
    setErrorMessage("");
    document.getElementById("question-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const editQuestion = (question: TryoutQuestion) => {
    setQuestionForm({
      expectedUpdatedAt: workbook.tryout.updatedAt,
      questionId: question.questionId,
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
    });
    setErrorMessage("");
  };

  const updateQuestionCategory = (categoryId: string) => {
    if (!questionForm) return;

    const subCategory = categories.find((category) => category.id === categoryId)?.subCategories[0];

    setQuestionForm({
      ...questionForm,
      categoryId,
      subCategoryId: subCategory?.id ?? "",
      topicId: subCategory?.topics?.[0]?.id ?? "",
    });
  };

  const updateQuestionSubCategory = (subCategoryId: string) => {
    if (!questionForm) return;

    const topicId = selectedSubCategories.find((subCategory) => subCategory.id === subCategoryId)?.topics?.[0]?.id ?? "";

    setQuestionForm({
      ...questionForm,
      subCategoryId,
      topicId,
    });
  };

  const saveQuestion = async () => {
    if (!questionForm) return;

    const sortOrder = Number(questionForm.sortOrder);
    const validationMessage = getQuestionValidationMessage(questionForm, sortOrder);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setSuccessMessage("");
    setBusyAction(`question-save:${questionForm.questionId}`);
    setErrorMessage("");

    try {
      const save = questionForm.questionId ? updateTryoutQuestionAdmin : addTryoutQuestionAdmin;
      await save({
        data: {
          tryoutId,
          questionId: questionForm.questionId,
          expectedUpdatedAt: questionForm.expectedUpdatedAt,
          sortOrder,
          categoryId: questionForm.categoryId,
          subCategoryId: questionForm.subCategoryId,
          topicId: questionForm.topicId,
          questionText: questionForm.questionText,
          optionA: questionForm.optionA,
          optionB: questionForm.optionB,
          optionC: questionForm.optionC,
          optionD: questionForm.optionD,
          optionE: questionForm.optionE,
          correctOption: questionForm.correctOption,
          explanation: questionForm.explanation,
          videoUrl: questionForm.videoUrl,
          pictureUrl: questionForm.pictureUrl,
          accessLevel: questionForm.accessLevel,
          status: questionForm.status,
        },
      });

      setQuestionForm(null);
      await refresh();
      setSuccessMessage("Perubahan tersimpan.");
    } catch (error) {
      setErrorMessage(getSafeErrorMessage(error, "Soal belum disimpan. Periksa nomor urut dan isian."));
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

      if (questionForm?.questionId === question.questionId) {
        setQuestionForm(null);
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
      const exportedWorkbook = tryoutWorkbookSheets.makeTryoutWorkbook(XLSX, workbook, latestCategories);
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
          tryout: workbookPreview.data.tryout,
          questions: workbookPreview.data.questions,
        },
      });
      setQuestionForm(null);
      setWorkbookPreview(null);
      await refresh();
      setSuccessMessage("Perubahan tersimpan.");
    } catch (error) {
      setErrorMessage(getSafeErrorMessage(error, "Excel belum disimpan. Periksa isian lalu coba lagi."));
    } finally {
      setBusyAction("");
    }
  };

  const hasChanges =
    form.title !== workbook.tryout.title ||
    form.description !== workbook.tryout.description ||
    form.icon !== (workbook.tryout.icon ?? "") ||
    form.categoryId !== workbook.tryout.categoryId ||
    Number(form.durationMinutes) !== workbook.tryout.durationMinutes ||
    form.accessLevel !== workbook.tryout.accessLevel;

  return (
    <main className="admin-shell page-enter">
      <fieldset className="admin-lane min-w-0" disabled={!isHydrated || Boolean(busyAction)} data-admin-ready={isHydrated}>
        <header className="admin-header">
          <a href="/admin/tryouts" className="admin-back-link">Try-out</a>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="admin-title">{workbook.tryout.title}</h1>
            <StatusPill status={workbook.tryout.status} />
          </div>
          <p className="admin-description">{workbook.tryout.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="admin-meta-tag first:before:hidden">{categories.find((c) => c.id === workbook.tryout.categoryId)?.name ?? workbook.tryout.categoryId}</span>
            <span className="admin-meta-tag">{workbook.tryout.durationMinutes} menit</span>
            <span className="admin-meta-tag capitalize">{workbook.tryout.accessLevel === "free" ? "Gratis" : "Premium"}</span>
            <span className="admin-meta-tag">{workbook.questions.length} soal</span>
          </div>
        </header>

        {successMessage && <p role="status" className="mt-4 text-sm text-emerald-700">{successMessage}</p>}
        {errorMessage && !workbookPreview && !questionForm && (
          <p role="alert" className="admin-alert">
            {errorMessage}
          </p>
        )}

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Ubah try-out</h2>
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
                tryoutId={tryoutId}
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

            <p className="text-sm text-stone-600">{publishedQuestionCount} dari {workbook.questions.length} soal sudah tayang. Peserta hanya mengerjakan soal berstatus Tayang. Simpan perubahan judul dan durasi sebelum menayangkan.</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={saveTryout}
                disabled={Boolean(busyAction) || !hasChanges}
                className="admin-button-primary"
                type="button"
              >
                {busyAction === "save" ? "Menyimpan..." : "Simpan perubahan"}
              </button>
              {workbook.tryout.status === "published" ? (
                <button
                  onClick={() => setPublication("unpublished")}
                  disabled={Boolean(busyAction)}
                  className="admin-button-ghost text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  type="button"
                >
                  <EyeOffIcon className="w-3.5 h-3.5" />
                  Sembunyikan
                </button>
              ) : (
                <button
                  onClick={() => setPublication("published")}
                  disabled={Boolean(busyAction) || hasChanges}
                  className="admin-button-success"
                  type="button"
                >
                  <EyeIcon className="w-3.5 h-3.5" />
                  Tayangkan
                </button>
              )}
            </div>
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

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Kelola lewat Excel</h2>
          </div>

          <p className="px-5 pt-4 text-sm text-stone-600">Unduh Excel terbaru sebelum mengubah soal. Saat disimpan, Excel mengganti seluruh daftar soal try-out ini. Soal yang tidak ada di Excel akan keluar dari try-out. Riwayat peserta tetap tersimpan.</p>
          <div className="flex flex-wrap gap-3 p-5 sm:p-6">
            <button
              onClick={downloadWorkbook}
              disabled={Boolean(busyAction)}
              className="admin-button-secondary"
              type="button"
            >
              <DownloadIcon className="w-4 h-4" />
              Unduh Excel
            </button>
            <FileUpload
              accept=".xlsx"
              busy={Boolean(busyAction)}
              placeholder="Unggah Excel"
              onFileSelect={(file) => importWorkbook(file)}
            />
          </div>
        </section>

        {questionForm && (
          <section id="question-editor" className="admin-panel mt-6">
            <div className="admin-panel-header">
              <h2 className="admin-panel-title">{questionForm.questionId ? "Ubah soal" : "Tambah soal"}</h2>
              {errorMessage && <p role="alert" className="admin-alert">{errorMessage}</p>}
            </div>

            <div className="grid gap-5 p-5 sm:p-6">
              <p className="text-sm text-stone-600">Jika daftar subkategori atau topik kosong, <a href="/admin/categories" className="underline">tambahkan di halaman Kategori</a> lebih dulu.</p>
              <div className="grid gap-5 sm:grid-cols-[120px_1fr_1fr_1fr]">
                <Field label="Nomor urut">
                  <input
                    value={questionForm.sortOrder}
                    onChange={(event) => setQuestionForm({ ...questionForm, sortOrder: event.target.value })}
                    className="admin-control"
                    inputMode="numeric"
                  />
                </Field>

                <Field label="Kategori">
                  <select
                    value={questionForm.categoryId}
                    onChange={(event) => updateQuestionCategory(event.target.value)}
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
                    value={questionForm.subCategoryId}
                    onChange={(event) => updateQuestionSubCategory(event.target.value)}
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
                    value={questionForm.topicId}
                    onChange={(event) => setQuestionForm({ ...questionForm, topicId: event.target.value })}
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
                  value={questionForm.questionText}
                  onChange={(event) => setQuestionForm({ ...questionForm, questionText: event.target.value })}
                  className="admin-control min-h-28"
                />
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <TextInput label="Pilihan A" value={questionForm.optionA} onChange={(optionA) => setQuestionForm({ ...questionForm, optionA })} />
                <TextInput label="Pilihan B" value={questionForm.optionB} onChange={(optionB) => setQuestionForm({ ...questionForm, optionB })} />
                <TextInput label="Pilihan C" value={questionForm.optionC} onChange={(optionC) => setQuestionForm({ ...questionForm, optionC })} />
                <TextInput label="Pilihan D" value={questionForm.optionD} onChange={(optionD) => setQuestionForm({ ...questionForm, optionD })} />
                <TextInput label="Pilihan E, opsional" value={questionForm.optionE} onChange={(optionE) => setQuestionForm({ ...questionForm, optionE })} />

                <Field label="Kunci jawaban">
                  <select
                    value={questionForm.correctOption}
                    onChange={(event) => setQuestionForm({ ...questionForm, correctOption: event.target.value as CorrectOption })}
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
                  value={questionForm.explanation}
                  onChange={(event) => setQuestionForm({ ...questionForm, explanation: event.target.value })}
                  className="admin-control min-h-28"
                />
              </Field>

              <div className="grid gap-5 md:grid-cols-3">
                <TextInput label="Tautan video pembahasan, opsional" value={questionForm.videoUrl} onChange={(videoUrl) => setQuestionForm({ ...questionForm, videoUrl })} />

                <Field label="Akses">
                  <select
                    value={questionForm.accessLevel}
                    onChange={(event) => setQuestionForm({ ...questionForm, accessLevel: event.target.value as AccessLevel })}
                    className="admin-control"
                  >
                    <option value="free">Gratis</option>
                    <option value="premium">Premium</option>
                  </select>
                </Field>

                <Field label="Status">
                  <select
                    value={questionForm.status}
                    onChange={(event) => setQuestionForm({ ...questionForm, status: event.target.value as ContentStatus })}
                    className="admin-control"
                  >
                    <option value="draft">Draf</option>
                    <option value="published">Tayang</option>
                    <option value="unpublished">Disembunyikan</option>
                  </select>
                </Field>
              </div>

              <QuestionPictureField
                value={questionForm.pictureUrl}
                busy={Boolean(busyAction)}
                onChange={(pictureUrl) => setQuestionForm({ ...questionForm, pictureUrl })}
                onError={setErrorMessage}
              />

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={saveQuestion}
                  disabled={Boolean(busyAction)}
                  className="admin-button-primary"
                  type="button"
                >
                  {busyAction === `question-save:${questionForm.questionId}` ? "Menyimpan..." : "Simpan soal"}
                </button>
                <button
                  disabled={Boolean(busyAction)}
                  onClick={() => setQuestionForm(null)}
                  className="admin-button-secondary"
                  type="button"
                >
                  Batal
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Soal ({workbook.questions.length})</h2>
            <button type="button" className="admin-button-primary" onClick={addQuestion} disabled={Boolean(busyAction) || Boolean(questionForm)}>Tambah soal</button>
          </div>

          <div>
            {workbook.questions.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-stone-400">Belum ada soal. Klik Tambah soal atau unggah Excel.</p>
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
                    <span className="admin-meta-tag first:before:hidden">{categories.find((item) => item.id === question.categoryId)?.name ?? question.categoryId}</span>
                    <span className="admin-meta-tag">{categories.flatMap((item) => item.subCategories).find((item) => item.id === question.subCategoryId)?.name ?? question.subCategoryId}</span>
                    <span className="admin-meta-tag">{categories.flatMap((item) => item.subCategories.flatMap((sub) => sub.topics)).find((item) => item.id === question.topicId)?.name ?? question.topicId}</span>
                    <span className="admin-meta-tag capitalize">{question.accessLevel === "free" ? "Gratis" : "Premium"}</span>
                    <span className="admin-meta-tag">Kunci jawaban: {question.correctOption}</span>
                    <StatusPill status={question.status} />
                  </div>
                  {question.explanation && (
                    <p className="mt-1.5 text-sm text-stone-400 line-clamp-2">{question.explanation}</p>
                  )}
                </div>
                <div className="admin-list-actions">
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
                    <button
                      onClick={() => deleteQuestion(question)}
                      disabled={Boolean(busyAction)}
                      className="admin-button-ghost text-red-600 hover:bg-red-50 hover:text-red-700"
                      type="button"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                      Keluarkan
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

function getQuestionValidationMessage(form: QuestionForm, sortOrder: number) {
  if (!Number.isInteger(sortOrder) || sortOrder < 1 || sortOrder > 1000) {
    return "Nomor urut must be an integer from 1 to 1000.";
  }

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
