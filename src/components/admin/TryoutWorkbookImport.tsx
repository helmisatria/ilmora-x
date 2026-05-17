import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import { useRef, useState } from "react";
import type {
  CorrectOption,
  TryoutWorkbookData,
  TryoutWorkbookQuestion,
  WorkbookTaxonomyAction,
  WorkbookValidationIssue,
} from "../../lib/tryout-workbook";

export type WorkbookPreview = {
  fileName: string;
  data: TryoutWorkbookData | null;
  issues: WorkbookValidationIssue[];
  taxonomyActions: WorkbookTaxonomyAction[];
};

export function WorkbookPreviewPanel({
  preview,
  busy,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  preview: WorkbookPreview;
  busy: boolean;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const canImport = Boolean(preview.data) && preview.issues.length === 0;
  const questionPreview = preview.data?.questions.slice(0, 5) ?? [];

  return (
    <section className="admin-panel mt-6">
      <div className="admin-panel-header">
        <div>
          <h2 className="admin-panel-title">Workbook preview</h2>
          <p className="mt-1 text-xs font-semibold text-stone-400">{preview.fileName}</p>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6">
        {preview.issues.length > 0 && (
          <div className="rounded-[var(--radius-md)] border-2 border-rose-200 bg-rose-50 p-4">
            <h3 className="text-sm font-bold text-rose-800">Fix these rows before importing</h3>
            <div className="mt-3 grid gap-2">
              {preview.issues.map((issue, index) => (
                <p key={`${issue.sheet}:${issue.row}:${issue.field}:${index}`} className="m-0 text-sm font-semibold text-rose-700">
                  {issue.sheet}{issue.row ? ` row ${issue.row}` : ""}{issue.field ? ` / ${issue.field}` : ""}: {issue.message}
                </p>
              ))}
            </div>
          </div>
        )}

        {preview.data && (
          <div className="grid gap-4">
            <div className="rounded-[var(--radius-md)] border-2 border-stone-100 bg-stone-50 p-4">
              <p className="admin-kicker">Try-out</p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-stone-800">{preview.data.tryout.title || "Untitled Try-out"}</h3>
              <p className="mt-1 text-sm font-semibold text-stone-500">
                {getCategoryLabel(preview.data.tryout)} · {preview.data.tryout.durationMinutes || 0} min · {preview.data.tryout.status}
              </p>
            </div>

            {preview.taxonomyActions.length > 0 && (
              <div className="rounded-[var(--radius-md)] border-2 border-amber-200 bg-amber-50 p-4">
                <h3 className="text-sm font-bold text-amber-900">Taxonomy changes on import</h3>
                <div className="mt-3 grid gap-2">
                  {preview.taxonomyActions.map((action, index) => (
                    <p key={`${action.field}:${action.name}:${action.parentName}:${index}`} className="m-0 text-sm font-semibold text-amber-800">
                      {action.mode === "create" ? "Create" : "Reuse"} {action.field === "category_name" ? "Category" : "Sub-category"} "{action.name}"
                      {action.parentName ? ` under "${action.parentName}"` : ""}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-3 text-sm font-bold text-stone-700">
                Questions ({preview.data.questions.length})
              </p>
              <div className="grid gap-2">
                {questionPreview.map((question) => (
                  <div key={`${question.sortOrder}:${question.questionText}`} className="rounded-[var(--radius-sm)] border border-stone-100 bg-white p-3">
                    <p className="m-0 line-clamp-2 text-sm font-bold leading-snug text-stone-800">
                      {question.sortOrder}. {question.questionText || "Untitled Question"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-stone-400">
                      {getCategoryLabel(question)} / {getSubCategoryLabel(question)} · Answer {question.correctOption}
                    </p>
                    <div className="mt-3 grid gap-1.5">
                      {getQuestionOptions(question).map((option) => (
                        <div
                          key={option.key}
                          className={`flex gap-2 rounded-[var(--radius-sm)] border px-2.5 py-2 text-xs font-semibold ${
                            option.key === question.correctOption
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-stone-100 bg-stone-50 text-stone-600"
                          }`}
                        >
                          <span className="shrink-0 font-black">{option.key}.</span>
                          <span className="min-w-0">{option.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {preview.data.questions.length > questionPreview.length && (
                <p className="mt-2 text-xs font-semibold text-stone-400">
                  +{preview.data.questions.length - questionPreview.length} more Questions
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button onClick={onCancel} className="admin-button-secondary" type="button">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canImport || busy}
            className="admin-button-primary"
            type="button"
          >
            {busy ? "Importing..." : confirmLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

export function FileUpload({
  accept,
  busy,
  placeholder,
  onFileSelect,
}: {
  accept: string;
  busy: boolean;
  placeholder: string;
  onFileSelect: (file: File) => Promise<void> | void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isUnavailable = busy || isUploading;

  const selectFile = async (file: File | undefined) => {
    if (!file) return;
    if (isUnavailable) return;
    if (!isAcceptedFile(file, accept)) return;

    setFileName(file.name);

    try {
      setIsUploading(true);
      await onFileSelect(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    event.currentTarget.value = "";
    void selectFile(file);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = isUnavailable ? "none" : "copy";

    if (isUnavailable) return;

    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;

    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (isUnavailable) return;

    void selectFile(event.dataTransfer.files?.[0]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    inputRef.current?.click();
  };

  return (
    <div
      role="button"
      tabIndex={isUnavailable ? -1 : 0}
      aria-disabled={isUnavailable}
      onClick={() => inputRef.current?.click()}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`admin-file-upload ${isUnavailable ? "pointer-events-none opacity-50" : ""} ${fileName ? "admin-file-upload-active" : ""} ${isDragging ? "border-primary bg-primary-tint text-primary-dark" : ""}`}
    >
      <UploadIcon className="w-4 h-4 shrink-0" />
      <span className="truncate">{isDragging ? "Drop .xlsx here" : isUploading ? "Importing..." : fileName || placeholder}</span>
      <input
        ref={inputRef}
        onChange={handleChange}
        disabled={isUnavailable}
        className="sr-only"
        type="file"
        accept={accept}
      />
    </div>
  );
}

function getCategoryLabel(item: { categoryId: string; categoryName?: string }) {
  return item.categoryId || item.categoryName || "No category";
}

function getSubCategoryLabel(item: { subCategoryId: string; subCategoryName?: string }) {
  return item.subCategoryId || item.subCategoryName || "No sub-category";
}

function getQuestionOptions(question: TryoutWorkbookQuestion) {
  return [
    { key: "A", text: question.optionA },
    { key: "B", text: question.optionB },
    { key: "C", text: question.optionC },
    { key: "D", text: question.optionD },
    { key: "E", text: question.optionE },
  ].filter((option): option is { key: CorrectOption; text: string } => Boolean(option.text));
}

function isAcceptedFile(file: File, accept: string) {
  if (accept !== ".xlsx") return true;

  return file.name.toLowerCase().endsWith(".xlsx");
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 15V3m0 0L7 8m5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 17.5V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
