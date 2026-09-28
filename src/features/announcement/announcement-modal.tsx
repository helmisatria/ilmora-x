import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../components/ui/dialog";
import { dismissStudentAnnouncement, type LiveAnnouncement } from "./announcement-functions";

export function LandingAnnouncementModal({ announcement }: { announcement: LiveAnnouncement | null }) {
  const storageKey = announcement ? `ilmorax:announcement-dismissed:${announcement.id}` : "";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!storageKey) return;
    if (readStorage(storageKey)) return;

    setOpen(true);
  }, [storageKey]);

  if (!announcement) return null;

  const dismiss = () => {
    setOpen(false);
    writeStorage(storageKey);
  };

  return <AnnouncementModal announcement={announcement} open={open} onDismiss={dismiss} />;
}

export function StudentAnnouncementModal({ announcement }: { announcement: LiveAnnouncement | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (announcement) setOpen(true);
  }, [announcement]);

  if (!announcement) return null;

  const dismiss = () => {
    setOpen(false);
    void dismissStudentAnnouncement({ data: { announcementId: announcement.id } }).catch(() => undefined);
  };

  return <AnnouncementModal announcement={announcement} open={open} onDismiss={dismiss} />;
}

function AnnouncementModal({
  announcement,
  open,
  onDismiss,
}: {
  announcement: LiveAnnouncement;
  open: boolean;
  onDismiss: () => void;
}) {
  const isExternalLink = announcement.ctaUrl?.startsWith("https://") ?? false;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => open && !nextOpen && onDismiss()}>
      <DialogContent className="max-w-[min(92vw,460px)] text-left">
        <div className="min-h-0 overflow-y-auto">
          {announcement.imageUrl ? (
            <img
              src={announcement.imageUrl}
              alt=""
              className="block max-h-[45dvh] w-full border-b-2 border-stone-100 bg-stone-50 object-contain"
            />
          ) : (
            <div className="px-5 pt-6 sm:px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-primary/15 bg-primary-soft text-primary-dark">
                <MegaphoneIcon />
              </div>
            </div>
          )}
          <div className="px-5 pb-4 pt-4 sm:px-6">
            <DialogTitle className="text-[22px] font-black leading-tight text-stone-800">
              {announcement.title}
            </DialogTitle>
            <DialogDescription className="mt-3 whitespace-pre-line text-[14px] text-stone-600">
              {announcement.body}
            </DialogDescription>
          </div>
        </div>

        <div className="grid shrink-0 gap-2 border-t-2 border-stone-100 px-5 py-4 sm:grid-flow-col sm:px-6">
          <button className="btn btn-white min-h-12 w-full px-4 text-sm" onClick={onDismiss} type="button">
            {announcement.ctaUrl ? "Nanti" : "Mengerti"}
          </button>
          {announcement.ctaUrl && announcement.ctaLabel && (
            <a
              className="btn btn-primary min-h-12 w-full px-4 text-sm no-underline"
              href={announcement.ctaUrl}
              onClick={onDismiss}
              rel={isExternalLink ? "noopener noreferrer" : undefined}
              target={isExternalLink ? "_blank" : undefined}
            >
              {announcement.ctaLabel}
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeStorage(key: string) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // Storage can be blocked; the modal simply shows again next visit.
  }
}

function MegaphoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M3 10v4a1 1 0 0 0 1 1h3l6 4V5L7 9H4a1 1 0 0 0-1 1Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M17 8.5a5 5 0 0 1 0 7M19.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
