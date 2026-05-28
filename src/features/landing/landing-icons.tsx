import type { ReactNode } from "react";

export function BrandMark() {
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,#fef3df_0%,var(--brand-primary-soft)_100%)] shadow-[0_10px_24px_rgba(51,100,89,0.12)] ring-1 ring-[#d9ebe4]">
      <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden="true">
        <path
          d="M14 5c-4.8 0-8.5 3.8-8.5 8.7 0 2.8 1.2 5.2 3.2 6.8v1.8c0 .9.7 1.5 1.5 1.5h7.6c.9 0 1.5-.7 1.5-1.5V20.5c2-1.6 3.2-4 3.2-6.8C22.5 8.8 18.8 5 14 5Z"
          fill="#7f6142"
        />
        <path
          d="M10.2 11.2c0-1.3.9-2.2 2.1-2.2 1 0 1.8.5 1.8 1.1 0-.7.9-1.1 1.9-1.1 1.2 0 2.1.9 2.1 2.2v3.4c0 1.3-.9 2.2-2.1 2.2-1 0-1.8-.5-1.9-1.1 0 .7-.8 1.1-1.8 1.1-1.2 0-2.1-.9-2.1-2.2v-3.4Z"
          fill="#fff8ef"
        />
        <path
          d="M11.8 12.8a1.2 1.2 0 1 0 0-.1Zm4.5 0a1.2 1.2 0 1 0 0-.1ZM11.5 20.2h5"
          fill="none"
          stroke="#4b3a27"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function ArrowUpRightIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path
        d="M6 14 14 6m0 0H7m7 0v7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5l-1.9-5.7-5.6-1.9L10.1 9 12 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 22c4.1 0 7-2.8 7-6.8 0-3.5-2-5.8-4.4-7.7-.7 2-1.8 3.1-3.3 3.8.3-2.9-1.1-5.2-3.7-7.3C7.4 7.4 5 10.2 5 15.2 5 19.2 7.9 22 12 22Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LegendItem({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: tone }} />
      {label}
    </span>
  );
}

export function LargeStepIcon({ children }: { children: ReactNode }) {
  return <span className="scale-[1.35]">{children}</span>;
}

export function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 3.5V8h4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12h6M9 15.5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function BoltBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="m13 2-6 9h4l-1 11 7-10h-4l0-10Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShieldBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 3 19 6v5.5c0 4.2-2.6 7.9-7 9.5-4.4-1.6-7-5.3-7-9.5V6l7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function TargetBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function FlashBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="m13 2-6 9h4l-1 11 7-10h-4l0-10Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StarBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="m12 4 2.2 4.5 5 .7-3.6 3.5.9 4.9-4.5-2.4-4.5 2.4.9-4.9-3.6-3.5 5-.7L12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function BarChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M5 18V11M11 18V7M17 18V4M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrendingUpIcon() {
  return (
    <svg viewBox="0 0 80 40" className="h-8 w-24" fill="none" aria-hidden="true">
      <path d="M6 30h15l9-10 10 3 10-12 12 2 12-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M67 5h11v11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GrowthIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M5 18v-3M10 18V9M15 18v-6M20 18V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m6 9 4-4 4 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M4 9.5h16V20a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20V9.5ZM12 9.5v12M4 14h16" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 9.5H7.8A2.3 2.3 0 1 1 10 6.2L12 9.5Zm0 0h4.2A2.3 2.3 0 1 0 14 6.2L12 9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="m5 18 1.8-10 5.2 4 5.2-4L19 18H5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 18h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="6.8" cy="8" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="17.2" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8.6 12.2 2.2 2.2 4.6-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MagicWandIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="m4 20 8.5-8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m11.5 5 1 2.6L15 8.5l-2.5.9-1 2.6-1-2.6L8 8.5l2.5-.9 1-2.6ZM17.5 12l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function TrophyLineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M8 4h8v3a4 4 0 0 1-8 0V4ZM12 11v4M9 20h6M10 15h4v5h-4v-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6H4v1.5A3.5 3.5 0 0 0 7.5 11H9M16 6h4v1.5a3.5 3.5 0 0 1-3.5 3.5H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M20 11a8 8 0 1 1-2.3-5.6M20 4v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HeadsetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M4 13a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3.5" y="12" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="16.5" y="12" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M18.5 19a3.5 3.5 0 0 1-3.5 3.5H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M15.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.5 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2.5 19.5a4.8 4.8 0 0 1 4.8-4.8h2.4a4.8 4.8 0 0 1 4.8 4.8M13.8 19.5a4.2 4.2 0 0 1 4.2-4.2h.2a4.2 4.2 0 0 1 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function UserLineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 19a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" aria-hidden="true">
      <path d="M12 3 19 6v5.4c0 4.3-2.6 8.1-7 9.6-4.4-1.5-7-5.3-7-9.6V6l7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m9.2 12.4 1.9 1.9 3.8-4.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-stone-300" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10.5v4M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function FlaskIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M10 3h4M11 3v5l-5 8.3A2 2 0 0 0 7.7 19h8.6a2 2 0 0 0 1.7-3L13 8V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.8 13h6.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function BookOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M4.5 6.5A2.5 2.5 0 0 1 7 4h4.2v15H7A2.5 2.5 0 0 0 4.5 21V6.5ZM19.5 6.5A2.5 2.5 0 0 0 17 4h-4.2v15H17a2.5 2.5 0 0 1 2.5 2V6.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function CapsuleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="m9.4 5.2 9.4 9.4a4 4 0 0 1-5.7 5.7l-9.4-9.4a4 4 0 0 1 5.7-5.7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m8 8 8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function MenuGridIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HeartLineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M12 20s-6.5-4.4-8.5-8c-1.5-2.6-.5-5.8 2.3-7 2-.8 4.3-.2 5.7 1.6 1.4-1.8 3.7-2.4 5.7-1.6 2.8 1.2 3.8 4.4 2.3 7-2 3.6-8.5 8-8.5 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m8 12 2-2 2 4 2-3h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PillBottleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M9 4h6v3H9V4Zm-2 5.5A2.5 2.5 0 0 1 9.5 7h5A2.5 2.5 0 0 1 17 9.5v7A2.5 2.5 0 0 1 14.5 19h-5A2.5 2.5 0 0 1 7 16.5v-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function AtomIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3.5c2.9 0 5.2 3.8 5.2 8.5S14.9 20.5 12 20.5 6.8 16.7 6.8 12 9.1 3.5 12 3.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.6 8.3c1.5-2.4 5.9-2.6 9.8-.3 3.9 2.2 5.8 6 4.4 8.4-1.5 2.4-5.9 2.6-9.8.3-3.9-2.2-5.8-6-4.4-8.4Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function SparkBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12 4.5 13.7 9l4.8 1.7-4.8 1.7-1.7 4.6-1.7-4.6-4.8-1.7L10.3 9 12 4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function LockBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M8 11V8a4 4 0 1 1 8 0v3M7 11h10v8H7v-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="m7 4 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M7 4.5h7l4 4v11A1.5 1.5 0 0 1 16.5 21h-9A1.5 1.5 0 0 1 6 19.5V6A1.5 1.5 0 0 1 7.5 4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 4.5V9h4M9 13h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4.5l3 1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 4v2.5M20 12h-2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function BookFrameIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M6 4.5h11A1.5 1.5 0 0 1 18.5 6v12A1.5 1.5 0 0 1 17 19.5H7A1.5 1.5 0 0 1 5.5 18V5.9A1.4 1.4 0 0 1 6.9 4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 4.5v15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function LoginArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13 8.5 17.5 12 13 15.5M17.5 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
