import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getCurrentViewerFromHeaders } from "./auth-functions";
import { db } from "./db/client";
import {
  adminMembers,
  attempts,
  categories,
  materi,
  questionReports,
  questions,
  studentProfiles,
  tryouts,
  user,
} from "./db/schema";
import { requireAdmin, requireSuperAdmin } from "./domain/admin";
import { notFound } from "./http/errors";
import { parseInput } from "./http/validation";

const studentStatusSchema = z.object({
  studentUserId: z.string().min(1),
  status: z.enum(["active", "suspended"]),
});

const addAdminSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  role: z.enum(["admin", "super_admin"]),
});

const removeAdminSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
});

async function getAdminViewer() {
  const request = getRequest();
  const viewer = await getCurrentViewerFromHeaders(request.headers);

  await requireAdmin(viewer?.email);

  if (!viewer) {
    throw notFound("Admin viewer was not found.");
  }

  return viewer;
}

async function getSuperAdminViewer() {
  const viewer = await getAdminViewer();
  await requireSuperAdmin(viewer.email);

  return viewer;
}

export const listStudentsAdmin = createServerFn({ method: "GET" }).handler(async () => {
  await getAdminViewer();

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
    joinedAt: row.joinedAt.toISOString(),
    profileCompletedAt: row.profileCompletedAt?.toISOString() ?? null,
    status: (row.status ?? "active") as "active" | "suspended",
  }));
});

export const listAdminsAdmin = createServerFn({ method: "GET" }).handler(async () => {
  await getAdminViewer();

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

export const setStudentStatusAdmin = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(studentStatusSchema, input))
  .handler(async ({ data }) => {
    await getAdminViewer();

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

export const addAdminAdmin = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(addAdminSchema, input))
  .handler(async ({ data }) => {
    const viewer = await getSuperAdminViewer();

    await db
      .insert(adminMembers)
      .values({
        email: data.email,
        role: data.role,
        createdByUserId: viewer.userId,
      })
      .onConflictDoUpdate({
        target: adminMembers.email,
        set: {
          role: data.role,
          removedAt: null,
          createdByUserId: viewer.userId,
        },
      });

    return { ok: true };
  });

export const removeAdminAdmin = createServerFn({ method: "POST" })
  .inputValidator((input) => parseInput(removeAdminSchema, input))
  .handler(async ({ data }) => {
    await getSuperAdminViewer();

    await db
      .update(adminMembers)
      .set({ removedAt: new Date() })
      .where(and(eq(adminMembers.email, data.email), isNull(adminMembers.removedAt)));

    return { ok: true };
  });

export const getAdminContentCounts = createServerFn({ method: "GET" }).handler(async () => {
  await getAdminViewer();

  const [categoryCount] = await db.select({ count: sql<number>`count(*)` }).from(categories);
  const [tryoutCount] = await db.select({ count: sql<number>`count(*)` }).from(tryouts);
  const [questionCount] = await db.select({ count: sql<number>`count(*)` }).from(questions);
  const [materiCount] = await db.select({ count: sql<number>`count(*)` }).from(materi);
  const [reportCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questionReports)
    .where(eq(questionReports.status, "open"));
  const [attemptCount] = await db.select({ count: sql<number>`count(*)` }).from(attempts);

  return {
    categories: Number(categoryCount?.count ?? 0),
    tryouts: Number(tryoutCount?.count ?? 0),
    questions: Number(questionCount?.count ?? 0),
    materi: Number(materiCount?.count ?? 0),
    openReports: Number(reportCount?.count ?? 0),
    attempts: Number(attemptCount?.count ?? 0),
  };
});
