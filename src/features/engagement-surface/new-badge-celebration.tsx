import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../components/ui/dialog";
import { listUnseenStudentBadges, markStudentBadgesSeen } from "./new-badge-functions";

type UnseenBadge = Awaited<ReturnType<typeof listUnseenStudentBadges>>[number];
type CelebratedBadge = UnseenBadge & { badge: NonNullable<UnseenBadge["badge"]> };

// The next page can load before the "seen" write lands, so remember dismissals in this tab.
const dismissedStudentBadgeIds = new Set<string>();

// Shows Badges the Student has not seen yet, once. Dismissing marks them seen,
// after which they live only in the Badge collection and profile.
export function NewBadgeCelebration({ onSettled }: { onSettled?: () => void }) {
  const [unseenBadges, setUnseenBadges] = useState<UnseenBadge[]>([]);
  const [open, setOpen] = useState(false);
  const onSettledRef = useRef(onSettled);

  onSettledRef.current = onSettled;

  useEffect(() => {
    let cancelled = false;

    listUnseenStudentBadges()
      .then((allRows) => {
        if (cancelled) return;

        const rows = allRows.filter((row) => !dismissedStudentBadgeIds.has(row.id));

        if (toCelebratedBadges(rows).length === 0) {
          // Nothing to show, but retired Badge codes still need marking so they stop coming back.
          markSeen(rows);
          onSettledRef.current?.();
          return;
        }

        setUnseenBadges(rows);
        setOpen(true);
      })
      .catch(() => {
        if (!cancelled) onSettledRef.current?.();
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const celebratedBadges = toCelebratedBadges(unseenBadges);

  const dismiss = () => {
    if (!open) return;

    setOpen(false);
    onSettledRef.current?.();
    markSeen(unseenBadges);
  };

  if (celebratedBadges.length === 0) return null;

  const totalRewardXp = celebratedBadges.reduce((total, row) => total + row.rewardXp, 0);
  const isSingle = celebratedBadges.length === 1;
  const [first] = celebratedBadges;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && dismiss()}>
      <DialogContent className="max-w-[min(92vw,440px)] p-0 text-left">
        <div
          className="relative overflow-hidden px-5 pb-5 pt-6 text-center text-white"
          style={{
            background: "radial-gradient(320px 200px at 50% -10%, rgba(251,191,36,0.55), transparent 70%), linear-gradient(135deg, #205072 0%, #163a52 100%)",
          }}
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-white/25 bg-white/15 text-[40px] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
            {first.badge.icon}
          </div>
          <div className="mt-4 text-[10px] font-black uppercase tracking-wide text-amber-200">
            {isSingle ? "Lencana baru" : `${celebratedBadges.length} lencana baru`}
          </div>
          <DialogTitle className="mt-1 text-[24px] font-black leading-tight tracking-tight text-white">
            {isSingle ? first.badge.displayName : "Kamu dapat lencana baru!"}
          </DialogTitle>
          <DialogDescription className="mx-auto mt-2 max-w-[32ch] text-[13px] font-semibold leading-relaxed text-white/75">
            {isSingle ? getAwardReason(first) : "Lencana ini masuk koleksimu sejak kunjungan terakhir."}
          </DialogDescription>
          {totalRewardXp > 0 && (
            <div className="mx-auto mt-3 inline-flex rounded-full border border-amber-200/40 bg-amber-300/15 px-3 py-1 text-[12px] font-black text-amber-100">
              +{totalRewardXp.toLocaleString("id-ID")} EXP
            </div>
          )}
        </div>

        {!isSingle && (
          <ul className="m-0 grid max-h-[40dvh] list-none gap-2 overflow-y-auto bg-[#fffcf7] p-4">
            {celebratedBadges.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-3 rounded-[var(--radius-md)] border-2 border-stone-100 bg-white p-3"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-50 text-[24px]">
                  {row.badge.icon}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-extrabold text-stone-800">{row.badge.displayName}</span>
                  <span className="block text-[12px] font-semibold leading-snug text-stone-500">{getAwardReason(row)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-2 border-t-2 border-stone-100 bg-white px-5 py-4 sm:grid-flow-col">
          <Link
            className="btn btn-white min-h-12 w-full px-4 text-sm no-underline"
            onClick={dismiss}
            to="/badges"
          >
            Lihat koleksi
          </Link>
          <button className="btn btn-primary min-h-12 w-full px-4 text-sm" onClick={dismiss} type="button">
            Mantap!
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function toCelebratedBadges(rows: UnseenBadge[]): CelebratedBadge[] {
  return rows.flatMap((row) => {
    const { badge } = row;

    return badge ? [{ ...row, badge }] : [];
  });
}

function markSeen(rows: UnseenBadge[]) {
  if (rows.length === 0) return;

  for (const row of rows) dismissedStudentBadgeIds.add(row.id);

  void markStudentBadgesSeen({ data: { studentBadgeIds: rows.map((row) => row.id) } }).catch(() => undefined);
}

function getAwardReason(row: CelebratedBadge) {
  if (row.awardSource === "weekly_leaderboard" && row.rank && row.sourceWeekKey) {
    return `Peringkat #${row.rank} Leaderboard minggu ${formatWeek(row.sourceWeekKey)}.`;
  }

  return row.badge.requirementText;
}

function formatWeek(weekStartDate: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${weekStartDate}T00:00:00+07:00`));
}
