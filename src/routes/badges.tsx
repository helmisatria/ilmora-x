import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { BottomNav, TopBar } from "../components/Navigation";
import { badges, useApp } from "../data";
import type { Badge } from "../data/badges";

export const Route = createFileRoute("/badges")({
  component: BadgesComponent,
});

type BadgeCategory = Badge["category"];

const categories: Array<{
  key: BadgeCategory;
  label: string;
  accent: string;
  icon: ReactNode;
}> = [
  { key: "General", label: "General", accent: "#14b8a6", icon: "🎯" },
  { key: "Level", label: "Level", accent: "#0ea5e9", icon: "📈" },
  { key: "Streak", label: "Streak", accent: "#f59e0b", icon: "🔥" },
  { key: "Prestige", label: "Prestige", accent: "#fb7185", icon: "⭐" },
];

function BadgesComponent() {
  const { badgeProgress } = useApp();
  const [activeCategory, setActiveCategory] = useState<BadgeCategory>("General");

  const filteredBadges = badges.filter((badge) => badge.category === activeCategory);
  const progressMap = new Map(badgeProgress.map((progress) => [progress.badgeId, progress]));
  const unlockedCount = badgeProgress.filter((progress) => progress.unlocked).length;
  const activeMeta = categories.find((category) => category.key === activeCategory) ?? categories[0];
  const activeUnlocked = filteredBadges.filter((badge) => progressMap.get(badge.id)?.unlocked).length;

  return (
    <div
      className="app-shell"
      style={{
        background:
          "linear-gradient(180deg, #fff1f3 0%, #fbfaf7 40%, #eef8f6 100%)",
      }}
    >
      <div
        className="relative overflow-hidden pb-8"
        style={{
          background:
            "radial-gradient(920px 320px at 10% -18%, #fb71852e, transparent 62%), radial-gradient(760px 340px at 92% -16%, #14b8a622, transparent 68%), linear-gradient(180deg, #fff1f3 0%, #fbfaf7 100%)",
        }}
      >
        <TopBar />
        <div className="px-5 pt-7">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Koleksi Lencana
          </div>
          <h1 className="mt-2 text-[28px] leading-tight font-bold tracking-tight text-stone-800 max-w-[22ch]">
            Pantau bukti progres belajarmu
          </h1>
          <p className="m-0 mt-3 text-[14px] leading-relaxed text-stone-500 font-medium max-w-[34ch]">
            Lencana terbuka dari tryout, streak, level, dan pencapaian khusus.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 grid-flow-dense">
            <SummaryCard label="Terbuka" value={`${unlockedCount}/${badges.length}`} accent="#14b8a6" />
            <SummaryCard label={activeMeta.label} value={`${activeUnlocked}/${filteredBadges.length}`} accent={activeMeta.accent} />
          </div>
        </div>
      </div>

      <div className="relative -mt-4 px-5 pb-28">
        <div className="rounded-[var(--radius-xl)] bg-white p-3 shadow-sm border-2 border-stone-100 border-b-4 border-b-stone-200">
          <div className="grid grid-cols-4 gap-2">
            {categories.map((category) => (
              <button
                key={category.key}
                className="group min-w-0 rounded-[var(--radius-md)] border-2 border-b-4 px-2.5 py-3 transition-all duration-150 active:translate-y-[1px]"
                style={{
                  background: activeCategory === category.key ? `${category.accent}12` : "#ffffff",
                  borderColor: activeCategory === category.key ? `${category.accent}40` : "#e7e5e4",
                  borderBottomColor: activeCategory === category.key ? category.accent : "#d6d3d1",
                  color: activeCategory === category.key ? category.accent : "#78716c",
                }}
                onClick={() => setActiveCategory(category.key)}
                type="button"
              >
                <span
                  className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border-2 bg-white text-[19px] transition-transform duration-700 ease-out group-hover:scale-105"
                  style={{
                    borderColor: `${category.accent}30`,
                    background: activeCategory === category.key ? "#ffffff" : `${category.accent}10`,
                  }}
                >
                  {category.icon}
                </span>
                <span className="mt-2 block truncate text-[10px] font-black uppercase tracking-wide">
                  {category.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <SectionHeader title={activeMeta.label} />
          <div className="grid grid-cols-3 gap-3.5">
            {filteredBadges.map((badge) => {
              const progress = progressMap.get(badge.id);
              return (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  progress={progress?.progress ?? 0}
                  total={progress?.total ?? 1}
                  unlocked={progress?.unlocked ?? false}
                  accent={activeMeta.accent}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-6 rounded-[var(--radius-lg)] bg-white p-5 shadow-sm border-2 border-stone-100 border-b-4 border-b-stone-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-[21px] border-2 border-rose-100 flex items-center justify-center shrink-0">
              ✨
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-800">Ritme progres</h3>
              <p className="mt-1 text-[13.5px] leading-relaxed text-stone-500 font-medium max-w-[30ch]">
                Fokus pada satu kategori dulu agar target lencana berikutnya terasa jelas.
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active="badge" />
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      className="rounded-[var(--radius-lg)] bg-white p-4 shadow-sm border-2 border-stone-100 border-b-4 border-b-stone-200"
      style={{
        background: `linear-gradient(180deg, ${accent}12 0%, rgba(255,255,255,0.94) 76%)`,
      }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
        {label}
      </div>
      <div className="mt-2 text-[22px] font-bold tracking-tight text-stone-800 leading-none">
        {value}
      </div>
    </div>
  );
}

function BadgeCard({
  badge,
  progress,
  total,
  unlocked,
  accent,
}: {
  badge: Badge;
  progress: number;
  total: number;
  unlocked: boolean;
  accent: string;
}) {
  const pct = total > 0 ? Math.min(progress / total, 1) : 0;
  const circumference = 2 * Math.PI * 37;
  const offset = circumference - circumference * pct;

  return (
    <div className={`group flex min-h-[164px] flex-col items-center rounded-[var(--radius-lg)] bg-white p-3 text-center shadow-sm border-2 border-stone-100 border-b-4 border-b-stone-200 transition-all duration-150 hover:-translate-y-1 ${unlocked ? "" : "opacity-70"}`}>
      <div className="relative h-[82px] w-[82px]">
        <svg viewBox="0 0 88 88" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="44" cy="44" r="37" fill="none" stroke="#e7e5e4" strokeWidth="6" />
          <circle
            cx="44"
            cy="44"
            r="37"
            fill="none"
            stroke={unlocked ? accent : "#a8a29e"}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            strokeWidth="6"
            className="transition-all duration-500"
          />
        </svg>
        <div
          className="absolute left-3 top-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-b-4 bg-white transition-transform duration-700 ease-out group-hover:scale-105"
          style={{
            borderColor: unlocked ? `${accent}38` : "#d6d3d1",
            borderBottomColor: unlocked ? accent : "#a8a29e",
            color: unlocked ? accent : "#78716c",
            background: unlocked ? `${accent}10` : "#f5f5f4",
          }}
        >
          <span className={`text-[30px] leading-none ${unlocked ? "" : "grayscale"}`}>
            {badge.icon}
          </span>
        </div>
      </div>
      <b className="mt-2 text-[12.5px] font-extrabold leading-tight text-stone-800 max-w-[11ch]">
        {badge.name}
      </b>
      <span className="mt-auto pt-2 text-[11px] font-extrabold text-stone-400">
        {unlocked ? "Terbuka" : `${progress}/${total}`}
      </span>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-[13px] font-semibold uppercase tracking-wide text-stone-500">
        {title}
      </span>
      <div className="h-px flex-1 bg-stone-200" />
    </div>
  );
}
