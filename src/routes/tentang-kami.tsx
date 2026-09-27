import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "../features/landing/about-page";

export const Route = createFileRoute("/tentang-kami")({
  head: () => ({
    meta: [
      { title: "Tentang Kami — IlmoraX" },
      {
        name: "description",
        content:
          "Kenali IlmoraX dan cara kami membantu calon apoteker berlatih, mengevaluasi hasil, dan menentukan materi berikutnya sebelum UKAI.",
      },
      { property: "og:title", content: "Tentang Kami — IlmoraX" },
      {
        property: "og:description",
        content:
          "Tentang IlmoraX, cara belajar yang kami bangun, serta informasi resmi Ilmora Academy.",
      },
    ],
  }),
  component: AboutPage,
});
