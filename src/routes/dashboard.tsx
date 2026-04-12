import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BottomNav, TopBar } from "../components/Navigation";
import { PremiumDialog } from "../components/PremiumDialog";
import { modules, state } from "../data/state";

export const Route = createFileRoute("/dashboard")({
  component: DashboardComponent,
});

function DashboardComponent() {
  const [showPremium, setShowPremium] = useState(false);
  const navigate = useNavigate();

  const handleModuleClick = (m: typeof modules[0]) => {
    if (m.lock) {
      setShowPremium(true);
    } else {
      navigate({ to: "/tryout" });
    }
  };

  return (
    <>
      <div className="app-shell">
        <TopBar />
        <div style={{ padding: "16px" }}>
          <div
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--teal))",
              borderRadius: "20px",
              padding: "20px",
              color: "#fff",
              marginBottom: "18px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", right: "-20px", top: "-20px", fontSize: "120px", opacity: 0.15 }}>
              🧪
            </div>
            <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 900 }}>
              Halo, {state.username}!
            </h2>
            <p style={{ margin: "0 0 14px", opacity: 0.9 }}>Lanjutkan perjalanan apotekermu</p>
            <div
              style={{
                background: "rgba(255,255,255,.2)",
                borderRadius: "12px",
                padding: "10px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "12px", opacity: 0.85 }}>Streak</div>
                <div style={{ fontWeight: 900, fontSize: "18px" }}>🔥 {state.streak} hari</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", opacity: 0.85 }}>XP minggu ini</div>
                <div style={{ fontWeight: 900, fontSize: "18px" }}>+{state.xp % 1000}</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 12px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 900 }}>Modul Pembelajaran</h3>
            <button style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 800, fontSize: "14px" }}>
              Lihat semua ›
            </button>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {modules.map((m) => (
              <button
                key={m.title}
                className="module-card"
                onClick={() => handleModuleClick(m)}
                style={{ "--accent": m.color } as React.CSSProperties}
              >
                <div className="mod-icon" style={{ background: `${m.color}15`, color: m.color }}>
                  {m.lock ? "🔒" : m.icon}
                </div>
                <div className="mod-main">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "6px" }}>
                    <b style={{ fontSize: "16px" }}>{m.title}</b>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: `${m.color}15`,
                        color: m.color,
                      }}
                    >
                      {m.tag}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <div style={{ flex: 1, height: "6px", background: "var(--gray-100)", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        style={{ width: `${m.progress}%`, height: "100%", background: m.color, borderRadius: "3px", transition: ".5s" }}
                      />
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--gray-700)", fontWeight: 700 }}>{m.progress}%</span>
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--gray-700)" }}>
                    {m.done}/{m.total} materi • {Math.round(m.total * 0.8)} soal
                  </div>
                </div>
                <div style={{ color: "var(--gray-400)", fontSize: "20px" }}>›</div>
              </button>
            ))}
          </div>
        </div>
        <BottomNav active="learn" />
      </div>
      <PremiumDialog
        isOpen={showPremium}
        onClose={() => setShowPremium(false)}
        onUpgrade={() => {
          setShowPremium(false);
          alert("Redirect ke pembayaran...");
        }}
      />
    </>
  );
}
