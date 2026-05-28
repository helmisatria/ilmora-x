import { createFileRoute } from "@tanstack/react-router";
import {
  AdminMonitoringPage,
  type QueueMonitoring,
} from "../../features/admin/admin-monitoring-page";
import { getQueueMonitoringAdmin } from "../../features/admin/admin-monitoring-functions";

export const Route = createFileRoute("/admin/monitoring")({
  loader: async () => getQueueMonitoringAdmin(),
  head: () => ({
    meta: [
      { title: "Monitoring — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminMonitoringRoute,
});

function AdminMonitoringRoute() {
  return (
    <AdminMonitoringPage monitoring={Route.useLoaderData() as QueueMonitoring} />
  );
}
