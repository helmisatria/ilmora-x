import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav, TopBar } from "../components/Navigation";
import { mockUsers, useApp, type LeaderboardEntry } from "../data";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard Mingguan — IlmoraX" },
      { name: "description", content: "Papan peringkat mingguan IlmoraX. Lihat peringkatmu, kejar posisi terbaik, dan kompetisi dengan ribuan calon apoteker lainnya. Reset setiap Senin." },
      { property: "og:title", content: "Leaderboard Mingguan — IlmoraX" },
      { property: "og:description", content: "Papan peringkat mingguan IlmoraX. Lihat peringkatmu dan kompetisi dengan ribuan calon apoteker lainnya." },
    ],
  }),
  component: LeaderboardComponent,
});

const accent = "#f59e0b";

function LeaderboardComponent() {
  const { leaderboardUsers } = useApp();
  const podium = [leaderboardUsers[1], leaderboardUsers[0], leaderboardUsers[2]].filter(Boolean);
  const currentUser = leaderboardUsers.find((user) => user.me);
  const leader = leaderboardUsers[0];
  const leaderGap = currentUser && leader ? Math.max(leader.xp - currentUser.xp, 0) : 0;

  return (
    <div
      className="app-shell"
      style={{
        background:
          "linear-gradient(180deg, #fff8eb 0%, #fbfaf7 42%, #eef8f6 100%)",
      }}
    >
      <div
        className="relative overflow-hidden pb-8"
        style={{
          background:
            "radial-gradient(900px 320px at 14% -18%, #f59e0b33, transparent 62%), radial-gradient(760px 340px at 94% -14%, #14b8a61f, transparent 68%), linear-gradient(180deg, #fff8eb 0%, #fbfaf7 100%)",
        }}
      >
        <TopBar />
        <div className="page-lane pt-7 lg:pt-10">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Peringkat Mingguan
          </div>
          <h1 className="mt-2 max-w-[18ch] text-[28px] font-bold leading-tight tracking-tight text-stone-800 sm:text-[34px] lg:text-[44px]">
            Kejar posisi terbaik minggu ini
          </h1>
          <p className="m-0 mt-3 max-w-[56ch] text-[14px] font-medium leading-relaxed text-stone-500 sm:text-[15px]">
            Peringkat dihitung dari XP mingguan dan diperbarui otomatis dari aktivitas tryout.
          </p>

          <div className="mt-5 grid max-w-[560px] grid-flow-dense grid-cols-2 gap-3">
            <SummaryCard label="Peringkatmu" value={currentUser ? `#${currentUser.r}` : "-"} accent="#14b8a6" />
            <SummaryCard label="Jarak leader" value={`${leaderGap.toLocaleString()} XP`} accent={accent} />
          </div>
        </div>
      </div>

      <div className="page-lane relative -mt-4 grid gap-6 pb-28 lg:grid-cols-[minmax(330px,0.9fr)_minmax(0,1.25fr)] lg:items-start">
        <div className="grid gap-6 lg:sticky lg:top-20">
          <div className="rounded-[var(--radius-xl)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white p-5 shadow-sm">
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
                style={{ color: accent, background: `${accent}18`, borderColor: `${accent}30` }}
              >
                <TrophyIcon />
              </div>
            </div>

            <div className="mt-5 flex items-end justify-center gap-2">
              {podium.map((user) => (
                <PodiumCard key={user.r} user={user} />
              ))}
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border-2 border-b-4 border-stone-100 border-b-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-primary border-2 border-teal-100 flex items-center justify-center shrink-0">
                <ClockIcon />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-stone-800">Reset mingguan</h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-stone-500 font-medium max-w-[30ch]">
                  Papan peringkat dimulai ulang setiap Senin pukul 00.00 WIB.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:pt-4">
          <SectionHeader title="Daftar peserta" />
          <div className="flex flex-col gap-2.5">
            {leaderboardUsers.map((user) => (
              <LeaderboardRow key={user.r} user={user} />
            ))}
          </div>
        </div>
      </div>

      <BottomNav active="rank" />
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

function PodiumCard({ user }: { user: LeaderboardEntry }) {
  const isFirst = user.r === 1;
  const height = isFirst ? "h-[132px]" : "h-[108px]";
  const tone = getRankTone(user.r);
  const rankSymbol = getRankSymbol(user.r);

  return (
    <Link
      to={getProfileTo(user)}
      params={getProfileParams(user)}
      className={`group flex w-[31%] min-w-0 flex-col items-center justify-end rounded-t-[var(--radius-lg)] border-2 border-b-4 px-2 py-3 text-center no-underline transition-all duration-200 hover:-translate-y-1 ${height}`}
      style={{
        background: `linear-gradient(180deg, ${tone}20 0%, #ffffff 74%)`,
        borderColor: `${tone}40`,
        borderBottomColor: tone,
      }}
    >
      {isFirst && (
        <div className="-mt-9 mb-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-200 bg-amber-50 text-amber-600 shadow-sm">
          <CrownIcon />
        </div>
      )}
      <div
        className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white text-[27px] font-black tracking-wide text-stone-800 shadow-sm transition-transform duration-700 ease-out group-hover:scale-105"
        style={{ borderColor: `${tone}55` }}
      >
        {user.a}
      </div>
      <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wide" style={{ color: tone }}>
        <span className="text-[13px] leading-none">{rankSymbol}</span>
        <span>#{user.r}</span>
      </div>
      <div className="mt-1 max-w-[9ch] truncate text-[13px] font-extrabold text-stone-800">
        {getFirstName(user.n)}
      </div>
      <div className="mt-1 text-[10.5px] font-semibold text-stone-400">
        {user.xp.toLocaleString()} XP
      </div>
    </Link>
  );
}

function LeaderboardRow({ user }: { user: LeaderboardEntry }) {
  const isRising = user.ch === "up";
  const rankTone = getRankTone(user.r);

  return (
    <Link
      to={getProfileTo(user)}
      params={getProfileParams(user)}
      className={`group flex items-center gap-3 rounded-[var(--radius-lg)] bg-white px-3.5 py-3 shadow-sm border-2 border-b-4 transition-all duration-150 hover:translate-x-1 no-underline ${
        user.me
          ? "border-primary bg-teal-50 border-b-primary-dark"
          : "border-stone-100 border-b-stone-200"
      }`}
    >
      <div className="w-7 text-center text-sm font-black" style={{ color: rankTone }}>
        #{user.r}
      </div>
      <div
        className="h-11 w-11 rounded-full border-2 bg-white flex items-center justify-center text-[22px] font-black tracking-wide text-stone-800 shadow-sm transition-transform duration-700 ease-out group-hover:scale-105"
        style={{
          borderColor: `${rankTone}35`,
          background: `linear-gradient(135deg, ${rankTone}14 0%, #ffffff 74%)`,
        }}
      >
        {user.a}
      </div>
      <div className="min-w-0 flex-1">
        <b className="block truncate text-[15px] font-extrabold text-stone-800">
          {user.n}{user.me ? " (Kamu)" : ""}
        </b>
        <span className="mt-0.5 block truncate text-xs font-semibold text-stone-400">
          Level {user.level} · {user.xp.toLocaleString()} XP minggu ini
        </span>
      </div>
      <span className={`flex h-8 w-8 items-center justify-center rounded-xl border-2 text-sm font-black ${
        isRising
          ? "border-green-100 bg-green-50 text-success"
          : "border-rose-100 bg-rose-50 text-coral"
      }`}>
        {isRising ? <TrendUpIcon /> : <TrendDownIcon />}
      </span>
    </Link>
  );
}

function getRankTone(rank: number) {
  if (rank === 1) return "#f59e0b";
  if (rank === 2) return "#94a3b8";
  if (rank === 3) return "#c08457";
  return "#14b8a6";
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

  const userRecord = mockUsers.find((mockUser) => mockUser.name === user.n);
  return { userId: String(userRecord?.id ?? 2) };
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M8 4h8v3a4 4 0 0 1-8 0V4ZM12 11v4M9 20h6M10 15h4v5h-4v-5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6H4v1.5A3.5 3.5 0 0 0 7.5 11H9M16 6h4v1.5a3.5 3.5 0 0 1-3.5 3.5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="m4 8 4 3.5L12 5l4 6.5L20 8l-1.5 10h-13L4 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="m5 15 5-5 4 4 5-7M15 7h4v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="m5 9 5 5 4-4 5 7M15 17h4v-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
