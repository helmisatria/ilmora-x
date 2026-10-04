import { useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { listBadgeSettingsAdmin, updateBadgeSettingsAdmin } from "./admin-badge-settings-functions";
import { AdminSettingsAuditList } from "./admin-settings-audit-list";

export type BadgeSettingsData = Awaited<ReturnType<typeof listBadgeSettingsAdmin>>;
type BadgeRow = BadgeSettingsData["badges"][number];

type BadgeFormValues = {
  displayName: string;
  requirementText: string;
  xpReward: string;
  active: boolean;
};

export function AdminBadgeSettingsPage({ data }: { data: BadgeSettingsData }) {
  const [editingBadge, setEditingBadge] = useState<BadgeRow | null>(null);
  const activeCount = data.badges.filter((badge) => badge.active).length;

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane">
        <header className="admin-header">
          <a href="/admin" className="admin-back-link">Admin</a>
          <h1 className="admin-title">Badge settings</h1>
          <p className="admin-description">
            {data.badges.length} Badges, {activeCount} active. Edits apply to future awards only.
          </p>
        </header>

        <section className="mt-6 rounded-[var(--radius-md)] border border-stone-200 bg-white px-4 py-3 text-[13px] font-semibold leading-relaxed text-stone-500">
          <p>
            <span className="font-bold text-stone-700">You can edit:</span> the name and requirement text Students see,
            the EXP reward for future awards, and whether a Badge can still be awarded.
          </p>
          <p className="mt-1">
            <span className="font-bold text-stone-700">Fixed in code:</span> Badge code, category, the unlock rule, and
            permanent EXP bonus tiers. Badges with a permanent bonus cannot be turned off.
          </p>
          <p className="mt-1">
            Earned Badges, their EXP, and popup state never change. A turned-off Badge stays in Students' collections if they
            already earned it.
          </p>
        </section>

        <div className="admin-panel mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-xs font-black uppercase tracking-[0.14em] text-stone-400">
              <tr>
                <th className="px-4 py-3">Badge</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Requirement</th>
                <th className="px-4 py-3 text-right">EXP</th>
                <th className="px-4 py-3 text-right">Bonus</th>
                <th className="px-4 py-3 text-right">Earned</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.badges.map((badge) => (
                <tr key={badge.code} className="border-b border-stone-100 last:border-b-0">
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl leading-none" aria-hidden="true">{badge.icon}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-stone-800">{badge.displayName}</div>
                        <div className="text-xs font-semibold text-stone-400">
                          {badge.code}
                          {badge.displayName !== badge.catalogName && <> · catalog: {badge.catalogName}</>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top font-semibold text-stone-500">{badge.category}</td>
                  <td className="max-w-[340px] px-4 py-3 align-top text-[13px] font-semibold text-stone-600">
                    {badge.requirementText}
                    {badge.requirementOverride && <EditedTag />}
                  </td>
                  <td className="px-4 py-3 text-right align-top font-black text-stone-700">
                    {badge.xpReward.toLocaleString("id-ID")}
                    {badge.xpReward !== badge.defaultXpReward && (
                      <div className="text-xs font-semibold text-stone-400">was {badge.defaultXpReward.toLocaleString("id-ID")}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right align-top font-semibold text-stone-500">
                    {badge.permanentXpBonusPercent ? `+${badge.permanentXpBonusPercent}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right align-top font-black text-stone-700">{badge.earnedCount.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`admin-status-pill ${badge.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-stone-50 text-stone-500"}`}
                    >
                      {badge.active ? "Active" : "Off"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <button className="admin-button-secondary px-3 text-xs" onClick={() => setEditingBadge(badge)} type="button">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AdminSettingsAuditList rows={data.audit} emptyText="No Admin has changed a Badge yet." />
      </div>

      <BadgeDialog badge={editingBadge} onClose={() => setEditingBadge(null)} />
    </main>
  );
}

function BadgeDialog({ badge, onClose }: { badge: BadgeRow | null; onClose: () => void }) {
  const router = useRouter();
  const [values, setValues] = useState<BadgeFormValues>(() => makeFormValues(badge));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setValues(makeFormValues(badge));
    setError("");
  }, [badge]);

  if (!badge) return null;

  const update = <TKey extends keyof BadgeFormValues>(key: TKey, value: BadgeFormValues[TKey]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const xpReward = values.xpReward.trim() === "" ? null : Number(values.xpReward);

    if (xpReward !== null && (!Number.isInteger(xpReward) || xpReward < 0)) {
      setError("EXP reward must be a whole number of 0 or more. Leave it empty to use the catalog value.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await updateBadgeSettingsAdmin({
        data: {
          badgeCode: badge.code,
          displayName: values.displayName,
          requirementText: values.requirementText,
          xpReward,
          active: values.active,
        },
      });
      toast.success(`${badge.code} saved.`);
      onClose();
      await router.invalidate();
    } catch {
      setError("Badge was not saved. Check the fields and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[min(94vw,640px)] max-w-[min(94vw,640px)]">
        <form className="flex min-h-0 flex-col" onSubmit={submit}>
          <DialogHeader className="border-b-2 border-stone-100 px-5 py-4 sm:px-6">
            <DialogTitle>
              {badge.icon} Edit {badge.code}
            </DialogTitle>
            <DialogDescription>
              {badge.category} Badge. The unlock rule stays: {badge.catalogRequirement}
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 gap-5 overflow-y-auto p-5 sm:p-6">
            <Field label="Name shown to Students" hint={`Leave empty to use "${badge.catalogName}".`}>
              <input
                className="admin-control"
                maxLength={60}
                onChange={(event) => update("displayName", event.target.value)}
                placeholder={badge.catalogName}
                value={values.displayName}
              />
            </Field>

            <Field label="Requirement text shown to Students" hint="Only the wording changes. Leave empty to use the default text.">
              <textarea
                className="admin-control min-h-20 py-2"
                maxLength={240}
                onChange={(event) => update("requirementText", event.target.value)}
                placeholder={badge.catalogRequirement}
                value={values.requirementText}
              />
            </Field>

            <Field label="EXP reward for future awards" hint={`Leave empty to use the catalog value (${badge.defaultXpReward}). Students who already earned it keep their EXP.`}>
              <input
                className="admin-control w-40"
                inputMode="numeric"
                min={0}
                onChange={(event) => update("xpReward", event.target.value)}
                placeholder={String(badge.defaultXpReward)}
                step={1}
                type="number"
                value={values.xpReward}
              />
            </Field>

            <label className="flex items-start gap-3 rounded-[var(--radius-md)] border-2 border-stone-100 px-3 py-3 text-sm font-bold text-stone-600">
              <input
                checked={values.active}
                className="mt-0.5"
                disabled={!badge.canDeactivate}
                onChange={(event) => update("active", event.target.checked)}
                type="checkbox"
              />
              <span>
                Active
                <span className="mt-0.5 block text-xs font-semibold text-stone-400">
                  {badge.canDeactivate
                    ? "When off, no new Student earns this Badge. Students who earned it keep it. Turning it back on awards it to Students who qualify on their next check."
                    : `Always on: this Badge gives a permanent +${badge.permanentXpBonusPercent}% EXP bonus, and bonus tiers are fixed.`}
                </span>
              </span>
            </label>

            {error && (
              <p className="rounded-[var(--radius-md)] bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p>
            )}
          </div>

          <DialogFooter className="border-t-2 border-stone-100 px-5 py-4 sm:px-6">
            <button className="admin-button-secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="admin-button-primary" disabled={busy} type="submit">
              {busy ? "Saving..." : "Save Badge"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-stone-400">{label}</span>
      {children}
      <span className="mt-1.5 block text-xs font-semibold text-stone-400">{hint}</span>
    </label>
  );
}

function EditedTag() {
  return (
    <span className="ml-1.5 inline-block rounded border border-sky-200 bg-sky-50 px-1 text-[10px] font-extrabold uppercase tracking-wide text-sky-700">
      Edited
    </span>
  );
}

function makeFormValues(badge: BadgeRow | null): BadgeFormValues {
  if (!badge) return { displayName: "", requirementText: "", xpReward: "", active: true };

  return {
    displayName: badge.displayName === badge.catalogName ? "" : badge.displayName,
    requirementText: badge.requirementOverride ?? "",
    xpReward: badge.xpReward === badge.defaultXpReward ? "" : String(badge.xpReward),
    active: badge.active,
  };
}
