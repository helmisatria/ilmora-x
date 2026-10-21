import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPanelHeader } from "../../components/admin/AdminPanelHeader";
import { finaliseWeeklyLeaderboardAdmin, getQueueMonitoringAdmin } from "./admin-monitoring-functions";

export type QueueMonitoring = Awaited<ReturnType<typeof getQueueMonitoringAdmin>>;
type QueueRow = QueueMonitoring["queues"][number];
type ScheduleRow = QueueMonitoring["schedules"][number];
type WeekRow = QueueMonitoring["finalization"]["recentWeeks"][number];

export function AdminMonitoringPage({ monitoring }: { monitoring: QueueMonitoring }) {
  const totalQueued = monitoring.queues.reduce((sum, queue) => sum + queue.queuedCount, 0);
  const totalActive = monitoring.queues.reduce((sum, queue) => sum + queue.activeCount, 0);
  const totalFailed = monitoring.queues.reduce((sum, queue) => sum + queue.failedCount, 0);

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane">
        <AdminPageHeader
          title="Monitoring"
          description="Weekly Leaderboard finalization and optional pg-boss queues."
          actions={<StatusPill active={!monitoring.finalization.needsFinalization} />}
        />

        <section className="admin-panel mt-6">
          <AdminPanelHeader
            title="Weekly Leaderboard"
            description="Finalize the previous week and rerun it from its saved snapshot."
          />
          <div className="grid gap-4 p-4">
            <div>
              <h2 className="text-[13.5px] font-bold text-stone-800">
                {monitoring.finalization.needsFinalization ? "Previous week has no snapshot" : "Previous week finalized"}
              </h2>
              <p className="mt-1 text-xs font-semibold text-stone-500">
                Expected week: {monitoring.finalization.expectedWeek}. Latest snapshot: {monitoring.finalization.latestWeek ?? "none"}.
              </p>
              {monitoring.finalization.finalizedAt && (
                <p className="mt-0.5 text-xs font-semibold text-stone-500">
                  Finalized {formatDate(monitoring.finalization.finalizedAt)} · {monitoring.finalization.rankedStudentCount} ranked Students.
                </p>
              )}
            </div>
            <p className="admin-note">
              Railway is configured to run the finalization command every Monday at 00:05 WIB. Check the Railway
              leaderboard-cron service for run logs; this page confirms the database result.
            </p>
            <WeeklyFinalizationTable weeks={monitoring.finalization.recentWeeks} />
          </div>
        </section>

        {!monitoring.installed ? (
          <section className="admin-panel mt-6">
            <AdminPanelHeader
              title="Optional pg-boss worker"
              description="No pg-boss queues are configured. This does not indicate whether the separate Railway cron ran. Use the snapshot above to check its result."
            />
          </section>
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Queues" value={monitoring.queues.length} />
              <Metric label="Schedules" value={monitoring.schedules.length} />
              <Metric label="Queued" value={totalQueued} />
              <Metric label="Failed" value={totalFailed} tone={totalFailed > 0 ? "danger" : "default"} />
            </div>

            <div className="mt-6 grid items-start gap-4 lg:grid-cols-[1fr_1.35fr]">
              <SchedulePanel schedules={monitoring.schedules} />
              <QueuePanel queues={monitoring.queues} totalActive={totalActive} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function WeeklyFinalizationTable({ weeks }: { weeks: WeekRow[] }) {
  const router = useRouter();
  const [busyWeek, setBusyWeek] = useState<string | null>(null);

  const finaliseWeek = async (week: WeekRow) => {
    setBusyWeek(week.weekStartDate);

    try {
      const result = await finaliseWeeklyLeaderboardAdmin({ data: { weekStartDate: week.weekStartDate } });
      const action = week.snapshot ? "Rerun finished" : "Week finalized";

      toast.success(`${action} for ${week.weekStartDate}. ${result.awardedBadgeCount} new Badges awarded.`);
      await router.invalidate();
    } catch {
      toast.error(`Finalization failed for ${week.weekStartDate}. Check the server logs and try again.`);
    } finally {
      setBusyWeek(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-stone-100">
      <table className="admin-table min-w-full">
        <thead>
          <tr>
            <th>Week</th>
            <th>Snapshot</th>
            <th>Ranked</th>
            <th>Top-N Badges</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.weekStartDate}>
              <td className="font-bold text-stone-800">{week.weekStartDate}</td>
              <td className="font-semibold text-stone-500">
                {week.snapshot ? formatDate(week.snapshot.finalizedAt) : <span className="text-amber-700">Not finalized</span>}
              </td>
              <td className="font-semibold text-stone-600">
                {week.snapshot ? (
                  <>
                    {week.snapshot.rankedStudentCount}
                    {!week.snapshot.thresholdMet && (
                      <span className="ml-1 text-xs text-stone-400">(below {week.snapshot.participantThreshold}, no awards)</span>
                    )}
                  </>
                ) : "-"}
              </td>
              <td className="font-bold text-stone-700">{week.snapshot ? week.snapshot.topNBadgeCount : "-"}</td>
              <td className="text-right">
                <button
                  className={week.snapshot ? "admin-button-secondary px-3 text-xs" : "admin-button-primary px-3 text-xs"}
                  disabled={busyWeek !== null}
                  onClick={() => finaliseWeek(week)}
                  type="button"
                >
                  {busyWeek === week.weekStartDate ? "Running..." : week.snapshot ? "Rerun" : "Finalize"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-stone-100 px-4 py-3 text-xs font-semibold text-stone-400">
        Rerun only fills missing Top-N Badges from the saved snapshot. It never changes ranks or gives a Badge twice.
      </p>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  const label = active ? "Previous week finalized" : "Finalization needed";
  const className = active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${className}`}>
      {label}
    </span>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "danger";
}) {
  const valueClass = tone === "danger" ? "text-rose-600" : "text-stone-800";

  return (
    <div className="admin-stat">
      <p className="admin-stat-label">{label}</p>
      <p className={`admin-stat-value ${valueClass}`}>{value}</p>
    </div>
  );
}

function SchedulePanel({ schedules }: { schedules: ScheduleRow[] }) {
  return (
    <section className="admin-panel overflow-hidden">
      <AdminPanelHeader
        title="Schedules"
        badge={<span className="admin-count">{schedules.length}</span>}
        description="Registered cron jobs."
      />

      {schedules.length === 0 ? (
        <p className="p-6 text-sm font-semibold text-stone-400">No scheduled jobs registered.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="admin-table min-w-full">
            <thead>
              <tr>
                <th>Queue</th>
                <th>Cron</th>
                <th>Timezone</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={`${schedule.name}:${schedule.key}`}>
                  <td>
                    <p className="admin-table-title">{schedule.name}</p>
                    {schedule.key ? <p className="admin-table-meta">{schedule.key}</p> : null}
                  </td>
                  <td className="font-semibold text-stone-600">{schedule.cron}</td>
                  <td className="font-semibold text-stone-600">{schedule.timezone ?? "Server default"}</td>
                  <td className="font-semibold text-stone-500">{formatDate(schedule.updatedOn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function QueuePanel({ queues, totalActive }: { queues: QueueRow[]; totalActive: number }) {
  return (
    <section className="admin-panel overflow-hidden">
      <AdminPanelHeader
        title="Queues"
        badge={<span className="admin-count">{queues.length}</span>}
        description={`${totalActive} active`}
      />

      {queues.length === 0 ? (
        <p className="p-6 text-sm font-semibold text-stone-400">No queues registered.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="admin-table min-w-full">
            <thead>
              <tr>
                <th>Queue</th>
                <th>Queued</th>
                <th>Active</th>
                <th>Completed</th>
                <th>Failed</th>
                <th>Oldest queued</th>
              </tr>
            </thead>
            <tbody>
              {queues.map((queue) => (
                <tr key={queue.name}>
                  <td>
                    <p className="admin-table-title">{queue.name}</p>
                    <p className="admin-table-meta">{queue.policy}</p>
                  </td>
                  <NumberCell value={queue.queuedCount} />
                  <NumberCell value={queue.activeCount} />
                  <NumberCell value={queue.completedCount} />
                  <NumberCell value={queue.failedCount} danger={queue.failedCount > 0} />
                  <td className="font-semibold text-stone-500">{formatDate(queue.oldestQueuedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function NumberCell({ value, danger = false }: { value: number; danger?: boolean }) {
  const className = danger ? "text-rose-600" : "text-stone-700";

  return <td className={`font-bold tabular-nums ${className}`}>{value}</td>;
}

function formatDate(value: Date | string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}
