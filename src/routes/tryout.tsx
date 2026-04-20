import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { BottomNav, TopBar } from "../components/Navigation";
import { PremiumDialog } from "../components/PremiumDialog";
import { getCategoryName, tryouts, useApp, type Tryout } from "../data";

export const Route = createFileRoute("/tryout")({
  component: TryoutComponent,
});

function TryoutComponent() {
  const location = useLocation();
  const { isPremium } = useApp();
  const [showPremium, setShowPremium] = useState(false);
  const [filter, setFilter] = useState<"all" | "free" | "premium">("all");

  if (location.pathname !== "/tryout") {
    return <Outlet />;
  }

  const filtered = tryouts.filter((t) => {
    if (filter === "all") return true;
    if (filter === "free") return !t.isPremium;
    return t.isPremium;
  });

  return (
    <>
      <div className="app-shell">
        <div
          className="relative overflow-hidden pb-8"
          style={{
            background:
              "radial-gradient(1000px 300px at 15% -20%, #14b8a622, transparent 60%), radial-gradient(760px 360px at 95% -18%, #14b8a614, transparent 68%), var(--color-bg)",
          }}
        >
          <TopBar />
          <div className="px-5 pt-7 pb-5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Modul Tryout
            </div>
            <h1 className="mt-2 text-[28px] leading-tight font-bold tracking-tight text-stone-800 max-w-[22ch]">
              Try-out UKAI
            </h1>
            <p className="m-0 mt-3 text-[14px] leading-relaxed text-stone-500 font-medium max-w-[34ch]">
              Pilih simulasi yang sesuai ritme belajarmu, lalu lanjutkan ke persiapan sebelum timer berjalan.
            </p>
          </div>

          <div className="flex gap-2 px-5 pb-1 overflow-x-auto">
            {(["all", "free", "premium"] as const).map((option) => (
              <FilterButton
                key={option}
                filter={option}
                isActive={filter === option}
                onClick={() => setFilter(option)}
              />
            ))}
          </div>
        </div>

        <div className="px-5 -mt-4 pb-24 relative">
          <div className="grid grid-cols-2 gap-3.5">
            {filtered.map((tryout) => (
              <TryoutCard
                key={tryout.id}
                tryout={tryout}
                isLocked={tryout.isPremium && !isPremium}
                onLockedClick={() => setShowPremium(true)}
              />
            ))}
          </div>

          {filtered.length === 0 && <EmptyState filter={filter} />}
        </div>
        <BottomNav active="tryout" />
      </div>
      <PremiumDialog
        isOpen={showPremium}
        onClose={() => setShowPremium(false)}
        onUpgrade={() => {
          setShowPremium(false);
        }}
      />
    </>
  );
}

function FilterButton({
  filter,
  isActive,
  onClick,
}: {
  filter: "all" | "free" | "premium";
  isActive: boolean;
  onClick: () => void;
}) {
  const label = getFilterLabel(filter);

  return (
    <button
      className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border-2 transition-all duration-150 active:translate-y-[1px]"
      style={{
        color: isActive ? "var(--color-primary-dark)" : "var(--color-stone-500)",
        borderColor: isActive ? "#14b8a633" : "var(--color-stone-200)",
        background: isActive ? "#14b8a610" : "#ffffff",
      }}
      onClick={onClick}
      type="button"
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: isActive ? "var(--color-primary)" : "var(--color-stone-300)" }}
      />
      {label}
    </button>
  );
}

function TryoutCard({
  tryout,
  isLocked,
  onLockedClick,
}: {
  tryout: Tryout;
  isLocked: boolean;
  onLockedClick: () => void;
}) {
  const accent = isLocked ? "var(--color-amber)" : tryout.color;
  const categoryName = getCategoryName(tryout.categoryId);

  return (
    <Link
      to={isLocked ? "/premium" : "/tryout/$id"}
      params={isLocked ? undefined : { id: String(tryout.id) }}
      className="group relative min-h-[238px] bg-white rounded-[var(--radius-lg)] p-4 flex flex-col shadow-sm border-2 border-stone-100 border-b-4 border-b-stone-200 transition-all duration-150 hover:-translate-y-[3px] hover:shadow-md active:translate-y-[1px] active:border-b-2 no-underline"
      onClick={(event) => {
        if (!isLocked) return;

        event.preventDefault();
        onLockedClick();
      }}
    >
      {tryout.isPremium && <PremiumPill />}

      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center border-2"
        style={{
          color: accent,
          background: `${normalizeCssColor(accent)}18`,
          borderColor: `${normalizeCssColor(accent)}22`,
        }}
      >
        {isLocked ? <LockIcon /> : <TryoutIcon tryoutId={tryout.id} />}
      </div>

      <div className="mt-4 flex-1">
        <div className="font-bold text-[13.5px] leading-tight text-stone-800 max-w-[13ch]">
          {tryout.title}
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-stone-500 font-medium max-w-[18ch]">
          {tryout.description}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <MiniMetric label="Soal" value={String(tryout.questionCount)} />
          <MiniMetric label="Menit" value={String(tryout.duration)} />
        </div>
        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1.5 rounded-full border-2 max-w-full"
          style={{
            color: accent,
            borderColor: `${normalizeCssColor(accent)}33`,
            background: `${normalizeCssColor(accent)}10`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} />
          <span className="truncate">{categoryName}</span>
        </span>
      </div>
    </Link>
  );
}

function PremiumPill() {
  return (
    <div className="absolute -top-2 right-3 inline-flex items-center gap-1.5 rounded-full border-2 border-white bg-amber px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-white shadow-sm">
      <CrownIcon />
      Premium
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-stone-50 py-2 text-center border-2 border-stone-100">
      <div className="text-[17px] font-bold text-stone-800 leading-none tracking-tight">{value}</div>
      <div className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-stone-400">
        {label}
      </div>
    </div>
  );
}

function EmptyState({ filter }: { filter: "all" | "free" | "premium" }) {
  return (
    <div className="mt-5 bg-white rounded-[var(--radius-lg)] p-5 shadow-sm border-2 border-stone-100 border-b-4 border-b-stone-200 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-50 text-primary border-2 border-teal-100 flex items-center justify-center">
        <ArchiveIcon />
      </div>
      <h2 className="mt-4 text-xl font-bold tracking-tight text-stone-800">Belum ada modul</h2>
      <p className="mt-2 mx-auto text-[14px] leading-relaxed text-stone-500 font-medium max-w-[28ch]">
        Tidak ada tryout untuk filter {getFilterLabel(filter).toLowerCase()} saat ini.
      </p>
    </div>
  );
}

function getFilterLabel(filter: "all" | "free" | "premium") {
  if (filter === "free") return "Gratis";
  if (filter === "premium") return "Premium";
  return "Semua";
}

function normalizeCssColor(color: string) {
  if (color.startsWith("var(")) return "#f59e0b";
  return color;
}

function TryoutIcon({ tryoutId }: { tryoutId: number }) {
  if (tryoutId === 2) return <CapsuleIcon />;
  if (tryoutId === 3) return <HeartPulseIcon />;
  if (tryoutId === 4) return <MicrobeIcon />;
  if (tryoutId === 5) return <HospitalIcon />;
  if (tryoutId === 6) return <CalculatorIcon />;
  return <FlaskIcon />;
}

function FlaskIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" aria-hidden="true">
      <path d="M9 3h6M10 3v5.8l-4.7 7.9A2.8 2.8 0 0 0 7.7 21h8.6a2.8 2.8 0 0 0 2.4-4.3L14 8.8V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.2 15h7.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CapsuleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" aria-hidden="true">
      <path d="M10.5 20.2a5 5 0 0 1-7.1-7.1l6.2-6.2a5 5 0 0 1 7.1 7.1l-6.2 6.2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m8 8 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HeartPulseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" aria-hidden="true">
      <path d="M20.4 5.6a5.2 5.2 0 0 0-7.4 0L12 6.7l-1-1.1a5.2 5.2 0 0 0-7.4 7.4l8.4 8.2 8.4-8.2a5.2 5.2 0 0 0 0-7.4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13h3l1.5-3 3 6 1.5-3h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MicrobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" aria-hidden="true">
      <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 10h.1M14 13h.1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function HospitalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" aria-hidden="true">
      <path d="M5 21V5.8C5 4.8 5.8 4 6.8 4h10.4c1 0 1.8.8 1.8 1.8V21M3 21h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v6M9 11h6M8 21v-4h8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalculatorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" aria-hidden="true">
      <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 7h8M8.5 12h.1M12 12h.1M15.5 12h.1M8.5 16h.1M12 16h.1M15.5 16h.1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" aria-hidden="true">
      <path d="M7 11V8a5 5 0 0 1 10 0v3M6.8 11h10.4c1 0 1.8.8 1.8 1.8v5.4c0 1-.8 1.8-1.8 1.8H6.8c-1 0-1.8-.8-1.8-1.8v-5.4c0-1 .8-1.8 1.8-1.8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" aria-hidden="true">
      <path d="m4 8 4 3.5L12 5l4 6.5L20 8l-1.5 10h-13L4 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" aria-hidden="true">
      <path d="M4 7h16M6 7v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7M9 11h6M5.8 4h12.4c.4 0 .8.4.8.8V7H5V4.8c0-.4.4-.8.8-.8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
