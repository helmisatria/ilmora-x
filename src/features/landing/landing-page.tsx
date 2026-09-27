import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { TryoutIcon } from "../../components/TryoutIcon";
import type { listMembershipProducts } from "../premium-access/checkout-functions";
import type { listPublicPublishedTryouts } from "../tryout-content/student-tryout-catalog-functions";
import { businessDetails, plans } from "./landing-content";
import {
  ArrowUpRightIcon,
  BarChartIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  SparkIcon,
  TargetIcon,
} from "./landing-icons";
import { useLandingLinkAnalytics } from "./landing-link-analytics";
import { PublicNavigation } from "./public-navigation";

type MembershipProduct = Awaited<ReturnType<typeof listMembershipProducts>>[number];
type PublicTryout = Awaited<ReturnType<typeof listPublicPublishedTryouts>>[number];

const revealTransition = {
  duration: 0.7,
  ease: [0.16, 1, 0.3, 1],
} as const;

export function LandingPage({
  products,
  tryouts,
}: {
  products: MembershipProduct[];
  tryouts: PublicTryout[];
}) {
  return (
    <main
      className="min-h-[100dvh] overflow-x-hidden bg-[#f7faf9] text-[#202124]"
      style={{ fontFamily: "'Geist', 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" }}
    >
      <BusinessStructuredData products={products} />
      <PublicNavigation isHomePage />
      <HeroSection />
      <TryoutSection tryouts={tryouts} />
      <LearningLoopSection />
      <PricingSection />
      <FooterCta />
      <SiteFooter />
    </main>
  );
}

function BusinessStructuredData({ products }: { products: MembershipProduct[] }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: businessDetails.name,
    alternateName: "IlmoraX",
    url: "https://ilmorax.com",
    email: businessDetails.email,
    telephone: businessDetails.contacts[0].internationalPhone,
    contactPoint: businessDetails.contacts.map((contact) => ({
      "@type": "ContactPoint",
      contactType: "customer support",
      name: contact.label,
      telephone: contact.internationalPhone,
      availableLanguage: ["Indonesian"],
    })),
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jl. Nakula No.26",
      addressLocality: "Denpasar Utara",
      addressRegion: "Bali",
      postalCode: "80231",
      addressCountry: "ID",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Paket IlmoraX Premium",
      itemListElement: products.map((product) => ({
        "@type": "Offer",
        name: product.name,
        description: product.description,
        price: product.price,
        priceCurrency: "IDR",
        availability: "https://schema.org/InStock",
        url: "https://ilmorax.com/premium",
      })),
    },
  };
  const safeStructuredData = JSON.stringify(structuredData).replaceAll("<", "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeStructuredData }}
    />
  );
}

function HeroSection() {
  return (
    <section
      id="beranda"
      className="relative scroll-mt-24 overflow-hidden px-5 pb-20 pt-24 sm:px-6 lg:pb-24"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(720px 430px at 0% 0%, rgba(103,216,194,0.5), transparent 68%), radial-gradient(700px 440px at 100% 0%, rgba(255,213,118,0.48), transparent 70%), linear-gradient(180deg,#f8fffd 0%,#f3faf8 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage: "radial-gradient(#73b9ad 1.2px, transparent 1.2px)",
          backgroundSize: "24px 24px",
          maskImage: "linear-gradient(to bottom, black, transparent 78%)",
        }}
      />
      <div className="pointer-events-none absolute -left-20 top-28 h-48 w-48 rounded-full border-[28px] border-white/45" />
      <div className="pointer-events-none absolute -right-14 bottom-10 h-36 w-36 rotate-12 rounded-[36px] bg-[#ff8c87]/15" />

      <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#acdcd2] bg-white/80 px-3.5 py-2 text-[12px] font-black text-[var(--brand-primary)] shadow-[0_5px_0_#cdece5] backdrop-blur-sm">
            <span className="text-[#18aa8e]"><SparkIcon /></span>
            Latihan UKAI untuk calon apoteker
          </div>
          <h1 className="mt-5 max-w-[12ch] text-[clamp(3rem,6vw,5.4rem)] font-[780] leading-[0.92] tracking-[-0.055em]">
            Makin siap hadapi UKAI.
          </h1>
          <p className="mt-6 max-w-[34ch] text-[17px] leading-[1.7] text-stone-600 sm:text-[18px]">
            Kerjakan try-out, temukan topik lemah, lalu pilih latihan berikutnya.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <TryoutLink entryPoint="hero_primary">Lihat try-out</TryoutLink>
            <LoginLink>Masuk</LoginLink>
          </div>
        </Reveal>

        <Reveal className="relative lg:justify-self-end">
          <div className="relative mx-auto w-full max-w-[540px] px-1 py-10 sm:px-8 sm:py-12">
            <FloatingBadge className="left-0 top-8 -rotate-3" tone="amber" icon={<ClockIcon />}>
              Timer ujian
            </FloatingBadge>
            <FloatingBadge className="right-0 top-16 rotate-3" tone="mint" icon={<TargetIcon />}>
              Topik lemah terlihat
            </FloatingBadge>
            <MascotHeroVisual />
            <FloatingBadge className="bottom-5 right-4 -rotate-2" tone="coral" icon={<BookOpenIcon />}>
              Pembahasan jelas
            </FloatingBadge>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FloatingBadge({
  children,
  className,
  icon,
  tone,
}: {
  children: ReactNode;
  className: string;
  icon: ReactNode;
  tone: "amber" | "coral" | "mint";
}) {
  const shouldReduceMotion = useReducedMotion();
  const tones = {
    amber: "border-[#f1be4e] bg-[#fff5ce] text-[#8d5a00] shadow-[#e5ad34]",
    coral: "border-[#ffaaa5] bg-[#fff0ee] text-[#a8423d] shadow-[#e97c76]",
    mint: "border-[#8ed9c9] bg-[#e7fbf5] text-[#087c69] shadow-[#67bea9]",
  };

  return (
    <motion.div
      animate={shouldReduceMotion ? undefined : { y: [0, -5, 0] }}
      className={`absolute z-10 hidden items-center gap-2 rounded-[14px] border px-3.5 py-2.5 text-[12px] font-black shadow-[0_5px_0] sm:flex ${tones[tone]} ${className}`}
      transition={{ duration: 3.4, ease: "easeInOut", repeat: Infinity }}
    >
      {icon}
      {children}
    </motion.div>
  );
}

function MascotHeroVisual() {
  return (
    <div className="relative mx-auto flex aspect-[1/1.04] w-full max-w-[480px] items-end justify-center overflow-hidden rounded-[42%_42%_36%_36%] border border-[#9fd9ce] bg-[radial-gradient(circle_at_50%_34%,#fff8d7_0%,#dcf7ef_48%,#acdcd0_100%)] shadow-[0_10px_0_#91cfc2,0_32px_70px_rgba(45,93,79,0.18)]">
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(#3da993 1.25px, transparent 1.25px)", backgroundSize: "21px 21px" }} />
      <div className="pointer-events-none absolute bottom-7 h-16 w-[70%] rounded-full bg-[#23715f]/15 blur-xl" />
      <SampleAnalysisCard />
      <img
        src="/ilmorax-owl-pharmacist.webp"
        alt="Maskot burung hantu IlmoraX memakai jas apoteker dan membawa kartu belajar"
        className="relative z-10 h-[88%] w-auto max-w-none translate-x-[18%] object-contain object-bottom drop-shadow-[0_18px_22px_rgba(48,76,67,0.18)] sm:h-[91%]"
        fetchPriority="high"
      />
    </div>
  );
}

function SampleAnalysisCard() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={shouldReduceMotion ? undefined : { y: [0, 4, 0], rotate: [-4, -3, -4] }}
      className="absolute left-[4%] top-[11%] z-[1] w-[61%] -rotate-3 rounded-[20px] border border-[#b6ddd5] bg-white/95 p-3.5 shadow-[0_7px_0_#8bc9bd,0_20px_35px_rgba(31,94,80,0.15)] backdrop-blur-sm sm:left-[5%] sm:top-[12%] sm:w-[58%] sm:p-5"
      transition={{ duration: 4.8, ease: "easeInOut", repeat: Infinity }}
    >
      <div className="flex items-center gap-2 text-[10px] font-black text-[#d95361] sm:text-[11px]">
        <TargetIcon />
        <span>Contoh analisis</span>
      </div>

      <div className="mt-3.5 space-y-3 sm:mt-5 sm:space-y-4">
        <SampleTopicRow
          label="Farmakokinetik"
          status="Perlu diulang"
          tone="coral"
        />
        <SampleTopicRow
          label="Kardiovaskular"
          status="Mulai kuat"
          tone="amber"
        />
      </div>

      <a
        href="#hasil"
        className="mt-3.5 flex min-h-9 items-center justify-between rounded-[11px] bg-[#eef7fb] px-3 text-[10px] font-black text-[var(--brand-primary)] transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:mt-5 sm:min-h-10 sm:text-[11px]"
      >
        Lihat contoh hasil
        <ArrowUpRightIcon />
      </a>
    </motion.div>
  );
}

function SampleTopicRow({
  label,
  status,
  tone,
}: {
  label: string;
  status: string;
  tone: "amber" | "coral";
}) {
  const statusTone = {
    amber: "bg-[#fff0c8] text-[#986100]",
    coral: "bg-[#ffebed] text-[#b13f4d]",
  };

  return (
    <div>
      <p className="truncate text-[11px] font-black text-stone-700 sm:text-[13px]">
        {label}
      </p>
      <span className={`mt-1.5 inline-flex rounded-full px-2 py-1 text-[9px] font-black sm:text-[10px] ${statusTone[tone]}`}>
        {status}
      </span>
    </div>
  );
}

function TryoutSection({ tryouts }: { tryouts: PublicTryout[] }) {
  return (
    <section id="cara-kerja" className="relative scroll-mt-24 overflow-hidden bg-[#fff9e8] px-5 py-20 sm:px-6 lg:py-24">
      <div className="pointer-events-none absolute -right-16 top-20 h-64 w-64 rounded-full bg-[#ffcf58]/20" />
      <div className="pointer-events-none absolute bottom-16 left-4 grid grid-cols-5 gap-3 opacity-25">
        {Array.from({ length: 20 }).map((_, index) => <i key={index} className="h-1.5 w-1.5 rounded-full bg-[#df9c16]" />)}
      </div>
      <div className="relative mx-auto w-full max-w-[1180px]">
        <Reveal className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div>
            <p className="text-[13px] font-black text-[#ad6b00]">Try-out tersedia</p>
            <h2 className="mt-4 max-w-[12ch] text-[clamp(2.5rem,5vw,4.5rem)] font-[760] leading-[0.98] tracking-[-0.05em]">
              Pilih yang mau kamu kerjakan.
            </h2>
          </div>
          <p className="max-w-[46ch] text-[17px] leading-[1.7] text-stone-600 lg:justify-self-end">
            Lihat judul, jumlah soal, dan durasinya sebelum masuk. Akun diperlukan untuk menyimpan progresmu.
          </p>
        </Reveal>

        <Reveal className="mt-10 overflow-hidden rounded-[26px] border border-[#ead9a8] bg-white shadow-[0_8px_0_#f1dfaa,0_26px_60px_rgba(130,92,22,0.08)]">
          {tryouts.length > 0 ? (
            <div className="divide-y divide-[#eee5ca]">
              {tryouts.map((tryout) => (
                <PublicTryoutRow key={tryout.id} tryout={tryout} />
              ))}
            </div>
          ) : (
            <div className="px-6 py-10 text-center sm:px-10">
              <p className="text-[18px] font-bold">Daftar try-out sedang dimuat.</p>
              <p className="mt-2 text-[14px] text-stone-500">Masuk untuk melihat katalog terbaru.</p>
            </div>
          )}

          <div className="flex flex-col gap-4 border-t border-[#eee5ca] bg-[#fffdf7] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-[13px] text-stone-500">
              Setelah masuk, kamu bisa membuka seluruh katalog dan mulai mengerjakan.
            </p>
            <TryoutLink entryPoint="primary_link">Lihat semua try-out</TryoutLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PublicTryoutRow({ tryout }: { tryout: PublicTryout }) {
  const accessLabel = tryout.accessLevel === "free" ? "Gratis" : "Premium";
  const colorStyle = {
    "--tryout-color": tryout.categoryColor,
  } as CSSProperties;

  return (
    <div
      className="group grid gap-4 px-5 py-5 transition-colors hover:bg-[#fffcf1] sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-7"
      style={colorStyle}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[color-mix(in_srgb,var(--tryout-color)_14%,white)] text-[var(--tryout-color)] shadow-[0_4px_0_color-mix(in_srgb,var(--tryout-color)_22%,white)] transition-transform group-hover:-rotate-3 group-hover:scale-105">
        <TryoutIcon icon={tryout.icon} tryoutId={tryout.id} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-[17px] font-bold tracking-tight">{tryout.title}</h3>
          <span className="rounded-full bg-[color-mix(in_srgb,var(--tryout-color)_12%,white)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--tryout-color)]">{accessLabel}</span>
        </div>
        <p className="mt-1 text-[13px] text-stone-500">{tryout.categoryName}</p>
      </div>
      <div className="flex items-center gap-3 text-[12px] font-bold text-stone-600 sm:justify-end">
        <span className="rounded-full bg-stone-100 px-3 py-1.5">{tryout.questionCount} soal</span>
        <span className="rounded-full bg-stone-100 px-3 py-1.5">{tryout.durationMinutes} menit</span>
        <ArrowUpRightIcon />
      </div>
    </div>
  );
}

function LearningLoopSection() {
  const steps = [
    {
      title: "Kerjakan dengan timer",
      body: "Jawab seperti saat ujian dan tandai soal yang masih meragukan.",
      icon: <ClockIcon />,
      tone: "bg-[#e8f7ff] text-[#1878a8] shadow-[#b8dff1]",
    },
    {
      title: "Periksa jawaban",
      body: "Lihat jawaban benar, pembahasan, dan materi yang perlu dibaca lagi.",
      icon: <BookOpenIcon />,
      tone: "bg-[#fff0ee] text-[#bd4f50] shadow-[#f1c2bd]",
    },
    {
      title: "Ulangi topik lemah",
      body: "Gunakan akurasi per topik untuk memilih latihan berikutnya.",
      icon: <TargetIcon />,
      tone: "bg-[#eaf9e4] text-[#438d31] shadow-[#c7e7bc]",
    },
  ];

  return (
    <section id="hasil" className="relative scroll-mt-24 overflow-hidden px-5 py-20 sm:px-6 lg:py-24">
      <div className="pointer-events-none absolute -left-24 bottom-2 h-64 w-64 rounded-full border-[32px] border-[#bcebdd]/30" />
      <div className="mx-auto grid w-full max-w-[1180px] gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <Reveal>
          <p className="text-[13px] font-bold text-[var(--brand-primary)]">Setelah try-out</p>
          <h2 className="mt-4 max-w-[10ch] text-[clamp(2.7rem,5vw,4.8rem)] font-[760] leading-[0.96] tracking-[-0.05em]">
            Skor hanyalah awal.
          </h2>
          <p className="mt-6 max-w-[37ch] text-[17px] leading-[1.7] text-stone-600">
            Hasilmu menunjukkan topik yang sudah kuat dan bagian yang perlu kamu ulangi.
          </p>
        </Reveal>

        <Reveal>
          <div className="relative space-y-4 before:absolute before:bottom-10 before:left-7 before:top-10 before:w-1 before:rounded-full before:bg-[#d8e8e3]">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative grid grid-cols-[auto_1fr] gap-5 rounded-[22px] border border-[#dce9e5] bg-white p-5 shadow-[0_6px_0_#e0ebe8] transition-transform hover:-translate-y-1 sm:gap-7 sm:p-6"
              >
                <div className={`z-10 flex h-14 w-14 items-center justify-center rounded-[17px] shadow-[0_5px_0] ${step.tone}`}>
                  {step.icon}
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-black uppercase tracking-[0.12em] text-stone-400">Langkah {index + 1}</p>
                  <h3 className="text-[20px] font-bold tracking-tight">{step.title}</h3>
                  <p className="mt-2 max-w-[44ch] text-[15px] leading-[1.7] text-stone-600">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="paket" className="relative scroll-mt-24 overflow-hidden bg-[#fff8eb] px-5 py-20 sm:px-6 lg:py-24">
      <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(#e3b95f 1.25px, transparent 1.25px)", backgroundSize: "24px 24px", maskImage: "linear-gradient(to bottom, black, transparent 88%)" }} />
      <div className="pointer-events-none absolute -right-20 top-12 h-72 w-72 rounded-full bg-[#f5b544]/18" />
      <div className="relative mx-auto w-full max-w-[1180px]">
        <Reveal>
          <h2 className="max-w-[12ch] text-[clamp(2.7rem,5vw,4.8rem)] font-[760] leading-[0.96] tracking-[-0.05em] text-stone-900">
            Mulai gratis.
          </h2>
          <p className="mt-5 max-w-[46ch] text-[17px] leading-[1.7] text-stone-600">
            Pilih akses yang sesuai dengan cara belajarmu. Paket dan harga tersedia di halaman Premium.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <PlanComparisonCard plan={plans[0]} />
          <PlanComparisonCard plan={plans[1]} premium />
        </div>
      </div>
    </section>
  );
}

function PlanComparisonCard({
  plan,
  premium = false,
}: {
  plan: (typeof plans)[number];
  premium?: boolean;
}) {
  const cardClassName = premium
    ? "relative overflow-hidden border-amber-300 border-b-[#a96612] bg-[#2f281c] text-amber-50 shadow-[0_8px_0_#1f1a12,0_28px_60px_rgba(96,68,20,0.2)]"
    : "border-[#cce7e1] border-b-[#9acfc3] bg-white text-stone-900 shadow-[0_8px_0_#cde7e1,0_24px_50px_rgba(45,93,79,0.1)]";
  const featureColor = premium ? "text-amber-300" : "text-[#1aa98e]";

  return (
    <Reveal className={`rounded-[26px] border-2 border-b-[6px] p-6 sm:p-8 ${cardClassName}`}>
      {premium && (
        <div className="pointer-events-none absolute inset-0 opacity-[0.09]" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "14px 14px" }} />
      )}
      <div className="relative flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] border-2 ${premium ? "border-amber-300/30 bg-amber-300/10 text-amber-300" : "border-[#bce4dc] bg-[#e8f8f4] text-[#168e78]"}`}>
          {plan.icon}
        </div>
        <div>
          <p className={`text-[12px] font-black ${premium ? "text-amber-200/70" : "text-stone-500"}`}>{plan.badge}</p>
          <h3 className={`mt-1 text-[30px] font-black tracking-tight ${premium ? "text-amber-100" : "text-stone-900"}`}>{plan.name}</h3>
          <p className={`mt-2 max-w-[36ch] text-[15px] leading-[1.65] ${premium ? "text-amber-50/72" : "text-stone-600"}`}>{plan.description}</p>
        </div>
      </div>

      <div className={`relative mt-7 grid gap-3 border-t pt-6 sm:grid-cols-2 ${premium ? "border-amber-100/15" : "border-stone-200"}`}>
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-start gap-3 text-[14px] font-semibold leading-[1.45]">
            <span className={`mt-0.5 shrink-0 ${featureColor}`}><CheckCircleIcon /></span>
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <div className="relative mt-8">
        {premium ? (
          <Link
            to="/premium"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f5b544] px-6 text-[15px] font-black text-[#2f281c] no-underline shadow-[0_4px_0_#a96612] transition-transform hover:-translate-y-0.5 active:translate-y-px"
          >
            Buka Premium
            <ArrowUpRightIcon />
          </Link>
        ) : (
          <TryoutLink entryPoint="pricing_button">Lihat try-out</TryoutLink>
        )}
      </div>
    </Reveal>
  );
}

function FooterCta() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section>
      <Reveal className="relative w-full overflow-hidden border-y border-[#3b7390] bg-[linear-gradient(135deg,#173f5a_0%,#205b79_54%,#247a91_100%)] text-white shadow-[0_10px_0_#102f45,0_28px_70px_rgba(32,80,114,0.2)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: "radial-gradient(#b8f0e4 1.35px, transparent 1.35px)",
            backgroundSize: "23px 23px",
            maskImage: "linear-gradient(90deg, transparent 8%, black 46%, black 100%)",
          }}
        />
        <div className="pointer-events-none absolute -left-24 -top-24 h-60 w-60 rounded-full border-[34px] border-[#45c5ad]/15" />
        <div className="pointer-events-none absolute -bottom-20 left-[42%] h-44 w-44 rotate-12 rounded-[42px] bg-[#ff8c87]/15" />
        <div className="pointer-events-none absolute -right-14 -top-16 h-64 w-64 rounded-full bg-[#ffcf58]/28" />

        <div className="relative mx-auto grid min-h-[590px] w-full max-w-[1180px] lg:min-h-[640px] lg:grid-cols-[0.88fr_1.12fr] lg:items-center xl:min-h-[680px]">
          <div className="z-10 px-6 pb-4 pt-12 sm:px-10 sm:pt-14 lg:px-14 lg:py-16">
            <h2 className="max-w-[12ch] text-[clamp(2.8rem,5vw,4.9rem)] font-[760] leading-[0.96] tracking-[-0.05em]">
              Yuk, mulai satu <span className="whitespace-nowrap">try-out.</span>
            </h2>
            <p className="mt-6 max-w-[36ch] text-[16px] leading-[1.7] text-[#d8edf3] sm:text-[17px]">
              Setelah selesai, lihat evaluasi hasil, topik yang perlu diulang, dan pembahasan setiap jawaban.
            </p>
            <div className="mt-8 sm:inline-flex">
              <TryoutLink entryPoint="footer_cta" inverse>Pilih try-out</TryoutLink>
            </div>
          </div>

          <div className="relative min-h-[330px] sm:min-h-[380px] lg:h-full lg:min-h-0">
            <CtaFloatingObject
              className="left-[6%] top-[11%] -rotate-3 sm:left-[13%] lg:left-[5%] lg:top-[18%]"
              icon={<ClockIcon />}
              label="Timer siap"
              tone="amber"
            />
            <CtaFloatingObject
              className="right-[4%] top-[16%] rotate-3 sm:right-[10%] lg:right-[5%] lg:top-[13%]"
              icon={<TargetIcon />}
              label="Topik makin jelas"
              tone="mint"
            />
            <CtaFloatingObject
              className="bottom-[8%] left-[4%] rotate-2 sm:left-[12%] lg:bottom-[13%] lg:left-[2%]"
              icon={<BookOpenIcon />}
              label="Pembahasan jawaban"
              tone="coral"
            />
            <CtaFloatingObject
              className="bottom-[9%] right-[4%] hidden -rotate-2 sm:flex sm:right-[8%] lg:bottom-[12%] lg:right-[1%]"
              icon={<BarChartIcon />}
              label="Evaluasi hasil"
              tone="blue"
            />

            <div className="pointer-events-none absolute bottom-[2%] left-1/2 h-[290px] w-[282px] -translate-x-1/2 sm:h-[340px] sm:w-[330px] lg:bottom-[4%] lg:left-auto lg:right-[5%] lg:h-[500px] lg:w-[485px] lg:translate-x-0 xl:h-[530px] xl:w-[515px]">
              <div className="absolute bottom-[7%] left-[15%] h-14 w-[70%] rounded-full bg-[#0e3044]/35 blur-xl" />
              <motion.img
                src="/ilmorax-owl-celebrate.webp"
                alt="Maskot burung hantu IlmoraX merayakan selesainya latihan"
                animate={shouldReduceMotion ? undefined : { y: [0, -8, 0], rotate: [0, 1, 0] }}
                className="relative h-full w-full object-contain object-bottom drop-shadow-[0_24px_28px_rgba(7,34,49,0.28)]"
                loading="lazy"
                transition={{ duration: 4.2, ease: "easeInOut", repeat: Infinity }}
              />
            </div>

            <span className="pointer-events-none absolute bottom-[26%] right-[7%] h-4 w-4 rotate-12 rounded-[4px] bg-[#ffcf58] sm:right-[12%] lg:bottom-[24%]" />
            <span className="pointer-events-none absolute bottom-[18%] right-[18%] h-3 w-7 -rotate-[24deg] rounded-full bg-[#ff8c87] sm:right-[22%] lg:bottom-[16%]" />
            <span className="pointer-events-none absolute left-[26%] top-[37%] h-3 w-3 rotate-45 rounded-[3px] bg-[#72e1ca] lg:left-[19%]" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function CtaFloatingObject({
  className,
  icon,
  label,
  tone,
}: {
  className: string;
  icon: ReactNode;
  label: string;
  tone: "amber" | "blue" | "coral" | "mint";
}) {
  const shouldReduceMotion = useReducedMotion();
  const tones = {
    amber: "border-[#f1c457] bg-[#fff2bd] text-[#815200] shadow-[#d99a19]",
    blue: "border-[#9bcaf0] bg-[#edf7ff] text-[#245f87] shadow-[#69a8d6]",
    coral: "border-[#ffaaa5] bg-[#fff0ee] text-[#9f403b] shadow-[#dd716b]",
    mint: "border-[#86d8c6] bg-[#e5fbf5] text-[#087360] shadow-[#58b59f]",
  };

  return (
    <motion.div
      animate={shouldReduceMotion ? undefined : { y: [0, -5, 0] }}
      className={`absolute z-20 flex items-center gap-2 rounded-[14px] border px-3 py-2 text-[10px] font-black shadow-[0_5px_0] sm:px-3.5 sm:py-2.5 sm:text-[11px] ${tones[tone]} ${className}`}
      transition={{ duration: 3.8, ease: "easeInOut", repeat: Infinity }}
    >
      {icon}
      {label}
    </motion.div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-[#d8e5e1] px-5 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 text-[13px] text-stone-500 sm:flex-row sm:items-center sm:justify-between">
        <p>IlmoraX oleh {businessDetails.name}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <a href={`mailto:${businessDetails.email}`} className="text-stone-600 no-underline hover:text-[var(--brand-primary)]">
            {businessDetails.email}
          </a>
          <Link to="/tentang-kami" className="text-stone-600 no-underline hover:text-[var(--brand-primary)]">
            Tentang kami
          </Link>
        </div>
      </div>
    </footer>
  );
}

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
      transition={revealTransition}
      viewport={{ amount: 0.15, once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );
}

function TryoutLink({
  children,
  entryPoint,
  inverse = false,
}: {
  children: ReactNode;
  entryPoint: "footer_cta" | "hero_primary" | "pricing_button" | "primary_link";
  inverse?: boolean;
}) {
  const { intent, trackLandingLinkClick } = useLandingLinkAnalytics("/tryout", entryPoint);
  const className = inverse
    ? "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[15px] font-bold text-[var(--brand-primary)] no-underline transition-transform hover:-translate-y-0.5 active:translate-y-px"
    : "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 text-[15px] font-bold text-white no-underline shadow-[0_14px_28px_rgba(32,80,114,0.2)] transition-transform hover:-translate-y-0.5 active:translate-y-px";

  return (
    <Link
      to="/tryout"
      search={{ intent }}
      onClick={trackLandingLinkClick}
      className={className}
    >
      {children}
      <ArrowUpRightIcon />
    </Link>
  );
}

function LoginLink({ children }: { children: ReactNode }) {
  const { intent, trackLandingLinkClick } = useLandingLinkAnalytics("/auth/login", "hero_secondary");

  return (
    <Link
      to="/auth/login"
      search={{ intent }}
      onClick={trackLandingLinkClick}
      className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#cdded9] bg-white px-6 text-[15px] font-bold text-stone-800 no-underline transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] active:translate-y-px"
    >
      {children}
    </Link>
  );
}
