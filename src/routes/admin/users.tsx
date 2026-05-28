import { createFileRoute } from "@tanstack/react-router";
import {
  AdminUsersPage,
  type AdminRow,
  type StudentRow,
} from "../../features/admin/admin-users-page";
import {
  listAdminsAdmin,
  listStudentsAdmin,
} from "../../features/admin/admin-user-functions";

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
  component: AdminUsersRoute,
});

function AdminUsersRoute() {
  const { students, admins } = Route.useLoaderData() as {
    students: StudentRow[];
    admins: AdminRow[];
  };

  return <AdminUsersPage students={students} admins={admins} />;
}
