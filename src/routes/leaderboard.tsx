import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav, TopBar } from "../components/Navigation";
import { AvatarDisplay } from "../components/AvatarDisplay";
import { getLevelForXp } from "../data";
import { getGradeForLevel } from "../data/users";
import { listLeaderboard, listProgressSummary } from "../lib/student-functions";

type LeaderboardEntry = {
  r: number;
  userId: string;
  n: string;
  xp: number;
  a: string;
  photoUrl?: string | null;
  ch: "up" | "down";
  me: boolean;
  level: number;
  grade: string;
};

export const Route = createFileRoute("/leaderboard")({
  preloadStaleTime: 0,
  loader: async () => {
    const [leaderboard, summary] = await Promise.all([
      listLeaderboard(),
      listProgressSummary(),
    ]);

    return { leaderboard, summary };
  },
  head: () => ({
    meta: [
      { title: "Leaderboard Mingguan — IlmoraX" },
      {
        name: "description",
        content:
          "Papan peringkat mingguan IlmoraX. Lihat peringkatmu, kejar posisi terbaik, dan kompetisi dengan ribuan calon apoteker lainnya. Reset setiap Senin.",
      },
      { property: "og:title", content: "Leaderboard Mingguan — IlmoraX" },
      {
        property: "og:description",
        content:
          "Papan peringkat mingguan IlmoraX. Lihat peringkatmu dan kompetisi dengan ribuan calon apoteker lainnya.",
      },
    ],
  }),
  component: LeaderboardComponent,
});

const accent = "#f59e0b";

function LeaderboardComponent() {
  const { leaderboard, summary } = Route.useLoaderData() as {
    leaderboard: Awaited<ReturnType<typeof listLeaderboard>>;
    summary: Awaited<ReturnType<typeof listProgressSummary>>;
  };
  const leaderboardUsers = leaderboard.entries.map((entry): LeaderboardEntry => {
    const level = getLevelForXp(entry.xp).level;

    return {
      r: entry.rank,
      userId: entry.userId,
      n: entry.name,
      xp: entry.xp,
      a: entry.avatar,
      photoUrl: entry.photoUrl,
      ch: "up",
      me: entry.me,
      level,
      grade: getGradeForLevel(level),
    };
  });
  const podium = [
    leaderboardUsers[1],
    leaderboardUsers[0],
    leaderboardUsers[2],
  ].filter(isLeaderboardEntry);
  const viewerEntry = leaderboardUsers.find((user) => user.me);
  const leader = leaderboardUsers[0];
  const leaderGap =
    viewerEntry && leader ? Math.max(leader.xp - viewerEntry.xp, 0) : 0;
  const weekRange = formatWeekRange(leaderboard.week.startsAt, leaderboard.week.endsAt);
  const rewardsAt = formatJakartaDateTime(leaderboard.week.rewardsFinaliseAt);

  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, #fff8eb 0%, #fbfaf7 42%, #eef8f6 100%)",
      }}
    >
      <div className="app-shell page-enter" style={{ background: "transparent" }}>
        <div
          className="relative overflow-hidden pb-8"
          style={{
            background:
              "radial-gradient(900px 320px at 14% -18%, #f59e0b33, transparent 62%), radial-gradient(760px 340px at 94% -14%, rgba(32,80,114,0.12), transparent 68%), linear-gradient(180deg, #fff8eb 0%, #fbfaf7 100%)",
          }}
        >
          <TopBar progress={{ xp: summary.xp, streak: summary.streak }} />
          <div className="page-lane pt-7 lg:pt-10">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Peringkat Mingguan
            </div>
            <h1 className="mt-2 max-w-[18ch] text-[28px] font-bold leading-tight tracking-tight text-stone-800 sm:text-[34px] lg:text-[44px]">
              Kejar posisi terbaik minggu ini
            </h1>
            <p className="m-0 mt-3 max-w-[56ch] text-[14px] font-medium leading-relaxed text-stone-500 sm:text-[15px]">
              Peringkat ini live untuk minggu berjalan: {weekRange}. Reward
              badge Top leaderboard diproses sekitar {rewardsAt}.
            </p>

            <div className="mt-5 grid max-w-[560px] grid-flow-dense grid-cols-2 gap-3">
              <SummaryCard
                label="Peringkatmu"
                value={viewerEntry ? `#${viewerEntry.r}` : "-"}
                accent="#205072"
              />
              <SummaryCard
                label="Jarak leader"
                value={`${leaderGap.toLocaleString()} XP`}
                accent={accent}
              />
            </div>
          </div>
        </div>

        <div className="page-lane relative -mt-4 grid gap-6 pb-28 lg:grid-cols-[minmax(330px,0.9fr)_minmax(0,1.25fr)] lg:items-start">
          <div className="grid gap-6 lg:sticky lg:top-20">
            <div className="rounded-[var(--radius-xl)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white px-3 py-5 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                    Kompetisi
                  </div>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-stone-800">
                    Minggu ini
                  </h2>
                </div>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border-2"
                  style={{
                    color: accent,
                    background: `${accent}18`,
                    borderColor: `${accent}30`,
                  }}
                >
                  <TrophyIcon />
                </div>
              </div>

              <div
                className="mt-6 w-full min-w-0"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "6px",
                  alignItems: "end",
                }}
              >
                {podium.length > 0 ? (
                  podium.map((user) => (
                    <PodiumCard key={user.r} user={user} />
                  ))
                ) : (
                  <div className="col-span-3 rounded-[var(--radius-md)] border-2 border-dashed border-stone-200 bg-stone-50 p-5 text-center">
                    <p className="text-sm font-extrabold text-stone-600">Belum ada peserta minggu ini.</p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-stone-400">
                      Selesaikan tryout untuk masuk leaderboard live.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[var(--radius-lg)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-tint text-primary border-2 border-primary-soft flex items-center justify-center shrink-0">
                  <ClockIcon />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-800">
                    Reset mingguan
                  </h3>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-stone-500 font-medium max-w-[30ch]">
                    Papan peringkat ini ditutup {formatJakartaDateTime(leaderboard.week.endsAt)}.
                    Badge Top 1/3/5/10 diberikan saat finalisasi mingguan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col overflow-hidden lg:pt-4">
            <SectionHeader title="Daftar peserta" />
            <div className="flex w-full min-w-0 flex-col gap-2.5 overflow-hidden">
              {leaderboardUsers.length > 0 ? (
                leaderboardUsers.map((user) => (
                  <LeaderboardRow key={user.r} user={user} />
                ))
              ) : (
                <EmptyLeaderboard excludedReason={leaderboard.viewerExcludedReason} />
              )}
            </div>
          </div>
        </div>

        <BottomNav active="rank" />
      </div>
    </div>
  );
}

function formatJakartaDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
    timeZoneName: "short",
  }).format(new Date(value));
}

function isLeaderboardEntry(user: LeaderboardEntry | undefined): user is LeaderboardEntry {
  return Boolean(user);
}

function formatWeekRange(startsAt: string, endsAt: string) {
  const start = formatJakartaDateTime(startsAt);
  const end = formatJakartaDateTime(endsAt);

  return `${start} - ${end}`;
}

function EmptyLeaderboard({
  excludedReason,
}: {
  excludedReason: Awaited<ReturnType<typeof listLeaderboard>>["viewerExcludedReason"];
}) {
  if (excludedReason === "admin_account") {
    return (
      <div className="rounded-[var(--radius-lg)] border-2 border-dashed border-amber-200 bg-white p-6 text-center shadow-sm">
        <p className="text-base font-extrabold text-stone-700">Akun admin tidak ikut leaderboard.</p>
        <p className="mx-auto mt-2 max-w-[46ch] text-sm font-semibold leading-relaxed text-stone-500">
          XP tryout tetap masuk progress akunmu, tapi akun admin dikeluarkan dari kompetisi mingguan
          dan badge Top 1/3/5/10.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border-2 border-dashed border-stone-200 bg-white p-6 text-center shadow-sm">
      <p className="text-base font-extrabold text-stone-700">Leaderboard minggu ini masih kosong.</p>
      <p className="mx-auto mt-2 max-w-[42ch] text-sm font-semibold leading-relaxed text-stone-500">
        Hanya XP dari tryout yang sudah dikumpulkan minggu berjalan yang dihitung. Setelah ada peserta,
        peringkat live akan muncul di sini.
      </p>
      <Link to="/tryout" className="btn btn-primary mt-4 inline-flex no-underline">
        Mulai Tryout
      </Link>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
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

function PodiumCard({ user }: { user: LeaderboardEntry }) {
  const isFirst = user.r === 1;
  const tone = getRankTone(user.r);
  const rankSymbol = getRankSymbol(user.r);
  const layoutClass = getPodiumLayoutClass(user.r);
  const avatarSize = isFirst
    ? "h-[clamp(44px,14vw,72px)] w-[clamp(44px,14vw,72px)]"
    : "h-[clamp(38px,12vw,64px)] w-[clamp(38px,12vw,64px)]";

  return (
    <Link
      to={getProfileTo(user)}
      params={getProfileParams(user)}
      className={`group relative flex w-full min-w-0 max-w-full flex-col items-center overflow-hidden rounded-t-[var(--radius-md)] border-2 border-b-4 px-1 pb-2 pt-3 text-center no-underline transition-all duration-200 hover:-translate-y-1 sm:rounded-t-[var(--radius-lg)] sm:px-2 sm:pb-4 sm:pt-4 ${layoutClass}`}
      style={{
        background: `linear-gradient(180deg, ${tone}20 0%, #ffffff 74%)`,
        borderColor: `${tone}40`,
        borderBottomColor: tone,
        maxWidth: "100%",
        minWidth: 0,
        width: "100%",
      }}
    >
      <div
        className={`relative mb-1.5 flex ${avatarSize} items-center justify-center rounded-full border-2 bg-white text-[18px] font-black tracking-wide text-stone-800 shadow-sm transition-transform duration-700 ease-out group-hover:scale-105 sm:mb-2 sm:text-[28px]`}
        style={{ borderColor: `${tone}55` }}
      >
        {isFirst && (
          <div className="absolute left-1/2 top-0.5 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-amber-200 bg-amber-50 text-amber-600 shadow-sm sm:h-7 sm:w-7">
            <CrownIcon />
          </div>
        )}
        <AvatarDisplay
          avatar={user.a}
          photoUrl={user.photoUrl}
          className="h-full w-full overflow-hidden rounded-full"
        />
      </div>
      <div
        className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide sm:text-[11px]"
        style={{ color: tone }}
      >
        <span className="text-[10px] leading-none sm:text-[13px]">
          {rankSymbol}
        </span>
        <span>#{user.r}</span>
      </div>
      <div className="mt-1 flex min-h-[2rem] w-full min-w-0 items-center justify-center overflow-hidden sm:mt-1.5 sm:min-h-[2.65rem] sm:px-0.5">
        <p
          className="line-clamp-2 w-full max-w-full text-[clamp(9px,2.8vw,13px)] font-extrabold leading-snug text-stone-800"
          style={{
            minWidth: 0,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {user.n}
        </p>
      </div>
      <div className="mt-0.5 flex min-h-[1.7rem] w-full min-w-0 items-center justify-center overflow-hidden sm:mt-1 sm:min-h-[2.25rem] sm:px-0.5">
        <p
          className="line-clamp-2 w-full max-w-full text-[clamp(7.5px,2.25vw,10px)] font-semibold leading-snug text-stone-500"
          style={{
            minWidth: 0,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          Level {user.level} · {user.grade}
        </p>
      </div>
      <div className="mt-auto max-w-full truncate pt-1.5 text-[clamp(7.5px,2.3vw,10.5px)] font-semibold text-stone-400 sm:pt-2">
        {user.xp.toLocaleString()} XP
      </div>
    </Link>
  );
}

function getPodiumLayoutClass(rank: number) {
  if (rank === 1) {
    return "h-[clamp(180px,55vw,286px)]";
  }

  if (rank === 2) {
    return "h-[clamp(166px,50vw,258px)]";
  }

  return "h-[clamp(154px,46vw,236px)]";
}

function LeaderboardRow({ user }: { user: LeaderboardEntry }) {
  const isRising = user.ch === "up";
  const rankTone = getRankTone(user.r);

  return (
    <Link
      to={getProfileTo(user)}
      params={getProfileParams(user)}
      className={`group flex w-full min-w-0 max-w-full items-center gap-2.5 overflow-hidden rounded-[var(--radius-lg)] bg-white px-3 py-3 shadow-sm border-2 border-b-4 transition-all duration-150 hover:-translate-y-0.5 no-underline sm:gap-3 sm:px-3.5 ${
        user.me
          ? "border-primary bg-primary-tint border-b-primary-dark"
          : "border-stone-100 border-b-stone-200"
      }`}
      style={{
        boxSizing: "border-box",
        maxWidth: "100%",
      }}
    >
      <div
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 bg-white text-[22px] font-semibold tracking-wide text-stone-800 shadow-sm transition-transform duration-700 ease-out group-hover:scale-105"
        style={{
          borderColor: `${rankTone}35`,
          background: `linear-gradient(135deg, ${rankTone}14 0%, #ffffff 74%)`,
        }}
      >
        <AvatarDisplay
          avatar={user.a}
          photoUrl={user.photoUrl}
          className="h-full w-full overflow-hidden rounded-full"
        />
        <span
          className="absolute left-0 top-0 flex h-5 min-w-5 -translate-x-1 -translate-y-1 items-center justify-center rounded-full border-2 border-white px-1 text-[9px] font-black leading-none shadow-sm"
          style={{
            background: rankTone,
            color: "#ffffff",
          }}
        >
          #{user.r}
        </span>
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <b className="block max-w-full truncate text-[15px] font-extrabold text-stone-800">
          {user.n}
          {user.me ? " (Kamu)" : ""}
        </b>
        <span className="mt-0.5 block max-w-full truncate text-xs font-semibold text-stone-400">
          Level {user.level} · {user.grade} · {user.xp.toLocaleString()} XP minggu ini
        </span>
      </div>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-black ${
          isRising
            ? "border-green-100 bg-green-50 text-success"
            : "border-rose-100 bg-rose-50 text-coral"
        }`}
      >
        {isRising ? <TrendUpIcon /> : <TrendDownIcon />}
      </span>
    </Link>
  );
}

function getRankTone(rank: number) {
  if (rank === 1) return "#f59e0b";
  if (rank === 2) return "#94a3b8";
  if (rank === 3) return "#c08457";
  return "#205072";
}

function getRankSymbol(rank: number) {
  if (rank === 1) return "I";
  if (rank === 2) return "II";
  if (rank === 3) return "III";
  return "+";
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

function getProfileTo(user: LeaderboardEntry) {
  return user.me ? "/profile" : "/profile/$userId";
}

function getProfileParams(user: LeaderboardEntry) {
  if (user.me) return undefined;

  return { userId: user.userId };
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path
        d="M8 4h8v3a4 4 0 0 1-8 0V4ZM12 11v4M9 20h6M10 15h4v5h-4v-5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 6H4v1.5A3.5 3.5 0 0 0 7.5 11H9M16 6h4v1.5a3.5 3.5 0 0 1-3.5 3.5H15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="m4 8 4 3.5L12 5l4 6.5L20 8l-1.5 10h-13L4 8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="m5 15 5-5 4 4 5-7M15 7h4v4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrendDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="m5 9 5 5 4-4 5 7M15 17h4v-4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
