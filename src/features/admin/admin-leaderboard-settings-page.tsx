import { useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPanelHeader } from "../../components/admin/AdminPanelHeader";
import { getLeaderboardSettingsAdmin, updateLeaderboardSettingsAdmin } from "./admin-leaderboard-settings-functions";
import { AdminSettingsAuditList } from "./admin-settings-audit-list";

export type LeaderboardSettings = Awaited<ReturnType<typeof getLeaderboardSettingsAdmin>>;

const sourceLabels: Record<LeaderboardSettings["effective"]["source"], string> = {
  admin: "Admin setting",
  env: "WEEKLY_LEADERBOARD_PARTICIPANT_THRESHOLD env var",
  default: "Built-in default",
};

export function AdminLeaderboardSettingsPage({ settings }: { settings: LeaderboardSettings }) {
  const router = useRouter();
  const [threshold, setThreshold] = useState(String(settings.adminValue ?? settings.effective.value));
  const [busy, setBusy] = useState(false);
  const fallback = settings.envValue ? `env var (${settings.envValue})` : `default (${settings.defaultValue})`;

  const save = async (participantThreshold: number | null) => {
    setBusy(true);

    try {
      await updateLeaderboardSettingsAdmin({ data: { participantThreshold } });
      toast.success(participantThreshold === null ? `Admin setting removed. Using the ${fallback}.` : "Participant threshold saved.");
      await router.invalidate();
    } catch {
      toast.error("Threshold was not saved. Use a whole number of 1 or more.");
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const value = Number(threshold);

    if (!Number.isInteger(value) || value < 1) {
      toast.error("Use a whole number of 1 or more.");
      return;
    }

    void save(value);
  };

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane">
        <AdminPageHeader
          title="Leaderboard settings"
          description={
            <>
              Rules for the weekly Leaderboard. To repair a finalized week, use{" "}
              <a href="/admin/monitoring" className="font-bold text-primary">Monitoring</a>.
            </>
          }
        />

        <section className="admin-panel mt-6">
          <AdminPanelHeader
            title="Weekly participant threshold"
            description="Ranked Students needed before Top-N Badges are awarded."
          />

          <div className="grid gap-4 p-4">
            <div className="admin-stat">
              <p className="admin-stat-label">Active threshold</p>
              <p className="admin-stat-value text-3xl">{settings.effective.value}</p>
              <p className="mt-1 text-xs font-semibold text-stone-500">
                Source: <span className="font-bold text-stone-700">{sourceLabels[settings.effective.source]}</span>
                {settings.effective.source === "admin" && settings.adminUpdatedAt && (
                  <> · changed {formatDate(settings.adminUpdatedAt)}{settings.adminUpdatedByEmail ? ` by ${settings.adminUpdatedByEmail}` : ""}</>
                )}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-stone-400">
                Order used: Admin setting, then env var ({settings.envValue ?? "not set"}), then default ({settings.defaultValue}).
              </p>
            </div>

            <form className="flex flex-wrap items-end gap-3" onSubmit={submit}>
              <label className="block w-40">
                <span className="mb-1.5 block text-xs font-bold text-stone-600">New threshold</span>
                <input
                  className="admin-control"
                  inputMode="numeric"
                  min={1}
                  onChange={(event) => setThreshold(event.target.value)}
                  step={1}
                  type="number"
                  value={threshold}
                />
              </label>
              <button className="admin-button-primary" disabled={busy} type="submit">
                {busy ? "Saving..." : "Save threshold"}
              </button>
              {settings.adminValue !== null && (
                <button className="admin-button-secondary" disabled={busy} onClick={() => void save(null)} type="button">
                  Use {fallback}
                </button>
              )}
            </form>

            <p className="admin-note-warning">
              A change applies only to weeks finalized after saving. Weeks already finalized keep the threshold stored in their
              snapshot, including when you rerun them from Monitoring.
            </p>
          </div>
        </section>

        <AdminSettingsAuditList rows={settings.audit} emptyText="No Admin has changed the threshold yet." />
      </div>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}
