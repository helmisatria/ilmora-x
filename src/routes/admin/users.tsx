import { createFileRoute, Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  addAdminAdmin,
  listAdminsAdmin,
  listStudentsAdmin,
  removeAdminAdmin,
  setStudentStatusAdmin,
  startStudentImpersonationAdmin,
} from "../../lib/admin-functions";

type AdminRow = Awaited<ReturnType<typeof listAdminsAdmin>>[number];
type StudentRow = Awaited<ReturnType<typeof listStudentsAdmin>>[number];

export const Route = createFileRoute("/admin/users")({
  loader: async () => {
    const [students, admins] = await Promise.all([
      listStudentsAdmin(),
      listAdminsAdmin(),
    ]);

    return { students, admins };
  },
  head: () => ({
    meta: [
      { title: "Users — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const location = useLocation();

  if (location.pathname !== "/admin/users") {
    return <Outlet />;
  }

  const { students, admins } = Route.useLoaderData() as {
    students: StudentRow[];
    admins: AdminRow[];
  };
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState("");
  const [adminRole, setAdminRole] = useState<"admin" | "super_admin">("admin");
  const [busyAction, setBusyAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const refresh = async () => {
    await router.invalidate();
  };

  const handleSetStudentStatus = async (studentUserId: string, status: "active" | "suspended") => {
    setBusyAction(`student:${studentUserId}`);
    setErrorMessage("");

    try {
      await setStudentStatusAdmin({ data: { studentUserId, status } });
      await refresh();
    } catch {
      setErrorMessage("Student status was not updated.");
    } finally {
      setBusyAction("");
    }
  };

  const handleAddAdmin = async () => {
    if (!adminEmail.trim()) return;

    setBusyAction("add-admin");
    setErrorMessage("");

    try {
      await addAdminAdmin({ data: { email: adminEmail, role: adminRole } });
      setAdminEmail("");
      await refresh();
    } catch {
      setErrorMessage("Admin was not added. Only Super-admins can manage admins.");
    } finally {
      setBusyAction("");
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    setBusyAction(`admin:${email}`);
    setErrorMessage("");

    try {
      await removeAdminAdmin({ data: { email } });
      await refresh();
    } catch {
      setErrorMessage("Admin was not removed. Only Super-admins can manage admins.");
    } finally {
      setBusyAction("");
    }
  };

  const handleImpersonateStudent = async (studentUserId: string) => {
    setBusyAction(`impersonate:${studentUserId}`);
    setErrorMessage("");

    try {
      const result = await startStudentImpersonationAdmin({ data: { studentUserId } });

      window.location.assign(result.redirectTo);
    } catch {
      setErrorMessage("Impersonation was not started.");
      setBusyAction("");
    }
  };

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane">
        <Header title="Users" description="Manage Student access and Admin whitelist membership." />

        {errorMessage && (
          <p className="admin-alert">
            {errorMessage}
          </p>
        )}

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Admin whitelist</h2>
          </div>

          <div className="grid gap-4 border-b border-stone-100 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_180px_120px]">
            <input
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
              className="admin-control"
              placeholder="admin@example.com"
              type="email"
            />
            <select
              value={adminRole}
              onChange={(event) => setAdminRole(event.target.value as "admin" | "super_admin")}
              className="admin-control"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super-admin</option>
            </select>
            <button
              onClick={handleAddAdmin}
              disabled={busyAction === "add-admin"}
              className="admin-button-primary"
              type="button"
            >
              Add
            </button>
          </div>

          <div>
            {admins.map((admin) => (
              <div key={`${admin.email}:${admin.createdAt}`} className="admin-list-row">
                <div className="admin-list-content">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-[15px] font-bold text-stone-800 tracking-tight">{admin.email}</h3>
                    <RoleBadge role={admin.role} />
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-stone-400">Added {formatDate(admin.createdAt)}</p>
                </div>

                <div className="admin-list-actions">
                  <StatusPill status={admin.active ? "active" : "removed"} />
                  <div className="admin-list-actions-bar">
                    <button
                      onClick={() => handleRemoveAdmin(admin.email)}
                      disabled={!admin.active || busyAction === `admin:${admin.email}`}
                      className="admin-button-ghost text-red-600 hover:text-red-700 hover:bg-red-50"
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {admins.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-stone-400">No admins found yet.</p>
              </div>
            )}
          </div>
        </section>

        <section className="admin-panel mt-6">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Students</h2>
          </div>

          <div>
            {students.map((student) => {
              const nextStatus = student.status === "suspended" ? "active" : "suspended";
              const buttonLabel = student.status === "suspended" ? "Unsuspend" : "Suspend";
              const isSuspendingSelf = student.isCurrentSessionUser && nextStatus === "suspended";

              return (
                <div key={student.userId} className="admin-list-row">
                  <div className="admin-list-content">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        to="/admin/users/$studentId"
                        params={{ studentId: student.userId }}
                        className="text-[15px] font-bold tracking-tight text-stone-800 no-underline hover:text-primary"
                      >
                        {student.displayName || student.name}
                      </Link>
                      <StatusPill status={student.status} />
                    </div>
                    <p className="mt-1 text-sm text-stone-500">{student.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="admin-meta-tag first:before:hidden">{student.institution || "No institution"}</span>
                      <span className="admin-meta-tag">Joined {formatDate(student.joinedAt)}</span>
                    </div>
                  </div>

                  <div className="admin-list-actions">
                    <Link
                      to="/admin/users/$studentId"
                      params={{ studentId: student.userId }}
                      className="admin-button-ghost text-primary no-underline hover:bg-primary-tint hover:text-primary-dark"
                    >
                      Evaluation
                    </Link>
                    <button
                      onClick={() => handleImpersonateStudent(student.userId)}
                      disabled={student.status === "suspended" || busyAction === `impersonate:${student.userId}`}
                      className="admin-button-ghost text-primary hover:text-primary-dark hover:bg-primary-tint"
                      type="button"
                    >
                      Impersonate
                    </button>
                    <button
                      onClick={() => handleSetStudentStatus(student.userId, nextStatus)}
                      disabled={isSuspendingSelf || busyAction === `student:${student.userId}`}
                      className={`admin-button-ghost ${student.status === "suspended" ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"}`}
                      type="button"
                    >
                      {buttonLabel}
                    </button>
                  </div>
                </div>
              );
            })}

            {students.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-stone-400">No Students found yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Header({ title, description }: { title: string; description: string }) {
  return (
    <header className="admin-header">
      <a href="/admin" className="admin-back-link">Admin</a>
      <h1 className="admin-title">{title}</h1>
      <p className="admin-description">{description}</p>
    </header>
  );
}

function StatusPill({ status }: { status: "active" | "suspended" | "removed" }) {
  const config = {
    active: {
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      label: "Active",
    },
    suspended: {
      className: "border-red-200 bg-red-50 text-red-700",
      label: "Suspended",
    },
    removed: {
      className: "border-stone-200 bg-stone-100 text-stone-500",
      label: "Removed",
    },
  };

  const { className, label } = config[status];

  return (
    <span className={`admin-status-pill ${className}`}>
      {label}
    </span>
  );
}

function RoleBadge({ role }: { role: "admin" | "super_admin" }) {
  const isSuper = role === "super_admin";

  return (
    <span className={`admin-status-pill ${isSuper ? "border-primary-soft bg-primary-tint text-primary" : "border-stone-200 bg-stone-100 text-stone-600"}`}>
      {isSuper ? "Super-admin" : "Admin"}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
