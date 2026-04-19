# Updated Proposal Pengembangan Platform IlmoraX

**Tanggal:** 19 April 2026  
**Ditujukan kepada:** Kak David  
**Berdasarkan:** Proposal 14 April 2026, Proposal Dijawab 16 April 2026, dan additional request analytics / personalized evaluation dashboard

---

## 1\. Ringkasan Project

Project ini adalah pengembangan platform web **IlmoraX** untuk membantu student mengakses try-out, materi pembelajaran, fitur premium, progress belajar, leaderboard, badge, live poll, dan personalized evaluation dashboard dalam satu sistem yang mudah dikelola oleh admin.

Proposal update ini dibuat untuk menggabungkan:

- scope awal dari proposal pertama  
- jawaban dan tambahan scope dari review client  
- fitur analytics / personalized evaluation dashboard untuk student  
- analytics user data pada halaman **Insights** terkait hasil test (CBT) sebelumnya

---

## 2\. Tujuan Project

Membangun platform pembelajaran berbasis web yang responsive, dengan fokus pada:

- experience try-out / CBT  
- pengelolaan soal dan materi  
- pembayaran subscription / premium access  
- progress belajar dan personalized evaluation  
- leaderboard, EXP, dan badge untuk engagement student  
- live poll untuk kebutuhan offline class  
- admin dashboard untuk monitoring user, aktivitas belajar, dan performa student

---

## 3\. Platform yang Dikembangkan

| Item | Keterangan |
| :---- | :---- |
| Platform utama | Responsive web application |
| Native Android app | Tidak termasuk |
| Native iOS app | Tidak termasuk |
| App Store / Play Store release | Tidak termasuk |

---

## 4\. Ringkasan Ruang Lingkup Utama

| Area | Cakupan |
| :---- | :---- |
| Authentication | Google login, mandatory profile completion |
| Learning flow | Try-out / CBT, materi free & premium, My Progress |
| Personalized evaluation | Dashboard evaluasi student berdasarkan hasil pengerjaan soal |
| Admin CMS | Soal, materi, user, package, coupon, referral, leaderboard, badge, live poll |
| Payment | Payment gateway integration, referral discount, one-time coupon |
| Engagement | Leaderboard, EXP, badge system, reward EXP dari badge |
| Live class support | Live Vote / poll dengan join code |
| Analytics | In-app dashboard untuk student evaluation dan Users Insights |

---

## 5\. Update dari Review Client

| No | Update / Request | Status |
| ----: | :---- | :---- |
| 1 | Nama platform berubah menjadi **IlmoraX** | Included |
| 2 | Admin dapat generate one-time coupon code untuk checkout discount, dengan start time dan end time | Included |
| 3 | Live Vote / poll untuk offline class | Included |
| 4 | Opsi menggunakan hosting professorllama yang masih aktif | Perlu diskusi teknis lanjutan, tapi bisa diusahakan untuk menggunakan server yang sudah ada |
| 5 | Button untuk Drilling/Games, Store, dan Affiliate Program yang mengarah ke Coming Soon/TBA page | Included |
| 6 | Level progression sampai 50 level | Included |
| 7 | Badge rewards berupa EXP yang otomatis masuk ke EXP student | Included untuk badge yang masuk scope |
| 8 | Student/admin dapat melihat badge milik student dari profile | Included |
| 9 | Retake try-out dan record result untuk setiap attempt | Included |
| 10 | Personalized evaluation dashboard untuk student, berdasarkan kategori dan sub kategori soal | Included |
| 11 | Admin dapat melihat evaluation dashboard setiap student | Included |
| 12 | Analytics user data pada halaman Users Insights | Included |

---

## 6\. Phase dan Milestone

### Phase 0 \- Design / Clickable Prototype

| Item | Detail |
| :---- | :---- |
| Deliverables | Flow utama aplikasi, struktur halaman utama, clickable prototype, review arah UI/UX |
| Termasuk update | Flow dashboard, premium access state, Users Insights, personalized evaluation, dan live poll |
| Start condition | Dimulai setelah down payment diterima |
| Review | 2 kali design review |
| Next step | Setelah prototype/design disetujui, development lanjut ke Milestone 1 |
| Catatan | Perubahan besar setelah approval design dianggap change request |

### Milestone 1 \- Core Platform, CBT, Admin Foundation, dan Basic Analytics

| Area | Scope |
| :---- | :---- |
| Public / user side | Landing page, Google login, mandatory profile completion, halaman profil user |
| CBT / try-out | Try-out / exercise, mark question, report question, autosave / periodic save saat refresh atau disconnect |
| Retake | Student dapat retake try-out dan sistem menyimpan result untuk setiap attempt |
| Result review | Score summary, list jawaban benar/salah, halaman pembahasan, re-test / re-take button |
| My Progress | Score history, recent test, attempt history |
| Personalized evaluation | Ringkasan performa student berdasarkan kategori dan sub kategori soal |
| Admin CMS | CMS untuk manage konten yang dinamis seperti test CBT, soal, materi, dll. |
| Soal management | Upload via Excel, manual create/edit, category/tagging, pembahasan field, publish/unpublish |
| Category structure | Soal dapat memiliki kategori dan sub kategori, misalnya Klinis \> Kardiovaskular \> Hipertensi |
| Materi management | Upload materi, text explanation, embed video, attachment file/PDF, category/tagging, free/premium flag |
| User management | List users, search/filter, view profile/basic activity, suspend/disable users, change premium/free access |
| Admin student evaluation | Admin dapat membuka detail student dan melihat dashboard evaluasi per student |
| Moderation | Admin review report soal dari user |
| Third-party analytics | Basic analytics tooling integration via Google Analytics atau PostHog bila diperlukan |

**Batasan Milestone 1**

| Item | Status |
| :---- | :---- |
| Personalized evaluation dashboard basic | Termasuk |
| Per-category dan per-subcategory performance breakdown basic | Termasuk |
| Users Insights basic analytics | Termasuk |
| Advanced cohort analytics / retention analytics kompleks | Tidak termasuk |
| Custom BI dashboard kompleks | Tidak termasuk |
| Export analytics report ke Excel/PDF | Tidak termasuk |

### Milestone 2 \- Premium Access, Payment, Coupon, dan Package

| Area | Scope |
| :---- | :---- |
| Access control | Premium/free content lock untuk try-out, materi, dan fitur premium |
| Premium evaluation | Personalized evaluation dashboard dapat digunakan oleh student dengan premium access |
| Purchase flow | Subscription / package purchase flow |
| Payment | Integrasi payment gateway seperti Xendit atau Midtrans |
| Discount | Referral discount support pada checkout |
| Coupon | Admin dapat membuat one-time coupon code dengan start time, end time, dan discount rule |
| Admin management | Manage pricing / subscription / package, manage referral discount, manage coupon |
| Email notifications | Payment success, welcome/account registration, subscription purchase confirmation, report/question submission acknowledgment |

**Batasan Milestone 2**

| Item | Status |
| :---- | :---- |
| Payment status email kompleks | Tidak termasuk |
| WhatsApp notification | Tidak termasuk |
| In-app notification | Tidak termasuk |
| Promo email | Tidak termasuk |
| Try-out reminder email | Tidak termasuk |
| Payment gateway fee / fee transaksi | Ditanggung client |

### Milestone 3 \- Engagement Features, Badge, Leaderboard, dan Live Poll

| Area | Scope |
| :---- | :---- |
| Leaderboard | Leaderboard berbasis EXP |
| EXP logic | EXP didapat dari aktivitas try-out dan reward badge |
| Level progression | 50 level sesuai reference IlmoraX |
| Reset | Leaderboard reset mingguan |
| Badge | Badge system dengan automatic awarding untuk badge yang masuk scope |
| Badge reward | Bonus EXP dari badge otomatis masuk ke student EXP |
| Admin control | Admin dapat mengelola badge dan basic rule logic |
| User view | User dapat melihat badge yang sudah didapat |
| Profile badge view | Admin atau user lain dapat melihat badge student dari profile |
| Live Vote / poll | Admin membuat poll, student join dengan code, pilihan A/B/C/D/E, timer, result hidden sampai poll ditutup |
| Poll result | Setelah poll ditutup, sistem menampilkan jumlah dan persentase pilihan A/B/C/D/E |
| Coming Soon page | Button Drilling/Games, Store, dan Affiliate Program mengarah ke Coming Soon/TBA page |
| CMS | Admin dapat mengelola leaderboard / badge / live poll dari CMS |

**Batasan Milestone 3**

| Item | Status |
| :---- | :---- |
| [Badge](https://onedrive.live.com/:x:/g/personal/0975BE574A73633F/IQB7RrTGoxl2SLmAj7_iSxYnAaRutZFkjVg-kQObVbIgn18?resid=0975BE574A73633F!sc6b4467b19a34876b9808fbfe24b1627&ithint=file%2Cxlsx&e=Auag9S&migratedtospo=true&redeem=aHR0cHM6Ly8xZHJ2Lm1zL3gvYy8wOTc1YmU1NzRhNzM2MzNmL0lRQjdSclRHb3hsMlNMbUFqN19pU3hZbkFhUnV0WkZralZnLWtRT2JWYklnbjE4P2U9QXVhZzlT) 1-27, kecuali Badge 21 | Termasuk |
| Badge 28+ | Tidak termasuk |
| Badge 21 / Never Skip | Tidak termasuk karena membutuhkan weekly plan feature |
| Reward redemption | Tidak termasuk |
| Coupon reward terhubung badge | Tidak termasuk |
| Social sharing badge | Tidak termasuk |
| Gamification untuk drilling / learning material flow | Tidak termasuk |

---

## 7\. Detail Fitur Personalized Evaluation Dashboard

Fitur ini adalah dashboard evaluasi personal untuk membantu student dan admin melihat performa belajar secara lebih jelas.

### Akses Student

| Item | Detail |
| :---- | :---- |
| Availability | Untuk student dengan premium access |
| Tujuan | Membantu student memahami kekuatan dan kelemahan berdasarkan pengerjaan soal |
| Data source | Data dari CBT / try-out / exercise yang dikerjakan di platform |
| Tampilan | Dashboard ringkas yang mudah dibaca |

### Data yang Ditampilkan

| Data | Detail |
| :---- | :---- |
| Total soal dikerjakan | Jumlah soal yang sudah dijawab student |
| Jawaban benar | Total jawaban benar |
| Jawaban salah | Total jawaban salah |
| Persentase benar | Persentase benar dari total soal yang dikerjakan |
| Persentase salah | Persentase salah dari total soal yang dikerjakan |
| Breakdown kategori | Performa per kategori soal |
| Breakdown sub kategori | Performa per sub kategori soal |
| Attempt history | Riwayat hasil pengerjaan / retake |

### Struktur Kategori Soal

Contoh struktur:

| Level | Contoh |
| :---- | :---- |
| Kategori | Klinis |
| Sub kategori 1 | Penyakit jantung / kardiovaskular |
| Sub kategori 2 | Hipertensi |

Contoh data yang tampil:

| Kategori | Sub Kategori | Soal Dikerjakan | Benar | Salah | Persentase Benar |
| :---- | :---- | ----: | ----: | ----: | ----: |
| Klinis | Kardiovaskular \- Hipertensi | 40 | 30 | 10 | 75% |
| Klinis | Kardiovaskular \- Gagal Jantung | 25 | 18 | 7 | 72% |
| Farmakologi | Antibiotik | 30 | 21 | 9 | 70% |

### Akses Admin

| Item | Detail |
| :---- | :---- |
| Student list | Admin dapat memilih student dari user list |
| Student detail | Admin dapat melihat evaluation dashboard masing-masing student |
| Filter basic | Filter/search user berdasarkan nama, email, status premium/free |
| Use case | Monitoring progress student dan membantu proses evaluasi belajar |

---

## 8\. Detail Fitur Users Insights

Halaman **Users Insights** adalah dashboard admin untuk melihat gambaran data user dan aktivitas platform.

### Data Users Insights yang Termasuk

| Data | Detail |
| :---- | :---- |
| Total registered users | Total user terdaftar |
| New users | User baru dalam periode tertentu |
| Premium users | Jumlah user dengan premium access |
| Free users | Jumlah user free |
| Active users basic | User yang memiliki aktivitas dalam periode tertentu |
| Try-out activity | Jumlah attempt / test yang dikerjakan |
| Question activity | Jumlah soal yang dijawab |
| Average score | Rata-rata score dari attempt yang selesai |
| Category performance summary | Ringkasan performa berdasarkan kategori soal |
| Recent activity | Aktivitas terbaru yang relevan untuk admin |

### Batasan Users Insights

| Item | Status |
| :---- | :---- |
| Dashboard admin basic | Termasuk |
| Segment premium/free basic | Termasuk |
| Deep funnel analytics | Tidak termasuk |
| Retention cohort kompleks | Tidak termasuk |
| Revenue analytics detail / accounting report | Tidak termasuk |
| Integrasi BI tools seperti Metabase/Tableau/Looker | Tidak termasuk |

---

## 9\. Included vs Excluded Scope

### Included Scope

| Feature | Status |
| :---- | :---- |
| Google login | Included |
| Mandatory profile completion | Included |
| Payment gateway | Included |
| Referral discount in checkout | Included |
| One-time coupon with start/end time | Included |
| Premium/free content lock | Included |
| Premium personalized evaluation dashboard | Included |
| Admin access to each student's evaluation dashboard | Included |
| Users Insights admin analytics | Included |
| My Progress | Included |
| Leaderboard | Included |
| 50 level EXP progression | Included |
| Badges in agreed scope | Included |
| EXP reward from badge | Included |
| Result review setelah exam | Included |
| Retake try-out and attempt record | Included |
| Mark question | Included |
| Report question | Included |
| Autosave saat disconnected/refresh selama try-out | Included |
| Admin upload via Excel | Included |
| Admin CMS untuk materials/questions | Included |
| Live Vote / poll | Included |
| Coming Soon page for Drilling/Games, Store, Affiliate Program | Included |
| Email notifications yang disebutkan | Included |
| Responsive web only | Included |

### Excluded / Out of Scope

| Feature | Status |
| :---- | :---- |
| Apple login | Excluded |
| LinkedIn login | Excluded |
| OTP to email | Excluded |
| OTP to WhatsApp | Excluded |
| In-app notifications | Excluded |
| WhatsApp notifications / WhatsApp Business integration | Excluded |
| Calendar integration | Excluded |
| Store feature selain Coming Soon page | Excluded |
| Affiliate program selain Coming Soon page | Excluded |
| Drilling/Games feature selain Coming Soon page | Excluded |
| Light mode / dark mode | Excluded |
| Advanced exam analytics / predictive analytics / deep statistics | Excluded |
| Analytics export to PDF/Excel | Excluded |
| Native mobile apps | Excluded |
| Gamification untuk drilling/learning material experience | Excluded |

---

## 10\. Asumsi Project

| Asumsi | Detail |
| :---- | :---- |
| Feedback client | 2-6 hari kerja |
| Content readiness | Question bank, package, pricing, coupon rules, kategori soal, dan aset pendukung disediakan oleh client |
| Category readiness | Struktur kategori dan sub kategori soal disiapkan / disetujui client |
| Dummy content | Developer dapat menggunakan dummy content selama development bila diperlukan |
| Scope stability | Tidak ada major scope change di tengah project |
| Third-party readiness | Akses third-party yang dibutuhkan dapat disiapkan sesuai kebutuhan implementasi |
| Hosting professorllama | Perlu review teknis sebelum diputuskan sebagai production hosting |

---

## 12\. Revisi dan Approval

| Item | Detail |
| :---- | :---- |
| Approver utama | Kak David |
| Bentuk approval | Approval via WhatsApp dapat digunakan sebagai approval yang sah |
| Design review | 2 kali design review |
| Milestone review | Developer melakukan demo di staging |
| Review window | Maksimal 1 minggu sejak demo diberikan |
| Default acceptance | Jika tidak ada issue list dalam 1 minggu, milestone dianggap accepted / approved |
| Perubahan setelah approval | Redesign atau perubahan besar dihitung sebagai change request |

---

## 13\. Skema Pembayaran

Model pembayaran project ini adalah **bertahap**.

| Tahap | Pembayaran |
| :---- | :---- |
| Phase 0 | Down payment Rp 10.000.000 di awal untuk memulai design/prototype |
| Milestone 1 | Dibayar setelah Milestone 1 selesai dan disetujui |
| Milestone 2 | Dibayar setelah Milestone 2 selesai dan disetujui |
| Milestone 3 | Dibayar setelah Milestone 3 selesai dan disetujui |

**Flow pembayaran**

1. Down payment diterima  
2. Developer memulai clickable prototype dan design review  
3. Setelah prototype/design disetujui, development lanjut ke Milestone 1  
4. Pembayaran milestone dilakukan setelah milestone selesai dan disetujui

**Catatan:** Perubahan di luar scope yang telah disetujui akan dihitung sebagai **additional work**, baik dari sisi waktu maupun biaya.

---

## 14\. Timeline dan Biaya

Fitur tambahan dari review client dan additional request analytics dimasukkan ke proposal update ini dengan **total biaya project tetap Rp 45.000.000**, selama scope mengikuti batasan yang tertulis di dokumen ini.

| Phase / Milestone | Durasi | Biaya |
| :---- | ----: | ----: |
| Phase 0 \- Design / Clickable Prototype | 1-2 minggu | Rp 10.000.000 |
| Milestone 1 \- Core Platform, CBT, Admin Foundation, dan Basic Analytics | 1-3 minggu | Rp 15.000.000 |
| Milestone 2 \- Premium Access, Payment, Coupon, dan Package | 2-4 minggu | Rp 12.000.000 |
| Milestone 3 \- Engagement Features, Badge, Leaderboard, dan Live Poll | 2-3 minggu | Rp 8.000.000 |
| **Total Project** | **6-12 minggu** | **Rp 45.000.000** |

**Catatan timeline:** estimasi dapat berubah mengikuti kecepatan feedback client, kesiapan konten/data, kesiapan struktur kategori soal, akses third-party, serta perubahan kebutuhan di tengah proses.

---

## 15\. Environment, Deployment, dan Ownership

| Area | Detail |
| :---- | :---- |
| Development / staging | Developer dapat menggunakan akun / environment milik developer untuk efisiensi pengerjaan |
| Production readiness | Sebelum production release, client menyediakan dan menanggung akun, layanan, dan biaya production |
| Existing hosting | Hosting professorllama dapat dipertimbangkan setelah review teknis |
| Setup support | Setup staging dan production termasuk dalam bantuan implementasi project ini |
| Ownership of running cost | Server, database, domain, email provider, payment gateway, analytics tool, dan layanan pihak ketiga production menjadi tanggungan client |

---

## 16\. Biaya Maintenance Bulanan Setelah Release

### Estimasi Maintenance

| Komponen | Estimasi |
| :---- | ----: |
| Server | $5-$10 /bulan |
| Email | Gratis sampai \< 1.000 user, setelah itu sekitar $20 / bulan |
| Domain | $15 / tahun atau sekitar $1.25 / bulan |
| **Total** | $6.15/Rp 111,412.28 /bulan atau $73.80 (Rp 1,264,957.83) /tahun |

### Catatan Maintenance

| Item | Detail |
| :---- | :---- |
| Variabel biaya | Dapat berubah mengikuti traffic, volume data, storage, analytics data, dan layanan pihak ketiga |
| Start maintenance | Dimulai setelah release ke production |
| Cost owner | Biaya production dan maintenance menjadi tanggungan client |
| Existing hosting | Jika hosting professorllama layak digunakan, estimasi maintenance dapat disesuaikan |

---

## 17\. Cakupan Maintenance

| Included in Maintenance | Status |
| :---- | :---- |
| Server monitoring | Included |
| Deployment help | Included |
| Bug fixing | Included |
| Dependency / security updates | Included |
| Minor content/admin support | Included |
| Minor UI/content adjustment | Included |
| Pengembangan fitur baru | Not included |

---

## 18\. Warranty / Masa Garansi Bug Fix

Setelah release ke production, terdapat masa **bug-fix warranty selama 2 bulan** untuk memperbaiki issue yang termasuk dalam scope yang telah disepakati.

| Item | Keterangan |
| :---- | :---- |
| Bug dalam scope | Included |
| Fitur baru | Tidak termasuk |
| Perubahan di luar scope | Tidak termasuk |

---

## 19\. Catatan Tambahan

| Item | Keterangan |
| :---- | :---- |
| Dasar proposal | Berdasarkan kebutuhan yang telah dibahas dan approval scope yang sedang diajukan |
| Perubahan di luar scope | Dihitung sebagai pekerjaan tambahan |
| Perubahan third-party integration | Dapat memengaruhi timeline dan biaya implementasi |
| Masa berlaku proposal | 14 hari sejak tanggal proposal update |
| Harga update | Tetap Rp 45.000.000 selama scope mengikuti dokumen ini |

---

## 20\. Penutup

Proposal update ini dibuat sebagai dasar approval untuk pelaksanaan project **IlmoraX** dengan pendekatan bertahap per phase dan milestone, agar pengembangan lebih terukur, scope lebih jelas, dan setiap hasil kerja dapat direview sebelum lanjut ke tahap berikutnya.

Additional request untuk **personalized evaluation dashboard**, **admin access ke evaluation setiap student**, dan **Users Insights analytics** sudah dimasukkan ke scope proposal ini dengan batasan yang tertulis di atas.

Apabila proposal ini disetujui, project dapat dimulai setelah **down payment** diterima dan phase **design / prototype** dimulai.