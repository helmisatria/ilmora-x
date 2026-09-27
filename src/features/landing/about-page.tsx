import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { businessDetails } from "./landing-content";
import {
  ArrowUpRightIcon,
  BarChartIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  HeadsetIcon,
  SparkIcon,
  TargetBadgeIcon,
  UsersIcon,
} from "./landing-icons";
import { PublicNavigation } from "./public-navigation";

const learningPrinciples = [
  {
    title: "Kerjakan try-out",
    body: "Jawab dengan timer seperti saat ujian.",
    icon: <ClockIcon />,
    tone: "bg-[#fff0bf] text-[#8b5b00] shadow-[#e6b640]",
  },
  {
    title: "Lihat evaluasi",
    body: "Cek akurasi per topik dan pembahasan jawaban.",
    icon: <BarChartIcon />,
    tone: "bg-[#e8f5ff] text-[#23698f] shadow-[#a9d3ed]",
  },
  {
    title: "Ulangi topik yang lemah",
    body: "Pilih latihan berikutnya dari hasilmu.",
    icon: <TargetBadgeIcon />,
    tone: "bg-[#e7f9ef] text-[#15725c] shadow-[#9bd8c4]",
  },
] as const;

export function AboutPage() {
  return (
    <main
      className="min-h-[100dvh] overflow-x-hidden bg-[#f7faf9] text-[#202124]"
      style={{ fontFamily: "'Geist', 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" }}
    >
      <PublicNavigation />
      <AboutHero />
      <PurposeSection />
      <LearningPrinciplesSection />
      <BusinessSection />
      <AboutCta />
      <AboutFooter />
    </main>
  );
}

function AboutHero() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-28 sm:px-6 lg:pb-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(760px 480px at 0% 0%, rgba(91,211,187,0.48), transparent 70%), radial-gradient(740px 460px at 100% 4%, rgba(255,205,91,0.46), transparent 72%), linear-gradient(180deg,#f8fffd 0%,#f2faf7 100%)",
        }}
      />
      <DotPattern className="opacity-[0.22]" />
      <div className="pointer-events-none absolute -left-20 top-36 h-52 w-52 rounded-full border-[30px] border-white/45" />
      <div className="pointer-events-none absolute -right-16 bottom-14 h-44 w-44 rotate-12 rounded-[42px] bg-[#ff8c87]/14" />

      <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-12 lg:grid-cols-[0.94fr_1.06fr] lg:gap-16">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#9ed9cc] bg-white/85 px-3.5 py-2 text-[12px] font-black text-[var(--brand-primary)] shadow-[0_5px_0_#c9e9e2] backdrop-blur-sm">
            <span className="text-[#18a98d]"><SparkIcon /></span>
            Kenalan dengan IlmoraX
          </div>
          <h1 className="mt-6 max-w-[11ch] text-[clamp(3rem,6vw,5.5rem)] font-[780] leading-[0.92] tracking-[-0.055em]">
            Kami ingin latihanmu punya arah.
          </h1>
          <p className="mt-7 max-w-[40ch] text-[17px] leading-[1.72] text-stone-600 sm:text-[18px]">
            IlmoraX dibuat untuk calon apoteker yang butuh lebih dari kumpulan soal. Setiap hasil membantu kamu menentukan apa yang perlu dipelajari berikutnya.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <PrimaryLink to="/tryout">Lihat try-out</PrimaryLink>
            <Link
              to="/premium"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#bedfd7] bg-white px-6 text-[14px] font-black text-stone-800 no-underline shadow-[0_4px_0_#d6e9e5] transition-transform hover:-translate-y-0.5 active:translate-y-px"
            >
              Lihat Premium <ArrowUpRightIcon />
            </Link>
          </div>
        </Reveal>

        <Reveal className="w-full lg:justify-self-end">
          <AboutHeroVisual />
        </Reveal>
      </div>
    </section>
  );
}

function AboutHeroVisual() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-[560px] px-2 py-10 sm:px-8 sm:py-12">
      <motion.div
        animate={shouldReduceMotion ? undefined : { y: [0, -6, 0], rotate: [-3, -2, -3] }}
        className="absolute left-0 top-7 z-20 hidden -rotate-3 rounded-[16px] border border-[#f0c04e] bg-[#fff1b9] px-4 py-3 text-[11px] font-black text-[#805400] shadow-[0_6px_0_#dea925] sm:flex sm:items-center sm:gap-2"
        transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
      >
        <UsersIcon /> Dibuat untuk calon apoteker
      </motion.div>

      <div className="relative aspect-[1.05/1] overflow-hidden rounded-[42px] border-2 border-[#90d2c4] bg-[radial-gradient(circle_at_52%_28%,#fff8d9_0%,#dcf7ef_44%,#91d3c5_100%)] shadow-[0_10px_0_#70b8a9,0_34px_75px_rgba(35,105,88,0.2)]">
        <DotPattern className="opacity-[0.28]" />
        <div className="pointer-events-none absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-[#ffd05d]/45" />
        <div className="pointer-events-none absolute bottom-8 left-[24%] h-16 w-[58%] rounded-full bg-[#256f5e]/18 blur-xl" />
        <img
          src="/ilmorax-owl-pharmacist.webp"
          alt="Maskot burung hantu IlmoraX memakai jas apoteker"
          className="absolute bottom-0 right-[-2%] z-10 h-[90%] w-auto max-w-none object-contain object-bottom drop-shadow-[0_22px_25px_rgba(43,74,65,0.2)] sm:h-[94%]"
          fetchPriority="high"
        />

        <motion.div
          animate={shouldReduceMotion ? undefined : { y: [0, 5, 0], rotate: [-2, -1, -2] }}
          className="absolute bottom-[8%] left-[4%] z-20 w-[48%] -rotate-2 rounded-[20px] border border-[#b9dcd5] bg-white/95 p-4 shadow-[0_7px_0_#82c0b4,0_22px_35px_rgba(35,92,79,0.16)] backdrop-blur-sm sm:left-[5%] sm:w-[46%] sm:p-5"
          transition={{ duration: 4.8, ease: "easeInOut", repeat: Infinity }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-stone-400">Setelah try-out</p>
          <div className="mt-3 space-y-2.5 text-[11px] font-black text-stone-700 sm:text-[12px]">
            <LoopRow icon={<BarChartIcon />} label="Evaluasi hasil" tone="text-[#24749d]" />
            <LoopRow icon={<TargetBadgeIcon />} label="Pilih topik" tone="text-[#d85860]" />
            <LoopRow icon={<BookOpenIcon />} label="Pelajari lagi" tone="text-[#168c74]" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function LoopRow({ icon, label, tone }: { icon: ReactNode; label: string; tone: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[10px] bg-stone-50 px-2.5 py-2">
      <span className={`scale-75 ${tone}`}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function PurposeSection() {
  return (
    <section className="relative overflow-hidden bg-[#fff7df] px-5 py-16 sm:px-6 lg:py-20">
      <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-[#ffd05d]/22" />
      <div className="pointer-events-none absolute bottom-10 left-[7%] grid grid-cols-6 gap-3 opacity-25">
        {Array.from({ length: 24 }).map((_, index) => <i key={index} className="h-1.5 w-1.5 rounded-full bg-[#cf9217]" />)}
      </div>

      <div className="relative mx-auto w-full max-w-[860px]">
        <Reveal>
          <p className="text-[13px] font-black text-[#a86b00]">Kenapa IlmoraX dibuat</p>
          <h2 className="mt-4 max-w-[14ch] text-[clamp(2.7rem,5vw,4.6rem)] font-[760] leading-[0.96] tracking-[-0.05em]">
            Banyak soal bukan tujuan.
          </h2>
          <p className="mt-7 max-w-[54ch] text-[17px] leading-[1.75] text-stone-600 sm:text-[18px]">
            IlmoraX menunjukkan topik yang perlu kamu ulangi dan latihan yang cocok dikerjakan setelahnya.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function LearningPrinciplesSection() {
  return (
    <section className="relative overflow-hidden bg-[#173f5a] px-5 py-16 text-white sm:px-6 lg:py-20">
      <DotPattern className="opacity-[0.14]" light />
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full border-[36px] border-[#45c5ad]/14" />
      <div className="pointer-events-none absolute -bottom-24 right-[8%] h-56 w-56 rotate-12 rounded-[54px] bg-[#ff8c87]/12" />

      <div className="relative mx-auto w-full max-w-[860px]">
        <Reveal>
          <p className="text-[13px] font-black text-[#9fe4d6]">Cara kami membantu</p>
          <h2 className="mt-4 max-w-[12ch] text-[clamp(2.7rem,5vw,4.7rem)] font-[760] leading-[0.96] tracking-[-0.05em]">
            Coba. Evaluasi. Ulangi.
          </h2>
          <p className="mt-6 max-w-[48ch] text-[16px] leading-[1.75] text-[#d0e6ed]">
            Hasil try-out membantu kamu memilih langkah berikutnya.
          </p>
        </Reveal>

        <Reveal className="mt-10">
          <div className="relative space-y-4 before:absolute before:bottom-10 before:left-7 before:top-10 before:w-1 before:rounded-full before:bg-white/12">
            {learningPrinciples.map((principle, index) => (
              <div
                key={principle.title}
                className="relative grid gap-4 rounded-[22px] border border-white/12 bg-white/[0.07] p-5 backdrop-blur-sm sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-6 sm:p-6"
              >
                <div className={`z-10 flex h-14 w-14 items-center justify-center rounded-[17px] shadow-[0_5px_0] ${principle.tone}`}>
                  {principle.icon}
                </div>
                <div>
                  <h3 className="text-[20px] font-black tracking-tight">{principle.title}</h3>
                  <p className="mt-1.5 max-w-[54ch] text-[14px] leading-[1.65] text-[#c8dfe7]">{principle.body}</p>
                </div>
                <span className="hidden text-[12px] font-black text-white/35 sm:block">0{index + 1}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function BusinessSection() {
  return (
    <section className="relative overflow-hidden bg-[#f4faf8] px-5 py-20 sm:px-6 lg:py-24">
      <div className="pointer-events-none absolute -right-16 bottom-8 h-56 w-56 rounded-full bg-[#8bd6c6]/18" />
      <div className="relative mx-auto grid w-full max-w-[1180px] gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch">
        <Reveal className="flex flex-col justify-between rounded-[28px] border-2 border-[#a8ddd2] bg-[#dff6f0] p-7 shadow-[0_8px_0_#9acfc4] sm:p-9">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-[17px] bg-white text-[var(--brand-primary)] shadow-[0_5px_0_#bddfd8]">
              <UsersIcon />
            </div>
            <p className="mt-7 text-[13px] font-black text-[#197a66]">Di balik IlmoraX</p>
            <h2 className="mt-3 max-w-[12ch] text-[clamp(2.4rem,4vw,3.8rem)] font-[760] leading-[0.98] tracking-[-0.045em]">
              Dibangun oleh Ilmora Academy.
            </h2>
            <p className="mt-5 max-w-[40ch] text-[16px] leading-[1.75] text-stone-600">
              Tim kami mengembangkan dan mengoperasikan IlmoraX dari Denpasar, Bali. Pertanyaan soal layanan, akun, atau paket bisa langsung disampaikan kepada kami.
            </p>
          </div>
          <a
            href={businessDetails.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 self-start text-[14px] font-black text-[var(--brand-primary)] no-underline hover:underline"
          >
            Buka lokasi kami <ArrowUpRightIcon />
          </a>
        </Reveal>

        <Reveal className="rounded-[28px] border-2 border-[#d6e6e2] bg-white p-7 shadow-[0_8px_0_#dce9e6,0_28px_55px_rgba(43,91,79,0.1)] sm:p-9">
          <div className="flex flex-col gap-4 border-b border-[#dfe9e6] pb-7 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[12px] font-black text-[#b0720b]">Informasi resmi</p>
              <h3 className="mt-2 text-[28px] font-black tracking-tight">{businessDetails.name}</h3>
            </div>
            <span className="inline-flex items-center gap-2 self-start rounded-full bg-[#edf8f5] px-3 py-2 text-[11px] font-black text-[#187763]">
              <CheckCircleIcon /> Siap membantu
            </span>
          </div>

          <div className="grid gap-7 py-7 sm:grid-cols-[120px_1fr]">
            <span className="text-[11px] font-black uppercase tracking-[0.09em] text-stone-400">Alamat</span>
            <address className="max-w-[48ch] text-[15px] not-italic leading-[1.75] text-stone-700">{businessDetails.address}</address>
          </div>

          <div className="grid gap-7 border-t border-[#dfe9e6] pt-7 sm:grid-cols-[120px_1fr]">
            <span className="text-[11px] font-black uppercase tracking-[0.09em] text-stone-400">Hubungi tim</span>
            <div className="grid gap-3">
              {businessDetails.contacts.map((contact) => (
                <ContactLink key={contact.label} href={contact.whatsappUrl} label={contact.label} value={contact.phone} />
              ))}
              <ContactLink href={`mailto:${businessDetails.email}`} label="Email" value={businessDetails.email} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ContactLink({ href, label, value }: { href: string; label: string; value: string }) {
  const opensNewTab = !href.startsWith("mailto:");

  return (
    <a
      href={href}
      target={opensNewTab ? "_blank" : undefined}
      rel={opensNewTab ? "noreferrer" : undefined}
      className="group flex flex-col gap-1 rounded-[14px] bg-[#f7faf9] px-4 py-3 text-stone-800 no-underline transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
    >
      <span className="flex items-center gap-2 text-[12px] font-bold text-stone-500"><HeadsetIcon /> {label}</span>
      <span className="text-[14px] font-black tracking-tight group-hover:text-[var(--brand-primary)]">{value}</span>
    </a>
  );
}

function AboutCta() {
  return (
    <section className="relative overflow-hidden bg-[#fff7df] px-5 py-16 sm:px-6 lg:py-20">
      <div className="relative mx-auto grid min-h-[420px] w-full max-w-[1180px] overflow-hidden rounded-[30px] border-2 border-[#e7bd51] bg-[#ffc94f] shadow-[0_9px_0_#d99b19,0_30px_60px_rgba(142,96,18,0.18)] lg:grid-cols-[1fr_0.72fr] lg:items-center">
        <DotPattern className="opacity-[0.2]" />
        <div className="relative z-10 px-7 pb-4 pt-10 sm:px-10 lg:px-14 lg:py-14">
          <p className="text-[13px] font-black text-[#795100]">Mulai dari kondisi belajarmu sekarang</p>
          <h2 className="mt-4 max-w-[11ch] text-[clamp(2.7rem,5vw,4.7rem)] font-[760] leading-[0.95] tracking-[-0.05em] text-[#2d281e]">
            Coba satu try-out. Lihat hasilnya.
          </h2>
          <p className="mt-5 max-w-[38ch] text-[16px] leading-[1.7] text-[#5f4a20]">
            Dari sana, kamu akan tahu topik yang perlu dipelajari lagi.
          </p>
          <div className="mt-8 inline-flex">
            <PrimaryLink to="/tryout">Pilih try-out</PrimaryLink>
          </div>
        </div>

        <div className="relative min-h-[280px] self-stretch lg:min-h-0">
          <div className="pointer-events-none absolute -bottom-16 -right-10 h-72 w-72 rounded-full bg-[#52c6ae]/38" />
          <img
            src="/ilmorax-owl-celebrate.webp"
            alt="Maskot IlmoraX mengajak calon apoteker mulai latihan"
            className="absolute bottom-[-3%] left-1/2 h-[300px] w-[300px] -translate-x-1/2 object-contain object-bottom drop-shadow-[0_22px_24px_rgba(105,69,13,0.2)] sm:h-[330px] sm:w-[330px] lg:bottom-[-2%] lg:h-[390px] lg:w-[390px]"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

function PrimaryLink({ children, to }: { children: ReactNode; to: "/tryout" }) {
  return (
    <Link
      to={to}
      search={{ intent: "home_tryout" }}
      className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--brand-primary)] px-6 text-[14px] font-black text-white no-underline shadow-[0_5px_0_#123b57] transition-transform hover:-translate-y-0.5 active:translate-y-px"
    >
      {children} <ArrowUpRightIcon />
    </Link>
  );
}

function AboutFooter() {
  return (
    <footer className="border-t border-[#d8e5e1] bg-[#f7faf9] px-5 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 text-[13px] text-stone-500 sm:flex-row sm:items-center sm:justify-between">
        <p>IlmoraX oleh {businessDetails.name}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <a href={`mailto:${businessDetails.email}`} className="text-stone-600 no-underline hover:text-[var(--brand-primary)]">{businessDetails.email}</a>
          <Link to="/" className="text-stone-600 no-underline hover:text-[var(--brand-primary)]">Beranda</Link>
        </div>
      </div>
    </footer>
  );
}

function DotPattern({ className, light = false }: { className: string; light?: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: `radial-gradient(${light ? "#b8f0e4" : "#66ad9e"} 1.2px, transparent 1.2px)`,
        backgroundSize: "23px 23px",
        maskImage: "linear-gradient(90deg, transparent 4%, black 45%, black 100%)",
      }}
    />
  );
}

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ amount: 0.18, once: true }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );
}
