import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { state } from "../data/state";
import { runConfetti } from "../utils/confetti";
import { PremiumDialog } from "../components/PremiumDialog";

export const Route = createFileRoute("/results")({
  component: ResultsComponent,
});

// Sample wrong answers with complete question data for demo
const sampleWrongs = state.lastResults?.wrongs.length ? state.lastResults.wrongs : [
  {
    id: 1,
    subject: "FARMAKOLOGI",
    question: "Pilih obat golongan ACE Inhibitor yang tepat:",
    options: ["Amlodipin", "Captopril", "Propranolol", "Furosemid"],
    correct: 1,
    explanation: "Captopril adalah ACE Inhibitor yang menghambat konversi Angiotensin I menjadi II, menurunkan tekanan darah. Obat ini bekerja dengan menghambat enzim ACE (Angiotensin Converting Enzyme) sehingga mengurangi pembentukan angiotensin II, sebuah zat yang menyebabkan pembuluh darah menyempit. Dengan berkurangnya angiotensin II, pembuluh darah akan melebar dan tekanan darah menurun.",
    videoUrl: "https://www.youtube.com/embed/6R4DtneE5IY",
    isPremium: false,
    user: "Amlodipin",
  },
  {
    id: 2,
    subject: "FARMAKOLOGI",
    question: "Dosis loading digoxin untuk dewasa adalah:",
    options: ["0.25-0.5 mg", "0.75-1.5 mg", "2-3 mg", "5 mg"],
    correct: 1,
    explanation: "Dosis loading digoxin 0.75-1.5 mg dibagi dalam 3 dosis selama 24 jam pertama, kemudian maintenance 0.125-0.25 mg/hari. Digoxin adalah glikosida jantung yang meningkatkan kontraktilitas miokard dan memperlambat konduksi AV.",
    videoUrl: "https://www.youtube.com/embed/vK1n2sN2lQc",
    isPremium: true,
    user: "0.25-0.5 mg",
  },
  {
    id: 5,
    subject: "KEHAMILAN",
    question: "Obat hipertensi kontraindikasi pada kehamilan:",
    options: ["Metildopa", "Nifedipin", "ACE Inhibitor", "Labetalol"],
    correct: 2,
    explanation: "ACE Inhibitor dan ARB bersifat teratogenik dan sangat kontraindikasi pada kehamilan. Obat ini dapat menyebabkan gangguan ginjal janin, oligohidramnios, hipoplasia tengkorak, dan kematian janin.",
    videoUrl: "https://www.youtube.com/embed/2k3Ih_-8yHc",
    isPremium: true,
    user: "Metildopa",
  },
];

function ResultsComponent() {
  const r = state.lastResults || { score: 80, correct: 4, total: 5, xpEarn: 130, wrongs: [] };
  const dash = 339;
  const off = dash - (dash * r.score) / 100;
  
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [selectedPremiumItem, setSelectedPremiumItem] = useState<string>("");

  const wrongs = sampleWrongs;

  useEffect(() => {
    const timer = setTimeout(runConfetti, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleItemClick = (item: typeof wrongs[0], index: number) => {
    if (item.isPremium) {
      setSelectedPremiumItem(item.question);
      setShowPremiumDialog(true);
      return;
    }
    setExpandedItem(expandedItem === index ? null : index);
  };

  const handleUpgrade = () => {
    setShowPremiumDialog(false);
    // In a real app, this would navigate to payment or upgrade flow
    alert("Mengarahkan ke halaman upgrade...");
  };

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
        
        {/* Enhanced Pembahasan Section */}
        <div className="review">
          <div className="review-header">
            <h3>📚 Pembahasan Soal</h3>
            <span className="review-count">{wrongs.length} soal untuk direview</span>
          </div>
          
          <div className="review-list">
            {wrongs.length ? (
              wrongs.map((w, i) => (
                <div 
                  key={i} 
                  className={`review-card ${w.isPremium ? 'premium' : ''} ${expandedItem === i ? 'expanded' : ''}`}
                >
                  {/* Card Header - Always Visible */}
                  <button 
                    className="review-card-header"
                    onClick={() => handleItemClick(w, i)}
                  >
                    <div className="review-card-left">
                      <div className="review-number">{i + 1}</div>
                      <div className="review-info">
                        <span className="review-subject">{w.subject}</span>
                        <p className="review-question">{w.question}</p>
                        <div className="review-answer-row">
                          <span className="wrong-answer">❌ {w.user}</span>
                          <span className="correct-answer">✓ {w.options[w.correct]}</span>
                        </div>
                      </div>
                    </div>
                    <div className="review-card-right">
                      {w.isPremium ? (
                        <div className="premium-badge">
                          <span className="premium-icon">🔒</span>
                          <span className="premium-text">Premium</span>
                        </div>
                      ) : (
                        <span className="expand-icon">{expandedItem === i ? '▼' : '▶'}</span>
                      )}
                    </div>
                  </button>

                  {/* Expanded Content - Free Items Only */}
                  {!w.isPremium && expandedItem === i && (
                    <div className="review-card-content">
                      <div className="explanation-section">
                        <h4>📝 Penjelasan Lengkap</h4>
                        <p>{w.explanation}</p>
                      </div>
                      
                      {w.videoUrl && (
                        <div className="video-section">
                          <h4>🎥 Video Pembelajaran</h4>
                          <div className="video-wrapper">
                            <iframe
                              src={w.videoUrl}
                              title={`Video pembahasan soal ${i + 1}`}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                          <p className="video-hint">
                            💡 Tonton video ini untuk memahami konsep lebih dalam
                          </p>
                        </div>
                      )}
                      
                      <div className="learning-actions">
                        <button className="btn-note" onClick={() => alert("Catatan disimpan!")}>
                          📝 Catat
                        </button>
                        <button className="btn-share" onClick={() => alert("Link dibagikan!")}>
                          📤 Bagikan
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Premium Overlay Preview */}
                  {w.isPremium && (
                    <div className="premium-preview">
                      <div className="premium-blur">
                        <p>🔒 Penjelasan lengkap dan video pembelajaran tersedia untuk member Premium</p>
                        <ul className="premium-features">
                          <li>📹 Video pembelajaran lengkap</li>
                          <li>📝 Pembahasan detail dengan ilustrasi</li>
                          <li>💡 Tips & trik menyelesaikan soal serupa</li>
                          <li>📚 Akses ke 500+ soal premium</li>
                        </ul>
                      </div>
                      <button 
                        className="btn btn-primary unlock-btn"
                        onClick={() => handleItemClick(w, i)}
                      >
                        🔓 Buka Pembahasan
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="review-item perfect" style={{ borderLeftColor: "var(--primary)" }}>
                <div className="perfect-emoji">🌟</div>
                <div>
                  <b>Sempurna!</b>
                  <p>Tidak ada jawaban yang salah. Pertahankan prestasimu! 🎉</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Premium Dialog */}
      <PremiumDialog
        isOpen={showPremiumDialog}
        onClose={() => setShowPremiumDialog(false)}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}
