# Proposal Pengembangan Platform Genius Pharmacist

**Tanggal:** 14 April 2026  
**Ditujukan kepada:** Kak David

---

## 1. Ringkasan Project
Project ini adalah pengembangan platform web **Genius Pharmacist** untuk membantu user mengakses try-out, materi pembelajaran, fitur premium, dan progress belajar dalam satu sistem yang mudah dikelola oleh admin.

Proposal ini disusun sebagai dokumen approval untuk:
- scope kerja
- timeline
- biaya implementasi

---

## 2. Tujuan Project
Membangun platform pembelajaran berbasis web yang responsive, dengan fokus pada:
- experience try-out / CBT
- pengelolaan materi
- pembayaran subscription
- progress belajar
- leaderboard dan badge untuk engagement user

---

## 3. Platform yang Dikembangkan
| Item | Keterangan |
|---|---|
| Platform utama | Responsive web application |
| Native Android app | Tidak termasuk |
| Native iOS app | Tidak termasuk |
| App Store / Play Store release | Tidak termasuk |

---

## 4. Ringkasan Ruang Lingkup Utama
| Area | Cakupan |
|---|---|
| Authentication | Google login, mandatory profile completion |
| Learning flow | Try-out / CBT, materi free & premium, My Progress |
| Admin CMS | Soal, materi, user, package, referral, leaderboard, badge |
| Payment | Payment gateway integration, referral discount |
| Engagement | Leaderboard, badge system |
| Communication | Email notification untuk flow yang disepakati |
| Analytics | Basic analytics tooling via third-party platform |

---

## 5. Phase dan Milestone

### Phase 0 — Design / Clickable Prototype
| Item | Detail |
|---|---|
| Deliverables | Flow utama aplikasi, struktur halaman utama, clickable prototype, review arah UI/UX |
| Start condition | Dimulai setelah down payment diterima |
| Review | 2 kali design review |
| Next step | Setelah prototype/design disetujui, development lanjut ke Milestone 1 |
| Catatan | Perubahan besar setelah approval design dianggap change request |

### Milestone 1 — Core Platform & Admin Foundation
| Area | Scope |
|---|---|
| Public / user side | Landing page, Google login, mandatory profile completion, halaman profil user |
| CBT / try-out | Try-out / exercise, mark question, report question, autosave / periodic save saat refresh atau disconnect |
| Result review | Score summary, list jawaban benar/salah, halaman pembahasan, re-test / re-take button |
| My Progress | Score history, recent test |
| Admin CMS | Payload CMS |
| Soal management | Upload via Excel, manual create/edit, category/tagging, pembahasan field, publish/unpublish |
| Materi management | Upload materi, text explanation, embed video, attachment file/PDF, category/tagging, free/premium flag |
| User management | List users, search/filter, view profile/basic activity, suspend/disable users, change premium/free access |
| Moderation | Admin review report soal dari user |
| Analytics | Basic analytics tooling integration via Google Analytics atau PostHog |

**Batasan Milestone 1**

| Item | Status |
|---|---|
| Custom in-app analytics dashboard | Tidak termasuk |
| Password reset | Tidak termasuk |
| Per-category performance breakdown | Tidak termasuk |
| Advanced exam analytics | Tidak termasuk |

### Milestone 2 — Premium Access & Payment
| Area | Scope |
|---|---|
| Access control | Premium/free content lock untuk try-out dan materi |
| Purchase flow | Subscription / package purchase flow |
| Payment | Integrasi payment gateway seperti Xendit atau Midtrans |
| Discount | Referral discount support pada checkout |
| Admin management | Manage pricing / subscription / package, manage referral discount |
| Email notifications | Payment success, welcome/account registration, subscription purchase confirmation, report/question submission acknowledgment |

**Batasan Milestone 2**

| Item | Status |
|---|---|
| Payment status email kompleks | Tidak termasuk |
| WhatsApp notification | Tidak termasuk |
| In-app notification | Tidak termasuk |
| Promo email | Tidak termasuk |
| Try-out reminder email | Tidak termasuk |

### Milestone 3 — Engagement Features
| Area | Scope |
|---|---|
| Leaderboard | Leaderboard berbasis EXP |
| EXP logic | EXP didapat dari aktivitas try-out |
| Reset | Leaderboard reset mingguan |
| Badge | Badge system dengan automatic awarding |
| Admin control | Admin dapat mengelola badge dan basic rule logic |
| User view | User dapat melihat badge yang sudah didapat |
| CMS | Admin dapat mengelola leaderboard / badge dari CMS |

**Batasan Milestone 3**

| Item | Status |
|---|---|
| Reward redemption | Tidak termasuk |
| Coupon reward terhubung badge | Tidak termasuk |
| Social sharing badge | Tidak termasuk |
| Gamification untuk drilling / learning material flow | Tidak termasuk |
| Full game-like transformation pada overall CBT UI | Tidak termasuk |

---

## 6. Included vs Excluded Scope

### Included Scope
| Feature | Status |
|---|---|
| Google login | Included |
| Mandatory profile completion | Included |
| Payment gateway | Included |
| Referral discount in checkout | Included |
| Premium/free content lock | Included |
| My Progress | Included |
| Leaderboard | Included |
| Badges | Included |
| Result review setelah exam | Included |
| Mark question | Included |
| Report question | Included |
| Autosave saat disconnected/refresh selama try-out | Included |
| Admin upload via Excel | Included |
| Admin CMS untuk materials/questions | Included |
| Email notifications yang disebutkan | Included |
| Responsive web only | Included |

### Excluded / Out of Scope
| Feature | Status |
|---|---|
| Apple login | Excluded |
| LinkedIn login | Excluded |
| OTP to email | Excluded |
| OTP to WhatsApp | Excluded |
| In-app notifications | Excluded |
| WhatsApp notifications / WhatsApp Business integration | Excluded |
| Calendar integration | Excluded |
| Store | Excluded |
| Affiliate program | Excluded |
| Light mode / dark mode | Excluded |
| Advanced exam analytics / trend analytics / deep statistics | Excluded |
| Per-category performance breakdown | Excluded |
| Custom in-app analytics dashboard | Excluded |
| Native mobile apps | Excluded |
| Gamification untuk drilling/learning material experience | Excluded |

---

## 7. Optional Future Enhancement
Di luar scope saat ini, terdapat opsi **future enhancement** untuk integrasi WhatsApp non-official yang lebih murah dan minim requirement.

| Item | Keterangan |
|---|---|
| Status | Tidak termasuk dalam proposal ini |
| Kebutuhan operasional | Membutuhkan device / nomor WhatsApp yang selalu aktif |
| Keterbatasan | Tidak memiliki benefit resmi seperti centang hijau / biru |

---

## 8. Asumsi Project
| Asumsi | Detail |
|---|---|
| Feedback client | 2–6 hari kerja |
| Content readiness | Question bank, package, pricing, dan aset pendukung disediakan oleh client |
| Dummy content | Developer dapat menggunakan dummy content selama development bila diperlukan |
| Scope stability | Tidak ada major scope change di tengah project |
| Third-party readiness | Akses third-party yang dibutuhkan dapat disiapkan sesuai kebutuhan implementasi |

---

## 9. Revisi dan Approval
| Item | Detail |
|---|---|
| Approver utama | Kak David |
| Bentuk approval | Approval via WhatsApp dapat digunakan sebagai approval yang sah |
| Design review | 2 kali design review |
| Milestone review | Developer melakukan demo di staging |
| Review window | Maksimal 1 minggu sejak demo diberikan |
| Default acceptance | Jika tidak ada issue list dalam 1 minggu, milestone dianggap accepted / approved |
| Perubahan setelah approval | Redesign atau perubahan besar dihitung sebagai change request |

---

## 10. Skema Pembayaran
Model pembayaran project ini adalah **bertahap**.

| Tahap | Pembayaran |
|---|---|
| Phase 0 | Down payment Rp 10.000.000 di awal untuk memulai design/prototype |
| Milestone 1 | Dibayar setelah Milestone 1 selesai dan disetujui |
| Milestone 2 | Dibayar setelah Milestone 2 selesai dan disetujui |
| Milestone 3 | Dibayar setelah Milestone 3 selesai dan disetujui |

**Flow pembayaran**
1. Down payment diterima
2. Developer memulai clickable prototype dan design review
3. Setelah prototype/design disetujui, development lanjut ke Milestone 1
4. Pembayaran milestone dilakukan setelah milestone selesai dan disetujui

**Catatan:**
Perubahan di luar scope yang telah disetujui akan dihitung sebagai **additional work**, baik dari sisi waktu maupun biaya.

---

## 11. Timeline dan Biaya
| Phase / Milestone | Durasi | Biaya |
|---|---:|---:|
| Phase 0 — Design / Clickable Prototype | 1–2 minggu | Rp 10.000.000 |
| Milestone 1 — Core Platform & Admin Foundation | 1–3 minggu | Rp 15.000.000 |
| Milestone 2 — Premium Access & Payment | 2–4 minggu | Rp 12.000.000 |
| Milestone 3 — Engagement Features | 2–3 minggu | Rp 8.000.000 |
| **Total Project** | **6–12 minggu** | **Rp 45.000.000** |

**Catatan timeline:** estimasi dapat berubah mengikuti kecepatan feedback client, kesiapan konten/data, serta perubahan kebutuhan di tengah proses.

---

## 12. Environment, Deployment, dan Ownership
| Area | Detail |
|---|---|
| Development / staging | Developer dapat menggunakan akun / environment milik developer untuk efisiensi pengerjaan |
| Production readiness | Sebelum production release, client menyediakan dan menanggung akun, layanan, dan biaya production |
| Setup support | Setup staging dan production termasuk dalam bantuan implementasi project ini |
| Ownership of running cost | Server, database, domain, email provider, payment gateway, analytics tool, dan layanan pihak ketiga production menjadi tanggungan client |

---

## 13. Biaya Maintenance Bulanan Setelah Release

### Estimasi Maintenance
| Komponen | Estimasi |
|---|---:|
| Server | $20 / Rp 343.160 |
| Database | $10 / Rp 171.580 |
| Dev maintenance | $30 / Rp 514.740 |
| Email | Gratis sampai < 1.000 user, setelah itu sekitar $20 / bulan |
| Domain | $15 / tahun atau sekitar $1.25 / bulan |
| **Total** | **$61.25 / Rp 1.050.927,50** |

### Catatan Maintenance
| Item | Detail |
|---|---|
| Variabel biaya | Dapat berubah mengikuti traffic, volume data, storage, dan layanan pihak ketiga |
| Start maintenance | Dimulai setelah release ke production |
| Cost owner | Biaya production dan maintenance menjadi tanggungan client |

---

## 14. Cakupan Maintenance
| Included in Maintenance | Status |
|---|---|
| Server monitoring | Included |
| Deployment help | Included |
| Bug fixing | Included |
| Dependency / security updates | Included |
| Minor content/admin support | Included |
| Minor UI/content adjustment | Included |
| Pengembangan fitur baru | Not included |

---

## 15. Warranty / Masa Garansi Bug Fix
Setelah release ke production, terdapat masa **bug-fix warranty selama 2 bulan** untuk memperbaiki issue yang termasuk dalam scope yang telah disepakati.

| Item | Keterangan |
|---|---|
| Bug dalam scope | Included |
| Fitur baru | Tidak termasuk |
| Perubahan di luar scope | Tidak termasuk |

---

## 16. Catatan Tambahan
| Item | Keterangan |
|---|---|
| Dasar proposal | Berdasarkan kebutuhan yang telah dibahas dan approval scope yang sedang diajukan |
| Perubahan di luar scope | Dihitung sebagai pekerjaan tambahan |
| Perubahan third-party integration | Dapat memengaruhi timeline dan biaya implementasi |
| Masa berlaku proposal | 14 hari sejak tanggal proposal |

---

## 17. Penutup
Proposal ini dibuat sebagai dasar approval untuk pelaksanaan project **Genius Pharmacist** dengan pendekatan bertahap per phase dan milestone, agar pengembangan lebih terukur, scope lebih jelas, dan setiap hasil kerja dapat direview sebelum lanjut ke tahap berikutnya.

Apabila proposal ini disetujui, project dapat dimulai setelah **down payment** diterima dan phase **design / prototype** dimulai.

