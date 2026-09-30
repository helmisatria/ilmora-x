import { createFileRoute } from "@tanstack/react-router";
import { listBadgeSettingsAdmin } from "../../features/admin/admin-badge-settings-functions";
import { AdminBadgeSettingsPage } from "../../features/admin/admin-badge-settings-page";

export const Route = createFileRoute("/admin/badges")({
  loader: async () => listBadgeSettingsAdmin(),
  head: () => ({
    meta: [
      { title: "Badge settings — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminBadgeSettingsRoute,
});

function AdminBadgeSettingsRoute() {
  return <AdminBadgeSettingsPage data={Route.useLoaderData()} />;
}
