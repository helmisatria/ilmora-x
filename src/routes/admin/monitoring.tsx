import { createFileRoute } from "@tanstack/react-router";
import { getQueueMonitoringAdmin } from "../../lib/admin-functions";

type QueueMonitoring = Awaited<ReturnType<typeof getQueueMonitoringAdmin>>;
type QueueRow = QueueMonitoring["queues"][number];
type ScheduleRow = QueueMonitoring["schedules"][number];

export const Route = createFileRoute("/admin/monitoring")({
  loader: async () => getQueueMonitoringAdmin(),
  head: () => ({
    meta: [
      { title: "Monitoring — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminMonitoringPage,
});

function AdminMonitoringPage() {
  const monitoring = Route.useLoaderData() as QueueMonitoring;
  const totalQueued = monitoring.queues.reduce((sum, queue) => sum + queue.queuedCount, 0);
  const totalActive = monitoring.queues.reduce((sum, queue) => sum + queue.activeCount, 0);
  const totalFailed = monitoring.queues.reduce((sum, queue) => sum + queue.failedCount, 0);

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane-narrow">
        <header className="admin-header">
          <a href="/admin" className="admin-back-link">Admin</a>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="admin-title">Monitoring</h1>
              <p className="admin-description">pg-boss queues, schedules, and worker backlog.</p>
            </div>
            <StatusPill active={monitoring.installed} />
          </div>
        </header>

        {!monitoring.installed ? (
          <section className="admin-panel mt-6 p-6">
            <p className="admin-kicker">pg-boss</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-stone-800">Queue schema is not installed yet.</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-stone-500">
              Start the worker once with <code className="rounded bg-stone-100 px-1.5 py-0.5">pnpm run jobs:leaderboard</code>.
              The monitoring tables will appear after pg-boss creates its schema.
            </p>
          </section>
        ) : (
          <>
            <div className="mt-6 grid gap-3 md:grid-cols-4">
              <Metric label="Queues" value={monitoring.queues.length} />
              <Metric label="Schedules" value={monitoring.schedules.length} />
              <Metric label="Queued" value={totalQueued} />
              <Metric label="Failed" value={totalFailed} tone={totalFailed > 0 ? "danger" : "default"} />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.35fr]">
              <SchedulePanel schedules={monitoring.schedules} />
              <QueuePanel queues={monitoring.queues} totalActive={totalActive} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function StatusPill({ active }: { active: boolean }) {
  const label = active ? "pg-boss installed" : "pg-boss not installed";
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
    <div className="admin-panel p-5">
      <p className="admin-kicker">{label}</p>
      <p className={`mt-2 text-4xl font-bold tracking-tight ${valueClass}`}>{value}</p>
    </div>
  );
}

function SchedulePanel({ schedules }: { schedules: ScheduleRow[] }) {
  return (
    <section className="admin-panel overflow-hidden">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Schedules</h2>
      </div>

      {schedules.length === 0 ? (
        <p className="p-6 text-sm font-semibold text-stone-400">No scheduled jobs registered.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-xs font-black uppercase tracking-[0.14em] text-stone-400">
              <tr>
                <th className="px-5 py-3">Queue</th>
                <th className="px-5 py-3">Cron</th>
                <th className="px-5 py-3">Timezone</th>
                <th className="px-5 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={`${schedule.name}:${schedule.key}`} className="border-b border-stone-100 last:border-b-0">
                  <td className="px-5 py-4 align-top">
                    <p className="font-black text-stone-800">{schedule.name}</p>
                    {schedule.key ? <p className="mt-1 text-xs font-semibold text-stone-400">{schedule.key}</p> : null}
                  </td>
                  <td className="px-5 py-4 align-top font-semibold text-stone-600">{schedule.cron}</td>
                  <td className="px-5 py-4 align-top font-semibold text-stone-600">{schedule.timezone ?? "Server default"}</td>
                  <td className="px-5 py-4 align-top font-semibold text-stone-500">{formatDate(schedule.updatedOn)}</td>
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
      <div className="admin-panel-header flex items-center justify-between gap-3">
        <h2 className="admin-panel-title">Queues</h2>
        <span className="text-xs font-black uppercase tracking-[0.14em] text-stone-400">{totalActive} active</span>
      </div>

      {queues.length === 0 ? (
        <p className="p-6 text-sm font-semibold text-stone-400">No queues registered.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-xs font-black uppercase tracking-[0.14em] text-stone-400">
              <tr>
                <th className="px-5 py-3">Queue</th>
                <th className="px-5 py-3">Queued</th>
                <th className="px-5 py-3">Active</th>
                <th className="px-5 py-3">Completed</th>
                <th className="px-5 py-3">Failed</th>
                <th className="px-5 py-3">Oldest queued</th>
              </tr>
            </thead>
            <tbody>
              {queues.map((queue) => (
                <tr key={queue.name} className="border-b border-stone-100 last:border-b-0">
                  <td className="px-5 py-4 align-top">
                    <p className="font-black text-stone-800">{queue.name}</p>
                    <p className="mt-1 text-xs font-semibold text-stone-400">{queue.policy}</p>
                  </td>
                  <NumberCell value={queue.queuedCount} />
                  <NumberCell value={queue.activeCount} />
                  <NumberCell value={queue.completedCount} />
                  <NumberCell value={queue.failedCount} danger={queue.failedCount > 0} />
                  <td className="px-5 py-4 align-top font-semibold text-stone-500">{formatDate(queue.oldestQueuedAt)}</td>
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

  return <td className={`px-5 py-4 align-top font-black ${className}`}>{value}</td>;
}

function formatDate(value: Date | string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}
