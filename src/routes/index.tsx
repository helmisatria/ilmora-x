import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IlmoraX - Latihan UKAI yang Terarah" },
      {
        name: "description",
        content:
          "Platform latihan UKAI untuk calon apoteker. Try-out, evaluasi personal, materi, leaderboard, dan badge dalam satu prototype belajar yang jelas.",
      },
      { property: "og:title", content: "IlmoraX - Latihan UKAI yang Terarah" },
      {
        property: "og:description",
        content:
          "Bangun ritme latihan UKAI dengan try-out, XP, streak, evaluasi personal, dan pembahasan premium.",
      },
    ],
  }),
  component: LandingComponent,
});

const accent = "#14b8a6";
const accentDark = "#0d9488";
const amber = "#f5b544";

const featureCards = [
  {
    title: "Try-out yang terasa seperti ujian",
    body: "Alur jawab, timer, autosave, penanda soal, dan review dibuat agar siswa terbiasa dengan tekanan UKAI tanpa distraksi.",
    className: "lg:col-span-7 lg:row-span-2",
    tone: "linear-gradient(180deg, #ccfbf13d 0%, rgba(255,255,255,0.94) 70%)",
    visual: "exam",
  },
  {
    title: "Evaluation Dashboard",
    body: "Ringkasan kategori lemah, tren akurasi, dan prioritas latihan berikutnya untuk pengguna premium.",
    className: "lg:col-span-5",
    tone: "linear-gradient(180deg, #fff7ed 0%, rgba(255,255,255,0.96) 72%)",
    visual: "chart",
  },
  {
    title: "Ritme belajar harian",
    body: "XP, level, streak, badge, dan leaderboard menjaga motivasi di luar sesi try-out.",
    className: "lg:col-span-5",
    tone: "linear-gradient(180deg, #f0fdfa 0%, rgba(255,255,255,0.96) 74%)",
    visual: "progress",
  },
  {
    title: "Materi singkat",
    body: "Konten pendukung disusun untuk mengisi gap setelah review hasil.",
    className: "lg:col-span-4",
    tone: "#ffffff",
    visual: "notes",
  },
  {
    title: "Pembahasan rapi",
    body: "Jawaban, alasan, dan review detail tetap mudah dipindai setelah attempt selesai.",
    className: "lg:col-span-4",
    tone: "#ffffff",
    visual: "review",
  },
  {
    title: "Premium jelas",
    body: "Akses berbayar diberi bahasa visual khusus agar tidak terasa seperti kartu biasa.",
    className: "lg:col-span-4",
    tone: "#ffffff",
    visual: "premium",
  },
] as const;

const pricingCards = [
  {
    name: "Gratis",
    price: "Rp 0",
    caption: "Mulai latihan dasar",
    features: ["Try-out dasar", "Pembahasan singkat", "Leaderboard", "Badge dan streak"],
    to: "/auth/login",
    isPremium: false,
  },
  {
    name: "Premium",
    price: "Rp49k",
    caption: "Evaluasi lebih tajam",
    features: ["Try-out premium", "Video pembahasan", "Evaluation Dashboard", "Materi lengkap"],
    to: "/premium",
    isPremium: true,
  },
  {
    name: "6 Bulan",
    price: "Rp249k",
    caption: "Sekali bayar",
    features: ["Semua fitur premium", "Hemat 15%", "Tidak auto-renew", "Durasi panjang"],
    to: "/premium",
    isPremium: false,
  },
] as const;

const marqueeItems = [
  "Try-out UKAI",
  "Evaluation Dashboard",
  "Pembahasan",
  "XP",
  "Streak",
  "Leaderboard",
  "Badge",
  "Materi",
] as const;

function LandingComponent() {
  const pageRef = useRef<HTMLElement>(null);
  const desireRef = useRef<HTMLElement>(null);
  const revealRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".landing-reveal",
        { y: 42, opacity: 0, filter: "blur(10px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.9,
          stagger: 0.08,
          ease: "power3.out",
        },
      );

      gsap.fromTo(
        ".landing-image",
        { scale: 0.86, opacity: 0.68 },
        {
          scale: 1,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".landing-image",
            start: "top 82%",
            end: "bottom 35%",
            scrub: true,
          },
        },
      );

      gsap.fromTo(
        ".desire-card",
        { y: 72, opacity: 0.22 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.18,
          ease: "none",
          scrollTrigger: {
            trigger: desireRef.current,
            start: "top 68%",
            end: "bottom 52%",
            scrub: true,
          },
        },
      );

      if (!revealRef.current) return;

      const words = gsap.utils.toArray<HTMLElement>(".reveal-word");
      gsap.fromTo(
        words,
        { opacity: 0.16, y: 10 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.035,
          ease: "none",
          scrollTrigger: {
            trigger: revealRef.current,
            start: "top 78%",
            end: "bottom 48%",
            scrub: true,
          },
        },
      );
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <main
      ref={pageRef}
      className="w-full max-w-full overflow-x-hidden text-stone-800"
      style={{
        background:
          "linear-gradient(180deg, #eef8f6 0%, #fbfaf7 38%, #f7f3ea 100%)",
        fontFamily:
          "'Geist', 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <FixedGrain />
      <LandingNav />
      <HeroSection />
      <MarqueeBand />
      <FeatureSection />
      <DesireSection desireRef={desireRef} revealRef={revealRef} />
      <PricingSection />
      <FooterCta />
    </main>
  );
}

function FixedGrain() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 opacity-[0.035]"
      style={{
        backgroundImage:
          "radial-gradient(rgba(47,40,28,0.72) 1px, transparent 1px)",
        backgroundSize: "16px 16px",
      }}
    />
  );
}

function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 px-4 pt-5">
      <nav className="landing-reveal mx-auto flex w-full max-w-[980px] items-center justify-between rounded-full border border-white/70 bg-white/78 px-3 py-3 shadow-[0_18px_55px_rgba(13,148,136,0.13)] backdrop-blur-2xl sm:px-4">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <BrandMark />
          <span className="text-[17px] font-black text-stone-800">IlmoraX</span>
        </Link>

        <div className="hidden items-center gap-7 text-[13px] font-bold text-stone-500 md:flex">
          <a href="#fitur" className="transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-stone-900">
            Fitur
          </a>
          <a href="#evaluasi" className="transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-stone-900">
            Evaluasi
          </a>
          <a href="#paket" className="transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-stone-900">
            Paket
          </a>
        </div>

        <Link to="/auth/login" className="group inline-flex items-center gap-2 rounded-full bg-stone-900 py-1.5 pl-5 pr-1.5 text-[13px] font-black text-white no-underline transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
          Masuk
          <IconCircle dark>
            <ArrowUpRightIcon />
          </IconCircle>
        </Link>
      </nav>
    </header>
  );
}

function BrandMark() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.88)]">
      <svg viewBox="0 0 28 28" className="h-6 w-6" aria-hidden="true">
        <path d="M6 7.5C6 5 8 3 10.5 3H21v10.5C21 19.85 15.85 25 9.5 25H6V7.5Z" fill={accent} />
        <path d="M10.2 8.8h6.9v3.1h-6.9V8.8Zm0 5.2h4.9v3.1h-4.9V14Z" fill="#f0fdfa" />
        <path d="M21 3v10.5C21 19.85 15.85 25 9.5 25" fill="none" stroke={accentDark} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function HeroSection() {
  return (
    <section
      className="relative min-h-[100dvh] overflow-hidden px-4 pb-24 pt-32 sm:px-6 md:pt-40"
      style={{
        background:
          "radial-gradient(1000px 360px at 10% -10%, #14b8a638, transparent 62%), radial-gradient(820px 360px at 92% 2%, #f5b54429, transparent 66%)",
      }}
    >
      <div className="mx-auto grid w-full max-w-[1180px] items-center gap-12 lg:grid-cols-[0.93fr_1.07fr]">
        <div className="landing-reveal">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Platform latihan UKAI
          </div>

          <h1 className="mt-4 max-w-[12ch] text-[clamp(3.35rem,7vw,6.9rem)] font-black leading-[0.92] text-stone-900">
            Belajar farmasi lebih terarah
          </h1>

          <p className="mt-6 max-w-[34ch] text-[15px] font-semibold leading-relaxed text-stone-500 sm:text-base">
            Try-out, pembahasan, evaluasi personal, dan ritme belajar harian untuk calon apoteker yang ingin latihan konsisten.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/auth/login" className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#0f766e] py-2 pl-6 pr-2 text-[15px] font-black text-white no-underline shadow-[0_18px_42px_rgba(13,148,136,0.24)] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
              Mulai Belajar
              <IconCircle dark>
                <ArrowUpRightIcon />
              </IconCircle>
            </Link>
            <Link to="/premium" className="group inline-flex items-center justify-center gap-3 rounded-full border-2 border-stone-200 bg-white py-2 pl-6 pr-2 text-[15px] font-black text-stone-800 no-underline shadow-[0_18px_42px_rgba(120,113,108,0.12)] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
              Lihat Premium
              <IconCircle>
                <ArrowUpRightIcon />
              </IconCircle>
            </Link>
          </div>
        </div>

        <div className="landing-reveal">
          <DoubleBezel className="relative min-h-[520px] overflow-hidden">
            <img
              src="https://picsum.photos/seed/pharmacy-lab-ilmorax/1600/1200"
              alt="Ruang belajar farmasi dengan nuansa klinik"
              className="landing-image absolute inset-0 h-full w-full scale-[0.86] object-cover opacity-80 grayscale contrast-125"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(20,184,166,0.34),transparent_36%),linear-gradient(180deg,rgba(15,23,42,0.18),rgba(15,23,42,0.72))]" />
            <div className="absolute bottom-5 left-5 right-5">
              <div className="rounded-[1.65rem] border border-white/15 bg-stone-950/62 p-5 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-teal-100/70">
                      Progress siswa
                    </span>
                    <b className="mt-2 block text-[32px] leading-none">720 XP lagi</b>
                  </div>
                  <div className="rounded-full bg-white/12 px-3 py-1.5 text-[12px] font-black text-teal-50">
                    68%
                  </div>
                </div>
                <div className="mt-4 rounded-full border border-teal-100/15 bg-teal-50/10 p-1">
                  <div className="h-4 w-[68%] rounded-full bg-gradient-to-r from-teal-300 to-teal-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.48)]" />
                </div>
              </div>
            </div>
          </DoubleBezel>
        </div>
      </div>
    </section>
  );
}

function MarqueeBand() {
  return (
    <section className="overflow-hidden border-y border-stone-900/5 bg-white/52 py-5">
      <div className="flex w-max animate-[landing-marquee_24s_linear_infinite] gap-4">
        {[...marqueeItems, ...marqueeItems].map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="rounded-full border border-teal-100 bg-white/78 px-5 py-2 text-[12px] font-black uppercase tracking-wide text-stone-500"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function FeatureSection() {
  return (
    <section id="fitur" className="px-4 py-32 sm:px-6 md:py-44">
      <div className="mx-auto w-full max-w-[1120px]">
        <SectionIntro
          kicker="Fitur utama"
          title="Prototype publik yang menjelaskan produk dalam sekali pindai"
          body="Landing page ini mengikuti PRD Phase 0: menunjukkan branding, hero, fitur, statistik, pricing preview, dan jalur login tanpa mengganggu flow aplikasi."
        />

        <div className="mt-12 grid auto-rows-[minmax(240px,auto)] grid-cols-1 gap-4 lg:grid-flow-dense lg:grid-cols-12">
          {featureCards.map((card) => (
            <FeatureCard key={card.title} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ card }: { card: (typeof featureCards)[number] }) {
  return (
    <article className={`group ${card.className}`}>
      <DoubleBezel className="h-full">
        <div
          className="flex h-full min-h-[220px] flex-col justify-between overflow-hidden rounded-[calc(2rem-0.5rem)] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]"
          style={{ background: card.tone }}
        >
          <FeatureVisual type={card.visual} />
          <div className="mt-8">
            <h3 className="max-w-[24ch] text-xl font-black leading-tight text-stone-900">
              {card.title}
            </h3>
            <p className="mt-3 max-w-[34ch] text-[14px] font-semibold leading-relaxed text-stone-500">
              {card.body}
            </p>
          </div>
        </div>
      </DoubleBezel>
    </article>
  );
}

function FeatureVisual({ type }: { type: string }) {
  if (type === "exam") {
    return (
      <div className="grid gap-3">
        <div className="flex items-center justify-between rounded-2xl border-2 border-teal-100 bg-white/74 p-4">
          <span className="text-[12px] font-black text-stone-500">Sisa waktu</span>
          <span className="font-mono text-lg font-black text-teal-700">01:24:18</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, index) => (
            <span
              key={index}
              className="h-10 rounded-xl border-2 border-stone-100 bg-white text-center text-[13px] font-black leading-9 text-stone-500"
            >
              {index + 1}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (type === "chart") {
    return (
      <div className="flex h-28 items-end gap-2">
        {[48, 76, 58, 88, 64, 92].map((height, index) => (
          <span
            key={index}
            className="w-full rounded-t-2xl bg-gradient-to-t from-amber-400 to-amber-200"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    );
  }

  if (type === "progress") {
    return (
      <div className="space-y-3">
        <ProgressLine label="Streak" value="7 hari" width="72%" />
        <ProgressLine label="Level" value="B1" width="58%" />
        <ProgressLine label="Akurasi" value="82%" width="82%" />
      </div>
    );
  }

  return (
    <div className="flex h-24 items-center justify-center rounded-3xl border-2 border-stone-100 bg-stone-50">
      <LineIcon />
    </div>
  );
}

function DesireSection({
  desireRef,
  revealRef,
}: {
  desireRef: RefObject<HTMLElement | null>;
  revealRef: RefObject<HTMLParagraphElement | null>;
}) {
  const revealText =
    "IlmoraX menjaga energi belajar tetap ringan di luar sesi ujian, tetapi mempertahankan flow try-out yang setia pada kondisi formal agar latihan benar-benar berguna.";

  return (
    <section id="evaluasi" ref={desireRef} className="px-4 py-32 sm:px-6 md:py-48">
      <div className="mx-auto grid w-full max-w-[1120px] gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionIntro
            kicker="Evaluasi premium"
            title="Motivasi boleh playful, analisis harus presisi"
            body="Bagian premium memakai charcoal dan amber seperti style guide: berbeda dari fitur biasa, tetap hangat, dan langsung menjelaskan nilai upgrade."
          />
          <p ref={revealRef} className="mt-8 max-w-[36ch] text-2xl font-black leading-tight text-stone-900 md:text-4xl">
            {revealText.split(" ").map((word, index) => (
              <span key={`${word}-${index}`} className="reveal-word inline-block opacity-20">
                {word}&nbsp;
              </span>
            ))}
          </p>
        </div>

        <div className="space-y-5">
          <DesireCard
            title="Peta kategori lemah"
            body="Siswa melihat prioritas latihan berdasarkan pola salah, bukan hanya angka skor terakhir."
            value="12 kategori"
          />
          <DesireCard
            title="Pembahasan setelah attempt"
            body="Boundary celebration tetap ada di hasil, sementara sesi pengerjaan tetap bebas dari feedback benar-salah."
            value="Review rapi"
          />
          <DesireCard
            title="Rekomendasi latihan"
            body="Arah belajar berikutnya disajikan sebagai langkah singkat agar mudah dilakukan setiap hari."
            value="Target harian"
          />
        </div>
      </div>
    </section>
  );
}

function DesireCard({ title, body, value }: { title: string; body: string; value: string }) {
  return (
    <div className="desire-card">
      <DoubleBezel className="bg-[#2f281c] p-1.5 text-amber-50 ring-amber-300/40">
        <div className="relative overflow-hidden rounded-[calc(2rem-0.375rem)] bg-[#2f281c] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.14)]">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(360px 220px at 90% 0%, rgba(245,181,68,0.28), transparent 70%), radial-gradient(320px 210px at 0% 100%, rgba(20,184,166,0.18), transparent 72%)",
            }}
          />
          <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/70">
                {value}
              </div>
              <h3 className="mt-2 max-w-[24ch] text-2xl font-black leading-tight text-amber-50">
                {title}
              </h3>
              <p className="mt-3 max-w-[36ch] text-[14px] font-semibold leading-relaxed text-amber-100/76">
                {body}
              </p>
            </div>
            <IconTile accent={amber}>
              <SparkIcon />
            </IconTile>
          </div>
        </div>
      </DoubleBezel>
    </div>
  );
}

function PricingSection() {
  return (
    <section id="paket" className="px-4 py-32 sm:px-6 md:py-44">
      <div className="mx-auto w-full max-w-[1120px]">
        <SectionIntro
          kicker="Paket belajar"
          title="Gratis untuk mulai, premium untuk analisis yang lebih dalam"
          body="PRD meminta pricing preview yang jelas. Kartu premium dibuat paling berbeda agar nilai berbayar mudah dikenali."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {pricingCards.map((card) => (
            <PricingCard key={card.name} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ card }: { card: (typeof pricingCards)[number] }) {
  const shellClass = card.isPremium
    ? "bg-[#2f281c] text-amber-50 ring-amber-300/40"
    : "bg-white/70 text-stone-800 ring-stone-900/5";

  const innerClass = card.isPremium
    ? "bg-[#2f281c] shadow-[inset_0_1px_1px_rgba(255,255,255,0.14)]"
    : "bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.92)]";

  return (
    <article className={`rounded-[2rem] p-1.5 ring-1 ${shellClass}`}>
      <div className={`flex min-h-[460px] flex-col rounded-[calc(2rem-0.375rem)] p-6 ${innerClass}`}>
        <div>
          <div className={card.isPremium ? "text-[11px] font-semibold uppercase tracking-wide text-amber-200/72" : "text-[11px] font-semibold uppercase tracking-wide text-stone-400"}>
            {card.caption}
          </div>
          <h3 className={card.isPremium ? "mt-2 text-3xl font-black text-amber-50" : "mt-2 text-3xl font-black text-stone-900"}>
            {card.name}
          </h3>
          <div className={card.isPremium ? "mt-6 text-5xl font-black text-amber-50" : "mt-6 text-5xl font-black text-stone-900"}>
            {card.price}
          </div>
        </div>

        <ul className="mt-8 grid gap-3">
          {card.features.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-[14px] font-bold">
              <span
                className={card.isPremium ? "h-2 w-2 rounded-full bg-amber-300" : "h-2 w-2 rounded-full bg-teal-500"}
              />
              <span className={card.isPremium ? "text-amber-100/78" : "text-stone-500"}>{feature}</span>
            </li>
          ))}
        </ul>

        <Link
          to={card.to}
          className={card.isPremium ? "group mt-auto inline-flex items-center justify-center gap-3 rounded-full bg-amber-300 py-2 pl-6 pr-2 text-[15px] font-black text-[#2f281c] no-underline transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]" : "group mt-auto inline-flex items-center justify-center gap-3 rounded-full border-2 border-stone-200 bg-white py-2 pl-6 pr-2 text-[15px] font-black text-stone-800 no-underline transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"}
        >
          {card.isPremium ? "Buka Premium" : "Pilih Paket"}
          <IconCircle dark={card.isPremium}>
            <ArrowUpRightIcon />
          </IconCircle>
        </Link>
      </div>
    </article>
  );
}

function FooterCta() {
  return (
    <footer className="px-4 pb-12 sm:px-6">
      <div className="mx-auto max-w-[1120px] overflow-hidden rounded-[2rem] bg-stone-950 p-2 text-white">
        <div className="relative overflow-hidden rounded-[calc(2rem-0.5rem)] px-6 py-16 text-center md:py-24">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(700px 360px at 18% 0%, rgba(20,184,166,0.35), transparent 64%), radial-gradient(620px 340px at 88% 20%, rgba(245,181,68,0.28), transparent 66%)",
            }}
          />
          <div className="relative mx-auto max-w-[760px]">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-teal-100/70">
              Masuk dengan Google
            </div>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,5rem)] font-black leading-[0.98] text-white">
              Siapkan flow belajar pertama hari ini
            </h2>
            <p className="mx-auto mt-5 max-w-[38ch] text-[15px] font-semibold leading-relaxed text-white/66">
              Lanjut ke login mock prototype, lengkapi profil, lalu masuk ke dashboard student.
            </p>
            <Link to="/auth/login" className="group mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-white py-2 pl-6 pr-2 text-[15px] font-black text-stone-900 no-underline transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
              Mulai Sekarang
              <IconCircle>
                <ArrowUpRightIcon />
              </IconCircle>
            </Link>
          </div>
        </div>
      </div>
    </footer>
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
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        {kicker}
      </div>
      <h2 className="mt-3 max-w-[18ch] text-[clamp(2.2rem,5vw,4.6rem)] font-black leading-[0.98] text-stone-900">
        {title}
      </h2>
      <p className="mt-5 max-w-[38ch] text-[15px] font-semibold leading-relaxed text-stone-500">
        {body}
      </p>
    </div>
  );
}

function DoubleBezel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[2rem] bg-white/66 p-2 ring-1 ring-stone-900/5 ${className}`}>
      <div className="h-full rounded-[calc(2rem-0.5rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.92)]">
        {children}
      </div>
    </div>
  );
}

function IconCircle({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className={dark ? "flex h-9 w-9 items-center justify-center rounded-full bg-white/14 text-white transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105" : "flex h-9 w-9 items-center justify-center rounded-full bg-stone-900/7 text-stone-900 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105"}
    >
      {children}
    </span>
  );
}

function IconTile({ children, accent: tileAccent }: { children: ReactNode; accent: string }) {
  return (
    <span
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15"
      style={{ background: `${tileAccent}24`, color: tileAccent }}
    >
      {children}
    </span>
  );
}

function ProgressLine({ label, value, width }: { label: string; value: string; width: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[12px] font-black text-stone-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="rounded-full border-2 border-teal-100 bg-teal-50/80 p-1">
        <div className="h-3 rounded-full bg-gradient-to-r from-teal-400 to-teal-600" style={{ width }} />
      </div>
    </div>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="M6 14 14 6m0 0H7m7 0v7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5l-1.9-5.7-5.6-1.9L10.1 9 12 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg viewBox="0 0 72 36" className="h-12 w-24 text-teal-600" aria-hidden="true">
      <path d="M4 27c8-16 15-16 23 0s15 16 23 0 14-16 18-8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="27" cy="27" r="4" fill="currentColor" />
      <circle cx="50" cy="27" r="4" fill="currentColor" />
    </svg>
  );
}
