import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, termsOfService } from "../features/landing/legal-page";

export const Route = createFileRoute("/syarat-ketentuan")({
  head: () => ({
    meta: [
      { title: "Syarat & Ketentuan — IlmoraX" },
      { name: "description", content: termsOfService.summary },
      { property: "og:title", content: "Syarat & Ketentuan — IlmoraX" },
      { property: "og:description", content: termsOfService.summary },
    ],
  }),
  component: () => <LegalPage document={termsOfService} />,
});
