import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout/$checkoutId")({
  beforeLoad: ({ location, params }) => {
    if (location.pathname.endsWith("/status")) {
      return;
    }

    throw redirect({
      to: "/checkout/$checkoutId/status",
      params: {
        checkoutId: params.checkoutId,
      },
    });
  },
  component: Outlet,
});
