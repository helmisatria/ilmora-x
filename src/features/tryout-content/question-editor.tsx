import { useEffect, useId, useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent, ReactNode } from "react";
import { AdminField } from "../../components/admin/AdminField";
import { AdminPanelHeader } from "../../components/admin/AdminPanelHeader";
import { QuestionPictureField } from "../../components/admin/QuestionPictureField";
import type { listCategoryOptionsAdmin } from "../admin/admin-taxonomy-functions";
import {
  correctOptions,
  isSameQuestion,
  parsePastedOptions,
  parsePastedQuestion,
  validateQuestion,
  type AccessLevel,
  type ContentStatus,
  type CorrectOption,
  type QuestionEditorValues,
  type QuestionField,
  type QuestionFieldErrors,
} from "./question-editor-form";

type CategoryOption = Awaited<ReturnType<typeof listCategoryOptionsAdmin>>[number];
export type QuestionSaveMode = "save" | "save-next";

const discardMessage = "Buang perubahan soal yang belum disimpan?";

type QuestionEditorProps = {
  // "inline" sits inside the try-out question list, "panel" is a standalone admin panel.
  layout: "inline" | "panel";
  title: string;
  description?: ReactNode;
  headerActions?: ReactNode;
  values: QuestionEditorValues;
  initialValues: QuestionEditorValues;
  categories: CategoryOption[];
  saveLabel: string;
  // Set while this editor's save request runs.
  savingMode: QuestionSaveMode | null;
  // Set while any action on the page runs.
  busy: boolean;
  serverMessage: string;
  serverFieldErrors?: QuestionFieldErrors;
  autoFocus?: boolean;
  onChange: (values: QuestionEditorValues) => void;
  // Called only with values that pass validation.
  onSave: (mode: QuestionSaveMode) => void;
  // Shows "Simpan & tambah lagi" when set.
  allowSaveAndNext?: boolean;
  onCancel?: () => void;
  onPictureError: (message: string) => void;
};

export function QuestionEditor({
  layout,
  title,
  description,
  headerActions,
  values,
  initialValues,
  categories,
  saveLabel,
  savingMode,
  busy,
  serverMessage,
  serverFieldErrors,
  autoFocus = false,
  onChange,
  onSave,
  allowSaveAndNext = false,
  onCancel,
  onPictureError,
}: QuestionEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [pasteUndo, setPasteUndo] = useState<{ message: string; values: QuestionEditorValues } | null>(null);
  const validation = validateQuestion(values);
  const errors: QuestionFieldErrors = { ...(showValidation ? validation.errors : {}), ...serverFieldErrors };
  const alertMessage = (showValidation && validation.summary) || serverMessage;
  const isDirty = !isSameQuestion(values, initialValues);
  const subCategories = categories.find((category) => category.id === values.categoryId)?.subCategories ?? [];
  const topics = subCategories.find((subCategory) => subCategory.id === values.subCategoryId)?.topics ?? [];
  const hasSortOrder = values.sortOrder !== undefined;
  const hasStatus = values.status !== undefined;

  const focusField = (field: QuestionField) => {
    setIsPreview(false);
    requestAnimationFrame(() => {
      const control = rootRef.current?.querySelector<HTMLElement>(`[data-field="${field}"]`);
      control?.focus({ preventScroll: true });
      control?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  };

  // Waits until the page is idle: disabled controls cannot take focus.
  const hasAutoFocused = useRef(false);
  useEffect(() => {
    if (!autoFocus || busy || hasAutoFocused.current) return;

    hasAutoFocused.current = true;
    rootRef.current?.querySelector<HTMLElement>('[data-field="questionText"]')?.focus({ preventScroll: true });
  }, [autoFocus, busy]);

  const serverField = Object.keys(serverFieldErrors ?? {})[0] as QuestionField | undefined;
  useEffect(() => {
    if (serverField) focusField(serverField);
  }, [serverField, serverMessage]);

  const update = (patch: Partial<QuestionEditorValues>) => {
    setPasteUndo(null);
    onChange({ ...values, ...patch });
  };

  const updateCategory = (categoryId: string) => {
    const subCategory = categories.find((category) => category.id === categoryId)?.subCategories[0];

    update({ categoryId, subCategoryId: subCategory?.id ?? "", topicId: subCategory?.topics?.[0]?.id ?? "" });
  };

  const updateSubCategory = (subCategoryId: string) => {
    const topicId = subCategories.find((subCategory) => subCategory.id === subCategoryId)?.topics?.[0]?.id ?? "";

    update({ subCategoryId, topicId });
  };

  const save = (mode: QuestionSaveMode) => {
    if (busy) return;

    if (validation.firstInvalidField) {
      setShowValidation(true);
      focusField(validation.firstInvalidField);
      return;
    }

    onSave(mode);
  };

  const cancel = () => {
    if (!onCancel || busy) return;
    if (isDirty && !window.confirm(discardMessage)) return;

    onCancel();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      save(event.shiftKey && allowSaveAndNext ? "save-next" : "save");
      return;
    }

    if (event.key === "Escape" && onCancel) {
      event.preventDefault();
      cancel();
    }
  };

  const applyPaste = (event: ClipboardEvent, patch: Partial<QuestionEditorValues> | null, message: string) => {
    if (!patch) return;

    event.preventDefault();
    onChange({ ...values, ...patch });
    setPasteUndo({ message, values });
  };

  const pasteQuestion = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = parsePastedQuestion(event.clipboardData.getData("text"));
    if (!pasted) return;

    applyPaste(
      event,
      {
        ...(pasted.questionText ? { questionText: pasted.questionText } : {}),
        ...pasted.options,
        ...(pasted.correctOption ? { correctOption: pasted.correctOption } : {}),
      },
      pasted.correctOption ? "Soal, pilihan, dan kunci jawaban terisi dari teks yang ditempel." : "Soal dan pilihan terisi dari teks yang ditempel.",
    );
  };

  const pasteOptions = (event: ClipboardEvent<HTMLInputElement>, option: CorrectOption) => {
    const options = parsePastedOptions(event.clipboardData.getData("text"), option);
    if (!options) return;

    applyPaste(event, options, `${Object.keys(options).length} pilihan terisi dari teks yang ditempel.`);
  };

  const header = (
    <EditorHeader
      layout={layout}
      title={title}
      description={description}
      isDirty={isDirty}
      isPreview={isPreview}
      onTogglePreview={() => setIsPreview(!isPreview)}
      actions={headerActions}
    />
  );

  const body = isPreview ? (
    <QuestionPreview values={values} categories={categories} />
  ) : (
    <div className="grid gap-5">
      <div className="grid gap-4">
        <AdminField label="Teks soal" field="questionText" error={errors.questionText} hint="Tip: tempel soal lengkap dengan pilihan A. sampai E. dan baris “Kunci: B” untuk mengisi semuanya sekaligus.">
          <textarea
            value={values.questionText}
            onChange={(event) => update({ questionText: event.target.value })}
            onPaste={pasteQuestion}
            className="admin-control min-h-24 bg-white"
            placeholder="Tulis pertanyaan seperti yang dilihat peserta."
          />
        </AdminField>

        {pasteUndo && (
          <p role="note" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
            <span>{pasteUndo.message} Periksa lagi sebelum menyimpan.</span>
            <button
              type="button"
              className="font-bold underline"
              onClick={() => {
                onChange(pasteUndo.values);
                setPasteUndo(null);
              }}
            >
              Urungkan
            </button>
          </p>
        )}

        <div>
          <QuestionPictureField
            compact
            value={values.pictureUrl}
            busy={busy}
            onChange={(pictureUrl) => update({ pictureUrl })}
            onError={onPictureError}
          />
          <p className="mt-1 text-[11px] font-medium text-stone-400">Peserta melihat gambar ini di pembahasan setelah try-out selesai.</p>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex flex-wrap items-end justify-between gap-2">
          <span className="text-xs font-bold text-stone-600">Pilihan jawaban</span>
          <CorrectOptionSelect value={values.correctOption} onChange={(correctOption) => update({ correctOption })} />
        </div>
        <div className="grid gap-2">
          {correctOptions.map((option) => (
            <OptionInput
              key={option}
              option={option}
              isCorrect={values.correctOption === option}
              value={values[`option${option}`]}
              error={errors[`option${option}`]}
              onChange={(value) => update({ [`option${option}`]: value })}
              onMarkCorrect={() => update({ correctOption: option })}
              onPaste={(event) => pasteOptions(event, option)}
            />
          ))}
        </div>
        <p className="mt-1.5 text-[11px] font-medium text-stone-400">Klik huruf untuk menjadikannya kunci jawaban. Tempel beberapa baris di satu pilihan untuk mengisi pilihan berikutnya.</p>
      </div>

      <div className="grid gap-4">
        <AdminField label="Pembahasan" field="explanation" error={errors.explanation}>
          <textarea
            value={values.explanation}
            onChange={(event) => update({ explanation: event.target.value })}
            className="admin-control min-h-24 bg-white"
            placeholder="Jelaskan kenapa jawaban ini benar."
          />
        </AdminField>
        <AdminField label="Tautan video pembahasan, opsional" field="videoUrl">
          <input
            value={values.videoUrl}
            onChange={(event) => update({ videoUrl: event.target.value })}
            className="admin-control bg-white"
            placeholder="https://"
            inputMode="url"
          />
        </AdminField>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <AdminField label="Kategori" field="categoryId" error={errors.categoryId}>
            <select value={values.categoryId} onChange={(event) => updateCategory(event.target.value)} className="admin-control bg-white">
              {categories.length === 0 && <option value="">Belum ada kategori</option>}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </AdminField>

          <AdminField label="Subkategori" field="subCategoryId" error={errors.subCategoryId}>
            <select value={values.subCategoryId} onChange={(event) => updateSubCategory(event.target.value)} className="admin-control bg-white">
              {subCategories.length === 0 && <option value="">Belum ada subkategori</option>}
              {subCategories.map((subCategory) => (
                <option key={subCategory.id} value={subCategory.id}>
                  {subCategory.name}
                </option>
              ))}
            </select>
          </AdminField>

          <AdminField label="Topik" field="topicId" error={errors.topicId}>
            <select value={values.topicId} onChange={(event) => update({ topicId: event.target.value })} className="admin-control bg-white">
              {topics.length === 0 && <option value="">Belum ada topik</option>}
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </AdminField>
        </div>

        {(subCategories.length === 0 || topics.length === 0) && (
          <p className="text-xs font-medium text-amber-700">
            Subkategori atau topik masih kosong. <a href="/admin/categories" className="font-bold underline">Tambahkan di halaman Kategori</a> lebih dulu.
          </p>
        )}

        <div className={`grid gap-4 ${hasSortOrder && hasStatus ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {hasSortOrder && (
            <AdminField label="Nomor urut" field="sortOrder" error={errors.sortOrder}>
              <input
                value={values.sortOrder}
                onChange={(event) => update({ sortOrder: event.target.value })}
                className="admin-control bg-white"
                inputMode="numeric"
              />
            </AdminField>
          )}

          <AdminField label="Akses" field="accessLevel">
            <select
              value={values.accessLevel}
              onChange={(event) => update({ accessLevel: event.target.value as AccessLevel })}
              className="admin-control bg-white"
            >
              <option value="free">Gratis</option>
              <option value="premium">Premium</option>
            </select>
          </AdminField>

          {hasStatus && (
            <AdminField label="Status" field="status">
              <select
                value={values.status}
                onChange={(event) => update({ status: event.target.value as ContentStatus })}
                className="admin-control bg-white"
              >
                <option value="draft">Draf</option>
                <option value="published">Tayang</option>
                <option value="unpublished">Disembunyikan</option>
              </select>
            </AdminField>
          )}
        </div>
      </div>
    </div>
  );

  const saveBar = (
    <div className={`admin-editor-savebar ${layout === "inline" ? "-mx-4 bg-stone-50/95 sm:-mx-5" : "-mx-4 rounded-b-xl bg-white/95"}`}>
      {alertMessage && <p role="alert" className="admin-alert mt-0">{alertMessage}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => save("save")} disabled={busy} className="admin-button-primary" type="button">
          {savingMode === "save" ? "Menyimpan..." : saveLabel}
        </button>
        {allowSaveAndNext && (
          <button onClick={() => save("save-next")} disabled={busy} className="admin-button-secondary" type="button">
            {savingMode === "save-next" ? "Menyimpan..." : <span>Simpan & <span className="hidden sm:inline">tambah </span>lagi</span>}
          </button>
        )}
        {onCancel && (
          <button disabled={busy} onClick={cancel} className="admin-button-ghost" type="button">
            Batal
          </button>
        )}
        <span className="ml-auto hidden text-[11px] font-medium text-stone-400 md:inline">
          <kbd className="admin-kbd">Ctrl/⌘ Enter</kbd> simpan
          {allowSaveAndNext && <> · <kbd className="admin-kbd">Shift</kbd> untuk tambah lagi</>}
          {onCancel && <> · <kbd className="admin-kbd">Esc</kbd> batal</>}
        </span>
      </div>
    </div>
  );

  if (layout === "panel") {
    return (
      <section id="question-editor" className="admin-panel mt-6 scroll-mt-20 sm:scroll-mt-6" aria-labelledby="question-editor-title">
        <div ref={rootRef} onKeyDown={handleKeyDown}>
          {header}
          <div className="grid gap-4 px-4 pt-4">
            {body}
            {saveBar}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div
      ref={rootRef}
      id="question-editor"
      onKeyDown={handleKeyDown}
      className="relative scroll-mt-4 border-t border-stone-100 bg-stone-50 px-4 pt-4 first:border-t-0 before:absolute before:inset-y-0 before:left-0 before:z-20 before:w-[3px] before:bg-primary sm:px-5"
    >
      {header}
      <div className="grid gap-5">
        {body}
        {saveBar}
      </div>
    </div>
  );
}

function EditorHeader({
  layout,
  title,
  description,
  isDirty,
  isPreview,
  onTogglePreview,
  actions,
}: {
  layout: "inline" | "panel";
  title: string;
  description?: ReactNode;
  isDirty: boolean;
  isPreview: boolean;
  onTogglePreview: () => void;
  actions?: ReactNode;
}) {
  const dirtyBadge = isDirty && <span className="admin-status-pill border-amber-200 bg-amber-50 text-amber-700">Belum disimpan</span>;
  const previewToggle = (
    <button type="button" className="admin-button-ghost" aria-pressed={isPreview} onClick={onTogglePreview}>
      {isPreview ? <PencilIcon /> : <EyeIcon />}
      {isPreview ? "Kembali mengisi" : "Pratinjau"}
    </button>
  );

  if (layout === "panel") {
    return (
      <AdminPanelHeader
        id="question-editor-title"
        title={title}
        badge={dirtyBadge || undefined}
        description={description}
        actions={
          <>
            {previewToggle}
            {actions}
          </>
        }
      />
    );
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h3 className="text-[13.5px] font-bold text-stone-800">{title}</h3>
        {dirtyBadge}
      </div>
      <div className="flex items-center gap-1">
        {previewToggle}
        {actions}
      </div>
    </div>
  );
}

// Mirrors what a student sees: the question and its options while answering,
// then the key, explanation, picture, and video in the review.
function QuestionPreview({ values, categories }: { values: QuestionEditorValues; categories: CategoryOption[] }) {
  const options = correctOptions.filter((option) => values[`option${option}`].trim());
  const category = categories.find((item) => item.id === values.categoryId);
  const subCategory = category?.subCategories.find((item) => item.id === values.subCategoryId);
  const topic = subCategory?.topics?.find((item) => item.id === values.topicId);

  return (
    <div className="grid gap-4" aria-label="Pratinjau soal">
      <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Saat mengerjakan</p>
        <p className="mt-2 whitespace-pre-line text-base font-bold leading-relaxed text-stone-800 sm:text-lg">
          {values.questionText.trim() || <span className="text-stone-300">Teks soal belum diisi.</span>}
        </p>
        <div className="mt-4 grid gap-2">
          {options.length === 0 && <p className="text-sm text-stone-400">Pilihan jawaban belum diisi.</p>}
          {options.map((option) => (
            <div key={option} className="flex items-center gap-3 rounded-xl border-2 border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold text-stone-700">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-200 text-[13px] font-bold text-stone-500">{option}</span>
              <span className="leading-snug">{values[`option${option}`]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Di pembahasan</p>
        <p className="mt-2 text-sm font-bold text-emerald-700">
          Kunci jawaban: {values.correctOption}
          {values[`option${values.correctOption}`].trim() && <span className="font-semibold text-stone-600"> · {values[`option${values.correctOption}`]}</span>}
        </p>
        {values.pictureUrl && <img src={values.pictureUrl} alt="" className="mt-3 max-h-64 rounded-lg border border-stone-100 object-contain" />}
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-700">
          {values.explanation.trim() || <span className="text-stone-300">Pembahasan belum diisi.</span>}
        </p>
        {values.videoUrl.trim() && <p className="mt-2 truncate text-xs font-semibold text-primary">Video: {values.videoUrl}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className={`admin-meta-tag ${values.accessLevel === "free" ? "text-emerald-700" : "text-amber-700"}`}>{values.accessLevel === "free" ? "Gratis" : "Premium"}</span>
          <span className="admin-meta-tag">{[category?.name, subCategory?.name, topic?.name].filter(Boolean).join(" / ") || "Topik belum dipilih"}</span>
        </div>
      </div>
    </div>
  );
}

function OptionInput({
  option,
  value,
  isCorrect,
  error,
  onChange,
  onMarkCorrect,
  onPaste,
}: {
  option: CorrectOption;
  value: string;
  isCorrect: boolean;
  error?: string;
  onChange: (value: string) => void;
  onMarkCorrect: () => void;
  onPaste: (event: ClipboardEvent<HTMLInputElement>) => void;
}) {
  const id = useId();
  const isOptional = option === "E";

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMarkCorrect}
          aria-pressed={isCorrect}
          title={isCorrect ? "Kunci jawaban" : `Jadikan ${option} kunci jawaban`}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold transition-colors ${
            isCorrect ? "bg-emerald-600 text-white" : "bg-white text-stone-500 ring-1 ring-stone-200 hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-200"
          }`}
        >
          {option}
          <span className="sr-only">{isCorrect ? ", kunci jawaban" : `, jadikan kunci jawaban`}</span>
        </button>
        <label htmlFor={id} className="sr-only">
          {isOptional ? "Pilihan E, opsional" : `Pilihan ${option}`}
        </label>
        <input
          id={id}
          data-field={`option${option}`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onPaste={onPaste}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-message` : undefined}
          className={`admin-control min-w-0 flex-1 ${getOptionTone(isCorrect, Boolean(error))}`}
          placeholder={isOptional ? "Opsional" : `Isi pilihan ${option}`}
        />
        {isCorrect && <span className="hidden shrink-0 text-[11px] font-bold text-emerald-700 sm:inline">Kunci</span>}
      </div>
      {error && <p id={`${id}-message`} className="admin-field-error pl-11">{error}</p>}
    </div>
  );
}

// Utilities outrank the invalid component class, so pick one tone.
function getOptionTone(isCorrect: boolean, isInvalid: boolean) {
  if (isInvalid) return "admin-control-invalid";
  if (isCorrect) return "border-emerald-300 bg-emerald-50/60";

  return "bg-white";
}

function CorrectOptionSelect({ value, onChange }: { value: CorrectOption; onChange: (value: CorrectOption) => void }) {
  const id = useId();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-xs font-bold text-stone-600">Kunci jawaban</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as CorrectOption)}
        className="admin-control h-8 w-16 bg-white py-0"
      >
        {correctOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M4 20h4L18.5 9.5a2.8 2.8 0 1 0-4-4L4 16v4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m14.5 5.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
