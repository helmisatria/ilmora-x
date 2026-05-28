import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  AdminReportsPage,
  reportReasonFilters,
  reportStatusFilters,
  type ReportQueue,
} from "../../features/admin/admin-reports-page";
import { listQuestionReportsAdmin } from "../../features/admin/admin-report-functions";

const searchSchema = z.object({
  status: z.enum(reportStatusFilters).optional(),
  reason: z.enum(reportReasonFilters).optional(),
  tryoutId: z.string().optional(),
  questionId: z.string().optional(),
});

export const Route = createFileRoute("/admin/reports")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    status: search.status ?? "open",
    reason: search.reason ?? "all",
    tryoutId: search.tryoutId,
    questionId: search.questionId,
  }),
  loader: async ({ deps }) => listQuestionReportsAdmin({ data: deps }),
  head: () => ({
    meta: [
      { title: "Reports — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminReportsRoute,
});

function AdminReportsRoute() {
  return (
    <AdminReportsPage
      queue={Route.useLoaderData() as ReportQueue}
      search={Route.useSearch()}
    />
  );
}
