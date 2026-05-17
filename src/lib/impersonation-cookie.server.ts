import "@tanstack/react-start/server-only";
import { setResponseHeader } from "@tanstack/react-start/server";
import {
  createImpersonationCookieValue,
  impersonationCookieName,
  impersonationMaxAgeSeconds,
} from "./impersonation-cookie";

export function clearImpersonationCookie() {
  setResponseHeader(
    "Set-Cookie",
    `${impersonationCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
}

export async function setImpersonationCookieForStudent(adminUserId: string, targetUserId: string) {
  const value = await createImpersonationCookieValue({
    adminUserId,
    targetUserId,
    issuedAt: Math.floor(Date.now() / 1000),
  });

  setResponseHeader(
    "Set-Cookie",
    `${impersonationCookieName}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${impersonationMaxAgeSeconds}`,
  );
}
