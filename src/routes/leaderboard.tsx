import { createFileRoute } from "@tanstack/react-router";
import { LeaderboardPage } from "../features/leaderboard/leaderboard-page";
import { listLeaderboard } from "../features/leaderboard/student-leaderboard-functions";
import { listProgressSummary } from "../features/student/student-progress-functions";

export const Route = createFileRoute("/leaderboard")({
  preloadStaleTime: 0,
  loader: async () => {
    const [leaderboard, summary] = await Promise.all([
      listLeaderboard(),
      listProgressSummary(),
    ]);

    return { leaderboard, summary };
  },
  head: () => ({
    meta: [
      { title: "Leaderboard Mingguan — IlmoraX" },
      {
        name: "description",
        content:
          "Papan peringkat mingguan IlmoraX. Lihat peringkatmu, kejar posisi terbaik, dan kompetisi dengan ribuan calon apoteker lainnya. Reset setiap Senin.",
      },
      { property: "og:title", content: "Leaderboard Mingguan — IlmoraX" },
      {
        property: "og:description",
        content:
          "Papan peringkat mingguan IlmoraX. Lihat peringkatmu dan kompetisi dengan ribuan calon apoteker lainnya.",
      },
    ],
  }),
  component: LeaderboardRoute,
});

function LeaderboardRoute() {
  const data = Route.useLoaderData();
  return <LeaderboardPage leaderboard={data.leaderboard} summary={data.summary} />;
}
