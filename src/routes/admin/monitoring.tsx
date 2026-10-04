import { createFileRoute, Link } from "@tanstack/react-router";
import { LockClosedIcon } from "@radix-ui/react-icons";
import {
  AdminMonitoringPage,
  type QueueMonitoring,
} from "../../features/admin/admin-monitoring-page";
import { getQueueMonitoringAdmin } from "../../features/admin/admin-monitoring-functions";

export const Route = createFileRoute("/admin/monitoring")({
  loader: async ({ context }) => {
    if (context.viewer?.admin?.role !== "super_admin") return null;

    return getQueueMonitoringAdmin();
  },
  head: () => ({
    meta: [
      { title: "Monitoring — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminMonitoringRoute,
});

function AdminMonitoringRoute() {
  const monitoring = Route.useLoaderData();

  if (!monitoring) return <MonitoringAccessDenied />;

  return (
    <AdminMonitoringPage monitoring={monitoring as QueueMonitoring} />
  );
}

function MonitoringAccessDenied() {
  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane-narrow">
        <header className="admin-header">
          <Link to="/admin" className="admin-back-link">Admin</Link>
          <h1 className="admin-title">Monitoring</h1>
          <p className="admin-description">Weekly Leaderboard finalization and queue status.</p>
        </header>
        <section className="admin-panel mt-6 max-w-xl p-6 sm:p-8">
          <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary-tint text-primary">
            <LockClosedIcon width="24" height="24" className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-stone-800">Super Admin access required</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            Your Admin account can manage content, Badges, and Leaderboard settings. Monitoring and weekly finalization require a Super Admin.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">Ask a Super Admin to review queues or repair a finalized week.</p>
          <Link to="/admin" className="admin-button-primary mt-5">Back to Admin</Link>
        </section>
      </div>
    </main>
  );
}
