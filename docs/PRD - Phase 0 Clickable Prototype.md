# PRD — Phase 0: Clickable Prototype

**Project:** IlmoraX  
**Date:** 19 April 2026  
**Milestone:** Phase 0 — Design / Clickable Prototype  
**Timeline:** 1–2 minggu  
**Deliverables:** Flow utama aplikasi, struktur halaman utama, clickable prototype, review arah UI/UX

> **Canonical domain reference:** [CONTEXT.md](../CONTEXT.md) holds the resolved vocabulary, rules, and relationships for IlmoraX. Where this PRD and CONTEXT.md disagree, CONTEXT.md wins. Update CONTEXT.md alongside any scope change.

---

## 1. Tujuan Phase 0

Membangun **clickable prototype** seluruh flow utama IlmoraX sebagai web app responsif, mencakup:

- Semua halaman student dan admin
- Navigasi dan flow antar halaman yang dapat diklik
- Mock data yang merepresentasikan data real
- Premium vs free state toggle untuk demo
- 2× design review sebelum lanjut ke Milestone 1

**Perubahan besar setelah approval design dianggap change request.**

---

## 2. Brand & Visual Identity

| Item          | Detail                                                                     |
| ------------- | -------------------------------------------------------------------------- |
| Nama platform | **IlmoraX**                                                                |
| Logo          | Ilmora Logo (sudah disediakan client)                                      |
| Primary color | Teal/green (existing `#14b8a6`)                                            |
| Font          | Inter (body) + Poppins (heading)                                           |
| Tone          | Joyful, playful, not-too-formal — feels closer to Duolingo than a textbook |
| Responsive    | Mobile-first, responsive hingga desktop                                    |

---

## 2.5 Design Principles & Motion

**Joyful UI, exam-faithful flow.** Visuals and motion aim for a Duolingo-like playful feel (bright color, saturated accents, bold rounded shapes, celebratory motion). But the Try-out experience itself mirrors formal exams (UKAI and similar) so students rehearse under authentic conditions. Any micro-interaction that reduces exam fidelity is cut.

**Celebration lives around the exam, not inside it.** No mid-Attempt feedback (no per-question right/wrong reveal during a test, no confetti on correct answer mid-test). Celebration moments fire at boundaries:

| Moment                            | Motion intent                                               |
| --------------------------------- | ----------------------------------------------------------- |
| Try-out submit → result reveal    | Animated score count-up, confetti on pass, XP tick          |
| Level-up                          | Full-screen modal, bouncy badge entrance, tier label reveal |
| Badge earned                      | Badge flyout + toast, with EXP count increment              |
| Streak active                     | Fire icon pulse on dashboard top bar                        |
| Streak milestone (3/7/14/30 days) | Celebration modal                                           |
| Leaderboard rank change           | Smooth row reorder, rank-up/down indicator                  |
| Button / card tap                 | Gentle press-bounce                                         |
| Empty states                      | Friendly illustration, not "no data" text                   |

**Out of scope:** Hearts (lives), Gems (currency), sound effects, haptic feedback. Hearts and Gems are not re-introduced via "Duolingo-like" framing — the feel comes from motion/color/type, not gamification props.

**Prototype requirement:** Phase 0 prototype is clickable, not yet fully animated. Each boundary celebration listed above is **annotated** in the prototype (arrow callout, note, or Figma interaction label) so design review approves motion intent alongside layout. Implementation lands during M1.

---

## 3. Arsitektur Prototype

### 3.1 Tech Stack

| Layer            | Teknologi                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| Framework        | TanStack Start (React)                                                                             |
| Routing          | TanStack Router (file-based)                                                                       |
| Styling          | Tailwind CSS v4                                                                                    |
| State management | Local state (hardcoded mock data)                                                                  |
| Data layer       | Mock data module (`src/data/`)                                                                     |
| Auth (target)    | **better-auth** with Google OAuth; admin access gated by a whitelist (DB-backed, env-bootstrapped) |
| Auth (prototype) | Simulasi Google login (mock redirect); admin whitelist simulated via a flag on the mock user       |
| Prototype toggle | URL param atau context untuk switch premium/free                                                   |

### 3.2 Layout System

Dua layout utama:

**Student Layout** (`/` prefix)

- Top bar: **Streak (fire icon + count), EXP, Level badge**. No Hearts, no Gems.
- Bottom nav: Belajar (Home), Tryout, Peringkat (Leaderboard), Lencana (Badges)
- Content area di tengah

**Admin Layout** (`/admin` prefix)

- Same Google sign-in as students (no separate login form). Admin middleware re-checks whitelist per request.
- Sidebar navigation
- Top bar dengan user info dan logout
- Content area yang lebih luas (dashboard style)

### 3.3 Route Structure

```
/                          → Landing page
/auth/login                → Login screen (mock Google OAuth)
/auth/complete-profile     → Mandatory profile completion
/dashboard                 → Student dashboard (home)
/tryout                    → Try-out list
/tryout/$id                → Try-out taking screen (CBT is an internal alias)
/results/$attemptId        → Result review (score, pembahasan)
/results/$attemptId/review → Detailed answer review per question
/progress                  → My Progress (score history, attempt history)
/evaluation                → Personalized Evaluation Dashboard (premium-gated)
/leaderboard               → Leaderboard
/badges                    → Badges overview
/profile                   → User profile + badge display
/profile/$userId            → Public profile (see other user's badges)
/poll/join                 → Live Vote join screen
/poll/$code                → Active poll (voting + results)
/coming-soon               → Generic Coming Soon / TBA page
/premium                   → Premium access info & purchase flow (mock)
/checkout                  → Checkout flow with coupon (mock)

/admin                     → Admin dashboard (entry via same Google sign-in; whitelist-gated)
/admin/admins               → Admin whitelist management (super-admin only)
/admin/questions            → Question management
/admin/questions/new        → Create/edit question
/admin/questions/upload     → Upload via Excel
/admin/categories           → Category & sub-category management
/admin/materi               → Materi management
/admin/materi/new           → Create/edit materi
/admin/users                → User management
/admin/users/$id            → User detail & evaluation dashboard
/admin/insights             → Users Insights analytics
/admin/coupons              → Coupon management
/admin/coupons/new          → Create coupon
/admin/packages             → Package / pricing management
/admin/moderation           → Question moderation (reports)
/admin/polls                → Live Poll management
/admin/polls/new            → Create new poll
/admin/polls/$id            → Poll detail & results
/admin/badges               → Badge management
/admin/leaderboard          → Leaderboard management
```

---

## 4. Student-Side Pages

### 4.1 Landing Page (`/`)

**Tujuan:** Halaman publik pertama yang dilihat user.

| Elemen             | Detail                                                  |
| ------------------ | ------------------------------------------------------- |
| Branding           | Nama "IlmoraX", logo, tagline                           |
| Hero section       | Deskripsi singkat platform + CTA "Mulai Belajar"        |
| Features highlight | Try-out, materi, evaluation, leaderboard, badge         |
| Stats section      | Jumlah user, soal, tingkat lulus (mock)                 |
| Pricing preview    | Paket Gratis vs Premium (ringkasan)                     |
| CTA                | "Masuk dengan Google"                                   |
| Login redirect     | → Google OAuth mock → profile completion atau dashboard |

### 4.2 Auth Flow

#### 4.2.1 Login (`/auth/login`)

| Elemen      | Detail                                                |
| ----------- | ----------------------------------------------------- |
| Primary CTA | "Masuk dengan Google" (mock OAuth redirect)           |
| Branding    | IlmoraX logo                                          |
| Redirect    | Jika profile belum lengkap → `/auth/complete-profile` |
| Redirect    | Jika profile sudah lengkap → `/dashboard`             |

#### 4.2.2 Profile Completion (`/auth/complete-profile`)

| Elemen             | Detail                                                            |
| ------------------ | ----------------------------------------------------------------- |
| Mandatory fields   | Nama lengkap, institusi (dropdown dari reference list)            |
| Optional fields    | Nomor telepon, foto profil                                        |
| Institusi dropdown | Source dari `IlmoraX - Structured Reference.md` Institution Codes |
| Completion gate    | User tidak bisa masuk dashboard tanpa complete profile            |
| UX                 | Step-by-step form, progress indicator                             |

### 4.3 Dashboard / Home (`/dashboard`)

**Tujuan:** Hub utama student — akses cepat ke semua fitur.

| Section             | Detail                                                              |
| ------------------- | ------------------------------------------------------------------- |
| Top bar             | Streak, EXP, Level                                                  |
| Welcome card        | Greeting + streak fire indicator                                    |
| Quick actions       | "Lanjut Belajar" (last test), "Mulai Tryout Baru"                   |
| My Progress summary | Mini summary: total soal dikerjakan, skor terakhir, level progress  |
| Tryout cards        | 3-4 latest/popular try-outs dengan category tag                     |
| Evaluation snippet  | Card menuju Evaluation Dashboard (premium-gated preview jika free)  |
| Coming Soon cards   | Drilling/Games, Store, Affiliate Program → link ke Coming Soon page |
| Bottom nav          | Belajar, Tryout, Peringkat, Lencana                                 |

### 4.4 Try-out List (`/tryout`)

| Elemen           | Detail                                                |
| ---------------- | ----------------------------------------------------- |
| Filter           | By category, by free/premium                          |
| Card info        | Judul, icon, jumlah soal, category tag, skor terakhir |
| Lock indicator   | 🔒 Premium untuk tryout yang terkunci                 |
| Retake indicator | Badge "Sudah dikerjakan X kali"                       |
| CTA per card     | "Mulai" atau "Lanjut" jika ada session autosave       |

### 4.5 Try-out Taking Screen (`/tryout/$id`)

> Canonical term is **Try-out** (see [CONTEXT.md](../CONTEXT.md)). "CBT" is an internal alias only.

| Elemen              | Detail                                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Timer               | Countdown; **wall-clock continues through disconnect** (server-side deadline). Student sees remaining time sync on reconnect.                                                   |
| Question display    | Nomor soal, subject tag, teks soal, opsi A-E. Content is the Attempt's snapshot — mid-Attempt admin edits don't affect this Attempt.                                            |
| Navigation          | Prev/Next, question number grid                                                                                                                                                 |
| Mark question       | Flag/bookmark soal untuk review                                                                                                                                                 |
| Report question     | Tombol "Laporkan soal" → modal form with categorized reason (answer key salah / pembahasan keliru / soal tidak jelas / typo / lainnya) + optional note                          |
| Autosave indicator  | "Tersimpan pukul HH:MM" — shows **last server-confirmed** save, not last local save                                                                                             |
| Autosave mechanism  | Server-first persistence + localStorage fallback; debounced save on answer change (~500ms) plus tab blur/visibilitychange/beforeunload. No mid-Attempt feedback on correctness. |
| Single-session lock | Opening the same in-progress Attempt on a second device invalidates the first with a kick-out modal                                                                             |
| Premium lock        | Jika Try-out atau soal premium dan user free → upgrade prompt                                                                                                                   |
| Submit              | Confirm modal → flush local queue → result page. If offline at submit, queue and retry on reconnect; if deadline elapses offline, server auto-submits last-synced state.        |

### 4.6 Result Review (`/results/$attemptId`)

| Elemen             | Detail                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Celebration reveal | Animated score count-up; confetti if pass threshold hit. This is a boundary celebration — the ONLY in-flow celebration allowed (no mid-test confetti).        |
| Score summary      | Skor, benar/salah, total, waktu pengerjaan                                                                                                                    |
| XP earned          | EXP yang didapat dari attempt ini + badge earned notification. First Attempt of a Try-out grants full EXP; subsequent Attempts grant ~25% (retake reduction). |
| Answer list        | List semua soal dengan benar/salah indicator                                                                                                                  |
| Pembahasan button  | Per soal → lihat explanation                                                                                                                                  |
| Re-take button     | "Coba Lagi" → mulai Attempt baru (new Attempt row)                                                                                                            |
| Back to list       | Kembali ke try-out list                                                                                                                                       |

### 4.7 Result Detail / Pembahasan (`/results/$attemptId/review`)

| Elemen                | Detail                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Full question display | Soal + semua opsi (from Attempt snapshot — frozen at Attempt start)                      |
| User answer highlight | Jawaban user (benar salah)                                                               |
| Correct answer        | Highlight jawaban benar                                                                  |
| Explanation           | Full pembahasan text                                                                     |
| Video explanation     | **Unlisted YouTube** embed only. Available to premium users.                             |
| Related Materi        | (M2, premium) For wrong answers, surface Materi with matching `(Category, Sub-category)` |

### 4.8 My Progress (`/progress`)

**Tujuan:** Riwayat belajar dan progress student.

| Section                 | Detail                                                            |
| ----------------------- | ----------------------------------------------------------------- |
| Overview stats          | Total soal dikerjakan, total benar, total salah, persentase benar |
| Recent tests            | 5 test terakhir dengan skor dan tanggal                           |
| Attempt history         | List semua attempt dengan filter by tryout                        |
| Level progress bar      | Current level → next level, XP progress                           |
| Category breakdown mini | Mini chart per category (basic, link ke Evaluation)               |

### 4.9 Personalized Evaluation Dashboard (`/evaluation`)

**Two-tier access** — basic summary for all students (M1), breakdowns + history for premium (M2).

| Section                  | Tier         | Detail                                                            |
| ------------------------ | ------------ | ----------------------------------------------------------------- |
| Total soal dikerjakan    | Free (M1)    | Jumlah soal yang sudah dijawab                                    |
| Jawaban benar            | Free (M1)    | Total jawaban benar                                               |
| Jawaban salah            | Free (M1)    | Total jawaban salah                                               |
| Persentase benar         | Free (M1)    | Persentase benar dari total dikerjakan                            |
| Persentase salah         | Free (M1)    | Persentase salah dari total dikerjakan                            |
| Attempt list (overview)  | Free (M1)    | Simple list of Attempts with score + date                         |
| Category breakdown       | Premium (M2) | Tabel per kategori: soal dikerjakan, benar, salah, persentase     |
| Sub-category breakdown   | Premium (M2) | Tabel per sub-kategori: soal dikerjakan, benar, salah, persentase |
| Attempt history (detail) | Premium (M2) | Filter by Try-out, compare Attempts                               |
| Visual charts            | Premium (M2) | Bar chart per kategori, progress bar per sub-kategori             |

Free users see the full layout with premium sections blurred and a CTA to upgrade. Admin sees the full dashboard (including breakdowns and charts) for any student from M1.

**Contoh struktur kategori:**
| Kategori | Sub Kategori | Soal Dikerjakan | Benar | Salah | Persentase |
|----------|-------------|----------------|-------|-------|------------|
| Klinis | Kardiovaskular — Hipertensi | 40 | 30 | 10 | 75% |
| Klinis | Kardiovaskular — Gagal Jantung | 25 | 18 | 7 | 72% |
| Farmakologi | Antibiotik | 30 | 21 | 9 | 70% |

### 4.10 Leaderboard (`/leaderboard`)

| Elemen                | Detail                                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Period                | **Current week only** (Mon 00:00 → Sun 23:59 WIB). Ranking is based on EXP earned this week; lifetime EXP is not a ranking surface. |
| Reset indicator       | "Reset setiap Senin 00:00 WIB"                                                                                                      |
| Ranked set            | Only students with **≥ 1 EXP earned this week** appear. Zero-activity students are excluded.                                        |
| Participant threshold | Admin-configurable minimum (default 10). If not met, leaderboard is shown but Top-N badges are **not awarded** that week.           |
| Top 3 podium          | Highlight rank 1, 2, 3 dengan avatar                                                                                                |
| List                  | Rank, nama, level, weekly EXP, change indicator (↑↓)                                                                                |
| User card             | Highlight baris user sendiri                                                                                                        |
| Level display         | Grade label per user (e.g., "Pharmacy Practitioner II")                                                                             |
| Rank change animation | Boundary-safe celebration — smooth row reorder on rank improvement                                                                  |

### 4.11 Badges (`/badges`)

| Elemen             | Detail                                                           |
| ------------------ | ---------------------------------------------------------------- |
| Badge grid         | Visual grid dengan icon semua 26 supported badges                |
| Badge card         | Icon, nama, deskripsi task, EXP reward, status (unlocked/locked) |
| Progress indicator | Untuk badge yang belum unlocked — progress bar (e.g., 3/5 CBT)   |
| Filter             | By category: General, Level, Streak, Prestige                    |
| Badge detail modal | Klik badge → detail lengkap + EXP bonus                          |

**26 Badges yang Supported** (IDs run 1–27 with #21 "Never Skip" deferred — see §13):

| #   | Badge                       | Category | Task                                        | EXP  |
| --- | --------------------------- | -------- | ------------------------------------------- | ---- |
| 1   | First Steps                 | General  | Complete your first test                    | 10   |
| 2   | Pharmacy Novice Badge       | Level    | Reach Level 3                               | 60   |
| 3   | Pharmacy Trainee Badge      | Level    | Reach Level 6                               | 90   |
| 4   | Pharmacy Practitioner Badge | Level    | Reach Level 11                              | 140  |
| 5   | Pharmacy Professional Badge | Level    | Reach Level 16                              | 200  |
| 6   | Pharmacy Specialist Badge   | Level    | Reach Level 21                              | 275  |
| 7   | Pharmacy Expert Badge       | Level    | Reach Level 26                              | —    |
| 8   | Pharmacy Consultant Badge   | Level    | Reach Level 31                              | —    |
| 9   | Pharmacy Master Badge       | Level    | Reach Level 36                              | —    |
| 10  | Pharmacy Grand-Master Badge | Level    | Reach Level 41                              | —    |
| 11  | Pharmacy Authority Badge    | Level    | Reach Level 46                              | —    |
| 12  | Pharmacy Legendary Badge    | Level    | Reach Level 50                              | —    |
| 13  | Top 10                      | Level    | Reach top 10 leaderboard                    | 200  |
| 14  | Top 5                       | Level    | Reach top 5 leaderboard                     | 500  |
| 15  | Top 3                       | Level    | Reach top 3 leaderboard                     | 750  |
| 16  | Top 1                       | Level    | Reach top 1 leaderboard                     | 1000 |
| 17  | 3-Days Streak               | Streak   | Complete CBT every day for 3 days           | 300  |
| 18  | 7-Days Streak               | Streak   | Complete CBT every day for 7 days           | 700  |
| 19  | 14-Days Streak              | Streak   | Complete CBT every day for 14 days          | 1500 |
| 20  | 30-Days Warrior             | Streak   | Complete CBT every day for 30 days          | 2000 |
| 22  | Dedicated                   | Streak   | Complete 15 CBT                             | 1000 |
| 23  | Master                      | Streak   | Complete 50 CBT                             | 5000 |
| 24  | Legendary                   | Streak   | Complete 100 CBT                            | 7500 |
| 25  | Speed Runner                | Streak   | Finish CBT under time limit with >80% score | 1000 |
| 26  | Fail Legend                 | Prestige | Reach 5x fail                               | 1000 |
| 27  | 100% Club                   | Prestige | Reach 100% Score                            | 5000 |

**Badge rules (see [CONTEXT.md](../CONTEXT.md)):**

- "Complete N CBT" badges (22/23/24) count **unique Try-outs completed**, not total Attempts. Retakes of the same Try-out do not farm the counter.
- Top-N leaderboard badges (13–16) are **one-time per student**; never re-awarded on subsequent qualifying weeks.
- Level badges 4–11 grant a permanent EXP % bonus. **Only the highest tier applies** — no stacking. Active bonus shown on profile.
- Bonuses apply to EXP earned after the badge is awarded; never retroactive.

### 4.12 Profile (`/profile`)

| Elemen              | Detail                                   |
| ------------------- | ---------------------------------------- |
| Avatar              | User avatar/icon                         |
| Name                | Nama lengkap                             |
| Institution         | Nama institusi                           |
| Level & EXP         | Level badge + progress bar ke next level |
| Stats summary       | Total soal, total tryout, streak         |
| Badge showcase      | Grid badge yang sudah unlocked           |
| Premium badge label | "Premium" jika premium user              |

### 4.13 Public Profile (`/profile/$userId`)

| Elemen          | Detail                                        |
| --------------- | --------------------------------------------- |
| Same as profile | Tapi untuk user lain                          |
| Badge display   | Admin atau user lain bisa lihat badge student |
| No edit         | Read-only                                     |

### 4.14 Live Vote / Poll — Student (`/poll/join`, `/poll/$code`)

#### Join Screen (`/poll/join`)

| Elemen             | Detail                                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Join code input    | 6-digit numeric code from admin                                                                                              |
| Display name input | Shown only when the poll is configured as "open guest" (default). Login-required polls use the student's authenticated name. |
| CTA                | "Gabung Poll"                                                                                                                |

#### Active Poll (`/poll/$code`)

| State     | Detail                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| Waiting   | Menunggu admin membuka poll — "Menunggu poll dimulai..."                                                           |
| Active    | Pilihan A/B/C/D/E ditampilkan; timer is **optional** (admin may create a time-boxed poll or leave it manual-close) |
| Submitted | Jawaban terkirim dan **terkunci** — students cannot change their vote. "Menunggu hasil..."                         |
| Results   | Setelah admin menutup: jumlah dan persentase per opsi                                                              |

**Poll rules:** Live count updates via HTTP polling at 3s interval (no WebSockets in M3). Participation grants no EXP — polls are a classroom tool, not an engagement loop.

### 4.15 Coming Soon (`/coming-soon`)

| Elemen       | Detail                                                            |
| ------------ | ----------------------------------------------------------------- |
| Feature name | Dynamic berdasarkan query param: Drilling/Games, Store, Affiliate |
| Description  | "Fitur ini sedang dalam pengembangan. Stay tuned!"                |
| CTA          | "Kembali ke Dashboard"                                            |
| Visual       | Illustration/icon sesuai feature                                  |

### 4.16 Premium Access Info (`/premium`)

| Elemen             | Detail                                                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feature comparison | Free vs Premium feature table                                                                                                                                     |
| Pricing            | Single tier "Premium" with time-boxed Packages (e.g. 1 bulan / 6 bulan / 1 tahun). Package prices TBD by client. One-time charge per Package — **no auto-renew**. |
| CTA                | "Berlangganan Sekarang" → checkout                                                                                                                                |

### 4.17 Checkout (`/checkout`)

| Elemen            | Detail                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Order summary     | Package name, harga, durasi                                                                                                                |
| Discount input    | **Single field** labeled "Kode promo / referral". Accepts a Coupon code OR a referral code, not both. Stacking disallowed.                 |
| Referral behavior | Referee-only discount. Validated: code exists, referrer's email ≠ referee's email, referee has not used a referral discount before.        |
| Total             | Harga setelah diskon                                                                                                                       |
| Payment method    | Mock payment gateway (Xendit/Midtrans mock)                                                                                                |
| CTA               | "Bayar Sekarang" → mock success → dashboard                                                                                                |
| Post-purchase     | Creates an **Entitlement** for the Student. If an Entitlement already exists, the new duration **extends** `ends_at` instead of replacing. |

---

## 5. Admin-Side Pages

### 5.1 Admin Access (no separate login page)

Admins use the same Google sign-in as students. There is no `/admin/auth/login` route, no email+password form, and no admin-specific OAuth flow.

| Item               | Detail                                                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Auth library       | **better-auth** — handles Google OAuth, sessions, middleware                                                                        |
| Access gate        | Whitelist table (DB-backed); bootstrapped from `ADMIN_EMAILS` env var on first deploy only. Changes thereafter via the CMS (§5.19). |
| Per-request check  | Middleware on every `/admin/*` request re-reads the whitelist. Removing an email from the whitelist revokes access immediately.     |
| Profile completion | Whitelisted admins **skip** the mandatory profile completion step and land on `/admin` directly.                                    |
| Tiers              | `admin` (full CMS) and `super_admin` (can modify the whitelist). Initial env-bootstrapped admins are super_admin.                   |

### 5.2 Admin Dashboard (`/admin`)

| Section          | Detail                                                     |
| ---------------- | ---------------------------------------------------------- |
| Overview stats   | Total users, new users (period), premium users, free users |
| Activity         | Recent activity feed (new signups, test completions, etc.) |
| Quick links      | Manage questions, users, polls, coupons                    |
| Try-out activity | Jumlah attempt/test dikerjakan                             |
| Average score    | Rata-rata skor dari attempt yang selesai                   |

### 5.3 Question Management (`/admin/questions`)

| Elemen        | Detail                                                         |
| ------------- | -------------------------------------------------------------- |
| Question list | Paginated list dengan search & filter                          |
| Filter        | By category, sub-category, premium/free, published/unpublished |
| Search        | By question text                                               |
| Actions       | Create, Edit, Publish/Unpublish, Delete                        |
| Upload Excel  | Button → upload form (mock)                                    |

### 5.4 Question Create/Edit (`/admin/questions/new`, `/admin/questions/$id`)

| Field          | Detail                           |
| -------------- | -------------------------------- |
| Question text  | Rich text / textarea             |
| Options A-E    | Text input per opsi              |
| Correct answer | Radio select                     |
| Category       | Dropdown dari category list      |
| Sub-category   | Dropdown (dependent on category) |
| Explanation    | Rich text / textarea             |
| Video URL      | Optional embed video             |
| Premium flag   | Toggle: free/premium             |
| Publish status | Toggle: published/unpublished    |

### 5.5 Category Management (`/admin/categories`)

| Elemen        | Detail                                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Category tree | **Two fixed levels only**: Kategori → Sub-kategori. No deeper nesting.                                                        |
| CRUD          | Create, edit, delete Kategori and Sub-kategori                                                                                |
| Example       | Klinis → "Kardiovaskular - Hipertensi". The " - " separator collapses what could be a third level into the Sub-kategori name. |
| Shared use    | This taxonomy is shared by both Questions and Materi — one tree, two consumers.                                               |

### 5.6 Materi Management (`/admin/materi`)

| Elemen      | Detail                                |
| ----------- | ------------------------------------- |
| Materi list | Paginated list dengan search & filter |
| Filter      | By category, free/premium             |
| Actions     | Create, Edit, Delete                  |

### 5.7 Materi Create/Edit (`/admin/materi/new`, `/admin/materi/$id`)

| Field             | Detail                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| Title             | Text input                                                                                             |
| Content           | **Markdown** editor with preview (images embedded via Markdown image syntax referencing uploaded URLs) |
| Video embed       | **Unlisted YouTube URL only** (no self-hosted video in M1/M2). Preview inline.                         |
| Attachment        | Single PDF (≤ 20 MB) stored in object storage. Mock in prototype.                                      |
| Category          | Dropdown — same `(Kategori, Sub-kategori)` tree used by Questions                                      |
| Sub-category      | Dropdown (dependent on Kategori)                                                                       |
| Free/Premium flag | Toggle — gates whole Materi as one unit                                                                |
| Versioning        | None — live edits publish immediately; students always see latest                                      |

### 5.8 User Management (`/admin/users`)

| Elemen    | Detail                                           |
| --------- | ------------------------------------------------ |
| User list | Paginated table dengan search & filter           |
| Filter    | By name, email, premium/free, institution        |
| Search    | By name or email                                 |
| Actions   | View detail, suspend/enable, grant/revoke premium Entitlement |

### 5.9 User Detail & Evaluation (`/admin/users/$id`)

| Section              | Detail                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Profile info         | Nama, email, institusi, status (active premium Entitlement? expiry date?)                                                         |
| Activity summary     | Total soal dikerjakan, total Attempt, terakhir aktif                                                                              |
| Evaluation dashboard | **Full view** (including premium breakdowns + charts) regardless of the student's own tier — admin always sees everything from M1 |
| Actions              | Suspend/enable; **grant premium Entitlement** (duration required — no "forever"); revoke Entitlement                              |

### 5.10 Users Insights (`/admin/insights`)

| Section                      | Detail                               |
| ---------------------------- | ------------------------------------ |
| Total registered users       | Angka + tren                         |
| New users                    | Dalam periode (filter: 7d, 30d, all) |
| Premium users                | Jumlah dan persentase                |
| Free users                   | Jumlah dan persentase                |
| Active users basic           | User dengan aktivitas dalam periode  |
| Try-out activity             | Jumlah attempt per periode           |
| Question activity            | Jumlah soal dijawab per periode      |
| Average score                | Rata-rata dari attempt selesai       |
| Category performance summary | Ringkasan performa per kategori      |
| Recent activity              | Activity feed terbaru                |

### 5.11 Coupon Management (`/admin/coupons`)

| Elemen      | Detail                                                                                                                                                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Coupon list | Table dengan kode, status (aktif/expired), diskon, redemption count                                                                                                                                                              |
| Actions     | Create, deactivate                                                                                                                                                                                                               |
| Create form | Kode (auto-generate or custom), discount type (% atau nominal), start time, end time, `max_total_uses` (optional cap — set to 1 for first-come-first-served single-claim code; leave empty for unlimited during validity window) |
| Rule        | Each Coupon is redeemable **at most once per Student** regardless of the global cap. Unique constraint `(coupon_id, student_id)` on the redemption ledger.                                                                       |

### 5.12 Package/Pricing Management (`/admin/packages`)

| Elemen            | Detail                                                                                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package list      | Nama, harga, durasi (days), aktif?                                                                                                                    |
| Actions           | Create, edit, activate/deactivate                                                                                                                     |
| Referral settings | Global referral discount rule (% or nominal) — applied uniformly to any referee's first purchase. Per-Package referral rules are out of scope for M2. |
| Model             | Single tier "Premium"; multiple time-boxed Packages (e.g. 1 bulan, 6 bulan, 1 tahun). No auto-renew.                                                  |

### 5.13 Question Moderation (`/admin/moderation`)

| Elemen             | Detail                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Queue view         | **Clustered by Question** — one row per reported Question with report count; drill in to see individual report messages and reasons                      |
| Reason filter      | answer key salah / pembahasan keliru / soal tidak jelas / typo / lainnya                                                                                 |
| Actions            | Dismiss, edit, unpublish, delete. Delete warns when past Attempts reference the Question (prefer unpublish in that case).                                |
| Historical scoring | **Never re-scored on edit** in M1 — past Attempts, EXP, leaderboard totals, and evaluation numbers remain frozen. Opt-in re-scoring is deferred post-M1. |
| Status             | Pending, resolved (edited/unpublished/deleted), dismissed                                                                                                |

### 5.14 Live Poll Management (`/admin/polls`)

| Elemen    | Detail                               |
| --------- | ------------------------------------ |
| Poll list | Active & past polls                  |
| Actions   | Create new, view results, close poll |

### 5.15 Create Poll (`/admin/polls/new`)

| Field     | Detail                                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| Title     | Nama poll                                                                                                            |
| Options   | Configurable: A, B, C, D, E (default 5, bisa remove)                                                                 |
| Timer     | **Optional** — admin picks time-boxed (N menit, auto-close on 0) or manual close                                     |
| Access    | Toggle: "open guest" (default, student enters display name) vs "login required" (Google-authenticated Students only) |
| Join code | Auto-generated 6-digit numeric code, unique among currently-open polls (reusable after close)                        |
| CTA       | "Buat Poll"                                                                                                          |

### 5.16 Poll Detail & Results (`/admin/polls/$id`)

| State   | Detail                                                                                                                                  |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Waiting | Menunggu student join, tampilkan join code                                                                                              |
| Active  | **Admin sees live count per option** (updated every 3s via HTTP polling). Students remain blind until close. Participant count visible. |
| Closed  | Jumlah dan persentase per opsi A-E                                                                                                      |

### 5.17 Badge Management (`/admin/badges`)

| Elemen      | Detail                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Badge list  | 26 supported badges (see [IlmoraX - Structured Reference.md](./IlmoraX%20-%20Structured%20Reference.md))                                                      |
| Actions     | View details, toggle active/inactive (mock)                                                                                                                   |
| Rule config | Basic rule display per badge. Notes: Top-N leaderboard badges are one-time per student; permanent EXP bonus applies only from the highest tier (no stacking). |

### 5.18 Leaderboard Management (`/admin/leaderboard`)

| Elemen                | Detail                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Current leaderboard   | Top users, current-week EXP view                                                         |
| Reset schedule        | Info: "Reset Senin 00:00 WIB" (automatic weekly job — no manual reset button)            |
| Participant threshold | Admin-editable minimum (default 10). If not met, Top-N badges are not awarded that week. |

### 5.19 Admin Whitelist Management (`/admin/admins`)

Super-admin-only. Lists current admins, their tier, and the email on the whitelist. Actions: add admin (email), promote to super_admin, demote, remove. Env-bootstrapped super-admins are seeded on first deploy only; all subsequent changes flow through this page.

---

## 6. Navigation & Flow Maps

### 6.1 Student Flow

```
Landing Page
  └─ Google Login → Profile Completion → Dashboard
                                      ├─ Try-out List → Try-out Taking → Result → Pembahasan
                                      ├─ My Progress
                                      ├─ Evaluation Dashboard (premium)
                                      ├─ Leaderboard
                                      ├─ Badges
                                      ├─ Profile → Badge Detail
                                      ├─ Poll Join → Active Poll
                                      ├─ Premium Info → Checkout
                                      └─ Coming Soon (Drilling/Store/Affiliate)
```

### 6.2 Admin Flow

```
Google Login (whitelist-gated) → Admin Dashboard
                                ├─ Admins (super-admin only)
                                ├─ Questions (CRUD, Upload Excel, Categories)
                                ├─ Materi (CRUD, Categories)
                                ├─ Users → User Detail (Evaluation Dashboard)
                                ├─ Insights
                                ├─ Coupons (Create, Manage)
                                ├─ Packages (Pricing, Referral)
                                ├─ Moderation (Reports — clustered per Question)
                                ├─ Polls (Create, Results)
                                ├─ Badges (View, Manage)
                                └─ Leaderboard (View participants, edit threshold)
```

---

## 7. Mock Data Requirements

Semua data di prototype menggunakan mock/hardcoded data. Berikut entity yang perlu di-mock:

### 7.1 Users (10+ mock users)

| Field             | Example                                                            |
| ----------------- | ------------------------------------------------------------------ |
| id                | 1-10+                                                              |
| name              | "Dewi Rahayu", "Budi Santoso", etc.                                |
| email             | dewi@example.com                                                   |
| institution       | UNAIR, UGM, UI, etc. (from reference list)                         |
| isAdmin           | false for students; true for ~1 mock admin user to demo admin flow |
| adminTier         | null / `admin` / `super_admin` (only when `isAdmin` = true)        |
| entitlementEndsAt | ISO date or null — source of truth for premium status              |
| level             | 1-50                                                               |
| xp                | based on level table                                               |
| weeklyXp          | EXP earned in current week (for leaderboard)                       |
| streak            | 1-30                                                               |
| badges            | subset of the 26 supported badges                                  |
| referralCode      | Short unique string (e.g. `DEWI-4F2A`)                             |
| joinDate          | recent dates                                                       |

### 7.2 Questions (20+ mock questions)

| Field         | Example                                                          |
| ------------- | ---------------------------------------------------------------- |
| id            | 1-20+                                                            |
| category      | Klinis, Farmakologi, etc. (top level)                            |
| subCategory   | "Kardiovaskular - Hipertensi" (single string, not a third level) |
| question text | MCQ text                                                         |
| options A-E   | text per option                                                  |
| correctAnswer | 0-4                                                              |
| explanation   | pembahasan text                                                  |
| videoUrl      | optional **unlisted YouTube URL**                                |
| isPremium     | true/false                                                       |
| published     | true/false                                                       |

### 7.3 Tryouts (6+ mock tryouts)

| Field         | Example                              |
| ------------- | ------------------------------------ |
| id            | 1-6                                  |
| title         | "UKAI Tryout 1", "Farmakologi", etc. |
| questionCount | 20-50                                |
| category      | Klinis, Farmakologi, etc.            |
| isPremium     | true/false                           |
| duration      | 30-60 minutes                        |

### 7.4 Attempts (per user per tryout)

| Field             | Example                                                           |
| ----------------- | ----------------------------------------------------------------- |
| id                | auto                                                              |
| userId            | reference                                                         |
| tryoutId          | reference                                                         |
| attemptNumber     | 1, 2, 3… (per user per tryout — drives retake EXP reduction)      |
| status            | `in_progress` / `submitted` / `auto_submitted` (deadline expired) |
| startedAt         | ISO datetime — drives wall-clock deadline                         |
| deadlineAt        | ISO datetime — `startedAt + duration`                             |
| score             | 0-100%                                                            |
| correct           | count                                                             |
| total             | count                                                             |
| xpEarned          | number (full on first Attempt, ~25% on retake)                    |
| completedAt       | date                                                              |
| answers           | array of `{ questionId, selected, correct }`                      |
| markedQuestionIds | array of ids flagged during the Attempt                           |

### 7.5 Leaderboard

- Weekly ranking based on EXP **earned this week** (not lifetime)
- Week boundary: Mon 00:00 → Sun 23:59 WIB
- Only students with ≥ 1 weekly EXP appear
- Rank change (up/down) indicator

### 7.6 Badges (26 supported badges as per reference)

- Badge metadata (from structured reference)
- Per-user unlock status with `awardedAt` timestamp (to enforce one-time Top-N badges)
- Progress per badge (e.g. 3/15 unique Try-outs for Dedicated)
- `activePermanentBonus` field on the student record — single integer, derived from the highest Level Badge tier earned

### 7.7 Categories & Sub-categories (two fixed levels)

```
Klinis
  ├─ Kardiovaskular - Hipertensi
  ├─ Kardiovaskular - Gagal Jantung
  └─ Respiratori - Asma
Farmakologi
  ├─ Antibiotik
  └─ NSAID
Farmasi Klinik
  ├─ Perhitungan Dosis
  └─ Interaksi Obat
```

What looks like a third level (e.g. "Hipertensi" under "Kardiovaskular") is collapsed into the Sub-kategori name with a " - " separator. The taxonomy has exactly two levels; Questions and Materi both use it.

### 7.8 Coupons (3 mock coupons)

| Code      | Discount | Start | End  | Status  |
| --------- | -------- | ----- | ---- | ------- |
| WELCOME10 | 10%      | now   | +7d  | Active  |
| ILMORAX50 | Rp50.000 | now   | +30d | Active  |
| EXPIRED01 | 5%       | -14d  | -7d  | Expired |

### 7.9 Materi (4+ mock items)

| Title             | Kategori       | Sub-kategori                | Free/Premium | Body                        |
| ----------------- | -------------- | --------------------------- | ------------ | --------------------------- |
| Farmakologi Dasar | Farmakologi    | Antibiotik                  | Free         | Markdown + unlisted YouTube |
| Kardiovaskular    | Klinis         | Kardiovaskular - Hipertensi | Premium      | Markdown + PDF attachment   |
| Antibiotik        | Farmakologi    | Antibiotik                  | Free         | Markdown only               |
| Perhitungan Dosis | Farmasi Klinik | Perhitungan Dosis           | Premium      | Markdown + unlisted YouTube |

### 7.10 Polls (2 mock polls)

| Code   | Title            | Status | Options           |
| ------ | ---------------- | ------ | ----------------- |
| ABC123 | Quiz Farmakologi | Active | A-E               |
| XYZ789 | Review Klinis    | Closed | A-E, with results |

---

## 8. Premium vs Free State Toggle

Untuk demo purposes, prototype harus bisa menunjukkan kedua state:

| Aspek                | Free User                                                                        | Premium User                                     |
| -------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------ |
| Try-out access       | Hanya Try-out free                                                               | Semua Try-out                                    |
| Materi access        | Hanya Materi free                                                                | Semua Materi                                     |
| Evaluation dashboard | Basic tier (totals + overall %) + blurred preview of breakdowns with CTA upgrade | Full access: breakdowns, charts, attempt history |
| Pembahasan video     | Hidden                                                                           | Unlisted YouTube embed visible                   |
| Related Materi links | Hidden (M2-only feature for premium)                                             | Surfaced in pembahasan (M2)                      |
| Badge                | Sama                                                                             | Sama                                             |
| Leaderboard          | Sama                                                                             | Sama                                             |
| Live Poll            | Sama                                                                             | Sama                                             |

Implementasi: URL param `?premium=true` atau toggle button di developer menu. In production the state comes from the Student's active **Entitlement** (non-expired = premium).

---

## 9. Responsive Design Spec

| Breakpoint          | Layout                                         |
| ------------------- | ---------------------------------------------- |
| Mobile (<640px)     | Single column, bottom nav, stacked cards       |
| Tablet (640-1024px) | 2-column cards, sidebar collapsible            |
| Desktop (>1024px)   | 3-column cards, sidebar always visible (admin) |

Student pages **mobile-first**. Admin pages **desktop-first** with mobile scroll fallback.

---

## 10. Design Review Checkpoints

### Review 1 - Core Flow & Layout

- [x] Student layout shell (top bar, content area, bottom nav)
- [x] Admin layout shell (sidebar, top bar, content area)
- [x] Landing page & auth flow
- [x] Dashboard
- [x] Try-out taking & result flow
- [x] Rebrand ke IlmoraX

### Review 2 - Full Feature Set

- [ ] My Progress & Evaluation Dashboard
- [ ] Leaderboard with weekly reset
- [ ] Badge system (26 badges)
- [ ] Profile page
- [ ] Live Poll (student + admin)
- [ ] All admin pages
- [ ] Premium gating toggle
- [ ] Responsive verification

---

## 11. File Structure Plan

```
src/
├── app.tsx
├── client.tsx
├── router.tsx
├── ssr.tsx
├── styles/
│   └── app.css                    # Global styles + Tailwind
├── data/
│   ├── state.ts                   # App state + mock data
│   ├── questions.ts               # Mock question bank
│   ├── users.ts                   # Mock users
│   ├── categories.ts              # Category (two fixed levels) + Sub-category
│   ├── badges.ts                  # 26 badge definitions + mock progress
│   ├── entitlements.ts            # Mock premium Entitlements (source of premium state)
│   ├── levels.ts                  # 50 level progression table
│   ├── coupons.ts                 # Mock coupons
│   ├── materi.ts                  # Mock materi
│   ├── polls.ts                   # Mock polls
│   └── institutions.ts            # Institution list from reference
├── components/
│   ├── Navigation.tsx             # TopBar + BottomNav (student)
│   ├── AdminSidebar.tsx           # Admin sidebar nav
│   ├── AdminTopBar.tsx            # Admin top bar
│   ├── PremiumDialog.tsx          # Premium upgrade dialog
│   ├── BadgeCard.tsx              # Badge display component
│   ├── ScoreCard.tsx              # Score summary component
│   ├── CategoryBreakdown.tsx      # Category performance display
│   ├── QuestionCard.tsx           # Question display for CBT
│   ├── PollOption.tsx             # Poll option button (A-E)
│   └── ProgressRing.tsx           # Circular progress indicator
├── routes/
│   ├── __root.tsx                 # Root layout
│   ├── index.tsx                  # Landing page
│   ├── auth/
│   │   ├── login.tsx              # Login screen
│   │   └── complete-profile.tsx   # Profile completion
│   ├── dashboard.tsx              # Student dashboard
│   ├── tryout.tsx                 # Tryout list
│   ├── tryout/
│   │   └── $id.tsx                # CBT taking screen
│   ├── results/
│   │   └── $attemptId.tsx         # Result review
│   │   └── $attemptId/
│   │       └── review.tsx         # Pembahasan detail
│   ├── progress.tsx               # My Progress
│   ├── evaluation.tsx             # Evaluation Dashboard
│   ├── leaderboard.tsx            # Leaderboard
│   ├── badges.tsx                 # Badges overview
│   ├── profile.tsx                # User profile
│   ├── profile/
│   │   └── $userId.tsx            # Public profile
│   ├── poll/
│   │   ├── join.tsx               # Poll join code
│   │   └── $code.tsx              # Active poll
│   ├── coming-soon.tsx            # Coming Soon / TBA
│   ├── premium.tsx                # Premium info
│   ├── checkout.tsx               # Checkout flow
│   ├── admin/
│   │   ├── index.tsx              # Admin dashboard
│   │   ├── questions.tsx          # Question list
│   │   ├── questions/
│   │   │   ├── new.tsx            # Create question
│   │   │   └── $id.tsx            # Edit question
│   │   ├── questions/
│   │   │   └── upload.tsx         # Upload Excel
│   │   ├── categories.tsx        # Category management
│   │   ├── materi.tsx            # Materi list
│   │   ├── materi/
│   │   │   ├── new.tsx            # Create materi
│   │   │   └── $id.tsx            # Edit materi
│   │   ├── users.tsx              # User management
│   │   ├── users/
│   │   │   └── $id.tsx            # User detail + evaluation
│   │   ├── insights.tsx           # Users Insights
│   │   ├── coupons.tsx            # Coupon list
│   │   ├── coupons/
│   │   │   └── new.tsx            # Create coupon
│   │   ├── packages.tsx           # Package management
│   │   ├── moderation.tsx         # Question reports
│   │   ├── polls.tsx               # Poll list
│   │   ├── polls/
│   │   │   ├── new.tsx            # Create poll
│   │   │   └── $id.tsx            # Poll detail & results
│   │   ├── badges.tsx             # Badge management
│   │   └── leaderboard.tsx        # Leaderboard management
└── utils/
    └── confetti.ts                # Existing confetti utility
```

---

## 12. Level Progression Reference

Included from `IlmoraX - Structured Reference.md`: 50 levels from "Pharmacy Newbie I" (0 XP) to "Pharmacy Legendary" (42,280 XP). This data will be hardcoded in `src/data/levels.ts`.

---

## 13. Non-Goals for Phase 0

| Tidak termasuk                               | Alasan                                                                       |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| Backend / API integration                    | Prototype only                                                               |
| Real authentication                          | Mock OAuth flow (target: better-auth + whitelist)                            |
| Real payment processing                      | Mock checkout                                                                |
| Database                                     | Hardcoded mock data                                                          |
| Push notifications                           | Out of scope                                                                 |
| Dark mode                                    | Excluded per proposal                                                        |
| Export analytics (PDF/Excel)                 | Excluded per proposal                                                        |
| Native mobile apps                           | Excluded per proposal                                                        |
| Advanced cohort/retention analytics          | Excluded per proposal                                                        |
| In-app notifications                         | Excluded per proposal                                                        |
| WhatsApp/OTP integration                     | Excluded per proposal                                                        |
| Hearts (lives) & Gems (currency)             | Dropped from updated proposal — Duolingo feel is visual-only, not mechanical |
| Mid-Attempt correctness feedback             | Breaks exam fidelity — celebration lives at boundaries only                  |
| WebSockets for Live Poll                     | M3 uses 3s HTTP polling instead                                              |
| Self-hosted video for Pembahasan / Materi    | Unlisted YouTube only in M1/M2                                               |
| Auto-renew subscriptions                     | Time-boxed Packages only; no recurring billing                               |
| Per-Attempt re-scoring on moderation edit    | Deferred post-M1 — past Attempts remain frozen                               |
| Deep category hierarchy (3+ levels)          | Fixed two levels (Kategori → Sub-kategori) for M1                            |
| Badge 21 (Never Skip)                        | Requires weekly plan feature                                                 |
| Badge 28+                                    | Out of scope                                                                 |

---

## 14. Success Criteria

Phase 0 dianggap selesai ketika:

1. ✓ Semua student-side pages dapat di-navigate dan diklik
2. ✓ Semua admin-side pages dapat di-navigate dan diklik
3. ✓ Flow dari landing → auth → dashboard → Try-out → result berjalan utuh
4. ✓ Flow admin dari Google Login (whitelist-gated) → dashboard → manage questions/users berjalan utuh
5. ✓ Evaluation dashboard menampilkan two-tier layout: basic totals (free) + blurred preview of category/sub-category breakdowns with upgrade CTA; full access untuk premium user dan admin
6. ✓ Live Poll flow (join dengan 6-digit code → vote → results) dapat didemonstrasikan, termasuk open-guest vs login-required toggle
7. ✓ Premium vs free state dapat ditoggle untuk demo (via mock Entitlement)
8. ✓ Responsive design bekerja di mobile dan desktop
9. ✓ Branding menggunakan nama "IlmoraX" dengan tone joyful/playful (Duolingo-like, visual only)
10. ✓ Boundary celebrations (Try-out submit, level-up, badge earned, streak milestone, rank change) di-annotate di prototype
11. ✓ Categories ditampilkan sebagai two fixed levels dengan format "Kardiovaskular - Hipertensi"
12. ✓ Admin whitelist management page (`/admin/admins`) dapat didemonstrasikan untuk super-admin
13. ✓ 2× design review telah dilakukan dan mendapat approval dari Kak David

---

## 15. Timeline

| Hari      | Fokus                                                                             |
| --------- | --------------------------------------------------------------------------------- |
| Day 1-2   | Rebrand + layout system (Streak/EXP/Level top bar, no Hearts/Gems) + auth flow + profile completion |
| Day 3-4   | Dashboard expansion + Try-out list + Try-out taking (wall-clock timer, snapshot, autosave) + result + celebration annotations |
| Day 5-6   | My Progress + Evaluation Dashboard (two-tier) + badges (26) + leaderboard (weekly WIB reset) |
| Day 7-8   | Admin pages (admins whitelist, questions, users + evaluation, materi Markdown, categories 2-level, moderation clustered) |
| Day 9-10  | Admin pages (insights, coupons with max-cap, packages time-boxed, polls with 3s polling, badges mgmt, leaderboard threshold) + Live Poll student |
| Day 11-12 | Premium/checkout (Entitlement creation, single discount field) + responsive polish + Coming Soon pages |
| Day 13-14 | Review preparation + adjustments from design review                               |

---

_Document prepared as PRD for Phase 0 of IlmoraX Clickable Prototype development._
