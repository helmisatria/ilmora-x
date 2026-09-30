import { createFileRoute } from "@tanstack/react-router";
import { getLeaderboardSettingsAdmin } from "../../features/admin/admin-leaderboard-settings-functions";
import { AdminLeaderboardSettingsPage } from "../../features/admin/admin-leaderboard-settings-page";

export const Route = createFileRoute("/admin/leaderboard")({
  loader: async () => getLeaderboardSettingsAdmin(),
  head: () => ({
    meta: [
      { title: "Leaderboard settings — IlmoraX Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLeaderboardSettingsRoute,
});

function AdminLeaderboardSettingsRoute() {
  const settings = Route.useLoaderData();

  return <AdminLeaderboardSettingsPage key={settings.adminValue ?? "none"} settings={settings} />;
}
