import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../lib/db/client";
import {
  activityEvents,
  adminMembers,
  studentProfiles,
  user,
} from "../../lib/db/schema";
import { conflict, notFound } from "../../lib/http/errors";
import { parseInput } from "../../lib/http/validation";
import { requireAdmin } from "../identity/admin-membership";
import { getStudentEvaluation } from "../student-evaluation/student-evaluation";
import { adminMiddleware, superAdminMiddleware } from "./admin-access";

const studentStatusSchema = z.object({
  studentUserId: z.string().min(1),
  status: z.enum(["active", "suspended"]),
});

const studentUserIdSchema = z.object({
  studentUserId: z.string().trim().min(1),
});

const impersonateStudentSchema = z.object({
  studentUserId: z.string().min(1),
});

const addAdminSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  role: z.enum(["admin", "super_admin"]),
});

const removeAdminSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
});

export const listStudentsAdmin = createServerFn({ method: "GET" }).middleware([adminMiddleware]).handler(async ({ context }) => {
  const rows = await db
    .select({
      userId: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      joinedAt: user.createdAt,
      displayName: studentProfiles.displayName,
      institution: studentProfiles.institution,
      status: studentProfiles.status,
      profileCompletedAt: studentProfiles.profileCompletedAt,
    })
    .from(user)
    .leftJoin(studentProfiles, eq(studentProfiles.userId, user.id))
    .orderBy(desc(user.createdAt));

  return rows.map((row) => ({
    ...row,
    isCurrentSessionUser: row.userId === context.viewer.sessionUserId,
    joinedAt: row.joinedAt.toISOString(),
    profileCompletedAt: row.profileCompletedAt?.toISOString() ?? null,
    status: (row.status ?? "active") as "active" | "suspended",
  }));
});

export const listAdminsAdmin = createServerFn({ method: "GET" }).middleware([adminMiddleware]).handler(async () => {
  const rows = await db
    .select({
      email: adminMembers.email,
      role: adminMembers.role,
      createdAt: adminMembers.createdAt,
      removedAt: adminMembers.removedAt,
    })
    .from(adminMembers)
    .orderBy(desc(adminMembers.createdAt));

  return rows.map((row) => ({
    email: row.email,
    role: row.role as "admin" | "super_admin",
    active: row.removedAt === null,
    createdAt: row.createdAt.toISOString(),
    removedAt: row.removedAt?.toISOString() ?? null,
  }));
});

export const getStudentEvaluationAdmin = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(studentUserIdSchema, input))
  .handler(async ({ context, data }) => {
    const [student] = await db
      .select({
        userId: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        joinedAt: user.createdAt,
        displayName: studentProfiles.displayName,
        institution: studentProfiles.institution,
        phone: studentProfiles.phone,
        status: studentProfiles.status,
        profileCompletedAt: studentProfiles.profileCompletedAt,
      })
      .from(user)
      .leftJoin(studentProfiles, eq(studentProfiles.userId, user.id))
      .where(eq(user.id, data.studentUserId))
      .limit(1);

    if (!student) {
      throw notFound("Student was not found.");
    }

    const evaluation = await getStudentEvaluation(data.studentUserId);

    return {
      student: {
        userId: student.userId,
        name: student.displayName || student.name,
        email: student.email,
        googleName: student.name,
        image: student.image,
        isCurrentSessionUser: student.userId === context.viewer.sessionUserId,
        institution: student.institution ?? null,
        phone: student.phone ?? null,
        status: (student.status ?? "active") as "active" | "suspended",
        joinedAt: student.joinedAt.toISOString(),
        profileCompletedAt: student.profileCompletedAt?.toISOString() ?? null,
        profileCompleted: Boolean(student.profileCompletedAt),
      },
      summary: {
        ...evaluation.summary,
      },
      attempts: evaluation.attempts.map((attempt) => ({
        id: attempt.id,
        tryoutTitle: attempt.tryoutTitle,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        startedAt: attempt.startedAt.toISOString(),
        submittedAt: attempt.submittedAt?.toISOString() ?? null,
        score: attempt.score,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        totalQuestions: attempt.totalQuestions,
        xpEarned: attempt.xpEarned,
      })),
      categories: evaluation.categories,
    };
  });

export const setStudentStatusAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(studentStatusSchema, input))
  .handler(async ({ context, data }) => {
    const isSuspendingSelf = data.status === "suspended"
      && data.studentUserId === context.viewer.sessionUserId;

    if (isSuspendingSelf) {
      throw conflict("Admins cannot suspend their own account.");
    }

    const [existingProfile] = await db
      .select({ id: studentProfiles.id })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, data.studentUserId))
      .limit(1);

    if (!existingProfile) {
      throw notFound("Student profile was not found.");
    }

    await db
      .update(studentProfiles)
      .set({
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(studentProfiles.userId, data.studentUserId));

    return { ok: true };
  });

export const startStudentImpersonationAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(impersonateStudentSchema, input))
  .handler(async ({ context, data }) => {
    if (context.viewer.sessionUserId === data.studentUserId) {
      throw conflict("Admins cannot impersonate their own account.");
    }

    const [target] = await db
      .select({
        userId: user.id,
        email: user.email,
        status: studentProfiles.status,
      })
      .from(user)
      .leftJoin(studentProfiles, eq(studentProfiles.userId, user.id))
      .where(eq(user.id, data.studentUserId))
      .limit(1);

    if (!target) {
      throw notFound("Student was not found.");
    }

    const targetAdmin = await requireAdmin(target.email).catch(() => null);

    if (targetAdmin) {
      throw conflict("Admins cannot impersonate another Admin account.");
    }

    if (target.status === "suspended") {
      throw conflict("Suspended Students cannot be impersonated.");
    }

    const { setImpersonationCookieForStudent } = await import("../../lib/impersonation-cookie.server");

    await setImpersonationCookieForStudent(context.viewer.sessionUserId, target.userId);

    await db.insert(activityEvents).values({
      studentUserId: target.userId,
      eventType: "admin_impersonation_started",
      metadata: {
        adminUserId: context.viewer.sessionUserId,
        adminEmail: context.viewer.sessionEmail,
      },
    });

    return { ok: true, redirectTo: "/dashboard" };
  });

export const stopStudentImpersonationAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .handler(async ({ context }) => {
    const { clearImpersonationCookie } = await import("../../lib/impersonation-cookie.server");

    await clearImpersonationCookie();

    if (context.viewer.impersonation) {
      await db.insert(activityEvents).values({
        studentUserId: context.viewer.impersonation.targetUserId,
        eventType: "admin_impersonation_stopped",
        metadata: {
          adminUserId: context.viewer.sessionUserId,
          adminEmail: context.viewer.sessionEmail,
        },
      });
    }

    return { ok: true, redirectTo: "/admin/users" };
  });

export const addAdminAdmin = createServerFn({ method: "POST" })
  .middleware([superAdminMiddleware])
  .inputValidator((input) => parseInput(addAdminSchema, input))
  .handler(async ({ context, data }) => {
    await db
      .insert(adminMembers)
      .values({
        email: data.email,
        role: data.role,
        createdByUserId: context.viewer.sessionUserId,
      })
      .onConflictDoUpdate({
        target: adminMembers.email,
        set: {
          role: data.role,
          removedAt: null,
          createdByUserId: context.viewer.sessionUserId,
        },
      });

    return { ok: true };
  });

export const removeAdminAdmin = createServerFn({ method: "POST" })
  .middleware([superAdminMiddleware])
  .inputValidator((input) => parseInput(removeAdminSchema, input))
  .handler(async ({ data }) => {
    await db
      .update(adminMembers)
      .set({ removedAt: new Date() })
      .where(and(eq(adminMembers.email, data.email), isNull(adminMembers.removedAt)));

    return { ok: true };
  });
