import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ComingSoonPage } from "../features/coming-soon/coming-soon-page";

const searchSchema = z.object({
  feature: z.string().optional(),
});

export const Route = createFileRoute("/coming-soon")({
  head: () => ({
    meta: [
      { title: "Segera Hadir — IlmoraX" },
      {
        name: "description",
        content:
          "Fitur baru IlmoraX sedang dalam pengembangan. Drilling/Games, Store, Materi, dan Affiliate Program akan segera hadir.",
      },
      { property: "og:title", content: "Segera Hadir — IlmoraX" },
      {
        property: "og:description",
        content: "Fitur baru IlmoraX sedang dalam pengembangan. Stay tuned untuk update terbaru.",
      },
    ],
  }),
  component: ComingSoonRoute,
  validateSearch: searchSchema,
});

function ComingSoonRoute() {
  const { feature } = Route.useSearch();

  return <ComingSoonPage feature={feature} />;
}
