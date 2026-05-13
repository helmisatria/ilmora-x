import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { avatarOptions, defaultAvatar } from "./avatar";
import { db } from "./db/client";
import { user } from "./db/schema";
import { parseInput } from "./http/validation";
import { readImpersonationPayload } from "./impersonation-cookie";

export type Viewer = {
  userId: string;
  email: string;
  name: string | null;
  image: string | null;
  sessionUserId: string;
  sessionEmail: string;
  profile: {
    displayName: string;
    institution: string | null;
    phone: string | null;
    avatar: string | null;
    photoUrl: string | null;
    completed: boolean;
    status: "active" | "suspended";
  } | null;
  admin: {
    role: "admin" | "super_admin";
  } | null;
  impersonation: {
    adminUserId: string;
    adminEmail: string;
    targetUserId: string;
  } | null;
};

const completeProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  institution: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(40).optional(),
  photoUrl: z.string().trim().url().optional().or(z.literal("")),
});

const updateProfileAvatarSchema = z.object({
  avatar: z.enum(avatarOptions),
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

  const admin = await getActiveAdminMembership(session.user.email);
  const impersonationPayload = admin
    ? await readImpersonationPayload(headers)
    : null;
  const canImpersonate = impersonationPayload?.adminUserId === session.user.id;
  const targetUserId = canImpersonate ? impersonationPayload.targetUserId : session.user.id;
  const [effectiveUser] = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    })
    .from(user)
    .where(eq(user.id, targetUserId))
    .limit(1);
  const effectiveSessionUser = effectiveUser ?? session.user;
  const profile = await getStudentProfile(effectiveSessionUser.id);

  return {
    userId: effectiveSessionUser.id,
    email: effectiveSessionUser.email,
    name: effectiveSessionUser.name ?? null,
    image: effectiveSessionUser.image ?? null,
    sessionUserId: session.user.id,
    sessionEmail: session.user.email,
    profile: profile
      ? {
          displayName: profile.displayName,
          institution: profile.institution,
          phone: profile.phone,
          avatar: profile.avatar,
          photoUrl: profile.photoUrl,
          completed: isProfileComplete(profile),
          status: profile.status as "active" | "suspended",
        }
      : null,
    admin,
    impersonation: canImpersonate && effectiveUser
      ? {
          adminUserId: session.user.id,
          adminEmail: session.user.email,
          targetUserId: effectiveUser.id,
        }
      : null,
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

        const existingProfile = await getStudentProfile(session.user.id);
        const nextAvatar = existingProfile?.avatar ?? (data.photoUrl || session.user.image ? "google" : defaultAvatar);
        const profile = {
          userId: session.user.id,
          displayName: data.displayName,
          institution: data.institution,
          phone: data.phone || null,
          avatar: nextAvatar,
          photoUrl: data.photoUrl || session.user.image || null,
          profileCompletedAt: now,
          updatedAt: now,
        };

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

export const updateProfileAvatar = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(updateProfileAvatarSchema, input))
  .handler(async ({ data }) => {
    const { observeServerOperation } = await import("./observability");

    return observeServerOperation(
      {
        operation: "auth.update_profile_avatar",
        kind: "server_function",
        method: "POST",
      },
      async () => {
        const { eq } = await import("drizzle-orm");
        const { db } = await import("./db/client");
        const { studentProfiles } = await import("./db/schema");
        const request = getRequest();
        const session = await ensureSessionFromHeaders(request.headers);
        const viewer = await getCurrentViewerFromHeaders(request.headers);

        if (viewer?.impersonation) {
          const { forbidden } = await import("./http/errors");

          throw forbidden("Profile edits are disabled while impersonating a Student.");
        }

        const [profile] = await db
          .select({ photoUrl: studentProfiles.photoUrl })
          .from(studentProfiles)
          .where(eq(studentProfiles.userId, session.user.id))
          .limit(1);

        const photoUrl = profile?.photoUrl ?? session.user.image ?? null;

        await db
          .insert(studentProfiles)
          .values({
            userId: session.user.id,
            displayName: session.user.name ?? session.user.email,
            avatar: data.avatar,
            photoUrl,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: studentProfiles.userId,
            set: {
              avatar: data.avatar,
              photoUrl,
              updatedAt: new Date(),
            },
          });

        return {
          avatar: data.avatar,
          photoUrl: data.avatar === "google" ? photoUrl : null,
        };
      },
    );
  });
