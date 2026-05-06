import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — IlmoraX" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminHome,
});

const adminSections = [
  { label: "Users", to: "/admin/users", description: "Student accounts, status, and profile details." },
  { label: "Try-outs", to: "/admin/tryouts", description: "Assessment setup, publishing, and question assignment." },
  { label: "Questions", to: "/admin/questions", description: "Question bank, explanations, and access level." },
  { label: "Materi", to: "/admin/materi", description: "Study content, videos, and PDF references." },
  { label: "Reports", to: "/admin/reports", description: "Question reports from Students." },
  { label: "Insights", to: "/admin/insights", description: "Basic platform metrics for Milestone 1." },
] as const;

function AdminHome() {
  const location = useLocation();

  if (location.pathname !== "/admin") {
    return <Outlet />;
  }

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8 text-stone-900">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex flex-col gap-3 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">IlmoraX CMS</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Admin</h1>
          </div>
          <Link to="/dashboard" className="text-sm font-semibold text-[#205072]">
            Open Student App
          </Link>
        </header>

        <section className="mt-6 grid gap-3 md:grid-cols-2">
          {adminSections.map((section) => (
            <Link
              preload="intent"
              key={section.to}
              to={section.to}
              className="rounded-lg border border-stone-200 bg-white p-5 no-underline shadow-sm transition hover:border-[#79b7d9]"
            >
              <h2 className="text-lg font-bold text-stone-900">{section.label}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">{section.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
