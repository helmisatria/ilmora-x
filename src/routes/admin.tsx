import { createFileRoute } from "@tanstack/react-router";
import { AdminHomePage } from "../features/admin/admin-home-page";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — IlmoraX" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminHomePage,
});
