import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getCurrentViewerFromHeaders } from "../../lib/auth-functions";
import { requireAdmin, requireSuperAdmin } from "../identity/admin-membership";
import { notFound } from "../../lib/http/errors";

async function getAdminViewer() {
  const request = getRequest();
  const viewer = await getCurrentViewerFromHeaders(request.headers);

  await requireAdmin(viewer?.sessionEmail);

  if (!viewer) {
    throw notFound("Admin viewer was not found.");
  }

  return viewer;
}

export const adminMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const viewer = await getAdminViewer();

  return next({
    context: { viewer },
  });
});

export const superAdminMiddleware = createMiddleware({ type: "function" })
  .middleware([adminMiddleware])
  .server(async ({ context, next }) => {
    await requireSuperAdmin(context.viewer.sessionEmail);

    return next();
  });
