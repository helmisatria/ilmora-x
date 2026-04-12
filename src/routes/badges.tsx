import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BottomNav, TopBar } from "../components/Navigation";
import { shopItems, state } from "../data/state";

export const Route = createFileRoute("/badges")({
  component: BadgesComponent,
});

function BadgesComponent() {
  const [activeTab, setActiveTab] = useState<"badges" | "shop">("badges");

  const handleBuy = (cost: number, id: string) => {
    if (state.gems >= cost) {
      state.gems -= cost;
      if (id === "heart") state.hearts = 5;
      alert("Berhasil dibeli!");
    } else {
      alert("Gems kurang!");
    }
  };

  return (
    <div className="app-shell">
      <TopBar />
      <div className="section-head">
        <h2>Lencana & Toko</h2>
        <p>Kumpulkan, pamerkan, belanja power-up</p>
      </div>
      <div className="badge-tabs">
        <button className={activeTab === "badges" ? "active" : ""} onClick={() => setActiveTab("badges")}>
          Pencapaian
        </button>
        <button className={activeTab === "shop" ? "active" : ""} onClick={() => setActiveTab("shop")}>
          Toko
        </button>
      </div>
      {activeTab === "badges" && (
        <div className="badge-grid">
          {state.badges.map((b) => (
            <div key={b.id} className={`badge-item ${b.unlocked ? "" : "locked"}`}>
              <div className="badge-ring" style={{ "--p": b.progress / b.total } as React.CSSProperties}>
                <svg viewBox="0 0 92 92">
                  <circle cx="46" cy="46" r="40" />
                  <circle className="p" cx="46" cy="46" r="40" />
                </svg>
                <div className="badge-icon">{b.icon}</div>
              </div>
              <b>{b.name}</b>
              <span>
                {b.progress}/{b.total}
              </span>
            </div>
          ))}
        </div>
      )}
      {activeTab === "shop" && (
        <div className="shop-grid">
          {shopItems.map((s) => (
            <div key={s.id} className="shop-item">
              <div className="shop-icon">{s.icon}</div>
              <div className="shop-info">
                <b>{s.name}</b>
                <span>{s.desc}</span>
              </div>
              <button className="buy-btn" onClick={() => handleBuy(s.cost, s.id)}>
                💎 {s.cost}
              </button>
            </div>
          ))}
        </div>
      )}
      <BottomNav active="badge" />
    </div>
  );
}
