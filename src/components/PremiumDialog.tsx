interface PremiumDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export function PremiumDialog({ isOpen, onClose, onUpgrade }: PremiumDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`dialog-backdrop ${isOpen ? "show" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-box">
        <div className="text-[56px] mb-3">⭐</div>
        <h3 className="text-2xl font-extrabold mb-2">Upgrade ke IlmoraX Premium</h3>
        <p className="text-stone-500 mb-5 leading-relaxed font-semibold">
          Akses pembahasan lengkap dengan video, ilustrasi interaktif, dan tips menyelesaikan soal UKAI.
        </p>

        <div className="bg-teal-50 rounded-[var(--radius-lg)] p-4 mb-5 text-left border-2 border-teal-200">
          <p className="font-extrabold text-sm mb-3 text-teal-800">✨ Yang kamu dapatkan:</p>
          <ul className="list-none p-0 m-0 space-y-2 text-sm text-stone-600">
            <li className="flex items-center gap-2"><span>📹</span> Video pembahasan lengkap</li>
            <li className="flex items-center gap-2"><span>📝</span> Penjelasan detail dengan ilustrasi</li>
            <li className="flex items-center gap-2"><span>💡</span> Tips & trik menyelesaikan soal</li>
            <li className="flex items-center gap-2"><span>📚</span> Akses 500+ soal premium UKAI</li>
            <li className="flex items-center gap-2"><span>📊</span> Evaluation Dashboard lengkap</li>
          </ul>
        </div>

        <p className="text-3xl font-extrabold text-primary m-0">Rp49.000<span className="text-sm font-bold text-stone-400">/bulan</span></p>
        <p className="text-xs text-stone-400 mt-1 mb-5">Satu kali pembayaran. Tidak ada auto-renew.</p>

        <div className="flex gap-3">
          <button className="btn btn-white flex-1" onClick={onClose}>Nanti</button>
          <button className="btn btn-primary flex-[2]" onClick={onUpgrade}>
            🚀 Berlangganan
          </button>
        </div>
      </div>
    </div>
  );
}