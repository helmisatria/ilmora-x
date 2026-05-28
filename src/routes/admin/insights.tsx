import { createFileRoute } from "@tanstack/react-router";
import {
  AdminInsightsPage,
  type AdminInsights,
} from "../../features/admin/admin-insights-page";
import { getAdminContentCounts } from "../../features/admin/admin-content-counts";

export const Route = createFileRoute("/admin/insights")({
  loader: async () => getAdminContentCounts(),
  head: () => ({
    meta: [
      { title: "Insights — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminInsightsRoute,
});

function AdminInsightsRoute() {
  return <AdminInsightsPage counts={Route.useLoaderData() as AdminInsights} />;
}
