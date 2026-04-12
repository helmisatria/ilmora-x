import { useEffect, useRef } from "react";

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
        <div className="dialog-icon">🔒</div>
        <h3>Konten Premium</h3>
        <p>Upgrade ke Super untuk akses tryout ini, pembahasan lengkap, dan video pembelajaran.</p>
        <div className="dialog-actions">
          <button className="btn btn-white" onClick={onClose}>Nanti</button>
          <button className="btn btn-primary" onClick={onUpgrade}>Upgrade Rp 49k</button>
        </div>
      </div>
    </div>
  );
}
