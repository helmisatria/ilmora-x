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
  { label: "Users", to: "/admin/users", description: "Student accounts, status, and profile details.", icon: UsersIcon },
  { label: "Try-outs", to: "/admin/tryouts", description: "Assessment setup, publishing, and question assignment.", icon: BookIcon },
  { label: "Questions", to: "/admin/questions", description: "Question bank, explanations, and access level.", icon: PuzzleIcon },
  { label: "Materi", to: "/admin/materi", description: "Study content, videos, and PDF references.", icon: DocumentIcon },
  { label: "Reports", to: "/admin/reports", description: "Question reports from Students.", icon: FlagIcon },
  { label: "Insights", to: "/admin/insights", description: "Basic platform metrics for Milestone 1.", icon: ChartIcon },
] as const;

function AdminHome() {
  const location = useLocation();

  if (location.pathname !== "/admin") {
    return <Outlet />;
  }

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane-narrow">
        <header className="admin-header flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="admin-kicker">IlmoraX CMS</p>
            <h1 className="admin-title">Admin</h1>
            <p className="admin-description">
              Operate content, users, and platform signals from one focused workspace.
            </p>
          </div>
          <Link to="/dashboard" className="admin-button-secondary w-fit no-underline">
            Open Student App
          </Link>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {adminSections.map((section) => {
            const Icon = section.icon;

            return (
              <Link
                preload="intent"
                key={section.to}
                to={section.to}
                className="admin-panel group p-5 no-underline transition-all duration-200 hover:shadow-md hover:-translate-y-[2px]"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-stone-100 bg-stone-50 text-stone-500 transition-colors group-hover:border-primary-soft group-hover:bg-primary-soft/30 group-hover:text-primary">
                    <Icon className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-[15px] font-bold tracking-tight text-stone-800 group-hover:text-primary transition-colors">{section.label}</h2>
                    <p className="mt-1 text-sm font-semibold leading-relaxed text-stone-500">{section.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M5 4.8A2.8 2.8 0 0 1 7.8 2H19v17H7.8A2.8 2.8 0 0 0 5 21.8v-17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 18.2A2.8 2.8 0 0 1 7.8 15H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PuzzleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V6.5L15.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 2v5h5M9 15h6M9 11h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6M8 13h8M8 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M4 22V2l16 8-16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
