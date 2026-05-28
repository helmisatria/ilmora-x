import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  CompleteProfilePage,
  type CompleteProfileViewer,
} from "../../features/auth/complete-profile-page";
import {
  getCurrentViewer,
  getPostLoginRedirectForViewer,
} from "../../lib/auth-functions";
import { analyticsSearchSchema } from "../../lib/product-analytics";

export const Route = createFileRoute("/auth/complete-profile")({
  loader: async () => {
    const viewer = await getCurrentViewer();

    if (!viewer) {
      throw redirect({ to: "/auth/login" });
    }

    if (viewer.admin || viewer.profile?.completed) {
      throw redirect({ to: getPostLoginRedirectForViewer(viewer) });
    }

    return { viewer };
  },
  head: () => ({
    meta: [
      { title: "Lengkapi Profil — IlmoraX" },
      {
        name: "description",
        content:
          "Lengkapi profil IlmoraX-mu. Masukkan nama lengkap dan pilih institusi untuk personalisasi pengalaman belajar.",
      },
      { property: "og:title", content: "Lengkapi Profil — IlmoraX" },
      {
        property: "og:description",
        content: "Lengkapi profil IlmoraX-mu untuk personalisasi pengalaman belajar.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: CompleteProfileRoute,
  validateSearch: analyticsSearchSchema,
});

function CompleteProfileRoute() {
  const { viewer } = Route.useLoaderData() as {
    viewer: CompleteProfileViewer;
  };
  const { intent } = Route.useSearch();

  return <CompleteProfilePage viewer={viewer} intent={intent} />;
}
