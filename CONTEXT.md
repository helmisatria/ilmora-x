# IlmoraX

Web-based pharmacy exam prep platform. Students take timed assessments (CBT), track progress, and compete on leaderboards. Admins manage content, users, and engagement features.

## Language

**Try-out**:
A timed assessment of questions that a student takes in one or more attempts. Canonical term in user-facing UI (Bahasa).
_Avoid_: CBT (internal/admin docs only), exercise (do not use)

**Attempt**:
A single start-to-finish session of a **Try-out**, from first click of "Mulai" to submit or timer expiry. Autosave resumes the same Attempt after a disconnect or refresh. A retake creates a **new** Attempt.
_Avoid_: Session, try, run

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

**Engagement surface**:
The complete set of gamification concepts in scope: **EXP**, **Level** (1–50), **Badge**, **Streak** (daily Try-out consecutive days), **Leaderboard**. Hearts (lives) and Gems (currency) are **out of scope** and must not appear in the prototype top bar.

**Coupon**:
An admin-created discount code redeemable at checkout during a validity window (`start_time`, `end_time`). Each **Student** may redeem a given Coupon at most once. Admin may additionally set a `max_total_uses` cap (≥1) on the Coupon itself — setting it to `1` produces a first-come-first-served single-claim code; leaving it unset allows unlimited redemptions across students within the validity window. A Coupon has an explicit product scope so it cannot accidentally apply to the wrong paid product type.
_Avoid_: Promo, voucher, discount code

## Rules (payment)

- **Coupon redemption is per-Student.** Unique constraint `(coupon_id, student_id)` on the redemption ledger. A Student cannot redeem the same Coupon twice even if the global `max_total_uses` hasn't been reached.
- **Referral discounts are out of scope for now.** Students may still have referral codes in profile for future use, but checkout does not validate or advertise referral discounts.
- **Checkout accepts at most one Coupon.** Single input field labeled "Kode Kupon". Stacking is explicitly disallowed.
- **Coupon scope is product-aware.** Admin chooses whether a Coupon applies to Premium Membership, Lifetime Try-out Purchase, Materi, or all paid products.

## Language (Live Poll)

**Poll**:
An admin-created A/B/C/D/E vote with a short-lived join code, used in offline class to gauge student understanding. Lifecycle: `draft → open → closed`. Closed polls are read-only; no re-open. Separate from the Try-out engagement surface — participation grants no EXP.
_Avoid_: Quiz, survey, vote

**Poll code**:
A 6-digit numeric code unique **among currently-open Polls only**. Reuseable after the Poll closes.

## Rules (Poll)

- **Join is per-poll configurable** between "login required" and "open guest." Default: open guest (matches offline-class workflow). Guest join collects display name only.
- **Timer is optional** — admin picks time-boxed (auto-close on 0) or manual close.
- **Votes are locked on submit** — students cannot change their answer while the Poll is open.
- **Students see no results until Poll closes.** Admin sees live vote counts during `open` state.
- **Live count updates via HTTP polling at 3s interval** (not WebSockets) for M3. Revisit if scale demands.

## Rules (Try-out autosave)

- **Server-first persistence, localStorage fallback.** Server is the source of truth; localStorage buffers state when offline and syncs on reconnect.
- **Saves are triggered by answer-change (debounced ~500ms) + tab events** (blur, visibilitychange, beforeunload). No periodic timer saves.
- **Persisted state per in-progress Attempt**: `{answers: {[qid]: choice}, marked: [qid…], last_question_index}`. Nothing else.
- **Only one active Attempt session per Student.** Opening the Attempt on a second device invalidates the first; the losing client shows a kick-out modal.
- **On submit: flush local queue first, then submit.** If offline at submit time, queue and retry on reconnect. If the wall-clock deadline elapses while offline, the server auto-submits with the last-synced state.
- **"Auto-saved at HH:MM" UI shows last server-confirmed save**, not last local save. Avoids false reassurance.

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
- **Badge counts of "Complete N CBT" use unique Try-outs completed**, not total Attempts. Prevents farming BADGE-022/023/024 by retaking a short Try-out.
- **Permanent EXP bonus: only the highest tier applies.** A student at level 46 with BADGE-004..011 all earned gets a single +40% multiplier (from BADGE-011), not additive stacking. Applies to EXP earned after the badge is awarded only; never retroactive.
- **Leaderboard is weekly and EXP-earned-that-week only.** Week = Monday 00:00 → Sunday 23:59 WIB (UTC+7). Reset occurs Monday 00:00 WIB via scheduled job. Week keys stored as `YYYY-Www`.
- **Top-N leaderboard badges (BADGE-013..016) are one-time per student**, never re-awarded. Matches the "Level Badge" category convention.
- **Weekly leaderboard requires a minimum participant threshold** (admin-configurable, default 10 active students) to award Top-N badges. Below threshold, leaderboard still displays as a ranking but no badges are granted.
- **Only students with ≥1 EXP earned that week are ranked.** Zero-activity students are excluded from the leaderboard view and rank counts.

## Relationships

- A **Try-out** has many **Attempts**
- An **Attempt** belongs to one **Student** and one **Try-out**
- A **Category** has many **Sub-categories**
- A **Question** belongs to exactly one `(Category, Sub-category)` pair

## Flagged ambiguities

- "Try-out", "CBT", and "exercise" were used interchangeably across the updated proposal and Phase 0 PRD — resolved: they refer to the same entity. Canonical UI term is **Try-out**; "CBT" acceptable in internal/admin docs; "exercise" should not be used. If an untimed practice mode is later needed, it will be a `mode` flag on Try-out, not a new entity.
- Phase 0 prototype PRD shows "Hearts, Streak, Gems, XP" in the student top bar, but the updated proposal never mentions Hearts or Gems — resolved: Hearts and Gems are out of scope. Student top bar is **Streak, EXP, Level** only. Any heart/gem UI must be removed from the prototype before design review.
- Section 7 header schema shows 2 category levels while the example text ("Klinis > Kardiovaskular > Hipertensi") reads as 3 — resolved: **2 levels only**. The example is illustrative; "Kardiovaskular - Hipertensi" is one sub-category string.
