import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BottomNav, TopBar } from "../components/Navigation";
import { useApp, badges, getLevelForXp, getNextLevel, getXpProgress } from "../data";
import { getLevelGrade } from "../data/users";

export const Route = createFileRoute("/profile")({
  component: ProfileComponent,
});

function ProfileComponent() {
  const { user, setUser, badgeProgress, isPremium, togglePremium } = useApp();
  const navigate = useNavigate();
  const levelInfo = getLevelForXp(user.xp);
  const nextLevel = getNextLevel(user.xp);
  const xpProgress = getXpProgress(user.xp);
  const grade = getLevelGrade(user);

  const unlockedBadges = badgeProgress.filter((bp) => bp.unlocked);
  const unlockedMap = new Map(unlockedBadges.map((bp) => [bp.badgeId, bp]));
  const unlockedBadgeList = badges.filter((b) => unlockedMap.has(b.id));

  // Active permanent bonus from highest Level Badge tier
  const levelBadges = unlockedBadgeList.filter((b) => b.category === "Level" && b.id >= 4 && b.id <= 11);
  const highestLevelBadge = levelBadges.sort((a, b) => b.id - a.id)[0];
  const bonusByBadge: Record<number, number> = { 4: 5, 5: 8, 6: 12, 7: 15, 8: 18, 9: 22, 10: 26, 11: 30 };
  const activeBonus = highestLevelBadge ? bonusByBadge[highestLevelBadge.id] : 0;

  return (
    <div className="app-shell">
      <TopBar />
      <div className="px-4 pt-5 pb-24">
        <div className="bg-primary rounded-[var(--radius-xl)] p-6 text-white relative overflow-hidden border-b-[5px] border-primary-darker">
          <div className="absolute -right-2 -top-2 text-[120px] opacity-10 rotate-[15deg]">🎓</div>

          <div className="flex items-center gap-4 mb-4 relative">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-[44px] border-4 border-white/30 backdrop-blur-sm">
              {user.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="m-0 font-black text-xl truncate">{user.name}</h2>
              <p className="m-0 text-sm opacity-90 font-semibold truncate">{user.institution}</p>
              {isPremium && (
                <span className="inline-block mt-1.5 bg-amber text-white text-[10px] font-black px-2.5 py-1 rounded-full border-b-2 border-amber-dark">
                  ⭐ PREMIUM
                </span>
              )}
            </div>
          </div>

          <div className="bg-white/15 rounded-[var(--radius-lg)] p-4 backdrop-blur-sm">
            <div className="flex justify-between items-baseline mb-2">
              <div>
                <div className="text-xs opacity-80 font-bold uppercase tracking-wide">Level {levelInfo.level}</div>
                <div className="font-black text-lg">{grade}</div>
              </div>
              <div className="text-right">
                <div className="text-xs opacity-80 font-bold">{user.xp.toLocaleString()} XP</div>
                {nextLevel && <div className="text-[11px] opacity-70 font-medium">{nextLevel.xp.toLocaleString()} untuk next level</div>}
              </div>
            </div>
            <div className="h-2.5 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
        </div>

        <AvatarPicker
          selectedAvatar={user.avatar}
          onSelect={(avatar) => {
            setUser((currentUser) => ({ ...currentUser, avatar }));
          }}
        />

        {activeBonus > 0 && (
          <div className="mt-4 bg-amber-50 rounded-[var(--radius-lg)] p-4 border-2 border-amber-300 border-b-4 border-b-amber-500 flex items-center gap-3">
            <div className="text-3xl">{highestLevelBadge?.icon}</div>
            <div className="flex-1">
              <b className="block text-sm font-extrabold text-amber-900">+{activeBonus}% EXP Permanent Bonus</b>
              <span className="text-xs text-amber-700 font-medium">Dari {highestLevelBadge?.name}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 text-center">
            <div className="text-2xl mb-1">📝</div>
            <b className="text-xl font-black">{user.totalQuestions}</b>
            <div className="text-xs text-stone-400 font-bold">Soal</div>
          </div>
          <div className="bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 text-center">
            <div className="text-2xl mb-1">📊</div>
            <b className="text-xl font-black">{user.totalTryouts}</b>
            <div className="text-xs text-stone-400 font-bold">Try-out</div>
          </div>
          <div className="bg-white rounded-[var(--radius-lg)] p-4 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 text-center">
            <div className="text-2xl mb-1">🔥</div>
            <b className="text-xl font-black">{user.streak}</b>
            <div className="text-xs text-stone-400 font-bold">Streak</div>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <h3 className="text-lg font-black m-0">🏅 Lencana ({unlockedBadgeList.length}/{badges.length})</h3>
          <Link to="/badges" className="text-primary text-sm font-extrabold">Lihat semua ›</Link>
        </div>

        {unlockedBadgeList.length === 0 ? (
          <div className="mt-4 bg-stone-100 rounded-[var(--radius-lg)] p-6 text-center">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-sm text-stone-500 font-semibold m-0">Belum ada lencana. Selesaikan tryout pertamamu!</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-4 gap-3">
            {unlockedBadgeList.slice(0, 8).map((b) => (
              <div key={b.id} className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-full bg-amber-50 border-2 border-amber-200 border-b-4 border-b-amber-400 flex items-center justify-center text-[26px]">
                  {b.icon}
                </div>
                <span className="text-[10px] font-extrabold text-center leading-tight text-stone-600 line-clamp-2">{b.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-lg font-black mb-3">⚙️ Akun</h3>
          <div className="bg-white rounded-[var(--radius-lg)] shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 overflow-hidden">
            <Row label="Email" value={user.email} />
            <Divider />
            <Row label="Institusi" value={user.institution} />
            <Divider />
            <Row label="Kode Referral" value={user.referralCode} copyable />
            <Divider />
            <Row label="Bergabung" value={new Date(user.joinDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} />
          </div>
        </div>

        {!isPremium && (
          <Link
            to="/premium"
            className="mt-5 block bg-gradient-to-r from-amber-50 to-amber-100 rounded-[var(--radius-lg)] p-5 border-2 border-amber-300 border-b-4 border-b-amber-500"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">⭐</span>
              <div className="flex-1">
                <b className="block font-extrabold text-amber-900">Upgrade ke Premium</b>
                <span className="text-xs text-amber-700 font-medium">Unlock semua fitur dan pembahasan</span>
              </div>
              <span className="text-amber-900 text-xl">›</span>
            </div>
          </Link>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={togglePremium}
            className="btn btn-white flex-1 text-xs"
          >
            {isPremium ? "Demo: Premium ON" : "Demo: Premium OFF"}
          </button>
          <button
            onClick={() => navigate({ to: "/auth/login" })}
            className="btn btn-white flex-1 text-xs"
          >
            Keluar
          </button>
        </div>
      </div>
      <BottomNav active="learn" />
    </div>
  );
}

const avatarOptions = [
  "🦉",
  "🧑‍⚕️",
  "👩‍⚕️",
  "👨‍⚕️",
  "🧑‍🔬",
  "👩‍🔬",
  "👨‍🔬",
  "🧑‍🎓",
  "👩‍🎓",
  "👨‍🎓",
  "💊",
  "🧬",
] as const;

function AvatarPicker({
  selectedAvatar,
  onSelect,
}: {
  selectedAvatar: string;
  onSelect: (avatar: string) => void;
}) {
  return (
    <div className="mt-4 bg-white rounded-[var(--radius-lg)] p-5 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] font-semibold uppercase tracking-wide text-stone-500">
          Foto Profil
        </span>
        <div className="flex-1 h-px bg-stone-200" />
      </div>
      <div className="grid grid-cols-6 gap-2.5">
        {avatarOptions.map((avatar) => {
          const isSelected = avatar === selectedAvatar;

          return (
            <button
              key={avatar}
              className="aspect-square rounded-2xl border-2 border-b-4 bg-white text-[24px] shadow-sm transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0.5"
              style={{
                borderColor: isSelected ? "#14b8a655" : "#e7e5e4",
                borderBottomColor: isSelected ? "#0d9488" : "#d6d3d1",
                background: isSelected ? "#ccfbf1" : "#ffffff",
              }}
              onClick={() => onSelect(avatar)}
              type="button"
              aria-label={`Pilih avatar ${avatar}`}
            >
              {avatar}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex justify-between items-center px-4 py-3.5">
      <span className="text-xs font-bold text-stone-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-extrabold text-stone-700 flex items-center gap-2">
        {value}
        {copyable && (
          <button
            onClick={() => navigator.clipboard?.writeText(value)}
            className="text-stone-400 hover:text-primary text-xs"
            title="Salin"
          >
            📋
          </button>
        )}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-stone-100 mx-4" />;
}
