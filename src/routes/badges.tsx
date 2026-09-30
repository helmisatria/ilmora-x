import { createFileRoute } from "@tanstack/react-router";
import { listBadgeCatalog } from "../features/engagement-surface/badge-catalog-functions";
import { BadgesPage } from "../features/engagement-surface/badges-page";
import { listProgressSummary } from "../features/student/student-progress-functions";

export const Route = createFileRoute("/badges")({
  loader: async () => {
    const [summary, badgeCatalog] = await Promise.all([listProgressSummary(), listBadgeCatalog()]);

    return { summary, badgeCatalog };
  },
  head: () => ({
    meta: [
      { title: "Koleksi Lencana — IlmoraX" },
      {
        name: "description",
        content:
          "Kumpulkan lencana dari Try-out, naik level, dan belajar rutin. Lihat lencana yang paling dekat untuk kamu dapatkan.",
      },
      { property: "og:title", content: "Koleksi Lencana — IlmoraX" },
      {
        property: "og:description",
        content: "Kumpulkan lencana dari Try-out, naik level, dan belajar rutin.",
      },
    ],
  }),
  component: BadgesRoute,
});

function BadgesRoute() {
  const { summary, badgeCatalog } = Route.useLoaderData();
  return <BadgesPage summary={summary} badgeCatalog={badgeCatalog} />;
}
