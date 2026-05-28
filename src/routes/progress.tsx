import { createFileRoute } from "@tanstack/react-router";
import { ProgressPage } from "../features/student/progress-page";
import { listProgressSummary } from "../features/student/student-progress-functions";

export const Route = createFileRoute("/progress")({
  loader: async () => {
    const summary = await listProgressSummary();

    return { summary };
  },
  head: () => ({
    meta: [
      { title: "Progres Belajar — IlmoraX" },
      {
        name: "description",
        content:
          "Pantau perkembangan belajarmu: level, XP, akurasi, dan performa per kategori. Lihat riwayat try-out dan analisis kemajuan belajar farmasi.",
      },
      { property: "og:title", content: "Progres Belajar — IlmoraX" },
      {
        property: "og:description",
        content: "Pantau perkembangan belajarmu: level, XP, akurasi, dan performa per kategori.",
      },
    ],
  }),
  component: ProgressRoute,
});

function ProgressRoute() {
  const { summary } = Route.useLoaderData();
  return <ProgressPage summary={summary} />;
}
