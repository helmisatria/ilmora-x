import { createFileRoute } from "@tanstack/react-router";
import { BadgesPage } from "../features/engagement-surface/badges-page";
import { listProgressSummary } from "../features/student/student-progress-functions";

export const Route = createFileRoute("/badges")({
  loader: async () => {
    const summary = await listProgressSummary();

    return { summary };
  },
  head: () => ({
    meta: [
      { title: "Koleksi Lencana — IlmoraX" },
      {
        name: "description",
        content:
          "Pantau dan kumpulkan lencana dari tryout, streak, level, dan pencapaian khusus. Lencana General, Level, Streak, dan Prestige menunggu untuk dibuka.",
      },
      { property: "og:title", content: "Koleksi Lencana — IlmoraX" },
      {
        property: "og:description",
        content: "Pantau dan kumpulkan lencana dari tryout, streak, level, dan pencapaian khusus.",
      },
    ],
  }),
  component: BadgesRoute,
});

function BadgesRoute() {
  const { summary } = Route.useLoaderData();
  return <BadgesPage summary={summary} />;
}
