import { Link } from "@tanstack/react-router";
import { state } from "../data/state";

export function TopBar() {
  return (
    <div className="top-bar">
      <div className="tb-item hearts">
        <span>❤️</span> {state.hearts}
      </div>
      <div className="tb-item streak">
        <span>🔥</span> {state.streak}
      </div>
      <div className="tb-item gems">
        <span>💎</span> {state.gems}
      </div>
      <div className="tb-item xp">
        <span>⚡</span> {state.xp}
      </div>
    </div>
  );
}

interface BottomNavProps {
  active: "learn" | "tryout" | "rank" | "badge";
}

export function BottomNav({ active }: BottomNavProps) {
  const items = [
    { k: "learn", label: "Belajar", icon: "🏠", to: "/dashboard" },
    { k: "tryout", label: "Tryout", icon: "📚", to: "/tryout" },
    { k: "rank", label: "Peringkat", icon: "🏆", to: "/leaderboard" },
    { k: "badge", label: "Lencana", icon: "🎖️", to: "/badges" },
  ] as const;

  return (
    <nav className="bottom-nav">
      {items.map((i) => {
        const isActive = active === i.k;
        return (
          <Link
            key={i.k}
            to={i.to}
            className={isActive ? "active" : ""}
          >
            <span>{i.icon}</span>
            <span>{i.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
