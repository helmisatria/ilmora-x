import {
  AtomIcon,
  BoltBadgeIcon,
  BookOpenIcon,
  CapsuleIcon,
  CrownIcon,
  DocumentIcon,
  FlameIcon,
  FlashBadgeIcon,
  FlaskIcon,
  GiftIcon,
  GrowthIcon,
  HeadsetIcon,
  HeartLineIcon,
  MagicWandIcon,
  RefreshIcon,
  ShieldBadgeIcon,
  StarBadgeIcon,
  TargetBadgeIcon,
  TargetIcon,
  TrophyLineIcon,
  UsersIcon,
} from "./landing-icons";

export const brandColors = {
  primary: "#205072",
  primarySoft: "#dcecf7",
  primaryTint: "#f1f7fb",
} as const;

export const heroMetrics = [
  {
    label: "Soal UKAI",
    value: "500+",
    accent: "#19b39d",
    tone: brandColors.primaryTint,
    icon: <DocumentIcon />,
  },
  {
    label: "Pengguna aktif",
    value: "50K+",
    accent: "#f4a62a",
    tone: "#fff5df",
    icon: <BoltBadgeIcon />,
  },
  {
    label: "Akurasi sistem",
    value: "98%",
    accent: "#2492eb",
    tone: "#eaf5ff",
    icon: <ShieldBadgeIcon />,
  },
] as const;

export const heroNavItems = [
  { label: "Beranda", href: "#beranda" },
  { label: "Try-out", href: "#cara-kerja" },
  { label: "Peringkat", href: "#hasil" },
  { label: "Harga", href: "#paket" },
  { label: "Tentang", href: "#tentang" },
] as const;

export const popularTryouts = [
  {
    title: "UKAI Tryout 1",
    meta: "20 soal  •  30 menit",
    pill: "KLINIS",
    tone: brandColors.primarySoft,
    accent: brandColors.primary,
    icon: <FlaskIcon />,
  },
  {
    title: "Farmakologi Dasar",
    meta: "25 soal  •  40 menit",
    pill: "FARMAKOLOGI",
    tone: "#eefae1",
    accent: "#6fca32",
    icon: <CapsuleIcon />,
  },
  {
    title: "Kardiovaskular",
    meta: "20 soal  •  30 menit",
    pill: "KLINIS",
    tone: "#fff0f2",
    accent: "#ff6f7d",
    icon: <HeartLineIcon />,
  },
  {
    title: "Antibiotik & Antinfeksi",
    meta: "15 soal  •  25 menit",
    pill: "FARMAKOLOGI",
    tone: "#f4ebff",
    accent: "#a565ff",
    icon: <AtomIcon />,
  },
] as const;

export const weakTopics = [
  { label: "Farmakokinetik", value: "42%", width: "42%", tone: "#ff8f98" },
  { label: "Kardiovaskular", value: "35%", width: "35%", tone: "#ffb136" },
  { label: "Antibiotik", value: "28%", width: "28%", tone: "#b98af8" },
] as const;

export const journeySteps = ["01", "02", "03"] as const;

export const learningBadges = [
  {
    title: "Terarah",
    body: "Fokus materi prioritas.",
    tone: brandColors.primaryTint,
    accent: brandColors.primary,
    icon: <TargetBadgeIcon />,
  },
  {
    title: "Efisien",
    body: "Belajar ringkas, hasil maksimal.",
    tone: "#fff4df",
    accent: "#f2ab37",
    icon: <FlashBadgeIcon />,
  },
  {
    title: "Terukur",
    body: "Progress tercatat otomatis.",
    tone: "#f4ebff",
    accent: "#b06cff",
    icon: <StarBadgeIcon />,
  },
] as const;

export const focusCards = [
  {
    title: "Tahu prioritas belajar",
    body: "Analisis performa menunjukkan topik lemah dan memberi rekomendasi latihan yang paling berdampak.",
    number: "01",
    tone: brandColors.primaryTint,
    accent: brandColors.primary,
    chips: ["Topik lemah terarah", "Rekomendasi personal"],
    icon: <TargetBadgeIcon />,
  },
  {
    title: "Review lebih jelas",
    body: "Pembahasan detail dengan penjelasan konsep, referensi, dan alasan kenapa jawaban kamu benar atau salah.",
    number: "02",
    tone: "#edf5ff",
    accent: "#2892f5",
    chips: ["Pembahasan mendalam", "Referensi tepercaya"],
    icon: <BookOpenIcon />,
  },
  {
    title: "Naik level dengan arah",
    body: "Pantau progresmu, kumpulkan XP, jaga streak, dan capai level lebih tinggi secara konsisten.",
    number: "03",
    tone: "#fff3e4",
    accent: "#f59a1b",
    chips: ["Progres terukur", "Motivasi berkelanjutan"],
    icon: <GrowthIcon />,
  },
] as const;

export const resultTopics = [
  { label: "Kardiovaskular", value: "42%", width: "42%", tone: "#ff7a88", icon: <HeartLineIcon /> },
  { label: "Antibiotik & Antinfeksi", value: "58%", width: "58%", tone: "#b27cff", icon: <AtomIcon /> },
  { label: "Farmakologi Dasar", value: "67%", width: "67%", tone: "#69cf31", icon: <CapsuleIcon /> },
] as const;

export const recommendedActions = [
  {
    title: "Ulangi topik Kardiovaskular",
    meta: "20 soal rekomendasi",
    tone: brandColors.primaryTint,
    accent: brandColors.primary,
    icon: <DocumentIcon />,
  },
  {
    title: "Review Antibiotik & Antinfeksi",
    meta: "15 soal rekomendasi",
    tone: "#edf5ff",
    accent: "#2892f5",
    icon: <BookOpenIcon />,
  },
  {
    title: "Try-out Farmakologi Lanjutan",
    meta: "25 soal • 30 menit",
    tone: "#fff4df",
    accent: "#f2a126",
    icon: <TargetIcon />,
  },
] as const;

export const plans = [
  {
    name: "Gratis",
    badge: "Selamanya gratis",
    cta: "Coba Try-out",
    to: "/tryout",
    description: "Mulai latihan UKAI tanpa biaya. Cukup daftar dan langsung coba.",
    icon: <GiftIcon />,
    features: [
      "Akses try-out dasar",
      "Pembahasan singkat",
      "Laporan hasil & akurasi",
      "XP, level, dan streak harian",
      "Leaderboard mingguan",
    ],
  },
  {
    name: "Premium",
    badge: "Paling direkomendasikan",
    cta: "Buka Premium",
    to: "/premium",
    description:
      "Tingkatkan hasil belajar dengan analisis mendalam dan rekomendasi yang tepat sasaran.",
    icon: <CrownIcon />,
    features: [
      "Semua fitur Gratis",
      "Pembahasan lengkap & detail",
      "Analisis topik lemah & pola salah",
      "Rekomendasi latihan terpersonalisasi",
      "Akses semua try-out premium",
      "Leaderboard & lencana eksklusif",
      "Prioritas fitur & update terbaru",
    ],
  },
] as const;

export const pricingPreviewTryouts = [
  {
    title: "UKAI Tryout 1",
    meta: "20 soal • 30 menit",
    icon: <FlaskIcon />,
    tone: brandColors.primaryTint,
    accent: brandColors.primary,
  },
  {
    title: "Farmakologi Dasar",
    meta: "25 soal • 40 menit",
    icon: <CapsuleIcon />,
    tone: "#eefae1",
    accent: "#69cf31",
  },
  {
    title: "Kardiovaskular",
    meta: "20 soal • 30 menit",
    icon: <HeartLineIcon />,
    tone: "#fff0f2",
    accent: "#ff7a88",
  },
  {
    title: "Antibiotik & Antinfeksi",
    meta: "15 soal • 25 menit",
    icon: <AtomIcon />,
    tone: "#f5ecff",
    accent: "#b272ff",
  },
] as const;

export const premiumBenefits = [
  {
    title: "Analisis Akurat",
    body: "Temukan pola salahmu",
    icon: <TargetBadgeIcon />,
  },
  {
    title: "Review Detail",
    body: "Pembahasan komprehensif",
    icon: <BookOpenIcon />,
  },
  {
    title: "Rekomendasi Pintar",
    body: "Belajar sesuai kebutuhanmu",
    icon: <MagicWandIcon />,
  },
  {
    title: "Kejar Peringkat",
    body: "Raih posisi terbaik di leaderboard",
    icon: <TrophyLineIcon />,
  },
] as const;

export const pricingTrustItems = [
  {
    title: "Aman & Terpercaya",
    body: "Data kamu selalu dilindungi",
    icon: <ShieldBadgeIcon />,
    tone: brandColors.primary,
  },
  {
    title: "Selalu Diperbarui",
    body: "Soal & pembahasan terkini",
    icon: <RefreshIcon />,
    tone: brandColors.primary,
  },
  {
    title: "Butuh Bantuan?",
    body: "Dukungan siap 7 hari",
    icon: <HeadsetIcon />,
    tone: "#f2a126",
  },
  {
    title: "Dipercaya Ribuan Apoteker",
    body: "Bersama IlmoraX, taklukkan UKAI",
    icon: <UsersIcon />,
    tone: "#ff7a88",
  },
] as const;

export const finalCalloutCards = [
  {
    title: "STREAK",
    value: "7 hari",
    position: "left-4 top-10 -rotate-[5deg] xl:left-10",
    icon: <FlameIcon />,
    tone: "#f5a623",
    width: "w-[178px]",
  },
  {
    title: "LEVEL",
    value: "12",
    position: "left-6 top-[44%] -rotate-[8deg] xl:left-12",
    icon: <ShieldBadgeIcon />,
    tone: brandColors.primary,
    width: "w-[178px]",
  },
  {
    title: "XP HARI INI",
    value: "+150 poin",
    position: "right-4 top-10 rotate-[5deg] xl:right-10",
    icon: <BoltBadgeIcon />,
    tone: "#2dbf57",
    width: "w-[178px]",
  },
  {
    title: "XP TOTAL",
    value: "4,280",
    position: "right-6 top-[44%] rotate-[8deg] xl:right-12",
    icon: <BoltBadgeIcon />,
    tone: "#51c764",
    width: "w-[178px]",
  },
] as const;
