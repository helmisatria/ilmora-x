import { createFileRoute } from "@tanstack/react-router";
import { getAdminContentCounts } from "../../lib/admin-functions";

export const Route = createFileRoute("/admin/questions")({
  loader: async () => getAdminContentCounts(),
  head: () => ({ meta: [{ title: "Questions — IlmoraX Admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminQuestionsPage,
});

function AdminQuestionsPage() {
  const counts = Route.useLoaderData();

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8 text-stone-900">
      <div className="mx-auto max-w-5xl">
        <a href="/admin" className="text-sm font-semibold text-[#205072]">Admin</a>
        <h1 className="mt-3 text-3xl font-bold">Questions</h1>
        <p className="mt-2 text-sm text-stone-500">Question bank management and Excel import will build on this page.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Metric label="Questions" value={counts.questions} />
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
