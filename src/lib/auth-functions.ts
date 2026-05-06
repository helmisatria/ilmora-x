import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
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
  const { auth } = await import("./auth");

  return auth.api.getSession({
    headers,
  });
}

export async function ensureSessionFromHeaders(headers: Headers) {
  const { unauthorized } = await import("./http/errors");
  const session = await getSessionFromHeaders(headers);

  if (session) {
    return session;
  }

  throw unauthorized();
}

export async function getCurrentViewerFromHeaders(headers: Headers): Promise<Viewer | null> {
  const { getActiveAdminMembership } = await import("./domain/admin");
  const { getStudentProfile, isProfileComplete } = await import("./domain/users");
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
  if (viewer.profile?.status === "suspended") return "/auth/login";
  if (viewer.admin) return "/admin";
  if (!viewer.profile?.completed) return "/auth/complete-profile";
  return "/dashboard";
}

export const getCurrentViewer = createServerFn({ method: "GET" }).handler(async () => {
  const { observeServerOperation } = await import("./observability");

  return observeServerOperation(
    {
      operation: "auth.get_current_viewer",
      kind: "server_function",
      method: "GET",
    },
    async () => {
      const request = getRequest();
      const viewer = await getCurrentViewerFromHeaders(request.headers);

      return viewer;
    },
  );
});

export const getPostLoginRedirect = createServerFn({ method: "GET" }).handler(async () => {
  const { observeServerOperation } = await import("./observability");

  return observeServerOperation(
    {
      operation: "auth.get_post_login_redirect",
      kind: "server_function",
      method: "GET",
    },
    async (logger) => {
      const request = getRequest();
      const viewer = await getCurrentViewerFromHeaders(request.headers);

      if (!viewer) {
        logger.set({ redirectTo: "/auth/login" });
        return "/auth/login";
      }

      const redirectTo = getPostLoginRedirectForViewer(viewer);
      logger.set({
        user: { id: viewer.userId },
        redirectTo,
      });

      return redirectTo;
    },
  );
});

export const completeProfile = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(completeProfileSchema, input))
  .handler(async ({ data }) => {
    const { observeServerOperation } = await import("./observability");

    return observeServerOperation(
      {
        operation: "auth.complete_profile",
        kind: "server_function",
        method: "POST",
      },
      async (logger) => {
        const { eq } = await import("drizzle-orm");
        const { db } = await import("./db/client");
        const { activityEvents, studentProfiles } = await import("./db/schema");
        const { getStudentProfile } = await import("./domain/users");
        const request = getRequest();
        const session = await ensureSessionFromHeaders(request.headers);
        const now = new Date();

        logger.set({
          user: { id: session.user.id },
          profile: {
            hasPhone: Boolean(data.phone),
            hasPhotoUrl: Boolean(data.photoUrl),
          },
        });

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
          logger.set({ profile: { operation: "insert" } });
        } else {
          await db
            .update(studentProfiles)
            .set(profile)
            .where(eq(studentProfiles.userId, session.user.id));
          logger.set({ profile: { operation: "update" } });
        }

        await db.insert(activityEvents).values({
          studentUserId: session.user.id,
          eventType: "profile_completed",
          metadata: {},
        }).catch((error) => {
          logger.warn("activity event insert failed", {
            activityEvent: { type: "profile_completed" },
          });
          logger.error(error);
        });

        return {
          redirectTo: "/dashboard",
        };
      },
    );
  });
