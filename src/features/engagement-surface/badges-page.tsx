import { Link } from "@tanstack/react-router";
import { useState, type CSSProperties, type ReactNode } from "react";
import { BottomNav, TopBar } from "../../components/Navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  badgeGroups,
  getBadgeGroupKey,
  getNextBadges,
  hasMeasurableProgress,
  type BadgeGroupKey,
  type BadgeProgressView,
} from "./badge-groups";
import type { EffectiveBadge as Badge } from "./badge-settings";
import { getBadgeProgress, getBadgeTarget } from "./badge-progress";
import type { listProgressSummary } from "../student/student-progress-functions";

type ProgressSummary = Awaited<ReturnType<typeof listProgressSummary>>;

const groupStyles: Record<BadgeGroupKey, { accent: string; icon: ReactNode }> = {
  start: { accent: "#205072", icon: <TargetIcon /> },
  level: { accent: "#0ea5e9", icon: <LevelIcon /> },
  streak: { accent: "#f59e0b", icon: <FlameIcon /> },
  tryouts: { accent: "#14b8a6", icon: <BookIcon /> },
  leaderboard: { accent: "#8b5cf6", icon: <TrophyIcon /> },
  special: { accent: "#fb7185", icon: <StarIcon /> },
};

function getBadgeAccent(badge: Badge) {
  return groupStyles[getBadgeGroupKey(badge)].accent;
}

export function BadgesPage({ summary, badgeCatalog }: { summary: ProgressSummary; badgeCatalog: Badge[] }) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // A turned-off Badge only shows for Students who already earned it.
  const badges = badgeCatalog.filter((badge) => badge.active || summary.awardedBadgeIds.includes(badge.id));
  const badgeProgress = getBadgeProgress(badges, summary);
  const progressMap = new Map(badgeProgress.map((progress) => [progress.badgeId, progress]));
  const unlockedCount = badgeProgress.filter((progress) => progress.unlocked).length;
  const nextBadges = getNextBadges(badges, badgeProgress);
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
            Kumpulkan lencana dari usaha belajarmu
          </h1>
          <p className="m-0 mt-3 max-w-[56ch] text-[14px] font-medium leading-relaxed text-stone-500 sm:text-[15px]">
            Setiap langkah belajarmu bisa jadi lencana. Kerjakan Try-out, naik level, dan belajar
            rutin untuk mengumpulkannya.
          </p>

          <p className="m-0 mt-5 inline-flex items-baseline gap-2 rounded-[var(--radius-lg)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white px-4 py-3 shadow-sm">
            <span className="text-[22px] font-bold leading-none tracking-tight text-stone-800">
              {unlockedCount}
            </span>
            <span className="text-[14px] font-semibold text-stone-500">
              dari {badges.length} lencana didapat
            </span>
          </p>
        </div>
      </div>

      <div className="page-lane relative -mt-4 pb-28">
        <NextBadgesSection
          nextBadges={nextBadges}
          allUnlocked={unlockedCount === badges.length}
        />

        <section aria-labelledby="all-badges-heading" className="mt-8">
          <h2 id="all-badges-heading" className="text-[20px] font-bold tracking-tight text-stone-800">
            Semua lencana
          </h2>

          {badgeGroups.map((group) => {
            const groupBadges = badges.filter((badge) => getBadgeGroupKey(badge) === group.key);
            const style = groupStyles[group.key];

            return (
              <section key={group.key} aria-labelledby={`badge-group-${group.key}`} className="mt-6">
                <div className="mb-3 flex items-start gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2"
                    style={{ borderColor: `${style.accent}30`, background: `${style.accent}10`, color: style.accent }}
                  >
                    {style.icon}
                  </span>
                  <div className="min-w-0">
                    <h3 id={`badge-group-${group.key}`} className="text-[15px] font-extrabold text-stone-800">
                      {group.title}
                    </h3>
                    <p className="m-0 mt-0.5 text-[13px] font-medium leading-snug text-stone-500">
                      {group.description}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {groupBadges.map((badge) => {
                    const progress = progressMap.get(badge.id);
                    return (
                      <BadgeCard
                        key={badge.id}
                        badge={badge}
                        progress={progress?.progress ?? 0}
                        total={progress?.total ?? 1}
                        unlocked={progress?.unlocked ?? false}
                        pending={progress?.pending ?? false}
                        accent={style.accent}
                        onSelect={() => setSelectedBadge(badge)}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </section>
      </div>

      <BottomNav active="badge" />

      <BadgeDetailModal
        badge={selectedBadge}
        progress={selectedProgress?.progress ?? 0}
        total={selectedProgress?.total ?? 1}
        unlocked={selectedProgress?.unlocked ?? false}
        pending={selectedProgress?.pending ?? false}
        accent={selectedBadge ? getBadgeAccent(selectedBadge) : groupStyles.start.accent}
        onClose={() => setSelectedBadge(null)}
      />
    </div>
    </div>
  );
}

function NextBadgesSection({
  nextBadges,
  allUnlocked,
}: {
  nextBadges: ReturnType<typeof getNextBadges<Badge>>;
  allUnlocked: boolean;
}) {
  return (
    <section
      aria-labelledby="next-badges-heading"
      className="rounded-[var(--radius-xl)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <h2 id="next-badges-heading" className="text-[18px] font-bold tracking-tight text-stone-800">
        Lencana berikutnya
      </h2>

      {allUnlocked ? (
        <p className="m-0 mt-1 text-[13.5px] font-medium leading-relaxed text-stone-500">
          Kamu sudah mendapatkan semua lencana. Luar biasa!
        </p>
      ) : nextBadges.length === 0 ? (
        <p className="m-0 mt-1 text-[13.5px] font-medium leading-relaxed text-stone-500">
          Lencana yang tersisa diberikan otomatis dari Leaderboard mingguan dan hasil Try-out.
          Terus semangat kerjakan Try-out, ya!
        </p>
      ) : (
        <>
          <p className="m-0 mt-1 text-[13.5px] font-medium leading-relaxed text-stone-500">
            Lencana yang paling dekat untuk kamu dapatkan.
          </p>
          <ul className="m-0 mt-4 grid list-none gap-3 p-0 md:grid-cols-3">
            {nextBadges.map(({ badge, progress }) => (
              <NextBadgeItem key={badge.id} badge={badge} progress={progress} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function NextBadgeItem({ badge, progress }: { badge: Badge; progress: BadgeProgressView }) {
  const accent = getBadgeAccent(badge);
  const action = getBadgeAction(badge);

  return (
    <li className="flex flex-col rounded-[var(--radius-lg)] border-2 border-b-4 border-stone-100 border-b-stone-200 p-3.5">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-[22px]"
          style={{ borderColor: `${accent}38`, background: `${accent}10` }}
          aria-hidden="true"
        >
          {badge.icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-[14px] font-extrabold leading-tight text-stone-800">{badge.displayName}</h3>
          <div className="mt-0.5 text-[12px] font-black" style={{ color: accent }}>
            {getBadgeStatusText(badge, progress)}
          </div>
        </div>
      </div>
      <p className="m-0 mt-2.5 text-[13px] font-semibold leading-snug text-stone-600">
        {badge.requirementText}
      </p>
      <p className="m-0 mt-1 text-[12px] font-bold text-stone-400">
        Hadiah: {getBadgeRewardText(badge)}
      </p>
      {action && (
        <Link
          to={action.to}
          className="btn btn-sm mt-3 w-full no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-800 md:mt-auto"
        >
          {action.icon}
          {action.label}
        </Link>
      )}
    </li>
  );
}

function BadgeCard({
  badge,
  progress,
  total,
  unlocked,
  pending,
  accent,
  onSelect,
}: {
  badge: Badge;
  progress: number;
  total: number;
  unlocked: boolean;
  pending: boolean;
  accent: string;
  onSelect: () => void;
}) {
  const pct = total > 0 ? Math.min(progress / total, 1) : 0;
  const statusText = getBadgeStatusText(badge, { progress, total, unlocked, pending });
  const circumference = 2 * Math.PI * 37;
  const offset = circumference - circumference * pct;

  return (
    <button
      aria-label={`Lihat detail lencana ${badge.displayName}: ${getBadgeShortRequirement(badge)}, ${statusText}`}
      className="group flex min-h-[190px] w-full flex-col items-center rounded-[var(--radius-lg)] bg-white p-3 text-center shadow-sm border-2 border-stone-100 border-b-4 border-b-stone-200 transition-all duration-150 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      onClick={onSelect}
      style={{ "--tw-ring-color": accent } as CSSProperties}
      type="button"
    >
      <div className={`relative h-[82px] w-[82px] ${unlocked ? "" : "opacity-75"}`}>
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
      <b className="mt-2 text-[12.5px] font-extrabold leading-tight text-stone-800 max-w-[14ch]">
        {badge.displayName}
      </b>
      <span className="mt-1 text-[11.5px] font-semibold leading-snug text-stone-500">
        {getBadgeShortRequirement(badge)}
      </span>
      <span
        className="mt-auto pt-2 text-[12px] font-black"
        style={{ color: unlocked ? accent : "#78716c" }}
      >
        {statusText}
      </span>
    </button>
  );
}

function BadgeDetailModal({
  badge,
  progress,
  total,
  unlocked,
  pending,
  accent,
  onClose,
}: {
  badge: Badge | null;
  progress: number;
  total: number;
  unlocked: boolean;
  pending: boolean;
  accent: string;
  onClose: () => void;
}) {
  if (!badge) return null;

  const action = getBadgeAction(badge);
  const pct = total > 0 ? Math.min(progress / total, 1) : 0;
  const progressPercent = Math.round(pct * 100);
  const requirement = badge.requirementText;
  const progressText = getBadgeStatusText(badge, { progress, total, unlocked, pending });
  const rewardText = getBadgeRewardText(badge);
  const hasProgressBar = unlocked || (!pending && hasMeasurableProgress(badge));

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
                {unlocked ? "Didapat" : pending ? "Diproses" : "Terkunci"}
              </div>
              <DialogTitle className="text-[25px] font-black leading-none tracking-tight text-white">
                {badge.displayName}
              </DialogTitle>
              <DialogDescription className="mt-2 text-[13px] font-semibold leading-relaxed text-white/72">
                {unlocked
                  ? "Selamat, lencana ini sudah jadi milikmu!"
                  : pending
                    ? "Syaratnya sudah terpenuhi. Lencana ini sedang diproses."
                    : "Penuhi syarat di bawah untuk mendapatkan lencana ini."}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-[#fffcf7] p-5">
          <div className="rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-stone-200 bg-white p-4">
            <div className="text-[10px] font-black uppercase tracking-wide text-stone-400">
              Cara mendapatkan
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
                  {hasProgressBar || pending ? progressText : "Diberikan otomatis"}
                </div>
              </div>
              {hasProgressBar && (
                <div className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-black" style={{ background: `${accent}16`, color: accent }}>
                  {progressPercent}%
                </div>
              )}
            </div>
            {hasProgressBar ? (
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ background: accent, width: `${progressPercent}%` }}
                />
              </div>
            ) : (
              <p className="m-0 mt-2 text-[13px] font-semibold leading-snug text-stone-500">
                {pending
                  ? "Lencana ini akan masuk ke koleksimu setelah kamu menyelesaikan Try-out berikutnya."
                  : "Lencana ini otomatis masuk ke koleksimu saat syaratnya terpenuhi."}
              </p>
            )}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-stone-200 bg-white p-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wide text-stone-400">
                Hadiah
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


function getBadgeRewardText(badge: Badge) {
  const parts: string[] = [];

  if (badge.xpReward > 0) parts.push(`+${badge.xpReward.toLocaleString("id-ID")} EXP`);
  if (badge.permanentXpBonusPercent) parts.push(`+${badge.permanentXpBonusPercent}% EXP permanen`);

  return parts.length > 0 ? parts.join(" · ") : "Lencana kehormatan";
}

function getBadgeStatusText(
  badge: Badge,
  { progress, total, unlocked, pending }: Omit<BadgeProgressView, "badgeId">,
) {
  if (unlocked) return "Didapat";
  if (pending) return "Diproses";
  if (!hasMeasurableProgress(badge)) return "Terkunci";

  const group = getBadgeGroupKey(badge);
  if (group === "level") return `Level ${progress}/${total}`;
  if (group === "streak") return `${progress}/${total} hari`;
  if (group === "start" || group === "tryouts") return `${progress}/${total} Try-out`;

  return `${progress}/${total} kali`;
}

function getBadgeShortRequirement(badge: Badge) {
  if (badge.requirementOverride) return badge.requirementOverride;

  const target = getBadgeTarget(badge);
  const group = getBadgeGroupKey(badge);

  if (group === "start") return "Selesaikan 1 Try-out";
  if (group === "level") return `Capai Level ${target}`;
  if (group === "streak") return `${target} hari berturut-turut`;
  if (group === "tryouts") return `${target} Try-out berbeda`;
  if (group === "leaderboard") {
    const rank = badge.task.match(/top (\d+)/i)?.[1];
    return `Masuk Top ${rank} mingguan`;
  }
  if (badge.name === "100% Club") return "Skor 100% di percobaan pertama";
  if (badge.name === "Speed Runner") return "Separuh waktu, skor di atas 80%";
  if (badge.name === "Fail Legend") return `Pantang menyerah ${target}x`;

  return badge.requirementText;
}

function getBadgeAction(badge: Badge): null | {
  label: string;
  to: "/tryout" | "/leaderboard";
  icon: ReactNode;
} {
  const group = getBadgeGroupKey(badge);

  if (group === "leaderboard") {
    return { label: "Lihat Leaderboard", to: "/leaderboard", icon: <LevelIcon /> };
  }

  if (badge.name === "Fail Legend") return null;
  if (group === "level") return { label: "Kumpulkan EXP", to: "/tryout", icon: <TargetIcon /> };
  if (group === "streak") return { label: "Kerjakan Hari Ini", to: "/tryout", icon: <FlameIcon /> };

  return { label: "Mulai Try-out", to: "/tryout", icon: <TargetIcon /> };
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

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M8 7h8M8 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 21h8M9 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
