import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { state } from "../data/state";
import { runConfetti } from "../utils/confetti";

export const Route = createFileRoute("/results")({
  component: ResultsComponent,
});

function ResultsComponent() {
  const r = state.lastResults || { score: 80, correct: 4, total: 5, xpEarn: 130, wrongs: [] };
  const dash = 339;
  const off = dash - (dash * r.score) / 100;

  useEffect(() => {
    const timer = setTimeout(runConfetti, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="results-view">
      <canvas id="confetti" />
      <div className="results-content">
        <div className="celebrate">🎉</div>
        <h1>Pelajaran selesai!</h1>
        <div className="score-ring">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" stroke="#e5e5e5" strokeWidth="12" fill="none" />
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="#58cc02"
              strokeWidth="12"
              fill="none"
              strokeDasharray={dash}
              strokeDashoffset={off}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="score-text">
            <b>{r.score}%</b>
            <span>AKURASI</span>
          </div>
        </div>
        <div className="xp-gain">+{r.xpEarn} XP</div>
        <div className="result-stats">
          <div className="r-stat">
            <span>🎯</span>
            <b>
              {r.correct}/{r.total}
            </b>
            <span>Benar</span>
          </div>
          <div className="r-stat">
            <span>⚡</span>
            <b>1:42</b>
            <span>Cepat</span>
          </div>
          <div className="r-stat">
            <span>🔥</span>
            <b>{state.streak}</b>
            <span>Streak</span>
          </div>
        </div>
        <Link to="/dashboard" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
          LANJUTKAN
        </Link>
        <div className="review">
          <details open={r.wrongs.length > 0}>
            <summary>Lihat pembahasan ({r.wrongs.length} salah)</summary>
            <div className="review-list">
              {r.wrongs.length ? (
                r.wrongs.map((w, i) => (
                  <div key={i} className="review-item">
                    <b>{w.question}</b>
                    <br />
                    <span style={{ color: "#777" }}>Jawabanmu: {w.user}</span>
                    <br />
                    <span style={{ color: "var(--primary)", fontWeight: 800 }}>Benar: {w.options[w.correct]}</span>
                  </div>
                ))
              ) : (
                <div className="review-item" style={{ borderLeftColor: "var(--primary)" }}>
                  Sempurna! Tidak ada yang salah 🎉
                </div>
              )}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
