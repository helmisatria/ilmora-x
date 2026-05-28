import { createFileRoute } from "@tanstack/react-router";
import {
  AdminStudentDetailPage,
  type StudentEvaluation,
} from "../../features/admin/admin-student-detail-page";
import { getStudentEvaluationAdmin } from "../../features/admin/admin-user-functions";

export const Route = createFileRoute("/admin/users/$studentId")({
  loader: async ({ params }) => {
    const evaluation = await getStudentEvaluationAdmin({
      data: { studentUserId: params.studentId },
    });

    return { evaluation };
  },
  head: () => ({
    meta: [
      { title: "Student Detail — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminStudentDetailRoute,
});

function AdminStudentDetailRoute() {
  const { evaluation } = Route.useLoaderData() as {
    evaluation: StudentEvaluation;
  };

  return <AdminStudentDetailPage evaluation={evaluation} />;
}
