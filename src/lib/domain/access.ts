import { forbidden, unauthorized } from "../http/errors";
import { type Viewer } from "../auth-functions";

export function assertActiveStudent(viewer: Viewer | null) {
  if (!viewer) {
    throw unauthorized();
  }

  if (viewer.profile?.status === "suspended") {
    throw forbidden("This Student account is suspended.");
  }

  return viewer;
}

export function assertAttemptOwner(viewer: Viewer, studentUserId: string) {
  if (viewer.admin) return;
  if (viewer.userId === studentUserId) return;

  throw forbidden("This Attempt belongs to another Student.");
}
