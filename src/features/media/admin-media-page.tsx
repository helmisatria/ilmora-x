import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import { useRef, useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../components/ui/dialog";
import type { listMediaAdmin } from "./admin-media-functions";

export const adminMediaSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  type: z.enum(["all", "image", "video"]).catch("all"),
});

type MediaFilter = "all" | "image" | "video";
type MediaList = Awaited<ReturnType<typeof listMediaAdmin>>;
type MediaItem = MediaList["media"][number];

export type AdminMediaSearch = z.infer<typeof adminMediaSearchSchema>;

export function AdminMediaPage({
  mediaList,
  search,
}: {
  mediaList: MediaList;
  search: AdminMediaSearch;
}) {
  const router = useRouter();
  const navigate = useNavigate();
  const [busyUpload, setBusyUpload] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);

  const uploadMedia = async (file: File) => {
    const formData = new FormData();

    formData.append("file", file);
    setBusyUpload(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMessage(result?.message ?? "Media was not uploaded.");
        return;
      }

      await navigate({
        to: "/admin/media",
        search: {
          type: result.mediaType ?? search.type,
          page: 1,
        },
      });
      await router.invalidate();
    } catch {
      setErrorMessage("Media was not uploaded.");
    } finally {
      setBusyUpload(false);
    }
  };

  const changeFilter = (type: MediaFilter) => {
    navigate({
      to: "/admin/media",
      search: { type, page: 1 },
    });
  };

  const changePage = (page: number) => {
    navigate({
      to: "/admin/media",
      search: { type: search.type, page },
    });
  };

  const copyUrl = async (media: MediaItem) => {
    try {
      await navigator.clipboard.writeText(makeAbsoluteUrl(media.url));
      setCopiedId(media.id);
      window.setTimeout(() => setCopiedId(""), 1400);
    } catch {
      setErrorMessage("Link was not copied.");
    }
  };

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane">
        <header className="admin-header">
          <Link to="/admin" className="admin-back-link">Admin</Link>
          <h1 className="admin-title">Media</h1>
          <p className="admin-description">
            Upload, copy, and reuse image or video URLs for Question review media.
          </p>
        </header>

        {errorMessage && (
          <p className="admin-alert">
            {errorMessage}
          </p>
        )}

        <section className="admin-panel mt-6 p-5 sm:p-6">
          <MediaDropzone busy={busyUpload} onFileSelect={uploadMedia} />
        </section>

        <section className="admin-panel mt-6 overflow-hidden">
          <div className="admin-panel-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="admin-panel-title">Media Library</h2>
              <p className="mt-1 text-xs font-semibold text-stone-400">
                {mediaList.pagination.total} files · page {mediaList.pagination.page} of {mediaList.pagination.pageCount}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "image", "video"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => changeFilter(type)}
                  className={search.type === type ? "admin-button-primary" : "admin-button-ghost"}
                >
                  {getFilterLabel(type)}
                </button>
              ))}
            </div>
          </div>

          {mediaList.media.length > 0 ? (
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {mediaList.media.map((media) => (
                <MediaCard
                  key={media.id}
                  media={media}
                  copied={copiedId === media.id}
                  onCopy={() => void copyUrl(media)}
                  onPreview={() => setPreviewMedia(media)}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-stone-400">No media uploaded yet.</p>
            </div>
          )}

          <Pagination
            page={mediaList.pagination.page}
            pageCount={mediaList.pagination.pageCount}
            onChange={changePage}
          />
        </section>
      </div>

      <MediaPreviewDialog media={previewMedia} onClose={() => setPreviewMedia(null)} />
    </main>
  );
}

function MediaDropzone({
  busy,
  onFileSelect,
}: {
  busy: boolean;
  onFileSelect: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectFile = (file: File | undefined) => {
    if (!file) return;
    if (busy) return;

    void onFileSelect(file);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    event.currentTarget.value = "";
    selectFile(file);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = busy ? "none" : "copy";

    if (busy) return;

    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;

    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    inputRef.current?.click();
  };

  return (
    <div
      role="button"
      tabIndex={busy ? -1 : 0}
      aria-disabled={busy}
      onClick={() => inputRef.current?.click()}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`admin-file-upload min-h-32 justify-center text-center ${busy ? "pointer-events-none opacity-50" : ""} ${isDragging ? "border-primary bg-primary-tint text-primary-dark" : ""}`}
    >
      <UploadIcon className="h-5 w-5 shrink-0" />
      <div className="min-w-0">
        <div className="text-sm font-black text-stone-800">
          {getDropzoneLabel({ busy, isDragging })}
        </div>
        <div className="mt-1 text-xs font-semibold text-stone-400">
          Images up to 5 MB. Videos up to 100 MB.
        </div>
      </div>
      <input
        ref={inputRef}
        onChange={handleChange}
        disabled={busy}
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v"
      />
    </div>
  );
}

function MediaCard({
  media,
  copied,
  onCopy,
  onPreview,
}: {
  media: MediaItem;
  copied: boolean;
  onCopy: () => void;
  onPreview: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-[var(--radius-md)] border-2 border-stone-100 bg-white">
      <button
        type="button"
        onClick={onPreview}
        className="block w-full bg-stone-100 text-left"
      >
        <MediaThumbnail media={media} />
      </button>

      <div className="grid gap-3 p-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`admin-status-pill ${getMediaTypeClassName(media.mediaType)}`}>
              {media.mediaType}
            </span>
            <span className="text-xs font-semibold text-stone-400">{formatBytes(media.sizeBytes)}</span>
          </div>
          <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-stone-800">{media.fileName}</h3>
          <p className="mt-1 text-xs font-semibold text-stone-400">{formatDate(media.createdAt)}</p>
        </div>

        <button
          type="button"
          onClick={onCopy}
          className="admin-button-secondary w-full justify-center"
        >
          <CopyIcon className="h-3.5 w-3.5" />
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </article>
  );
}

function getDropzoneLabel({
  busy,
  isDragging,
}: {
  busy: boolean;
  isDragging: boolean;
}) {
  if (busy) return "Uploading media...";
  if (isDragging) return "Drop media here";

  return "Upload or drop media";
}

function MediaThumbnail({ media }: { media: MediaItem }) {
  const className = "h-40 w-full object-cover";

  if (media.mediaType === "image") {
    return <img src={media.url} alt={media.fileName} loading="lazy" className={className} />;
  }

  return (
    <div className="relative h-40 w-full bg-stone-900">
      <video src={media.url} preload="metadata" muted className={className} />
      <span className="absolute inset-0 flex items-center justify-center text-white">
        <PlayIcon className="h-10 w-10 rounded-full bg-stone-900/70 p-2" />
      </span>
    </div>
  );
}

function getMediaTypeClassName(mediaType: MediaItem["mediaType"]) {
  if (mediaType === "image") return "border-sky-200 bg-sky-50 text-sky-700";

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function MediaPreviewDialog({
  media,
  onClose,
}: {
  media: MediaItem | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(media)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[min(94vw,980px)] p-0">
        {media && (
          <div className="grid gap-4 p-4 sm:p-5">
            <div>
              <DialogTitle className="line-clamp-2 text-lg text-stone-900">{media.fileName}</DialogTitle>
              <DialogDescription className="mt-1 text-stone-500">
                {media.mediaType} · {formatBytes(media.sizeBytes)}
              </DialogDescription>
            </div>

            <div className="rounded-[var(--radius-md)] border-2 border-stone-100 bg-stone-50 p-2">
              {media.mediaType === "image" ? (
                <img
                  src={media.url}
                  alt={media.fileName}
                  className="max-h-[70dvh] w-full rounded-[var(--radius-sm)] object-contain"
                />
              ) : (
                <video
                  src={media.url}
                  controls
                  className="max-h-[70dvh] w-full rounded-[var(--radius-sm)] bg-stone-950"
                />
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-stone-100 p-4">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="admin-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-xs font-bold text-stone-400">
        Page {page} of {pageCount}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        className="admin-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

function getFilterLabel(type: MediaFilter) {
  if (type === "image") return "Images";
  if (type === "video") return "Videos";

  return "All";
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;

  const kb = value / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function makeAbsoluteUrl(url: string) {
  return new URL(url, window.location.origin).toString();
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 15V3m0 0L7 8m5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 17.5V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2.5M7 15l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="m10 8 6 4-6 4V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
