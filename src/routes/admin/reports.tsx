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
    <main className="admin-shell page-enter">
      <div className="admin-lane-narrow">
        <header className="admin-header">
          <a href="/admin" className="admin-back-link">Admin</a>
          <h1 className="admin-title">Question reports</h1>
          <p className="admin-description">Review, resolve, and dismiss Student question reports from this queue.</p>
        </header>
        <div className="admin-panel mt-6 p-5">
          <p className="admin-kicker">Open reports</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-stone-800">{counts.openReports}</p>
        </div>
      </div>
    </main>
  );
}
