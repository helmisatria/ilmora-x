import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginPage } from "../../features/auth/login-page";
import { getPostLoginRedirect } from "../../lib/auth-functions";
import { authSearchSchema } from "../../lib/post-login-redirect";

export const Route = createFileRoute("/auth/login")({
  loaderDeps: ({ search }) => ({ redirectTo: search.redirectTo }),
  loader: async ({ deps }) => {
    const redirectTo = await getPostLoginRedirect();

    if (redirectTo !== "/auth/login") {
      const destination =
        redirectTo === "/dashboard" ? deps.redirectTo ?? redirectTo : redirectTo;
      const search =
        destination === "/auth/complete-profile" && deps.redirectTo
          ? { redirectTo: deps.redirectTo }
          : undefined;

      throw redirect({ to: destination, search });
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
  validateSearch: authSearchSchema,
});

function LoginRoute() {
  const { intent, redirectTo } = Route.useSearch();

  return <LoginPage intent={intent} redirectTo={redirectTo} />;
}
