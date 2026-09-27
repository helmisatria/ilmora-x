import { getLevelTier } from "../features/engagement-surface/level-catalog";
import { hasPremiumMembershipEndsAt } from "../features/premium-access/premium-access";

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

export function hasPremiumMembership(user: User): boolean {
  return hasPremiumMembershipEndsAt(user.entitlementEndsAt);
}

export function getGradeForLevel(level: number): string {
  return getLevelTier(level);
}
