import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav, TopBar } from "../../components/Navigation";
import { PremiumDialog } from "../../components/PremiumDialog";
import { TryoutIcon } from "../../components/TryoutIcon";
import { useApp } from "../../data";
import { isPaidTryout, resolveTryoutAccess } from "../premium-access/premium-access";
import { productAnalyticsEvents, type AcquisitionIntent } from "../../lib/product-analytics";
import { useProductAnalytics } from "../../lib/product-analytics-client";
import type { listProgressSummary } from "../student/student-progress-functions";
import type { listPublishedTryouts } from "./student-tryout-catalog-functions";
import { splitTryoutTitle } from "./tryout-card-title";

type TryoutRow = Awaited<ReturnType<typeof listPublishedTryouts>>[number];
type ProgressSummary = Awaited<ReturnType<typeof listProgressSummary>>;
type TryoutFilter = "all" | "free" | "premium" | "owned";

export function TryoutCatalogPage({
  intent,
  summary,
  tryouts,
}: {
  intent?: AcquisitionIntent;
  summary: ProgressSummary;
  tryouts: TryoutRow[];
}) {
  const { hasPremiumMembership: devHasPremiumMembership } = useApp();
  const hasPremiumMembership = devHasPremiumMembership || tryouts.some((tryout) => tryout.hasPremiumMembership);
  const analytics = useProductAnalytics();
  const location = useLocation();
  const [showPremium, setShowPremium] = useState(false);
  const [selectedTryout, setSelectedTryout] = useState<TryoutRow | null>(null);
  const [filter, setFilter] = useState<TryoutFilter>("all");
  const [categoryName, setCategoryName] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (location.pathname !== "/tryout") {
      return;
    }

    analytics.capture(productAnalyticsEvents.tryoutCatalogViewed, {
      intent,
      source_path: "/tryout",
      tryout_count: tryouts.length,
    });
  }, [analytics, intent, location.pathname, tryouts.length]);

  if (location.pathname !== "/tryout") {
    return <Outlet />;
  }

  const categoryNames = [...new Set(tryouts.map((tryout) => tryout.categoryName))].sort((a, b) => a.localeCompare(b, "id"));
  const searchText = query.trim().toLowerCase();
  const hasNarrowing = filter !== "all" || Boolean(categoryName) || Boolean(searchText);

  const filtered = tryouts.filter((t) => {
    if (categoryName && t.categoryName !== categoryName) return false;
    if (searchText && !matchesSearch(t, searchText)) return false;
    if (filter === "all") return true;
    if (filter === "owned") return t.hasLifetimeTryoutPurchase;
    if (filter === "premium") return isPaidTryout(t.accessLevel);
    return t.accessLevel === filter;
  });

  return (
    <>
      <div
        style={{
          background:
            "radial-gradient(1000px 300px at 50% 0%, rgba(32,80,114,0.10), transparent 70%), var(--color-bg)",
        }}
      >
      <div className="app-shell page-enter" style={{ background: "transparent" }}>
        <div className="relative overflow-hidden pb-8">
          <TopBar progress={{ xp: summary.xp, streak: summary.streak }} />
          <div className="page-lane pt-7 pb-5 lg:pt-10">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Modul Tryout
            </div>
            <h1 className="mt-2 max-w-[18ch] text-[28px] font-bold leading-tight tracking-tight text-stone-800 sm:text-[34px] lg:text-[44px]">
              Try-out UKAI
            </h1>
            <p className="m-0 mt-3 max-w-[56ch] text-[14px] font-medium leading-relaxed text-stone-500 sm:text-[15px]">
              Pilih simulasi yang sesuai ritme belajarmu, lalu lanjutkan ke persiapan sebelum timer berjalan.
            </p>
          </div>

          <div className="page-lane flex gap-2 overflow-x-auto pb-1">
            {(["all", "free", "premium", "owned"] as const).map((option) => (
              <FilterButton
                key={option}
                filter={option}
                isActive={filter === option}
                onClick={() => setFilter(option)}
              />
            ))}
          </div>

          <div className="page-lane mt-3 flex flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Cari try-out</span>
              <SearchIcon />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari try-out atau topik"
                className="w-full rounded-full border-2 border-stone-200 bg-white py-2.5 pl-10 pr-4 text-[14px] font-medium text-stone-700 outline-none transition-colors placeholder:text-stone-400 focus:border-primary"
              />
            </label>
            {categoryNames.length > 1 && (
              <label className="sm:w-56">
                <span className="sr-only">Kategori</span>
                <select
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  className="w-full rounded-full border-2 border-stone-200 bg-white px-4 py-2.5 text-[14px] font-semibold text-stone-600 outline-none transition-colors focus:border-primary"
                >
                  <option value="">Semua kategori</option>
                  {categoryNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>

        <div className="page-lane relative -mt-4 pb-24">
          <div className="grid grid-flow-dense grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tryout) => (
              <TryoutCard
                key={tryout.id}
                tryout={tryout}
                showCategory={categoryNames.length > 1}
                isLocked={isTryoutLocked(tryout, hasPremiumMembership, tryout.hasLifetimeTryoutPurchase)}
                isOwned={tryout.hasLifetimeTryoutPurchase}
                onLockedClick={() => {
                  setSelectedTryout(tryout);
                  setShowPremium(true);
                }}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <EmptyState
              filter={filter}
              hasNarrowing={hasNarrowing}
              onReset={() => {
                setFilter("all");
                setCategoryName("");
                setQuery("");
              }}
            />
          )}
        </div>
        <BottomNav active="tryout" />
      </div>
      </div>
      <PremiumDialog
        isOpen={showPremium}
        onClose={() => setShowPremium(false)}
        onUpgrade={() => {
          setShowPremium(false);
        }}
        hasPremiumMembership={hasPremiumMembership}
        tryout={selectedTryout}
      />
    </>
  );
}

function isTryoutLocked(tryout: TryoutRow, hasPremiumMembership: boolean, isOwned: boolean) {
  return resolveTryoutAccess({
    accessLevel: tryout.accessLevel,
    hasPremiumMembership,
    hasLifetimeTryoutPurchase: isOwned,
  }).locked;
}

function FilterButton({
  filter,
  isActive,
  onClick,
}: {
  filter: TryoutFilter;
  isActive: boolean;
  onClick: () => void;
}) {
  const label = getFilterLabel(filter);

  return (
    <button
      className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border-2 transition-all duration-150 active:translate-y-[1px]"
      style={{
        color: isActive ? "var(--color-primary-dark)" : "var(--color-stone-500)",
        borderColor: isActive ? "rgba(32,80,114,0.20)" : "var(--color-stone-200)",
        background: isActive ? "rgba(32,80,114,0.06)" : "#ffffff",
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
  showCategory,
  isLocked,
  isOwned,
  onLockedClick,
}: {
  tryout: TryoutRow;
  showCategory: boolean;
  isLocked: boolean;
  isOwned: boolean;
  onLockedClick: () => void;
}) {
  const accent = isLocked ? "var(--color-amber)" : tryout.categoryColor;
  const { subject, name } = splitTryoutTitle(tryout.title);

  return (
    <Link
      to={isLocked ? "/premium" : "/tryout/$id"}
      params={isLocked ? undefined : { id: String(tryout.id) }}
      className="flex flex-col gap-2.5 rounded-[var(--radius-lg)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white p-3.5 no-underline shadow-sm transition-[translate,scale,box-shadow,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-md"
      onClick={(event) => {
        if (!isLocked) return;

        event.preventDefault();
        onLockedClick();
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2"
          style={{
            color: accent,
            background: `${normalizeCssColor(accent)}18`,
            borderColor: `${normalizeCssColor(accent)}22`,
          }}
        >
          {isLocked ? <LockIcon /> : <TryoutIcon icon={tryout.icon} tryoutId={tryout.id} className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          {subject && (
            <div className="truncate text-[11px] font-semibold uppercase leading-tight tracking-wide text-stone-400">
              {subject}
            </div>
          )}
          <div className="text-[15px] font-bold leading-snug text-stone-800">{name}</div>
        </div>
      </div>

      {tryout.description && (
        <p className="m-0 line-clamp-2 text-[13px] font-medium leading-snug text-stone-500">{tryout.description}</p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-0.5">
        <div className="flex min-w-0 items-center gap-1.5 text-[12px] font-semibold text-stone-400">
          <span className="shrink-0">{tryout.questionCount} soal · {tryout.durationMinutes} menit</span>
          {showCategory && <CategoryTag name={tryout.categoryName} color={accent} />}
        </div>
        {isPaidTryout(tryout.accessLevel) && <AccessPill isOwned={isOwned} />}
      </div>
    </Link>
  );
}

function CategoryTag({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1 text-[11px] font-semibold" style={{ color }}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
      <span className="truncate">{name}</span>
    </span>
  );
}

function AccessPill({ isOwned }: { isOwned: boolean }) {
  const label = isOwned ? "Dimiliki" : "Premium";

  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
      <CrownIcon />
      {label}
    </span>
  );
}

function matchesSearch(tryout: TryoutRow, searchText: string) {
  return [tryout.title, tryout.description, tryout.categoryName]
    .some((value) => value?.toLowerCase().includes(searchText));
}

function EmptyState({
  filter,
  hasNarrowing,
  onReset,
}: {
  filter: TryoutFilter;
  hasNarrowing: boolean;
  onReset: () => void;
}) {
  return (
    <div className="mt-5 bg-white rounded-[var(--radius-lg)] p-5 shadow-sm border-2 border-stone-100 border-b-4 border-b-stone-200 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-primary-tint text-primary border-2 border-primary-soft flex items-center justify-center">
        <ArchiveIcon />
      </div>
      <h2 className="mt-4 text-xl font-bold tracking-tight text-stone-800">Belum ada modul</h2>
      <p className="mt-2 mx-auto text-[14px] leading-relaxed text-stone-500 font-medium max-w-[28ch]">
        {hasNarrowing && filter === "all"
          ? "Tidak ada tryout yang cocok dengan pencarian atau kategori ini."
          : `Tidak ada tryout untuk filter ${getFilterLabel(filter).toLowerCase()} saat ini.`}
      </p>
      {hasNarrowing && (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 text-[13px] font-bold text-primary underline-offset-2 hover:underline"
        >
          Tampilkan semua tryout
        </button>
      )}
    </div>
  );
}

function getFilterLabel(filter: TryoutFilter) {
  if (filter === "free") return "Gratis";
  if (filter === "premium") return "Premium";
  if (filter === "owned") return "Dimiliki";
  return "Semua";
}

function normalizeCssColor(color: string) {
  if (color.startsWith("var(")) return "#f59e0b";
  return color;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" fill="none" aria-hidden="true">
      <path d="m20 20-4.2-4.2M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
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
