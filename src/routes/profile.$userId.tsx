import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BottomNav, TopBar } from "../components/Navigation";
import { AvatarDisplay } from "../components/AvatarDisplay";
import { badges, getLevelForXp, getNextLevel, getXpProgress } from "../data";
import { getGradeForLevel } from "../data/users";
import { getPublicStudentProfile, listProgressSummary } from "../lib/student-functions";

export const Route = createFileRoute("/profile/$userId")({
  loader: async ({ params }) => {
    const [profile, summary] = await Promise.all([
      getPublicStudentProfile({ data: { studentUserId: params.userId } }),
      listProgressSummary(),
    ]);

    return { profile, summary };
  },
  head: ({ params }) => ({
    meta: [
      { title: "Profil Pengguna — IlmoraX" },
      { name: "description", content: "Lihat profil publik pengguna IlmoraX. Pantau level, XP, streak, dan koleksi lencana yang telah dibuka." },
      { property: "og:title", content: "Profil Pengguna — IlmoraX" },
      { property: "og:description", content: "Lihat profil publik pengguna IlmoraX. Pantau level, XP, dan koleksi lencana." },
    ],
  }),
  component: PublicProfileComponent,
});

function PublicProfileComponent() {
  const { profile, summary } = Route.useLoaderData() as {
    profile: Awaited<ReturnType<typeof getPublicStudentProfile>>;
    summary: Awaited<ReturnType<typeof listProgressSummary>>;
  };
  const levelInfo = getLevelForXp(profile.xp);
  const nextLevel = getNextLevel(profile.xp);
  const xpProgress = getXpProgress(profile.xp);
  const grade = getGradeForLevel(levelInfo.level);
  const currentLevelXp = levelInfo.xp;
  const nextLevelXp = nextLevel?.xp ?? levelInfo.xp;
  const unlockedBadgeList = badges.filter((badge) => isBadgeUnlocked(badge, profile, levelInfo.level));

  return (
    <div
      className="app-shell"
      style={{ background: "linear-gradient(180deg, #eef8f6 0%, #f6fbfa 44%, #f7f3ea 100%)" }}
    >
      <div
        className="relative overflow-hidden pb-8"
        style={{
          background:
            "radial-gradient(900px 340px at 8% -18%, rgba(32,80,114,0.22), transparent 62%), radial-gradient(720px 340px at 94% -12%, #0ea5e91a, transparent 68%), linear-gradient(180deg, #eef8f6 0%, #fbfaf7 100%)",
        }}
      >
        <TopBar progress={{ xp: summary.xp, streak: summary.streak }} />
        <div className="page-lane pt-7 lg:pt-10">
          <Link to="/leaderboard" className="mb-5 inline-flex items-center gap-2 text-sm font-extrabold text-stone-500 no-underline transition-colors hover:text-primary">
            <ArrowLeftIcon />
            Kembali ke Leaderboard
          </Link>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Profil Peserta
          </div>
          <h1 className="mt-2 max-w-[18ch] text-[28px] font-bold leading-tight tracking-tight text-stone-800 sm:text-[34px] lg:text-[44px]">
            {profile.name}
          </h1>
          <p className="m-0 mt-3 max-w-[56ch] text-[14px] font-medium leading-relaxed text-stone-500 sm:text-[15px]">
            Lihat progres, ritme belajar, dan koleksi lencana peserta ini.
          </p>
        </div>
      </div>

      <div className="page-lane relative -mt-4 grid gap-6 pb-28 lg:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)] lg:items-start">
        <div className="rounded-[var(--radius-xl)] border-2 border-b-4 border-[#cfe7df] border-b-[#a9d1c6] bg-[linear-gradient(135deg,rgba(235,250,247,0.98)_0%,rgba(255,252,245,0.98)_100%)] p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[linear-gradient(135deg,#fff7ed_0%,#dcecf7_100%)] text-[44px] font-black tracking-wide text-stone-800 shadow-sm">
              <AvatarDisplay avatar={profile.avatar} photoUrl={profile.photoUrl} className="h-full w-full" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-bold tracking-tight text-stone-800">{profile.name}</h2>
              <p className="m-0 mt-1 truncate text-sm font-semibold text-stone-500">{profile.institution}</p>
            </div>
          </div>

          <div className="mt-4 rounded-[var(--radius-lg)] border-2 border-primary-soft bg-white/76 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                  Level {levelInfo.level}
                </div>
                <div className="mt-1 text-[14px] font-bold leading-snug text-stone-800">{grade}</div>
              </div>
              <div className="rounded-full border-2 border-brand-sky bg-primary-tint px-2.5 py-1 text-[12px] font-bold text-primary-dark">
                {xpProgress}%
              </div>
            </div>
            <div className="mt-3 rounded-full border-2 border-primary-soft bg-primary-tint/80 p-1 shadow-[inset_0_1px_2px_rgba(15,118,110,0.12)]">
              <div className="h-4 overflow-hidden rounded-full bg-white/90">
                <div
                  className="relative h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${xpProgress}%`,
                    minWidth: xpProgress > 0 ? "28px" : "0",
                    background: "linear-gradient(90deg, #205072 0%, #153d5c 100%)",
                  }}
                >
                  <div className="absolute inset-x-1 top-1 h-0.75 rounded-full bg-white/30" />
                </div>
              </div>
            </div>
            <div className="mt-2 flex justify-between text-[11px] font-semibold text-stone-500">
              <span>{currentLevelXp.toLocaleString()} XP</span>
              <span>{nextLevelXp.toLocaleString()} XP</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="grid grid-flow-dense grid-cols-3 gap-3">
            <StatCard label="Soal" value={String(profile.totalQuestions)} accent="#205072" icon={<DocumentIcon />} />
            <StatCard label="Try-out" value={String(profile.totalTryouts)} accent="#0ea5e9" icon={<ChartIcon />} />
            <StatCard label="Streak" value={String(profile.streak)} accent="#f59e0b" icon={<FlameIcon />} />
          </div>

          <div>
            <SectionHeader title={`Koleksi Lencana ${unlockedBadgeList.length}/${badges.length}`} />
            {unlockedBadgeList.length === 0 ? (
              <div className="rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white p-6 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-primary-soft bg-primary-tint text-primary">
                  <BadgeIcon />
                </div>
                <p className="m-0 mx-auto mt-3 max-w-[28ch] text-sm font-semibold leading-relaxed text-stone-500">Belum ada lencana</p>
              </div>
            ) : (
              <div className="grid grid-flow-dense grid-cols-4 gap-3 sm:grid-cols-5 xl:grid-cols-6">
                {unlockedBadgeList.map((badge) => (
                  <BadgePreview key={badge.id} name={badge.name} icon={badge.icon} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav active="rank" />
    </div>
  );
}

function isBadgeUnlocked(
  badge: (typeof badges)[number],
  profile: Awaited<ReturnType<typeof getPublicStudentProfile>>,
  level: number,
) {
  if (profile.awardedBadgeIds.includes(badge.id)) return true;

  const accuracy = profile.totalQuestions > 0
    ? Math.round((profile.totalCorrect / profile.totalQuestions) * 100)
    : 0;
  const levelMatch = badge.task.match(/Reach Level (\d+)/i);
  const streakMatch = badge.task.match(/(\d+)[-\s]Days/i);
  const tryoutMatch = badge.task.match(/Complete (\d+) unique tryouts/i);

  if (levelMatch) return level >= Number(levelMatch[1]);
  if (streakMatch) return profile.streak >= Number(streakMatch[1]);
  if (tryoutMatch) return profile.totalTryouts >= Number(tryoutMatch[1]);
  if (badge.id === 1) return profile.totalTryouts > 0;
  if (badge.name === "100% Club") return accuracy >= 100;

  return false;
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
      className="mt-2 inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: "#92400e", borderColor: `${accent}44`, background: `${accent}18` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
      {label}
    </span>
  );
}

function StatCard({ label, value, accent, icon }: { label: string; value: string; accent: string; icon: ReactNode }) {
  return (
    <div
      className="rounded-[var(--radius-lg)] border-2 border-b-4 p-3.5 shadow-sm"
      style={{
        background: `linear-gradient(180deg, ${accent}12 0%, rgba(255,255,255,0.92) 72%)`,
        borderColor: `${accent}22`,
        borderBottomColor: `${accent}36`,
      }}
    >
      <SmallIconTile icon={icon} accent={accent} />
      <div className="mt-3 text-lg font-bold leading-none tracking-tight text-stone-800">{value}</div>
      <div className="mt-1 text-[10.5px] font-semibold leading-tight text-stone-400">{label}</div>
    </div>
  );
}

function BadgePreview({ name, icon }: { name: string; icon: string }) {
  return (
    <div className="group flex flex-col items-center gap-1 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-b-4 border-amber-200 border-b-amber-400 bg-amber-50 text-[26px] transition-transform duration-700 ease-out group-hover:scale-105">
        {icon}
      </div>
      <span className="line-clamp-2 text-[10px] font-bold leading-tight text-stone-600">{name}</span>
    </div>
  );
}

function SmallIconTile({ icon, accent }: { icon: ReactNode; accent: string }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2" style={{ color: accent, background: `${accent}18`, borderColor: `${accent}30` }}>
      {icon}
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 3v5h5M8 13h8M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M5 19V5M5 19h14M9 16v-5M13 16V8M17 16v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

function BadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" stroke="currentColor" strokeWidth="2" />
      <path d="m8.8 13-1.3 7 4.5-2.4 4.5 2.4-1.3-7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
