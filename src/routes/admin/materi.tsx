import { createFileRoute } from "@tanstack/react-router";
import { getAdminContentCounts } from "../../lib/admin-functions";

export const Route = createFileRoute("/admin/materi")({
  loader: async () => getAdminContentCounts(),
  head: () => ({ meta: [{ title: "Materi — IlmoraX Admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminMateriPage,
});

function AdminMateriPage() {
  const counts = Route.useLoaderData();

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane-narrow">
        <header className="admin-header">
          <a href="/admin" className="admin-back-link">Admin</a>
          <h1 className="admin-title">Materi</h1>
          <p className="admin-description">Markdown, YouTube URL, PDF key, access level, and publish controls come next.</p>
        </header>
        <div className="admin-panel mt-6 p-5">
          <p className="admin-kicker">Materi records</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-stone-800">{counts.materi}</p>
        </div>
      </div>
    </main>
  );
}
