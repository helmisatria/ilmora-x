# IlmoraX

Web-based pharmacy exam prep platform. Students take timed assessments (CBT), track progress, and compete on leaderboards. Admins manage content, users, and engagement features.

## Language

**Try-out**:
A timed assessment of questions that a student takes in one or more attempts. Canonical term in user-facing UI (Bahasa).
_Avoid_: CBT (internal/admin docs only), exercise (do not use)

**Attempt**:
A single start-to-finish session of a **Try-out**, from first click of "Mulai" to submit or timer expiry. Autosave resumes the same Attempt after a disconnect or refresh. A retake creates a **new** Attempt.
_Avoid_: Session, try, run

**Attempt lifecycle**:
The server-owned progression of an **Attempt** from start/resume through autosave and submit/auto-submit.
_Avoid_: Session lifecycle

**Category**:
The top level of question classification (e.g. "Klinis", "Farmakologi"). Every **Question** belongs to exactly one Category.

**Sub-category**:
The second and final level of question classification, scoped under a **Category** (e.g. "Kardiovaskular - Hipertensi" under "Klinis"). Every **Question** is tagged with exactly one `(Category, Sub-category)` pair. No deeper nesting.
_Avoid_: Topic, tag, sub-sub-category

**Question**:
A single item a student answers inside a **Try-out**. Carries the explanation ("pembahasan"), an access level, and one `(Category, Sub-category)` pair.
_Avoid_: Soal (Bahasa only — ok in UI), item

**Question Review**:
The per-Question review content shown after an Attempt, consisting of the correct answer, explanation ("pembahasan"), and optional video pembahasan. It belongs to the Question, not to standalone Materi.
_Avoid_: Materi (unless referring to a standalone study-material unit)

**Student Evaluation**:
A per-Student learning-performance view computed from submitted and auto-submitted **Attempts**, covering totals, accuracy, Attempt history, and Category/Sub-category breakdowns.
_Avoid_: Users Insights, platform analytics

**Engagement surface**:
The complete set of gamification concepts in scope: **EXP**, **Level** (1–50), **Badge**, **Streak** (daily Try-out consecutive days), **Leaderboard**. Hearts (lives) and Gems (currency) are **out of scope** and must not appear in the prototype top bar.

**Badge**:
A one-time Student achievement with an unlock requirement and optional EXP reward.

**Coupon**:
An admin-created discount code redeemable at checkout during a validity window (`start_time`, `end_time`). Each **Student** may redeem a given Coupon at most once. Admin may additionally set a `max_total_uses` cap (≥1) on the Coupon itself — setting it to `1` produces a first-come-first-served single-claim code; leaving it unset allows unlimited redemptions across students within the validity window. A Coupon has an explicit product scope so it cannot accidentally apply to the wrong paid product type.
_Avoid_: Promo, voucher, discount code

## Rules (payment)

- **Coupon redemption is per-Student.** Unique constraint `(coupon_id, student_id)` on the redemption ledger. A Student cannot redeem the same Coupon twice even if the global `max_total_uses` hasn't been reached.
- **Referral discounts are out of scope for now.** Students may still have referral codes in profile for future use, but checkout does not validate or advertise referral discounts.
- **Checkout accepts at most one Coupon.** Single input field labeled "Kode Kupon". Stacking is explicitly disallowed.
- **Coupon scope is product-aware.** Admin chooses whether a Coupon applies to Premium Membership, Lifetime Try-out Purchase, Materi, or all paid products.

## Language (Live Poll)

**Poll Session**:
An admin-created live classroom activity with a short-lived join code, used in offline class to gauge student understanding across one or more **Poll Rounds**. Lifecycle: `draft → open → closed`, with Admin allowed to reopen a closed Poll Session. Separate from the Try-out engagement surface — participation grants no EXP.
_Avoid_: Quiz, survey, vote, Poll when referring to the whole classroom activity

**Poll Round**:
A single A/B/C/D/E question inside an open **Poll Session**. The app does not need to show the full question text because the teacher presents it live in class. Admins may create the next Poll Round on the fly while the Poll Session remains open.
_Avoid_: Question, quiz item

**Poll Round Plan**:
An optional session-local prepared sequence of **Poll Rounds** imported before class, carrying teacher-facing question text, option text, and answer keys without changing the student response flow.
_Avoid_: Question bank, Try-out import

**Teacher Presentation View**:
A projector-friendly classroom view that shows the current **Poll Round Plan** question and options for students to read together in the offline class.
_Avoid_: Student Poll UI

**Poll code**:
A 6-digit numeric code unique **among currently-open Poll Sessions only**. Reuseable after the Poll Session closes.

## Rules (Poll)

- **Join is per-session configurable** between "login required" and "open guest." Default: open guest (matches offline-class workflow). Guest join collects display name only.
- **Poll participant is session-local.** In open-guest sessions, signed-in Students join with their profile name and guests join with a display name, but both are represented as Poll participants for that Poll Session.
- **Guest identity persists for the Poll Session.** Open-guest participants enter a display name once and keep the same participant identity across rounds on the same browser/device until the Poll Session closes.
- **Guest display names are unique per Poll Session.** Duplicate display names are rejected inside the same Poll Session to keep participant status and rankings unambiguous.
- **Late join is allowed while the Poll Session is open.** Late participants may answer the current Poll Round if it is still open; otherwise they wait for the next Poll Round. Their session score starts at zero.
- **Poll Rounds close manually by default.** Admin may optionally add a timer per Poll Round; time-boxed rounds auto-close on 0.
- **Student Poll Round UI shows answer buttons only.** Students see round status and A/B/C/D/E buttons, not full question text or option text. Admin may store a short internal round label for history.
- **Prepared Poll Round content is teacher-facing.** If Admin uploads a Poll Round Plan, question text and option text are shown in Admin/teacher presentation surfaces, while student devices remain answer-only.
- **Teacher Presentation View is Admin-controlled.** The Poll code grants student participation only; teacher-facing question and option content requires Admin access from Poll Session management.
- **Poll Round Plans are queues, not history.** Uploaded rows become available for Admin to start one-by-one; a planned row becomes a Poll Round only when Admin starts it during the Poll Session.
- **Poll Round Plan workbook is row-based.** Each row represents one planned Poll Round with optional `label`, required `question_text`, required `option_a` through `option_d`, optional `option_e`, required `correct_option`, and optional `timer_seconds`.
- **Poll Round Plan import is all-or-nothing.** If any uploaded row is invalid, the whole plan is rejected with row-level errors so Admin fixes the workbook before class.
- **Teacher-facing Poll Round content is plain text in M3.** Uploaded or manually entered question and option text does not support rich formatting, embedded images, or slide-style layout.
- **Poll Round Plans are session-local.** A plan belongs to one Poll Session and is not a reusable library across classes.
- **Poll Round Plan replacement only affects the future queue.** Admin may upload or replace a plan during an open Poll Session, but existing open or closed Poll Rounds remain unchanged as history.
- **Planned Poll Round content is editable before start.** Admin may adjust the planned label, timer, question text, option text, and answer key before opening that row as a Poll Round; after opening, the normal Poll Round correction rules apply.
- **Starting planned Poll Rounds requires explicit confirmation.** The Admin UI may preselect the next planned row, but Admin must review and start it explicitly before it opens to students.
- **Skipped planned rows are not Poll Session history.** Admin may skip rows in a Poll Round Plan, but only rows that are actually opened as Poll Rounds appear in later history.
- **Presented Poll Round content persists in history.** When a planned row is started, its teacher-facing question text and option text are preserved with the Poll Round for admin review, but they do not become reusable Try-out Questions.
- **Poll Session can start without a Poll Round Plan.** Admin may run the existing manual offline-class flow by choosing the answer key round-by-round while the teacher presents questions outside IlmoraX.
- **Manual Poll Rounds may include teacher-facing content.** Admin can optionally type question text and option text for a manual Poll Round so it can use the Teacher Presentation View; leaving them blank keeps the existing answer-key-only classroom flow.
- **Poll Round label is optional.** The system auto-generates labels such as `Round 1`, `Round 2`, and Admin may override the label for easier history review.
- **Poll Round answer key is set before opening.** Admin chooses the correct A/B/C/D/E letter before a Poll Round starts so scoring has a stable source of truth.
- **Closed Poll Rounds can be corrected by Admin.** If Admin picked the wrong answer key, they may correct it only after the Poll Round closes; scores and session rankings are recalculated and the correction remains visible in history.
- **Votes can change until the Poll Round closes.** A participant may change their selected answer while the Poll Round is open; the last submitted answer at close is scored and persisted.
- **Answer reveal happens by closing the Poll Round.** Students see no results or correct answer until the Poll Round closes. Admin sees live vote counts during the open round.
- **Teacher Presentation View stays neutral while open.** The classroom-facing view hides live answer counts and correctness until reveal; the Admin dashboard may still show live counts for operation.
- **Only one Poll Round is active at a time.** If Admin clicks Next while a Poll Round is still open, the system closes/reveals the current round before opening the next one.
- **Admin Poll Session dashboard prioritizes operation.** During an open Poll Session, Admin sees the join code, participant count, answered count, current round status, live answer distribution, participant status list, and a compact student-view preview.
- **Closed-round feedback is personal plus ranked.** After a Poll Round closes, students see whether their own A/B/C/D/E choice was correct, their points for that round, their current Poll Session rank, and a top-participant leaderboard; teacher-facing question and option text stay out of the student device UI.
- **Students see participant status, not peer answers.** While a Poll Round is open, students may see which participants have submitted, but they must not see another participant's selected option.
- **Poll scoring is local to the Poll Session.** A closed Poll Round may rank participants using correctness plus response speed, but these points exist only inside that Poll Session history and never become EXP or weekly Leaderboard points.
- **Live count updates use Server-Sent Events with slow HTTP refetch fallback.** Poll mutations publish lightweight invalidation events through Postgres `LISTEN/NOTIFY`; clients refetch authoritative state after receiving an event.
- **Poll Session history is persisted for admin review.** Admins can revisit session title/date/admin, participants, each round's correct answer, counts, percentages, each participant's selected answer per round, per-round score, final session score/rank, and answer-key corrections. Poll Session participation does not affect EXP, Level, Badge, Streak, Leaderboard, or the Student's normal learning experience.
- **Closed Poll Session history is archived, not hard-deleted.** Normal Admin UI may hide archived sessions from default lists, but history remains recoverable/auditable.
- **Closed Poll Sessions may reopen.** Reopening a Poll Session makes it open again so Admin can continue with new Poll Rounds; existing closed Poll Rounds remain closed. If the old Poll code is already used by another open Poll Session, the reopened session receives a fresh code.
- **Student Poll history is out of scope.** Students receive live feedback during the Poll Session, but do not get a permanent Poll history page.
- **Poll Session management lives in Admin CMS.** Admins create, run, archive, and review Poll Sessions from `/admin/polls`. Students join and participate through `/poll/join` and `/poll/$code`.
- **All Admins may manage Poll Sessions.** Poll Session management is not restricted to Super-admins.
- **Poll Session title is required for history.** Admin can accept an auto-filled class/date title to start quickly, but every Poll Session has a title for later review.

## Rules (Try-out autosave)

- **Server-first persistence, localStorage fallback.** Server is the source of truth; localStorage buffers state when offline and syncs on reconnect.
- **Saves are triggered by answer-change (debounced ~500ms) + tab events** (blur, visibilitychange, beforeunload). No periodic timer saves.
- **Persisted state per in-progress Attempt**: `{answers: {[qid]: choice}, marked: [qid…], last_question_index}`. Nothing else.
- **Only one active Attempt session per Student.** Opening the Attempt on a second device invalidates the first; the losing client shows a kick-out modal.
- **On submit: flush local queue first, then submit.** If offline at submit time, queue and retry on reconnect. If the wall-clock deadline elapses while offline, the server auto-submits with the last-synced state.
- **"Auto-saved at HH:MM" UI shows last server-confirmed save**, not last local save. Avoids false reassurance.
- **Attempt lifecycle may trigger Badge evaluation after submit, but Badge rules belong to the Engagement surface.** Attempt submission records the Attempt result and may orchestrate downstream Badge evaluation; it does not own Badge eligibility rules.

## Rules (Student Evaluation)

- **Admin Student Evaluation reuses the Student Evaluation model.** Admins may inspect the same per-Student learning-performance data a Student sees, scoped to a selected Student and presented inside Admin CMS with profile/status context.
- **Admin Attempt Review is read-only inspection.** From Admin Student Evaluation, Admins may open submitted or auto-submitted Attempt result/review for the selected Student, but cannot edit answers, rescore Attempts, or submit in-progress Attempts from that surface.
- **Admin Student Evaluation ignores Student premium gating.** Student-facing Evaluation may lock or blur premium-only details, but Admin-facing Student Evaluation always shows the full basic evaluation because it is an operational oversight surface, not a Student entitlement.
- **Users Insights is platform-level analytics.** Cross-Student aggregates, cohorts, and platform-wide performance questions belong to Users Insights, not Admin Student Evaluation.

## Rules (Try-out content management)

- **Try-out edit is the primary import/export workflow.** Admins assemble a Try-out by downloading/uploading a Try-out workbook that contains ordered Questions and per-Question Review fields.
- **Question bank is secondary.** The Questions admin page is for searching, editing, publishing, unpublishing, and moderation across all Questions; it is not the main place to import Try-out content.
- **Try-out workbook imports update assignments.** A successful import updates the Questions and their order/assignment within that Try-out in one validated transaction.
- **Try-out workbook uses `question_id` for updates.** Rows with `question_id` update existing Questions; rows without `question_id` create new Questions. A duplicate `question_id` in one workbook rejects the whole import.
- **Missing rows unassign, not delete.** If an existing assigned Question is absent from the uploaded Try-out workbook, it is removed from that Try-out only. The Question remains in the Question bank.
- **Questions are reusable across Try-outs.** One Question may be assigned to multiple Try-outs through Try-out Question assignment.
- **Try-out workbook edits protect shared Questions.** If a workbook changes a Question that is assigned to another Try-out, the default behavior is to create a new Question copy for the current Try-out instead of mutating the shared Question.
- **Try-out workbook has separate sheets.** The workbook contains a `tryout` sheet with one metadata row and a `questions` sheet with ordered Question rows.
- **Try-out workbook can update publication status.** Workbook import may set Try-out and Question statuses, but a published Try-out must have at least one assigned published Question or the whole import is rejected.
- **Standalone Materi is outside the Try-out workbook in M1.** The Try-out workbook manages Try-out metadata, ordered Questions, and per-Question Review fields only. Materi remains managed through its own CMS workflow.

## Language (Identity)

**Student**:
A learner who signs in via Google OAuth (via **better-auth**) and completes the mandatory profile (nama, institusi, optional phone/photo). All app users are Students by default.
_Avoid_: User (too generic), learner

**Admin**:
A Student whose email is on the admin whitelist. Gains access to admin CMS routes (`/admin/*`). Not a separate account — same Google sign-in, same session.

**Super-admin**:
An Admin with the power to add/remove other Admins via the CMS. Seeded via env var on first boot; can promote other Admins thereafter.

## Rules (Identity & Access)

- **Single Google sign-in for everyone.** No email/password for admins. better-auth handles session, tokens, OAuth.
- **Admin whitelist is a DB table**, bootstrapped from an env var (`ADMIN_EMAILS`) on first deploy. Changes thereafter are CMS-driven; env var is ignored after bootstrap.
- **Admin status is re-verified on every `/admin/*` request** via middleware, not snapshotted at login. Removing an email from the whitelist revokes access immediately.
- **Admins skip the mandatory profile completion step.** Whitelist match on first sign-in sends them to `/admin` directly.
- **Two admin tiers**: `admin` (full CMS access) and `super_admin` (adds/removes admins). Only super_admins can modify the whitelist.

## Language (Premium access)

**Product**:
A sellable item in checkout. Product types include **Premium Membership** packages, **Lifetime Try-out Purchase** products, and later Materi purchases. Checkout has one payment flow for all Product types.

**Premium Membership**:
A time-boxed Product that grants global full-feature access while active. It unlocks paid Try-outs while active, premium explanations/videos, full evaluation dashboard, premium Materi, and future premium features. It is a one-time payment package, not auto-renew.
_Avoid_: Subscription, recurring plan

**Lifetime Try-out Purchase**:
A one-time Product that grants lifetime access to one specific paid Try-out.
_Avoid_: Platinum Try-out, Platinum tier

**Entitlement**:
A record that grants a **Student** access to a Product or content target. A Premium Membership Entitlement has `starts_at` and `ends_at`. A Lifetime Try-out Purchase Entitlement has no expiry and targets a specific Try-out. Entitlements can come from purchase or admin grant.

## Rules (Premium access)

- **Premium Membership is time-boxed, not recurring.** Students buy a Product as a one-time charge; Entitlement expires; renewal requires another purchase. No auto-renew in M2.
- **Effective Premium Membership = any non-expired membership Entitlement** for this Student. It is one global access check across all premium surfaces.
- **Lifetime Try-out ownership = any non-expired or lifetime content Entitlement** for the specific Try-out. It survives Premium Membership expiry.
- **Try-out access levels are explicit:** `free` or `paid`. Do not model this as `isPremium`, and do not use `platinum` as a content tier.
- **"Premium" may be used as the student-facing badge for paid Try-outs.** In domain language, the Try-out is paid; in UI copy, "Premium" signals a higher-value locked module but must still offer both unlock paths.
- **Admin Try-out access selection is Free or Premium.** The Premium admin label maps to a paid Try-out; Platinum is not an admin-selectable Try-out access level.
- **Question access levels are explicit:** `free` or `premium`. If a Student can access a Try-out, that access unlocks premium questions inside that Try-out.
- **Review locks follow effective access.** Active Premium members and Students with access to the specific paid Try-out do not see premium locks in review summary or detail review for that Attempt.
- **Overlapping purchases extend the expiry** — buying while an Entitlement is still active adds the new duration to the existing `ends_at`. Never blocks re-purchase.
- **Single premium tier in M2** — no "Premium Plus." Multi-tier is post-M2.
- **Hard expiry cut**, with proactive email warnings at T-7d and T-1d before `ends_at`. No grace period.
- **Admin-granted Premium Membership must specify a duration.** Admin-granted Lifetime Try-out Purchase access is a separate action and is lifetime by default.
- **Lifetime access means no expiry while the content remains available.** Admin may retire/unpublish a purchased Try-out. If a replacement Try-out is explicitly linked, owners get access to the replacement.
- **Catalog cards have one primary action.** Locked paid cards open a context-aware upgrade dialog. The dialog offers Premium Membership or buying that one Try-out only, then routes to the same checkout.
- **Active Premium members open paid Try-outs directly.** Paid Try-outs appear accessible/included while membership is active, and the lifetime purchase option is not shown for now.
- **Locked paid Try-out clicks do not route directly to Premium.** The Student must first choose between Premium Membership and Lifetime Try-out Purchase because the click only expresses interest in the Try-out, not a preferred purchase mode.
- **Paid Try-out unlock dialog title is "Try-out Premium".** The dialog presents Premium Membership as the recommended option and Lifetime Try-out Purchase as a clearly visible secondary option.
- **Owned Lifetime Try-out Purchases open directly.** The owned paid Try-out uses the "Dimiliki" state, skips the unlock dialog, and grants the full per-tryout experience without unlocking global Premium Membership features.
- **Every paid Try-out must have a Lifetime Try-out Purchase Product.** Prices are configured per Try-out, even when most use the same default price; a paid Try-out without a lifetime Product is invalid catalog setup.
- **Paid Try-out Products are system-maintained.** When an admin marks a Try-out as Premium, the admin form may optionally set the Lifetime Try-out Purchase price; if no price is provided, the system uses the default price and ensures the Product exists. When a Try-out returns to Free, the Product becomes inactive/hidden rather than deleted.
- **Default Lifetime Try-out Purchase price is configurable.** The current default is Rp19.000, but it must be treated as configurable product policy, not hard-coded domain truth.
- **Lifetime Try-out Purchase prices are shown in the unlock dialog, not on catalog cards.** Catalog cards stay content-first and show title, category, question count, duration, and Premium/Dimiliki state.
- **Try-out catalog filters are Semua, Gratis, Premium, and Dimiliki.** Premium means paid Try-outs, Dimiliki means lifetime-purchased Try-outs, and Platinum is not a user-facing filter.
- **Checkout returns to the selected Try-out when started from a locked Try-out.** After successful Premium Membership or Lifetime Try-out Purchase checkout, the Student lands on the selected Try-out pre-start page.
- **Paid Try-outs are unlocked before attempt.** Free Students cannot start a paid Try-out and then pay only for review; unlocking grants the complete per-tryout experience from start through review.
- **Locked paid catalog cards open the unlock dialog directly.** Only free, active Premium, or owned lifetime Try-outs open the pre-start page from the catalog.

## Product principles

- **Joyful UI, exam-faithful flow.** Visuals and motion should feel closer to Duolingo than to a textbook — bright, animated, celebratory. But the Try-out experience itself must mirror real formal exams (UKAI and similar) so students rehearse under authentic conditions. Any micro-interaction that reduces exam fidelity is cut.
- **Celebration lives *around* the exam, not inside it.** No mid-Attempt feedback (no per-question right/wrong reveal, no confetti on correct during test). Celebration moments fire at boundaries: result reveal after submit, level-up, streak milestone, badge earned, leaderboard rank change.
- **Hearts and Gems stay out** (see Q5). The "Duolingo feel" is delivered through motion, color, and type — not through Duolingo's gamification props.
- **Motion is part of the Phase 0 deliverable**, documented as a motion spec so devs implement against it during M1. Phase 0 prototype is clickable, not fully animated, but annotates intended transitions.
- **Sound effects are out of scope** for M1/M2/M3. Revisit post-launch if desired.

## Language (Materi)

**Materi**:
A standalone study-material unit tagged with one `(Category, Sub-category)` pair (same taxonomy as Questions). Carries an access level, a Markdown body, optional YouTube embed URL, and an optional PDF attachment.
_Avoid_: Article, lesson, module

## Rules (Materi)

- **Shared taxonomy with Questions.** One Category tree serves both — no parallel taxonomy for Materi.
- **Video: unlisted YouTube embeds only.** No self-hosted video in M1/M2. Attachments limited to a single PDF (≤20 MB) stored in object storage.
- **No Materi versioning.** Live edits publish immediately; students always see latest. Past Attempts are unrelated to Materi since Materi isn't scored.
- **Viewing Materi is tracked but grants no EXP.** View counts flow into Users Insights; there is no "Materi completed" mechanic.
- **Question → Materi backlink in result review** (M2, paired with premium evaluation). For each wrong answer, the pembahasan surfaces relevant Materi by shared `(Category, Sub-category)`. Reverse direction (Materi → related Questions) is deferred.

## Language (Moderation)

**Question report**:
A student-submitted complaint about a specific **Question**, carrying a categorized `reason` (answer key salah / pembahasan keliru / soal tidak jelas / typo / lainnya) and optional free-text note.

**Question snapshot**:
The frozen copy of a **Question**'s content captured when an **Attempt** begins. The Attempt references this snapshot for display and scoring. Live edits to the Question by admins do not affect in-progress or past Attempts.

## Rules (Moderation)

- **Reports cluster per Question** in the admin moderation queue. Queue shows one row per reported Question with a report count; drill in for individual messages.
- **Admin actions on a reported Question**: dismiss, edit, unpublish, delete. Delete warns if past Attempts reference the Question; unpublish is preferred in that case.
- **Past Attempts never re-score on edit.** Historical scores, EXP, leaderboard totals, and evaluation numbers remain frozen regardless of question edits. (Opt-in re-scoring is a post-M1 feature.)
- **Student feedback on report**: in-app toast on submit in M1 ("Laporan kami terima"), email acknowledgment added in M2. No in-app report history.

## Rules

- **Timer continues wall-clock during disconnect.** When a student disconnects mid-Attempt, the server-side deadline keeps counting. This prevents "disconnect to think" exploits and matches real exam behavior.
- **EXP grant scales on retake and extra practice.** First Attempt of a Try-out grants full EXP. Subsequent Attempts inside the normal daily quota grant a reduced amount (currently 25% of base). Active Premium access or Lifetime Try-out Purchase ownership may allow extra same-day practice for the accessible Try-out, but Attempts beyond the normal daily quota grant 0 EXP.
- **Daily Try-out Attempt limits are part of the Attempt lifecycle.** Premium access or Lifetime Try-out Purchase ownership may grant extended practice access, but the Attempt lifecycle decides whether a new Attempt can start and whether that Attempt earns EXP.
- **Badge counts of "Complete N CBT" use unique Try-outs completed**, not total Attempts. Prevents farming BADGE-022/023/024 by retaking a short Try-out.
- **Permanent EXP bonus: only the highest tier applies.** A student at level 46 with BADGE-004..011 all earned gets a single +40% multiplier (from BADGE-011), not additive stacking. Applies to EXP earned after the badge is awarded only; never retroactive.
- **Leaderboard is weekly and EXP-earned-that-week only.** Week = Monday 00:00 → Sunday 23:59 WIB (UTC+7). The week closes at Monday 00:00 WIB; finalization may run shortly after the boundary (for example Monday 00:05 WIB). The canonical week key is the Jakarta Monday start date (`YYYY-MM-DD`).
- **Live current-week leaderboard resets at the week boundary.** At Monday 00:00 WIB the live leaderboard window moves to the new week even if previous-week finalization is still pending.
- **Previous-week history may be pending after the boundary.** If a closed week has not been finalized yet, history/admin surfaces show a finalizing state instead of recomputing or displaying provisional Badge outcomes.
- **Top-N leaderboard badges (BADGE-013..016) are awarded from finalized weekly rank only.** A temporary in-week rank never earns the badge. The scheduled job runs after the Monday 00:00 WIB boundary, computes the previous completed week, and awards each badge at most once per Student.
- **Top-N leaderboard badges cascade by final rank.** Rank 1 earns Top 1, Top 3, Top 5, and Top 10 if missing; rank 4 earns Top 5 and Top 10 if missing. Each newly earned Badge grants its configured one-time reward EXP.
- **Top-N leaderboard badges do not grant permanent EXP bonuses.** They grant one-time reward EXP only unless the Badge catalog explicitly changes later.
- **Repeat Top-N finishes only grant missing Badges.** A Student who already owns a broader Top-N Badge does not receive that Badge or its reward EXP again when later earning a narrower rank.
- **Weekly leaderboard rank uses deterministic tiebreakers.** Sort by weekly EXP descending, then by the accepted submission time of the Student's last EXP-earning Attempt for that week, then by stable Student id. Equal EXP never expands a Top-N badge cutoff beyond N Students.
- **Weekly leaderboard requires a minimum participant threshold** (admin-configurable, default 10 ranked Students) to award Top-N badges. A ranked Student has ≥1 EXP earned that week. Below threshold, leaderboard still displays as a ranking but no badges are granted.
- **Only students with ≥1 EXP earned that week are ranked.** Zero-activity students are excluded from the leaderboard view and rank counts.
- **Zero-EXP Attempts do not affect weekly leaderboard competition.** They do not count toward participant threshold, weekly EXP, or tiebreaker timing.
- **Leaderboard page defaults to the live current week.** Previous finalized weeks are available as history so Students and Admins can inspect past ranks and Badge outcomes.
- **Active-week leaderboard copy must not promise Top-N Badge awards.** It may show current rank and explain the finalized-week requirement, but "earned" language is reserved for finalized awards.
- **Badge reward EXP does not affect the finalized leaderboard that produced it.** Weekly leaderboard rank is based on bonus-adjusted Try-out Attempt EXP for that week; badge reward EXP affects lifetime EXP/Level after award but never reorders the completed week.
- **Attempt EXP and Badge reward EXP are distinct EXP sources.** Lifetime EXP/Level includes both sources, but weekly leaderboard competition includes only Attempt EXP.
- **Weekly leaderboard finalization is idempotent.** Re-running finalization for the same week may fill missing Top-N badge awards, but must never duplicate a Student's Badge or badge reward EXP.
- **A finalized weekly snapshot is the source of truth for that week.** If no snapshot exists, repair may create one from eligible Attempts; once the snapshot exists, reruns use it to fill missing awards and must not recalculate ranks.
- **Late accepted Attempts do not reopen finalized leaderboard weeks.** Once a week is finalized for Top-N badge awards, later accepted submissions cannot change that week's badge outcome.
- **Finalized weekly leaderboards are snapshotted.** The system keeps the full ranked Student set, finalized rank, counted EXP, participant threshold result, and badge award outcome for auditability. UI display limits do not limit the snapshot.
- **Below-threshold weeks are still snapshotted.** If the participant threshold is not met, the finalized week records ranks and the no-award outcome.
- **Zero-activity weeks finalize as empty snapshots.** A week with no ranked Students is still recorded as finalized so it is not mistaken for a failed or missing job.
- **All Badges open a detail modal.** Locked Badges use the modal to preview their name, icon, requirement, current progress, and EXP reward so Badge goals are transparent rather than secret. Unlocked Badges use the same modal to explain what the Student earned and why.
- **Top-N Badge details show current standing, not unlock progress.** During an active week they may show the Student's live rank and the finalized-week requirement, but the Badge remains locked until weekly finalization awards it.
- **Badge detail modal CTAs are contextual.** A Badge detail modal may link Students to the relevant surface only when the path is obvious and non-misleading, such as Try-out practice for progress, streak, score, and level Badges, or Leaderboard for weekly rank Badges.
- **Badge evaluation has separate cadences by rule type.** Continuous eligibility badges may be evaluated daily; Top-N leaderboard badges are evaluated only by weekly leaderboard finalization after the week closes.
- **Asynchronous badge awards get a one-time return-session celebration.** If a Badge is awarded while the Student is offline, the next student session shows the earned Badge once; after dismissal it remains only in the Badge collection/profile.
- **Admin weekly leaderboard reruns are repair-only.** Admins may rerun finalization for a past week to fill missing awards, but reruns use the finalized snapshot rules, do not reopen late submissions, and must not duplicate rewards.
- **Weekly participant threshold is frozen at finalization.** The threshold value used for a finalized week is stored with the snapshot; later admin setting changes apply only to future unfinalized weeks.
- **Suspended Students are excluded from leaderboard finalization.** A Student suspended before finalization is not ranked for that finalized week, does not count toward the participant threshold, and cannot receive Top-N badge awards.
- **Deleted Students are excluded from leaderboard finalization.** A Student deleted before finalization is not ranked for that finalized week and cannot receive new Badge awards.
- **Admin accounts are excluded from student leaderboard finalization.** Admin testing activity must not consume student rank slots, count toward participant thresholds, or earn student engagement rewards.
- **Admin impersonation activity is excluded from student competition.** Attempts submitted during Admin impersonation must not contribute to leaderboard EXP, participant thresholds, or Badge awards.
- **Live and finalized leaderboards use the same competition eligibility rules.** Suspended Students, deleted Students, Admin accounts, and Admin impersonation activity are excluded from both live rank display and weekly finalization.

## Relationships

- A **Try-out** has many **Attempts**
- An **Attempt** belongs to one **Student** and one **Try-out**
- A **Category** has many **Sub-categories**
- A **Question** belongs to exactly one `(Category, Sub-category)` pair

## Flagged ambiguities

- "Try-out", "CBT", and "exercise" were used interchangeably across the updated proposal and Phase 0 PRD — resolved: they refer to the same entity. Canonical UI term is **Try-out**; "CBT" acceptable in internal/admin docs; "exercise" should not be used. If an untimed practice mode is later needed, it will be a `mode` flag on Try-out, not a new entity.
- Phase 0 prototype PRD shows "Hearts, Streak, Gems, XP" in the student top bar, but the updated proposal never mentions Hearts or Gems — resolved: Hearts and Gems are out of scope. Student top bar is **Streak, EXP, Level** only. Any heart/gem UI must be removed from the prototype before design review.
- Section 7 header schema shows 2 category levels while the example text ("Klinis > Kardiovaskular > Hipertensi") reads as 3 — resolved: **2 levels only**. The example is illustrative; "Kardiovaskular - Hipertensi" is one sub-category string.
