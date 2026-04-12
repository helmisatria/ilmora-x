import { createFileRoute } from "@tanstack/react-router";
import { BottomNav, TopBar } from "../components/Navigation";
import { leaderboardUsers } from "../data/state";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardComponent,
});

function LeaderboardComponent() {
  const top = leaderboardUsers.slice(0, 3);
  const order = [1, 0, 2]; // Reorder to show 2nd, 1st, 3rd

  return (
    <div className="app-shell">
      <TopBar />
      <div className="section-head">
        <h2>Liga Perunggu</h2>
        <p>Top 10 naik ke Perak minggu ini</p>
      </div>
      <div className="league-tabs">
        <button className="active">🥉 Perunggu</button>
        <button>🥈 Perak</button>
        <button>🥇 Emas</button>
      </div>
      <div className="podium">
        {order.map((i) => {
          const u = top[i];
          const cls = i === 0 ? "podium-1" : i === 1 ? "podium-2" : "podium-3";
          return (
            <div key={i} className={`podium-place ${cls}`}>
              <div className="podium-avatar">
                {i === 0 && <span className="crown">👑</span>}
                {u.a}
              </div>
              <div className="podium-bar">
                <b>{u.n}</b>
                <br />
                <span style={{ fontSize: "12px", color: "#777" }}>{u.xp} XP</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="leader-list">
        {leaderboardUsers.map((u) => (
          <div key={u.r} className={`leader-row ${u.me ? "me" : ""}`}>
            <span className="rank">{u.r}</span>
            <div className="avatar">{u.a}</div>
            <div className="info">
              <b>
                {u.n}
                {u.me ? " (Kamu)" : ""}
              </b>
              <span>{u.xp} XP</span>
            </div>
            <div className={`change ${u.ch}`}>{u.ch === "up" ? "▲" : "▼"}</div>
          </div>
        ))}
      </div>
      <BottomNav active="rank" />
    </div>
  );
}
