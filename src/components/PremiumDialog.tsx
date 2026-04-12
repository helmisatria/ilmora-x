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
        <div className="dialog-icon" style={{ fontSize: '48px' }}>⭐</div>
        <h3>Upgrade ke Genius Premium</h3>
        <p style={{ fontSize: '15px', lineHeight: '1.6' }}>
          Akses pembahasan lengkap dengan video, ilustrasi interaktif, dan tips menyelesaikan soal UKAI.
        </p>

        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'left',
        }}>
          <p style={{ fontWeight: 700, fontSize: '14px', margin: '0 0 12px', color: '#92400e' }}>
            ✨ Yang kamu dapatkan:
          </p>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            fontSize: '13px',
            color: '#78350f',
          }}>
            <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📹</span> Video pembahasan 5-10 menit per soal
            </li>
            <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📝</span> Penjelasan detail dengan ilustrasi
            </li>
            <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💡</span> Tips & trik menyelesaikan soal serupa
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📚</span> Akses 500+ soal premium UKAI
            </li>
          </ul>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{
            fontSize: '24px',
            fontWeight: 800,
            color: 'var(--primary)',
            margin: '0',
          }}>
            Rp 49.000<span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>/bulan</span>
          </p>
          <p style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            margin: '4px 0 0',
          }}>
            Bisa dibatalkan kapan saja
          </p>
        </div>

        <div className="dialog-actions">
          <button className="btn btn-white" onClick={onClose}>Nanti</button>
          <button className="btn btn-primary" onClick={onUpgrade} style={{ flex: 2 }}>
            🚀 Mulai Trial 7 Hari
          </button>
        </div>
      </div>
    </div>
  );
}
