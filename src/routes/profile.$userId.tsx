import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav, TopBar } from "../components/Navigation";
import { useApp, badges, mockUsers, getLevelForXp, getXpProgress, isUserPremium } from "../data";
import { getLevelGrade } from "../data/users";

export const Route = createFileRoute("/profile/$userId")({
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
  const { userId } = Route.useParams();
  const { badgeProgress } = useApp();
  const viewedUser = mockUsers.find((u) => u.id === parseInt(userId, 10)) || mockUsers[1];
  const levelInfo = getLevelForXp(viewedUser.xp);
  const xpProgress = getXpProgress(viewedUser.xp);
  const grade = getLevelGrade(viewedUser);
  const premium = isUserPremium(viewedUser);

  const unlockedMap = new Map(badgeProgress.filter((bp) => bp.unlocked).map((bp) => [bp.badgeId, bp]));
  const unlockedBadgeList = badges.filter((b) => unlockedMap.has(b.id));

  return (
    <div className="app-shell">
      <TopBar />
      <div className="px-4 pt-5 pb-24">
        <Link to="/leaderboard" className="text-sm font-extrabold text-stone-500 mb-3 inline-block">← Kembali ke Leaderboard</Link>

        <div className="bg-stone-700 rounded-[var(--radius-xl)] p-6 text-white relative overflow-hidden border-b-[5px] border-stone-900">
          <div className="absolute -right-2 -top-2 text-[120px] opacity-10 rotate-[15deg]">👤</div>

          <div className="flex items-center gap-4 mb-4 relative">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-[44px] border-4 border-white/30">
              {viewedUser.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="m-0 font-black text-xl truncate">{viewedUser.name}</h2>
              <p className="m-0 text-sm opacity-90 font-semibold truncate">{viewedUser.institution}</p>
              {premium && (
                <span className="inline-block mt-1.5 bg-amber text-white text-[10px] font-black px-2.5 py-1 rounded-full border-b-2 border-amber-dark">
                  ⭐ PREMIUM
                </span>
              )}
            </div>
          </div>

          <div className="bg-white/15 rounded-[var(--radius-lg)] p-4">
            <div className="flex justify-between items-baseline mb-2">
              <div>
                <div className="text-xs opacity-80 font-bold uppercase tracking-wide">Level {levelInfo.level}</div>
                <div className="font-black text-lg">{grade}</div>
              </div>
              <div className="text-right">
                <div className="text-xs opacity-80 font-bold">{viewedUser.xp.toLocaleString()} XP</div>
              </div>
            </div>
            <div className="h-2.5 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 text-center">
            <div className="text-2xl mb-1">📝</div>
            <b className="text-xl font-black">{viewedUser.totalQuestions}</b>
            <div className="text-xs text-stone-400 font-bold">Soal</div>
          </div>
          <div className="bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 text-center">
            <div className="text-2xl mb-1">📊</div>
            <b className="text-xl font-black">{viewedUser.totalTryouts}</b>
            <div className="text-xs text-stone-400 font-bold">Try-out</div>
          </div>
          <div className="bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 text-center">
            <div className="text-2xl mb-1">🔥</div>
            <b className="text-xl font-black">{viewedUser.streak}</b>
            <div className="text-xs text-stone-400 font-bold">Streak</div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-black mb-3">🏅 Koleksi Lencana</h3>
          {unlockedBadgeList.length === 0 ? (
            <div className="bg-stone-100 rounded-[var(--radius-lg)] p-6 text-center">
              <div className="text-4xl mb-2">🎯</div>
              <p className="text-sm text-stone-500 font-semibold m-0">Belum ada lencana</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {unlockedBadgeList.map((b) => (
                <div key={b.id} className="flex flex-col items-center gap-1">
                  <div className="w-14 h-14 rounded-full bg-amber-50 border-2 border-amber-200 border-b-4 border-b-amber-400 flex items-center justify-center text-[26px]">
                    {b.icon}
                  </div>
                  <span className="text-[10px] font-extrabold text-center leading-tight text-stone-600 line-clamp-2">{b.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav active="rank" />
    </div>
  );
}
