import { Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AdminEmptyState } from "../../components/admin/AdminEmptyState";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPanelHeader } from "../../components/admin/AdminPanelHeader";
import { AdminSearchField } from "../../components/admin/AdminSearchField";
import { getSafeErrorMessage } from "../../lib/user-errors";
import {
  addAdminAdmin,
  listAdminsAdmin,
  listStudentsAdmin,
  removeAdminAdmin,
  setStudentStatusAdmin,
  startStudentImpersonationAdmin,
} from "./admin-user-functions";

export type AdminRow = Awaited<ReturnType<typeof listAdminsAdmin>>[number];
export type StudentRow = Awaited<ReturnType<typeof listStudentsAdmin>>[number];

const STUDENTS_PAGE_SIZE = 50;

const rowClassName = "admin-list-row flex flex-col gap-2 border-t border-stone-100 px-3 py-2.5 transition-colors duration-150 first:border-t-0 last:rounded-b-xl hover:bg-stone-50/70 sm:flex-row sm:items-center sm:gap-3 sm:px-4";

export function AdminUsersPage({
  students,
  admins,
}: {
  students: StudentRow[];
  admins: AdminRow[];
}) {
  const location = useLocation();
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState("");
  const [adminRole, setAdminRole] = useState<"admin" | "super_admin">("admin");
  const [busyAction, setBusyAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentStatus, setStudentStatus] = useState("all");
  const [studentAccess, setStudentAccess] = useState("all");
  const [studentLimit, setStudentLimit] = useState(STUDENTS_PAGE_SIZE);

  if (location.pathname !== "/admin/users") {
    return <Outlet />;
  }

  const activeAdminEmails = new Set(admins.filter((admin) => admin.active).map((admin) => admin.email.toLowerCase()));
  const normalizedQuery = studentQuery.trim().toLocaleLowerCase();
  const hasFilters = Boolean(normalizedQuery) || studentStatus !== "all" || studentAccess !== "all";
  const matchingStudents = students.filter((student) => {
    const matchesQuery = !normalizedQuery ||
      (student.displayName || student.name).toLocaleLowerCase().includes(normalizedQuery) ||
      student.email.toLocaleLowerCase().includes(normalizedQuery);
    const matchesStatus = studentStatus === "all" || student.status === studentStatus;
    const matchesAccess = studentAccess === "all" ||
      (studentAccess === "premium" ? student.hasPremiumMembership : !student.hasPremiumMembership);

    return matchesQuery && matchesStatus && matchesAccess;
  });
  const visibleStudents = matchingStudents.slice(0, studentLimit);
  const hiddenStudentCount = matchingStudents.length - visibleStudents.length;

  const changeFilter = (setFilter: (value: string) => void) => (value: string) => {
    setFilter(value);
    setStudentLimit(STUDENTS_PAGE_SIZE);
  };

  const resetFilters = () => {
    setStudentQuery("");
    setStudentStatus("all");
    setStudentAccess("all");
    setStudentLimit(STUDENTS_PAGE_SIZE);
  };

  const refresh = async () => {
    await router.invalidate();
  };

  const startAction = (action: string) => {
    setBusyAction(action);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSetStudentStatus = async (student: StudentRow, status: "active" | "suspended") => {
    const studentName = student.displayName || student.name;
    if (status === "suspended" && !window.confirm(`Suspend ${studentName}? They will not be able to use the app until you unsuspend them.`)) return;

    startAction(`student:${student.userId}`);

    try {
      await setStudentStatusAdmin({ data: { studentUserId: student.userId, status } });
      await refresh();
      setSuccessMessage(status === "suspended" ? `${studentName} was suspended.` : `${studentName} was unsuspended.`);
    } catch {
      setErrorMessage("Student status was not updated.");
    } finally {
      setBusyAction("");
    }
  };

  const handleAddAdmin = async () => {
    if (!adminEmail.trim()) return;

    startAction("add-admin");

    try {
      await addAdminAdmin({ data: { email: adminEmail, role: adminRole } });
      setAdminEmail("");
      await refresh();
      setSuccessMessage("Admin was added.");
    } catch {
      setErrorMessage("Admin was not added. Only Super-admins can manage admins.");
    } finally {
      setBusyAction("");
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!window.confirm(`Remove ${email} from the Admin whitelist? They will lose access to /admin.`)) return;

    startAction(`admin:${email}`);

    try {
      await removeAdminAdmin({ data: { email } });
      await refresh();
      setSuccessMessage("Admin was removed.");
    } catch {
      setErrorMessage("Admin was not removed. Only Super-admins can manage admins.");
    } finally {
      setBusyAction("");
    }
  };

  const handleImpersonateStudent = async (studentUserId: string) => {
    startAction(`impersonate:${studentUserId}`);

    try {
      const result = await startStudentImpersonationAdmin({ data: { studentUserId } });

      window.location.assign(result.redirectTo);
    } catch (error) {
      setErrorMessage(getSafeErrorMessage(error, "Impersonation was not started."));
      setBusyAction("");
    }
  };

  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane">
        <AdminPageHeader
          title="Users"
          description="Manage Student access and Admin whitelist membership."
        />

        {successMessage && <p role="status" className="mt-4 text-sm text-emerald-700">{successMessage}</p>}
        {errorMessage && (
          <p role="alert" className="admin-alert">
            {errorMessage}
          </p>
        )}

        <section className="admin-panel mt-6" aria-labelledby="students-title">
          <AdminPanelHeader
            id="students-title"
            title="Students"
            badge={<span className="admin-count">{hasFilters ? `${matchingStudents.length}/${students.length}` : students.length}</span>}
            description="Open an Evaluation, suspend an account, or sign in as a Student to see what they see."
            actions={
              <AdminSearchField
                label="Search Students by name or email"
                value={studentQuery}
                onChange={(value) => changeFilter(setStudentQuery)(value)}
                placeholder="Search name or email"
              />
            }
          />

          <div className="admin-filter-bar">
            <label className="sr-only" htmlFor="student-status">Account status</label>
            <select
              id="student-status"
              value={studentStatus}
              onChange={(event) => changeFilter(setStudentStatus)(event.target.value)}
              className="admin-control w-[calc(50%-0.25rem)] sm:w-40"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <label className="sr-only" htmlFor="student-access">Premium access</label>
            <select
              id="student-access"
              value={studentAccess}
              onChange={(event) => changeFilter(setStudentAccess)(event.target.value)}
              className="admin-control w-[calc(50%-0.25rem)] sm:w-40"
            >
              <option value="all">All access</option>
              <option value="premium">Premium</option>
              <option value="free">Free</option>
            </select>
            {hasFilters && (
              <button type="button" onClick={resetFilters} className="admin-button-ghost">
                Reset filters
              </button>
            )}
          </div>

          <div>
            {visibleStudents.map((student) => {
              const nextStatus = student.status === "suspended" ? "active" : "suspended";
              const isSuspended = student.status === "suspended";
              const isSuspendingSelf = student.isCurrentSessionUser && nextStatus === "suspended";
              const isAdminAccount = activeAdminEmails.has(student.email.toLowerCase());
              const impersonateBlockedReason = getImpersonateBlockedReason({
                isSuspended,
                isSelf: student.isCurrentSessionUser,
                isAdminAccount,
              });
              const studentName = student.displayName || student.name;

              return (
                <div key={student.userId} className={rowClassName}>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <StudentAvatar name={studentName} image={student.image} />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <Link
                          to="/admin/users/$studentId"
                          params={{ studentId: student.userId }}
                          className="truncate text-[13.5px] font-bold text-stone-800 no-underline hover:text-primary"
                        >
                          {studentName}
                        </Link>
                        <StatusPill status={student.status} />
                        {student.isCurrentSessionUser && (
                          <span className="admin-status-pill border-primary-soft bg-primary-tint text-primary">You</span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <p className="admin-meta-tag [overflow-wrap:anywhere]">{student.email}</p>
                        <span className={`admin-meta-tag ${student.hasPremiumMembership ? "text-amber-700" : ""}`}>
                          {student.hasPremiumMembership ? "Premium" : "Free"}
                        </span>
                        <span className="admin-meta-tag">{student.institution || "No institution"}</span>
                        <span className="admin-meta-tag">Joined {formatDate(student.joinedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-0.5 pl-12 sm:pl-0">
                    <Link
                      to="/admin/users/$studentId"
                      params={{ studentId: student.userId }}
                      className="admin-button-ghost text-primary no-underline hover:bg-primary-tint hover:text-primary-dark"
                    >
                      Evaluation
                    </Link>
                    <button
                      onClick={() => handleImpersonateStudent(student.userId)}
                      disabled={Boolean(impersonateBlockedReason) || busyAction === `impersonate:${student.userId}`}
                      title={impersonateBlockedReason}
                      className="admin-button-ghost text-primary hover:bg-primary-tint hover:text-primary-dark"
                      type="button"
                    >
                      Impersonate
                    </button>
                    <button
                      onClick={() => handleSetStudentStatus(student, nextStatus)}
                      disabled={isSuspendingSelf || busyAction === `student:${student.userId}`}
                      title={isSuspendingSelf ? "You cannot suspend your own account." : undefined}
                      className={`admin-button-ghost ${isSuspended ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" : "text-amber-600 hover:bg-amber-50 hover:text-amber-700"}`}
                      type="button"
                    >
                      {isSuspended ? "Unsuspend" : "Suspend"}
                    </button>
                  </div>
                </div>
              );
            })}

            {hiddenStudentCount > 0 && (
              <div className="border-t border-stone-100 p-3 text-center">
                <button
                  type="button"
                  onClick={() => setStudentLimit(studentLimit + STUDENTS_PAGE_SIZE)}
                  className="admin-button-secondary"
                >
                  Show {Math.min(hiddenStudentCount, STUDENTS_PAGE_SIZE)} more
                  <span className="font-medium text-stone-400">({hiddenStudentCount} hidden)</span>
                </button>
              </div>
            )}

            {matchingStudents.length === 0 && (
              <AdminEmptyState
                title={students.length === 0 ? "No Students found yet." : "No Students match these filters."}
                action={hasFilters && (
                  <button type="button" onClick={resetFilters} className="admin-button-secondary">
                    Reset filters
                  </button>
                )}
              />
            )}
          </div>
        </section>

        <section className="admin-panel mt-6" aria-labelledby="admin-whitelist-title">
          <AdminPanelHeader
            id="admin-whitelist-title"
            title="Admin whitelist"
            badge={<span className="admin-count">{admins.filter((admin) => admin.active).length}</span>}
            description="Anyone on this list can open /admin. Only Super-admins can add or remove admins."
          />

          <form
            className="grid items-end gap-3 border-b border-stone-100 p-4 sm:grid-cols-[minmax(0,1fr)_160px_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              handleAddAdmin();
            }}
          >
            <div>
              <label className="mb-1.5 block text-xs font-bold text-stone-600" htmlFor="admin-email">Admin email</label>
              <input
                id="admin-email"
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
                className="admin-control"
                placeholder="admin@example.com"
                type="email"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-stone-600" htmlFor="admin-role">Admin role</label>
              <select
                id="admin-role"
                value={adminRole}
                onChange={(event) => setAdminRole(event.target.value as "admin" | "super_admin")}
                className="admin-control"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super-admin</option>
              </select>
            </div>
            <button
              disabled={busyAction === "add-admin"}
              className="admin-button-primary"
              type="submit"
            >
              Add
            </button>
          </form>

          <div>
            {admins.map((admin) => (
              <div
                key={`${admin.email}:${admin.createdAt}`}
                className={`${rowClassName} ${admin.active ? "" : "opacity-60"}`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${admin.role === "super_admin" && admin.active ? "border-primary-soft bg-primary-tint text-primary" : "border-stone-100 bg-stone-50 text-stone-500"}`}
                    aria-hidden="true"
                  >
                    <ShieldIcon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className="truncate text-[13.5px] font-bold text-stone-800">{admin.email}</h3>
                      <RoleBadge role={admin.role} />
                      {!admin.active && <StatusPill status="removed" />}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span className="admin-meta-tag">Added {formatDate(admin.createdAt)}</span>
                      {admin.removedAt && <span className="admin-meta-tag">Removed {formatDate(admin.removedAt)}</span>}
                    </div>
                  </div>
                </div>

                {admin.active && (
                  <div className="flex shrink-0 items-center gap-0.5 pl-12 sm:pl-0">
                    <button
                      onClick={() => handleRemoveAdmin(admin.email)}
                      disabled={busyAction === `admin:${admin.email}`}
                      className="admin-button-ghost text-red-600 hover:bg-red-50 hover:text-red-700"
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}

            {admins.length === 0 && (
              <AdminEmptyState title="No admins found yet." />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function getImpersonateBlockedReason({
  isSuspended,
  isSelf,
  isAdminAccount,
}: {
  isSuspended: boolean;
  isSelf: boolean;
  isAdminAccount: boolean;
}) {
  if (isSelf) return "You cannot impersonate your own account.";
  if (isAdminAccount) return "Admin accounts cannot be impersonated.";
  if (isSuspended) return "Suspended Students cannot be impersonated.";
  return undefined;
}

function StudentAvatar({ name, image }: { name: string; image: string | null }) {
  const [imageFailed, setImageFailed] = useState(false);
  const className = "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-100 bg-stone-50 text-[13px] font-bold text-stone-500";

  if (!image || imageFailed) {
    return (
      <div className={className} aria-hidden="true">
        {name.trim().charAt(0).toLocaleUpperCase() || "?"}
      </div>
    );
  }

  return (
    <div className={className} aria-hidden="true">
      <img
        src={image}
        alt=""
        className="h-full w-full object-cover"
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    </div>
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

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12 3 5 6v5.5c0 4.2 2.8 7.6 7 9.5 4.2-1.9 7-5.3 7-9.5V6l-7-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
