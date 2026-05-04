import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { currentUser, mockUsers, getGradeForLevel, type User } from "./users";
import { mockAttempts, type Attempt, type Question, type Tryout } from "./questions";
import { mockBadgeProgress } from "./badges";
import { mockEntitlements, type Entitlement } from "./entitlements";

export interface LeaderboardEntry {
  r: number;
  n: string;
  xp: number;
  a: string;
  photoUrl?: string;
  ch: "up" | "down";
  me: boolean;
  level: number;
  grade: string;
}

export interface AppState {
  user: User;
  hasPremiumMembership: boolean;
  ownedTryoutIds: number[];
  togglePremiumMembership: () => void;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  badgeProgress: typeof mockBadgeProgress;
  leaderboardUsers: LeaderboardEntry[];
  attempts: Attempt[];
  entitlements: Entitlement[];
  addAttempt: (attempt: Attempt) => void;
  addEntitlement: (entitlement: Entitlement) => void;
  canAccessTryout: (tryout: Tryout) => boolean;
  canAccessQuestion: (question: Question, tryout: Tryout) => boolean;
  ownsTryout: (tryoutId: number) => boolean;
  updateAttempt: (id: number, partial: Partial<Attempt>) => void;
}

function checkPremiumMembership(user: User): boolean {
  if (!user.entitlementEndsAt) return false;
  return new Date(user.entitlementEndsAt) > new Date();
}

function getOwnedTryoutIds(userId: number, entitlements: Entitlement[]) {
  return entitlements
    .filter((entitlement) => entitlement.userId === userId)
    .filter((entitlement) => entitlement.contentType === "tryout")
    .filter((entitlement) => !entitlement.endsAt || new Date(entitlement.endsAt) > new Date())
    .map((entitlement) => entitlement.contentId)
    .filter((contentId): contentId is number => typeof contentId === "number");
}

const leaderboardData: LeaderboardEntry[] = mockUsers
  .filter((u) => !u.isAdmin)
  .sort((a, b) => b.weeklyXp - a.weeklyXp)
  .map((u, i) => ({
    r: i + 1,
    n: u.name,
    xp: u.weeklyXp,
    a: u.avatar,
    photoUrl: u.googlePhotoUrl || undefined,
    ch: (i === 0 ? "up" : i === 1 ? "up" : i % 2 === 0 ? "up" : "down") as "up" | "down",
    me: u.id === currentUser.id,
    level: u.level,
    grade: getGradeForLevel(u.level),
  }));

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(currentUser);
  const [premiumOverride, setPremiumOverride] = useState<boolean | null>(null);
  const [attemptState, setAttemptState] = useState<Attempt[]>(mockAttempts);
  const [entitlementState, setEntitlementState] = useState<Entitlement[]>(mockEntitlements);

  const hasPremiumMembership = premiumOverride !== null ? premiumOverride : checkPremiumMembership(user);
  const ownedTryoutIds = getOwnedTryoutIds(user.id, entitlementState);

  const togglePremiumMembership = useCallback(() => {
    const nextPremium = premiumOverride !== null ? !premiumOverride : !checkPremiumMembership(user);
    setPremiumOverride(nextPremium);
    if (nextPremium) {
      const today = new Date();
      const end = new Date();
      end.setDate(today.getDate() + 30);
      setUser((u) => ({
        ...u,
        entitlementStartsAt: today.toISOString().split('T')[0],
        entitlementEndsAt: end.toISOString().split('T')[0],
      }));
    } else {
      setUser((u) => ({
        ...u,
        entitlementStartsAt: null,
        entitlementEndsAt: null,
      }));
    }
  }, [premiumOverride, user, setUser]);

  const addAttempt = useCallback((attempt: Attempt) => {
    setAttemptState((prev) => [...prev, attempt]);
  }, []);

  const updateAttempt = useCallback((id: number, partial: Partial<Attempt>) => {
    setAttemptState((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...partial } : a))
    );
  }, []);

  const addEntitlement = useCallback((entitlement: Entitlement) => {
    setEntitlementState((prev) => [...prev, entitlement]);
  }, []);

  const ownsTryout = useCallback((tryoutId: number) => {
    return getOwnedTryoutIds(user.id, entitlementState).includes(tryoutId);
  }, [entitlementState, user.id]);

  const canAccessTryout = useCallback((tryout: Tryout) => {
    if (tryout.accessLevel === "free") return true;
    if (hasPremiumMembership) return true;
    if (tryout.accessLevel === "platinum") return ownsTryout(tryout.id);
    return false;
  }, [hasPremiumMembership, ownsTryout]);

  const canAccessQuestion = useCallback((question: Question, tryout: Tryout) => {
    if (canAccessTryout(tryout)) return true;
    if (question.accessLevel === "free") return true;
    return hasPremiumMembership;
  }, [canAccessTryout, hasPremiumMembership]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        hasPremiumMembership,
        ownedTryoutIds,
        togglePremiumMembership,
        badgeProgress: mockBadgeProgress,
        leaderboardUsers: leaderboardData,
        attempts: attemptState,
        entitlements: entitlementState,
        addAttempt,
        addEntitlement,
        canAccessTryout,
        canAccessQuestion,
        ownsTryout,
        updateAttempt,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
