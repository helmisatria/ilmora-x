import { createFileRoute } from "@tanstack/react-router";
import { getAdminContentCounts } from "../../lib/admin-functions";

export const Route = createFileRoute("/admin/reports")({
  loader: async () => getAdminContentCounts(),
  head: () => ({ meta: [{ title: "Reports — IlmoraX Admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminReportsPage,
});

function AdminReportsPage() {
  const counts = Route.useLoaderData();

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8 text-stone-900">
      <div className="mx-auto max-w-5xl">
        <a href="/admin" className="text-sm font-semibold text-[#205072]">Admin</a>
        <h1 className="mt-3 text-3xl font-bold">Question reports</h1>
        <p className="mt-2 text-sm text-stone-500">Review, resolve, and dismiss Student question reports from this queue.</p>
        <div className="mt-6 rounded-lg border border-stone-200 bg-white p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Open reports</p>
          <p className="mt-2 text-4xl font-bold">{counts.openReports}</p>
        </div>
      </div>
    </main>
  );
}
