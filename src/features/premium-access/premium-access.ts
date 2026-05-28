export type TryoutAccessLevel = "free" | "premium";

export type TryoutAccessInput = {
  accessLevel: string;
  hasPremiumMembership: boolean;
  hasLifetimeTryoutPurchase?: boolean;
};

export function normalizeTryoutAccessLevel(accessLevel: string): TryoutAccessLevel {
  if (accessLevel === "premium") return "premium";
  if (accessLevel === "platinum") return "premium";

  return "free";
}

export function isPaidTryout(accessLevel: string) {
  return normalizeTryoutAccessLevel(accessLevel) !== "free";
}

export function hasPremiumMembershipEndsAt(entitlementEndsAt: string | null | undefined) {
  if (!entitlementEndsAt) return false;

  return new Date(entitlementEndsAt) > new Date();
}

export function resolveTryoutAccess({
  accessLevel,
  hasPremiumMembership,
  hasLifetimeTryoutPurchase = false,
}: TryoutAccessInput) {
  const normalizedAccessLevel = normalizeTryoutAccessLevel(accessLevel);
  const paid = isPaidTryout(normalizedAccessLevel);
  const accessible = !paid || hasPremiumMembership || hasLifetimeTryoutPurchase;

  return {
    accessLevel: normalizedAccessLevel,
    paid,
    free: !paid,
    owned: hasLifetimeTryoutPurchase,
    accessible,
    locked: !accessible,
    hasExtendedPracticeAccess: paid && accessible,
  };
}

export function hasFullTryoutReviewAccess({
  accessLevel,
  hasPremiumMembership,
  hasLifetimeTryoutPurchase = false,
}: TryoutAccessInput) {
  if (hasPremiumMembership) return true;
  if (hasLifetimeTryoutPurchase) return true;

  return isPaidTryout(accessLevel);
}

export function isPremiumQuestionLocked({
  questionAccessLevel,
  tryoutAccessLevel,
  hasPremiumMembership,
  hasLifetimeTryoutPurchase = false,
}: {
  questionAccessLevel: string;
  tryoutAccessLevel: string;
  hasPremiumMembership: boolean;
  hasLifetimeTryoutPurchase?: boolean;
}) {
  if (questionAccessLevel !== "premium") return false;

  return !hasFullTryoutReviewAccess({
    accessLevel: tryoutAccessLevel,
    hasPremiumMembership,
    hasLifetimeTryoutPurchase,
  });
}
