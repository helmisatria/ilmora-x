import { getLevelForXp } from "../engagement-surface/level-catalog";
import { getGradeForLevel } from "../../data/users";

export type LeaderboardEntryView = {
  r: number;
  userId: string;
  n: string;
  xp: number;
  a: string;
  photoUrl?: string | null;
  ch: "up" | "down";
  me: boolean;
  level: number;
  grade: string;
};

type LeaderboardEntryInput = {
  rank: number;
  userId: string;
  name: string;
  xp: number;
  avatar: string;
  photoUrl?: string | null;
  me: boolean;
};

export function toLeaderboardEntryViews(entries: LeaderboardEntryInput[]): LeaderboardEntryView[] {
  return entries.map((entry) => {
    const level = getLevelForXp(entry.xp).level;

    return {
      r: entry.rank,
      userId: entry.userId,
      n: entry.name,
      xp: entry.xp,
      a: entry.avatar,
      photoUrl: entry.photoUrl,
      ch: "up",
      me: entry.me,
      level,
      grade: getGradeForLevel(level),
    };
  });
}

export function isLeaderboardEntry(user: LeaderboardEntryView | undefined): user is LeaderboardEntryView {
  return Boolean(user);
}

export function getLeaderboardLeaderGap(viewerEntry: LeaderboardEntryView | undefined, leader: LeaderboardEntryView | undefined): number {
  if (!viewerEntry || !leader) return 0;

  return Math.max(leader.xp - viewerEntry.xp, 0);
}

export function formatLeaderboardWeekRange(startsAt: string, endsAt: string): string {
  const start = formatJakartaDateTime(startsAt);
  const end = formatJakartaDateTime(endsAt);

  return `${start} - ${end}`;
}

export function formatLeaderboardRewardsAt(value: string): string {
  return formatJakartaDateTime(value);
}

export function getRankTone(rank: number): string {
  if (rank === 1) return "#f59e0b";
  if (rank === 2) return "#94a3b8";
  if (rank === 3) return "#c08457";
  return "#205072";
}

export function getRankSymbol(rank: number): string {
  if (rank === 1) return "I";
  if (rank === 2) return "II";
  if (rank === 3) return "III";
  return "+";
}

export function getProfileTo(user: LeaderboardEntryView): "/profile" | "/profile/$userId" {
  return user.me ? "/profile" : "/profile/$userId";
}

export function getProfileParams(user: LeaderboardEntryView): { userId: string } | undefined {
  if (user.me) return undefined;

  return { userId: user.userId };
}

function formatJakartaDateTime(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
    timeZoneName: "short",
  }).format(new Date(value));
}
