import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import type { Router } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function createRouter(): Router<any, any, any> {
  return createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    defaultPendingMs: 0,
    scrollRestoration: true,
    defaultStructuralSharing: true,
  });
}

export function getRouter(): Router<any, any, any> {
  return createRouter();
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
