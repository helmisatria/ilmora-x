import { getRequest } from "@tanstack/react-start/server";
import { getCurrentViewerFromHeaders } from "../../lib/auth-functions";
import { assertActiveStudent } from "../identity/access-rules";

export async function getStudentViewer() {
  const request = getRequest();
  const viewer = await getCurrentViewerFromHeaders(request.headers);

  return assertActiveStudent(viewer);
}

export type StudentViewer = Awaited<ReturnType<typeof getStudentViewer>>;

export function getStudentImpersonationMetadata(viewer: StudentViewer) {
  if (!viewer.impersonation) return {};

  return {
    impersonatedByAdminUserId: viewer.impersonation.adminUserId,
    impersonatedByAdminEmail: viewer.impersonation.adminEmail,
  };
}
