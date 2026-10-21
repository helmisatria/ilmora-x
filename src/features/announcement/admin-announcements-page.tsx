import { useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { AdminEmptyState } from "../../components/admin/AdminEmptyState";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPanelHeader } from "../../components/admin/AdminPanelHeader";
import { QuestionPictureField } from "../../components/admin/QuestionPictureField";
import { toDateTimeLocal } from "../premium-access/admin-payment-form-values";
import {
  deleteAnnouncementAdmin,
  listAnnouncementsAdmin,
  saveAnnouncementAdmin,
  setAnnouncementActiveAdmin,
} from "./admin-announcement-functions";
import {
  announcementPlacements,
  getAnnouncementStatus,
  isAnnouncementCtaUrl,
  isAnnouncementImageUrl,
  type AnnouncementPlacement,
  type AnnouncementStatus,
} from "./announcement-rules";

type AnnouncementRow = Awaited<ReturnType<typeof listAnnouncementsAdmin>>[number];

type AnnouncementFormValues = {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  placement: AnnouncementPlacement;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

const placementLabels: Record<AnnouncementPlacement, string> = {
  all: "Landing page and Student app",
  landing: "Landing page only",
  app: "Student app only",
};

const statusStyles: Record<AnnouncementStatus, string> = {
  live: "border-emerald-200 bg-emerald-50 text-emerald-700",
  scheduled: "border-sky-200 bg-sky-50 text-sky-700",
  expired: "border-stone-200 bg-stone-100 text-stone-500",
  disabled: "border-stone-200 bg-stone-100 text-stone-500",
};

const announcementFormSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1, "Title is required.").max(120, "Title must be 120 characters or fewer."),
  body: z.string().trim().min(1, "Message is required.").max(1000, "Message must be 1000 characters or fewer."),
  imageUrl: z.string().trim().max(1000, "Image link must be 1000 characters or fewer."),
  ctaLabel: z.string().trim().max(40, "Button label must be 40 characters or fewer."),
  ctaUrl: z.string().trim().max(500, "Button link must be 500 characters or fewer."),
  placement: z.enum(announcementPlacements),
  startsAt: z.string().trim().min(1, "Start time is required."),
  endsAt: z.string().trim().min(1, "End time is required."),
  active: z.boolean(),
}).superRefine((values, context) => {
  if (values.imageUrl && !isAnnouncementImageUrl(values.imageUrl)) {
    context.addIssue({ code: "custom", message: "Image link must start with /, http://, or https://.", path: ["imageUrl"] });
  }

  if (values.ctaLabel && !values.ctaUrl) {
    context.addIssue({ code: "custom", message: "Add a link for this button.", path: ["ctaUrl"] });
  }

  if (values.ctaUrl && !values.ctaLabel) {
    context.addIssue({ code: "custom", message: "Add a label for this button.", path: ["ctaLabel"] });
  }

  if (values.ctaUrl && !isAnnouncementCtaUrl(values.ctaUrl)) {
    context.addIssue({ code: "custom", message: "Link must start with / or https://.", path: ["ctaUrl"] });
  }

  const startsAt = new Date(values.startsAt);
  const endsAt = new Date(values.endsAt);

  if (Number.isNaN(startsAt.getTime())) {
    context.addIssue({ code: "custom", message: "Start time must be valid.", path: ["startsAt"] });
    return;
  }

  if (Number.isNaN(endsAt.getTime())) {
    context.addIssue({ code: "custom", message: "End time must be valid.", path: ["endsAt"] });
    return;
  }

  if (endsAt <= startsAt) {
    context.addIssue({ code: "custom", message: "End time must be after start time.", path: ["endsAt"] });
  }
});

export function AdminAnnouncementsPage({ announcements }: { announcements: AnnouncementRow[] }) {
  const router = useRouter();
  const routerRef = useRef(router);
  const [dialogAnnouncement, setDialogAnnouncement] = useState<AnnouncementRow | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [busyAction, setBusyAction] = useState("");

  routerRef.current = router;

  const refresh = useCallback(async () => {
    await routerRef.current.invalidate();
  }, []);

  const openDialog = (announcement: AnnouncementRow | null) => {
    setDialogAnnouncement(announcement);
    setDialogOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);

    if (!open) setDialogAnnouncement(null);
  };

  const saveAnnouncement = async (values: AnnouncementFormValues) => {
    setBusyAction("save");

    try {
      await saveAnnouncementAdmin({ data: makeSaveInput(values) });
      toast.success(values.active ? "Announcement saved and enabled." : "Announcement saved.");
      await refresh();
      return true;
    } catch {
      toast.error("Announcement was not saved. Check the fields and try again.");
      return false;
    } finally {
      setBusyAction("");
    }
  };

  const toggleAnnouncement = async (announcement: AnnouncementRow) => {
    setBusyAction(`toggle:${announcement.id}`);

    try {
      await setAnnouncementActiveAdmin({ data: { announcementId: announcement.id, active: !announcement.active } });
      toast.success(announcement.active ? "Announcement disabled." : "Announcement enabled. Other announcements were disabled.");
      await refresh();
    } catch {
      toast.error("Announcement status was not changed.");
    } finally {
      setBusyAction("");
    }
  };

  const deleteAnnouncement = async (announcement: AnnouncementRow) => {
    if (!window.confirm(`Remove announcement "${announcement.title}"?`)) return;

    setBusyAction(`delete:${announcement.id}`);

    try {
      await deleteAnnouncementAdmin({ data: { announcementId: announcement.id } });
      toast.success("Announcement removed.");
      await refresh();
    } catch {
      toast.error("Announcement was not removed.");
    } finally {
      setBusyAction("");
    }
  };

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane">
        <AdminPageHeader
          title="Announcements"
          description="Show a one-time modal on the landing page or Student dashboard. Only one announcement can be enabled at a time, and it only shows between its start and end time. Each Student sees it until they close it."
          backHref="/admin"
          backLabel="Admin"
        />

        <section className="admin-panel mt-6">
          <AdminPanelHeader
            title="Announcement"
            badge={<span className="admin-count">{announcements.length}</span>}
            description="Every announcement with its placement, schedule, and status."
            actions={
              <button className="admin-button-primary" onClick={() => openDialog(null)} type="button">
                Create Announcement
              </button>
            }
          />
          <AnnouncementList
            announcements={announcements}
            busyAction={busyAction}
            onDelete={deleteAnnouncement}
            onEdit={openDialog}
            onToggle={toggleAnnouncement}
          />
        </section>

        <AnnouncementDialog
          announcement={dialogAnnouncement}
          busy={busyAction === "save"}
          open={isDialogOpen}
          onOpenChange={handleOpenChange}
          onSave={saveAnnouncement}
        />
      </div>
    </main>
  );
}

function AnnouncementList({
  announcements,
  busyAction,
  onDelete,
  onEdit,
  onToggle,
}: {
  announcements: AnnouncementRow[];
  busyAction: string;
  onDelete: (announcement: AnnouncementRow) => void;
  onEdit: (announcement: AnnouncementRow) => void;
  onToggle: (announcement: AnnouncementRow) => void;
}) {
  if (announcements.length === 0) {
    return (
      <AdminEmptyState
        title="No announcements yet. Create one to show it to Students."
        description="An enabled announcement shows on the landing page or in the Student app."
      />
    );
  }

  return (
    <div>
      {announcements.map((announcement) => {
        const status = getAnnouncementStatus(announcement);

        return (
          <div
            key={announcement.id}
            className="admin-list-row flex flex-col gap-2 border-t border-stone-100 px-3 py-2.5 transition-colors duration-150 first:border-t-0 last:rounded-b-xl hover:bg-stone-50/70 sm:flex-row sm:items-center sm:gap-3 sm:px-4"
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              {announcement.imageUrl ? (
                <img
                  src={announcement.imageUrl}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-xl border border-stone-100 bg-stone-50 object-cover"
                />
              ) : (
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-100 bg-stone-50 text-stone-500"
                  aria-hidden="true"
                >
                  <MegaphoneIcon className="h-4 w-4" />
                </div>
              )}
              <div className="admin-list-content">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="line-clamp-2 break-words text-[13.5px] font-bold leading-5 text-stone-800">{announcement.title}</h3>
                  <span className={`admin-status-pill ${statusStyles[status]}`}>{status}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs font-medium text-stone-400">{announcement.body}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span className="admin-meta-tag">{placementLabels[announcement.placement]}</span>
                  <span className="admin-meta-tag">
                    {formatDateTime(announcement.startsAt)} to {formatDateTime(announcement.endsAt)}
                  </span>
                  <span className="admin-meta-tag">
                    {announcement.dismissedCount} {announcement.dismissedCount === 1 ? "Student" : "Students"}
                  </span>
                </div>
              </div>
            </div>

            <div className="admin-list-actions pl-12 sm:pl-0">
              <div className="admin-list-actions-bar">
                <button className="admin-button-ghost text-primary hover:bg-primary-tint" onClick={() => onEdit(announcement)} type="button">
                  Edit
                </button>
                <button
                  className="admin-button-ghost text-amber-600 hover:bg-amber-50"
                  disabled={busyAction === `toggle:${announcement.id}`}
                  onClick={() => onToggle(announcement)}
                  type="button"
                >
                  {announcement.active ? "Disable" : "Enable"}
                </button>
                <button
                  className="admin-button-ghost text-rose-600 hover:bg-rose-50"
                  disabled={busyAction === `delete:${announcement.id}`}
                  onClick={() => onDelete(announcement)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AnnouncementDialog({
  announcement,
  busy,
  open,
  onOpenChange,
  onSave,
}: {
  announcement: AnnouncementRow | null;
  busy: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: AnnouncementFormValues) => Promise<boolean>;
}) {
  const defaultValues = useMemo(() => makeFormDefaults(announcement), [announcement]);
  const form = useForm<AnnouncementFormValues>({ defaultValues });
  const [imageError, setImageError] = useState("");
  const resetRef = useRef(form.reset);

  resetRef.current = form.reset;

  useEffect(() => {
    if (!open) return;

    resetRef.current(defaultValues);
    setImageError("");
  }, [defaultValues, open]);

  const submit = form.handleSubmit(async (values) => {
    const result = announcementFormSchema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0];

        if (typeof field !== "string") continue;

        form.setError(field as keyof AnnouncementFormValues, { message: issue.message });
      }
      return;
    }

    const saved = await onSave(result.data);

    if (saved) {
      onOpenChange(false);
      return;
    }

    form.setError("root", { message: "Announcement was not saved. Check the fields and try again." });
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,760px)] max-w-[min(94vw,760px)]">
        <form className="flex min-h-0 flex-col" onSubmit={submit}>
          <DialogHeader className="border-b-2 border-stone-100 px-5 py-4 sm:px-6">
            <DialogTitle>{announcement ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
            <DialogDescription>
              Write the message, choose where it shows, and set when it starts and ends.
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 gap-5 overflow-y-auto p-5 sm:p-6">
            <Field label="Title" error={errors.title?.message}>
              <input className="admin-control" placeholder="Try-out Nasional dibuka!" {...form.register("title")} />
            </Field>

            <Field label="Message" error={errors.body?.message}>
              <textarea
                className="admin-control min-h-32"
                placeholder="Ikuti try-out nasional minggu ini dan lihat peringkatmu."
                {...form.register("body")}
              />
            </Field>

            <div>
              <Controller
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <QuestionPictureField
                    label="Image (optional)"
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      form.clearErrors("imageUrl");
                    }}
                    onError={setImageError}
                  />
                )}
              />
              {(imageError || errors.imageUrl?.message) && (
                <span className="mt-2 block text-xs font-semibold text-rose-600">{imageError || errors.imageUrl?.message}</span>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Button label (optional)" error={errors.ctaLabel?.message}>
                <input className="admin-control" placeholder="Lihat Try-out" {...form.register("ctaLabel")} />
              </Field>
              <Field label="Button link (optional)" error={errors.ctaUrl?.message}>
                <input className="admin-control" placeholder="/tryout or https://..." {...form.register("ctaUrl")} />
              </Field>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Shown on" error={errors.placement?.message}>
                <select className="admin-control" {...form.register("placement")}>
                  {announcementPlacements.map((placement) => (
                    <option key={placement} value={placement}>{placementLabels[placement]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Starts at" error={errors.startsAt?.message}>
                <input className="admin-control" type="datetime-local" {...form.register("startsAt")} />
              </Field>
              <Field label="Ends at" error={errors.endsAt?.message}>
                <input className="admin-control" type="datetime-local" {...form.register("endsAt")} />
              </Field>
            </div>

            <label className="flex items-start gap-3 rounded-[var(--radius-md)] border-2 border-stone-100 px-3 py-3 text-sm font-bold text-stone-600">
              <input className="mt-0.5" type="checkbox" {...form.register("active")} />
              <span>
                Enabled
                <span className="mt-0.5 block text-xs font-semibold text-stone-400">
                  Enabling this announcement disables any other enabled announcement.
                </span>
              </span>
            </label>

            {errors.root?.message && (
              <p className="rounded-[var(--radius-md)] bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                {errors.root.message}
              </p>
            )}
          </div>

          <DialogFooter className="border-t-2 border-stone-100 px-5 py-4 sm:px-6">
            <button className="admin-button-secondary" onClick={() => onOpenChange(false)} type="button">
              Cancel
            </button>
            <button className="admin-button-primary" disabled={busy || form.formState.isSubmitting} type="submit">
              {announcement ? "Update Announcement" : "Create Announcement"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-stone-600">{label}</span>
      {children}
      {error && <span className="mt-2 block text-xs font-semibold text-rose-600">{error}</span>}
    </label>
  );
}

function makeFormDefaults(announcement: AnnouncementRow | null): AnnouncementFormValues {
  if (announcement) {
    return {
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      imageUrl: announcement.imageUrl ?? "",
      ctaLabel: announcement.ctaLabel ?? "",
      ctaUrl: announcement.ctaUrl ?? "",
      placement: announcement.placement,
      startsAt: toDateTimeLocal(announcement.startsAt),
      endsAt: toDateTimeLocal(announcement.endsAt),
      active: announcement.active,
    };
  }

  const now = new Date();
  const nextWeek = new Date(now);

  nextWeek.setDate(nextWeek.getDate() + 7);

  return {
    id: "",
    title: "",
    body: "",
    imageUrl: "",
    ctaLabel: "",
    ctaUrl: "",
    placement: "all",
    startsAt: toDateTimeLocal(now.toISOString()),
    endsAt: toDateTimeLocal(nextWeek.toISOString()),
    active: true,
  };
}

function makeSaveInput(values: AnnouncementFormValues) {
  return {
    id: values.id || undefined,
    title: values.title,
    body: values.body,
    imageUrl: values.imageUrl || null,
    ctaLabel: values.ctaLabel || null,
    ctaUrl: values.ctaUrl || null,
    placement: values.placement,
    startsAt: new Date(values.startsAt).toISOString(),
    endsAt: new Date(values.endsAt).toISOString(),
    active: values.active,
  };
}

function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M3 11v2a2 2 0 0 0 2 2h1l2 5h2l-1.5-5H10l8 4V6l-8 4H5a2 2 0 0 0-2 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
