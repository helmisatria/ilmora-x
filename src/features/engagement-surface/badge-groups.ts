import type { Badge } from "./badge-catalog";

export type BadgeGroupKey = "start" | "level" | "streak" | "tryouts" | "leaderboard" | "special";

export type BadgeProgressView = {
  badgeId: number;
  progress: number;
  total: number;
  unlocked: boolean;
};

// Display-only grouping. Badge["category"] stays as-is because awarding and profiles rely on it.
export const badgeGroups: Array<{ key: BadgeGroupKey; title: string; description: string }> = [
  { key: "start", title: "Mulai", description: "Selesaikan Try-out pertamamu untuk mendapatkan lencana ini." },
  { key: "level", title: "Level", description: "Kumpulkan EXP untuk naik level. Level tertentu memberi bonus EXP permanen." },
  { key: "streak", title: "Konsistensi harian", description: "Kerjakan minimal satu Try-out setiap hari, berturut-turut." },
  { key: "tryouts", title: "Jumlah Try-out", description: "Selesaikan Try-out yang berbeda-beda. Try-out yang diulang dihitung sekali." },
  { key: "leaderboard", title: "Leaderboard", description: "Raih peringkat atas di Leaderboard mingguan. Lencana diberikan setelah minggu berakhir." },
  { key: "special", title: "Spesial", description: "Pencapaian khusus dari hasil Try-out. Lencana diberikan otomatis." },
];

export function getBadgeGroupKey(badge: Badge): BadgeGroupKey {
  if (badge.id === 1) return "start";
  if (/Reach Level \d+/i.test(badge.task)) return "level";
  if (/every day for \d+ days/i.test(badge.task)) return "streak";
  if (/Complete \d+ unique tryouts/i.test(badge.task)) return "tryouts";
  if (/leaderboard/i.test(badge.task)) return "leaderboard";

  return "special";
}

// Leaderboard ranks, 100% Club and Speed Runner are judged by the server per week or per attempt,
// so the page has no partial progress to show for them.
export function hasMeasurableProgress(badge: Badge) {
  if (getBadgeGroupKey(badge) === "leaderboard") return false;

  return badge.name !== "100% Club" && badge.name !== "Speed Runner";
}

// One badge per group, so a new student (already Level 1) is not shown only Level badges.
// Fail Legend is never suggested: nudging students to fail is not a goal.
export function getNextBadges<TBadge extends Badge>(badgeList: TBadge[], progressList: BadgeProgressView[], limit = 3) {
  const progressMap = new Map(progressList.map((progress) => [progress.badgeId, progress]));

  return badgeList
    .filter((badge) => {
      const progress = progressMap.get(badge.id);
      if (!progress || progress.unlocked) return false;

      return hasMeasurableProgress(badge) && badge.name !== "Fail Legend";
    })
    .map((badge) => ({ badge, progress: progressMap.get(badge.id)! }))
    .sort((a, b) => {
      const ratioDiff = b.progress.progress / b.progress.total - a.progress.progress / a.progress.total;
      if (ratioDiff !== 0) return ratioDiff;

      return a.progress.total - b.progress.total;
    })
    .filter((item, index, list) =>
      list.findIndex((other) => getBadgeGroupKey(other.badge) === getBadgeGroupKey(item.badge)) === index,
    )
    .slice(0, limit);
}
