import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "../features/landing/about-page";

export const Route = createFileRoute("/tentang-kami")({
  head: () => ({
    meta: [
      { title: "Tentang Kami — IlmoraX" },
      {
        name: "description",
        content:
          "Kenali IlmoraX, layanan belajar digital dari Ilmora Academy untuk persiapan UKAI yang lebih terarah.",
      },
      { property: "og:title", content: "Tentang Kami — IlmoraX" },
      {
        property: "og:description",
        content:
          "Informasi layanan, alamat, dan kontak resmi Ilmora Academy sebagai penyedia IlmoraX.",
      },
    ],
  }),
  component: AboutPage,
});
