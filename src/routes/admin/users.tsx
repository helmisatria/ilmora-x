import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  addAdminAdmin,
  listAdminsAdmin,
  listStudentsAdmin,
  removeAdminAdmin,
  setStudentStatusAdmin,
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

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8 text-stone-900">
      <div className="mx-auto w-full max-w-6xl">
        <Header title="Users" description="Manage Student access and Admin whitelist membership." />

        {errorMessage && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </p>
        )}

        <section className="mt-6 rounded-lg border border-stone-200 bg-white">
          <div className="border-b border-stone-200 p-5">
            <h2 className="text-lg font-bold">Admin whitelist</h2>
          </div>

          <div className="grid gap-3 border-b border-stone-200 p-5 md:grid-cols-[minmax(0,1fr)_180px_120px]">
            <input
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
              className="rounded-md border border-stone-300 px-3 py-2 text-sm"
              placeholder="admin@example.com"
              type="email"
            />
            <select
              value={adminRole}
              onChange={(event) => setAdminRole(event.target.value as "admin" | "super_admin")}
              className="rounded-md border border-stone-300 px-3 py-2 text-sm"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super-admin</option>
            </select>
            <button
              onClick={handleAddAdmin}
              disabled={busyAction === "add-admin"}
              className="rounded-md bg-[#205072] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              type="button"
            >
              Add
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {admins.map((admin) => (
              <div key={`${admin.email}:${admin.createdAt}`} className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_120px_100px_120px] md:items-center">
                <div>
                  <p className="font-semibold">{admin.email}</p>
                  <p className="mt-1 text-xs text-stone-500">Added {formatDate(admin.createdAt)}</p>
                </div>
                <p className="text-sm font-semibold">{admin.role === "super_admin" ? "Super-admin" : "Admin"}</p>
                <StatusPill status={admin.active ? "active" : "removed"} />
                <button
                  onClick={() => handleRemoveAdmin(admin.email)}
                  disabled={!admin.active || busyAction === `admin:${admin.email}`}
                  className="rounded-md border border-stone-300 px-3 py-2 text-sm font-bold text-stone-700 disabled:opacity-40"
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-stone-200 bg-white">
          <div className="border-b border-stone-200 p-5">
            <h2 className="text-lg font-bold">Students</h2>
          </div>

          <div className="divide-y divide-stone-100">
            {students.map((student) => {
              const nextStatus = student.status === "suspended" ? "active" : "suspended";
              const buttonLabel = student.status === "suspended" ? "Unsuspend" : "Suspend";

              return (
                <div key={student.userId} className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_160px_120px_120px] md:items-center">
                  <div>
                    <p className="font-semibold">{student.displayName || student.name}</p>
                    <p className="mt-1 text-sm text-stone-500">{student.email}</p>
                    <p className="mt-1 text-xs text-stone-400">{student.institution || "No institution yet"}</p>
                  </div>
                  <p className="text-sm text-stone-500">Joined {formatDate(student.joinedAt)}</p>
                  <StatusPill status={student.status} />
                  <button
                    onClick={() => handleSetStudentStatus(student.userId, nextStatus)}
                    disabled={busyAction === `student:${student.userId}`}
                    className="rounded-md border border-stone-300 px-3 py-2 text-sm font-bold text-stone-700 disabled:opacity-40"
                    type="button"
                  >
                    {buttonLabel}
                  </button>
                </div>
              );
            })}

            {students.length === 0 && (
              <p className="p-5 text-sm text-stone-500">No Students found yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Header({ title, description }: { title: string; description: string }) {
  return (
    <header className="border-b border-stone-200 pb-6">
      <a href="/admin" className="text-sm font-semibold text-[#205072]">Admin</a>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
    </header>
  );
}

function StatusPill({ status }: { status: "active" | "suspended" | "removed" }) {
  const classes = {
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    suspended: "border-red-200 bg-red-50 text-red-700",
    removed: "border-stone-200 bg-stone-100 text-stone-500",
  };

  return (
    <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${classes[status]}`}>
      {status}
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
