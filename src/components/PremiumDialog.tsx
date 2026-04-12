interface PremiumDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export function PremiumDialog({ isOpen, onClose, onUpgrade }: PremiumDialogProps) {
  return (
    <div
      className={`dialog-backdrop ${isOpen ? "show" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog">
        <div className="dialog-icon">⭐</div>
        <h3>Upgrade ke Super</h3>
        <p>
          Akses pembahasan lengkap dengan video, ilustrasi interaktif, dan tips menyelesaikan soal UKAI.
        </p>

        <div className="dialog-features">
          <p className="dialog-features-title">✨ Yang kamu dapatkan:</p>
          <ul>
            <li><span>📹</span> Video pembahasan lengkap</li>
            <li><span>📝</span> Penjelasan detail dengan ilustrasi</li>
            <li><span>💡</span> Tips & trik menyelesaikan soal</li>
            <li><span>📚</span> Akses 500+ soal premium UKAI</li>
          </ul>
        </div>

        <p className="dialog-price">Rp49.000<span>/bulan</span></p>
        <p className="dialog-price-note">Bisa dibatalkan kapan saja</p>

        <div className="dialog-actions">
          <button className="btn btn-white" onClick={onClose}>Nanti</button>
          <button className="btn btn-primary" onClick={onUpgrade} style={{ flex: 2 }}>
            🚀 Trial 7 Hari
          </button>
        </div>
      </div>
    </div>
  );
}
