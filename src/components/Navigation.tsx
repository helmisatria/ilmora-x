import { Link } from "@tanstack/react-router";
import { useApp } from "../data";
import { AvatarDisplay } from "./AvatarDisplay";

export function TopBar() {
  const { user } = useApp();
  const { level, xp, streak } = user;
  const initials = getInitials(user.name);
  const avatar = user.avatar || initials;

  return (
    <div
      className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b-2 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8"
      style={{
        background:
          "linear-gradient(90deg, rgba(255,250,240,0.92) 0%, rgba(238,248,246,0.92) 58%, rgba(255,255,255,0.88) 100%)",
        borderColor: "#d9ebe6",
      }}
    >
      <Link
        to="/profile"
        className="flex items-center gap-2.5 shrink-0 no-underline"
        title="Profil"
      >
        <span className="w-10 h-10 rounded-full flex items-center justify-center text-[21px] font-black tracking-wide shadow-sm border-2 border-amber-200 text-stone-800 bg-[linear-gradient(135deg,#fff7ed_0%,#dcecf7_100%)] overflow-hidden hover:border-primary-light transition-colors">
          <AvatarDisplay avatar={avatar} photoUrl={user.googlePhotoUrl} className="w-full h-full" />
        </span>
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-bold text-stone-800 truncate max-w-[120px]">
            {user.name}
          </span>
          <span className="text-[11px] font-extrabold text-[var(--brand-primary-darker)] mt-0.5">
            Lv.{level}
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-2 flex-1 justify-center">
        <TopBarPill icon={<FlameIcon />} value={String(streak)} color="amber" />
        <TopBarPill icon={<BoltIcon />} value={xp.toLocaleString()} color="green" />
        <TopBarPill icon={<ShieldIcon />} value={`Lv.${level}`} color="teal" />
      </div>
    </div>
  );
}

interface BottomNavProps {
  active: "learn" | "tryout" | "rank" | "badge";
}

export function BottomNav({ active }: BottomNavProps) {
  const items = [
    { k: "learn", label: "Belajar", icon: <HomeIcon />, to: "/dashboard" as const, accent: "var(--brand-primary)", bg: "var(--brand-primary-soft)" },
    { k: "tryout", label: "Tryout", icon: <BookIcon />, to: "/tryout" as const, accent: "#0ea5e9", bg: "#e0f2fe" },
    { k: "rank", label: "Peringkat", icon: <TrophyIcon />, to: "/leaderboard" as const, accent: "#f59e0b", bg: "#fef3c7" },
    { k: "badge", label: "Lencana", icon: <BadgeIcon />, to: "/badges" as const, accent: "#fb7185", bg: "#ffe4e6" },
  ] as const;

  return (
    <nav
      className="fixed bottom-3 left-1/2 z-30 flex w-[calc(100%-24px)] max-w-[440px] -translate-x-1/2 justify-around rounded-[var(--radius-xl)] border-2 border-b-4 px-1.5 py-2 shadow-xl md:max-w-[620px] md:justify-center md:gap-2"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(239,250,247,0.95) 52%, rgba(255,248,235,0.95) 100%)",
        borderColor: "#d9ebe6",
        borderBottomColor: "#c7d8d3",
      }}
    >
      {items.map((item) => {
        const isActive = active === item.k;

        return (
          <Link
            key={item.k}
            to={item.to}
            className={`bottom-nav-a ${isActive ? "active" : ""}`}
            style={{
              color: isActive ? item.accent : undefined,
              background: isActive ? item.bg : undefined,
            }}
          >
            <span
              className="transition-transform duration-200 rounded-xl border-2 w-8 h-8 flex items-center justify-center"
              style={{
                color: item.accent,
                background: isActive ? "#ffffff" : `${item.bg}88`,
                borderColor: isActive ? `${item.accent}44` : "rgba(255,255,255,0.78)",
              }}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function TopBarPill({
  icon,
  value,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  color: "amber" | "green" | "teal";
}) {
  const styles = {
    amber: {
      background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)",
      borderColor: "#fde68a",
      color: "#b45309",
    },
    green: {
      background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
      borderColor: "#bbf7d0",
      color: "#15803d",
    },
    teal: {
      background: "linear-gradient(135deg, var(--brand-primary-tint) 0%, var(--brand-primary-soft) 100%)",
      borderColor: "var(--brand-sky)",
      color: "var(--brand-primary-darker)",
    },
  };

  return (
    <div
      className="flex items-center gap-1.5 font-extrabold text-[12px] px-3 py-2 rounded-full border-2 shadow-sm"
      style={styles[color]}
    >
      {icon}
      {value}
    </div>
  );
}

function getInitials(name: string) {
  const cleanName = name.trim();

  if (!cleanName) return "IX";

  const parts = cleanName.split(/\s+/);

  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return cleanName.slice(0, 2).toUpperCase();
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" aria-hidden="true">
      <path d="m4 10 8-6 8 6v10H5.8A1.8 1.8 0 0 1 4 18.2V10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" aria-hidden="true">
      <path d="M5 4.8A2.8 2.8 0 0 1 7.8 2H19v17H7.8A2.8 2.8 0 0 0 5 21.8v-17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 18.2A2.8 2.8 0 0 1 7.8 15H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" aria-hidden="true">
      <path d="M8 4h8v3a4 4 0 0 1-8 0V4ZM12 11v4M9 20h6M10 15h4v5h-4v-5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6H4v1.5A3.5 3.5 0 0 0 7.5 11H9M16 6h4v1.5a3.5 3.5 0 0 1-3.5 3.5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" aria-hidden="true">
      <path d="M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" stroke="currentColor" strokeWidth="2" />
      <path d="m8.8 13-1.3 7 4.5-2.4 4.5 2.4-1.3-7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" aria-hidden="true">
      <path d="M12 22c4.1 0 7-2.8 7-6.8 0-3.5-2-5.8-4.4-7.7-.7 2-1.8 3.1-3.3 3.8.3-2.9-1.1-5.2-3.7-7.3C7.4 7.4 5 10.2 5 15.2 5 19.2 7.9 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" aria-hidden="true">
      <path d="m13 2-8 12h6l-1 8 9-13h-6l1-7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" aria-hidden="true">
      <path d="M12 3 19 6v5.2c0 4.4-2.8 8.3-7 9.8-4.2-1.5-7-5.4-7-9.8V6l7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
