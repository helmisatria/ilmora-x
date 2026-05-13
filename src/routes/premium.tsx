import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { TopBar } from "../components/Navigation";
import { membershipProducts } from "../data";
import type { Product } from "../data/entitlements";
import { listProgressSummary } from "../lib/student-functions";

export const Route = createFileRoute("/premium")({
  loader: async () => {
    const summary = await listProgressSummary();

    return { summary };
  },
  head: () => ({
    meta: [
      { title: "Upgrade Premium — IlmoraX" },
      { name: "description", content: "Buka semua tryout premium, video pembahasan lengkap, dan evaluation dashboard. Paket mulai dari Rp49rb/bulan. Tidak auto-renew." },
      { property: "og:title", content: "Upgrade Premium — IlmoraX" },
      { property: "og:description", content: "Buka semua tryout premium, video pembahasan lengkap, dan evaluation dashboard. Paket mulai dari Rp49rb/bulan." },
    ],
  }),
  component: PremiumComponent,
});

const premiumAccent = "#f5b544";
const premiumDark = "#2f281c";

const features = [
  "Tryout premium",
  "Video",
  "Evaluasi",
  "Rekomendasi",
] as const;

function PremiumComponent() {
  const { summary } = Route.useLoaderData() as { summary: Awaited<ReturnType<typeof listProgressSummary>> };
  const [selectedProductId, setSelectedProductId] = useState(membershipProducts.find((product) => product.active)?.id ?? 1);
  const selectedProduct = membershipProducts.find((product) => product.id === selectedProductId) ?? membershipProducts[0];
  const activeProducts = membershipProducts.filter((product) => product.active);

  const heroRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        heroRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, ease: "power3.out" }
      );

      gsap.fromTo(
        panelRef.current,
        { y: 40, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power3.out", delay: 0.12 }
      );

      if (cardsRef.current) {
        gsap.fromTo(
          cardsRef.current.children,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, ease: "power3.out", stagger: 0.08, delay: 0.2 }
        );
      }

      gsap.fromTo(
        comparisonRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", delay: 0.45 }
      );

      if (sidebarRef.current) {
        gsap.fromTo(
          sidebarRef.current.children,
          { x: 30, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.1, delay: 0.3 }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <main
      className="premium-shell overflow-x-hidden"
      style={{
        background:
          "linear-gradient(180deg, #fff8eb 0%, #fbfaf7 42%, #eef8f6 100%)",
      }}
    >
      <div
        className="relative overflow-hidden pb-8"
        style={{
          background:
            "radial-gradient(900px 340px at 10% -18%, #f59e0b38, transparent 62%), radial-gradient(720px 340px at 94% -12%, rgba(32,80,114,0.12), transparent 68%), linear-gradient(180deg, #fff8eb 0%, #fbfaf7 100%)",
        }}
      >
        <TopBar progress={{ xp: summary.xp, streak: summary.streak }} />

        <div className="premium-lane pt-7 lg:pt-9">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-end">
            <div ref={heroRef} style={{ opacity: 0 }}>
              <Link to="/dashboard" className="mb-5 inline-flex items-center gap-2 text-[12px] font-bold text-stone-500 no-underline">
                <ArrowLeftIcon />
                Kembali
              </Link>

              <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                IlmoraX Premium
              </div>
              <h1 className="mt-2 max-w-[22ch] text-[28px] font-bold leading-tight tracking-tight text-stone-800 sm:text-[34px]">
                Upgrade latihan dengan evaluasi yang lebih tajam
              </h1>
              <p className="m-0 mt-3 max-w-[34ch] text-[14px] font-medium leading-relaxed text-stone-500 sm:text-[15px]">
                Buka tryout premium, pembahasan video, dan dashboard evaluasi lengkap dalam satu paket belajar.
              </p>
            </div>

            <div ref={panelRef} style={{ opacity: 0 }}>
              <PremiumHeroPanel className="lg:mt-0" />
            </div>
          </div>
        </div>
      </div>

      <div className="premium-lane relative -mt-2 pb-24">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
          <div>
            <SectionHeader title="Pilih Paket" />
            <div ref={cardsRef} className="grid gap-3">
              {activeProducts.map((product) => (
                <div key={product.id} style={{ opacity: 0 }}>
                  <PackageCard
                    product={product}
                    isSelected={selectedProductId === product.id}
                    onSelect={() => setSelectedProductId(product.id)}
                  />
                </div>
              ))}
            </div>

            <div ref={comparisonRef} style={{ opacity: 0 }}>
              <FeatureComparison />
            </div>
          </div>

          <aside ref={sidebarRef} className="xl:sticky xl:top-24">
            <div style={{ opacity: 0 }}>
              <div className="mt-6 rounded-[var(--radius-xl)] border-2 border-amber-300 border-b-4 border-b-amber-600 bg-[#2f281c] p-5 text-amber-50 shadow-sm xl:mt-0">
                <div className="flex items-start gap-3">
                  <IconTile icon={<ReceiptIcon />} accent={premiumAccent} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/75">
                      Sekali Bayar
                    </div>
                    <h2 className="mt-1 text-xl font-bold leading-tight tracking-tight text-amber-50">
                      Tidak auto-renew
                    </h2>
                    <p className="m-0 mt-2 max-w-[31ch] text-[13.5px] font-medium leading-relaxed text-amber-100/75">
                      Durasi paket akan ditambahkan ke tanggal aktif yang sudah ada, lalu kembali ke akses gratis saat selesai.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ opacity: 0 }}>
              <Link
                to="/checkout"
                search={{ productId: selectedProduct.id }}
                className="group mt-5 flex w-full items-center justify-between gap-4 rounded-[var(--radius-lg)] border-2 border-amber-300 px-6 py-4 text-base font-extrabold tracking-wide text-stone-900 no-underline shadow-[0_14px_28px_-16px_rgba(180,83,9,0.55)] transition-all duration-150 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0.5"
                style={{
                  background: "linear-gradient(180deg, #fcd34d 0%, #f5b544 100%)",
                  borderBottomWidth: 5,
                  borderBottomColor: "#b45309",
                }}
              >
                <span>Lanjut bayar</span>
                <span className="flex items-center gap-2">
                  Rp{selectedProduct.price.toLocaleString("id-ID")}
                  <ArrowRightIcon />
                </span>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function PremiumHeroPanel({ className = "" }: { className?: string }) {
  return (
    <div className={`relative mt-6 overflow-hidden rounded-[var(--radius-xl)] border-2 border-amber-300 border-b-4 border-b-amber-600 bg-[#2f281c] p-5 text-amber-50 shadow-sm sm:p-6 ${className}`}>
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(360px 200px at 88% 0%, rgba(245,158,11,0.32), transparent 70%), radial-gradient(280px 190px at 0% 100%, rgba(20,184,166,0.2), transparent 72%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />

      <div className="relative">
        <div className="flex items-center gap-4">
          <IconTile icon={<CrownIcon />} accent={premiumAccent} />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/75">
              Paket Premium
            </div>
            <b className="mt-1 block text-[22px] font-bold leading-tight text-amber-50">
              Latihan lebih terarah
            </b>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <PremiumBenefitPill icon={<VideoIcon />} label="Video" />
          <PremiumBenefitPill icon={<DocumentIcon />} label="Review" />
          <PremiumBenefitPill icon={<TargetIcon />} label="Latihan" />
        </div>
      </div>
    </div>
  );
}

function PackageCard({
  product,
  isSelected,
  onSelect,
}: {
  product: Product;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const savingPercent = getSavingPercent(product);
  const isPopular = product.id === 2;

  return (
    <button
      className="group w-full rounded-[var(--radius-lg)] border-2 border-b-4 bg-white px-4 py-4 text-left shadow-sm transition-all duration-150 hover:-translate-y-[3px] hover:shadow-md active:translate-y-[1px] active:border-b-2 sm:px-5 sm:py-5"
      style={{
        borderColor: isSelected ? "#205072" : "#f5f5f4",
        borderBottomColor: isSelected ? "#153d5c" : "#e7e5e4",
        background: isSelected
          ? "linear-gradient(180deg, #f1f7fb 0%, rgba(255,255,255,0.96) 76%)"
          : "#ffffff",
      }}
      onClick={onSelect}
      type="button"
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:gap-5">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2"
          style={{
            background: isSelected ? "#dcecf7" : "#ffffff",
            borderColor: isSelected ? "#205072" : "#d6d3d1",
            color: "#205072",
          }}
        >
          {isSelected && <span className="h-3.5 w-3.5 rounded-full bg-primary" />}
        </span>

        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <b className="text-base font-bold leading-tight text-stone-800 sm:text-lg">{product.name}</b>
          <DurationPill days={product.durationDays ?? 0} />
          {isPopular && <StatusPill label="Populer" accent={premiumAccent} />}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 sm:gap-4">
          <div className="text-right">
            <div className="text-lg font-bold leading-none tracking-tight text-stone-900 sm:text-xl">
              Rp{product.price.toLocaleString("id-ID")}
            </div>
          </div>

          {savingPercent > 0 && <SavingPill value={savingPercent} />}

          <span
            className="hidden h-9 w-9 items-center justify-center rounded-full border-2 sm:flex"
            style={{
              background: isSelected ? "#205072" : "#ffffff",
              borderColor: isSelected ? "#205072" : "#d6d3d1",
              color: "#ffffff",
            }}
          >
            {isSelected && <CheckIcon />}
          </span>
        </div>
      </div>
    </button>
  );
}

function getSavingPercent(product: Product) {
  if (product.id === 2) return 15;
  if (product.id === 3) return 32;

  return 0;
}

function FeatureComparison() {
  return (
    <div className="mt-6 overflow-x-auto rounded-[var(--radius-lg)] border-2 border-amber-100 border-b-4 border-b-amber-100 bg-[#fffaf0]/72 px-4 py-4 shadow-sm sm:px-5">
      <div className="min-w-[620px]">
        <div className="grid grid-cols-[1fr_repeat(4,minmax(90px,1fr))] items-center gap-3 border-b border-amber-100 py-3">
          <span className="text-[13px] font-semibold text-stone-700">Fitur</span>
          {features.map((feature) => (
            <span key={feature} className="text-center text-[13px] font-semibold leading-tight text-stone-800">
              {feature}
            </span>
          ))}
        </div>

        <ComparisonRow label="Gratis" isPremium={false} />
        <ComparisonRow label="Premium" isPremium />
      </div>
    </div>
  );
}

function ComparisonRow({ label, isPremium }: { label: string; isPremium: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_repeat(4,minmax(90px,1fr))] items-center gap-3 border-b border-amber-100 py-3 last:border-b-0">
      <span className="text-[13px] font-semibold text-stone-600">{label}</span>
      {features.map((feature) => (
        <FeatureValue key={`${label}-${feature}`} isPremium={isPremium} />
      ))}
    </div>
  );
}

function FeatureValue({ isPremium }: { isPremium: boolean }) {
  if (!isPremium) return <MinusIcon />;

  return <CheckBadgeIcon />;
}

function DurationPill({ days }: { days: number }) {
  const isAmber = days === 180;

  return (
    <span
      className="rounded-full border-2 px-3 py-1 text-[12px] font-semibold leading-none"
      style={{
        color: isAmber ? "#b45309" : "#0b2135",
        borderColor: isAmber ? "#fed7aa" : "#dcecf7",
        background: isAmber ? "#fff7ed" : "#f1f7fb",
      }}
    >
      {days} hari
    </span>
  );
}

function SavingPill({ value }: { value: number }) {
  return (
    <span className="hidden rounded-full border-2 border-green-100 bg-green-50 px-3 py-1 text-[12px] font-semibold leading-none text-green-700 md:inline-flex">
      Hemat {value}%
    </span>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-[13px] font-semibold uppercase tracking-wide text-stone-500">{title}</span>
      <div className="h-px flex-1 bg-stone-200" />
    </div>
  );
}

function StatusPill({ label, accent }: { label: string; accent: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: "#92400e", borderColor: `${accent}44`, background: `${accent}18` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
      {label}
    </span>
  );
}

function PremiumBenefitPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border-2 border-amber-200/16 bg-white/8 px-3 py-2.5 text-amber-50">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-300/12 text-amber-300">
        {icon}
      </span>
      <span className="text-sm font-bold leading-none">{label}</span>
    </div>
  );
}

function IconTile({ icon, accent }: { icon: ReactNode; accent: string }) {
  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] border-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
      style={{
        color: accent,
        background: `${accent}18`,
        borderColor: `${accent}45`,
      }}
    >
      {icon}
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="m5 12 4.2 4.2L19 6.8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckBadgeIcon() {
  return (
    <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
      <CheckIcon />
    </span>
  );
}

function MinusIcon() {
  return (
    <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-stone-300 text-white">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
        <path d="M7 12h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="m4 8 4.2 3.4L12 5l3.8 6.4L20 8l-1.8 10H5.8L4 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6.5 21h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M7 3h10a2 2 0 0 1 2 2v16l-3-1.8-2 1.8-2-1.8-2 1.8-2-1.8L5 21V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M4 7.8C4 6.8 4.8 6 5.8 6h8.4c1 0 1.8.8 1.8 1.8v8.4c0 1-.8 1.8-1.8 1.8H5.8c-1 0-1.8-.8-1.8-1.8V7.8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m16 10 4-2.5v9L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 3v5h5M8 13h8M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
