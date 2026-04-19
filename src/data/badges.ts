export interface Badge {
  id: number;
  name: string;
  icon: string;
  category: "General" | "Level" | "Streak" | "Prestige";
  task: string;
  xpReward: number;
}

export const badges: Badge[] = [
  { id: 1, name: "First Steps", icon: "🎯", category: "General", task: "Complete your first test", xpReward: 10 },
  { id: 2, name: "Pharmacy Novice Badge", icon: "🌱", category: "Level", task: "Reach Level 3", xpReward: 60 },
  { id: 3, name: "Pharmacy Trainee Badge", icon: "📈", category: "Level", task: "Reach Level 6", xpReward: 90 },
  { id: 4, name: "Pharmacy Practitioner Badge", icon: "💊", category: "Level", task: "Reach Level 11", xpReward: 140 },
  { id: 5, name: "Pharmacy Professional Badge", icon: "🔬", category: "Level", task: "Reach Level 16", xpReward: 200 },
  { id: 6, name: "Pharmacy Specialist Badge", icon: "🧬", category: "Level", task: "Reach Level 21", xpReward: 275 },
  { id: 7, name: "Pharmacy Expert Badge", icon: "🏆", category: "Level", task: "Reach Level 26", xpReward: 0 },
  { id: 8, name: "Pharmacy Consultant Badge", icon: "🎓", category: "Level", task: "Reach Level 31", xpReward: 0 },
  { id: 9, name: "Pharmacy Master Badge", icon: "👑", category: "Level", task: "Reach Level 36", xpReward: 0 },
  { id: 10, name: "Pharmacy Grand-Master Badge", icon: "⚡", category: "Level", task: "Reach Level 41", xpReward: 0 },
  { id: 11, name: "Pharmacy Authority Badge", icon: "🌟", category: "Level", task: "Reach Level 46", xpReward: 0 },
  { id: 12, name: "Pharmacy Legendary Badge", icon: "💎", category: "Level", task: "Reach Level 50", xpReward: 0 },
  { id: 13, name: "Top 10", icon: "🏅", category: "Level", task: "Reach top 10 leaderboard", xpReward: 200 },
  { id: 14, name: "Top 5", icon: "🥈", category: "Level", task: "Reach top 5 leaderboard", xpReward: 500 },
  { id: 15, name: "Top 3", icon: "🥉", category: "Level", task: "Reach top 3 leaderboard", xpReward: 750 },
  { id: 16, name: "Top 1", icon: "🏆", category: "Level", task: "Reach top 1 leaderboard", xpReward: 1000 },
  { id: 17, name: "3-Days Streak", icon: "🔥", category: "Streak", task: "Complete tryout every day for 3 days", xpReward: 300 },
  { id: 18, name: "7-Days Streak", icon: "🔥", category: "Streak", task: "Complete tryout every day for 7 days", xpReward: 700 },
  { id: 19, name: "14-Days Streak", icon: "🔥", category: "Streak", task: "Complete tryout every day for 14 days", xpReward: 1500 },
  { id: 20, name: "30-Days Warrior", icon: "🔥", category: "Streak", task: "Complete tryout every day for 30 days", xpReward: 2000 },
  { id: 22, name: "Dedicated", icon: "📚", category: "Streak", task: "Complete 15 unique tryouts", xpReward: 1000 },
  { id: 23, name: "Master", icon: "🎓", category: "Streak", task: "Complete 50 unique tryouts", xpReward: 5000 },
  { id: 24, name: "Legendary", icon: "👑", category: "Streak", task: "Complete 100 unique tryouts", xpReward: 7500 },
  { id: 25, name: "Speed Runner", icon: "⚡", category: "Streak", task: "Finish tryout under time limit with >80% score", xpReward: 1000 },
  { id: 26, name: "Fail Legend", icon: "💀", category: "Prestige", task: "Reach 5x fail", xpReward: 1000 },
  { id: 27, name: "100% Club", icon: "💯", category: "Prestige", task: "Reach 100% Score", xpReward: 5000 },
];

export type BadgeProgress = {
  badgeId: number;
  progress: number;
  total: number;
  unlocked: boolean;
  awardedAt?: string;
};

export const mockBadgeProgress: BadgeProgress[] = [
  { badgeId: 1, progress: 1, total: 1, unlocked: true, awardedAt: "2026-04-01" },
  { badgeId: 2, progress: 1, total: 1, unlocked: true, awardedAt: "2026-04-03" },
  { badgeId: 3, progress: 1, total: 1, unlocked: false },
  { badgeId: 4, progress: 0, total: 1, unlocked: false },
  { badgeId: 5, progress: 0, total: 1, unlocked: false },
  { badgeId: 6, progress: 0, total: 1, unlocked: false },
  { badgeId: 7, progress: 0, total: 1, unlocked: false },
  { badgeId: 8, progress: 0, total: 1, unlocked: false },
  { badgeId: 9, progress: 0, total: 1, unlocked: false },
  { badgeId: 10, progress: 0, total: 1, unlocked: false },
  { badgeId: 11, progress: 0, total: 1, unlocked: false },
  { badgeId: 12, progress: 0, total: 1, unlocked: false },
  { badgeId: 13, progress: 0, total: 1, unlocked: false },
  { badgeId: 14, progress: 0, total: 1, unlocked: false },
  { badgeId: 15, progress: 0, total: 1, unlocked: false },
  { badgeId: 16, progress: 0, total: 1, unlocked: false },
  { badgeId: 17, progress: 7, total: 3, unlocked: true, awardedAt: "2026-04-10" },
  { badgeId: 18, progress: 7, total: 7, unlocked: true, awardedAt: "2026-04-14" },
  { badgeId: 19, progress: 7, total: 14, unlocked: false },
  { badgeId: 20, progress: 7, total: 30, unlocked: false },
  { badgeId: 22, progress: 3, total: 15, unlocked: false },
  { badgeId: 23, progress: 3, total: 50, unlocked: false },
  { badgeId: 24, progress: 3, total: 100, unlocked: false },
  { badgeId: 25, progress: 0, total: 1, unlocked: false },
  { badgeId: 26, progress: 0, total: 5, unlocked: false },
  { badgeId: 27, progress: 0, total: 1, unlocked: false },
];