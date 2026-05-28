import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginPage } from "../../features/auth/login-page";
import { getPostLoginRedirect } from "../../lib/auth-functions";
import { analyticsSearchSchema } from "../../lib/product-analytics";

export const Route = createFileRoute("/auth/login")({
  loader: async () => {
    const redirectTo = await getPostLoginRedirect();

    if (redirectTo !== "/auth/login") {
      throw redirect({ to: redirectTo });
    }

    return null;
  },
  head: () => ({
    meta: [
      { title: "Masuk — IlmoraX" },
      {
        name: "description",
        content:
          "Masuk ke IlmoraX dengan Google. Mulai latihan UKAI, kumpulkan XP, dan naik level bersama ribuan calon apoteker lainnya.",
      },
      { property: "og:title", content: "Masuk — IlmoraX" },
      {
        property: "og:description",
        content: "Masuk ke IlmoraX dengan Google. Mulai latihan UKAI dan kumpulkan XP.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: LoginRoute,
  validateSearch: analyticsSearchSchema,
});

function LoginRoute() {
  const { intent } = Route.useSearch();

  return <LoginPage intent={intent} />;
}
