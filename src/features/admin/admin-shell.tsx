import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "../../components/ui/sidebar";
import { cn } from "../../utils/cn";

const adminSections = [
  { label: "Users", to: "/admin/users", description: "Student accounts, status, and profile details.", icon: UsersIcon },
  { label: "Try-outs", to: "/admin/tryouts", description: "Assessment setup, publishing, and question assignment.", icon: BookIcon },
  { label: "Payments", to: "/admin/payments", description: "Products, Coupons, manual grants, and checkout repair.", icon: PaymentIcon },
  { label: "Media", to: "/admin/media", description: "Reusable image and video links for Question review content.", icon: MediaIcon },
  { label: "Categories", to: "/admin/categories", description: "Three-level curriculum taxonomy for Questions and Materi links.", icon: TagsIcon },
  { label: "Polls", to: "/admin/polls", description: "Live classroom Poll Sessions, rounds, and history.", icon: SignalIcon },
  { label: "Reports", to: "/admin/reports", description: "Question reports from Students.", icon: FlagIcon },
  { label: "Insights", to: "/admin/insights", description: "Basic platform metrics for Milestone 1.", icon: ChartIcon },
  { label: "Monitoring", to: "/admin/monitoring", description: "pg-boss queue and schedule status for Super Admins.", icon: MonitorIcon },
] as const;

export function AdminShell() {
  const location = useLocation();
  const isOverview = location.pathname === "/admin";

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-sidebar-border bg-sidebar" collapsible="offcanvas">
        <SidebarHeader className="px-4 py-4">
          <Link to="/admin" className="group flex items-center gap-3 no-underline">
            <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-primary/15 bg-primary text-sm font-black text-white">
              IX
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black tracking-tight text-stone-800">IlmoraX</span>
              <span className="block text-[11px] font-bold uppercase tracking-wide text-stone-400">Admin workspace</span>
            </span>
          </Link>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent className="px-2 py-3">
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-[11px] font-black uppercase tracking-wide text-stone-400">
              Operate
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = isAdminSectionActive(location.pathname, section.to);

                  return (
                    <SidebarMenuItem key={section.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={section.label}
                        className={cn(
                          "h-10 rounded-[var(--radius-sm)] px-3 text-sm font-bold text-stone-600",
                          "hover:bg-primary-tint hover:text-primary-dark",
                          "data-[active=true]:border data-[active=true]:border-primary/10 data-[active=true]:bg-primary-soft data-[active=true]:text-primary-dark",
                        )}
                      >
                        <Link preload="intent" to={section.to}>
                          <Icon className="size-4" />
                          <span>{section.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter className="px-4 py-4">
          <Link to="/dashboard" className="admin-button-secondary w-full justify-center px-3 py-2 text-xs no-underline">
            Open Student App
          </Link>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-screen bg-transparent">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-stone-200/80 bg-[#f7faf8]/92 px-4 backdrop-blur md:hidden">
          <SidebarTrigger className="size-9 rounded-[var(--radius-sm)] border border-stone-200 bg-white text-stone-700" />
          <div className="min-w-0">
            <div className="text-sm font-black text-stone-800">IlmoraX Admin</div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Workspace</div>
          </div>
        </div>

        {isOverview ? <AdminOverview /> : <Outlet />}
      </SidebarInset>
    </SidebarProvider>
  );
}

function AdminOverview() {
  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane-narrow">
        <header className="admin-header">
          <p className="admin-kicker">IlmoraX CMS</p>
          <h1 className="admin-title">Admin</h1>
          <p className="admin-description">
            Operate content, users, payments, and platform signals from one focused workspace.
          </p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {adminSections.map((section) => {
            const Icon = section.icon;

            return (
              <Link
                preload="intent"
                key={section.to}
                to={section.to}
                className="admin-panel group p-5 no-underline transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border-2 border-stone-100 bg-stone-50 text-stone-500 transition-colors group-hover:border-primary-soft group-hover:bg-primary-soft/30 group-hover:text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-[15px] font-bold tracking-tight text-stone-800 transition-colors group-hover:text-primary">{section.label}</h2>
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

function isAdminSectionActive(pathname: string, sectionPath: string) {
  if (pathname === sectionPath) return true;

  return pathname.startsWith(`${sectionPath}/`);
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

function TagsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function MediaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="m7 15 3-3 2.5 2.5L16 11l3 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8.5" cy="8.5" r="1.3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PaymentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 9h18M7 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 20h8M12 16v4M7 10h2l1.5-3 3 6 1.5-3h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SignalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M4 18.5a11.5 11.5 0 0 1 16 0M7.5 15a6.5 6.5 0 0 1 9 0M12 19h.1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 5v3M18.5 7.5l-2 2M5.5 7.5l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
