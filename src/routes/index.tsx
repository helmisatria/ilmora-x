import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "../features/landing/landing-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IlmoraX - Simulasi UKAI yang Terasa Seperti Ujian Asli" },
      {
        name: "description",
        content:
          "IlmoraX membantu calon apoteker mulai dari try-out, tahu kekurangan, lalu belajar dari pembahasan yang paling relevan.",
      },
      {
        property: "og:title",
        content: "IlmoraX - Simulasi UKAI yang Terasa Seperti Ujian Asli",
      },
      {
        property: "og:description",
        content:
          "Mulai dari try-out, ketahui bagian yang masih lemah, lalu isi kekurangannya lewat pembahasan yang tepat.",
      },
    ],
  }),
  component: LandingPage,
});
