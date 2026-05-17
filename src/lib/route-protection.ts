import type { Viewer } from "./auth-functions";

const publicPathPrefixes = [
  "/api/",
  "/auth/",
  "/poll",
];

const protectedPathPrefixes = [
  "/badges",
  "/checkout",
  "/coming-soon",
  "/dashboard",
  "/evaluation",
  "/leaderboard",
  "/premium",
  "/profile",
  "/progress",
  "/results",
  "/tryout",
];

export function isPublicPath(pathname: string) {
  if (pathname === "/") return true;

  return publicPathPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isProtectedStudentPath(pathname: string) {
  return protectedPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function needsProtectedViewer(pathname: string) {
  if (isPublicPath(pathname)) return false;
  if (isAdminPath(pathname)) return true;

  return isProtectedStudentPath(pathname);
}

export function getProtectedRedirect(pathname: string, viewer: Viewer | null) {
  if (!needsProtectedViewer(pathname)) return null;

  if (!viewer) return "/auth/login";

  if (viewer.profile?.status === "suspended") {
    return "/auth/login";
  }

  if (isAdminPath(pathname)) {
    if (viewer.admin) return null;
    return "/dashboard";
  }

  if (viewer.admin) return null;

  if (!viewer.profile?.completed) {
    return "/auth/complete-profile";
  }

  return null;
}
