import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { resolveAvatarDisplay } from "../lib/avatar";
import type { Viewer } from "../lib/auth-functions";
import type { User } from "./users";

export interface AppState {
  user: User;
  hasPremiumMembership: boolean;
  updateUserAvatar: (avatar: string, photoUrl: string | null) => void;
}

const fallbackUser: User = {
  id: 0,
  name: "Pengguna IlmoraX",
  email: "",
  institution: "Belum diisi",
  avatar: "IX",
  googlePhotoUrl: null,
  isAdmin: false,
  adminTier: null,
  entitlementStartsAt: null,
  entitlementEndsAt: null,
  level: 1,
  xp: 0,
  weeklyXp: 0,
  streak: 0,
  referralCode: "-",
  joinDate: new Date().toISOString(),
  completedProfile: false,
  totalQuestions: 0,
  totalCorrect: 0,
  totalTryouts: 0,
};

const AppContext = createContext<AppState | null>(null);

function getUserFromViewer(viewer: Viewer | null): User {
  if (!viewer) return fallbackUser;

  const profile = viewer.profile;
  const name = profile?.displayName || viewer.name || fallbackUser.name;
  const institution = profile?.institution || (viewer.admin ? "IlmoraX HQ" : fallbackUser.institution);
  const avatar = resolveAvatarDisplay({
    avatar: profile?.avatar,
    photoUrl: profile?.photoUrl,
    googlePhotoUrl: viewer.image,
    fallbackName: name,
  });

  return {
    ...fallbackUser,
    name,
    email: viewer.email,
    institution,
    avatar: avatar.avatar,
    googlePhotoUrl: avatar.photoUrl,
    isAdmin: Boolean(viewer.admin),
    adminTier: viewer.admin?.role ?? null,
    completedProfile: Boolean(viewer.admin || profile?.completed),
  };
}

export function AppProvider({ children, viewer = null }: { children: ReactNode; viewer?: Viewer | null }) {
  const [user, setUser] = useState(() => getUserFromViewer(viewer));

  useEffect(() => {
    setUser(getUserFromViewer(viewer));
  }, [viewer]);

  const updateUserAvatar = (avatar: string, photoUrl: string | null) => {
    setUser((currentUser) => ({
      ...currentUser,
      avatar,
      googlePhotoUrl: photoUrl,
    }));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        hasPremiumMembership: false,
        updateUserAvatar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);

  if (!ctx) {
    throw new Error("useApp must be used within AppProvider");
  }

  return ctx;
}
