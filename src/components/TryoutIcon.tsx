export const tryoutIconOptions = [
  { value: "flask", label: "Flask" },
  { value: "capsule", label: "Capsule" },
  { value: "heart-pulse", label: "Heart" },
  { value: "microbe", label: "Microbe" },
  { value: "hospital", label: "Hospital" },
  { value: "calculator", label: "Calculator" },
  { value: "pill-bottle", label: "Pill Bottle" },
  { value: "syringe", label: "Syringe" },
  { value: "stethoscope", label: "Stethoscope" },
  { value: "clipboard", label: "Clipboard" },
  { value: "book-open", label: "Book" },
  { value: "target", label: "Target" },
  { value: "timer", label: "Timer" },
  { value: "brain", label: "Brain" },
  { value: "dna", label: "DNA" },
  { value: "atom", label: "Atom" },
  { value: "shield-check", label: "Shield" },
  { value: "trophy", label: "Trophy" },
  { value: "chart", label: "Chart" },
  { value: "spark", label: "Spark" },
] as const;

export type TryoutIconValue = (typeof tryoutIconOptions)[number]["value"];

type TryoutIconProps = {
  icon?: string | null;
  tryoutId?: string;
  className?: string;
};

export function TryoutIcon({ icon, tryoutId, className = "w-7 h-7" }: TryoutIconProps) {
  if (icon?.startsWith("data:image/")) {
    return <img src={icon} className={`${className} object-contain`} alt="" aria-hidden="true" />;
  }

  const iconName = getTryoutIconName(icon, tryoutId);

  switch (iconName) {
    case "capsule":
      return <CapsuleIcon className={className} />;
    case "heart-pulse":
      return <HeartPulseIcon className={className} />;
    case "microbe":
      return <MicrobeIcon className={className} />;
    case "hospital":
      return <HospitalIcon className={className} />;
    case "calculator":
      return <CalculatorIcon className={className} />;
    case "pill-bottle":
      return <PillBottleIcon className={className} />;
    case "syringe":
      return <SyringeIcon className={className} />;
    case "stethoscope":
      return <StethoscopeIcon className={className} />;
    case "clipboard":
      return <ClipboardIcon className={className} />;
    case "book-open":
      return <BookOpenIcon className={className} />;
    case "target":
      return <TargetIcon className={className} />;
    case "timer":
      return <TimerIcon className={className} />;
    case "brain":
      return <BrainIcon className={className} />;
    case "dna":
      return <DnaIcon className={className} />;
    case "atom":
      return <AtomIcon className={className} />;
    case "shield-check":
      return <ShieldCheckIcon className={className} />;
    case "trophy":
      return <TrophyIcon className={className} />;
    case "chart":
      return <ChartIcon className={className} />;
    case "spark":
      return <SparkIcon className={className} />;
    default:
      return <FlaskIcon className={className} />;
  }
}

function getTryoutIconName(icon: string | null | undefined, tryoutId: string | undefined): TryoutIconValue {
  if (isPresetIcon(icon)) return icon;

  if (tryoutId === "2") return "capsule";
  if (tryoutId === "3") return "heart-pulse";
  if (tryoutId === "4") return "microbe";
  if (tryoutId === "5") return "hospital";
  if (tryoutId === "6") return "calculator";

  return "flask";
}

function isPresetIcon(icon: string | null | undefined): icon is TryoutIconValue {
  return tryoutIconOptions.some((option) => option.value === icon);
}

function FlaskIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M9 3h6M10 3v5.8l-4.7 7.9A2.8 2.8 0 0 0 7.7 21h8.6a2.8 2.8 0 0 0 2.4-4.3L14 8.8V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.2 15h7.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CapsuleIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M10.5 20.2a5 5 0 0 1-7.1-7.1l6.2-6.2a5 5 0 0 1 7.1 7.1l-6.2 6.2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m8 8 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HeartPulseIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M20.4 5.6a5.2 5.2 0 0 0-7.4 0L12 6.7l-1-1.1a5.2 5.2 0 0 0-7.4 7.4l8.4 8.2 8.4-8.2a5.2 5.2 0 0 0 0-7.4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13h3l1.5-3 3 6 1.5-3h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MicrobeIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 10h.1M14 13h.1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function HospitalIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M5 21V5.8C5 4.8 5.8 4 6.8 4h10.4c1 0 1.8.8 1.8 1.8V21M3 21h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v6M9 11h6M8 21v-4h8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalculatorIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 7h8M8.5 12h.1M12 12h.1M15.5 12h.1M8.5 16h.1M12 16h.1M15.5 16h.1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function PillBottleIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M8 3h8v4H8V3ZM7 7h10l1 3v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9l1-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 13h6M12 10v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SyringeIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="m4 20 5-5M14 4l6 6M12 6l6 6M7 13l4 4 7-7-4-4-7 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 18 4 20M15 3l6 6M9 11l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function StethoscopeIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M6 4v5a5 5 0 0 0 10 0V4M4 4h4M14 4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 14v2a4 4 0 0 0 8 0v-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="19" cy="13" r="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ClipboardIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M9 4h6l1 2h2a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2l1-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 4h6v4H9V4ZM8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookOpenIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7 8h2M15 8h2M7 12h2M15 12h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TargetIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function TimerIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M9 2h6M12 8v5l3 2M18.5 6.5 20 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function BrainIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3.5 3.5 0 0 0 3.5 5H9V4ZM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3.5 3.5 0 0 1-3.5 5H15V4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 8H7M9 12H6M15 8h2M15 12h3M12 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DnaIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M7 3c7 3 10 7 10 18M17 3C10 6 7 10 7 21M8 7h8M9 11h6M9 15h6M8 19h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function AtomIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 12h.1M20 12c0 2-3.6 3.7-8 3.7S4 14 4 12s3.6-3.7 8-3.7 8 1.7 8 3.7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 19c-1.7 1-5-.8-7.2-4.7S6.1 6.2 7.8 5.2c1.7-1 5 .8 7.2 4.7s2.7 8.1 1 9.1Z" stroke="currentColor" strokeWidth="2" />
      <path d="M8 19c-1.7-1-.8-5.2 1.4-9.1s5.5-5.7 7.2-4.7.8 5.2-1.4 9.1S9.7 20 8 19Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 3 19 6v5.2c0 4.4-2.8 8.3-7 9.8-4.2-1.5-7-5.4-7-9.8V6l7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrophyIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 6H5a2 2 0 0 0 0 4h3M16 6h3a2 2 0 0 1 0 4h-3M12 12v5M8 21h8M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChartIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3ZM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
