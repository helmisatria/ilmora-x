import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useProductAnalytics } from "../../lib/product-analytics-client";
import gsap from "gsap";
import { TopBar } from "../../components/Navigation";
import type { listMembershipProducts } from "./checkout-functions";
import type { listProgressSummary } from "../student/student-progress-functions";

const features = [
  "Tryout premium",
  "Pembahasan video",
  "Evaluasi per materi",
  "Rekomendasi latihan",
] as const;

const premiumStudyFlow = [
  "Kerjakan tryout premium",
  "Lihat materi yang masih lemah",
  "Tonton pembahasan yang dibutuhkan",
  "Lanjutkan dengan latihan yang disarankan",
] as const;

type Product = Awaited<ReturnType<typeof listMembershipProducts>>[number];

export function PremiumPage({
  summary,
  products,
}: {
  summary: Awaited<ReturnType<typeof listProgressSummary>>;
  products: Product[];
}) {
  const posthog = useProductAnalytics();
  const [selectedProductId, setSelectedProductId] = useState(products.find((product) => product.active)?.id ?? products[0]?.id ?? "");
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? products[0];
  const activeProducts = products.filter((product) => product.active);

  const heroRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const animatedElements = [
        heroRef.current,
        panelRef.current,
        comparisonRef.current,
        ...(cardsRef.current ? Array.from(cardsRef.current.children) : []),
        ...(sidebarRef.current ? Array.from(sidebarRef.current.children) : []),
      ].filter(Boolean);

      gsap.set(animatedElements, { opacity: 1, clearProps: "transform" });
      return;
    }

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
    <main className="premium-shell overflow-x-hidden bg-[#f7f7f3]">
      <div className="relative border-b border-stone-200 bg-[#fbfaf6] pb-10">
        <TopBar progress={{ xp: summary.xp, streak: summary.streak }} />

        <div className="premium-lane pt-8 lg:pt-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-center lg:gap-16">
            <div ref={heroRef} style={{ opacity: 0 }}>
              <Link to="/dashboard" className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-[12px] font-bold text-stone-500 no-underline outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                <ArrowLeftIcon />
                Kembali
              </Link>

              <div className="flex items-center gap-3 text-[12px] font-semibold text-stone-600">
                <span className="h-0.5 w-8 bg-amber-500" aria-hidden="true" />
                Belajar setelah tryout
              </div>
              <h1 className="mt-4 max-w-[16ch] text-balance text-[36px] font-extrabold leading-[1.08] tracking-[-0.045em] text-stone-900 sm:text-[48px]">
                Jangan berhenti di skor akhir.
              </h1>
              <p className="m-0 mt-5 max-w-[52ch] text-pretty text-[15px] font-medium leading-7 text-stone-600 sm:text-base">
                Premium menunjukkan materi yang masih lemah, lalu mengarahkanmu ke pembahasan video dan latihan berikutnya.
              </p>
            </div>

            <div ref={panelRef} style={{ opacity: 0 }}>
              <PremiumStudyFlow />
            </div>
          </div>
        </div>
      </div>

      <div className="premium-lane relative py-10 pb-24 lg:py-14 lg:pb-24">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
          <div className="min-w-0">
            <SectionHeader
              title="Pilih durasi akses"
              description="Semua paket membuka fitur yang sama. Pilih durasi yang sesuai dengan jadwal belajarmu."
            />
            <div ref={cardsRef} className="grid gap-3" role="group" aria-label="Pilih paket premium">
              {activeProducts.map((product) => (
                <div key={product.id} style={{ opacity: 0 }}>
                  <PackageCard
                    product={product}
                    isSelected={selectedProductId === product.id}
                    onSelect={() => {
                      setSelectedProductId(product.id);
                      posthog.capture("premium_package_selected", {
                        product_id: product.id,
                        product_name: product.name,
                        price: product.price,
                        duration_days: product.durationDays,
                      });
                    }}
                  />
                </div>
              ))}
            </div>

            <div ref={comparisonRef} style={{ opacity: 0 }}>
              <FeatureComparison />
            </div>
          </div>

          <aside ref={sidebarRef} className="min-w-0 xl:sticky xl:top-24">
            <div style={{ opacity: 0 }}>
              <div className="mt-6 rounded-2xl border border-amber-200 border-l-4 border-l-amber-500 bg-[#fff9e8] p-5 text-stone-800 xl:mt-0">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <ReceiptIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-semibold text-amber-800">
                      Pembayaran satu kali
                    </div>
                    <h2 className="mt-1 text-xl font-bold leading-tight tracking-tight text-stone-900">
                      Tidak diperpanjang otomatis
                    </h2>
                    <p className="m-0 mt-2 max-w-[34ch] text-[13.5px] font-medium leading-relaxed text-stone-600">
                      Jika Premium masih aktif, durasi baru ditambahkan setelah masa aktifmu berakhir.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ opacity: 0 }}>
              {selectedProduct ? (
                <Link
                  to="/checkout"
                  search={{ productId: selectedProduct.id }}
                  className="group mt-5 flex min-h-14 w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl bg-primary px-5 py-3.5 text-base font-extrabold tracking-wide text-white no-underline outline-none shadow-[0_12px_26px_-16px_rgba(21,61,92,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-light focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-0.5 sm:flex-nowrap sm:px-6 sm:py-4"
                  onClick={() => posthog.capture("premium_checkout_clicked", {
                    product_id: selectedProduct.id,
                    product_name: selectedProduct.name,
                    price: selectedProduct.price,
                    duration_days: selectedProduct.durationDays,
                  })}
                >
                  <span>Lanjut bayar</span>
                  <span className="flex items-center gap-2">
                    Rp{selectedProduct.price.toLocaleString("id-ID")}
                    <ArrowRightIcon />
                  </span>
                </Link>
              ) : (
                <div className="mt-5 rounded-[var(--radius-lg)] border-2 border-stone-100 bg-white p-4 text-sm font-bold text-stone-400">
                  Belum ada paket Premium yang aktif.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function PremiumStudyFlow() {
  return (
    <section className="relative mt-2 overflow-hidden rounded-[22px] border border-stone-200 bg-white px-5 py-6 shadow-[0_24px_60px_-42px_rgba(41,37,36,0.5)] sm:px-7 sm:py-7 lg:mt-0" aria-labelledby="premium-flow-title">
      <div className="absolute bottom-0 left-0 top-0 w-1 bg-amber-400" aria-hidden="true" />
      <p className="text-[12px] font-semibold text-stone-500">Alur belajar Premium</p>
      <h2 id="premium-flow-title" className="mt-1 text-[22px] font-bold tracking-tight text-stone-900">
        Satu hasil, langkah berikutnya jelas
      </h2>

      <ol className="mt-6 grid gap-0">
        {premiumStudyFlow.map((step, index) => (
          <li key={step} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 border-t border-stone-100 py-3.5 first:border-t-0 first:pt-0 last:pb-0">
            <span className="font-mono text-[12px] font-semibold tabular-nums text-primary" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[14px] font-semibold leading-snug text-stone-700">{step}</span>
          </li>
        ))}
      </ol>
    </section>
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
  const isPopular = product.durationDays === 180;

  return (
    <button
      className="group w-full rounded-2xl border bg-white px-4 py-4 text-left outline-none transition-all duration-200 hover:border-stone-300 hover:shadow-[0_18px_34px_-30px_rgba(41,37,36,0.7)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-px sm:px-5 sm:py-5"
      style={{
        borderColor: isSelected ? "#205072" : "#e7e5e4",
        background: isSelected ? "#f1f7fb" : "#ffffff",
        boxShadow: isSelected ? "0 0 0 1px #205072" : undefined,
      }}
      onClick={onSelect}
      type="button"
      aria-pressed={isSelected}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-5">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
          style={{
            background: isSelected ? "#dcecf7" : "#ffffff",
            borderColor: isSelected ? "#205072" : "#d6d3d1",
            color: "#205072",
          }}
        >
          {isSelected && <span className="h-3.5 w-3.5 rounded-full bg-primary" />}
        </span>

        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-3">
          <b className="text-base font-bold leading-tight text-stone-800 sm:text-lg">{product.name}</b>
          <DurationPill days={product.durationDays ?? 0} />
          {isPopular && <StatusPill label="Populer" />}
        </div>

        <div className="col-start-2 flex min-w-0 items-center justify-between gap-3 sm:col-start-auto sm:justify-end sm:gap-4">
          <div className="min-w-0 text-left sm:text-right">
            <div className="font-mono text-lg font-bold leading-none tracking-tight tabular-nums text-stone-900 sm:text-xl">
              Rp{product.price.toLocaleString("id-ID")}
            </div>
          </div>

          {savingPercent > 0 && <SavingPill value={savingPercent} />}

          <span
            className="hidden h-9 w-9 items-center justify-center rounded-full border sm:flex"
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
  if (product.durationDays === 180) return 15;
  if (product.durationDays === 365) return 32;

  return 0;
}

function FeatureComparison() {
  return (
    <section className="mt-10" aria-labelledby="feature-comparison-title">
      <h2 id="feature-comparison-title" className="text-xl font-bold tracking-tight text-stone-900">
        Akses yang kamu dapat
      </h2>
      <p className="mt-1 max-w-[54ch] text-[13.5px] font-medium leading-relaxed text-stone-500">
        Akun gratis tetap bisa belajar. Premium menambahkan evaluasi dan arahan setelah tryout.
      </p>
      <div className="mt-4 overflow-hidden border-y border-stone-200 bg-white px-1 sm:px-3">
        <table className="w-full table-fixed border-collapse">
          <caption className="sr-only">Perbandingan fitur paket gratis dan premium</caption>
          <thead>
            <tr className="border-b border-stone-200">
              <th scope="col" className="w-1/2 px-2 py-3 text-left text-[12px] font-semibold text-stone-700 sm:text-[13px]">
                Fitur
              </th>
              <th scope="col" className="w-1/4 px-1 py-3 text-center text-[12px] font-semibold text-stone-700 sm:text-[13px]">
                Gratis
              </th>
              <th scope="col" className="w-1/4 px-1 py-3 text-center text-[12px] font-semibold text-stone-800 sm:text-[13px]">
                Premium
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <ComparisonRow key={feature} feature={feature} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ComparisonRow({ feature }: { feature: (typeof features)[number] }) {
  return (
    <tr className="border-b border-stone-100 last:border-b-0">
      <th scope="row" className="px-2 py-3 text-left text-[12px] font-semibold leading-snug text-stone-700 sm:text-[13px]">
        {feature}
      </th>
      <td className="px-1 py-3 text-center">
        <FeatureValue isPremium={false} label={`${feature} tidak tersedia di paket gratis`} />
      </td>
      <td className="px-1 py-3 text-center">
        <FeatureValue isPremium label={`${feature} tersedia di paket premium`} />
      </td>
    </tr>
  );
}

function FeatureValue({ isPremium, label }: { isPremium: boolean; label: string }) {
  if (!isPremium) return <MinusIcon label={label} />;

  return <CheckBadgeIcon label={label} />;
}

function DurationPill({ days }: { days: number }) {
  return (
    <span className="text-[12px] font-semibold leading-none text-stone-500">
      · {days} hari
    </span>
  );
}

function SavingPill({ value }: { value: number }) {
  return (
    <span className="hidden text-[12px] font-semibold leading-none text-emerald-700 md:inline-flex">
      Hemat {value}%
    </span>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-[26px] font-bold tracking-tight text-stone-900">{title}</h2>
      <p className="mt-1 max-w-[58ch] text-pretty text-[13.5px] font-medium leading-relaxed text-stone-500">
        {description}
      </p>
    </div>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
      {label}
    </span>
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

function CheckBadgeIcon({ label }: { label: string }) {
  return (
    <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white" role="img" aria-label={label}>
      <CheckIcon />
    </span>
  );
}

function MinusIcon({ label }: { label: string }) {
  return (
    <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-stone-300 text-white" role="img" aria-label={label}>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
        <path d="M7 12h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
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
