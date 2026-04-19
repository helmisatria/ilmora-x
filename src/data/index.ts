// Pure TypeScript barrel file — no JSX, just re-exports
export { currentUser, mockUsers } from "./users";
export type { User } from "./users";
export { tryouts, questionBank, mockAttempts } from "./questions";
export type { Question, WrongAnswer, Attempt, Tryout } from "./questions";
export { mockBadgeProgress, badges } from "./badges";
export { levels, getLevelForXp, getNextLevel, getXpProgress } from "./levels";
export { mockEntitlements, packages } from "./entitlements";
export { mockCoupons, applyCoupon } from "./coupons";
export { mockMateri } from "./materi";
export { mockPolls } from "./polls";
export { categories, getCategoryName, getSubCategoryName, getSubCategories } from "./categories";
export { institutions } from "./institutions";
export { AppProvider, useApp } from "./provider";
export type { AppState, LeaderboardEntry } from "./provider";

// Helper function
import { type User } from "./users";
export function isUserPremium(user: User): boolean {
  if (!user.entitlementEndsAt) return false;
  return new Date(user.entitlementEndsAt) > new Date();
}