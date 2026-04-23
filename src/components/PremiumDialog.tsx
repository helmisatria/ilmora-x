import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";

interface PremiumDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export function PremiumDialog({ isOpen, onClose, onUpgrade }: PremiumDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-amber-300 p-0 text-left">
        <div className="relative shrink-0 overflow-hidden bg-[#2f281c] px-7 pt-6 pb-5 text-amber-50">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(320px 180px at 88% 0%, rgba(245,158,11,0.28), transparent 70%), radial-gradient(260px 180px at 0% 100%, rgba(20,184,166,0.18), transparent 72%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />

          <div className="relative">
            <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center border-2 border-amber-300/45 bg-amber-400/15 text-amber-200">
              <CrownIcon />
            </div>
            <DialogTitle className="mb-2 text-center text-amber-50">
              Upgrade ke IlmoraX Premium
            </DialogTitle>
            <DialogDescription className="mx-auto max-w-[29ch] text-center text-amber-100/78">
              Buka analisis performa, pembahasan prioritas, dan latihan yang lebih terarah.
            </DialogDescription>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#fffaf0] px-7 pt-4 pb-3">
          <div className="grid gap-2">
            <PremiumFeature icon={<VideoIcon />} title="Video pembahasan" description="Penjelasan soal yang sulit dipahami lewat teks." />
            <PremiumFeature icon={<DocumentIcon />} title="Review detail" description="Lihat pola salah dan topik yang perlu diperbaiki." />
            <PremiumFeature icon={<TargetIcon />} title="Latihan terarah" description="Rekomendasi soal berdasarkan hasil tryout." />
          </div>
        </div>

        <div className="shrink-0 bg-[#fffaf0] px-7 pb-4 pt-2">
          <div className="rounded-(--radius-lg) bg-white border-2 border-amber-100 border-b-4 border-b-amber-200 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-stone-900 m-0 leading-tight">
              Rp49.000
              <span className="text-sm font-bold text-stone-400">/bulan</span>
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">Satu kali pembayaran. Tidak ada auto-renew.</p>
          </div>
        </div>

        <div className="shrink-0 bg-[#fffaf0] px-7 pb-5 pt-0 flex gap-3">
          <button className="btn btn-white flex-1" onClick={onClose} type="button">
            Nanti
          </button>
          <button
            className="btn flex-[2]"
            style={{
              background: "#2f281c",
              color: "#fff7ed",
              borderBottomColor: "#a16207",
            }}
            onClick={onUpgrade}
            type="button"
          >
            <CrownIcon />
            Berlangganan
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PremiumFeature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-(--radius-md) bg-white border-2 border-amber-100 px-3 py-3">
      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border-2 border-amber-100">
        {icon}
      </div>
      <div>
        <div className="text-sm font-bold text-stone-800 leading-tight">{title}</div>
        <div className="text-xs text-stone-500 font-medium leading-relaxed mt-0.5">{description}</div>
      </div>
    </div>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
      <path d="m4 8 4 3.5L12 5l4 6.5L20 8l-1.5 10h-13L4 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
      <path d="M4 7.8C4 6.8 4.8 6 5.8 6h8.4c1 0 1.8.8 1.8 1.8v8.4c0 1-.8 1.8-1.8 1.8H5.8c-1 0-1.8-.8-1.8-1.8V7.8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m16 10 4-2.5v9L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
      <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 3v5h5M8 13h8M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
