import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, desc, eq, isNull, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { getCurrentViewerFromHeaders } from "./auth-functions";
import { db } from "./db/client";
import {
  adminMembers,
  activityEvents,
  attemptAnswers,
  attemptQuestionSnapshots,
  attempts,
  categories,
  materi,
  questionReports,
  questions,
  studentBadges,
  studentExpLedger,
  studentProfiles,
  subCategories,
  tryoutQuestions,
  tryouts,
  user,
} from "./db/schema";
import { badgeCodeToId, calculateCurrentStreak } from "./domain/engagement-surface";
import { requireAdmin, requireSuperAdmin } from "./domain/admin";
import { normalizeTryoutAccessLevel } from "./domain/premium-access";
import {
  createTryoutContent,
  createTryoutFromWorkbook,
  importTryoutWorkbook,
  publishTryoutContent,
  unpublishTryoutContent,
  updateTryoutContent,
} from "./domain/tryout-content-management";
import { conflict, notFound } from "./http/errors";
import { parseInput } from "./http/validation";

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

const taxonomyNameSchema = z.string().trim().min(1).max(120);
const taxonomySortOrderSchema = z.number().int().min(0).max(10000);

const createCategorySchema = z.object({
  name: taxonomyNameSchema,
  color: z.string().trim().max(40).optional(),
  sortOrder: taxonomySortOrderSchema,
});

const updateCategorySchema = createCategorySchema.extend({
  categoryId: z.string().trim().min(1),
});

const createSubCategorySchema = z.object({
  categoryId: z.string().trim().min(1),
  name: taxonomyNameSchema,
  sortOrder: taxonomySortOrderSchema,
});

const updateSubCategorySchema = z.object({
  subCategoryId: z.string().trim().min(1),
  name: taxonomyNameSchema,
  sortOrder: taxonomySortOrderSchema,
});

const reportStatusSchema = z.enum(["open", "reviewed", "resolved", "dismissed"]);

const reportFiltersSchema = z.object({
  status: z.union([reportStatusSchema, z.literal("all")]).optional(),
  tryoutId: z.string().trim().optional(),
  questionId: z.string().trim().optional(),
});

const updateReportStatusSchema = z.object({
  reportId: z.string().trim().min(1),
  status: reportStatusSchema,
});

const tryoutAccessLevelSchema = z.enum(["free", "premium"]);

const tryoutInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(500),
  categoryId: z.string().trim().min(1),
  durationMinutes: z.number().int().min(1).max(300),
  accessLevel: tryoutAccessLevelSchema,
});

const updateTryoutSchema = tryoutInputSchema.extend({
  tryoutId: z.string().trim().min(1),
});

const tryoutIdSchema = z.object({
  tryoutId: z.string().trim().min(1),
});

const questionOptionSchema = z.enum(["A", "B", "C", "D", "E"]);
const questionAccessLevelSchema = z.enum(["free", "premium"]);

const questionInputSchema = z.object({
  categoryId: z.string().trim().min(1),
  subCategoryId: z.string().trim().min(1),
  questionText: z.string().trim().min(1),
  optionA: z.string().trim().min(1),
  optionB: z.string().trim().min(1),
  optionC: z.string().trim().min(1),
  optionD: z.string().trim().min(1),
  optionE: z.string().trim().optional(),
  correctOption: questionOptionSchema,
  explanation: z.string().trim().min(1),
  videoUrl: z.string().trim().optional(),
  accessLevel: questionAccessLevelSchema,
});

const createQuestionSchema = questionInputSchema;

const updateQuestionSchema = questionInputSchema.extend({
  questionId: z.string().trim().min(1),
});

const questionIdSchema = z.object({
  questionId: z.string().trim().min(1),
});

const contentStatusSchema = z.enum(["draft", "published", "unpublished"]);

const tryoutWorkbookTryoutSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(500),
  categoryId: z.string().trim().optional().default(""),
  categoryName: z.string().trim().optional(),
  durationMinutes: z.number().int().min(1).max(300),
  accessLevel: tryoutAccessLevelSchema,
  status: contentStatusSchema,
});

const tryoutWorkbookQuestionSchema = z.object({
  questionId: z.string().trim().optional(),
  sortOrder: z.number().int().min(1).max(1000),
  categoryId: z.string().trim().optional().default(""),
  categoryName: z.string().trim().optional(),
  subCategoryId: z.string().trim().optional().default(""),
  subCategoryName: z.string().trim().optional(),
  questionText: z.string().trim().min(1),
  optionA: z.string().trim().min(1),
  optionB: z.string().trim().min(1),
  optionC: z.string().trim().min(1),
  optionD: z.string().trim().min(1),
  optionE: z.string().trim().optional(),
  correctOption: questionOptionSchema,
  explanation: z.string().trim().min(1),
  videoUrl: z.string().trim().optional(),
  accessLevel: questionAccessLevelSchema,
  status: contentStatusSchema,
});

const importTryoutWorkbookSchema = z.object({
  tryoutId: z.string().trim().min(1),
  tryout: tryoutWorkbookTryoutSchema,
  questions: z.array(tryoutWorkbookQuestionSchema).max(500),
});

const createTryoutWorkbookSchema = z.object({
  tryout: tryoutWorkbookTryoutSchema,
  questions: z.array(tryoutWorkbookQuestionSchema).max(500),
});

type SerializableJson =
  | null
  | boolean
  | number
  | string
  | SerializableJson[]
  | { [key: string]: SerializableJson };

type PgBossQueueRow = {
  name: string;
  policy: string;
  retryLimit: number;
  retryDelay: number;
  retryBackoff: boolean;
  expireSeconds: number;
  retentionSeconds: number;
  deletionSeconds: number;
  deadLetter: string | null;
  deferredCount: number;
  queuedCount: number;
  activeCount: number;
  totalCount: number;
  warningQueued: number;
  createdCount: number;
  retryCount: number;
  completedCount: number;
  cancelledCount: number;
  failedCount: number;
  oldestQueuedAt: Date | null;
  newestFailedAt: Date | null;
  monitorOn: Date | null;
  maintainOn: Date | null;
  createdOn: Date;
  updatedOn: Date;
};

type PgBossScheduleRow = {
  name: string;
  key: string;
  cron: string;
  timezone: string | null;
  data: SerializableJson;
  options: SerializableJson;
  createdOn: Date;
  updatedOn: Date;
};

async function getAdminViewer() {
  const request = getRequest();
  const viewer = await getCurrentViewerFromHeaders(request.headers);

  await requireAdmin(viewer?.sessionEmail);

  if (!viewer) {
    throw notFound("Admin viewer was not found.");
  }

  return viewer;
}

async function executeRows<T>(query: SQL) {
  const result = (await db.execute(query)) as unknown;

  if (Array.isArray(result)) return result as T[];
  if (!result || typeof result !== "object") return [];
  if (!("rows" in result) || !Array.isArray(result.rows)) return [];

  return result.rows as T[];
}

async function pgBossTableExists(tableName: string) {
  const [row] = await executeRows<{ exists: boolean }>(sql`
    select exists (
      select 1
      from information_schema.tables
      where table_schema = 'pgboss'
        and table_name = ${tableName}
    ) as "exists"
  `);

  return row?.exists === true;
}

const adminMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const viewer = await getAdminViewer();

  return next({
    context: { viewer },
  });
});

const superAdminMiddleware = createMiddleware({ type: "function" })
  .middleware([adminMiddleware])
  .server(async ({ context, next }) => {
    await requireSuperAdmin(context.viewer.sessionEmail);

    return next();
  });

async function ensureCategoryExists(categoryId: string) {
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  if (category) return;

  throw notFound("Category was not found.");
}

async function ensureSubCategoryBelongsToCategory(categoryId: string, subCategoryId: string) {
  const [subCategory] = await db
    .select({ id: subCategories.id })
    .from(subCategories)
    .where(and(eq(subCategories.id, subCategoryId), eq(subCategories.categoryId, categoryId)))
    .limit(1);

  if (subCategory) return;

  throw notFound("Sub-category was not found for this category.");
}

async function ensureCategoryNameAvailable(name: string, currentCategoryId?: string) {
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(sql`lower(trim(${categories.name})) = lower(trim(${name}))`)
    .limit(1);

  if (!category) return;
  if (category.id === currentCategoryId) return;

  throw conflict("A Category with this name already exists.");
}

async function ensureSubCategoryNameAvailable(categoryId: string, name: string, currentSubCategoryId?: string) {
  const [subCategory] = await db
    .select({ id: subCategories.id })
    .from(subCategories)
    .where(and(
      eq(subCategories.categoryId, categoryId),
      sql`lower(trim(${subCategories.name})) = lower(trim(${name}))`,
    ))
    .limit(1);

  if (!subCategory) return;
  if (subCategory.id === currentSubCategoryId) return;

  throw conflict("A Sub-category with this name already exists in this Category.");
}

function makeTaxonomySlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug) return slug;

  return `taxonomy-${Date.now()}`;
}

function normalizeOptionalText(value: string | undefined) {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) return null;

  return trimmedValue;
}

function validateQuestionOptionE(data: z.infer<typeof questionInputSchema>) {
  if (data.correctOption !== "E") return;
  if (data.optionE?.trim()) return;

  throw conflict("Option E is required when the correct option is E.");
}

async function validateQuestionTaxonomy(categoryId: string, subCategoryId: string) {
  await ensureCategoryExists(categoryId);
  await ensureSubCategoryBelongsToCategory(categoryId, subCategoryId);
}

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

    const submittedAttempts = await db
      .select({
        id: attempts.id,
        tryoutTitle: tryouts.title,
        attemptNumber: attempts.attemptNumber,
        status: attempts.status,
        startedAt: attempts.startedAt,
        submittedAt: attempts.submittedAt,
        score: attempts.score,
        correctCount: attempts.correctCount,
        wrongCount: attempts.wrongCount,
        totalQuestions: attempts.totalQuestions,
        xpEarned: attempts.xpEarned,
      })
      .from(attempts)
      .innerJoin(tryouts, eq(tryouts.id, attempts.tryoutId))
      .where(and(
        eq(attempts.studentUserId, data.studentUserId),
        sql`${attempts.status} in ('submitted', 'auto_submitted')`,
      ))
      .orderBy(desc(attempts.submittedAt));

    const categoryRows = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        categoryColor: categories.color,
        total: sql<number>`count(${attemptQuestionSnapshots.id})`,
        correct: sql<number>`sum(case when ${attemptAnswers.isCorrect} then 1 else 0 end)`,
      })
      .from(attemptQuestionSnapshots)
      .innerJoin(attempts, eq(attempts.id, attemptQuestionSnapshots.attemptId))
      .innerJoin(categories, eq(categories.id, attemptQuestionSnapshots.categoryId))
      .leftJoin(
        attemptAnswers,
        and(
          eq(attemptAnswers.attemptId, attempts.id),
          eq(attemptAnswers.snapshotId, attemptQuestionSnapshots.id),
        ),
      )
      .where(and(
        eq(attempts.studentUserId, data.studentUserId),
        sql`${attempts.status} in ('submitted', 'auto_submitted')`,
      ))
      .groupBy(categories.id);

    const subCategoryRows = await db
      .select({
        categoryId: categories.id,
        subCategoryId: subCategories.id,
        subCategoryName: subCategories.name,
        total: sql<number>`count(${attemptQuestionSnapshots.id})`,
        correct: sql<number>`sum(case when ${attemptAnswers.isCorrect} then 1 else 0 end)`,
      })
      .from(attemptQuestionSnapshots)
      .innerJoin(attempts, eq(attempts.id, attemptQuestionSnapshots.attemptId))
      .innerJoin(categories, eq(categories.id, attemptQuestionSnapshots.categoryId))
      .innerJoin(subCategories, eq(subCategories.id, attemptQuestionSnapshots.subCategoryId))
      .leftJoin(
        attemptAnswers,
        and(
          eq(attemptAnswers.attemptId, attempts.id),
          eq(attemptAnswers.snapshotId, attemptQuestionSnapshots.id),
        ),
      )
      .where(and(
        eq(attempts.studentUserId, data.studentUserId),
        sql`${attempts.status} in ('submitted', 'auto_submitted')`,
      ))
      .groupBy(categories.id, subCategories.id);

    const [badgeRewardRow] = await db
      .select({
        xp: sql<number>`coalesce(sum(${studentExpLedger.xpAmount}), 0)`,
      })
      .from(studentExpLedger)
      .where(and(
        eq(studentExpLedger.studentUserId, data.studentUserId),
        eq(studentExpLedger.sourceType, "badge_reward"),
      ));

    const badgeRows = await db
      .select({ badgeCode: studentBadges.badgeCode })
      .from(studentBadges)
      .where(eq(studentBadges.studentUserId, data.studentUserId));

    const totalQuestions = submittedAttempts.reduce((total, attempt) => total + attempt.totalQuestions, 0);
    const totalCorrect = submittedAttempts.reduce((total, attempt) => total + (attempt.correctCount ?? 0), 0);
    const attemptXp = submittedAttempts.reduce((total, attempt) => total + attempt.xpEarned, 0);
    const badgeRewardXp = Number(badgeRewardRow?.xp ?? 0);
    const xp = attemptXp + badgeRewardXp;

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
        xp,
        attemptXp,
        badgeRewardXp,
        streak: calculateCurrentStreak(submittedAttempts.map((attempt) => attempt.submittedAt)),
        totalAttempts: submittedAttempts.length,
        totalQuestions,
        totalCorrect,
        totalWrong: Math.max(totalQuestions - totalCorrect, 0),
        accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
        awardedBadgeIds: badgeRows
          .map((badge) => badgeCodeToId(badge.badgeCode))
          .filter((badgeId): badgeId is number => badgeId !== null),
      },
      attempts: submittedAttempts.map((attempt) => ({
        id: attempt.id,
        tryoutTitle: attempt.tryoutTitle,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status as "submitted" | "auto_submitted",
        startedAt: attempt.startedAt.toISOString(),
        submittedAt: attempt.submittedAt?.toISOString() ?? null,
        score: attempt.score ?? 0,
        correctCount: attempt.correctCount ?? 0,
        wrongCount: attempt.wrongCount ?? 0,
        totalQuestions: attempt.totalQuestions,
        xpEarned: attempt.xpEarned,
      })),
      categories: categoryRows.map((row) => ({
        id: row.categoryId,
        name: row.categoryName,
        color: row.categoryColor ?? "#205072",
        total: Number(row.total ?? 0),
        correct: Number(row.correct ?? 0),
        subCategories: subCategoryRows
          .filter((subCategory) => subCategory.categoryId === row.categoryId)
          .map((subCategory) => ({
            id: subCategory.subCategoryId,
            name: subCategory.subCategoryName,
            total: Number(subCategory.total ?? 0),
            correct: Number(subCategory.correct ?? 0),
          })),
      })),
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

    const { setImpersonationCookieForStudent } = await import("./impersonation-cookie.server");

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
    const { clearImpersonationCookie } = await import("./impersonation-cookie.server");

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

export const getQueueMonitoringAdmin = createServerFn({ method: "GET" })
  .middleware([superAdminMiddleware])
  .handler(async () => {
    const hasQueueTable = await pgBossTableExists("queue");
    const hasScheduleTable = await pgBossTableExists("schedule");
    const hasJobTable = await pgBossTableExists("job");

    if (!hasQueueTable && !hasScheduleTable && !hasJobTable) {
      return {
        installed: false,
        queues: [] as PgBossQueueRow[],
        schedules: [] as PgBossScheduleRow[],
      };
    }

    const queues = hasQueueTable && hasJobTable
      ? await executeRows<PgBossQueueRow>(sql`
          select
            q.name,
            q.policy,
            q.retry_limit as "retryLimit",
            q.retry_delay as "retryDelay",
            q.retry_backoff as "retryBackoff",
            q.expire_seconds as "expireSeconds",
            q.retention_seconds as "retentionSeconds",
            q.deletion_seconds as "deletionSeconds",
            q.dead_letter as "deadLetter",
            q.deferred_count as "deferredCount",
            q.queued_count as "queuedCount",
            q.active_count as "activeCount",
            q.total_count as "totalCount",
            q.warning_queued as "warningQueued",
            coalesce(count(j.id) filter (where j.state = 'created'::pgboss.job_state), 0)::int as "createdCount",
            coalesce(count(j.id) filter (where j.state = 'retry'::pgboss.job_state), 0)::int as "retryCount",
            coalesce(count(j.id) filter (where j.state = 'completed'::pgboss.job_state), 0)::int as "completedCount",
            coalesce(count(j.id) filter (where j.state = 'cancelled'::pgboss.job_state), 0)::int as "cancelledCount",
            coalesce(count(j.id) filter (where j.state = 'failed'::pgboss.job_state), 0)::int as "failedCount",
            min(j.created_on) filter (where j.state in ('created'::pgboss.job_state, 'retry'::pgboss.job_state)) as "oldestQueuedAt",
            max(j.completed_on) filter (where j.state = 'failed'::pgboss.job_state) as "newestFailedAt",
            q.monitor_on as "monitorOn",
            q.maintain_on as "maintainOn",
            q.created_on as "createdOn",
            q.updated_on as "updatedOn"
          from pgboss.queue q
          left join pgboss.job j on j.name = q.name
          group by q.name
          order by q.name
        `)
      : hasQueueTable
        ? await executeRows<PgBossQueueRow>(sql`
            select
              q.name,
              q.policy,
              q.retry_limit as "retryLimit",
              q.retry_delay as "retryDelay",
              q.retry_backoff as "retryBackoff",
              q.expire_seconds as "expireSeconds",
              q.retention_seconds as "retentionSeconds",
              q.deletion_seconds as "deletionSeconds",
              q.dead_letter as "deadLetter",
              q.deferred_count as "deferredCount",
              q.queued_count as "queuedCount",
              q.active_count as "activeCount",
              q.total_count as "totalCount",
              q.warning_queued as "warningQueued",
              0::int as "createdCount",
              0::int as "retryCount",
              0::int as "completedCount",
              0::int as "cancelledCount",
              0::int as "failedCount",
              null::timestamp with time zone as "oldestQueuedAt",
              null::timestamp with time zone as "newestFailedAt",
              q.monitor_on as "monitorOn",
              q.maintain_on as "maintainOn",
              q.created_on as "createdOn",
              q.updated_on as "updatedOn"
            from pgboss.queue q
            order by q.name
          `)
        : [];

    const schedules = hasScheduleTable
      ? await executeRows<PgBossScheduleRow>(sql`
          select
            name,
            key,
            cron,
            timezone,
            data,
            options,
            created_on as "createdOn",
            updated_on as "updatedOn"
          from pgboss.schedule
          order by name, key
        `)
      : [];

    return {
      installed: true,
      queues,
      schedules,
    };
  });

export const listCategoriesAdmin = createServerFn({ method: "GET" }).middleware([adminMiddleware]).handler(async () => {
  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      color: categories.color,
      sortOrder: categories.sortOrder,
    })
    .from(categories)
    .orderBy(categories.sortOrder, categories.name);

  return rows;
});

export const listCategoryOptionsAdmin = createServerFn({ method: "GET" }).middleware([adminMiddleware]).handler(async () => {
  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      color: categories.color,
      sortOrder: categories.sortOrder,
      subCategoryId: subCategories.id,
      subCategorySlug: subCategories.slug,
      subCategoryName: subCategories.name,
      subCategorySortOrder: subCategories.sortOrder,
    })
    .from(categories)
    .leftJoin(subCategories, eq(subCategories.categoryId, categories.id))
    .orderBy(categories.sortOrder, categories.name, subCategories.sortOrder, subCategories.name);

  const categoryMap = new Map<string, {
    id: string;
    slug: string;
    name: string;
    color: string | null;
    sortOrder: number;
    subCategories: { id: string; slug: string; name: string; sortOrder: number }[];
  }>();

  for (const row of rows) {
    const category = categoryMap.get(row.id) ?? {
      id: row.id,
      slug: row.slug,
      name: row.name,
      color: row.color,
      sortOrder: row.sortOrder,
      subCategories: [],
    };

    if (row.subCategoryId && row.subCategorySlug && row.subCategoryName) {
      category.subCategories.push({
        id: row.subCategoryId,
        slug: row.subCategorySlug,
        name: row.subCategoryName,
        sortOrder: row.subCategorySortOrder ?? 0,
      });
    }

    categoryMap.set(row.id, category);
  }

  return Array.from(categoryMap.values());
});

export const createCategoryAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(createCategorySchema, input))
  .handler(async ({ data }) => {
    await ensureCategoryNameAvailable(data.name);

    try {
      await db.insert(categories).values({
        slug: makeTaxonomySlug(data.name),
        name: data.name,
        color: normalizeOptionalText(data.color),
        sortOrder: data.sortOrder,
      });
    } catch {
      throw conflict("A Category with this slug already exists.");
    }

    return { ok: true };
  });

export const updateCategoryAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(updateCategorySchema, input))
  .handler(async ({ data }) => {
    await ensureCategoryExists(data.categoryId);
    await ensureCategoryNameAvailable(data.name, data.categoryId);

    await db
      .update(categories)
      .set({
        name: data.name,
        color: normalizeOptionalText(data.color),
        sortOrder: data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, data.categoryId));

    return { ok: true };
  });

export const createSubCategoryAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(createSubCategorySchema, input))
  .handler(async ({ data }) => {
    await ensureCategoryExists(data.categoryId);
    await ensureSubCategoryNameAvailable(data.categoryId, data.name);

    try {
      await db.insert(subCategories).values({
        categoryId: data.categoryId,
        slug: makeTaxonomySlug(data.name),
        name: data.name,
        sortOrder: data.sortOrder,
      });
    } catch {
      throw conflict("A Sub-category with this slug already exists in this Category.");
    }

    return { ok: true };
  });

export const updateSubCategoryAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(updateSubCategorySchema, input))
  .handler(async ({ data }) => {
    const [subCategory] = await db
      .select({
        id: subCategories.id,
        categoryId: subCategories.categoryId,
      })
      .from(subCategories)
      .where(eq(subCategories.id, data.subCategoryId))
      .limit(1);

    if (!subCategory) {
      throw notFound("Sub-category was not found.");
    }

    await ensureSubCategoryNameAvailable(subCategory.categoryId, data.name, data.subCategoryId);

    await db
      .update(subCategories)
      .set({
        name: data.name,
        sortOrder: data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(subCategories.id, data.subCategoryId));

    return { ok: true };
  });

export const listTryoutsAdmin = createServerFn({ method: "GET" }).middleware([adminMiddleware]).handler(async () => {
  const rows = await db
    .select({
      id: tryouts.id,
      slug: tryouts.slug,
      title: tryouts.title,
      description: tryouts.description,
      categoryId: tryouts.categoryId,
      categoryName: categories.name,
      durationMinutes: tryouts.durationMinutes,
      accessLevel: tryouts.accessLevel,
      status: tryouts.status,
      publishedAt: tryouts.publishedAt,
      updatedAt: tryouts.updatedAt,
    })
    .from(tryouts)
    .innerJoin(categories, eq(categories.id, tryouts.categoryId))
    .orderBy(desc(tryouts.updatedAt));

  return rows.map((row) => ({
    ...row,
    accessLevel: normalizeTryoutAccessLevel(row.accessLevel),
    status: row.status as "draft" | "published" | "unpublished",
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  }));
});

export const createTryoutAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(tryoutInputSchema, input))
  .handler(async ({ data }) => {
    return createTryoutContent(data);
  });

export const updateTryoutAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(updateTryoutSchema, input))
  .handler(async ({ data }) => {
    return updateTryoutContent(data);
  });

export const publishTryoutAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(tryoutIdSchema, input))
  .handler(async ({ data }) => {
    return publishTryoutContent(data.tryoutId);
  });

export const unpublishTryoutAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(tryoutIdSchema, input))
  .handler(async ({ data }) => {
    return unpublishTryoutContent(data.tryoutId);
  });

export const getTryoutWorkbookAdmin = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(tryoutIdSchema, input))
  .handler(async ({ data }) => {
    const [tryout] = await db
      .select({
        id: tryouts.id,
        slug: tryouts.slug,
        title: tryouts.title,
        description: tryouts.description,
        categoryId: tryouts.categoryId,
        durationMinutes: tryouts.durationMinutes,
        accessLevel: tryouts.accessLevel,
        status: tryouts.status,
      })
      .from(tryouts)
      .where(eq(tryouts.id, data.tryoutId))
      .limit(1);

    if (!tryout) {
      throw notFound("Try-out was not found.");
    }

    const rows = await db
      .select({
        questionId: questions.id,
        sortOrder: tryoutQuestions.sortOrder,
        categoryId: questions.categoryId,
        subCategoryId: questions.subCategoryId,
        questionText: questions.questionText,
        optionA: questions.optionA,
        optionB: questions.optionB,
        optionC: questions.optionC,
        optionD: questions.optionD,
        optionE: questions.optionE,
        correctOption: questions.correctOption,
        explanation: questions.explanation,
        videoUrl: questions.videoUrl,
        accessLevel: questions.accessLevel,
        status: questions.status,
      })
      .from(tryoutQuestions)
      .innerJoin(questions, eq(questions.id, tryoutQuestions.questionId))
      .where(eq(tryoutQuestions.tryoutId, data.tryoutId))
      .orderBy(tryoutQuestions.sortOrder);

    return {
      tryout: {
        ...tryout,
        accessLevel: normalizeTryoutAccessLevel(tryout.accessLevel),
        status: tryout.status as "draft" | "published" | "unpublished",
      },
      questions: rows.map((row) => ({
        ...row,
        optionE: row.optionE ?? "",
        videoUrl: row.videoUrl ?? "",
        correctOption: row.correctOption as "A" | "B" | "C" | "D" | "E",
        accessLevel: row.accessLevel as "free" | "premium",
        status: row.status as "draft" | "published" | "unpublished",
      })),
    };
  });

export const importTryoutWorkbookAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(importTryoutWorkbookSchema, input))
  .handler(async ({ data }) => {
    return importTryoutWorkbook(data);
  });

export const createTryoutFromWorkbookAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(createTryoutWorkbookSchema, input))
  .handler(async ({ data }) => {
    return createTryoutFromWorkbook(data);
  });

export const listQuestionsAdmin = createServerFn({ method: "GET" }).middleware([adminMiddleware]).handler(async () => {
  const rows = await db
    .select({
      id: questions.id,
      categoryId: questions.categoryId,
      categoryName: categories.name,
      subCategoryId: questions.subCategoryId,
      subCategoryName: subCategories.name,
      questionText: questions.questionText,
      optionA: questions.optionA,
      optionB: questions.optionB,
      optionC: questions.optionC,
      optionD: questions.optionD,
      optionE: questions.optionE,
      correctOption: questions.correctOption,
      explanation: questions.explanation,
      videoUrl: questions.videoUrl,
      accessLevel: questions.accessLevel,
      status: questions.status,
      updatedAt: questions.updatedAt,
    })
    .from(questions)
    .innerJoin(categories, eq(categories.id, questions.categoryId))
    .innerJoin(subCategories, eq(subCategories.id, questions.subCategoryId))
    .orderBy(desc(questions.updatedAt));

  return rows.map((row) => ({
    ...row,
    correctOption: row.correctOption as "A" | "B" | "C" | "D" | "E",
    accessLevel: row.accessLevel as "free" | "premium",
    status: row.status as "draft" | "published" | "unpublished",
    updatedAt: row.updatedAt.toISOString(),
  }));
});

export const createQuestionAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(createQuestionSchema, input))
  .handler(async ({ data }) => {
    validateQuestionOptionE(data);
    await validateQuestionTaxonomy(data.categoryId, data.subCategoryId);

    await db.insert(questions).values({
      categoryId: data.categoryId,
      subCategoryId: data.subCategoryId,
      questionText: data.questionText,
      optionA: data.optionA,
      optionB: data.optionB,
      optionC: data.optionC,
      optionD: data.optionD,
      optionE: normalizeOptionalText(data.optionE),
      correctOption: data.correctOption,
      explanation: data.explanation,
      videoUrl: normalizeOptionalText(data.videoUrl),
      accessLevel: data.accessLevel,
      status: "draft",
    });

    return { ok: true };
  });

export const updateQuestionAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(updateQuestionSchema, input))
  .handler(async ({ data }) => {
    validateQuestionOptionE(data);
    await validateQuestionTaxonomy(data.categoryId, data.subCategoryId);

    const [existingQuestion] = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.id, data.questionId))
      .limit(1);

    if (!existingQuestion) {
      throw notFound("Question was not found.");
    }

    await db
      .update(questions)
      .set({
        categoryId: data.categoryId,
        subCategoryId: data.subCategoryId,
        questionText: data.questionText,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        optionE: normalizeOptionalText(data.optionE),
        correctOption: data.correctOption,
        explanation: data.explanation,
        videoUrl: normalizeOptionalText(data.videoUrl),
        accessLevel: data.accessLevel,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, data.questionId));

    return { ok: true };
  });

export const publishQuestionAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(questionIdSchema, input))
  .handler(async ({ data }) => {
    await db
      .update(questions)
      .set({
        status: "published",
        updatedAt: new Date(),
      })
      .where(eq(questions.id, data.questionId));

    return { ok: true };
  });

export const unpublishQuestionAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(questionIdSchema, input))
  .handler(async ({ data }) => {
    await db
      .update(questions)
      .set({
        status: "unpublished",
        updatedAt: new Date(),
      })
      .where(eq(questions.id, data.questionId));

    return { ok: true };
  });

export const listQuestionReportsAdmin = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(reportFiltersSchema, input ?? {}))
  .handler(async ({ data }) => {
    const conditions = [];

    if (data.status && data.status !== "all") {
      conditions.push(eq(questionReports.status, data.status));
    }

    if (data.tryoutId) {
      conditions.push(eq(attempts.tryoutId, data.tryoutId));
    }

    if (data.questionId) {
      conditions.push(eq(questionReports.questionId, data.questionId));
    }

    const rows = await db
      .select({
        id: questionReports.id,
        status: questionReports.status,
        reason: questionReports.reason,
        note: questionReports.note,
        createdAt: questionReports.createdAt,
        resolvedAt: questionReports.resolvedAt,
        resolvedByUserId: questionReports.resolvedByUserId,
        studentUserId: questionReports.studentUserId,
        studentName: user.name,
        studentEmail: user.email,
        questionId: questionReports.questionId,
        attemptId: questionReports.attemptId,
        snapshotId: questionReports.snapshotId,
        tryoutId: attempts.tryoutId,
        tryoutTitle: tryouts.title,
        attemptNumber: attempts.attemptNumber,
        attemptScore: attempts.score,
        categoryName: categories.name,
        subCategoryName: subCategories.name,
        questionText: attemptQuestionSnapshots.questionText,
        selectedOption: attemptAnswers.selectedOption,
        correctOption: attemptQuestionSnapshots.correctOption,
        explanation: attemptQuestionSnapshots.explanation,
      })
      .from(questionReports)
      .innerJoin(user, eq(user.id, questionReports.studentUserId))
      .innerJoin(attempts, eq(attempts.id, questionReports.attemptId))
      .innerJoin(tryouts, eq(tryouts.id, attempts.tryoutId))
      .innerJoin(attemptQuestionSnapshots, eq(attemptQuestionSnapshots.id, questionReports.snapshotId))
      .innerJoin(categories, eq(categories.id, attemptQuestionSnapshots.categoryId))
      .innerJoin(subCategories, eq(subCategories.id, attemptQuestionSnapshots.subCategoryId))
      .leftJoin(
        attemptAnswers,
        and(
          eq(attemptAnswers.attemptId, questionReports.attemptId),
          eq(attemptAnswers.snapshotId, questionReports.snapshotId),
        ),
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(questionReports.createdAt));

    const tryoutRows = await db
      .select({
        id: tryouts.id,
        title: tryouts.title,
      })
      .from(questionReports)
      .innerJoin(attempts, eq(attempts.id, questionReports.attemptId))
      .innerJoin(tryouts, eq(tryouts.id, attempts.tryoutId))
      .groupBy(tryouts.id)
      .orderBy(tryouts.title);
    const questionRows = await db
      .select({
        id: questionReports.questionId,
        questionText: attemptQuestionSnapshots.questionText,
      })
      .from(questionReports)
      .innerJoin(attemptQuestionSnapshots, eq(attemptQuestionSnapshots.id, questionReports.snapshotId))
      .groupBy(questionReports.questionId, attemptQuestionSnapshots.questionText)
      .orderBy(attemptQuestionSnapshots.questionText);

    return {
      reports: rows.map((row) => ({
        ...row,
        status: row.status as "open" | "reviewed" | "resolved" | "dismissed",
        reason: row.reason as "answer_key_wrong" | "explanation_wrong" | "question_unclear" | "typo" | "other",
        selectedOption: row.selectedOption as "A" | "B" | "C" | "D" | "E" | null,
        correctOption: row.correctOption as "A" | "B" | "C" | "D" | "E",
        createdAt: row.createdAt.toISOString(),
        resolvedAt: row.resolvedAt?.toISOString() ?? null,
        note: row.note ?? "",
        attemptScore: row.attemptScore ?? 0,
      })),
      tryouts: tryoutRows,
      questions: questionRows,
    };
  });

export const updateQuestionReportStatusAdmin = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(updateReportStatusSchema, input))
  .handler(async ({ context, data }) => {
    const [report] = await db
      .select({ id: questionReports.id })
      .from(questionReports)
      .where(eq(questionReports.id, data.reportId))
      .limit(1);

    if (!report) {
      throw notFound("Question report was not found.");
    }

    const reviewedAt = data.status === "open" ? null : new Date();
    const reviewedByUserId = data.status === "open" ? null : context.viewer.userId;

    await db
      .update(questionReports)
      .set({
        status: data.status,
        resolvedAt: reviewedAt,
        resolvedByUserId: reviewedByUserId,
      })
      .where(eq(questionReports.id, data.reportId));

    return { ok: true };
  });

export const getAdminContentCounts = createServerFn({ method: "GET" }).middleware([adminMiddleware]).handler(async () => {
  const [categoryCount] = await db.select({ count: sql<number>`count(*)` }).from(categories);
  const [tryoutCount] = await db.select({ count: sql<number>`count(*)` }).from(tryouts);
  const [questionCount] = await db.select({ count: sql<number>`count(*)` }).from(questions);
  const [materiCount] = await db.select({ count: sql<number>`count(*)` }).from(materi);
  const [studentCount] = await db.select({ count: sql<number>`count(*)` }).from(studentProfiles);
  const [activeStudentCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(studentProfiles)
    .where(eq(studentProfiles.status, "active"));
  const [reportCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questionReports)
    .where(eq(questionReports.status, "open"));
  const [completedAttemptCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(attempts)
    .where(sql`${attempts.status} in ('submitted', 'auto_submitted')`);
  const [averageScore] = await db
    .select({ score: sql<number>`coalesce(round(avg(${attempts.score})), 0)` })
    .from(attempts)
    .where(sql`${attempts.status} in ('submitted', 'auto_submitted')`);
  const difficultQuestions = await db
    .select({
      questionId: attemptQuestionSnapshots.questionId,
      questionText: attemptQuestionSnapshots.questionText,
      totalAnswers: sql<number>`count(${attemptAnswers.id})`,
      correctAnswers: sql<number>`sum(case when ${attemptAnswers.isCorrect} then 1 else 0 end)`,
      accuracy: sql<number>`round(100.0 * sum(case when ${attemptAnswers.isCorrect} then 1 else 0 end) / nullif(count(${attemptAnswers.id}), 0))`,
    })
    .from(attemptQuestionSnapshots)
    .innerJoin(attemptAnswers, eq(attemptAnswers.snapshotId, attemptQuestionSnapshots.id))
    .innerJoin(attempts, eq(attempts.id, attemptQuestionSnapshots.attemptId))
    .where(and(
      sql`${attempts.status} in ('submitted', 'auto_submitted')`,
      sql`${attemptAnswers.selectedOption} is not null`,
    ))
    .groupBy(attemptQuestionSnapshots.questionId, attemptQuestionSnapshots.questionText)
    .having(sql`count(${attemptAnswers.id}) > 0`)
    .orderBy(sql`round(100.0 * sum(case when ${attemptAnswers.isCorrect} then 1 else 0 end) / nullif(count(${attemptAnswers.id}), 0))`)
    .limit(5);
  const reportedQuestions = await db
    .select({
      questionId: questionReports.questionId,
      questionText: questions.questionText,
      openReports: sql<number>`count(${questionReports.id})`,
    })
    .from(questionReports)
    .innerJoin(questions, eq(questions.id, questionReports.questionId))
    .where(eq(questionReports.status, "open"))
    .groupBy(questionReports.questionId, questions.questionText)
    .orderBy(desc(sql`count(${questionReports.id})`))
    .limit(5);
  const tryoutParticipation = await db
    .select({
      tryoutId: tryouts.id,
      title: tryouts.title,
      completedAttempts: sql<number>`count(${attempts.id})`,
      averageScore: sql<number>`coalesce(round(avg(${attempts.score})), 0)`,
    })
    .from(tryouts)
    .leftJoin(
      attempts,
      and(
        eq(attempts.tryoutId, tryouts.id),
        sql`${attempts.status} in ('submitted', 'auto_submitted')`,
      ),
    )
    .groupBy(tryouts.id)
    .orderBy(desc(sql`count(${attempts.id})`), tryouts.title)
    .limit(5);

  return {
    categories: Number(categoryCount?.count ?? 0),
    tryouts: Number(tryoutCount?.count ?? 0),
    questions: Number(questionCount?.count ?? 0),
    materi: Number(materiCount?.count ?? 0),
    students: Number(studentCount?.count ?? 0),
    activeStudents: Number(activeStudentCount?.count ?? 0),
    openReports: Number(reportCount?.count ?? 0),
    completedAttempts: Number(completedAttemptCount?.count ?? 0),
    averageScore: Number(averageScore?.score ?? 0),
    difficultQuestions: difficultQuestions.map((question) => ({
      questionId: question.questionId,
      questionText: question.questionText,
      totalAnswers: Number(question.totalAnswers ?? 0),
      correctAnswers: Number(question.correctAnswers ?? 0),
      accuracy: Number(question.accuracy ?? 0),
    })),
    reportedQuestions: reportedQuestions.map((question) => ({
      questionId: question.questionId,
      questionText: question.questionText,
      openReports: Number(question.openReports ?? 0),
    })),
    tryoutParticipation: tryoutParticipation.map((tryout) => ({
      tryoutId: tryout.tryoutId,
      title: tryout.title,
      completedAttempts: Number(tryout.completedAttempts ?? 0),
      averageScore: Number(tryout.averageScore ?? 0),
    })),
  };
});
