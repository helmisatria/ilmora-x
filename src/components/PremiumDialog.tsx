import { useNavigate } from "@tanstack/react-router";
import { getLifetimeProductForTryout, membershipProducts } from "../data";
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
  hasPremiumMembership?: boolean;
  tryout?: PremiumDialogTryout | null;
}

interface PremiumDialogTryout {
  id: number | string;
  title: string;
}

export function PremiumDialog({ isOpen, onClose, onUpgrade, hasPremiumMembership = false, tryout = null }: PremiumDialogProps) {
  const navigate = useNavigate();
  const monthlyProduct = membershipProducts[0];
  const tryoutProduct = tryout ? getLifetimeProductForTryout(tryout.id) : null;
  const showTryoutPurchase = Boolean(tryoutProduct && !hasPremiumMembership);
  const showMembershipPrice = !hasPremiumMembership;
  const hasStickyMobilePrice = showMembershipPrice || showTryoutPurchase;

  const handleSubscribe = () => {
    onUpgrade();
    navigate({ to: "/premium" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[min(94vw,940px)] max-w-[min(94vw,940px)] max-h-[min(92dvh,740px)] border-amber-300 p-0 text-left md:grid md:grid-cols-[360px_minmax(0,1fr)]">
        <div className="relative shrink-0 overflow-hidden bg-[#2f281c] px-5 py-5 text-amber-50 md:min-h-[560px] md:px-8 md:py-8">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(320px 180px at 88% 0%, rgba(245,158,11,0.28), transparent 70%), radial-gradient(260px 180px at 0% 100%, rgba(20,184,166,0.16), transparent 72%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />

          <div className="relative grid grid-cols-[48px_minmax(0,1fr)] items-center gap-4 md:flex md:h-full md:flex-col md:items-start md:justify-between md:gap-6">
            <div className="self-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-amber-300/45 bg-amber-400/15 text-amber-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] md:h-16 md:w-16">
                <CrownIcon />
              </div>
            </div>

            <div className="min-w-0">
              <div className="mb-2 hidden sm:inline-flex rounded-full border border-amber-300/20 bg-amber-200/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-100/80 md:mb-3 md:px-3 md:text-[10px]">
                {tryout ? "Try-out terkunci" : "Premium access"}
              </div>
              <DialogTitle className="max-w-[14ch] text-[25px] font-black leading-[1] tracking-tight text-amber-50 md:max-w-[11ch] md:text-[42px] md:leading-[0.95]">
                {tryout ? "Try-out Premium" : "Upgrade ke Premium"}
              </DialogTitle>
              <DialogDescription className="mt-1.5 max-w-[32ch] text-[11px] font-semibold leading-snug text-amber-100/72 sm:text-[12px] md:mt-4 md:max-w-[28ch] md:text-[15px] md:leading-relaxed">
                {tryout
                  ? `Pilih Paket Premium atau beli ${tryout.title} saja.`
                  : "Buka analisis performa, pembahasan prioritas, dan latihan yang lebih terarah."}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-[#fffaf0]">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 md:px-7 md:py-6">
            <div className="grid gap-2.5">
              <PremiumFeature icon={<VideoIcon />} title="Video pembahasan" description="Penjelasan soal yang sulit dipahami lewat teks." />
              <PremiumFeature icon={<DocumentIcon />} title="Review detail" description="Lihat pola salah dan topik yang perlu diperbaiki." />
              <PremiumFeature icon={<TargetIcon />} title="Latihan terarah" description="Rekomendasi soal berdasarkan hasil tryout." />
            </div>

            <div className={`mt-4 hidden gap-3 md:grid ${showMembershipPrice && showTryoutPurchase ? "md:grid-cols-2" : ""}`}>
              {showMembershipPrice && (
                <PriceOption
                  title="Premium"
                  price={`Rp${(monthlyProduct?.price ?? 49000).toLocaleString("id-ID")}`}
                  suffix="/bulan"
                  description="Rekomendasi. Buka semua try-out premium dan fitur belajar."
                  tone="premium"
                />
              )}
              {showTryoutPurchase && tryoutProduct && (
                <PriceOption
                  title="Try-out ini"
                  price={`Rp${tryoutProduct.price.toLocaleString("id-ID")}`}
                  description={`Akses lifetime untuk ${tryout?.title}`}
                  tone="tryout"
                />
              )}
            </div>
          </div>

          <div className="shrink-0 border-t-2 border-amber-100/75 bg-[#fffaf0] px-4 pb-4 pt-3 sm:px-6 md:px-7 md:pb-6">
            {hasStickyMobilePrice && (
              <div className="mb-3 grid gap-2 md:hidden">
                {showMembershipPrice && (
                  <StickyPrice
                    label="Premium"
                    price={`Rp${(monthlyProduct?.price ?? 49000).toLocaleString("id-ID")}`}
                    suffix="/bulan"
                    tone="premium"
                  />
                )}
                {showTryoutPurchase && tryoutProduct && (
                  <StickyPrice
                    label="Try-out ini"
                    price={`Rp${tryoutProduct.price.toLocaleString("id-ID")}`}
                    tone="tryout"
                  />
                )}
              </div>
            )}

            <div className={`grid gap-2 ${showTryoutPurchase ? "md:grid-cols-[0.8fr_1.25fr_1.35fr]" : "md:grid-cols-[0.8fr_1.4fr]"}`}>
              <button className="btn btn-white min-h-13 w-full whitespace-nowrap px-4 text-sm md:min-h-14" onClick={onClose} type="button">
                Nanti
              </button>
              {showTryoutPurchase && tryoutProduct && (
                <button
                  className="btn btn-white min-h-13 w-full whitespace-nowrap px-4 text-sm md:min-h-14"
                  onClick={() => {
                    onClose();
                    navigate({ to: "/checkout", search: { productId: tryoutProduct.id } });
                  }}
                  type="button"
                >
                  <DocumentIcon />
                  Beli Try-out Ini
                </button>
              )}
              <button
                className="btn min-h-13 w-full whitespace-nowrap px-4 text-sm md:min-h-14"
                style={{
                  background: "#2f281c",
                  color: "#fff7ed",
                  borderBottomColor: "#a16207",
                }}
                onClick={handleSubscribe}
                type="button"
              >
                <CrownIcon />
                Paket Premium
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StickyPrice({
  label,
  price,
  suffix,
  tone,
}: {
  label: string;
  price: string;
  suffix?: string;
  tone: "premium" | "tryout";
}) {
  const borderClass = tone === "premium" ? "border-amber-100" : "border-sky-100";

  return (
    <div className={`flex items-center justify-between gap-3 rounded-[var(--radius-md)] border-2 bg-white px-3 py-2.5 ${borderClass}`}>
      <span className="text-[10px] font-black uppercase tracking-wide text-stone-400">{label}</span>
      <span className="text-[18px] font-black leading-none tracking-tight text-stone-900">
        {price}
        {suffix && <span className="ml-0.5 text-[11px] text-stone-400">{suffix}</span>}
      </span>
    </div>
  );
}

function PriceOption({
  title,
  price,
  suffix,
  description,
  tone,
}: {
  title: string;
  price: string;
  suffix?: string;
  description: string;
  tone: "premium" | "tryout";
}) {
  const borderClass = tone === "premium" ? "border-amber-100 border-b-amber-200" : "border-sky-100 border-b-sky-200";

  return (
    <div className={`rounded-[var(--radius-lg)] border-2 border-b-4 bg-white px-4 py-4 ${borderClass}`}>
      <div className="text-[10px] font-bold uppercase tracking-wide text-stone-400">{title}</div>
      <p className="m-0 mt-1 text-[30px] font-black leading-none tracking-tight text-stone-900 md:text-[32px]">
        {price}
        {suffix && <span className="text-[15px] font-black text-stone-400">{suffix}</span>}
      </p>
      <p className="m-0 mt-2 text-[11px] font-semibold leading-snug text-stone-400">{description}</p>
    </div>
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
    <div className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3 rounded-[var(--radius-md)] border-2 border-amber-100 bg-white px-3 py-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-amber-100 bg-amber-50 text-amber-700">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[14px] font-black leading-tight text-stone-800">{title}</div>
        <div className="mt-0.5 text-[12px] font-semibold leading-snug text-stone-500">{description}</div>
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
