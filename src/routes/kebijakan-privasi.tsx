import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, privacyPolicy } from "../features/landing/legal-page";

export const Route = createFileRoute("/kebijakan-privasi")({
  head: () => ({
    meta: [
      { title: "Kebijakan Privasi — IlmoraX" },
      { name: "description", content: privacyPolicy.summary },
      { property: "og:title", content: "Kebijakan Privasi — IlmoraX" },
      { property: "og:description", content: privacyPolicy.summary },
    ],
  }),
  component: () => <LegalPage document={privacyPolicy} />,
});
