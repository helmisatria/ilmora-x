import { Link } from "@tanstack/react-router";
import { state } from "../data/state";

export function TopBar() {
  return (
    <div className="top-bar">
      <div className="tb-item hearts">❤️ {state.hearts}</div>
      <div className="tb-item streak">🔥 {state.streak}</div>
      <div className="tb-item gems">💎 {state.gems}</div>
      <div className="tb-item xp">⚡ {state.xp}</div>
    </div>
  );
}

interface BottomNavProps {
  active: "learn" | "tryout" | "rank" | "badge";
}

export function BottomNav({ active }: BottomNavProps) {
  const items = [
    { k: "learn", label: "Learn", icon: "🏠", to: "/dashboard" },
    { k: "tryout", label: "Tryout", icon: "📚", to: "/tryout" },
    { k: "rank", label: "Rank", icon: "🏆", to: "/leaderboard" },
    { k: "badge", label: "Badge", icon: "🎖️", to: "/badges" },
  ] as const;

  return (
    <nav className="bottom-nav" style={{
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: "480px",
      background: "#fff",
      borderTop: "2px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-around",
      padding: "8px 0 16px",
      zIndex: 30,
      boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
    }}>
      {items.map((i) => {
        const isActive = active === i.k;
        return (
          <Link
            key={i.k}
            to={i.to}
            style={{
              background: isActive ? "#e9f7ff" : "none",
              border: "none",
              padding: "8px 16px",
              borderRadius: "14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              fontWeight: 800,
              fontSize: "11px",
              color: isActive ? "#0d9488" : "#94a3b8",
              minWidth: "64px",
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ fontSize: "22px", lineHeight: 1 }}>{i.icon}</span>
            <span>{i.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
