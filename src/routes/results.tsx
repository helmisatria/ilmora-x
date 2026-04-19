import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "../data";
import { runConfetti } from "../utils/confetti";
import { PremiumDialog } from "../components/PremiumDialog";

export const Route = createFileRoute("/results")({
  component: ResultsComponent,
});

const sampleWrongs = [
  {
    id: 1, subject: "FARMAKOLOGI",
    question: "Pilih obat golongan ACE Inhibitor yang tepat:",
    options: ["Amlodipin", "Captopril", "Propranolol", "Furosemid"],
    correct: 1,
    explanation: "Captopril adalah ACE Inhibitor yang menghambat konversi Angiotensin I menjadi II, menurunkan tekanan darah. Obat ini bekerja dengan menghambat enzim ACE sehingga mengurangi pembentukan angiotensin II.",
    explanationPreview: "Captopril adalah ACE Inhibitor yang menghambat konversi Angiotensin I menjadi II...",
    videoUrl: "https://www.youtube.com/embed/zaU1okb9vRQ?si=9T6zx_ZGw-qVL_I6",
    isPremium: false,
    user: "Amlodipin",
  },
  {
    id: 2, subject: "FARMAKOLOGI",
    question: "Dosis loading digoxin untuk dewasa adalah:",
    options: ["0.25-0.5 mg", "0.75-1.5 mg", "2-3 mg", "5 mg"],
    correct: 1,
    explanation: "Dosis loading digoxin 0.75-1.5 mg dibagi dalam 3 dosis selama 24 jam pertama, kemudian maintenance 0.125-0.25 mg/hari.",
    explanationPreview: "Dosis loading digoxin 0.75-1.5 mg dibagi dalam 3 dosis...",
    videoUrl: "https://www.youtube.com/embed/vK1n2sN2lQc",
    isPremium: true,
    user: "0.25-0.5 mg",
  },
  {
    id: 3, subject: "FARMAKOLOGI",
    question: "Golongan obat yang termasuk NSAID adalah:",
    options: ["Parasetamol", "Ibuprofen", "Tramadol", "Kodein"],
    correct: 1,
    explanation: "Ibuprofen adalah golongan NSAID yang bekerja menghambat enzim COX, mengurangi produksi prostaglandin.",
    explanationPreview: "Ibuprofen adalah golongan NSAID yang bekerja menghambat enzim COX...",
    isPremium: true,
    user: "Parasetamol",
  },
  {
    id: 4, subject: "KLINIS",
    question: "Interaksi obat antara warfarin dan aspirin dapat menyebabkan:",
    options: ["Pendarahan", "Hipertensi", "Takikardia", "Konstipasi"],
    correct: 0,
    explanation: "Interaksi antara warfarin dan aspirin meningkatkan risiko pendarahan signifikan karena kedua obat mempengaruhi hemostasis melalui mekanisme berbeda.",
    explanationPreview: "Interaksi warfarin dan aspirin meningkatkan risiko pendarahan...",
    isPremium: true,
    user: "Hipertensi",
  },
  {
    id: 5, subject: "KEHAMILAN",
    question: "Obat hipertensi kontraindikasi pada kehamilan:",
    options: ["Metildopa", "Nifedipin", "ACE Inhibitor", "Labetalol"],
    correct: 2,
    explanation: "ACE Inhibitor bersifat teratogenik dan sangat kontraindikasi pada kehamilan. Alternatif aman: metildopa, nifedipin, labetalol.",
    explanationPreview: "ACE Inhibitor bersifat teratogenik dan sangat kontraindikasi...",
    videoUrl: "https://www.youtube.com/embed/2k3Ih_-8yHc",
    isPremium: true,
    user: "Metildopa",
  },
];

function ResultsComponent() {
  const { user, isPremium } = useApp();
  const score = 80;
  const correct = 4;
  const total = 5;
  const xpEarn = 130;

  const dash = 339;
  const off = dash - (dash * score) / 100;

  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);

  const wrongs = sampleWrongs;
  const premiumCount = wrongs.filter((w) => w.isPremium).length;

  useEffect(() => {
    const timer = setTimeout(runConfetti, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] relative overflow-hidden">
      <canvas id="confetti" className="absolute inset-0 pointer-events-none" />
      <div className="relative z-[1] max-w-[720px] mx-auto px-6 py-10 text-center">
        {premiumCount > 0 && (
          <div className="bg-amber-50 rounded-[var(--radius-lg)] px-5 py-4 mb-6 flex items-center gap-3 shadow-md border-2 border-amber-300 border-b-4 border-b-amber-500">
            <span className="text-3xl">🔒</span>
            <div className="flex-1 text-left">
              <p className="m-0 font-extrabold text-sm text-amber-800">{premiumCount} pembahasan terkunci</p>
              <span className="text-[13px] text-stone-500">Upgrade untuk akses lengkap</span>
            </div>
            <button
              className="bg-amber-700 text-white border-none px-3.5 py-2.5 rounded-[var(--radius-md)] font-extrabold text-[13px] cursor-pointer whitespace-nowrap border-b-3"
              onClick={() => setShowPremiumDialog(true)}
            >
              Unlock
            </button>
          </div>
        )}

        <div className="text-[72px] animate-bounce">🎉</div>
        <h1 className="text-3xl font-black my-4">Pelajaran selesai!</h1>

        <div className="relative w-[180px] h-[180px] mx-auto mb-5">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <circle cx="60" cy="60" r="54" stroke="#e7e5e4" strokeWidth="12" fill="none" />
            <circle
              cx="60" cy="60" r="54"
              stroke="#14b8a6" strokeWidth="12" fill="none"
              strokeDasharray={dash} strokeDashoffset={off}
              strokeLinecap="round" transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <b className="text-[52px] font-black text-primary leading-none">{score}%</b>
            <span className="text-[13px] font-extrabold text-stone-400 tracking-wide uppercase mt-1">AKURASI</span>
          </div>
        </div>

        <div className="text-4xl font-black text-amber mb-6" style={{ animation: "popIn 0.6s cubic-bezier(0.2, 1.6, 0.4, 1)" }}>
          +{xpEarn} XP
        </div>

        <div className="grid grid-cols-3 gap-3 mb-7">
          <div className="bg-white rounded-[var(--radius-lg)] py-5 px-3 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 hover:-translate-y-1 transition-transform">
            <span className="text-[28px] block">🎯</span>
            <b className="text-[22px] font-black block my-2">{correct}/{total}</b>
            <span className="text-xs text-stone-400 font-bold">Benar</span>
          </div>
          <div className="bg-white rounded-[var(--radius-lg)] py-5 px-3 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 hover:-translate-y-1 transition-transform">
            <span className="text-[28px] block">⚡</span>
            <b className="text-[22px] font-black block my-2">1:42</b>
            <span className="text-xs text-stone-400 font-bold">Cepat</span>
          </div>
          <div className="bg-white rounded-[var(--radius-lg)] py-5 px-3 shadow-md border-2 border-stone-100 border-b-4 border-b-stone-200 hover:-translate-y-1 transition-transform">
            <span className="text-[28px] block">🔥</span>
            <b className="text-[22px] font-black block my-2">{user.streak}</b>
            <span className="text-xs text-stone-400 font-bold">Streak</span>
          </div>
        </div>

        <Link to="/dashboard" className="btn btn-primary btn-lg w-full">
          🎉 LANJUTKAN
        </Link>

        <div className="mt-8 text-left">
          <div className="flex justify-between items-center mb-5 px-1">
            <h3 className="m-0 text-lg font-black">📚 Pembahasan Soal</h3>
            <div className="flex gap-2 items-center">
              {premiumCount > 0 && (
                <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-full border-2 border-amber-300">
                  🔒 {premiumCount} Premium
                </span>
              )}
              <span className="text-[13px] font-bold text-stone-400 bg-stone-100 px-3 py-1.5 rounded-full">
                {wrongs.length} soal untuk direview
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {wrongs.map((w, i) => (
              <div
                key={i}
                className={`bg-white rounded-[var(--radius-lg)] shadow-md border-2 border-stone-100 overflow-hidden transition-all duration-200 ${
                  w.isPremium ? "border-amber-300 bg-gradient-to-br from-white to-amber-50" : ""
                } ${expandedItem === i ? "border-primary" : ""}`}
                style={{ borderBottom: "4px solid var(--color-stone-200)" }}
              >
                <button
                  className="w-full flex justify-between items-start p-[18px] bg-transparent border-none cursor-pointer text-left gap-3"
                  onClick={() => {
                    if (w.isPremium) {
                      setShowPremiumDialog(true);
                    } else {
                      setExpandedItem(expandedItem === i ? null : i);
                    }
                  }}
                >
                  <div className="flex gap-3.5 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white shrink-0 ${
                      w.isPremium ? "bg-amber border-b-3 border-b-amber-dark" : "bg-coral border-b-3 border-b-coral-dark"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-black uppercase tracking-wide text-primary bg-teal-50 px-2.5 py-1 rounded-full inline-block">
                        {w.subject}
                      </span>
                      <p className="m-0 mt-3 text-[15px] font-bold leading-relaxed">{w.question}</p>
                      <div className="flex flex-wrap gap-2.5 mt-2 text-[13px]">
                        <span className="text-coral-dark font-bold bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">❌ {w.user}</span>
                        <span className="text-success-dark font-bold bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">✓ {w.options[w.correct]}</span>
                      </div>
                    </div>
                  </div>
                  {w.isPremium ? (
                    <div className="flex flex-col items-center gap-0.5 bg-amber text-white px-3.5 py-2.5 rounded-[var(--radius-md)] font-black shadow-md border-b-3 border-b-amber-dark">
                      <span className="text-lg">🔒</span>
                      <span className="text-[10px] uppercase tracking-wide">Premium</span>
                    </div>
                  ) : (
                    <span className="text-stone-400 text-sm">{expandedItem === i ? "▼" : "▶"}</span>
                  )}
                </button>

                {!w.isPremium && expandedItem === i && (
                  <div className="px-[18px] pb-[18px] border-t border-stone-200" style={{ animation: "popIn 0.3s ease" }}>
                    <div className="mt-4">
                      <h4 className="text-sm font-black m-0 mb-3 flex items-center gap-2">📝 Penjelasan Lengkap</h4>
                      <p className="m-0 text-sm leading-relaxed text-stone-600 p-4 bg-stone-50 rounded-[var(--radius-md)] border-l-4 border-primary">
                        {w.explanation}
                      </p>
                    </div>
                    {w.videoUrl && (
                      <div className="mt-4">
                        <h4 className="text-sm font-black m-0 mb-3 flex items-center gap-2">🎥 Video Pembelajaran</h4>
                        <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-[var(--radius-md)] bg-black">
                          <iframe
                            src={w.videoUrl}
                            title={`Video pembahasan soal ${i + 1}`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute top-0 left-0 w-full h-full rounded-[var(--radius-md)]"
                          />
                        </div>
                        <p className="text-xs text-stone-400 mt-3 italic">💡 Tonton video ini untuk memahami konsep lebih dalam</p>
                      </div>
                    )}
                  </div>
                )}

                {!w.isPremium && expandedItem !== i && (
                  <div className="px-[18px] pb-[18px] -mt-2">
                    <p className="m-0 text-sm text-stone-400 italic p-3 bg-stone-50 rounded-[var(--radius-sm)]">
                      💡 {w.explanationPreview} <span className="text-primary">Klik untuk baca lengkap</span>
                    </p>
                  </div>
                )}

                {w.isPremium && (
                  <div className="px-[18px] pb-[18px]">
                    <div className="mt-4 p-4 relative overflow-hidden bg-stone-50 rounded-[var(--radius-md)]">
                      <p className="m-0 text-sm leading-relaxed text-stone-700 blur-[4px] opacity-70 select-none">{w.explanation}</p>
                      <div className="absolute inset-0 flex items-center justify-center bg-amber-50/80">
                        <span className="text-4xl">🔒</span>
                      </div>
                    </div>
                    <div className="mt-4 p-5 bg-amber-50 rounded-[var(--radius-lg)] border-2 border-amber-300 text-center">
                      <p className="m-0 mb-3.5 font-bold text-sm text-amber-800">🔒 Penjelasan lengkap dan video tersedia untuk member Premium</p>
                      <ul className="list-none p-0 m-0 text-left text-[13px] text-stone-600">
                        <li className="py-2 flex items-center gap-2 border-b border-dashed border-stone-200">📹 Video pembelajaran lengkap (5-10 menit)</li>
                        <li className="py-2 flex items-center gap-2 border-b border-dashed border-stone-200">📝 Pembahasan detail dengan ilustrasi</li>
                        <li className="py-2 flex items-center gap-2 border-b border-dashed border-stone-200">💡 Tips & trik menyelesaikan soal serupa</li>
                        <li className="py-2 flex items-center gap-2">📚 Akses ke 500+ soal premium</li>
                      </ul>
                    </div>
                    <button
                      className="btn btn-primary w-full mt-3.5"
                      onClick={() => setShowPremiumDialog(true)}
                    >
                      🔓 Buka Pembahasan - Rp49rb/bulan
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <PremiumDialog
        isOpen={showPremiumDialog}
        onClose={() => setShowPremiumDialog(false)}
        onUpgrade={() => setShowPremiumDialog(false)}
      />
    </div>
  );
}

function WrongAnswer() {}