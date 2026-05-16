import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type AcquisitionIntent, productAnalyticsEvents } from "../lib/product-analytics";
import { useProductAnalytics } from "../lib/product-analytics-client";

gsap.registerPlugin(ScrollTrigger);

const brandColors = {
  primary: "#205072",
  primaryLight: "#2f79a5",
  primaryDark: "#153d5c",
  primaryDarker: "#0b2135",
  primarySoft: "#dcecf7",
  primaryTint: "#f1f7fb",
  sky: "#79b7d9",
} as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IlmoraX - Simulasi UKAI yang Terasa Seperti Ujian Asli" },
      {
        name: "description",
        content:
          "IlmoraX membantu calon apoteker mulai dari try-out, tahu kekurangan, lalu belajar dari pembahasan yang paling relevan.",
      },
      {
        property: "og:title",
        content: "IlmoraX - Simulasi UKAI yang Terasa Seperti Ujian Asli",
      },
      {
        property: "og:description",
        content:
          "Mulai dari try-out, ketahui bagian yang masih lemah, lalu isi kekurangannya lewat pembahasan yang tepat.",
      },
    ],
  }),
  component: LandingPage,
});

const heroMetrics = [
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

const heroNavItems = [
  { label: "Beranda", href: "#beranda" },
  { label: "Try-out", href: "#cara-kerja" },
  { label: "Peringkat", href: "#hasil" },
  // { label: "Lencana", href: "#lencana" },
  { label: "Harga", href: "#paket" },
  { label: "Tentang", href: "#tentang" },
] as const;

const popularTryouts = [
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

const weakTopics = [
  { label: "Farmakokinetik", value: "42%", width: "42%", tone: "#ff8f98" },
  { label: "Kardiovaskular", value: "35%", width: "35%", tone: "#ffb136" },
  { label: "Antibiotik", value: "28%", width: "28%", tone: "#b98af8" },
] as const;

const journeySteps = [
  {
    number: "01",
    title: "Try-out dulu",
    body: "Mulai dari simulasi yang terasa familiar supaya kamu tahu performa awalmu tanpa menebak-nebak.",
    accent: "Timer jelas",
  },
  {
    number: "02",
    title: "Ketahui kekurangan",
    body: "Hasilnya tidak berhenti di skor. Kamu langsung lihat topik mana yang paling sering meleset.",
    accent: "Topik lemah",
  },
  {
    number: "03",
    title: "Belajar dari pembahasan",
    body: "Setelah tahu gap-nya, lanjutkan belajar dari pembahasan yang memang relevan dengan hasil try-out tadi.",
    accent: "Belajar terarah",
  },
] as const;

const learningBadges = [
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

const focusCards = [
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

const resultTopics = [
  { label: "Kardiovaskular", value: "42%", width: "42%", tone: "#ff7a88", icon: <HeartLineIcon /> },
  { label: "Antibiotik & Antinfeksi", value: "58%", width: "58%", tone: "#b27cff", icon: <AtomIcon /> },
  { label: "Farmakologi Dasar", value: "67%", width: "67%", tone: "#69cf31", icon: <CapsuleIcon /> },
] as const;

const recommendedActions = [
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

const plans = [
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

const pricingPreviewTryouts = [
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

const premiumBenefits = [
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

const pricingTrustItems = [
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

const finalCalloutCards = [
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

const useSafeLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
const defaultActiveNavHref = heroNavItems[0].href;

type LandingLinkPath = "/tryout" | "/premium" | "/auth/login";
type LandingLinkEntryPoint =
  | "footer_cta"
  | "hero_primary"
  | "hero_secondary"
  | "landing_nav_login"
  | "landing_nav_signup"
  | "light_link"
  | "pricing_button"
  | "primary_link"
  | "secondary_link";

function getLandingLinkIntent(to: LandingLinkPath): AcquisitionIntent | undefined {
  if (to === "/tryout") {
    return "home_tryout";
  }

  if (to === "/auth/login") {
    return "home_signup";
  }

  return undefined;
}

function getLandingLinkEvent(intent: AcquisitionIntent | undefined) {
  if (intent === "home_tryout") {
    return productAnalyticsEvents.homeTryoutSelected;
  }

  if (intent === "home_signup") {
    return productAnalyticsEvents.homeSignupSelected;
  }

  return null;
}

function useLandingLinkAnalytics(to: LandingLinkPath, entryPoint: LandingLinkEntryPoint) {
  const analytics = useProductAnalytics();
  const intent = getLandingLinkIntent(to);
  const event = getLandingLinkEvent(intent);

  function trackLandingLinkClick() {
    if (!event) return;

    analytics.capture(event, {
      intent,
      source_path: "/",
      entry_point: entryPoint,
    });
  }

  return { intent, trackLandingLinkClick };
}

function LandingPage() {
  const pageRef = useRef<HTMLElement>(null);

  useSafeLayoutEffect(() => {
    if (!pageRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      const revealItems = gsap.utils.toArray<HTMLElement>(".landing-reveal");

      gsap.set(revealItems, {
        y: 40,
        opacity: 0,
        filter: "blur(10px)",
      });

      document.documentElement.removeAttribute("data-js");

      gsap.to(
        revealItems,
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.9,
          stagger: 0.07,
          ease: "power3.out",
          clearProps: "opacity,transform,filter",
        },
      );

      gsap.utils.toArray<HTMLElement>(".landing-panel").forEach((panel, index) => {
        gsap.fromTo(
          panel,
          { y: 48, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            delay: index * 0.04,
            ease: "power3.out",
            scrollTrigger: {
              trigger: panel,
              start: "top 84%",
            },
          },
        );
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <main
      ref={pageRef}
      className="w-full max-w-full overflow-x-hidden text-stone-900"
      style={{
        background:
          "radial-gradient(900px 460px at 0% 0%, rgba(155,228,222,0.55), transparent 54%), radial-gradient(780px 420px at 100% 2%, rgba(255,231,186,0.58), transparent 55%), linear-gradient(180deg, #fffdf9 0%, #f7fbf8 34%, #edf5ff 62%, #f7fbff 100%)",
        fontFamily:
          "'Geist', 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <FixedGrain />
      <LandingNav />
      <HeroSection />
      <JourneySection />
      <ProofSection />
      <PricingSection />
      <FooterCta />
    </main>
  );
}

function FixedGrain() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 opacity-[0.05]"
      style={{
        backgroundImage:
          "radial-gradient(rgba(23,44,52,0.16) 0.8px, transparent 0.8px)",
        backgroundSize: "20px 20px",
      }}
    />
  );
}

function LandingNav() {
  const loginAnalytics = useLandingLinkAnalytics("/auth/login", "landing_nav_login");
  const tryoutAnalytics = useLandingLinkAnalytics("/tryout", "landing_nav_signup");

  return (
    <header className="fixed inset-x-0 top-0 z-30 px-4 pt-5">
      <nav className="landing-reveal mx-auto flex w-full max-w-[1240px] items-center justify-between rounded-full border border-[rgba(214,234,228,0.95)] bg-[rgba(255,255,255,0.92)] px-3 py-3 shadow-[0_16px_42px_rgba(144,181,170,0.18)] backdrop-blur-2xl sm:px-4">
        <Link to="/" className="flex min-w-0 shrink items-center gap-3 no-underline">
          <BrandMark />
          <span className="whitespace-nowrap text-[17px] font-black tracking-tight text-[#1f2937]">
            Ilmora<span className="text-[var(--brand-primary)]">X</span>
          </span>
        </Link>

        <LandingNavMenu />

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/auth/login"
            search={{ intent: loginAnalytics.intent }}
            onClick={loginAnalytics.trackLandingLinkClick}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-[#dce9e4] bg-white px-3.5 py-2 text-[13px] font-semibold text-stone-900 no-underline shadow-[0_8px_18px_rgba(26,47,60,0.08)] transition-transform duration-200 hover:-translate-y-0.5 sm:px-5 sm:py-2.5"
          >
            Masuk
          </Link>
          <Link
            to="/tryout"
            search={{ intent: tryoutAnalytics.intent }}
            onClick={tryoutAnalytics.trackLandingLinkClick}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[var(--brand-primary)] px-3.5 py-2 text-[13px] font-semibold text-white no-underline shadow-[0_14px_28px_rgba(24,183,161,0.26)] transition-transform duration-200 hover:-translate-y-0.5 sm:px-5 sm:py-2.5"
          >
            Daftar Gratis
          </Link>
        </div>
      </nav>
    </header>
  );
}

function LandingNavMenu() {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeHref, setActiveHref] = useState<
    (typeof heroNavItems)[number]["href"]
  >(defaultActiveNavHref);
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  function updateIndicator(nextHref: string) {
    const menu = menuRef.current;

    if (!menu) {
      return;
    }

    const activeLink = menu.querySelector<HTMLAnchorElement>(
      `[data-nav-href="${nextHref}"]`,
    );

    if (!activeLink) {
      setIndicator((current) => ({ ...current, opacity: 0 }));
      return;
    }

    const menuBounds = menu.getBoundingClientRect();
    const linkBounds = activeLink.getBoundingClientRect();

    setIndicator({
      left: linkBounds.left - menuBounds.left,
      width: linkBounds.width,
      opacity: 1,
    });
  }

  function syncActiveHref() {
    const nextHref = window.location.hash || defaultActiveNavHref;
    const hasMatch = heroNavItems.some((item) => item.href === nextHref);

    if (!hasMatch) {
      setActiveHref(defaultActiveNavHref);
      return;
    }

    setActiveHref(nextHref as (typeof heroNavItems)[number]["href"]);
  }

  function getActiveHrefFromScroll() {
    const scanLine = window.innerHeight * 0.36;
    let nextHref: (typeof heroNavItems)[number]["href"] = defaultActiveNavHref;

    for (const item of heroNavItems) {
      const section = document.getElementById(item.href.replace("#", ""));

      if (!section) {
        continue;
      }

      const bounds = section.getBoundingClientRect();

      if (bounds.top <= scanLine && bounds.bottom > scanLine) {
        return item.href;
      }

      if (bounds.top <= scanLine) {
        nextHref = item.href;
      }
    }

    return nextHref;
  }

  function syncActiveHrefFromScroll() {
    setActiveHref(getActiveHrefFromScroll());
  }

  function handleNavClick(
    event: MouseEvent<HTMLAnchorElement>,
    href: (typeof heroNavItems)[number]["href"],
  ) {
    const targetId = href.replace("#", "");
    const target = document.getElementById(targetId);

    setActiveHref(href);

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", href);
  }

  useEffect(() => {
    syncActiveHref();

    window.addEventListener("hashchange", syncActiveHref);

    return () => {
      window.removeEventListener("hashchange", syncActiveHref);
    };
  }, []);

  useEffect(() => {
    let animationFrame = 0;

    function requestActiveSync() {
      if (animationFrame) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        syncActiveHrefFromScroll();
      });
    }

    syncActiveHrefFromScroll();

    window.addEventListener("scroll", requestActiveSync, { passive: true });
    window.addEventListener("resize", requestActiveSync);

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }

      window.removeEventListener("scroll", requestActiveSync);
      window.removeEventListener("resize", requestActiveSync);
    };
  }, []);

  useSafeLayoutEffect(() => {
    updateIndicator(activeHref);
  }, [activeHref]);

  useEffect(() => {
    function handleResize() {
      updateIndicator(activeHref);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [activeHref]);

  return (
    <div ref={menuRef} className="relative hidden items-center gap-1 md:flex">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 h-[3px] rounded-full bg-[var(--brand-primary)] transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: `${indicator.width}px`,
          opacity: indicator.opacity,
          transform: `translateX(${indicator.left}px)`,
        }}
      />

      {heroNavItems.map((item) => {
        const isActive = item.href === activeHref;

        return (
          <a
            key={item.label}
            data-nav-href={item.href}
            href={item.href}
            onClick={(event) => handleNavClick(event, item.href)}
            className={`relative rounded-full px-4 py-3 text-[13px] font-semibold no-underline transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isActive
                ? "text-[var(--brand-primary)]"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {item.label}
          </a>
        );
      })}
    </div>
  );
}

function HeroSection() {
  return (
    <section
      id="beranda"
      className="relative scroll-mt-32 overflow-hidden px-4 pb-24 pt-32 sm:px-6 md:pb-28 md:pt-40"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-6 h-[360px] w-[360px] rounded-full border border-white/70" />
        <div className="absolute right-[-140px] top-8 h-[620px] w-[620px] rounded-full border border-white/70" />
        <div className="absolute left-[12%] top-[126px] h-[96px] w-[96px] rounded-full bg-[radial-gradient(circle,_rgba(146,211,201,0.28)_0%,_transparent_72%)]" />
        <div className="absolute left-[11%] top-[146px] h-[86px] w-[86px] opacity-40" style={{ backgroundImage: "radial-gradient(#9ccfc5 1px, transparent 1px)", backgroundSize: "12px 12px" }} />
        <div className="absolute bottom-[-120px] left-[-120px] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,_rgba(255,222,169,0.55)_0%,_transparent_70%)]" />
      </div>

      <div className="mx-auto grid w-full max-w-[1240px] items-start gap-14 lg:grid-cols-[1.04fr_0.96fr]">
        <div className="landing-reveal">
          <span className="inline-flex items-center gap-3 rounded-full bg-[var(--brand-primary-tint)] px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--brand-primary-dark)] shadow-[inset_0_0_0_1px_rgba(24,183,161,0.08)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-primary)]" />
            Platform latihan UKAI
          </span>

          <h1 className="mt-7 max-w-[12ch] text-[clamp(2.9rem,5.3vw,4.95rem)] font-[780] leading-[0.93] tracking-[-0.05em] text-[#202124]">
            Simulasi UKAI yang terasa seperti{" "}
            <span className="text-[var(--brand-primary-dark)]">ujian asli</span>
          </h1>

          <p className="mt-5 max-w-[40ch] text-[16px] font-medium leading-relaxed text-stone-600 sm:text-[17px]">
            Latihan dengan ribuan soal berkualitas, timer realistis,
            pembahasan mendalam, dan evaluasi pintar untuk persiapan UKAI
            terbaikmu.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <HeroPrimaryLink to="/tryout">Lihat Try-out</HeroPrimaryLink>
            <HeroSecondaryLink to="/auth/login">Masuk</HeroSecondaryLink>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {heroMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[1.4rem] border border-[#dcece6] bg-white px-4 py-4 shadow-[0_14px_30px_rgba(34,67,55,0.08)]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: metric.tone, color: metric.accent }}
                  >
                    {metric.icon}
                  </div>
                  <div>
                    <div
                      className="text-[34px] font-black leading-none tracking-tight"
                      style={{ color: metric.accent }}
                    >
                      {metric.value}
                    </div>
                    <div className="mt-1 text-[13px] font-semibold text-stone-600">
                      {metric.label}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-reveal lg:pl-2">
          <HeroProductFrame />
        </div>
      </div>
    </section>
  );
}

function HeroProductFrame() {
  return (
    <div className="landing-panel rounded-[2rem] border border-[#d7ece6] bg-[rgba(255,255,255,0.72)] p-3 shadow-[0_26px_80px_rgba(127,170,155,0.2)] backdrop-blur-xl">
      <div className="rounded-[1.8rem] border border-[#dcefeb] bg-[#fcfefd] p-4 text-stone-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.9)]">
        <div className="rounded-[1.6rem] border border-[#e6f2ee] bg-white p-5 shadow-[0_16px_32px_rgba(116,160,145,0.08)]">
          <div className="flex items-center justify-between gap-4 border-b border-[#edf4f1] pb-4">
            <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-stone-500">
              Try-out terpopuler
            </div>
            <a href="#cara-kerja" className="text-[13px] font-bold text-[var(--brand-primary-dark)] no-underline">
              Lihat semua
            </a>
          </div>

          <div className="mt-4 grid gap-3">
            {popularTryouts.map((item) => (
              <DashboardTryoutCard key={item.title} item={item} />
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
          <DashboardMiniCard
            title="Timer realistis"
            icon={<ClockIcon />}
            iconColor="#2bc2b0"
          >
            <TimerRing />
          </DashboardMiniCard>

          <DashboardMiniCard
            title="Topik perlu ditingkatkan"
            icon={<TargetIcon />}
            iconColor="#ff5d6f"
          >
            <div className="mt-1 space-y-4">
              {weakTopics.map((topic) => (
                <TopicProgress key={topic.label} topic={topic} />
              ))}
            </div>

            <a
              href="#hasil"
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[var(--brand-primary-tint)] px-4 py-3 text-[14px] font-bold text-[var(--brand-primary-dark)] no-underline"
            >
              Lihat analisis lengkap
            </a>
          </DashboardMiniCard>
        </div>

        <div className="mt-4 flex flex-col gap-4 rounded-[1.5rem] border border-[#d7ece6] bg-[linear-gradient(180deg,#fbfffe_0%,#f6fffd_100%)] px-5 py-4 shadow-[0_10px_24px_rgba(130,174,160,0.08)] md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-primary-tint)] text-[var(--brand-primary)]">
              <SparkIcon />
            </div>
            <div>
              <div className="text-[15px] font-bold text-[var(--brand-primary-dark)]">
                Evaluasi cerdas, rekomendasi personal
              </div>
              <p className="mt-1 text-[15px] text-stone-600">
                Fokus pada materi yang perlu kamu kuasai.
              </p>
            </div>
          </div>

          <a
            href="#cara-kerja"
            className="inline-flex items-center justify-center rounded-full border border-[#95d8ce] px-5 py-3 text-[14px] font-bold text-[var(--brand-primary-dark)] no-underline"
          >
            Pelajari cara kerja
          </a>
        </div>
      </div>
    </div>
  );
}

function DashboardTryoutCard({
  item,
}: {
  item: (typeof popularTryouts)[number];
}) {
  return (
    <div className="flex items-center gap-4 rounded-[1.25rem] border border-[#e8f2ee] bg-white px-4 py-3.5 shadow-[0_10px_22px_rgba(138,178,164,0.08)]">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-[1rem]"
        style={{ background: item.tone, color: item.accent }}
      >
        {item.icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-[15px] font-bold tracking-tight text-stone-800">
            {item.title}
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-black tracking-[0.06em]"
            style={{ background: item.tone, color: item.accent }}
          >
            {item.pill}
          </span>
        </div>
        <div className="mt-1 text-[14px] text-stone-500">{item.meta}</div>
      </div>

      <div className="text-stone-300">
        <ChevronRightIcon />
      </div>
    </div>
  );
}

function DashboardMiniCard({
  title,
  icon,
  iconColor,
  children,
}: {
  title: string;
  icon: ReactNode;
  iconColor: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.55rem] border border-[#dcefeb] bg-white p-5 shadow-[0_14px_28px_rgba(129,170,156,0.08)]">
      <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em] text-stone-500">
        <span style={{ color: iconColor }}>{icon}</span>
        {title}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function TimerRing() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-40 w-40">
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="56"
            fill="none"
            stroke="#e6f4f1"
            strokeWidth="10"
          />
          <circle
            cx="80"
            cy="80"
            r="56"
            fill="none"
            stroke="url(#timer-ring)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="280 352"
          />
          <defs>
            <linearGradient id="timer-ring" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="var(--brand-primary-light)" />
              <stop offset="100%" stopColor="var(--brand-sky)" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[18px] font-black tracking-tight text-stone-800">
            29:48
          </div>
          <div className="mt-1 text-[14px] text-stone-500">Sisa waktu</div>
        </div>
      </div>

      <div className="mt-3 rounded-full bg-[var(--brand-primary-tint)] px-4 py-2 text-[12px] font-black tracking-[0.08em] text-[var(--brand-primary-dark)]">
        30 MENIT
      </div>
    </div>
  );
}

function TopicProgress({
  topic,
}: {
  topic: (typeof weakTopics)[number];
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-[15px]">
        <span className="font-medium text-stone-700">{topic.label}</span>
        <span className="font-bold text-stone-600">{topic.value}</span>
      </div>
      <div className="h-2.5 rounded-full bg-[#f5efe5]">
        <div
          className="h-full rounded-full"
          style={{ width: topic.width, background: topic.tone }}
        />
      </div>
    </div>
  );
}

function JourneySection() {
  return (
    <section
      id="cara-kerja"
      className="relative scroll-mt-32 px-4 py-24 text-stone-900 sm:px-6 md:py-32"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[14%] top-[6%] h-[320px] w-[320px] rounded-full border border-[rgba(181,228,221,0.55)]" />
        <div className="absolute right-[-140px] top-[18%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_rgba(227,247,243,0.72)_0%,_transparent_68%)]" />
        <div
          className="absolute bottom-[8%] left-[3%] h-[120px] w-[120px] opacity-35"
          style={{ backgroundImage: "radial-gradient(#a6d9cf 1.2px, transparent 1.2px)", backgroundSize: "12px 12px" }}
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-[1240px] gap-12 lg:grid-cols-[1fr_1.16fr] lg:items-start">
        <div className="landing-panel pt-6 lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-center gap-3 text-[12px] font-black uppercase tracking-[0.18em] text-[var(--brand-primary)]">
            <span className="h-3.5 w-3.5 rounded-full bg-[var(--brand-primary)]" />
            Cara belajar
          </div>

          <h2 className="mt-7 max-w-[12.5ch] text-[clamp(2.6rem,4.3vw,4.35rem)] font-[720] leading-[0.98] tracking-[-0.045em] text-[#202124]">
            Try-out dulu. Tahu yang kurang. Isi dari pembahasan.
          </h2>

          <p className="mt-6 max-w-[34ch] text-[17px] leading-[1.8] text-stone-500">
            IlmoraX membantu kamu belajar lebih efektif dengan alur yang terbukti:
            uji kemampuan, temukan titik lemah, dan perbaiki dengan pembahasan
            yang lengkap.
          </p>

          <div id="lencana" className="mt-10 grid scroll-mt-32 gap-1 sm:grid-cols-3">
            {learningBadges.map((badge) => (
              <div
                key={badge.title}
                className="rounded-md border border-[#e8eeeb] bg-white px-3 py-4 shadow-[0_14px_30px_rgba(110,156,143,0.08)]"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
                    style={{
                      background: badge.tone,
                      color: badge.accent,
                      borderColor: `${badge.accent}22`,
                    }}
                  >
                    {badge.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[17px] font-bold text-stone-800">
                      {badge.title}
                    </div>
                    <div className="mt-1.5 text-[13px] leading-relaxed text-stone-500">
                      {badge.body}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-4 rounded-[1.45rem] border border-[#bce8e0] bg-[linear-gradient(180deg,#f8fffd_0%,#f3fffc_100%)] px-5 py-5 shadow-[0_16px_36px_rgba(110,170,153,0.08)]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-[var(--brand-primary)] text-white shadow-[0_12px_24px_rgba(24,183,161,0.22)]">
              <BarChartIcon />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[16px] text-stone-600">
                Ribuan calon apoteker sudah merasakan bedanya.
              </div>
              <div className="mt-1 text-[16px] font-bold text-[var(--brand-primary-dark)]">
                Sekarang giliranmu!
              </div>
            </div>
            <div className="hidden text-[#8cd9cb] sm:block">
              <TrendingUpIcon />
            </div>
          </div>
        </div>

        <div className="grid gap-5">
          {journeySteps.map((step) => (
            <JourneyStepCard key={step.number} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProofSection() {
  return (
    <section
      id="hasil"
      className="relative scroll-mt-32 px-4 pb-24 text-stone-900 sm:px-6 md:pb-32"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[52%] top-[4%] h-[240px] w-[240px] rounded-full bg-[radial-gradient(circle,_rgba(228,247,243,0.85)_0%,_transparent_68%)]" />
        <div className="absolute right-[4%] top-[1%] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,_rgba(255,239,210,0.72)_0%,_transparent_72%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1240px]">
        <div className="landing-panel">
          <span className="inline-flex items-center gap-3 rounded-full bg-[var(--brand-primary-tint)] px-5 py-3 text-[12px] font-black uppercase tracking-[0.16em] text-[var(--brand-primary)] shadow-[inset_0_0_0_1px_rgba(24,183,161,0.08)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-primary)]" />
            Hasil belajar
          </span>

          <h2 className="mt-7 max-w-[11ch] text-[clamp(2.9rem,5vw,5rem)] font-[740] leading-[0.98] tracking-[-0.05em] text-[#202124]">
            Hasil try-out tidak berhenti di angka skor
          </h2>

          <p className="mt-6 max-w-[36ch] text-[18px] leading-[1.75] text-stone-500">
            IlmoraX memberikan analisis yang lengkap dan mudah dipahami agar
            setiap latihan jadi langkah nyata menuju kelulusan UKAI.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <ResultAnalyticsCard />

          <div className="grid gap-5">
            {focusCards.map((card) => (
              <ResultFeatureCard key={card.title} card={card} />
            ))}

            <div className="landing-panel flex items-center gap-4 rounded-[1.6rem] border border-[#cceee7] bg-[linear-gradient(180deg,#f7fffd_0%,#f2fdfb_100%)] px-5 py-4 shadow-[0_14px_30px_rgba(112,174,160,0.08)]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-tint)] text-[var(--brand-primary)]">
                <ShieldBadgeIcon />
              </div>
              <p className="text-[16px] leading-relaxed text-stone-500">
                Semua hasil disimpan aman di akunmu dan bisa diakses kapan saja.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultAnalyticsCard() {
  return (
    <article className="landing-panel rounded-[2.1rem] border border-[#dcefeb] bg-white p-6 shadow-[0_18px_46px_rgba(120,165,152,0.1)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.2rem] bg-[var(--brand-primary-tint)] text-[var(--brand-primary)]">
            <LargeStepIcon><FlaskIcon /></LargeStepIcon>
          </div>
          <div>
            <div className="text-[17px] font-bold text-stone-800">UKAI Tryout 1</div>
            <div className="mt-1 text-[15px] text-stone-500">
              Selesai dikerjakan hari ini • 30 menit
            </div>
          </div>
        </div>

        <span className="rounded-full bg-[var(--brand-primary-tint)] px-4 py-2 text-[13px] font-bold text-[var(--brand-primary)]">
          KLINIS
        </span>
      </div>

      <div className="mt-6 rounded-[1.7rem] border border-[#d6efea] bg-[linear-gradient(180deg,#fafdfe_0%,#fbfffd_100%)] p-5">
        <div className="grid gap-5 md:grid-cols-[1fr_1fr_1fr_116px] md:items-center">
          <MetricBlock label="SKOR ANDA" value="86" suffix="/100" subtext="Di atas rata-rata" tone="var(--brand-primary)" />
          <MetricBlock label="PERSENTIL" value="78" suffix="/100" subtext="Lebih baik dari 78% peserta" />
          <MetricBlock label="PERINGKAT" value="#12" subtext="dari 1.248 peserta" />
          <div className="flex justify-center md:justify-end">
            <div className="flex h-24 w-24 items-center justify-center rounded-[1.6rem] bg-[linear-gradient(180deg,var(--brand-primary-tint)_0%,#f8fffd_100%)] text-[var(--brand-primary)] shadow-[0_12px_24px_rgba(120,180,164,0.12)]">
              <ShieldCheckIcon />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.6rem] border border-[#edf0ef] bg-white p-5">
          <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.04em] text-stone-500">
            Topik perlu ditingkatkan
            <InfoIcon />
          </div>

          <div className="mt-5 space-y-5">
            {resultTopics.map((topic) => (
              <ResultTopicRow key={topic.label} topic={topic} />
            ))}
          </div>

          <a href="#paket" className="mt-6 inline-flex items-center gap-2 text-[15px] font-bold text-[var(--brand-primary)] no-underline">
            Lihat analisis lengkap
            <ArrowUpRightIcon />
          </a>
        </div>

        <div className="rounded-[1.6rem] border border-[#edf0ef] bg-white p-5">
          <div className="text-[13px] font-bold uppercase tracking-[0.04em] text-stone-500">
            Rekomendasi untukmu
          </div>

          <div className="mt-4 grid gap-3">
            {recommendedActions.map((item) => (
              <RecommendedActionCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-[1.6rem] border border-[#edf0ef] bg-white p-5 sm:grid-cols-3">
        <MiniResultStat icon={<FlameIcon />} tone="#f59a1b" label="STREAK HARIAN" value="7" suffix="hari" />
        <MiniResultStat icon={<BoltBadgeIcon />} tone="#69cf31" label="XP DIDAPATKAN" value="+860" suffix="XP" />
        <MiniResultStat icon={<ClockIcon />} tone="#2892f5" label="AKURASI" value="86%" suffix="Benar" />
      </div>
    </article>
  );
}

function ResultFeatureCard({
  card,
}: {
  card: (typeof focusCards)[number];
}) {
  return (
    <article className="landing-panel rounded-[1.9rem] border border-[#e5ece9] bg-white p-6 shadow-[0_16px_38px_rgba(120,165,152,0.08)]">
      <div className="flex flex-col items-start gap-5 sm:flex-row">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.4rem] border sm:h-24 sm:w-24 sm:rounded-[1.6rem]"
          style={{ background: card.tone, color: card.accent, borderColor: `${card.accent}20` }}
        >
          <LargeStepIcon>{card.icon}</LargeStepIcon>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="rounded-xl px-3 py-1.5 text-[16px] font-black"
              style={{ background: `${card.accent}12`, color: card.accent }}
            >
              {card.number}
            </span>
            <h3 className="text-[22px] font-bold tracking-tight text-stone-800">
              {card.title}
            </h3>
          </div>

          <p className="mt-4 max-w-[33ch] text-[16px] leading-[1.72] text-stone-500">
            {card.body}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {card.chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border px-3 py-2 text-[13px] font-semibold"
                style={{ color: card.accent, background: `${card.accent}10`, borderColor: `${card.accent}22` }}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function MetricBlock({
  label,
  value,
  suffix,
  subtext,
  tone,
}: {
  label: string;
  value: string;
  suffix?: string;
  subtext: string;
  tone?: string;
}) {
  return (
    <div className="min-w-0 md:border-r md:border-[#e2efea] md:pr-5 last:md:border-r-0">
      <div className="text-[13px] font-bold uppercase tracking-[0.04em] text-stone-400">
        {label}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-[52px] font-[760] leading-none tracking-[-0.05em] text-stone-800">
          {value}
        </span>
        {suffix ? (
          <span className="pb-1 text-[18px] font-semibold text-stone-400">
            {suffix}
          </span>
        ) : null}
      </div>
      <div
        className="mt-3 text-[15px]"
        style={{ color: tone ?? "#7b8791" }}
      >
        {subtext}
      </div>
    </div>
  );
}

function ResultTopicRow({
  topic,
}: {
  topic: (typeof resultTopics)[number];
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full border"
        style={{ color: topic.tone, background: `${topic.tone}12`, borderColor: `${topic.tone}20` }}
      >
        {topic.icon}
      </div>
      <div>
        <div className="text-[15px] font-semibold text-stone-700">{topic.label}</div>
        <div className="mt-2 h-1.5 rounded-full bg-[#f1ece8]">
          <div className="h-full rounded-full" style={{ width: topic.width, background: topic.tone }} />
        </div>
      </div>
      <div className="text-[15px] font-bold text-stone-500">{topic.value}</div>
    </div>
  );
}

function RecommendedActionCard({
  item,
}: {
  item: (typeof recommendedActions)[number];
}) {
  return (
    <div className="flex items-center gap-3 rounded-[1.25rem] border border-[#edf0ef] bg-[#fcfdfd] px-4 py-3">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full"
        style={{ background: item.tone, color: item.accent }}
      >
        {item.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[16px] font-semibold text-stone-700">{item.title}</div>
        <div className="mt-1 text-[14px] text-stone-500">{item.meta}</div>
      </div>
      <span className="text-stone-300">
        <ChevronRightIcon />
      </span>
    </div>
  );
}

function MiniResultStat({
  icon,
  tone,
  label,
  value,
  suffix,
}: {
  icon: ReactNode;
  tone: string;
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <div className="flex items-center gap-4 sm:border-r sm:border-[#edf0ef] sm:pr-4 last:sm:border-r-0">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
        style={{ background: `${tone}12`, color: tone }}
      >
        {icon}
      </div>
      <div>
        <div className="text-[13px] font-bold uppercase tracking-[0.04em] text-stone-400">
          {label}
        </div>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-[24px] font-bold tracking-tight text-stone-800">{value}</span>
          <span className="pb-0.5 text-[15px] text-stone-500">{suffix}</span>
        </div>
      </div>
    </div>
  );
}

function JourneyStepCard({
  step,
}: {
  step: (typeof journeySteps)[number];
}) {
  const cardTone =
    step.number === "01"
      ? {
          border: "#cdeee7",
          glow: "rgba(35,191,174,0.22)",
          tileBg: "var(--brand-primary-tint)",
          tileColor: "#1db39d",
          pillBg: "var(--brand-primary-tint)",
          pillColor: "#1db39d",
        }
      : step.number === "02"
        ? {
            border: "#ffdadd",
            glow: "rgba(255,121,133,0.18)",
            tileBg: "#fff0f2",
            tileColor: "#ff6876",
            pillBg: "#fff0f2",
            pillColor: "#ff6876",
          }
        : {
            border: "#ead7ff",
            glow: "rgba(181,120,255,0.18)",
            tileBg: "#f5ecff",
            tileColor: "#b272ff",
            pillBg: "#f5ecff",
            pillColor: "#a967ff",
          };

  return (
    <article
      className="landing-panel overflow-hidden rounded-[2rem] border bg-white p-6 shadow-[0_16px_42px_rgba(110,156,143,0.08)]"
      style={{
        borderColor: cardTone.border,
        boxShadow: `0 16px 42px rgba(110,156,143,0.08), inset 0 -3px 0 ${cardTone.glow}`,
      }}
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(290px,340px)] lg:items-start xl:grid-cols-[minmax(0,1fr)_minmax(310px,360px)]">
        <div className="min-w-0">
          <div className="flex items-start">
            {/* <div
              className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-md border"
              style={{ background: cardTone.tileBg, color: cardTone.tileColor, borderColor: cardTone.border }}
            >
              {step.number === "01" ? (
                <LargeStepIcon><FlaskIcon /></LargeStepIcon>
              ) : step.number === "02" ? (
                <LargeStepIcon><HeartLineIcon /></LargeStepIcon>
              ) : (
                <LargeStepIcon><BookOpenIcon /></LargeStepIcon>
              )}
            </div> */}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="rounded-xl px-3 py-1.5 text-[16px] font-black"
                  style={{ background: cardTone.pillBg, color: cardTone.pillColor }}
                >
                  {step.number}
                </span>
                <h3 className="text-[23px] font-bold leading-tight tracking-tight text-stone-800 sm:text-[25px]">
                  {step.title === "Ketahui kekurangan" ? "Lihat titik lemah" : step.title === "Belajar dari pembahasan" ? "Belajar lebih terarah" : "Mulai simulasi"}
                </h3>
              </div>

              <p className="mt-5 max-w-[28ch] text-[16px] leading-[1.72] text-stone-500 sm:text-[17px]">
                {step.number === "01"
                  ? "Kerjakan try-out dengan timer dan suasana ujian yang mirip asli. Fokus, tenang, dan beri yang terbaik!"
                  : step.number === "02"
                    ? "Hasil langsung menunjukkan topik yang masih lemah agar kamu tahu bagian mana yang perlu diprioritaskan."
                    : "Baca pembahasan lengkap dan ikuti rekomendasi materi untuk memperbaiki pemahaman dan naik level lebih cepat."}
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          {step.number === "01" ? (
            <SimulationPreview />
          ) : step.number === "02" ? (
            <WeakTopicPreview />
          ) : (
            <RecommendationPreview />
          )}
        </div>
      </div>
    </article>
  );
}

function SimulationPreview() {
  return (
    <div className="rounded-[1.55rem] border border-[#dcefeb] bg-[linear-gradient(180deg,#f7fffd_0%,#fbfffe_100%)] p-4 shadow-[0_10px_24px_rgba(114,170,156,0.08)]">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1rem] border border-[#e7efec] bg-white px-4 py-3">
          <div className="text-[13px] text-stone-500">Sisa Waktu</div>
          <div className="mt-2 flex items-end gap-2 text-stone-800">
            <span className="text-[18px] font-black">29 : 45</span>
            <span className="pb-0.5 text-[13px] text-stone-500">menit</span>
          </div>
        </div>
        <div className="rounded-[1rem] border border-[#e7efec] bg-white px-4 py-3">
          <div className="text-[13px] text-stone-500">Soal ke</div>
          <div className="mt-2 flex items-end justify-between gap-2">
            <span className="text-[18px] font-black text-stone-800">12 / 20</span>
            <span className="text-[var(--brand-primary)]">
              <MenuGridIcon />
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-6 gap-2">
        {["7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"].map((item) => {
          const isAnswered = ["7", "8", "9", "10", "11", "12"].includes(item);
          const isPending = ["13", "14"].includes(item);

          return (
            <div
              key={item}
              className="flex h-10 items-center justify-center rounded-full border text-[13px] font-bold"
              style={{
                background: isAnswered ? (item === "12" ? "var(--brand-primary)" : "#eefaf7") : isPending ? "#fff4f5" : "#ffffff",
                color: isAnswered ? (item === "12" ? "#ffffff" : "#15a390") : isPending ? "#ff7d89" : "#777777",
                borderColor: isAnswered ? "#bce8df" : isPending ? "#ffd7dc" : "#e5ece9",
              }}
            >
              {item}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-stone-500">
        <LegendItem tone="var(--brand-primary)" label="Terjawab" />
        <LegendItem tone="#f4ab2c" label="Ragu-ragu" />
        <LegendItem tone="#ff7b88" label="Belum dijawab" />
      </div>
    </div>
  );
}

function WeakTopicPreview() {
  const rows = [
    { label: "Farmakologi", value: "42%", width: "42%", tone: "#ff6b78", icon: <PillBottleIcon /> },
    { label: "Kardiovaskular", value: "58%", width: "58%", tone: "#ff8e2a", icon: <HeartLineIcon /> },
    { label: "Antibiotik & Antinfeksi", value: "63%", width: "63%", tone: "#f0aa30", icon: <SparkBadgeIcon /> },
    { label: "Farmasi Klinik Lanjut", value: "82%", width: "82%", tone: "#70cc45", icon: <LockBadgeIcon /> },
  ] as const;

  return (
    <div className="rounded-[1.55rem] border border-[#ffe3e6] bg-[linear-gradient(180deg,#fffefe_0%,#fffaf9_100%)] p-4 shadow-[0_10px_24px_rgba(255,135,145,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div className="text-[16px] font-bold text-stone-800">Topik Terlemah</div>
        <div className="max-w-[150px] truncate rounded-full border border-[#f3ece8] bg-white px-3 py-1 text-[11px] text-stone-400">
          Berdasarkan akurasi
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl border"
              style={{ color: row.tone, background: `${row.tone}12`, borderColor: `${row.tone}24` }}
            >
              {row.icon}
            </div>
            <div>
              <div className="text-[15px] font-semibold text-stone-700">{row.label}</div>
              <div className="mt-2 h-1.5 rounded-full bg-[#f4ece8]">
                <div className="h-full rounded-full" style={{ width: row.width, background: row.tone }} />
              </div>
            </div>
            <div className="text-[14px] font-bold" style={{ color: row.tone }}>
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationPreview() {
  const chips = [
    { label: "Ringkasan Materi", tone: brandColors.primary, bg: brandColors.primaryTint },
    { label: "Latihan Topik", tone: "#2d9cff", bg: "#edf5ff" },
    { label: "Video Pembahasan", tone: "#f0a22c", bg: "#fff4df" },
    { label: "Soal Sejenis", tone: "#a86bff", bg: "#f5ecff" },
  ] as const;

  return (
    <div className="rounded-[1.55rem] border border-[#eee0ff] bg-[linear-gradient(180deg,#fbf8ff_0%,#ffffff_100%)] p-4 shadow-[0_10px_24px_rgba(177,120,255,0.08)]">
      <div className="rounded-[1.1rem] border border-[#efe8f9] bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[14px] font-bold text-stone-700">
              <span className="text-[#4aa4ff]">
                <NoteIcon />
              </span>
              Pembahasan
            </div>
            <p className="mt-2 max-w-[31ch] text-[14px] leading-relaxed text-stone-500">
              ACE inhibitor bekerja dengan menghambat enzim ACE sehingga
              menurunkan angiotensin II dan menurunkan tekanan darah.
            </p>
          </div>
          <span className="text-stone-300">
            <ChevronRightIcon />
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-[1.1rem] border border-[#efe8f9] bg-white px-4 py-4">
        <div className="text-[14px] font-bold text-stone-700">Rekomendasi untukmu</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="rounded-full border px-3 py-2 text-[13px] font-semibold"
              style={{ color: chip.tone, background: chip.bg, borderColor: `${chip.tone}24` }}
            >
              {chip.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PricingSection() {
  return (
    <section
      id="paket"
      className="relative scroll-mt-32 px-4 pb-24 text-stone-900 sm:px-6 md:pb-32"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-[360px] w-[360px] bg-[radial-gradient(circle,_rgba(255,226,173,0.72)_0%,_transparent_70%)]" />
        <div className="absolute left-[6%] top-[24%] text-[var(--brand-primary)] opacity-90">
          <SparkIcon />
        </div>
        <div className="absolute right-[12%] top-[12%] text-[#f5b12e] opacity-90">
          <SparkIcon />
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[1240px]">
        <div className="landing-panel">
          <span className="inline-flex items-center gap-3 rounded-full bg-[var(--brand-primary-tint)] px-5 py-3 text-[12px] font-black uppercase tracking-[0.16em] text-[var(--brand-primary)] shadow-[inset_0_0_0_1px_rgba(24,183,161,0.08)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-primary)]" />
            Paket belajar
          </span>

          <h2 className="mt-7 max-w-[14ch] text-[clamp(2.8rem,4.8vw,4.7rem)] font-[740] leading-[0.98] tracking-[-0.05em] text-[#202124]">
            Mulai gratis, lanjut fokus ke bagian yang paling butuh dikejar
          </h2>

          <p className="mt-6 max-w-[42ch] text-[18px] leading-[1.75] text-stone-500">
            Semua fitur dirancang untuk membantumu siap UKAI dengan cara yang
            terarah, terukur, dan menyenangkan.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <FreePricingCard />
          <PremiumPricingCard />
        </div>

        <div className="mt-6 grid gap-3 rounded-[1.8rem] border border-[#edf0ef] bg-white p-5 shadow-[0_16px_36px_rgba(122,164,151,0.08)] md:grid-cols-4">
          {pricingTrustItems.map((item) => (
            <PricingTrustItem key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FreePricingCard() {
  const plan = plans[0];

  return (
    <article className="landing-panel rounded-[2.1rem] border border-[#cfeee8] bg-white p-5 shadow-[0_20px_44px_rgba(116,168,154,0.1)]">
      <div className="rounded-[1.7rem] bg-white p-4">
        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-[1.2rem] bg-[var(--brand-primary-tint)] text-[var(--brand-primary)] sm:h-18 sm:w-18 sm:rounded-[1.4rem]">
              <LargeStepIcon>{plan.icon}</LargeStepIcon>
            </div>
            <div className="min-w-0">
              <h3 className="text-[26px] font-bold tracking-tight text-stone-800 sm:text-[30px]">
                {plan.name}
              </h3>
              <p className="mt-2 max-w-[28ch] text-[16px] leading-[1.6] text-stone-500">
                {plan.description}
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit whitespace-nowrap rounded-full border border-[#bfece4] bg-[var(--brand-primary-tint)] px-4 py-2 text-[13px] font-bold text-[var(--brand-primary)]">
            {plan.badge}
          </span>
        </div>

        <ul className="mt-6 grid gap-0">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-3 border-b border-[#eef2f1] py-3 last:border-b-0"
            >
              <span className="text-[var(--brand-primary)]">
                <CheckCircleIcon />
              </span>
              <span className="text-[16px] text-stone-700">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-[1.55rem] border border-[#cfeee8] bg-[linear-gradient(180deg,#f9fffe_0%,#f5fffc_100%)] p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[15px] font-bold text-[var(--brand-primary-dark)]">
              Try-out yang tersedia
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-[#def7f1] px-3 py-1.5 text-[13px] font-bold text-[var(--brand-primary)]">
              4 modul
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
            {pricingPreviewTryouts.map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center rounded-[1.15rem] border border-[#e3eeea] bg-white px-3 py-3 text-center shadow-[0_8px_18px_rgba(131,170,157,0.06)]"
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: item.tone, color: item.accent }}
                >
                  {item.icon}
                </div>
                <div className="mt-2 flex min-h-[2.6em] items-center text-[14px] font-bold leading-[1.3] text-stone-800">
                  {item.title}
                </div>
                <div className="mt-0.5 text-[12.5px] text-stone-500">{item.meta}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <PricingPrimaryButton to={plan.to} theme="teal">
            <BookOpenIcon />
            {plan.cta}
          </PricingPrimaryButton>
        </div>
      </div>
    </article>
  );
}

function PremiumPricingCard() {
  const plan = plans[1];

  return (
    <article className="landing-panel relative overflow-hidden rounded-[2.1rem] border border-[#f2a60f] bg-[linear-gradient(180deg,#33281d_0%,#241c14_100%)] p-5 text-white shadow-[0_24px_60px_rgba(242,166,15,0.22)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ backgroundImage: "radial-gradient(rgba(242,177,46,0.55) 1px, transparent 1px)", backgroundSize: "14px 14px" }}
      />
      <div className="pointer-events-none absolute inset-x-8 bottom-0 h-20 bg-[radial-gradient(circle_at_bottom,_rgba(19,184,161,0.38),_transparent_65%)]" />

      <div className="relative rounded-[1.7rem] border border-[rgba(242,177,46,0.14)] bg-[rgba(255,255,255,0.03)] p-4">
        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-[1.2rem] border border-[rgba(242,177,46,0.32)] bg-[rgba(242,177,46,0.08)] text-[#f4bf4b] sm:h-18 sm:w-18 sm:rounded-[1.4rem]">
              <LargeStepIcon>{plan.icon}</LargeStepIcon>
            </div>
            <div className="min-w-0">
              <h3 className="text-[26px] font-bold tracking-tight text-[#ffd36d] sm:text-[30px]">
                {plan.name}
              </h3>
              <p className="mt-2 max-w-[30ch] text-[16px] leading-[1.6] text-white/78">
                {plan.description}
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit whitespace-nowrap rounded-full border border-[rgba(242,177,46,0.38)] bg-[rgba(242,177,46,0.12)] px-4 py-2 text-[13px] font-bold text-[#ffd36d]">
            {plan.badge}
          </span>
        </div>

        <ul className="mt-6 grid gap-0">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.08)] py-3 last:border-b-0"
            >
              <span className="text-[#f5be47]">
                <CheckCircleIcon />
              </span>
              <span className="text-[16px] text-white/88">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <div className="text-[15px] font-bold text-[#f4bf4b]">Keunggulan Premium</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {premiumBenefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-[1.15rem] border border-[rgba(242,177,46,0.14)] bg-[rgba(255,186,84,0.08)] px-3 py-4"
              >
                <div className="text-[#f4bf4b]">
                  {benefit.icon}
                </div>
                <div className="mt-4 text-[14px] font-bold text-[#ffd36d]">{benefit.title}</div>
                <div className="mt-2 text-[13px] leading-relaxed text-white/62">{benefit.body}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <PricingPrimaryButton to={plan.to} theme="gold">
            <CrownIcon />
            {plan.cta}
          </PricingPrimaryButton>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[14px] text-white/68">
          <LockBadgeIcon />
          Bisa dibatalkan kapan saja
        </div>
      </div>
    </article>
  );
}

function PricingTrustItem({
  item,
}: {
  item: (typeof pricingTrustItems)[number];
}) {
  return (
    <div className="flex items-center gap-4 md:border-r md:border-[#edf0ef] md:pr-4 last:md:border-r-0">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
        style={{ background: `${item.tone}12`, color: item.tone }}
      >
        {item.icon}
      </div>
      <div>
        <div className="text-[16px] font-bold text-stone-700">{item.title}</div>
        <div className="mt-1 text-[14px] text-stone-500">{item.body}</div>
      </div>
    </div>
  );
}

function PricingPrimaryButton({
  to,
  theme,
  children,
}: {
  to: "/tryout" | "/premium";
  theme: "teal" | "gold";
  children: ReactNode;
}) {
  const className =
    theme === "gold"
      ? "inline-flex w-full items-center justify-center gap-3 rounded-[1.2rem] bg-[#f4b844] px-6 py-5 text-[18px] font-black text-[#2d220f] no-underline shadow-[0_12px_22px_rgba(244,184,68,0.22)] transition-transform duration-200 hover:-translate-y-0.5"
      : "inline-flex w-full items-center justify-center gap-3 rounded-[1.2rem] bg-[var(--brand-primary)] px-6 py-5 text-[18px] font-black text-white no-underline shadow-[0_12px_22px_rgba(24,183,161,0.22)] transition-transform duration-200 hover:-translate-y-0.5";
  const { intent, trackLandingLinkClick } = useLandingLinkAnalytics(to, "pricing_button");

  return (
    <Link
      to={to}
      search={intent ? { intent } : undefined}
      onClick={trackLandingLinkClick}
      className={className}
    >
      {children}
    </Link>
  );
}

function FooterCta() {
  return (
    <footer id="tentang" className="scroll-mt-32 px-4 pb-14 sm:px-6">
      <div className="mx-auto max-w-[1240px] rounded-[2.8rem] border border-[#d7ece6] bg-[linear-gradient(180deg,#f8fbf8_0%,#eef8f5_100%)] p-4 shadow-[0_24px_54px_rgba(127,169,155,0.12)]">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[#bfe9de] bg-[linear-gradient(135deg,#ffd782_0%,#7bd6cf_44%,#5ca9ea_100%)] px-6 py-12 sm:px-8 md:px-12 md:py-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.45) 1px, transparent 1px)", backgroundSize: "14px 14px" }}
          />
          <div className="pointer-events-none absolute left-10 top-16 h-24 w-24 bg-[radial-gradient(circle,_rgba(255,255,255,0.9)_0%,_transparent_60%)]" />
          <div className="pointer-events-none absolute right-14 top-16 h-20 w-20 bg-[radial-gradient(circle,_rgba(241,255,238,0.95)_0%,_transparent_62%)]" />
          <div className="pointer-events-none absolute bottom-10 right-28 h-16 w-16 bg-[radial-gradient(circle,_rgba(255,255,255,0.9)_0%,_transparent_62%)]" />

          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            <div className="absolute left-[14%] top-[18%] h-24 w-28 rounded-full border border-dashed border-white/60 border-t-transparent border-r-transparent" />
            <div className="absolute right-[15%] top-[22%] h-24 w-28 rounded-full border border-dashed border-white/60 border-l-transparent border-b-transparent" />
            <div className="absolute left-[12%] bottom-[14%] h-20 w-32 rounded-full border border-dashed border-white/55 border-r-transparent border-t-transparent" />
            <div className="absolute right-[13%] bottom-[10%] h-24 w-28 rounded-full border border-dashed border-white/55 border-l-transparent border-t-transparent" />
          </div>

          {finalCalloutCards.map((card) => (
            <FloatingStatCard key={card.title} card={card} />
          ))}

          <div className="absolute bottom-[12%] left-4 z-10 hidden w-[240px] rotate-[-4deg] rounded-[1.8rem] border border-[#d9e8ea] bg-white px-5 py-4 shadow-[0_14px_36px_rgba(110,149,174,0.18)] lg:block xl:left-10">
            <div className="flex items-center justify-between gap-3 text-[12px] font-black uppercase tracking-[0.08em] text-stone-500">
              Pemimpin mingguan
              <span className="text-[#f4a620]">
                <TrophyLineIcon />
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["#1", "Dewi Rahayu", "5,420 XP"],
                ["#2", "Budi Santoso", "5,180 XP"],
                ["#3", "Rani Susanti", "4,960 XP"],
              ].map(([rank, name, xp], index) => (
                <div key={name} className="flex items-center gap-3">
                  <div className="w-8 text-[16px] font-black text-[#f4a620]">{rank}</div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff4df] text-[16px]">
                    {index === 0 ? "👩" : index === 1 ? "🧑" : "👱"}
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-stone-700">{name}</div>
                    <div className="text-[13px] text-stone-400">{xp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-[12%] right-4 z-10 hidden w-[240px] rotate-[4deg] rounded-[1.8rem] border border-[#d9e8ea] bg-white px-5 py-4 shadow-[0_14px_36px_rgba(110,149,174,0.18)] lg:block xl:right-10">            
            <div className="flex items-center justify-between gap-3 text-[12px] font-black uppercase tracking-[0.08em] text-stone-500">
              Lencana terbaru
              <span className="text-[#aa7bff]">
                <StarBadgeIcon />
              </span>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-18 w-18 items-center justify-center rounded-full bg-[linear-gradient(180deg,#def7f1_0%,#ffffff_100%)] shadow-[inset_0_0_0_6px_#67d0c1]">
                <div className="h-10 w-6 rounded-full bg-[linear-gradient(180deg,#d7d7d7_0%,#ffffff_100%)] shadow-[inset_0_0_0_1px_#bdbdbd]" />
              </div>
              <div className="min-w-0">
                <div className="text-[16px] font-bold text-stone-700">Pharmacy Novice Badge</div>
                <div className="mt-2 inline-flex rounded-full bg-[#f5ecff] px-3 py-1 text-[12px] font-semibold text-[#aa7bff]">
                  Baru diraih!
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-20 mx-auto max-w-[840px] rounded-[3rem] border border-[#c9ece6] bg-white px-6 py-12 text-center shadow-[0_24px_60px_rgba(111,160,173,0.18)] sm:px-10 md:px-14 md:py-16">
            <div className="text-[12px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)]">
              Langkah berikutnya
            </div>
            <h2
              className="mx-auto mt-5 max-w-[12ch] text-[clamp(2.35rem,4.4vw,4.1rem)] font-[680] leading-[1.02] tracking-[-0.04em] text-[#202124]"
              style={{
                fontFamily:
                  "'Plus Jakarta Sans', 'Geist', ui-sans-serif, system-ui, sans-serif",
              }}
            >
              Mulai dari try-out, lalu belajar dari yang masih kurang.
            </h2>
            <p className="mx-auto mt-6 max-w-[28ch] text-[18px] leading-[1.72] text-stone-500">
              Setiap latihan membawamu selangkah lebih dekat menuju UKAI. Terus
              konsisten, raih hasil terbaikmu!
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <FooterActionButton to="/tryout" variant="primary">
                <BookOpenIcon />
                Lihat Try-out
              </FooterActionButton>
              <FooterActionButton to="/auth/login" variant="secondary">
                <UserLineIcon />
                Masuk
              </FooterActionButton>
            </div>
          </div>

          <div className="relative mx-auto mt-7 max-w-[500px] rounded-[1.7rem] border border-[#bfe9de] bg-[rgba(255,255,255,0.88)] px-5 py-4 shadow-[0_12px_30px_rgba(110,149,174,0.14)]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fff1f4] text-[#ff7a88]">
                <HeartLineIcon />
              </div>
              <p className="text-[17px] leading-relaxed text-stone-500">
                Bergabung bersama <span className="font-bold text-[var(--brand-primary)]">25.000+</span> apoteker muda yang sedang berjuang meraih mimpi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FloatingStatCard({
  card,
}: {
  card: (typeof finalCalloutCards)[number];
}) {
  return (
    <div
      className={`absolute z-10 hidden rounded-[1.8rem] border border-[#d9e8ea] bg-white px-6 py-4 shadow-[0_14px_36px_rgba(110,149,174,0.18)] lg:block ${card.position} ${card.width}`}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
          style={{ background: `${card.tone}12`, color: card.tone }}
        >
          {card.icon}
        </div>
        <div>
          <div className="text-[12px] font-black uppercase tracking-[0.08em] text-stone-400">
            {card.title}
          </div>
          <div className="mt-1 text-[19px] font-bold text-stone-700">{card.value}</div>
        </div>
      </div>
    </div>
  );
}

function FooterActionButton({
  to,
  variant,
  children,
}: {
  to: "/tryout" | "/auth/login";
  variant: "primary" | "secondary";
  children: ReactNode;
}) {
  const className =
    variant === "primary"
      ? "inline-flex min-w-[280px] items-center justify-center gap-3 rounded-[1.35rem] bg-[var(--brand-primary)] px-8 py-5 text-[18px] font-black text-white no-underline shadow-[0_12px_24px_rgba(24,183,161,0.24)] transition-transform duration-200 hover:-translate-y-0.5"
      : "inline-flex min-w-[280px] items-center justify-center gap-3 rounded-[1.35rem] border border-[#c9ece6] bg-white px-8 py-5 text-[18px] font-black text-stone-800 no-underline shadow-[0_12px_24px_rgba(111,160,173,0.12)] transition-transform duration-200 hover:-translate-y-0.5";
  const { intent, trackLandingLinkClick } = useLandingLinkAnalytics(to, "footer_cta");

  return (
    <Link
      to={to}
      search={intent ? { intent } : undefined}
      onClick={trackLandingLinkClick}
      className={className}
    >
      {children}
    </Link>
  );
}

function SectionIntro({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <div className="landing-panel">
      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1e63ff]">
        {kicker}
      </div>
      <h2 className="mt-3 max-w-[14ch] text-[clamp(2.25rem,5vw,4.6rem)] font-black leading-[0.96] tracking-tight text-[#071a52]">
        {title}
      </h2>
      <p className="mt-5 max-w-[38ch] text-[15px] font-semibold leading-relaxed text-stone-600">
        {body}
      </p>
    </div>
  );
}

function InsightBar({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: string;
  width: string;
  tone: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[12px] font-black text-stone-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="rounded-full bg-[#edf5ff] p-1">
        <div
          className="h-3 rounded-full"
          style={{
            width,
            background: `linear-gradient(90deg, ${tone} 0%, rgba(255,255,255,0.92) 100%)`,
          }}
        />
      </div>
    </div>
  );
}

function PrimaryLink({
  to,
  children,
}: {
  to: "/tryout" | "/premium" | "/auth/login";
  children: ReactNode;
}) {
  const { intent, trackLandingLinkClick } = useLandingLinkAnalytics(to, "primary_link");

  return (
    <Link
      to={to}
      search={intent ? { intent } : undefined}
      onClick={trackLandingLinkClick}
      className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-[15px] font-black text-[#071a52] no-underline shadow-[0_18px_34px_rgba(255,255,255,0.18)] transition-transform duration-200 hover:-translate-y-0.5"
    >
      {children}
      <ArrowUpRightIcon />
    </Link>
  );
}

function HeroPrimaryLink({
  to,
  children,
}: {
  to: "/tryout" | "/premium" | "/auth/login";
  children: ReactNode;
}) {
  const { intent, trackLandingLinkClick } = useLandingLinkAnalytics(to, "hero_primary");

  return (
    <Link
      to={to}
      search={intent ? { intent } : undefined}
      onClick={trackLandingLinkClick}
      className="inline-flex items-center justify-center gap-3 rounded-[1.2rem] bg-[var(--brand-primary)] px-8 py-5 text-[17px] font-semibold text-white no-underline shadow-[0_14px_28px_rgba(24,183,161,0.24)] transition-transform duration-200 hover:-translate-y-0.5"
    >
      <BookFrameIcon />
      {children}
    </Link>
  );
}

function HeroSecondaryLink({
  to,
  children,
}: {
  to: "/tryout" | "/auth/login";
  children: ReactNode;
}) {
  const { intent, trackLandingLinkClick } = useLandingLinkAnalytics(to, "hero_secondary");

  return (
    <Link
      to={to}
      search={intent ? { intent } : undefined}
      onClick={trackLandingLinkClick}
      className="inline-flex items-center justify-center gap-3 rounded-[1.2rem] border border-[#e3ece8] bg-white px-8 py-5 text-[17px] font-semibold text-stone-900 no-underline shadow-[0_12px_24px_rgba(39,68,58,0.08)] transition-transform duration-200 hover:-translate-y-0.5"
    >
      <LoginArrowIcon />
      {children}
    </Link>
  );
}

function SecondaryLink({
  to,
  children,
}: {
  to: "/tryout" | "/auth/login";
  children: ReactNode;
}) {
  const { intent, trackLandingLinkClick } = useLandingLinkAnalytics(to, "secondary_link");

  return (
    <Link
      to={to}
      search={intent ? { intent } : undefined}
      onClick={trackLandingLinkClick}
      className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/8 px-5 py-3 text-[15px] font-black text-white no-underline backdrop-blur-md transition-transform duration-200 hover:-translate-y-0.5"
    >
      {children}
      <ArrowUpRightIcon />
    </Link>
  );
}

function LightLink({
  to,
  children,
}: {
  to: "/tryout" | "/auth/login";
  children: ReactNode;
}) {
  const { intent, trackLandingLinkClick } = useLandingLinkAnalytics(to, "light_link");

  return (
    <Link
      to={to}
      search={intent ? { intent } : undefined}
      onClick={trackLandingLinkClick}
      className="group inline-flex items-center justify-center gap-2 rounded-full border border-[#dbe8ff] bg-[#edf5ff] px-5 py-3 text-[15px] font-black text-[#071a52] no-underline transition-transform duration-200 hover:-translate-y-0.5"
    >
      {children}
      <ArrowUpRightIcon />
    </Link>
  );
}

function BrandMark() {
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,#fef3df_0%,var(--brand-primary-soft)_100%)] shadow-[0_10px_24px_rgba(51,100,89,0.12)] ring-1 ring-[#d9ebe4]">
      <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden="true">
        <path
          d="M14 5c-4.8 0-8.5 3.8-8.5 8.7 0 2.8 1.2 5.2 3.2 6.8v1.8c0 .9.7 1.5 1.5 1.5h7.6c.9 0 1.5-.7 1.5-1.5V20.5c2-1.6 3.2-4 3.2-6.8C22.5 8.8 18.8 5 14 5Z"
          fill="#7f6142"
        />
        <path
          d="M10.2 11.2c0-1.3.9-2.2 2.1-2.2 1 0 1.8.5 1.8 1.1 0-.7.9-1.1 1.9-1.1 1.2 0 2.1.9 2.1 2.2v3.4c0 1.3-.9 2.2-2.1 2.2-1 0-1.8-.5-1.9-1.1 0 .7-.8 1.1-1.8 1.1-1.2 0-2.1-.9-2.1-2.2v-3.4Z"
          fill="#fff8ef"
        />
        <path
          d="M11.8 12.8a1.2 1.2 0 1 0 0-.1Zm4.5 0a1.2 1.2 0 1 0 0-.1ZM11.5 20.2h5"
          fill="none"
          stroke="#4b3a27"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path
        d="M6 14 14 6m0 0H7m7 0v7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5l-1.9-5.7-5.6-1.9L10.1 9 12 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 22c4.1 0 7-2.8 7-6.8 0-3.5-2-5.8-4.4-7.7-.7 2-1.8 3.1-3.3 3.8.3-2.9-1.1-5.2-3.7-7.3C7.4 7.4 5 10.2 5 15.2 5 19.2 7.9 22 12 22Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LegendItem({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: tone }} />
      {label}
    </span>
  );
}

function LargeStepIcon({ children }: { children: ReactNode }) {
  return <span className="scale-[1.35]">{children}</span>;
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 3.5V8h4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12h6M9 15.5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BoltBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="m13 2-6 9h4l-1 11 7-10h-4l0-10Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 3 19 6v5.5c0 4.2-2.6 7.9-7 9.5-4.4-1.6-7-5.3-7-9.5V6l7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function TargetBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" />
    </svg>
  );
}

function FlashBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="m13 2-6 9h4l-1 11 7-10h-4l0-10Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="m12 4 2.2 4.5 5 .7-3.6 3.5.9 4.9-4.5-2.4-4.5 2.4.9-4.9-3.6-3.5 5-.7L12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M5 18V11M11 18V7M17 18V4M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendingUpIcon() {
  return (
    <svg viewBox="0 0 80 40" className="h-8 w-24" fill="none" aria-hidden="true">
      <path d="M6 30h15l9-10 10 3 10-12 12 2 12-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M67 5h11v11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GrowthIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M5 18v-3M10 18V9M15 18v-6M20 18V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m6 9 4-4 4 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M4 9.5h16V20a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20V9.5ZM12 9.5v12M4 14h16" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 9.5H7.8A2.3 2.3 0 1 1 10 6.2L12 9.5Zm0 0h4.2A2.3 2.3 0 1 0 14 6.2L12 9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="m5 18 1.8-10 5.2 4 5.2-4L19 18H5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 18h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="6.8" cy="8" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="17.2" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8.6 12.2 2.2 2.2 4.6-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MagicWandIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="m4 20 8.5-8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m11.5 5 1 2.6L15 8.5l-2.5.9-1 2.6-1-2.6L8 8.5l2.5-.9 1-2.6ZM17.5 12l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function TrophyLineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M8 4h8v3a4 4 0 0 1-8 0V4ZM12 11v4M9 20h6M10 15h4v5h-4v-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6H4v1.5A3.5 3.5 0 0 0 7.5 11H9M16 6h4v1.5a3.5 3.5 0 0 1-3.5 3.5H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M20 11a8 8 0 1 1-2.3-5.6M20 4v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M4 13a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3.5" y="12" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="16.5" y="12" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M18.5 19a3.5 3.5 0 0 1-3.5 3.5H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M15.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.5 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2.5 19.5a4.8 4.8 0 0 1 4.8-4.8h2.4a4.8 4.8 0 0 1 4.8 4.8M13.8 19.5a4.2 4.2 0 0 1 4.2-4.2h.2a4.2 4.2 0 0 1 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UserLineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 19a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" aria-hidden="true">
      <path d="M12 3 19 6v5.4c0 4.3-2.6 8.1-7 9.6-4.4-1.5-7-5.3-7-9.6V6l7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m9.2 12.4 1.9 1.9 3.8-4.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-stone-300" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10.5v4M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M10 3h4M11 3v5l-5 8.3A2 2 0 0 0 7.7 19h8.6a2 2 0 0 0 1.7-3L13 8V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.8 13h6.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M4.5 6.5A2.5 2.5 0 0 1 7 4h4.2v15H7A2.5 2.5 0 0 0 4.5 21V6.5ZM19.5 6.5A2.5 2.5 0 0 0 17 4h-4.2v15H17a2.5 2.5 0 0 1 2.5 2V6.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function CapsuleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="m9.4 5.2 9.4 9.4a4 4 0 0 1-5.7 5.7l-9.4-9.4a4 4 0 0 1 5.7-5.7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m8 8 8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MenuGridIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HeartLineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M12 20s-6.5-4.4-8.5-8c-1.5-2.6-.5-5.8 2.3-7 2-.8 4.3-.2 5.7 1.6 1.4-1.8 3.7-2.4 5.7-1.6 2.8 1.2 3.8 4.4 2.3 7-2 3.6-8.5 8-8.5 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m8 12 2-2 2 4 2-3h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PillBottleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M9 4h6v3H9V4Zm-2 5.5A2.5 2.5 0 0 1 9.5 7h5A2.5 2.5 0 0 1 17 9.5v7A2.5 2.5 0 0 1 14.5 19h-5A2.5 2.5 0 0 1 7 16.5v-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AtomIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3.5c2.9 0 5.2 3.8 5.2 8.5S14.9 20.5 12 20.5 6.8 16.7 6.8 12 9.1 3.5 12 3.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.6 8.3c1.5-2.4 5.9-2.6 9.8-.3 3.9 2.2 5.8 6 4.4 8.4-1.5 2.4-5.9 2.6-9.8.3-3.9-2.2-5.8-6-4.4-8.4Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function SparkBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12 4.5 13.7 9l4.8 1.7-4.8 1.7-1.7 4.6-1.7-4.6-4.8-1.7L10.3 9 12 4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function LockBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M8 11V8a4 4 0 1 1 8 0v3M7 11h10v8H7v-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="m7 4 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M7 4.5h7l4 4v11A1.5 1.5 0 0 1 16.5 21h-9A1.5 1.5 0 0 1 6 19.5V6A1.5 1.5 0 0 1 7.5 4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 4.5V9h4M9 13h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4.5l3 1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 4v2.5M20 12h-2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BookFrameIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M6 4.5h11A1.5 1.5 0 0 1 18.5 6v12A1.5 1.5 0 0 1 17 19.5H7A1.5 1.5 0 0 1 5.5 18V5.9A1.4 1.4 0 0 1 6.9 4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 4.5v15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LoginArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13 8.5 17.5 12 13 15.5M17.5 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
