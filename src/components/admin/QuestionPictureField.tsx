import type { ChangeEvent, DragEvent } from "react";
import { useId, useRef, useState } from "react";

type QuestionPictureFieldProps = {
  label?: string;
  value: string;
  busy?: boolean;
  onChange: (value: string) => void;
  onError: (message: string) => void;
};

export function QuestionPictureField({
  label = "Gambar soal, opsional",
  value,
  busy = false,
  onChange,
  onError,
}: QuestionPictureFieldProps) {
  const fieldId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isUnavailable = busy || isUploading;

  const uploadFile = async (file: File | undefined) => {
    if (!file) return;
    if (isUnavailable) return;

    if (!file.type.startsWith("image/")) {
      onError("Gunakan file gambar JPG, PNG, WebP, atau GIF.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    onError("");
    setIsUploading(true);

    try {
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        onError(result?.message ?? "Gambar belum terunggah. Coba lagi.");
        return;
      }

      if (result.mediaType !== "image") {
        onError("Gunakan file gambar JPG, PNG, WebP, atau GIF.");
        return;
      }

      onChange(result.url);
    } catch {
      onError("Gambar belum terunggah. Coba lagi.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    event.currentTarget.value = "";
    void uploadFile(file);
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

    void uploadFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <label htmlFor={fieldId} className="mb-2 block text-sm font-bold text-stone-700">{label}</label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-[var(--radius-lg)] border-2 border-stone-200 bg-white p-3 transition ${isDragging ? "border-primary bg-primary-tint" : ""}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id={fieldId}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="admin-control min-w-0 flex-1"
            placeholder="Tempel tautan gambar atau unggah gambar"
          />
          <button
            type="button"
            disabled={isUnavailable}
            onClick={() => inputRef.current?.click()}
            className="admin-button-secondary justify-center disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UploadIcon className="h-4 w-4 shrink-0" />
            {getUploadButtonLabel({ isUploading, hasValue: Boolean(value) })}
          </button>
          <input
            ref={inputRef}
            onChange={handleChange}
            disabled={isUnavailable}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
          />
        </div>

        {isDragging && (
          <p className="mt-2 text-xs font-bold text-primary-dark">Lepaskan gambar di sini.</p>
        )}
      </div>

      {value && (
        <div className="mt-3 rounded-[var(--radius-md)] border-2 border-stone-100 bg-stone-50 p-3">
          <img
            src={value}
            alt={`Pratinjau ${label}`}
            className="max-h-56 w-full rounded-[var(--radius-sm)] object-contain"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 truncate text-xs font-semibold text-primary-dark underline"
            >
              {value}
            </a>
            <button
              type="button"
              onClick={() => onChange("")}
              className="admin-button-ghost text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              Hapus gambar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getUploadButtonLabel({
  isUploading,
  hasValue,
}: {
  isUploading: boolean;
  hasValue: boolean;
}) {
  if (isUploading) return "Mengunggah...";
  if (hasValue) return "Ganti gambar";

  return "Unggah gambar";
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 15V3m0 0L7 8m5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 17.5V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2.5M7 15l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
