import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BottomNav, TopBar } from "../components/Navigation";
import { PremiumDialog } from "../components/PremiumDialog";
import { tryouts } from "../data/state";

export const Route = createFileRoute("/tryout")({
  component: TryoutComponent,
});

function TryoutComponent() {
  const [showPremium, setShowPremium] = useState(false);
  const navigate = useNavigate();

  const handleTryoutClick = (id: number, locked: boolean) => {
    if (locked) {
      setShowPremium(true);
    } else {
      navigate({ to: "/test/$id", params: { id: String(id) } });
    }
  };

  return (
    <>
      <div className="app-shell">
        <TopBar />
        <div className="section-head">
          <h2>Tryout UKAI</h2>
          <p>Pilih modul, kumpulkan bintang!</p>
        </div>
        <div className="tryout-grid">
          {tryouts.map((t) => (
            <button
              key={t.id}
              className={`skill-btn ${t.locked ? "locked" : ""}`}
              onClick={() => handleTryoutClick(t.id, t.locked)}
              style={{ "--c": t.color } as React.CSSProperties}
            >
              <div className="skill-icon" style={{ background: t.color }}>
                {t.locked ? "🔒" : t.icon}
              </div>
              <div className="skill-title">{t.title}</div>
              <div className="skill-stars">
                {t.locked ? (
                  <>
                    {"☆".repeat(3)}
                  </>
                ) : (
                  <>
                    {"⭐".repeat(t.stars)}
                    {"☆".repeat(3 - t.stars)}
                  </>
                )}
              </div>
              {t.quota && !t.locked ? <div className="quota-badge">{t.quota} kuota</div> : null}
            </button>
          ))}
        </div>
        <BottomNav active="tryout" />
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
