# IlmoraX Milestone 1 Checklist

**Date:** 2026-05-13  
**Milestone:** M1 - Core Platform, Try-out, Admin Foundation, and Basic Analytics  
**Source plan:** `docs/20260506 - IlmoraX - Milestone 1 Backend Integration Plan.md`

This checklist tracks the practical work needed to finish M1. Keep every item tied to real backend behavior. Do not reintroduce mock runtime state.

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

- [ ] Protect all Student-only routes behind an authenticated session.
- [ ] Protect all Admin routes behind authenticated session plus admin whitelist.
- [ ] Recheck Admin access on every Admin route load.
- [ ] Recheck Admin access at the start of every Admin mutation.
- [ ] Redirect unauthenticated users to login.
- [ ] Redirect incomplete Student profiles to profile completion.
- [ ] Redirect Admin users to the Admin dashboard after login.
- [ ] Prevent completed Students from using profile completion as an edit page.
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
- [ ] Re-scan the app for remaining runtime `mock` references.
- [ ] Re-scan the app for remaining fake `setTimeout` flows.
- [ ] Re-scan the app for pages that still mutate only browser memory.
- [ ] Confirm every visible Student metric is loaded from server-backed data.

## 5. Admin Foundation

- [ ] Create Admin layout and navigation.
- [ ] Create Admin dashboard route.
- [ ] Create Admin users route.
- [ ] Create Admin user detail route.
- [ ] Create Admin try-outs route.
- [ ] Create Admin questions route.
- [ ] Create Admin materi route.
- [ ] Create Admin reports route.
- [ ] Create Admin insights route.
- [ ] Add admin whitelist table and bootstrap from `ADMIN_EMAILS`.
- [ ] Add Super-admin capability for adding Admin users.
- [ ] Add Super-admin capability for removing Admin users.
- [ ] Add Admin audit fields where useful.
- [ ] Add clear empty states for all Admin pages.

## 6. Content Categories And Questions

- [ ] Store categories in the database.
- [ ] Store sub-categories in the database.
- [ ] Enforce a maximum of two category levels.
- [ ] Store questions in the database.
- [ ] Store question choices in the database.
- [ ] Store correct answer keys securely enough for M1.
- [ ] Store question explanations.
- [ ] Store question difficulty.
- [ ] Store question status.
- [ ] Allow Admins to create questions.
- [ ] Allow Admins to edit questions.
- [ ] Allow Admins to archive questions.
- [ ] Prevent archived questions from appearing in new attempts.
- [ ] Validate every question mutation with Zod.

## 7. Try-Out Management

- [ ] Store try-outs in the database.
- [ ] Store try-out section/question membership in the database.
- [ ] Support draft try-outs.
- [ ] Support published try-outs.
- [ ] Support archived try-outs.
- [ ] Allow Admins to create try-outs.
- [ ] Allow Admins to edit try-outs.
- [ ] Allow Admins to publish try-outs.
- [ ] Allow Admins to archive try-outs.
- [ ] Prevent Students from starting unpublished try-outs.
- [ ] Prevent Students from starting archived try-outs.
- [ ] Keep Try-out terminology consistent in UI and code.

## 8. Excel Import

- [ ] Define the final M1 Excel template.
- [ ] Validate required columns before import.
- [ ] Validate category names during import.
- [ ] Validate answer options during import.
- [ ] Validate correct answer key during import.
- [ ] Validate duplicate question rows.
- [ ] Show import preview before commit.
- [ ] Commit valid import rows in a transaction.
- [ ] Report invalid rows with row numbers.
- [ ] Add an import sample file or update the existing sample file.
- [ ] Add Admin UI for downloading the template.
- [ ] Add Admin UI for uploading Excel.

## 9. Materi Management

- [ ] Store Materi records in the database.
- [ ] Store Materi category/sub-category links.
- [ ] Store Materi status.
- [ ] Add local upload abstraction for M1 files.
- [ ] Allow Admins to upload Materi PDFs.
- [ ] Allow Admins to create Materi metadata.
- [ ] Allow Admins to edit Materi metadata.
- [ ] Allow Admins to publish Materi.
- [ ] Allow Admins to archive Materi.
- [ ] Show published Materi to Students.
- [ ] Prevent archived Materi from appearing to Students.

## 10. Student Try-Out List

- [ ] Load published try-outs from the server.
- [ ] Show attempt count per try-out.
- [ ] Show latest attempt status per try-out.
- [ ] Show latest score per try-out.
- [ ] Show duration and question count from real try-out data.
- [ ] Support retake entry points.
- [ ] Hide unavailable try-outs.
- [ ] Replace any remaining static try-out list behavior.

## 11. Attempt Lifecycle

- [ ] Create an Attempt when a Student starts a Try-out.
- [ ] Store Attempt status.
- [ ] Store Attempt start time.
- [ ] Store Attempt deadline.
- [ ] Store per-question answers.
- [ ] Store flagged questions.
- [ ] Store visited questions if needed by the UI.
- [ ] Resume an in-progress Attempt.
- [ ] Prevent another active Attempt for the same Student and Try-out unless the product explicitly allows it.
- [ ] Auto-submit expired attempts.
- [ ] Submit attempts from the Student UI.
- [ ] Score attempts on the server.
- [ ] Make retake create a new Attempt.
- [ ] Keep previous Attempt history immutable after submission.

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

- [ ] Load submitted result summary from the server.
- [ ] Show score from server-scored Attempt data.
- [ ] Show correct count from server-scored Attempt data.
- [ ] Show incorrect count from server-scored Attempt data.
- [ ] Show unanswered count from server-scored Attempt data.
- [ ] Show time spent from Attempt timestamps.
- [ ] Load review questions from server-backed Attempt answers.
- [ ] Show explanations from database questions.
- [ ] Allow Students to report a question from review.
- [ ] Store question reports in the database.
- [ ] Prevent duplicate noisy reports where reasonable.

## 14. Admin Reports

- [ ] List question reports for Admins.
- [ ] Filter reports by status.
- [ ] Filter reports by try-out.
- [ ] Filter reports by question.
- [ ] Show report detail.
- [ ] Show the reported question context.
- [ ] Allow Admins to mark reports as reviewed.
- [ ] Allow Admins to mark reports as resolved.
- [ ] Allow Admins to reject invalid reports.
- [ ] Store report status changes.
- [ ] Store report reviewer metadata.

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
- [ ] Add category-level performance breakdown from real attempts.
- [ ] Add sub-category performance breakdown from real attempts.
- [ ] Add attempt history UI backed by real attempts.

## 16. Admin Student Evaluation

- [ ] List Students for Admin evaluation.
- [ ] Search Students by name.
- [ ] Search Students by email.
- [ ] Filter Students by profile status.
- [ ] Filter Students by suspension status.
- [ ] Show Student detail with profile information.
- [ ] Show Student detail with XP.
- [ ] Show Student detail with level.
- [ ] Show Student detail with streak.
- [ ] Show Student detail with attempt history.
- [ ] Show Student detail with category performance.
- [ ] Show Student detail with sub-category performance.
- [ ] Allow Admins to suspend Students.
- [ ] Allow Admins to unsuspend Students.

## 17. Insights

- [ ] Show Admin insight for total Students.
- [ ] Show Admin insight for active Students.
- [ ] Show Admin insight for completed attempts.
- [ ] Show Admin insight for average score.
- [ ] Show Admin insight for difficult questions.
- [ ] Show Admin insight for reported questions.
- [ ] Show Admin insight for Try-out participation.
- [ ] Keep M1 insights basic and query-backed.
- [ ] Avoid adding M2/M3 analytics scope unless it blocks Admin usefulness.

## 18. Security And Validation

- [ ] Validate every server function input with Zod.
- [ ] Put authorization checks at the top of mutations.
- [ ] Ensure Students can only read their own private attempts.
- [ ] Ensure Students cannot read other Students' private profile details.
- [ ] Ensure public profile data is intentionally limited.
- [ ] Ensure Admin-only data is not exposed to Student routes.
- [x] Ensure question answer keys are not sent to active Attempt pages.
- [ ] Ensure archived content cannot be started by Students.
- [ ] Ensure database writes use transactions when multiple tables must stay consistent.
- [ ] Ensure uploaded files are constrained by type and size.

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
- [ ] Demo Admin question management.
- [ ] Demo Admin Try-out management.
- [ ] Demo Admin Excel import.
- [ ] Demo Admin Materi management.
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
- [ ] Admin can manage questions and Try-outs.
- [ ] Admin can import questions from Excel.
- [ ] Admin can manage Materi.
- [ ] Admin can review question reports.
- [ ] Admin can inspect Student evaluation data.
- [ ] TypeScript validation passes.
- [ ] Database migrations apply cleanly.
- [ ] Manual M1 demo script passes end to end.
