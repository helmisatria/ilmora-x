import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import type { Router } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

let routerInstance: Router<any, any, any> | null = null;

export function createRouter(): Router<any, any, any> {
  if (routerInstance) {
    return routerInstance;
  }
  
  const router = createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    defaultPendingMs: 0,
    scrollRestoration: true,
    defaultStructuralSharing: true,
  });

  routerInstance = router;
  return router;
}

export function getRouter(): Router<any, any, any> {
  if (!routerInstance) {
    return createRouter();
  }
  return routerInstance;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}