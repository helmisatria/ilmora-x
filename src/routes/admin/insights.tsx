import { createFileRoute } from "@tanstack/react-router";
import { getAdminContentCounts } from "../../lib/admin-functions";

export const Route = createFileRoute("/admin/insights")({
  loader: async () => getAdminContentCounts(),
  head: () => ({ meta: [{ title: "Insights — IlmoraX Admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminInsightsPage,
});

function AdminInsightsPage() {
  const counts = Route.useLoaderData();

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane-narrow">
        <header className="admin-header">
          <a href="/admin" className="admin-back-link">Admin</a>
          <h1 className="admin-title">Insights</h1>
          <p className="admin-description">Basic Milestone 1 metrics from real tables.</p>
        </header>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Metric label="Try-outs" value={counts.tryouts} />
          <Metric label="Questions" value={counts.questions} />
          <Metric label="Attempts" value={counts.attempts} />
          <Metric label="Categories" value={counts.categories} />
          <Metric label="Materi" value={counts.materi} />
          <Metric label="Open reports" value={counts.openReports} />
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-panel p-5">
      <p className="admin-kicker">{label}</p>
      <p className="mt-2 text-4xl font-bold tracking-tight text-stone-800">{value}</p>
    </div>
  );
}
