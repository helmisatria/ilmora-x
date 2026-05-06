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
    <main className="min-h-screen bg-stone-50 px-5 py-8 text-stone-900">
      <div className="mx-auto max-w-5xl">
        <a href="/admin" className="text-sm font-semibold text-[#205072]">Admin</a>
        <h1 className="mt-3 text-3xl font-bold">Insights</h1>
        <p className="mt-2 text-sm text-stone-500">Basic Milestone 1 metrics from real tables.</p>
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
    <div className="rounded-lg border border-stone-200 bg-white p-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 text-4xl font-bold">{value}</p>
    </div>
  );
}
