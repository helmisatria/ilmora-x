import { createFileRoute } from "@tanstack/react-router";
import { getAdminContentCounts } from "../../lib/admin-functions";

export const Route = createFileRoute("/admin/tryouts")({
  loader: async () => getAdminContentCounts(),
  head: () => ({ meta: [{ title: "Try-outs — IlmoraX Admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminTryoutsPage,
});

function AdminTryoutsPage() {
  const counts = Route.useLoaderData();

  return <AdminSection title="Try-outs" count={counts.tryouts} description="Create, edit, publish, and unpublish Try-outs. Question assignment and ordering comes next." />;
}

function AdminSection({ title, count, description }: { title: string; count: number; description: string }) {
  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8 text-stone-900">
      <div className="mx-auto max-w-5xl">
        <a href="/admin" className="text-sm font-semibold text-[#205072]">Admin</a>
        <h1 className="mt-3 text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-stone-500">{description}</p>
        <div className="mt-6 rounded-lg border border-stone-200 bg-white p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Current records</p>
          <p className="mt-2 text-4xl font-bold">{count}</p>
        </div>
      </div>
    </main>
  );
}
