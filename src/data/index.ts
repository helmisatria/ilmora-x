// Pure TypeScript barrel file — no JSX, just re-exports
export type { User } from "./users";
export type { Question, WrongAnswer, Attempt, Tryout, TryoutAccessLevel } from "./questions";
export { badges } from "./badges";
export { levels, getLevelForXp, getNextLevel, getXpProgress } from "./levels";
export { getPlatinumProductForTryout, getProductById, membershipProducts, platinumTryoutProducts, products } from "./entitlements";
export type { Entitlement, Product, ProductType } from "./entitlements";
export type { Poll } from "./polls";
export { categories, getCategoryName, getCategoryColor, getSubCategoryName, getSubCategories } from "./categories";
export { institutions } from "./institutions";
export { AppProvider, useApp } from "./provider";
export type { AppState } from "./provider";

// Helper function
import { type User } from "./users";
export function hasPremiumMembership(user: User): boolean {
  if (!user.entitlementEndsAt) return false;
  return new Date(user.entitlementEndsAt) > new Date();
}

export const isUserPremium = hasPremiumMembership;
