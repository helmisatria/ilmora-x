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
          {/* Welcome Card - solid color instead of gradient */}
          <div
            style={{
              background: "var(--primary)",
              borderRadius: "var(--radius-xl)",
              padding: "24px",
              color: "#fff",
              marginBottom: "20px",
              position: "relative",
              overflow: "hidden",
              borderBottom: "5px solid var(--primary-darker)",
            }}
          >
            <div style={{ 
              position: "absolute", 
              right: "-10px", 
              top: "-10px", 
              fontSize: "100px", 
              opacity: 0.1,
              transform: "rotate(15deg)"
            }}>
              🧪
            </div>
            <h2 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: 900 }}>
              Halo, {state.username}! 👋
            </h2>
            <p style={{ margin: "0 0 16px", opacity: 0.9, fontWeight: 500 }}>
              Lanjutkan perjalanan apotekermu
            </p>
            <div
              style={{
                background: "rgba(255,255,255,0.2)",
                borderRadius: "var(--radius-lg)",
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backdropFilter: "blur(4px)",
              }}
            >
              <div>
                <div style={{ fontSize: "12px", opacity: 0.85, fontWeight: 600 }}>Streak</div>
                <div style={{ fontWeight: 900, fontSize: "20px" }}>🔥 {state.streak} hari</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", opacity: 0.85, fontWeight: 600 }}>XP minggu ini</div>
                <div style={{ fontWeight: 900, fontSize: "20px" }}>+{state.xp % 1000}</div>
              </div>
            </div>
          </div>

          {/* Section Header */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            margin: "0 0 16px" 
          }}>
            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 900 }}>📚 Modul Pembelajaran</h3>
            <button 
              className="btn btn-sm"
              style={{ 
                background: "transparent", 
                border: "none",
                color: "var(--primary)",
                padding: "8px 12px"
              }}
            >
              Lihat semua ›
            </button>
          </div>

          {/* Module Cards */}
          <div style={{ display: "grid", gap: "14px" }}>
            {modules.map((m) => (
              <button
                key={m.title}
                className="module-card"
                onClick={() => handleModuleClick(m)}
              >
                <div 
                  className="mod-icon" 
                  style={{ 
                    background: m.lock ? "var(--gray-100)" : `${m.color}20`, 
                    color: m.lock ? "var(--gray-400)" : m.color,
                    borderColor: m.lock ? "var(--gray-200)" : `${m.color}40`
                  }}
                >
                  {m.lock ? "🔒" : m.icon}
                </div>
                <div className="mod-main">
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "start", 
                    marginBottom: "8px" 
                  }}>
                    <b style={{ fontSize: "16px", fontWeight: 800 }}>{m.title}</b>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 900,
                        padding: "4px 10px",
                        borderRadius: "var(--radius-full)",
                        background: m.lock ? "var(--gray-100)" : `${m.color}15`,
                        color: m.lock ? "var(--gray-500)" : m.color,
                        textTransform: "uppercase",
                        letterSpacing: "0.3px"
                      }}
                    >
                      {m.tag}
                    </span>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px", 
                    marginBottom: "8px" 
                  }}>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{ 
                          width: `${m.progress}%`,
                          background: m.color
                        }} 
                      />
                    </div>
                    <span style={{ fontSize: "13px", color: "var(--text)", fontWeight: 800, minWidth: "36px" }}>
                      {m.progress}%
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>
                    {m.done}/{m.total} materi selesai
                  </div>
                </div>
                <div style={{ color: "var(--gray-400)", fontSize: "24px", fontWeight: 300 }}>›</div>
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
