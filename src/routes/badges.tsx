import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type CSSProperties, type ReactNode } from "react";
import { BottomNav, TopBar } from "../components/Navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../components/ui/dialog";
import { badges, getLevelForXp } from "../data";
import type { Badge } from "../data/badges";
import { listProgressSummary } from "../lib/student-functions";

type ProgressSummary = Awaited<ReturnType<typeof listProgressSummary>>;
type BadgeProgressView = {
  badgeId: number;
  progress: number;
  total: number;
  unlocked: boolean;
};

export const Route = createFileRoute("/badges")({
  loader: async () => {
    const summary = await listProgressSummary();

    return { summary };
  },
  head: () => ({
    meta: [
      { title: "Koleksi Lencana — IlmoraX" },
      { name: "description", content: "Pantau dan kumpulkan lencana dari tryout, streak, level, dan pencapaian khusus. Lencana General, Level, Streak, dan Prestige menunggu untuk dibuka." },
      { property: "og:title", content: "Koleksi Lencana — IlmoraX" },
      { property: "og:description", content: "Pantau dan kumpulkan lencana dari tryout, streak, level, dan pencapaian khusus." },
    ],
  }),
  component: BadgesComponent,
});

type BadgeCategory = Badge["category"];

const categories: Array<{
  key: BadgeCategory;
  label: string;
  accent: string;
  icon: ReactNode;
}> = [
  { key: "General", label: "General", accent: "#205072", icon: <TargetIcon /> },
  { key: "Level", label: "Level", accent: "#0ea5e9", icon: <LevelIcon /> },
  { key: "Streak", label: "Streak", accent: "#f59e0b", icon: <FlameIcon /> },
  { key: "Prestige", label: "Prestige", accent: "#fb7185", icon: <StarIcon /> },
];

function BadgesComponent() {
  const { summary } = Route.useLoaderData() as { summary: ProgressSummary };
  const [activeCategory, setActiveCategory] = useState<BadgeCategory>("General");
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const badgeProgress = getBadgeProgress(summary);
  const filteredBadges = badges.filter((badge) => badge.category === activeCategory);
  const progressMap = new Map(badgeProgress.map((progress) => [progress.badgeId, progress]));
  const unlockedCount = badgeProgress.filter((progress) => progress.unlocked).length;
  const activeMeta = categories.find((category) => category.key === activeCategory) ?? categories[0];
  const activeUnlocked = filteredBadges.filter((badge) => progressMap.get(badge.id)?.unlocked).length;
  const selectedProgress = selectedBadge ? progressMap.get(selectedBadge.id) : null;

  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, #fff1f3 0%, #fbfaf7 40%, #eef8f6 100%)",
      }}
    >
    <div className="app-shell page-enter" style={{ background: "transparent" }}>
      <div
        className="relative overflow-hidden pb-8"
        style={{
          background:
            "radial-gradient(920px 320px at 10% -18%, #fb71852e, transparent 62%), radial-gradient(760px 340px at 92% -16%, rgba(32,80,114,0.13), transparent 68%), linear-gradient(180deg, #fff1f3 0%, #fbfaf7 100%)",
        }}
      >
        <TopBar progress={{ xp: summary.xp, streak: summary.streak }} />
        <div className="page-lane pt-7 lg:pt-10">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Koleksi Lencana
          </div>
          <h1 className="mt-2 max-w-[18ch] text-[28px] font-bold leading-tight tracking-tight text-stone-800 sm:text-[34px] lg:text-[44px]">
            Pantau bukti progres belajarmu
          </h1>
          <p className="m-0 mt-3 max-w-[56ch] text-[14px] font-medium leading-relaxed text-stone-500 sm:text-[15px]">
            Lencana terbuka dari tryout, streak, level, dan pencapaian khusus.
          </p>

          <div className="mt-5 grid max-w-[560px] grid-flow-dense grid-cols-2 gap-3">
            <SummaryCard label="Terbuka" value={`${unlockedCount}/${badges.length}`} accent="#205072" />
            <SummaryCard label={activeMeta.label} value={`${activeUnlocked}/${filteredBadges.length}`} accent={activeMeta.accent} />
          </div>
        </div>
      </div>

      <div className="page-lane relative -mt-4 pb-28">
        <div className="rounded-[var(--radius-xl)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                  className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border-2 bg-white transition-transform duration-700 ease-out group-hover:scale-105"
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
          <div className="grid grid-flow-dense grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
                  onSelect={() => setSelectedBadge(badge)}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-6 rounded-[var(--radius-lg)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-rose-100 bg-rose-50 text-coral">
              <SparkIcon />
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

      <BadgeDetailModal
        badge={selectedBadge}
        progress={selectedProgress?.progress ?? 0}
        total={selectedProgress?.total ?? 1}
        unlocked={selectedProgress?.unlocked ?? false}
        accent={activeMeta.accent}
        onClose={() => setSelectedBadge(null)}
      />
    </div>
    </div>
  );
}

function getBadgeProgress(summary: ProgressSummary): BadgeProgressView[] {
  const level = getLevelForXp(summary.xp).level;
  const accuracy = summary.totalQuestions > 0
    ? Math.round((summary.totalCorrect / summary.totalQuestions) * 100)
    : 0;

  return badges.map((badge) => {
    const target = getBadgeTarget(badge);
    const progress = getBadgeProgressValue(badge, { accuracy, level, summary });
    const isAwarded = summary.awardedBadgeIds.includes(badge.id);

    return {
      badgeId: badge.id,
      progress: isAwarded ? target : Math.min(progress, target),
      total: target,
      unlocked: isAwarded || progress >= target,
    };
  });
}

function getBadgeTarget(badge: Badge) {
  const levelMatch = badge.task.match(/Reach Level (\d+)/i);
  const streakMatch = badge.task.match(/(\d+)[-\s]Days/i);
  const tryoutMatch = badge.task.match(/Complete (\d+) unique tryouts/i);
  const failMatch = badge.task.match(/Reach (\d+)x fail/i);

  if (levelMatch) return Number(levelMatch[1]);
  if (streakMatch) return Number(streakMatch[1]);
  if (tryoutMatch) return Number(tryoutMatch[1]);
  if (failMatch) return Number(failMatch[1]);
  if (badge.id === 1) return 1;
  if (badge.name === "100% Club") return 100;

  return 1;
}

function getBadgeProgressValue(
  badge: Badge,
  data: { accuracy: number; level: number; summary: ProgressSummary },
) {
  if (badge.task.toLowerCase().includes("leaderboard")) return 0;
  if (badge.category === "Level") return data.level;
  if (badge.category === "Streak") {
    if (badge.task.includes("unique tryouts")) return data.summary.attempts.length;
    return data.summary.streak;
  }
  if (badge.id === 1) return data.summary.attempts.length > 0 ? 1 : 0;
  if (badge.name === "100% Club") return data.accuracy;

  return 0;
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
  onSelect,
}: {
  badge: Badge;
  progress: number;
  total: number;
  unlocked: boolean;
  accent: string;
  onSelect: () => void;
}) {
  const pct = total > 0 ? Math.min(progress / total, 1) : 0;
  const progressPercent = Math.round(pct * 100);
  const progressLabel = getBadgeProgressText(badge, progress, total, unlocked);
  const circumference = 2 * Math.PI * 37;
  const offset = circumference - circumference * pct;

  return (
    <button
      aria-label={`Lihat detail lencana ${badge.name}`}
      className={`group flex min-h-[190px] w-full flex-col items-center rounded-[var(--radius-lg)] bg-white p-3 text-center shadow-sm border-2 border-stone-100 border-b-4 border-b-stone-200 transition-all duration-150 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${unlocked ? "" : "opacity-75"}`}
      onClick={onSelect}
      style={{ "--tw-ring-color": accent } as CSSProperties}
      type="button"
    >
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
      <div className="mt-auto w-full pt-3">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-wide text-stone-400">
            Progres
          </span>
          <span className="text-[11px] font-black leading-none" style={{ color: unlocked ? accent : "#78716c" }}>
            {progressLabel}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              background: unlocked ? accent : "#a8a29e",
              width: `${progressPercent}%`,
            }}
          />
        </div>
      </div>
    </button>
  );
}

function BadgeDetailModal({
  badge,
  progress,
  total,
  unlocked,
  accent,
  onClose,
}: {
  badge: Badge | null;
  progress: number;
  total: number;
  unlocked: boolean;
  accent: string;
  onClose: () => void;
}) {
  if (!badge) return null;

  const action = getBadgeAction(badge);
  const pct = total > 0 ? Math.min(progress / total, 1) : 0;
  const progressPercent = Math.round(pct * 100);
  const requirement = getBadgeRequirementText(badge);
  const progressText = getBadgeProgressText(badge, progress, total, unlocked);
  const rewardText = badge.xpReward > 0 ? `+${badge.xpReward.toLocaleString("id-ID")} EXP` : "Tanpa bonus EXP";

  return (
    <Dialog open={Boolean(badge)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[min(92vw,480px)] p-0 text-left">
        <div
          className="relative overflow-hidden px-5 pb-5 pt-6 text-white"
          style={{
            background: `radial-gradient(320px 180px at 86% -8%, ${accent}70, transparent 68%), linear-gradient(135deg, #292524 0%, #44403c 100%)`,
          }}
        >
          <DialogClose
            aria-label="Tutup detail lencana"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
            type="button"
          >
            <CloseIcon />
          </DialogClose>

          <div className="flex items-start gap-4 pr-10">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border-2 border-white/20 bg-white/12 text-[38px] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
              <span className={unlocked ? "" : "grayscale"}>{badge.icon}</span>
            </div>
            <div className="min-w-0">
              <div className="mb-2 inline-flex rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white/75">
                {unlocked ? "Terbuka" : "Terkunci"}
              </div>
              <DialogTitle className="text-[25px] font-black leading-none tracking-tight text-white">
                {badge.name}
              </DialogTitle>
              <DialogDescription className="mt-2 text-[13px] font-semibold leading-relaxed text-white/72">
                {unlocked
                  ? "Lencana ini sudah masuk koleksimu."
                  : "Lencana ini bisa kamu kejar dari aktivitas belajar yang relevan."}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-[#fffcf7] p-5">
          <div className="rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-stone-200 bg-white p-4">
            <div className="text-[10px] font-black uppercase tracking-wide text-stone-400">
              Cara mendapat
            </div>
            <p className="m-0 mt-1 text-[15px] font-extrabold leading-snug text-stone-800">
              {requirement}
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-stone-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wide text-stone-400">
                  Progres
                </div>
                <div className="mt-1 text-[18px] font-black leading-none text-stone-800">
                  {progressText}
                </div>
              </div>
              <div className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-black" style={{ background: `${accent}16`, color: accent }}>
                {progressPercent}%
              </div>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ background: accent, width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-stone-200 bg-white p-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wide text-stone-400">
                Reward
              </div>
              <div className="mt-1 text-[18px] font-black leading-none text-stone-800">
                {rewardText}
              </div>
            </div>
            <GiftIcon />
          </div>

          <div className="grid gap-2 sm:grid-cols-[0.8fr_1.2fr]">
            <DialogClose className="btn btn-white min-h-12 w-full" type="button">
              Tutup
            </DialogClose>
            {action && (
              <DialogClose asChild>
                <Link to={action.to} className="btn min-h-12 w-full no-underline">
                  {action.icon}
                  {action.label}
                </Link>
              </DialogClose>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getBadgeRequirementText(badge: Badge) {
  const levelMatch = badge.task.match(/Reach Level (\d+)/i);
  const streakMatch = badge.task.match(/Complete tryout every day for (\d+) days/i);
  const tryoutMatch = badge.task.match(/Complete (\d+) unique tryouts/i);
  const leaderboardMatch = badge.task.match(/Reach top (\d+) leaderboard/i);

  if (badge.id === 1) return "Selesaikan Try-out pertamamu.";
  if (levelMatch) return `Capai Level ${levelMatch[1]}.`;
  if (streakMatch) return `Selesaikan Try-out setiap hari selama ${streakMatch[1]} hari berturut-turut.`;
  if (tryoutMatch) return `Selesaikan ${tryoutMatch[1]} Try-out unik. Retake Try-out yang sama tidak menambah hitungan.`;
  if (leaderboardMatch) return `Masuk Top ${leaderboardMatch[1]} Leaderboard mingguan setelah minggu selesai difinalisasi.`;
  if (badge.name === "100% Club") return "Raih skor 100% pada progres jawabanmu.";
  if (badge.name === "Speed Runner") return "Selesaikan Try-out sebelum waktu habis dengan skor di atas 80%.";
  if (badge.name === "Fail Legend") return "Capai 5 kali hasil tidak lulus.";

  return badge.task;
}

function getBadgeProgressText(
  badge: Badge,
  progress: number,
  total: number,
  unlocked: boolean,
) {
  if (unlocked) return "Selesai";
  if (badge.name === "100% Club") return `${progress}%/${total}%`;

  return `${progress}/${total}`;
}

function getBadgeAction(badge: Badge): null | {
  label: string;
  to: "/tryout" | "/leaderboard";
  icon: ReactNode;
} {
  const task = badge.task.toLowerCase();

  if (task.includes("leaderboard")) {
    return { label: "Lihat Leaderboard", to: "/leaderboard", icon: <LevelIcon /> };
  }

  if (badge.name === "Fail Legend") return null;
  if (badge.category === "Level") return { label: "Tambah EXP", to: "/tryout", icon: <TargetIcon /> };
  if (badge.category === "Streak") return { label: "Kerjakan Hari Ini", to: "/tryout", icon: <FlameIcon /> };

  return { label: "Mulai Try-out", to: "/tryout", icon: <TargetIcon /> };
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-rose-400" fill="none" aria-hidden="true">
      <path d="M4 11h16v9H4v-9ZM3 7h18v4H3V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 7v13M8.5 7C7.1 7 6 5.9 6 4.8S6.9 3 8 3c1.8 0 3.1 2.1 4 4M15.5 7C16.9 7 18 5.9 18 4.8S17.1 3 16 3c-1.8 0-3.1 2.1-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function LevelIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m15 7 1-1 1 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 22c4.1 0 7-2.8 7-6.8 0-3.5-2-5.8-4.4-7.7-.7 2-1.8 3.1-3.3 3.8.3-2.9-1.1-5.2-3.7-7.3C7.4 7.4 5 10.2 5 15.2 5 19.2 7.9 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.1 6-5.3-3-5.3 3 1.1-6-4.5-4.2 6.1-.8L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 8.5 13 11l2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
