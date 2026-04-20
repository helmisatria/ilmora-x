import { Link } from "@tanstack/react-router";
import { useApp } from "../data";

export function TopBar() {
  const { user } = useApp();
  const { level, xp, streak } = user;
  const initials = getInitials(user.name);

  return (
    <div className="sticky top-0 z-20 bg-white/92 backdrop-blur-xl flex items-center justify-between gap-2 px-4 py-3 border-b-2 border-stone-200">
      <Link
        to="/profile"
        className="w-10 h-10 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center text-[12px] font-black tracking-wide text-teal-700 shadow-sm shrink-0 hover:bg-teal-100 transition-colors no-underline"
        title="Profil"
      >
        {initials}
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
    { k: "learn", label: "Belajar", icon: <HomeIcon />, to: "/dashboard" as const },
    { k: "tryout", label: "Tryout", icon: <BookIcon />, to: "/tryout" as const },
    { k: "rank", label: "Peringkat", icon: <TrophyIcon />, to: "/leaderboard" as const },
    { k: "badge", label: "Lencana", icon: <BadgeIcon />, to: "/badges" as const },
  ] as const;

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[440px] bg-white rounded-[var(--radius-xl)] flex justify-around py-2 px-1.5 z-30 shadow-xl border-2 border-stone-200 border-b-4 border-b-stone-300">
      {items.map((item) => {
        const isActive = active === item.k;

        return (
          <Link
            key={item.k}
            to={item.to}
            className={`bottom-nav-a ${isActive ? "active" : ""}`}
          >
            <span className="transition-transform duration-200">{item.icon}</span>
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
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    green: "bg-green-50 border-green-200 text-green-700",
    teal: "bg-teal-50 border-teal-200 text-teal-700",
  };

  return (
    <div className={`flex items-center gap-1.5 font-extrabold text-[12px] px-3 py-2 rounded-full border-2 shadow-sm ${styles[color]}`}>
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
