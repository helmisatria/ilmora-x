import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { TopBar } from "../components/Navigation";
import { packages } from "../data";
import type { Package } from "../data/entitlements";

export const Route = createFileRoute("/premium")({
  component: PremiumComponent,
});

const premiumAccent = "#f5b544";
const premiumDark = "#2f281c";

const features = [
  { label: "Akses semua tryout", free: true, premium: true },
  { label: "Tryout khusus premium", free: false, premium: true },
  { label: "Materi belajar lengkap", free: "basic", premium: true },
  { label: "Video pembahasan", free: false, premium: true },
  { label: "Evaluation Dashboard", free: "basic", premium: true },
  { label: "Analisis per kategori", free: false, premium: true },
  { label: "Leaderboard mingguan", free: true, premium: true },
  { label: "Koleksi lencana", free: true, premium: true },
] as const;

function PremiumComponent() {
  const [selectedPackageId, setSelectedPackageId] = useState(packages.find((pkg) => pkg.active)?.id ?? 1);
  const selectedPackage = packages.find((pkg) => pkg.id === selectedPackageId) ?? packages[0];
  const activePackages = packages.filter((pkg) => pkg.active);

  return (
    <main
      className="app-shell overflow-x-hidden"
      style={{
        background:
          "linear-gradient(180deg, #fff8eb 0%, #fbfaf7 42%, #eef8f6 100%)",
      }}
    >
      <div
        className="relative overflow-hidden pb-8"
        style={{
          background:
            "radial-gradient(900px 340px at 10% -18%, #f59e0b38, transparent 62%), radial-gradient(720px 340px at 94% -12%, #14b8a61f, transparent 68%), linear-gradient(180deg, #fff8eb 0%, #fbfaf7 100%)",
        }}
      >
        <TopBar />

        <div className="px-5 pt-7">
          <Link to="/dashboard" className="mb-5 inline-flex items-center gap-2 text-[12px] font-bold text-stone-500 no-underline">
            <ArrowLeftIcon />
            Kembali
          </Link>

          <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            IlmoraX Premium
          </div>
          <h1 className="mt-2 max-w-[22ch] text-[28px] font-bold leading-tight tracking-tight text-stone-800">
            Upgrade latihan dengan evaluasi yang lebih tajam
          </h1>
          <p className="m-0 mt-3 max-w-[34ch] text-[14px] font-medium leading-relaxed text-stone-500">
            Buka tryout premium, pembahasan video, dan dashboard evaluasi lengkap dalam satu paket belajar.
          </p>

          <PremiumHeroPanel />
        </div>
      </div>

      <div className="relative -mt-4 px-5 pb-24">
        <SectionHeader title="Pilih Paket" />
        <div className="grid gap-3">
          {activePackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isSelected={selectedPackageId === pkg.id}
              onSelect={() => setSelectedPackageId(pkg.id)}
            />
          ))}
        </div>

        <div className="mt-6">
          <SectionHeader title="Fitur Premium" />
          <div className="overflow-hidden rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white shadow-sm">
            <div className="grid grid-cols-[1fr_74px_84px] gap-2 border-b border-stone-100 bg-stone-50 px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Fitur</span>
              <span className="text-center text-[11px] font-semibold uppercase tracking-wide text-stone-400">Gratis</span>
              <span className="text-center text-[11px] font-semibold uppercase tracking-wide text-amber-700">Premium</span>
            </div>
            {features.map((feature) => (
              <FeatureRow key={feature.label} feature={feature} />
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[var(--radius-xl)] border-2 border-amber-300 border-b-4 border-b-amber-600 bg-[#2f281c] p-5 text-amber-50 shadow-sm">
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

        <Link
          to="/checkout"
          search={{ packageId: selectedPackage.id }}
          className="btn btn-lg mt-5 w-full"
          style={{
            background: premiumDark,
            color: "#fff7ed",
            borderBottomColor: "#a16207",
          }}
        >
          Lanjut ke Pembayaran - Rp{selectedPackage.price.toLocaleString("id-ID")}
        </Link>
      </div>
    </main>
  );
}

function PremiumHeroPanel() {
  return (
    <div className="relative mt-6 overflow-hidden rounded-[var(--radius-xl)] border-2 border-amber-300 border-b-4 border-b-amber-600 bg-[#2f281c] p-5 text-amber-50 shadow-sm">
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
        <div className="flex items-start gap-3">
          <IconTile icon={<CrownIcon />} accent={premiumAccent} />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/75">
              Paket Belajar
            </div>
            <b className="mt-1 block text-[18px] font-bold leading-tight text-amber-50">
              Evaluation Dashboard lengkap
            </b>
            <p className="m-0 mt-2 max-w-[28ch] text-sm font-medium leading-relaxed text-amber-100/78">
              Lihat pola salah, prioritas kategori, dan rekomendasi latihan berikutnya.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 grid-flow-dense">
          <PremiumMiniStat label="Akurasi" value="Detail" />
          <PremiumMiniStat label="Review" value="Video" />
          <PremiumMiniStat label="Latihan" value="Target" />
        </div>
      </div>
    </div>
  );
}

function PackageCard({
  pkg,
  isSelected,
  onSelect,
}: {
  pkg: Package;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const monthlyPrice = Math.round(pkg.price / (pkg.durationDays / 30));
  const saving = Math.max(packages[0].price - monthlyPrice, 0);
  const isPopular = pkg.id === 2;

  return (
    <button
      className="group rounded-[var(--radius-lg)] border-2 border-b-4 bg-white p-5 text-left shadow-sm transition-all duration-150 hover:-translate-y-[3px] hover:shadow-md active:translate-y-[1px] active:border-b-2"
      style={{
        borderColor: isSelected ? "#14b8a655" : "#f5f5f4",
        borderBottomColor: isSelected ? "#0d9488" : "#e7e5e4",
        background: isSelected
          ? "linear-gradient(180deg, #ccfbf12e 0%, rgba(255,255,255,0.94) 78%)"
          : "#ffffff",
      }}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <b className="text-base font-bold leading-tight text-stone-800">{pkg.name}</b>
            {isPopular && <StatusPill label="Populer" accent={premiumAccent} />}
          </div>
          <p className="m-0 mt-1 max-w-[25ch] text-[13px] font-medium leading-relaxed text-stone-500">
            {pkg.description}
          </p>
          {saving > 0 && (
            <p className="m-0 mt-2 text-[12px] font-bold text-primary-dark">
              Rp{monthlyPrice.toLocaleString("id-ID")}/bulan - hemat Rp{saving.toLocaleString("id-ID")}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold leading-none tracking-tight text-stone-800">
            Rp{pkg.price.toLocaleString("id-ID")}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-stone-400">{pkg.durationDays} hari</div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full border-2"
          style={{
            background: isSelected ? "#14b8a6" : "#ffffff",
            borderColor: isSelected ? "#14b8a6" : "#d6d3d1",
            color: "#ffffff",
          }}
        >
          {isSelected && <CheckIcon />}
        </span>
      </div>
    </button>
  );
}

function FeatureRow({ feature }: { feature: (typeof features)[number] }) {
  return (
    <div className="grid grid-cols-[1fr_74px_84px] items-center gap-2 border-b border-stone-100 px-4 py-3 last:border-b-0">
      <span className="text-[13.5px] font-semibold leading-snug text-stone-700">{feature.label}</span>
      <FeatureValue value={feature.free} />
      <FeatureValue value={feature.premium} isPremium />
    </div>
  );
}

function FeatureValue({ value, isPremium = false }: { value: boolean | "basic"; isPremium?: boolean }) {
  if (value === "basic") {
    return <span className="text-center text-[11px] font-bold text-stone-400">Basic</span>;
  }

  if (!value) {
    return <span className="text-center text-sm font-bold text-stone-300">-</span>;
  }

  return (
    <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border-2 ${isPremium ? "border-amber-200 bg-amber-50 text-amber-700" : "border-teal-100 bg-teal-50 text-primary"}`}>
      <CheckIcon />
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

function PremiumMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] border-2 border-amber-200/16 bg-white/8 px-2 py-2.5 text-center">
      <div className="text-[12px] font-bold leading-none text-amber-50">{value}</div>
      <div className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-amber-100/55">{label}</div>
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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="m5 12 4.2 4.2L19 6.8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
