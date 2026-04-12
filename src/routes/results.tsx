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
    explanationPreview: "Captopril adalah ACE Inhibitor yang menghambat konversi Angiotensin I menjadi II...",
    videoUrl: "https://www.youtube.com/embed/zaU1okb9vRQ?si=9T6zx_ZGw-qVL_I6",
    isPremium: false,
    user: "Amlodipin",
  },
  {
    id: 2,
    subject: "FARMAKOLOGI",
    question: "Dosis loading digoxin untuk dewasa adalah:",
    options: ["0.25-0.5 mg", "0.75-1.5 mg", "2-3 mg", "5 mg"],
    correct: 1,
    explanation: "Dosis loading digoxin 0.75-1.5 mg dibagi dalam 3 dosis selama 24 jam pertama, kemudian maintenance 0.125-0.25 mg/hari. Digoxin adalah glikosida jantung yang meningkatkan kontraktilitas miokard dan memperlambat konduksi AV. Obat ini memiliki therapeutic window sempit sehingga memerlukan monitoring kadar obat dalam darah.",
    explanationPreview: "Dosis loading digoxin 0.75-1.5 mg dibagi dalam 3 dosis...",
    videoUrl: "https://www.youtube.com/embed/vK1n2sN2lQc",
    isPremium: true,
    user: "0.25-0.5 mg",
  },
  {
    id: 3,
    subject: "KIMIA FARMASI",
    question: "Golongan obat yang termasuk NSAID adalah:",
    options: ["Parasetamol", "Ibuprofen", "Tramadol", "Kodein"],
    correct: 1,
    explanation: "Ibuprofen adalah golongan NSAID (Non-Steroidal Anti-Inflammatory Drug) yang bekerja menghambat enzim siklooksigenase (COX), mengurangi produksi prostaglandin sehingga mengurangi peradangan, nyeri, dan demam. NSAID berbeda dengan analgesik opioid seperti tramadol dan kodein.",
    explanationPreview: "Ibuprofen adalah golongan NSAID yang bekerja menghambat enzim COX...",
    videoUrl: "https://www.youtube.com/embed/sample-nsaid",
    isPremium: true,
    user: "Parasetamol",
  },
  {
    id: 4,
    subject: "FARMASI KLINIS",
    question: "Interaksi obat antara warfarin dan aspirin dapat menyebabkan:",
    options: ["Pendarahan", "Hipertensi", "Takikardia", "Konstipasi"],
    correct: 0,
    explanation: "Interaksi antara warfarin (antikoagulan) dan aspirin (antiplatelet) meningkatkan risiko pendarahan signifikan karena kedua obat ini mempengaruhi hemostasis melalui mekanisme berbeda. Kombinasi ini hanya digunakan dalam kondisi khusus dengan monitoring ketat.",
    explanationPreview: "Interaksi warfarin dan aspirin meningkatkan risiko pendarahan...",
    videoUrl: "https://www.youtube.com/embed/sample-interaksi",
    isPremium: true,
    user: "Hipertensi",
  },
  {
    id: 5,
    subject: "KEHAMILAN",
    question: "Obat hipertensi kontraindikasi pada kehamilan:",
    options: ["Metildopa", "Nifedipin", "ACE Inhibitor", "Labetalol"],
    correct: 2,
    explanation: "ACE Inhibitor dan ARB bersifat teratogenik dan sangat kontraindikasi pada kehamilan. Obat ini dapat menyebabkan gangguan ginjal janin, oligohidramnios, hipoplasia tengkorak, dan kematian janin. Pasien hamil dengan hipertensi harus menggunakan obat alternatif seperti metildopa atau nifedipin.",
    explanationPreview: "ACE Inhibitor bersifat teratogenik dan sangat kontraindikasi...",
    videoUrl: "https://www.youtube.com/embed/2k3Ih_-8yHc",
    isPremium: true,
    user: "Metildopa",
  },
  {
    id: 6,
    subject: "MIKROBIOLOGI",
    question: "Antibiotik pilihan pertama untuk infeksi Streptococcus pyogenes:",
    options: ["Amoxicillin", "Metronidazole", "Ciprofloxacin", "Gentamicin"],
    correct: 0,
    explanation: "Amoxicillin (penisilin) adalah antibiotik pilihan pertama untuk infeksi Streptococcus pyogenes (Streptococcus grup A). Penisilin tetap menjadi emas standar karena sensitivitasnya yang tinggi dan profil keamanan yang baik.",
    explanationPreview: "Amoxicillin adalah antibiotik pilihan pertama untuk Streptococcus pyogenes...",
    videoUrl: "https://www.youtube.com/embed/sample-antibiotik",
    isPremium: false,
    user: "Metronidazole",
  },
];

function ResultsComponent() {
  const r = state.lastResults || { score: 80, correct: 4, total: 5, xpEarn: 130, wrongs: [] };
  const dash = 339;
  const off = dash - (dash * r.score) / 100;
  
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [selectedPremiumItem, setSelectedPremiumItem] = useState<string>("");

  const wrongs = state.lastResults?.wrongs?.length ? state.lastResults.wrongs : sampleWrongs;
  const premiumCount = wrongs.filter(w => w.isPremium).length;
  const hasPremiumContent = premiumCount > 0;

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
        {/* Premium Banner - Show if there are locked pembahasan */}
        {hasPremiumContent && (
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderRadius: 'var(--radius)',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
          }}>
            <span style={{ fontSize: '28px' }}>🔒</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{
                margin: '0',
                fontWeight: 700,
                fontSize: '14px',
                color: '#92400e',
              }}>
                {premiumCount} pembahasan terkunci
              </p>
              <p style={{
                margin: '4px 0 0',
                fontSize: '13px',
                color: '#a16207',
              }}>
                Upgrade untuk akses lengkap dengan video pembelajaran
              </p>
            </div>
            <button
              onClick={() => setShowPremiumDialog(true)}
              style={{
                background: '#92400e',
                color: '#fff',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Unlock
            </button>
          </div>
        )}
        <div className="celebrate">🎉</div>
        <h1>Pelajaran selesai!</h1>
        <div className="score-ring">
          <svg viewBox="0 0 120 120">
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="54" stroke="#e5e5e5" strokeWidth="12" fill="none" />
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="url(#scoreGradient)"
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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {hasPremiumContent && (
                <span className="premium-count" style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--amber-dark)',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                }}>
                  🔒 {premiumCount} Premium
                </span>
              )}
              <span className="review-count">{wrongs.length} soal untuk direview</span>
            </div>
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

                  {/* Preview for Free Items - Before expanding */}
                  {!w.isPremium && expandedItem !== i && (
                    <div style={{
                      padding: '0 18px 18px',
                      marginTop: '-8px',
                    }}>
                      <p style={{
                        fontSize: '14px',
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                        margin: 0,
                        padding: '12px 16px',
                        background: 'var(--gray-50)',
                        borderRadius: 'var(--radius-sm)',
                      }}>
                        💡 {w.explanationPreview} <span style={{ color: 'var(--primary)' }}>Klik untuk baca lengkap</span>
                      </p>
                    </div>
                  )}

                  {/* Premium Overlay Preview */}
                  {w.isPremium && (
                    <div className="premium-preview">
                      {/* Blurred preview text teaser */}
                      <div style={{
                        padding: '0 18px',
                        marginBottom: '16px',
                      }}>
                        <div style={{
                          position: 'relative',
                          padding: '16px',
                          background: 'var(--gray-50)',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                        }}>
                          <p style={{
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: 'var(--text)',
                            margin: 0,
                            filter: 'blur(4px)',
                            opacity: 0.7,
                            userSelect: 'none',
                          }}>
                            {w.explanation}
                          </p>
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(to bottom, transparent, rgba(254, 243, 199, 0.9))',
                          }}>
                            <span style={{
                              fontSize: '32px',
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                            }}>🔒</span>
                          </div>
                        </div>
                      </div>

                      <div className="premium-blur">
                        <p>🔒 Penjelasan lengkap dan video pembelajaran tersedia untuk member Premium</p>
                        <ul className="premium-features">
                          <li>📹 Video pembelajaran lengkap (5-10 menit)</li>
                          <li>📝 Pembahasan detail dengan ilustrasi</li>
                          <li>💡 Tips & trik menyelesaikan soal serupa</li>
                          <li>📚 Akses ke 500+ soal premium</li>
                        </ul>
                      </div>
                      <button
                        className="btn btn-primary unlock-btn"
                        onClick={() => handleItemClick(w, i)}
                      >
                        🔓 Buka Pembahasan - Rp49rb/bulan
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
