import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BottomNav, TopBar } from "../components/Navigation";
import { badges, getLevelForXp, getNextLevel, getXpProgress, useApp } from "../data";
import { getLevelGrade } from "../data/users";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profil Belajar — IlmoraX" },
      { name: "description", content: "Kelola profil belajarmu, pantau level dan XP, lihat koleksi lencana, dan atur data akun. Progress belajar farmasi dalam satu tempat." },
      { property: "og:title", content: "Profil Belajar — IlmoraX" },
      { property: "og:description", content: "Kelola profil belajarmu, pantau level dan XP, lihat koleksi lencana. Progress belajar farmasi dalam satu tempat." },
    ],
  }),
  component: ProfileComponent,
});

const profileAccent = "#14b8a6";
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

function ProfileComponent() {
  const { user, setUser, badgeProgress, isPremium, togglePremium } = useApp();
  const navigate = useNavigate();
  const levelInfo = getLevelForXp(user.xp);
  const nextLevel = getNextLevel(user.xp);
  const xpProgress = getXpProgress(user.xp);
  const grade = getLevelGrade(user);
  const unlockedBadges = badgeProgress.filter((progress) => progress.unlocked);
  const unlockedBadgeIds = new Set(unlockedBadges.map((progress) => progress.badgeId));
  const unlockedBadgeList = badges.filter((badge) => unlockedBadgeIds.has(badge.id));
  const highestLevelBadge = unlockedBadgeList
    .filter((badge) => badge.category === "Level" && badge.id >= 4 && badge.id <= 11)
    .sort((a, b) => b.id - a.id)[0];
  const activeBonus = highestLevelBadge ? getBonusByBadge(highestLevelBadge.id) : 0;

  return (
    <main
      className="app-shell overflow-x-hidden"
      style={{
        background:
          "linear-gradient(180deg, #eef8f6 0%, #f6fbfa 44%, #f7f3ea 100%)",
      }}
    >
      <div
        className="relative overflow-hidden pb-8"
        style={{
          background:
            "radial-gradient(900px 340px at 8% -18%, #14b8a638, transparent 62%), radial-gradient(720px 340px at 94% -12%, #0ea5e91a, transparent 68%), linear-gradient(180deg, #eef8f6 0%, #fbfaf7 100%)",
        }}
      >
        <TopBar />

        <div className="px-5 pt-7">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Profil Belajar
          </div>
          <h1 className="mt-2 max-w-[22ch] text-[28px] font-bold leading-tight tracking-tight text-stone-800">
            Kelola identitas dan progresmu
          </h1>
          <p className="m-0 mt-3 max-w-[34ch] text-[14px] font-medium leading-relaxed text-stone-500">
            Pantau level, lencana, bonus EXP, dan data akun yang terhubung ke simulasi UKAI.
          </p>

          <ProfileHero
            avatar={user.avatar}
            name={user.name}
            institution={user.institution}
            isPremium={isPremium}
            level={levelInfo.level}
            grade={grade}
            xp={user.xp}
            nextXp={nextLevel?.xp}
            xpProgress={xpProgress}
          />
        </div>
      </div>

      <div className="relative -mt-4 px-5 pb-28">
        <AvatarPicker
          selectedAvatar={user.avatar}
          onSelect={(avatar) => {
            setUser((currentUser) => ({ ...currentUser, avatar }));
          }}
        />

        {activeBonus > 0 && highestLevelBadge && (
          <BonusCallout bonus={activeBonus} badgeName={highestLevelBadge.name} />
        )}

        <div className="mt-5 grid grid-cols-3 gap-3 grid-flow-dense">
          <StatCard label="Soal" value={String(user.totalQuestions)} accent="#14b8a6" icon={<DocumentIcon />} />
          <StatCard label="Try-out" value={String(user.totalTryouts)} accent="#0ea5e9" icon={<ChartIcon />} />
          <StatCard label="Streak" value={`${user.streak}`} accent="#f59e0b" icon={<FlameIcon />} />
        </div>

        <div className="mt-6">
          <SectionHeader title={`Lencana ${unlockedBadgeList.length}/${badges.length}`} action="Lihat semua" to="/badges" />
          {unlockedBadgeList.length === 0 ? (
            <EmptyBadges />
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {unlockedBadgeList.slice(0, 8).map((badge) => (
                <BadgePreview key={badge.id} name={badge.name} icon={badge.icon} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <SectionHeader title="Akun" />
          <div className="overflow-hidden rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white shadow-sm">
            <AccountRow label="Email" value={user.email} />
            <AccountRow label="Institusi" value={user.institution} />
            <AccountRow label="Kode Referral" value={user.referralCode} copyable />
            <AccountRow
              label="Bergabung"
              value={new Date(user.joinDate).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
          </div>
        </div>

        {!isPremium && <PremiumProfileCallout />}

        <div className="mt-5 flex gap-3">
          <button className="btn btn-white flex-1 text-xs" onClick={togglePremium} type="button">
            {isPremium ? "Demo Premium ON" : "Demo Premium OFF"}
          </button>
          <button className="btn btn-white flex-1 text-xs" onClick={() => navigate({ to: "/auth/login" })} type="button">
            Keluar
          </button>
        </div>
      </div>

      <BottomNav active="learn" />
    </main>
  );
}

function ProfileHero({
  avatar,
  name,
  institution,
  isPremium,
  level,
  grade,
  xp,
  nextXp,
  xpProgress,
}: {
  avatar: string;
  name: string;
  institution: string;
  isPremium: boolean;
  level: number;
  grade: string;
  xp: number;
  nextXp?: number;
  xpProgress: number;
}) {
  const remainingXp = nextXp ? Math.max(nextXp - xp, 0) : 0;

  return (
    <div
      className="mt-6 rounded-[var(--radius-xl)] border-2 border-b-4 p-5 shadow-sm"
      style={{
        background:
          "linear-gradient(135deg, rgba(235,250,247,0.98) 0%, rgba(255,252,245,0.98) 100%)",
        borderColor: "#cfe7df",
        borderBottomColor: "#a9d1c6",
      }}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[linear-gradient(135deg,#fff7ed_0%,#ccfbf1_100%)] text-[44px] font-black tracking-wide text-stone-800 shadow-sm">
          {avatar}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold tracking-tight text-stone-800">{name}</h2>
          <p className="m-0 mt-1 truncate text-sm font-semibold text-stone-500">{institution}</p>
          {isPremium && <StatusPill label="Premium" accent="#f59e0b" />}
        </div>
      </div>

      <div className="mt-4 rounded-[var(--radius-lg)] border-2 border-teal-100 bg-white/76 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
              Level {level}
            </div>
            <div className="mt-1 text-[14px] font-bold leading-snug text-stone-800">{grade}</div>
          </div>
          <div className="text-right">
            <div className="rounded-full border-2 border-teal-200 bg-teal-50 px-2.5 py-1 text-[12px] font-bold text-primary-dark">
              {xpProgress}%
            </div>
            {nextXp && (
              <div className="mt-1 text-[11px] font-semibold text-stone-400">
                {remainingXp.toLocaleString()} XP lagi
              </div>
            )}
          </div>
        </div>

        {nextXp && (
          <>
            <div className="mt-3 rounded-full border-2 border-teal-100 bg-teal-50/80 p-1 shadow-[inset_0_1px_2px_rgba(15,118,110,0.12)]">
              <div className="h-4 overflow-hidden rounded-full bg-white/90">
                <div
                  className="relative h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${xpProgress}%`,
                    minWidth: xpProgress > 0 ? "28px" : "0",
                    background: "linear-gradient(90deg, #14b8a6 0%, #0d9488 100%)",
                  }}
                >
                  <div className="absolute inset-x-1 top-1 h-0.75 rounded-full bg-white/30" />
                </div>
              </div>
            </div>
            <div className="mt-2 flex justify-between text-[11px] font-semibold text-stone-500">
              <span>{xp.toLocaleString()} XP</span>
              <span>{nextXp.toLocaleString()} XP</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AvatarPicker({ selectedAvatar, onSelect }: { selectedAvatar: string; onSelect: (avatar: string) => void }) {
  return (
    <div className="rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white p-5 shadow-sm">
      <SectionHeader title="Foto Profil" />
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
                color: isSelected ? "#0f766e" : "#57534e",
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

function BonusCallout({ bonus, badgeName }: { bonus: number; badgeName: string }) {
  return (
    <div className="mt-4 rounded-[var(--radius-lg)] border-2 border-amber-200 border-b-4 border-b-amber-500 bg-amber-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <IconTile icon={<BoltIcon />} accent="#f59e0b" />
        <div className="min-w-0 flex-1">
          <b className="block text-sm font-bold text-amber-900">+{bonus}% EXP Permanent Bonus</b>
          <span className="mt-1 block text-xs font-semibold text-amber-700">Dari {badgeName}</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, icon }: { label: string; value: string; accent: string; icon: React.ReactNode }) {
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

function EmptyBadges() {
  return (
    <div className="rounded-[var(--radius-lg)] border-2 border-stone-100 border-b-4 border-b-stone-200 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-teal-100 bg-teal-50 text-primary">
        <BadgeIcon />
      </div>
      <p className="mx-auto mt-3 max-w-[28ch] text-sm font-semibold leading-relaxed text-stone-500">
        Belum ada lencana. Selesaikan tryout pertama untuk membuka koleksi awal.
      </p>
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

function AccountRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-100 px-4 py-3.5 last:border-b-0">
      <span className="text-xs font-bold uppercase tracking-wide text-stone-400">{label}</span>
      <span className="flex min-w-0 items-center gap-2 text-right text-sm font-bold text-stone-700">
        <span className="truncate">{value}</span>
        {copyable && (
          <button
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-stone-100 bg-stone-50 text-stone-400 transition-colors hover:text-primary"
            onClick={() => navigator.clipboard?.writeText(value)}
            title="Salin"
            type="button"
          >
            <CopyIcon />
          </button>
        )}
      </span>
    </div>
  );
}

function PremiumProfileCallout() {
  return (
    <Link
      to="/premium"
      className="mt-5 block rounded-[var(--radius-xl)] border-2 border-amber-300 border-b-4 border-b-amber-600 bg-[#2f281c] p-5 text-amber-50 no-underline shadow-sm"
    >
      <div className="flex items-start gap-3">
        <IconTile icon={<CrownIcon />} accent="#f5b544" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/75">
            Premium
          </div>
          <b className="mt-1 block text-base font-bold leading-tight text-amber-50">Upgrade akses belajar</b>
          <span className="mt-1 block text-xs font-semibold leading-relaxed text-amber-100/72">
            Buka semua fitur dan pembahasan premium.
          </span>
        </div>
        <span className="text-amber-100">
          <ArrowRightIcon />
        </span>
      </div>
    </Link>
  );
}

function SectionHeader({ title, action, to }: { title: string; action?: string; to?: "/badges" }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-[13px] font-semibold uppercase tracking-wide text-stone-500">{title}</span>
      <div className="h-px flex-1 bg-stone-200" />
      {action && to && (
        <Link to={to} className="text-[12px] font-bold text-primary no-underline">
          {action}
        </Link>
      )}
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

function getBonusByBadge(badgeId: number) {
  const bonusByBadge: Record<number, number> = { 4: 5, 5: 8, 6: 12, 7: 15, 8: 18, 9: 22, 10: 26, 11: 30 };
  return bonusByBadge[badgeId] ?? 0;
}

function IconTile({ icon, accent = profileAccent }: { icon: React.ReactNode; accent?: string }) {
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] border-2"
      style={{
        color: accent,
        background: `${accent}18`,
        borderColor: `${accent}33`,
      }}
    >
      {icon}
    </div>
  );
}

function SmallIconTile({ icon, accent }: { icon: React.ReactNode; accent: string }) {
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-xl border-2"
      style={{
        color: accent,
        background: `${accent}18`,
        borderColor: `${accent}30`,
      }}
    >
      {icon}
    </div>
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
      <path d="M5 19V5M5 19h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 16v-5M13 16V8M17 16v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="m13 2-8 12h6l-1 8 9-13h-6l1-7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="m4 8 4.2 3.4L12 5l3.8 6.4L20 8l-1.8 10H5.8L4 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6.5 21h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M8 8h10v12H8V8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
