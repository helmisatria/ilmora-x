import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { currentUser, mockUsers, getGradeForLevel, type User } from "./users";
import { mockAttempts, type Attempt } from "./questions";
import { mockBadgeProgress } from "./badges";

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
  isPremium: boolean;
  togglePremium: () => void;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  badgeProgress: typeof mockBadgeProgress;
  leaderboardUsers: LeaderboardEntry[];
  attempts: Attempt[];
  addAttempt: (attempt: Attempt) => void;
  updateAttempt: (id: number, partial: Partial<Attempt>) => void;
}

function checkPremium(user: User): boolean {
  if (!user.entitlementEndsAt) return false;
  return new Date(user.entitlementEndsAt) > new Date();
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

  const isPremium = premiumOverride !== null ? premiumOverride : checkPremium(user);

  const togglePremium = useCallback(() => {
    const nextPremium = premiumOverride !== null ? !premiumOverride : !checkPremium(user);
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

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isPremium,
        togglePremium,
        badgeProgress: mockBadgeProgress,
        leaderboardUsers: leaderboardData,
        attempts: attemptState,
        addAttempt,
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