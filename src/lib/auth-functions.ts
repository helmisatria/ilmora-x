import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "./auth";
import { db } from "./db/client";
import { activityEvents, studentProfiles } from "./db/schema";
import { getActiveAdminMembership } from "./domain/admin";
import { getStudentProfile, isProfileComplete } from "./domain/users";
import { unauthorized } from "./http/errors";
import { parseInput } from "./http/validation";

export type Viewer = {
  userId: string;
  email: string;
  name: string | null;
  image: string | null;
  profile: {
    displayName: string;
    institution: string | null;
    phone: string | null;
    photoUrl: string | null;
    completed: boolean;
    status: "active" | "suspended";
  } | null;
  admin: {
    role: "admin" | "super_admin";
  } | null;
};

const completeProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  institution: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(40).optional(),
  photoUrl: z.string().trim().url().optional().or(z.literal("")),
});

export async function getSessionFromHeaders(headers: Headers) {
  return auth.api.getSession({
    headers,
  });
}

export async function ensureSessionFromHeaders(headers: Headers) {
  const session = await getSessionFromHeaders(headers);

  if (session) {
    return session;
  }

  throw unauthorized();
}

export async function getCurrentViewerFromHeaders(headers: Headers): Promise<Viewer | null> {
  const session = await getSessionFromHeaders(headers);

  if (!session) return null;

  const profile = await getStudentProfile(session.user.id);
  const admin = await getActiveAdminMembership(session.user.email);

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    profile: profile
      ? {
          displayName: profile.displayName,
          institution: profile.institution,
          phone: profile.phone,
          photoUrl: profile.photoUrl,
          completed: isProfileComplete(profile),
          status: profile.status as "active" | "suspended",
        }
      : null,
    admin,
  };
}

export function getPostLoginRedirectForViewer(viewer: Viewer) {
  if (viewer.admin) return "/admin";
  if (!viewer.profile?.completed) return "/auth/complete-profile";
  return "/dashboard";
}

export const getCurrentViewer = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  return getCurrentViewerFromHeaders(request.headers);
});

export const getPostLoginRedirect = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  const viewer = await getCurrentViewerFromHeaders(request.headers);

  if (!viewer) {
    return "/auth/login";
  }

  return getPostLoginRedirectForViewer(viewer);
});

export const completeProfile = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(completeProfileSchema, input))
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = await ensureSessionFromHeaders(request.headers);
    const now = new Date();

    const profile = {
      userId: session.user.id,
      displayName: data.displayName,
      institution: data.institution,
      phone: data.phone || null,
      photoUrl: data.photoUrl || session.user.image || null,
      profileCompletedAt: now,
      updatedAt: now,
    };

    const existingProfile = await getStudentProfile(session.user.id);

    if (!existingProfile) {
      await db.insert(studentProfiles).values({
        ...profile,
      });
    } else {
      await db
        .update(studentProfiles)
        .set(profile)
        .where(eq(studentProfiles.userId, session.user.id));
    }

    await db.insert(activityEvents).values({
      studentUserId: session.user.id,
      eventType: "profile_completed",
      metadata: {},
    }).catch(() => undefined);

    return {
      redirectTo: "/dashboard",
    };
  });
