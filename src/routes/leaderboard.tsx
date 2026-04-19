import { createFileRoute } from "@tanstack/react-router";
import { BottomNav, TopBar } from "../components/Navigation";
import { useApp } from "../data";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardComponent,
});

function LeaderboardComponent() {
  const { leaderboardUsers } = useApp();
  const top = leaderboardUsers.slice(0, 3);
  const order = [1, 0, 2];
  const podiumColors = [
    { border: "border-amber", bg: "bg-amber-50", barBg: "bg-amber-50 border-amber border-b-amber-dark" },
    { border: "border-stone-300", bg: "bg-white", barBg: "bg-white border-stone-200 border-b-stone-300" },
    { border: "border-stone-300", bg: "bg-white", barBg: "bg-white border-stone-200 border-b-stone-300" },
  ];

  const medalEmojis = ["🥇", "🥈", "🥉"];

  return (
    <div className="app-shell">
      <TopBar />
      <div className="px-4 pt-5 pb-2">
        <h2 className="text-2xl font-black m-0">Leaderboard</h2>
        <p className="m-0 mt-1 text-stone-400 font-semibold text-sm">Peringkat mingguan berdasarkan XP</p>
      </div>

      <div className="flex gap-2 justify-center px-3.5 py-3.5">
        <button className="px-4 py-2.5 rounded-[var(--radius-md)] font-black text-sm bg-amber text-white border-2 border-amber-dark border-b-4 border-b-[#92400e]">
          🏆 Minggu Ini
        </button>
        <button className="px-4 py-2.5 rounded-[var(--radius-md)] font-black text-sm bg-white text-stone-400 border-2 border-stone-200 border-b-4 border-b-stone-300">
          Semua Waktu
        </button>
      </div>

      <div className="text-center text-xs text-stone-400 font-medium px-4 mb-2">
        Reset setiap Senin 00:00 WIB
      </div>

      <div className="flex items-end justify-center gap-2 px-3.5 py-4">
        {order.map((i) => {
          const u = top[i];
          if (!u) return null;
          const is1st = i === 0;
          return (
            <div key={i} className="flex flex-col items-center w-[110px]">
              <div className="relative mb-2.5">
                {is1st && <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl" style={{ animation: "bounce 1s infinite alternate" }}>👑</span>}
                <div className={`w-[68px] h-[68px] rounded-full bg-white border-[3px] flex items-center justify-center text-[34px] shadow-md ${
                  is1st ? "border-amber border-b-[5px]" : "border-stone-300 border-b-[5px]"
                }`}>
                  {u.a}
                </div>
              </div>
              <div className={`w-full rounded-t-xl text-center py-2 font-black leading-tight border-2 ${
                is1st ? "h-[100px] bg-amber-50 border-amber border-b-4 text-[15px]" : "h-[82px] bg-white border-stone-200 border-b-4 text-[14px]"
              }`}>
                <b>{u.n}</b>
                <br />
                <span className="text-xs text-stone-400">{u.xp.toLocaleString()} XP</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-3.5 pb-20 flex flex-col gap-2">
        {leaderboardUsers.map((u) => (
          <div key={u.r} className={`flex items-center gap-3 bg-white px-3.5 py-3 rounded-[var(--radius-lg)] border-2 border-stone-200 border-b-4 border-b-stone-300 transition-transform hover:translate-x-1 ${
            u.me ? "!border-primary !bg-teal-50 !border-b-primary-dark" : ""
          }`}>
            <span className="w-7 text-center font-black text-stone-400 text-sm">{u.r}</span>
            <div className="w-11 h-11 rounded-full bg-stone-100 flex items-center justify-center text-[22px] border-2 border-white shadow-sm">
              {u.a}
            </div>
            <div className="flex-1">
              <b className="text-[15px] font-extrabold block">{u.n}{u.me ? " (Kamu)" : ""}</b>
              <span className="text-xs text-stone-400 font-semibold">Lv.{u.level} • {u.xp.toLocaleString()} XP minggu ini</span>
            </div>
            <span className={`font-black text-sm ${u.ch === "up" ? "text-success" : "text-coral"}`}>
              {u.ch === "up" ? "▲" : "▼"}
            </span>
          </div>
        ))}
      </div>

      <BottomNav active="rank" />
    </div>
  );
}