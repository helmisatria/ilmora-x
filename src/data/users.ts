export interface User {
  id: number;
  name: string;
  email: string;
  institution: string;
  avatar: string;
  googlePhotoUrl: string | null;
  isAdmin: boolean;
  adminTier: "admin" | "super_admin" | null;
  entitlementStartsAt?: string | null;
  entitlementEndsAt: string | null;
  level: number;
  xp: number;
  weeklyXp: number;
  streak: number;
  referralCode: string;
  joinDate: string;
  completedProfile: boolean;
  totalQuestions: number;
  totalCorrect: number;
  totalTryouts: number;
}


export function getGradeForLevel(level: number): string {
  if (level >= 46) return "Pharmacy Authority";
  if (level >= 36) return "Pharmacy Legend";
  if (level >= 26) return "Pharmacy Expert";
  if (level >= 16) return "Pharmacy Professional";
  if (level >= 11) return "Pharmacy Practitioner";
  if (level >= 6) return "Pharmacy Trainee";
  if (level >= 3) return "Pharmacy Novice";
  return "Pharmacy Newbie";
}

export function getLevelGrade(user: User): string {
  return getGradeByLevel(user.level);
}

export function getGradeByLevel(level: number): string {
  if (level >= 46) return "Pharmacy Authority";
  if (level >= 36) return "Pharmacy Legend";
  if (level >= 26) return "Pharmacy Expert";
  if (level >= 16) return "Pharmacy Professional";
  if (level >= 11) return "Pharmacy Practitioner";
  if (level >= 6) return "Pharmacy Trainee";
  if (level >= 3) return "Pharmacy Novice";
  return "Pharmacy Newbie";
}
