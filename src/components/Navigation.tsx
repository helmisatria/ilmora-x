import { Link } from "@tanstack/react-router";
import { useApp } from "../data";

export function TopBar() {
  const { user } = useApp();
  const { level, xp, streak, avatar } = user;

  return (
    <div className="sticky top-0 z-20 bg-white/92 backdrop-blur-xl flex items-center justify-between gap-2 px-4 py-3 border-b-2 border-stone-200">
      <Link
        to="/profile"
        className="w-10 h-10 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center text-xl shadow-sm shrink-0 hover:bg-teal-100 transition-colors"
        title="Profil"
      >
        {avatar}
      </Link>
      <div className="flex items-center gap-2 flex-1 justify-center">
        <div className="flex items-center gap-1.5 font-extrabold text-[12px] px-3 py-2 rounded-full bg-amber-50 border-2 border-amber-200 text-amber-700 shadow-sm">
          <span>🔥</span> {streak}
        </div>
        <div className="flex items-center gap-1.5 font-extrabold text-[12px] px-3 py-2 rounded-full bg-green-50 border-2 border-green-200 text-green-700 shadow-sm">
          <span>⚡</span> {xp.toLocaleString()}
        </div>
        <div className="flex items-center gap-1.5 font-extrabold text-[12px] px-3 py-2 rounded-full bg-teal-50 border-2 border-teal-200 text-teal-700 shadow-sm">
          <span>🏆</span> Lv.{level}
        </div>
      </div>
    </div>
  );
}

interface BottomNavProps {
  active: "learn" | "tryout" | "rank" | "badge";
}

export function BottomNav({ active }: BottomNavProps) {
  const items = [
    { k: "learn", label: "Belajar", icon: "🏠", to: "/dashboard" as const },
    { k: "tryout", label: "Tryout", icon: "📚", to: "/tryout" as const },
    { k: "rank", label: "Peringkat", icon: "🏆", to: "/leaderboard" as const },
    { k: "badge", label: "Lencana", icon: "🎖️", to: "/badges" as const },
  ] as const;

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[440px] bg-white rounded-[var(--radius-xl)] flex justify-around py-2 px-1.5 z-30 shadow-xl border-2 border-stone-200 border-b-4 border-b-stone-300">
      {items.map((i) => {
        const isActive = active === i.k;
        return (
          <Link
            key={i.k}
            to={i.to}
            className={`bottom-nav-a ${isActive ? "active" : ""}`}
          >
            <span className="text-2xl transition-transform duration-200">{i.icon}</span>
            <span>{i.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}