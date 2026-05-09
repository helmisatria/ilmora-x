# IlmoraX Milestone 1 Backend Integration Plan

**Date:** 2026-05-06  
**Phase:** Milestone 1 - Core Platform, Try-out, Admin Foundation, and Basic Analytics  
**Status:** Ready for execution after Phase 0 design approval  
**Goal:** Replace the accepted clickable prototype's mock data with a real backend foundation that supports Google auth, mandatory profile completion, core Try-out behavior, content management, user management, student evaluation, and basic admin insights.

This document is self-contained. An AI agent should be able to execute Milestone 1 from this plan without rereading the proposal.

---

## 1. Scope Decision

Build **Milestone 1** now.

Milestone 1 includes:

- Google login with **better-auth**
- mandatory Student profile completion
- Admin access foundation
- Try-out taking, retake, result review, report question, and autosave
- real attempt history for My Progress
- basic Student evaluation dashboard
- Admin CMS foundation for Try-outs, Questions, Materi, Users, reports, and basic insights
- upload Questions via Excel
- basic analytics tooling only if needed

Milestone 1 does **not** include:

- payment gateway
- checkout
- package purchase
- Coupon creation/redemption
- referral discount
- email notifications
- weekly leaderboard reset
- Badge awarding
- Live Poll backend
- Store, Affiliate, or Drilling/Games beyond existing Coming Soon pages

Admin is part of Milestone 1. Payment/coupon/package work waits until Milestone 2. Badge/leaderboard/live poll backend waits until Milestone 3.

---

## 2. Existing App Snapshot

The current app is a TanStack Start React prototype.

Important current files:

- `package.json` uses `@tanstack/react-start`, `@tanstack/react-router`, React 19, Vite, Tailwind CSS, Zod.
- `src/data/*` contains mock data and the prototype state provider.
- `src/data/provider.tsx` owns fake runtime state for current user, attempts, entitlements, premium toggles, and access checks.
- `src/routes/auth/login.tsx` fakes Google login with `setTimeout` and redirects to `/dashboard`.
- `src/routes/auth/complete-profile.tsx` saves nothing and redirects to `/dashboard`.
- `src/routes/tryout.$id.tsx` runs Try-out entirely in browser state.
- `src/routes/evaluation.tsx` uses hardcoded evaluation data.
- There are no real `/admin/*` routes yet.

Backend integration must keep the accepted visual/UI direction intact while replacing mock state with server-backed data.

---

## 3. Canonical Product Language

Use these exact domain terms in code and admin copy where possible:

- **Student:** every signed-in learner. Google OAuth only.
- **Admin:** a signed-in Student whose email is present in the admin whitelist table.
- **Super-admin:** an Admin who can add/remove Admins.
- **Try-out:** timed assessment. Use this as the user-facing term.
- **Attempt:** one start-to-submit or auto-submit run of a Try-out. Retake creates a new Attempt.
- **Question:** one answerable item inside a Try-out.
- **Category:** top-level classification.
- **Sub-category:** second and final classification level. No deeper nesting.
- **Materi:** standalone study material.
- **Question report:** Student complaint about a Question.

Avoid introducing parallel names like quiz, exercise, topic, lesson, module, voucher, promo, or generic user-facing "CBT" unless the surface is clearly internal/admin.

---

## 4. Architecture Choices

Use:

- **TanStack Start server routes and server functions** for backend endpoints.
- **better-auth** for OAuth/session management.
- **Google OAuth only** for sign-in.
- **PostgreSQL** as the production database.
- **Drizzle ORM** for schema, queries, and migrations.
- **Zod** for every server input boundary.
- **Local file/object abstraction** for uploaded PDFs and Excel files in M1; prepare the interface for object storage but do not implement production storage until deployment details are known.

Do not add a separate Express/Hono API server in M1. Keep backend code inside TanStack Start unless a deployment blocker appears.

Official docs verified on 2026-05-06:

- Better Auth TanStack Start integration: https://better-auth.com/docs/integrations/tanstack
- Better Auth Google provider: https://better-auth.com/docs/authentication/google
- Better Auth Drizzle adapter: https://better-auth.com/docs/adapters/drizzle
- Better Auth CLI: https://better-auth.com/docs/concepts/cli
- Better Auth Admin plugin: https://better-auth.com/docs/plugins/admin
- TanStack Start server routes: https://tanstack.com/start/v0/docs/framework/react/guide/server-routes
- TanStack Start middleware: https://tanstack.com/start/latest/docs/framework/react/guide/middleware

Key Better Auth requirements from current docs:

- Mount the auth handler at `src/routes/api/auth/$.ts`.
- Configure `tanstackStartCookies()` as the last Better Auth plugin.
- Configure Google using `socialProviders.google.clientId` and `clientSecret`.
- Set `BETTER_AUTH_URL` so Google callback URLs are correct.
- Google local redirect URI should be `http://localhost:3000/api/auth/callback/google`.
- Use Better Auth CLI/schema generation for auth-owned tables, then apply migrations with Drizzle.

---

## 5. Auth and Admin Decision

Use better-auth for authentication and sessions.

Admin access must be enforced by the IlmoraX database whitelist, not by trusting a role captured at login.

Implementation rules:

- All humans sign in with Google through better-auth.
- No email/password login in M1.
- No separate admin login page.
- Every signed-in account is a Student by default.
- Admin status is determined by the `admin_members` table.
- `ADMIN_EMAILS` is used only for first deployment bootstrap.
- After bootstrap, admin changes are made through CMS by Super-admins.
- Admin access is rechecked on every `/admin/*` request.
- Admins skip mandatory profile completion and land on `/admin`.
- Students with incomplete profile land on `/auth/complete-profile`.
- Suspended Students cannot access protected app routes.

Better Auth Admin plugin may be installed if useful for session/user management fields, but it must not replace the project whitelist rule. If used, keep IlmoraX authorization in `admin_members` as the source of truth.

---

## 6. Environment Variables

Add `.env.example` with:

```bash
DATABASE_URL="postgres://postgres:postgres@localhost:5432/ilmorax"
BETTER_AUTH_SECRET="replace-with-generated-secret"
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
ADMIN_EMAILS="owner@example.com"
APP_URL="http://localhost:3000"
UPLOAD_DIR="./storage/uploads"
```

Rules:

- `ADMIN_EMAILS` is comma-separated.
- In production, `BETTER_AUTH_URL` and `APP_URL` must use the production origin.
- Do not commit real secrets.
- Add a script or documented command to generate `BETTER_AUTH_SECRET`.

---

## 7. Proposed File Structure

Create or evolve these backend files:

```txt
src/lib/auth.ts
src/lib/auth-client.ts
src/lib/auth-functions.ts
src/lib/db/client.ts
src/lib/db/schema.ts
src/lib/db/migrate.ts
src/lib/db/seed.ts
src/lib/domain/access.ts
src/lib/domain/admin.ts
src/lib/domain/attempts.ts
src/lib/domain/evaluation.ts
src/lib/domain/tryouts.ts
src/lib/domain/users.ts
src/lib/http/errors.ts
src/lib/http/validation.ts
src/routes/api/auth/$.ts
src/routes/_protected.tsx
src/routes/admin.tsx
src/routes/admin/index.tsx
src/routes/admin/users.tsx
src/routes/admin/users.$studentId.tsx
src/routes/admin/tryouts.tsx
src/routes/admin/questions.tsx
src/routes/admin/materi.tsx
src/routes/admin/reports.tsx
src/routes/admin/insights.tsx
```

Create route-specific server functions near their consumers only when the logic is small. Shared domain behavior belongs in `src/lib/domain/*`.

Keep code easy to skim:

- early returns
- small functions
- descriptive names
- no clever generic abstractions
- server authorization at the top of each mutation
- one domain concept per file when possible

---

## 8. Database Schema

Use Drizzle with PostgreSQL.

Let Better Auth own its required auth tables. Generate those tables from Better Auth config and include them in Drizzle migrations.

Add IlmoraX-owned tables below. Names can be adjusted to match Drizzle style, but preserve the data model.

### 8.1 Identity Tables

#### `student_profiles`

One row per Better Auth user.

Fields:

- `id` uuid/text primary key
- `user_id` text unique not null, references Better Auth user id
- `display_name` text not null
- `institution` text
- `phone` text
- `photo_url` text
- `profile_completed_at` timestamp nullable
- `status` text not null default `active`
- `created_at` timestamp not null
- `updated_at` timestamp not null

Allowed `status`:

- `active`
- `suspended`

Profile is complete when:

- `display_name` is non-empty
- `institution` is non-empty
- `profile_completed_at` is not null

Admins can have incomplete `student_profiles` because they skip profile completion.

#### `admin_members`

Fields:

- `id` uuid/text primary key
- `email` text unique not null
- `role` text not null
- `created_by_user_id` text nullable
- `created_at` timestamp not null
- `removed_at` timestamp nullable

Allowed `role`:

- `admin`
- `super_admin`

Active admin row = `removed_at is null`.

Bootstrap rule:

- On first boot/seed, if there are no active `admin_members`, insert all emails from `ADMIN_EMAILS`.
- First email becomes `super_admin`.
- Remaining emails become `admin`.
- Never delete admin history; set `removed_at`.

### 8.2 Taxonomy Tables

#### `categories`

Fields:

- `id` uuid/text primary key
- `slug` text unique not null
- `name` text not null
- `color` text nullable
- `sort_order` integer not null default 0
- `created_at` timestamp not null
- `updated_at` timestamp not null

#### `sub_categories`

Fields:

- `id` uuid/text primary key
- `category_id` references `categories.id`
- `slug` text not null
- `name` text not null
- `sort_order` integer not null default 0
- `created_at` timestamp not null
- `updated_at` timestamp not null

Constraints:

- unique `(category_id, slug)`
- no third taxonomy level

### 8.3 Try-out and Question Tables

#### `tryouts`

Fields:

- `id` uuid/text primary key
- `title` text not null
- `description` text not null
- `category_id` references `categories.id`
- `duration_minutes` integer not null
- `access_level` text not null
- `status` text not null default `draft`
- `published_at` timestamp nullable
- `created_at` timestamp not null
- `updated_at` timestamp not null

Allowed `access_level`:

- `free`
- `premium`
- `platinum`

Allowed `status`:

- `draft`
- `published`
- `unpublished`

M1 behavior:

- enforce `free` as accessible to all signed-in Students.
- allow `premium`/`platinum` records to exist for content setup.
- payment-based unlock is M2.

#### `questions`

Fields:

- `id` uuid/text primary key
- `category_id` references `categories.id`
- `sub_category_id` references `sub_categories.id`
- `question_text` text not null
- `option_a` text not null
- `option_b` text not null
- `option_c` text not null
- `option_d` text not null
- `option_e` text nullable
- `correct_option` text not null
- `explanation` text not null
- `video_url` text nullable
- `access_level` text not null default `free`
- `status` text not null default `draft`
- `created_at` timestamp not null
- `updated_at` timestamp not null

Allowed `correct_option`:

- `A`
- `B`
- `C`
- `D`
- `E`

Allowed `access_level`:

- `free`
- `premium`

Allowed `status`:

- `draft`
- `published`
- `unpublished`

Validation:

- if `correct_option = E`, `option_e` must be non-empty.
- `sub_category_id` must belong to the selected `category_id`.

#### `tryout_questions`

Fields:

- `id` uuid/text primary key
- `tryout_id` references `tryouts.id`
- `question_id` references `questions.id`
- `sort_order` integer not null

Constraints:

- unique `(tryout_id, question_id)`
- unique `(tryout_id, sort_order)`

### 8.4 Attempt Tables

#### `attempts`

Fields:

- `id` uuid/text primary key
- `student_user_id` text not null, references Better Auth user id
- `tryout_id` references `tryouts.id`
- `attempt_number` integer not null
- `status` text not null
- `started_at` timestamp not null
- `deadline_at` timestamp not null
- `submitted_at` timestamp nullable
- `last_server_saved_at` timestamp nullable
- `last_question_index` integer not null default 0
- `score` integer nullable
- `correct_count` integer nullable
- `wrong_count` integer nullable
- `total_questions` integer not null
- `xp_earned` integer not null default 0
- `active_session_id` text nullable
- `auto_submit_reason` text nullable
- `created_at` timestamp not null
- `updated_at` timestamp not null

Allowed `status`:

- `in_progress`
- `submitted`
- `auto_submitted`

Constraints:

- unique `(student_user_id, tryout_id, attempt_number)`
- one active in-progress Attempt per Student per Try-out

#### `attempt_question_snapshots`

Frozen copy of Question content for scoring and review.

Fields:

- `id` uuid/text primary key
- `attempt_id` references `attempts.id`
- `question_id` references `questions.id`
- `sort_order` integer not null
- `category_id` references `categories.id`
- `sub_category_id` references `sub_categories.id`
- `question_text` text not null
- `option_a` text not null
- `option_b` text not null
- `option_c` text not null
- `option_d` text not null
- `option_e` text nullable
- `correct_option` text not null
- `explanation` text not null
- `video_url` text nullable
- `access_level` text not null

Constraints:

- unique `(attempt_id, question_id)`
- unique `(attempt_id, sort_order)`

#### `attempt_answers`

Fields:

- `id` uuid/text primary key
- `attempt_id` references `attempts.id`
- `snapshot_id` references `attempt_question_snapshots.id`
- `selected_option` text nullable
- `is_correct` boolean nullable
- `answered_at` timestamp nullable
- `created_at` timestamp not null
- `updated_at` timestamp not null

Constraints:

- unique `(attempt_id, snapshot_id)`

#### `attempt_marked_questions`

Fields:

- `id` uuid/text primary key
- `attempt_id` references `attempts.id`
- `snapshot_id` references `attempt_question_snapshots.id`
- `created_at` timestamp not null

Constraints:

- unique `(attempt_id, snapshot_id)`

### 8.5 Moderation Tables

#### `question_reports`

Fields:

- `id` uuid/text primary key
- `student_user_id` text not null
- `question_id` references `questions.id`
- `attempt_id` references `attempts.id`
- `snapshot_id` references `attempt_question_snapshots.id`
- `reason` text not null
- `note` text nullable
- `status` text not null default `open`
- `resolved_by_user_id` text nullable
- `resolved_at` timestamp nullable
- `created_at` timestamp not null

Allowed `reason`:

- `answer_key_wrong`
- `explanation_wrong`
- `question_unclear`
- `typo`
- `other`

Allowed `status`:

- `open`
- `dismissed`
- `resolved`

### 8.6 Materi Tables

#### `materi`

Fields:

- `id` uuid/text primary key
- `title` text not null
- `category_id` references `categories.id`
- `sub_category_id` references `sub_categories.id`
- `body_markdown` text not null
- `youtube_url` text nullable
- `pdf_file_key` text nullable
- `access_level` text not null default `free`
- `status` text not null default `draft`
- `created_at` timestamp not null
- `updated_at` timestamp not null

Allowed `access_level`:

- `free`
- `premium`

Allowed `status`:

- `draft`
- `published`
- `unpublished`

#### `materi_views`

Fields:

- `id` uuid/text primary key
- `student_user_id` text not null
- `materi_id` references `materi.id`
- `viewed_at` timestamp not null

### 8.7 Basic Analytics Tables

Prefer deriving insights from source tables. Add an event table only for actions that are not otherwise captured.

#### `activity_events`

Fields:

- `id` uuid/text primary key
- `student_user_id` text nullable
- `event_type` text not null
- `metadata` jsonb not null default `{}`
- `created_at` timestamp not null

Allowed initial `event_type`:

- `login`
- `profile_completed`
- `tryout_started`
- `tryout_submitted`
- `question_reported`
- `materi_viewed`

---

## 9. Route Protection Flow

Implement a protected layout route:

```txt
src/routes/_protected.tsx
```

Protected route logic:

1. Get session from Better Auth using request headers.
2. If no session, redirect to `/auth/login?redirect=<current path>`.
3. If Student is suspended, redirect to `/auth/login?error=suspended` or render an access blocked page.
4. If active Admin and path starts with `/admin`, allow.
5. If active Admin and path does not start with `/admin`, allow but default post-login redirect should be `/admin`.
6. If non-admin Student profile is incomplete and current path is not `/auth/complete-profile`, redirect to `/auth/complete-profile`.
7. Otherwise allow and expose `session`, `studentProfile`, and `adminMembership` in route context.

Admin route logic:

1. Use `requireAdmin()` at the top of every admin loader/mutation.
2. `requireAdmin()` must read `admin_members` by current session email every time.
3. Use `requireSuperAdmin()` only for admin whitelist changes.

---

## 10. Backend Service Contracts

Keep server functions simple. Return DTOs that match what UI needs rather than leaking raw DB rows.

### 10.1 Auth

Functions:

- `getSession()`
- `ensureSession()`
- `getCurrentViewer()`
- `completeProfile(input)`
- `getPostLoginRedirect()`

`getCurrentViewer()` returns:

```ts
type Viewer = {
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
```

### 10.2 Try-outs

Functions:

- `listTryoutsForStudent()`
- `getTryoutIntro(tryoutId)`
- `startAttempt(tryoutId)`
- `getAttemptForTaking(attemptId)`
- `saveAttemptProgress(input)`
- `submitAttempt(attemptId)`
- `getAttemptResult(attemptId)`
- `getAttemptReview(attemptId)`

Rules:

- Only signed-in Students can start Attempts.
- Only the owner Student or an Admin can read an Attempt.
- On Attempt start, snapshot all published Questions assigned to the Try-out.
- Past Attempts never rescore when Question content changes.
- Retake creates a new Attempt with next `attempt_number`.
- If an in-progress Attempt exists for the Student and Try-out, return that Attempt instead of creating a duplicate.
- Deadline is wall-clock server time.
- If submit is called after `deadline_at`, mark as `auto_submitted`.
- Score uses snapshots, not live Questions.

Autosave payload:

```ts
type SaveAttemptProgressInput = {
  attemptId: string;
  activeSessionId: string;
  answers: Array<{
    snapshotId: string;
    selectedOption: "A" | "B" | "C" | "D" | "E" | null;
  }>;
  markedSnapshotIds: string[];
  lastQuestionIndex: number;
};
```

Autosave rules:

- Save on answer change with debounce around 500ms.
- Save on `blur`, `visibilitychange`, and `beforeunload`.
- Use localStorage only as a temporary offline queue.
- UI displays last server-confirmed save time.
- One active browser session per Attempt. If `activeSessionId` changes, older clients must be rejected and show a modal.

### 10.3 Student Evaluation

Functions:

- `getStudentEvaluation(studentUserId?)`

Rules:

- Student can request only their own evaluation.
- Admin can request any Student evaluation.
- M1 may show the full basic evaluation to signed-in Students while the backend is being proven. Final premium gating belongs to M2 unless entitlement foundation is completed early.
- Use submitted and auto-submitted Attempts only.
- Compute from `attempt_question_snapshots` joined to `attempt_answers`.
- Breakdown must include Category and Sub-category.

Return:

```ts
type StudentEvaluation = {
  totalAnswered: number;
  correct: number;
  wrong: number;
  percentCorrect: number;
  percentWrong: number;
  categories: Array<{
    categoryId: string;
    categoryName: string;
    totalAnswered: number;
    correct: number;
    wrong: number;
    percentCorrect: number;
    subCategories: Array<{
      subCategoryId: string;
      subCategoryName: string;
      totalAnswered: number;
      correct: number;
      wrong: number;
      percentCorrect: number;
    }>;
  }>;
  attempts: Array<{
    attemptId: string;
    tryoutTitle: string;
    attemptNumber: number;
    score: number;
    correct: number;
    total: number;
    submittedAt: string;
  }>;
};
```

### 10.4 Admin CMS

Admin functions:

- `listStudents(filters)`
- `getStudentAdminDetail(studentUserId)`
- `setStudentStatus(studentUserId, status)`
- `listAdmins()`
- `addAdmin(email, role)`
- `removeAdmin(email)`
- `listCategories()`
- `createCategory(input)`
- `updateCategory(input)`
- `createSubCategory(input)`
- `updateSubCategory(input)`
- `listTryoutsAdmin(filters)`
- `createTryout(input)`
- `updateTryout(input)`
- `publishTryout(tryoutId)`
- `unpublishTryout(tryoutId)`
- `listQuestionsAdmin(filters)`
- `createQuestion(input)`
- `updateQuestion(input)`
- `publishQuestion(questionId)`
- `unpublishQuestion(questionId)`
- `assignQuestionToTryout(input)`
- `removeQuestionFromTryout(input)`
- `importQuestionsFromExcel(file)`
- `listMateriAdmin(filters)`
- `createMateri(input)`
- `updateMateri(input)`
- `publishMateri(materiId)`
- `unpublishMateri(materiId)`
- `listQuestionReports(filters)`
- `resolveQuestionReport(reportId)`
- `dismissQuestionReport(reportId)`
- `getUsersInsights(filters)`

Admin foundation UI should be functional and simple. Do not overdesign the CMS in M1.

---

## 11. Try-out Workbook Import/Export

Implement upload for `.xlsx` only.

The primary Excel workflow lives on the Try-out edit surface, not on the standalone Question bank. Admin can download a Try-out workbook, edit it, and upload it back to update the Try-out and its ordered Questions.

Expected `tryout` sheet columns:

```txt
title
description
category_id
duration_minutes
access_level
status
```

Expected `questions` sheet columns:

```txt
question_id
sort_order
category_id
sub_category_id
question_text
option_a
option_b
option_c
option_d
option_e
correct_option
explanation
video_url
access_level
status
```

Rules:

- `question_id` updates an existing Question.
- empty `question_id` creates a new Question.
- duplicate `question_id` or duplicate `sort_order` rejects the workbook.
- a missing previously assigned Question is unassigned from the Try-out, not deleted from the Question bank.
- if a workbook edits a Question assigned to another Try-out, create a copy for this Try-out instead of mutating the shared Question.
- `option_e` may be empty unless `correct_option` is `E`.
- `access_level` defaults to `free`.
- `status` defaults to `draft`.
- Unknown category/sub-category should fail the row with a clear error.
- Import should validate all rows before writing.
- If any row fails, write nothing and return row-level errors.
- If all rows pass, update Try-out metadata, create/update Questions, and update Try-out assignments in one transaction.
- A published Try-out must have at least one assigned published Question.
- Standalone Materi is outside the Try-out workbook in M1. Per-Question Review fields are `explanation` and `video_url`.

Provide a downloadable sample template from the Try-out admin page. Keep `docs/ilmorax-tryout-sample.xlsx` as the canonical sample workbook checked into the repo for reference.

---

## 12. Users Insights

Build a basic admin insights page from real data.

Required metrics:

- total registered Students
- new Students in selected period
- premium Students placeholder/count if entitlement foundation exists, otherwise show `0` and label as not wired until M2
- free Students
- active Students in selected period
- Try-out Attempts in selected period
- Questions answered in selected period
- average score from submitted Attempts
- Category performance summary
- Recent activity

Filters:

- period: `7d`, `30d`, `90d`, `all`
- Student status: active/suspended/all
- premium/free segment only if entitlement foundation exists

Avoid advanced cohort, funnel, retention, BI, and export features in M1.

---

## 13. Implementation Order

Follow this exact order.

### Step 1 - Backend dependencies and env

Install:

```bash
pnpm add better-auth @better-auth/drizzle-adapter drizzle postgres
pnpm add -D drizzle-kit dotenv
```

For Excel import, install one library when implementing that task:

```bash
pnpm add xlsx
```

Add scripts:

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:seed": "tsx src/lib/db/seed.ts",
  "auth:generate": "auth generate --config src/lib/auth.ts"
}
```

If `tsx` is needed for seed scripts:

```bash
pnpm add -D tsx
```

### Step 2 - Database setup

Create:

- `drizzle.config.ts`
- `src/lib/db/client.ts`
- `src/lib/db/schema.ts`
- first migration
- seed script for categories, sub-categories, Try-outs, Questions, and initial admin emails

Acceptance:

- `pnpm db:generate` creates migrations.
- `pnpm db:migrate` applies migrations.
- `pnpm db:seed` creates usable local demo data.

### Step 3 - better-auth setup

Create:

- `src/lib/auth.ts`
- `src/lib/auth-client.ts`
- `src/lib/auth-functions.ts`
- `src/routes/api/auth/$.ts`

Required config:

- Drizzle adapter
- Google social provider
- `tanstackStartCookies()` last in plugin list
- `baseURL: process.env.BETTER_AUTH_URL`

Update `src/routes/auth/login.tsx`:

- remove fake timeout login
- call `authClient.signIn.social({ provider: "google", callbackURL })`
- preserve existing visual design
- show loading and error states

Acceptance:

- Local Google OAuth reaches `/api/auth/callback/google`.
- Session persists after refresh.
- Logout clears session.

### Step 4 - route protection and profile completion

Create protected layout and viewer helpers.

Update `src/routes/auth/complete-profile.tsx`:

- load current viewer
- submit to server
- validate name and institution
- save phone/photo if provided
- redirect to `/dashboard`

Acceptance:

- Unauthenticated users cannot access app routes.
- New Student is forced to complete profile.
- Completed Student can access dashboard after refresh.
- Admin email skips profile completion and lands on `/admin`.

### Step 5 - admin foundation

Create minimal admin layout and pages:

- `/admin`
- `/admin/users`
- `/admin/users/$studentId`
- `/admin/tryouts`
- `/admin/questions`
- `/admin/materi`
- `/admin/reports`
- `/admin/insights`

Acceptance:

- Non-admin Student cannot open any `/admin/*` route.
- Active Admin can open `/admin/*`.
- Removing Admin row revokes access on next request.
- Super-admin can add/remove admins.
- Admin can suspend/unsuspend Students.

### Step 6 - replace mock auth/user state

Refactor `src/data/provider.tsx`.

Preferred outcome:

- remove auth-sensitive state from client provider
- keep only UI convenience state if needed
- server route loaders/functions provide current viewer, Try-outs, Attempts, and evaluation data

Do not keep premium toggle as real behavior. If a design toggle is still needed for screenshots, isolate it behind a local dev-only flag.

Acceptance:

- Dashboard and Navigation show the signed-in Google account/profile.
- Refresh does not reset identity.
- No protected page depends on `currentUser` from mock files.

### Step 7 - Try-out backend

Update Try-out list and taking route.

Required behavior:

- list published Try-outs from DB
- start/resume Attempt from server
- create Question snapshots on start
- autosave answers, marked Questions, and last index to server
- support localStorage offline queue
- submit and score on server
- retake creates new Attempt
- result and review pages read from server
- report question writes `question_reports`

Acceptance:

- Refresh during active Attempt resumes saved server state.
- Disconnect/localStorage queue syncs on reconnect.
- Submit computes score server-side.
- Retake creates Attempt 2.
- Question edit after submission does not change old result review.
- Report question appears in admin moderation.

### Step 8 - My Progress and Evaluation

Update:

- `/progress`
- `/evaluation`
- `/results/$attemptId`
- `/results/$attemptId/review`

Acceptance:

- Score history comes from submitted Attempts.
- Attempt history comes from DB.
- Evaluation summary is computed from real answers.
- Category and Sub-category breakdowns match completed Attempts.
- Admin can view the same evaluation for an individual Student.

### Step 9 - Admin CMS content operations

Implement basic CRUD:

- Categories/Sub-categories
- Try-outs
- Questions
- Try-out Question assignment/reordering
- Materi
- Question reports

Acceptance:

- Admin can create a Try-out, add Questions, publish it, and Student can take it.
- Admin can unpublish a Question without breaking past Attempt reviews.
- Admin can create/edit Materi with Markdown, YouTube URL, PDF key placeholder, and access level.

### Step 10 - Excel import

Implement import with full validation before write.

Acceptance:

- Valid workbook imports Questions and assignments.
- Invalid workbook returns row-level errors and writes nothing.
- Imported Questions are visible in admin list.

### Step 11 - Users Insights

Implement real metrics from DB.

Acceptance:

- Metrics respond to period filters.
- Average score and Category performance match Attempt data.
- Recent activity lists real events.
- No export/cohort/funnel features are present.

### Step 12 - cleanup and verification

Run:

```bash
pnpm build
```

Add focused tests if the project has a test runner by then. If not, add a manual QA checklist to the PR/handoff.

Manual QA:

- Google login
- profile completion
- admin skip profile
- admin revocation
- Student Try-out start/save/submit
- retake
- result review
- question report
- admin moderation
- admin CRUD
- Excel import success/failure
- evaluation
- Users Insights

---

## 14. Access Rules

### Student Routes

Signed-in active Students can access:

- `/dashboard`
- `/tryout`
- `/tryout/$id`
- `/results/$attemptId`
- `/results/$attemptId/review`
- `/progress`
- `/evaluation`
- `/profile`
- `/profile/$userId`
- `/badges`
- `/leaderboard`
- `/premium`
- `/coming-soon`

M1 access behavior:

- Free Try-outs are available.
- Premium/platinum Try-outs can be listed as locked or hidden according to existing design.
- Do not implement checkout unlock until M2.

### Admin Routes

Only active Admin/Super-admin can access:

- `/admin`
- `/admin/*`

Only Super-admin can:

- add Admin
- remove Admin
- change Admin role

---

## 15. Data Migration From Mock Prototype

Seed DB using current mock content as demo content:

- `src/data/categories.ts` -> `categories`, `sub_categories`
- `src/data/questions.ts` -> `tryouts`, `questions`, `tryout_questions`
- `src/data/materi.ts` -> `materi`
- `src/data/institutions.ts` can remain static unless admin-editable institutions are requested later

Do not build a full migration layer from mock files. Use a seed script only.

After backend pages are wired, mock files can remain only for visual fallback stories or can be removed in a cleanup PR.

---

## 16. Validation Rules

Use Zod at server boundaries.

Examples:

- Profile name: required, trimmed, max 120 chars.
- Institution: required, trimmed, max 160 chars.
- Phone: optional, trimmed, max 40 chars.
- Try-out duration: integer, 1 to 300 minutes.
- Question text/options/explanation: required, trimmed.
- Correct option: enum `A|B|C|D|E`.
- YouTube URL: optional valid URL.
- PDF upload: M1 max 20 MB, PDF only.
- Admin email: valid email, lowercased before insert.

Always authorize after validating session and before writing.

---

## 17. Error Handling

Create small helpers:

- `badRequest(message, details?)`
- `unauthorized()`
- `forbidden()`
- `notFound(message)`
- `conflict(message)`

UI expectations:

- forms show field-level errors when possible.
- server errors do not expose stack traces.
- autosave failure shows a small status message and keeps local queue.
- expired Attempt submit should explain that the server auto-submitted the last saved answers.

---

## 18. Analytics Events

Write activity events for:

- first successful login per session if easy
- profile completion
- Try-out start
- Try-out submit
- question report
- Materi view

Do not block core user flow if analytics insert fails. Log and continue.

---

## 19. Security Checklist

Before Milestone 1 demo:

- Better Auth secret exists outside git.
- Google OAuth callback is configured for local/staging.
- Every protected loader/mutation checks session.
- Every admin loader/mutation checks active `admin_members`.
- Student-owned reads filter by `student_user_id`.
- Attempt result/review cannot be read by another Student.
- Question answer key is never sent to active Attempt UI.
- Correct answers/explanations are sent only after submit.
- Excel import validates before insert.
- Suspended Student cannot continue protected flows.

---

## 20. Acceptance Criteria For Milestone 1

Milestone 1 is done when:

1. Google login works with better-auth.
2. New Students must complete profile before using the app.
3. Admin whitelist works from DB and is rechecked on every admin request.
4. Super-admin can manage Admins.
5. Admin can manage Students and suspend/unsuspend them.
6. Admin can create/edit/publish/unpublish Categories, Sub-categories, Try-outs, Questions, and Materi.
7. Admin can import Questions from Excel with transaction-safe validation.
8. Student can start a Try-out from DB content.
9. Attempt autosave survives refresh and temporary offline state.
10. Retake creates a separate Attempt record.
11. Result and review pages use frozen Question snapshots.
12. Student can report a Question.
13. Admin can review Question reports.
14. My Progress shows real Attempt history.
15. Evaluation dashboard shows real Category/Sub-category performance.
16. Admin can view an individual Student evaluation.
17. Users Insights shows real basic metrics.
18. `pnpm build` passes.

---

## 21. Suggested Demo Script

Use this flow for the client demo:

1. Sign in with Google as a new Student.
2. Complete profile.
3. Open dashboard and Try-out list.
4. Start a free Try-out.
5. Answer some Questions, mark one, refresh the browser, and show restored progress.
6. Submit Attempt and open result.
7. Open review and report a Question.
8. Retake the same Try-out and show Attempt 2.
9. Open My Progress.
10. Open Evaluation dashboard and show Category/Sub-category breakdown.
11. Sign in as Admin.
12. Show Users list and one Student evaluation.
13. Suspend/unsuspend a Student.
14. Create or edit a Question.
15. Import Questions from Excel.
16. Show moderation queue with the reported Question.
17. Show Users Insights.

---

## 22. Explicit Deferrals

Leave these for later milestones:

- Coupon system: Milestone 2.
- Referral discount: Milestone 2.
- Payment gateway: Milestone 2.
- Entitlement purchase flow: Milestone 2.
- Email notifications: Milestone 2.
- Badge rules and EXP rewards: Milestone 3.
- Weekly leaderboard reset: Milestone 3.
- Live Poll backend: Milestone 3.
- Advanced analytics, cohort retention, and export: out of M1 scope.
