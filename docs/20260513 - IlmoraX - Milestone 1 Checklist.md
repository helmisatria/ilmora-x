# IlmoraX Milestone 1 Checklist

**Date:** 2026-05-13  
**Milestone:** M1 - Core Platform, Try-out, Admin Foundation, and Basic Analytics  
**Source plan:** `docs/20260506 - IlmoraX - Milestone 1 Backend Integration Plan.md`

This checklist tracks the practical work needed to finish M1. Keep every item tied to real backend behavior. Do not reintroduce mock runtime state.

**Scope update 2026-05-15**

- Standalone Admin Questions is not an M1 demo path. Questions are managed through the Try-out workbook.
- Standalone Admin Materi management is skipped for M1. Materi CMS/upload/publish/archive moves out of the M1 acceptance path.
- Question difficulty is deferred to M2.
- Category/Sub-category Admin management is in M1 as a simple two-level manager: create, rename, recolor, reorder, and show stable IDs. Merge/delete stays deferred until an analytics history policy exists.
- Try-out workbook import may auto-create Category/Sub-category from names when IDs are blank, reusing existing names case-insensitively.
- Student Try-out list attempt metadata is accepted as non-blocking for M1.

---

## 1. Baseline Health

- [x] Run the development app on port `8090`.
- [x] Set local app URLs to `http://localhost:8090`.
- [x] Update local Google callback documentation to use port `8090`.
- [x] Verify the development server responds on port `8090`.
- [x] Run TypeScript validation after the profile/auth integration work.
- [ ] Run a full clean install and typecheck from a fresh checkout.
- [ ] Run database migration from an empty local database.
- [ ] Run database migration against an existing local database.
- [ ] Confirm all M1 env vars are present in `.env.example`.
- [ ] Document any setup command that is still required before demo.

## 2. Auth And Profile

- [x] Use better-auth session data as the source for the current viewer.
- [x] Remove the hardcoded prototype user.
- [x] Remove hardcoded `David` references from runtime profile data.
- [x] Sync `student_profiles` with authenticated users.
- [x] Store and load Student profile fields from the database.
- [x] Support Google profile photo as an avatar option.
- [x] Support emoji avatar selection.
- [x] Persist emoji avatar selection to the database.
- [x] Keep dashboard avatar in sync after profile avatar changes.
- [x] Keep profile avatar picker in sync when returning from dashboard.
- [ ] Confirm first-time Google login creates the expected auth user record.
- [ ] Confirm first-time Student login requires profile completion.
- [ ] Confirm completed Student profile redirects to dashboard.
- [ ] Confirm Admin users skip Student profile completion.
- [ ] Confirm suspended users cannot access protected Student routes.
- [ ] Add focused regression coverage for avatar preference behavior.

## 3. Route Protection

- [x] Protect all Student-only routes behind an authenticated session.
- [x] Protect all Admin routes behind authenticated session plus admin whitelist.
- [x] Recheck Admin access on every Admin route load.
- [x] Recheck Admin access at the start of every Admin mutation.
- [x] Redirect unauthenticated users to login.
- [x] Redirect incomplete Student profiles to profile completion.
- [x] Redirect Admin users to the Admin dashboard after login.
- [x] Prevent completed Students from using profile completion as an edit page.
- [ ] Show a clear blocked state for suspended users.

## 4. Mock Runtime Removal

- [x] Remove fake runtime current user state.
- [x] Remove fake runtime attempts.
- [x] Remove fake runtime entitlements.
- [x] Remove fake premium access toggles.
- [x] Remove fake badge progress state.
- [x] Remove fake leaderboard users.
- [x] Keep seed/catalog data separate from runtime state.
- [x] Make checkout honest about payment not being part of M1.
- [x] Make coupons honest about not being part of M1.
- [x] Make live poll backend honest about not being part of M1.
- [x] Re-scan the app for remaining runtime `mock` references.
- [x] Re-scan the app for remaining fake `setTimeout` flows.
- [ ] Re-scan the app for pages that still mutate only browser memory.
- [ ] Confirm every visible Student metric is loaded from server-backed data.

## 5. Admin Foundation

- [x] Create Admin layout and navigation.
- [x] Create Admin dashboard route.
- [x] Create Admin users route.
- [x] Create Admin user detail route.
- [x] Create Admin try-outs route.
- [x] Skip standalone Admin questions route for M1; manage Questions through Try-out workbook.
- [x] Skip standalone Admin materi management for M1; keep placeholder/count route only.
- [x] Create Admin reports route.
- [x] Create Admin insights route.
- [x] Add admin whitelist table and bootstrap from `ADMIN_EMAILS`.
- [x] Add Super-admin capability for adding Admin users.
- [x] Add Super-admin capability for removing Admin users.
- [ ] Add Admin audit fields where useful.
- [ ] Add clear empty states for all Admin pages.

## 6. Content Categories And Questions

- [x] Store categories in the database.
- [x] Store sub-categories in the database.
- [x] Enforce a maximum of two category levels.
- [x] Add Category/Sub-category Admin management for create, rename, recolor, and reorder.
- [x] Show stable Category/Sub-category IDs for workbook import use.
- [x] Defer Category/Sub-category merge/delete until a history policy exists.
- [x] Store questions in the database.
- [x] Store question choices in the database.
- [x] Store correct answer keys securely enough for M1.
- [x] Store question explanations.
- [x] Defer question difficulty to M2.
- [x] Store question status.
- [x] Allow Admins to create questions through Try-out workbook import.
- [x] Allow Admins to edit questions through Try-out workbook import.
- [x] Use unpublish instead of archive for M1 Questions.
- [x] Prevent unpublished questions from appearing in new attempts.
- [x] Validate every question mutation with Zod.

## 7. Try-Out Management

- [x] Store try-outs in the database.
- [x] Store try-out section/question membership in the database.
- [x] Support draft try-outs.
- [x] Support published try-outs.
- [x] Use unpublished instead of archived for M1 Try-outs.
- [x] Allow Admins to create try-outs.
- [x] Allow Admins to edit try-outs.
- [x] Allow Admins to publish try-outs.
- [x] Allow Admins to unpublish try-outs.
- [x] Prevent Students from starting unpublished try-outs.
- [x] Prevent Students from starting unavailable Try-outs.
- [x] Keep Try-out terminology consistent in UI and code.

## 8. Excel Import

- [x] Define the final M1 Excel template.
- [x] Validate required columns before import.
- [x] Validate category/sub-category IDs during import.
- [x] Validate answer options during import.
- [x] Validate correct answer key during import.
- [x] Validate duplicate question rows.
- [x] Show import preview before commit.
- [x] Preview Category/Sub-category reuse/create actions before commit.
- [x] Auto-create Category/Sub-category from workbook names when IDs are blank.
- [x] Commit valid import rows in a transaction.
- [x] Report invalid rows with row numbers.
- [x] Add an import sample file or update the existing sample file.
- [x] Add Admin UI for downloading the template.
- [x] Add Admin UI for uploading Excel.

## 9. Materi Management

- [x] Store Materi records in the database.
- [x] Store Materi category/sub-category links.
- [x] Store Materi status.
- [x] Skip local upload abstraction for M1; Materi upload moves out of M1.
- [x] Skip Admin Materi PDF upload for M1.
- [x] Skip Admin Materi metadata creation for M1.
- [x] Skip Admin Materi metadata editing for M1.
- [x] Skip Admin Materi publishing for M1.
- [x] Skip Admin Materi archiving for M1.
- [x] Keep published Materi available only where already seeded/linked.
- [x] Use published/unpublished status; Materi archive behavior moves out of M1.

## 10. Student Try-Out List

- [x] Load published try-outs from the server.
- [x] Accept no attempt count per Try-out in M1.
- [x] Accept no latest attempt status per Try-out in M1.
- [x] Accept no latest score per Try-out in M1.
- [x] Show duration and question count from real try-out data.
- [x] Support retake entry points.
- [x] Hide unavailable try-outs.
- [x] Replace any remaining static try-out list behavior.

## 11. Attempt Lifecycle

- [x] Create an Attempt when a Student starts a Try-out.
- [x] Store Attempt status.
- [x] Store Attempt start time.
- [x] Store Attempt deadline.
- [x] Store per-question answers.
- [x] Store flagged questions.
- [x] Store last question index instead of full visited-question trail.
- [x] Resume an in-progress Attempt.
- [x] Prevent another active Attempt for the same Student and Try-out unless the product explicitly allows it.
- [x] Auto-submit expired attempts from the Student UI.
- [x] Submit attempts from the Student UI.
- [x] Score attempts on the server.
- [x] Make retake create a new Attempt.
- [x] Keep previous Attempt history immutable after submission.

## 12. Autosave And Offline Queue

- [x] Autosave answers to the server.
- [x] Autosave flagged question state.
- [x] Show saving state in the Try-out UI.
- [x] Show saved state in the Try-out UI.
- [x] Show failed-save state in the Try-out UI.
- [x] Queue answer changes while offline.
- [x] Replay queued answer changes when online.
- [ ] Resolve stale queued changes predictably.
- [ ] Prevent duplicate answer writes from corrupting Attempt state.
- [ ] Test refresh during an active Attempt.
- [ ] Test network drop during an active Attempt.
- [ ] Test browser close and resume during an active Attempt.

## 13. Results And Review

- [x] Load submitted result summary from the server.
- [x] Show score from server-scored Attempt data.
- [x] Show correct count from server-scored Attempt data.
- [x] Show incorrect count from server-scored Attempt data.
- [x] Show unanswered count from server-scored Attempt data.
- [x] Show time spent from Attempt timestamps.
- [x] Load review questions from server-backed Attempt answers.
- [x] Show explanations from database questions.
- [x] Allow Students to report a question from review.
- [x] Store question reports in the database.
- [ ] Prevent duplicate noisy reports where reasonable.

## 14. Admin Reports

- [x] List question reports for Admins.
- [x] Filter reports by status.
- [x] Filter reports by try-out.
- [x] Filter reports by question.
- [x] Show report detail.
- [x] Show the reported question context.
- [x] Allow Admins to mark reports as reviewed.
- [x] Allow Admins to mark reports as resolved.
- [x] Allow Admins to reject invalid reports.
- [x] Store report status changes.
- [x] Store report reviewer metadata.

## 15. Progress And Evaluation

- [x] Calculate XP from real submitted attempts.
- [x] Calculate level from real XP.
- [x] Calculate streak from real submitted attempt dates.
- [x] Load dashboard progress from server-backed summary data.
- [x] Load progress page metrics from server-backed summary data.
- [x] Load evaluation page metrics from server-backed summary data.
- [x] Load result page TopBar progress from server-backed summary data.
- [x] Load try-out page TopBar progress from server-backed summary data.
- [ ] Confirm XP formula matches product expectations.
- [ ] Confirm streak timezone behavior uses `Asia/Jakarta`.
- [ ] Add tests for streak calculation.
- [ ] Add tests for level calculation.
- [ ] Add tests for progress summary aggregation.
- [x] Add category-level performance breakdown from real attempts.
- [x] Add sub-category performance breakdown from real attempts.
- [x] Add attempt history UI backed by real attempts.

## 16. Admin Student Evaluation

- [x] List Students for Admin evaluation.
- [ ] Search Students by name.
- [ ] Search Students by email.
- [ ] Filter Students by profile status.
- [ ] Filter Students by suspension status.
- [x] Show Student detail with profile information.
- [x] Show Student detail with XP.
- [x] Show Student detail with level.
- [x] Show Student detail with streak.
- [x] Show Student detail with attempt history.
- [x] Show Student detail with category performance.
- [x] Show Student detail with sub-category performance.
- [x] Allow Admins to suspend Students.
- [x] Allow Admins to unsuspend Students.

## 17. Insights

- [x] Show Admin insight for total Students.
- [x] Show Admin insight for active Students.
- [x] Show Admin insight for completed attempts.
- [x] Show Admin insight for average score.
- [x] Show Admin insight for difficult questions.
- [x] Show Admin insight for reported questions.
- [x] Show Admin insight for Try-out participation.
- [x] Keep M1 insights basic and query-backed.
- [x] Avoid adding M2/M3 analytics scope unless it blocks Admin usefulness.

## 18. Security And Validation

- [x] Validate every server function input with Zod where input exists.
- [x] Put authorization checks at the top of mutations.
- [x] Ensure Students can only read their own private attempts.
- [x] Ensure Students cannot read other Students' private profile details.
- [x] Ensure public profile data is intentionally limited.
- [x] Ensure Admin-only data is not exposed to Student routes.
- [x] Ensure question answer keys are not sent to active Attempt pages.
- [x] Ensure unpublished content cannot be started by Students.
- [x] Ensure database writes use transactions when multiple tables must stay consistent.
- [x] Ensure Excel uploads are constrained by accepted `.xlsx` file input and workbook validation.

## 19. Observability And Error Handling

- [ ] Add consistent server error shapes.
- [ ] Add clear UI messages for recoverable errors.
- [ ] Add not-found states for missing Try-outs.
- [ ] Add not-found states for missing Attempts.
- [ ] Add not-found states for missing public profiles.
- [ ] Add Admin-facing import error detail.
- [ ] Log unexpected server failures with useful context.
- [ ] Avoid logging secrets, tokens, or answer keys unnecessarily.

## 20. M1 Demo Script

- [ ] Demo Google login.
- [ ] Demo Student profile completion.
- [ ] Demo emoji avatar selection.
- [ ] Demo Google avatar selection.
- [ ] Demo dashboard progress from real data.
- [ ] Demo starting a Try-out.
- [ ] Demo autosave during Try-out.
- [ ] Demo refresh and resume.
- [ ] Demo submit and results.
- [ ] Demo review and report question.
- [ ] Demo My Progress attempt history.
- [ ] Demo Admin login path.
- [ ] Demo Admin question management through Try-out workbook.
- [ ] Demo Admin Try-out management.
- [ ] Demo Admin Excel import.
- [x] Skip Admin Materi management demo for M1.
- [ ] Demo Admin report moderation.
- [ ] Demo Admin Student evaluation.
- [ ] Demo basic Admin insights.

## 21. Definition Of Done

- [ ] No M1 route depends on mock runtime state.
- [ ] No hardcoded Student identity appears in runtime code.
- [ ] Every protected route handles missing session correctly.
- [ ] Every Admin route enforces Admin authorization.
- [ ] Student profile completion works from a fresh Google login.
- [ ] Avatar preference persists across dashboard/profile navigation and reloads.
- [ ] Try-out Attempt data survives refresh.
- [ ] Try-out Attempt data survives temporary offline usage.
- [ ] Submitted Attempts are scored on the server.
- [ ] Progress, level, and streak come from real Attempt data.
- [ ] Admin can manage questions through Try-out workbook and manage Try-outs.
- [ ] Admin can import questions from Excel.
- [x] Admin Materi management is skipped for M1.
- [ ] Admin can review question reports.
- [ ] Admin can inspect Student evaluation data.
- [ ] TypeScript validation passes.
- [ ] Database migrations apply cleanly.
- [ ] Manual M1 demo script passes end to end.
