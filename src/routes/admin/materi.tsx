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
    <main className="min-h-screen bg-stone-50 px-5 py-8 text-stone-900">
      <div className="mx-auto max-w-5xl">
        <a href="/admin" className="text-sm font-semibold text-[#205072]">Admin</a>
        <h1 className="mt-3 text-3xl font-bold">Materi</h1>
        <p className="mt-2 text-sm text-stone-500">Markdown, YouTube URL, PDF key, access level, and publish controls come next.</p>
        <div className="mt-6 rounded-lg border border-stone-200 bg-white p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Materi records</p>
          <p className="mt-2 text-4xl font-bold">{counts.materi}</p>
        </div>
      </div>
    </main>
  );
}
