import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("session_userId_idx").on(table.userId),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("account_userId_idx").on(table.userId),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("verification_identifier_idx").on(table.identifier),
  ],
);

export const studentProfiles = pgTable("student_profiles", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  institution: text("institution"),
  phone: text("phone"),
  avatar: text("avatar"),
  photoUrl: text("photo_url"),
  profileCompletedAt: timestamp("profile_completed_at", { withTimezone: true }),
  status: text("status").notNull().default("active"),
  ...timestamps,
}, (table) => [
  check("student_profiles_status_check", sql`${table.status} in ('active', 'suspended')`),
]);

export const adminMembers = pgTable("admin_members", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
  createdByUserId: text("created_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  removedAt: timestamp("removed_at", { withTimezone: true }),
}, (table) => [
  check("admin_members_role_check", sql`${table.role} in ('admin', 'super_admin')`),
]);

export const categories = pgTable("categories", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  color: text("color"),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const subCategories = pgTable("sub_categories", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
}, (table) => [
  unique("sub_categories_category_slug_unique").on(table.categoryId, table.slug),
]);

export const tryouts = pgTable("tryouts", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  categoryId: text("category_id").notNull().references(() => categories.id),
  durationMinutes: integer("duration_minutes").notNull(),
  accessLevel: text("access_level").notNull(),
  status: text("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  check("tryouts_access_level_check", sql`${table.accessLevel} in ('free', 'premium', 'platinum')`),
  check("tryouts_status_check", sql`${table.status} in ('draft', 'published', 'unpublished')`),
  check("tryouts_duration_check", sql`${table.durationMinutes} between 1 and 300`),
]);

export const questions = pgTable("questions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: text("category_id").notNull().references(() => categories.id),
  subCategoryId: text("sub_category_id").notNull().references(() => subCategories.id),
  questionText: text("question_text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  optionE: text("option_e"),
  correctOption: text("correct_option").notNull(),
  explanation: text("explanation").notNull(),
  videoUrl: text("video_url"),
  accessLevel: text("access_level").notNull().default("free"),
  status: text("status").notNull().default("draft"),
  ...timestamps,
}, (table) => [
  check("questions_correct_option_check", sql`${table.correctOption} in ('A', 'B', 'C', 'D', 'E')`),
  check("questions_option_e_check", sql`${table.correctOption} <> 'E' or nullif(trim(${table.optionE}), '') is not null`),
  check("questions_access_level_check", sql`${table.accessLevel} in ('free', 'premium')`),
  check("questions_status_check", sql`${table.status} in ('draft', 'published', 'unpublished')`),
]);

export const tryoutQuestions = pgTable("tryout_questions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  tryoutId: text("tryout_id").notNull().references(() => tryouts.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull(),
}, (table) => [
  unique("tryout_questions_tryout_question_unique").on(table.tryoutId, table.questionId),
  unique("tryout_questions_tryout_order_unique").on(table.tryoutId, table.sortOrder),
]);

export const attempts = pgTable("attempts", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  studentUserId: text("student_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  tryoutId: text("tryout_id").notNull().references(() => tryouts.id),
  attemptNumber: integer("attempt_number").notNull(),
  status: text("status").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  deadlineAt: timestamp("deadline_at", { withTimezone: true }).notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  lastServerSavedAt: timestamp("last_server_saved_at", { withTimezone: true }),
  lastQuestionIndex: integer("last_question_index").notNull().default(0),
  score: integer("score"),
  correctCount: integer("correct_count"),
  wrongCount: integer("wrong_count"),
  totalQuestions: integer("total_questions").notNull(),
  xpEarned: integer("xp_earned").notNull().default(0),
  submittedByAdminUserId: text("submitted_by_admin_user_id").references(() => user.id, { onDelete: "set null" }),
  isImpersonatedSubmission: boolean("is_impersonated_submission").notNull().default(false),
  activeSessionId: text("active_session_id"),
  autoSubmitReason: text("auto_submit_reason"),
  ...timestamps,
}, (table) => [
  unique("attempts_student_tryout_number_unique").on(table.studentUserId, table.tryoutId, table.attemptNumber),
  check("attempts_status_check", sql`${table.status} in ('in_progress', 'submitted', 'auto_submitted')`),
]);

export const attemptQuestionSnapshots = pgTable("attempt_question_snapshots", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: text("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull().references(() => questions.id),
  sortOrder: integer("sort_order").notNull(),
  categoryId: text("category_id").notNull().references(() => categories.id),
  subCategoryId: text("sub_category_id").notNull().references(() => subCategories.id),
  questionText: text("question_text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  optionE: text("option_e"),
  correctOption: text("correct_option").notNull(),
  explanation: text("explanation").notNull(),
  videoUrl: text("video_url"),
  accessLevel: text("access_level").notNull(),
}, (table) => [
  unique("attempt_snapshots_attempt_question_unique").on(table.attemptId, table.questionId),
  unique("attempt_snapshots_attempt_order_unique").on(table.attemptId, table.sortOrder),
]);

export const attemptAnswers = pgTable("attempt_answers", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: text("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
  snapshotId: text("snapshot_id").notNull().references(() => attemptQuestionSnapshots.id, { onDelete: "cascade" }),
  selectedOption: text("selected_option"),
  isCorrect: boolean("is_correct"),
  answeredAt: timestamp("answered_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  unique("attempt_answers_attempt_snapshot_unique").on(table.attemptId, table.snapshotId),
  check("attempt_answers_selected_option_check", sql`${table.selectedOption} is null or ${table.selectedOption} in ('A', 'B', 'C', 'D', 'E')`),
]);

export const attemptMarkedQuestions = pgTable("attempt_marked_questions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: text("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
  snapshotId: text("snapshot_id").notNull().references(() => attemptQuestionSnapshots.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("attempt_marked_attempt_snapshot_unique").on(table.attemptId, table.snapshotId),
]);

export const questionReports = pgTable("question_reports", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  studentUserId: text("student_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull().references(() => questions.id),
  attemptId: text("attempt_id").notNull().references(() => attempts.id),
  snapshotId: text("snapshot_id").notNull().references(() => attemptQuestionSnapshots.id),
  reason: text("reason").notNull(),
  note: text("note"),
  status: text("status").notNull().default("open"),
  resolvedByUserId: text("resolved_by_user_id"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("question_reports_reason_check", sql`${table.reason} in ('answer_key_wrong', 'explanation_wrong', 'question_unclear', 'typo', 'other')`),
  check("question_reports_status_check", sql`${table.status} in ('open', 'reviewed', 'dismissed', 'resolved')`),
]);

export const materi = pgTable("materi", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  categoryId: text("category_id").notNull().references(() => categories.id),
  subCategoryId: text("sub_category_id").notNull().references(() => subCategories.id),
  bodyMarkdown: text("body_markdown").notNull(),
  youtubeUrl: text("youtube_url"),
  pdfFileKey: text("pdf_file_key"),
  accessLevel: text("access_level").notNull().default("free"),
  status: text("status").notNull().default("draft"),
  ...timestamps,
}, (table) => [
  check("materi_access_level_check", sql`${table.accessLevel} in ('free', 'premium')`),
  check("materi_status_check", sql`${table.status} in ('draft', 'published', 'unpublished')`),
]);

export const studentBadges = pgTable("student_badges", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  studentUserId: text("student_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  badgeCode: text("badge_code").notNull(),
  awardSource: text("award_source").notNull(),
  sourceWeekKey: text("source_week_key"),
  rewardXp: integer("reward_xp").notNull().default(0),
  seenAt: timestamp("seen_at", { withTimezone: true }),
  metadata: jsonb("metadata").notNull().default({}),
  awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("student_badges_student_badge_unique").on(table.studentUserId, table.badgeCode),
  index("student_badges_student_seen_idx").on(table.studentUserId, table.seenAt),
  check("student_badges_award_source_check", sql`${table.awardSource} in ('weekly_leaderboard', 'daily_evaluation', 'manual')`),
]);

export const studentExpLedger = pgTable("student_exp_ledger", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  studentUserId: text("student_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id").notNull(),
  xpAmount: integer("xp_amount").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  metadata: jsonb("metadata").notNull().default({}),
}, (table) => [
  unique("student_exp_ledger_source_unique").on(table.sourceType, table.sourceId),
  index("student_exp_ledger_student_idx").on(table.studentUserId),
  check("student_exp_ledger_source_type_check", sql`${table.sourceType} in ('badge_reward')`),
  check("student_exp_ledger_xp_amount_check", sql`${table.xpAmount} >= 0`),
]);

export const weeklyLeaderboardSnapshots = pgTable("weekly_leaderboard_snapshots", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  weekStartDate: text("week_start_date").notNull().unique(),
  finalizedAt: timestamp("finalized_at", { withTimezone: true }).notNull().defaultNow(),
  participantThreshold: integer("participant_threshold").notNull(),
  rankedStudentCount: integer("ranked_student_count").notNull(),
  thresholdMet: boolean("threshold_met").notNull(),
  status: text("status").notNull().default("finalized"),
  metadata: jsonb("metadata").notNull().default({}),
  ...timestamps,
}, (table) => [
  check("weekly_leaderboard_snapshots_status_check", sql`${table.status} in ('finalized')`),
  check("weekly_leaderboard_snapshots_threshold_check", sql`${table.participantThreshold} >= 1`),
  check("weekly_leaderboard_snapshots_ranked_count_check", sql`${table.rankedStudentCount} >= 0`),
]);

export const weeklyLeaderboardEntries = pgTable("weekly_leaderboard_entries", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  snapshotId: text("snapshot_id").notNull().references(() => weeklyLeaderboardSnapshots.id, { onDelete: "cascade" }),
  weekStartDate: text("week_start_date").notNull(),
  studentUserId: text("student_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  rank: integer("rank").notNull(),
  xp: integer("xp").notNull(),
  lastXpAttemptSubmittedAt: timestamp("last_xp_attempt_submitted_at", { withTimezone: true }).notNull(),
  badgesAwarded: jsonb("badges_awarded").notNull().default([]),
  ...timestamps,
}, (table) => [
  unique("weekly_leaderboard_entries_snapshot_student_unique").on(table.snapshotId, table.studentUserId),
  unique("weekly_leaderboard_entries_snapshot_rank_unique").on(table.snapshotId, table.rank),
  index("weekly_leaderboard_entries_week_idx").on(table.weekStartDate),
  check("weekly_leaderboard_entries_rank_check", sql`${table.rank} >= 1`),
  check("weekly_leaderboard_entries_xp_check", sql`${table.xp} >= 1`),
]);

export const materiViews = pgTable("materi_views", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  studentUserId: text("student_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  materiId: text("materi_id").notNull().references(() => materi.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activityEvents = pgTable("activity_events", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  studentUserId: text("student_user_id").references(() => user.id, { onDelete: "set null" }),
  eventType: text("event_type").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("activity_events_type_check", sql`${table.eventType} in ('login', 'profile_completed', 'tryout_started', 'tryout_submitted', 'question_reported', 'materi_viewed', 'admin_impersonation_started', 'admin_impersonation_stopped')`),
]);

export const categoryRelations = relations(categories, ({ many }) => ({
  subCategories: many(subCategories),
  tryouts: many(tryouts),
  questions: many(questions),
  materi: many(materi),
}));

export const subCategoryRelations = relations(subCategories, ({ one, many }) => ({
  category: one(categories, {
    fields: [subCategories.categoryId],
    references: [categories.id],
  }),
  questions: many(questions),
  materi: many(materi),
}));
