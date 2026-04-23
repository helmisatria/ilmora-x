export interface User {
  id: number;
  name: string;
  email: string;
  institution: string;
  avatar: string;
  isAdmin: boolean;
  adminTier: "admin" | "super_admin" | null;
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

export const currentUser: User = {
  id: 1,
  name: "David",
  email: "dewi@example.com",
  institution: "Universitas Airlangga",
  avatar: "🦉",
  isAdmin: false,
  adminTier: null,
  entitlementEndsAt: null,
  level: 12,
  xp: 4280,
  weeklyXp: 820,
  streak: 7,
  referralCode: "APOT01",
  joinDate: "2026-03-01",
  completedProfile: true,
  totalQuestions: 245,
  totalCorrect: 189,
  totalTryouts: 3,
};

export const mockAdminUser: User = {
  id: 99,
  name: "Admin IlmoraX",
  email: "admin@ilmorax.com",
  institution: "IlmoraX HQ",
  avatar: "🛡️",
  isAdmin: true,
  adminTier: "super_admin",
  entitlementEndsAt: "2099-12-31",
  level: 50,
  xp: 100000,
  weeklyXp: 0,
  streak: 0,
  referralCode: "ADMIN1",
  joinDate: "2026-01-01",
  completedProfile: true,
  totalQuestions: 500,
  totalCorrect: 480,
  totalTryouts: 50,
};

export const mockUsers: User[] = [
  currentUser,
  {
    id: 2,
    name: "Dewi Rahayu",
    email: "dewi.rahayu@example.com",
    institution: "Universitas Airlangga",
    avatar: "👩‍⚕️",
    isAdmin: false,
    adminTier: null,
    entitlementEndsAt: "2026-06-15",
    level: 18,
    xp: 8900,
    weeklyXp: 5420,
    streak: 14,
    referralCode: "DEWI4F",
    joinDate: "2026-01-15",
    completedProfile: true,
    totalQuestions: 820,
    totalCorrect: 650,
    totalTryouts: 22,
  },
  {
    id: 3,
    name: "Budi Santoso",
    email: "budi.s@example.com",
    institution: "Universitas Gadjah Mada",
    avatar: "👨‍⚕️",
    isAdmin: false,
    adminTier: null,
    entitlementEndsAt: null,
    level: 15,
    xp: 5200,
    weeklyXp: 5180,
    streak: 5,
    referralCode: "BUDI7A",
    joinDate: "2026-02-01",
    completedProfile: true,
    totalQuestions: 600,
    totalCorrect: 450,
    totalTryouts: 15,
  },
  {
    id: 4,
    name: "Rani Susanti",
    email: "rani.s@example.com",
    institution: "Universitas Indonesia",
    avatar: "👩",
    isAdmin: false,
    adminTier: null,
    entitlementEndsAt: "2026-08-01",
    level: 16,
    xp: 5800,
    weeklyXp: 4960,
    streak: 10,
    referralCode: "RANI2B",
    joinDate: "2026-01-20",
    completedProfile: true,
    totalQuestions: 550,
    totalCorrect: 420,
    totalTryouts: 18,
  },
  {
    id: 5,
    name: "Joko Pratama",
    email: "joko.p@example.com",
    institution: "Universitas Padjadjaran",
    avatar: "🧑‍🔬",
    isAdmin: false,
    adminTier: null,
    entitlementEndsAt: null,
    level: 10,
    xp: 1850,
    weeklyXp: 4100,
    streak: 3,
    referralCode: "JOKO5C",
    joinDate: "2026-03-05",
    completedProfile: true,
    totalQuestions: 180,
    totalCorrect: 120,
    totalTryouts: 5,
  },
  {
    id: 6,
    name: "Siti Aminah",
    email: "siti.a@example.com",
    institution: "Universitas Hasanuddin",
    avatar: "👩‍🎓",
    isAdmin: false,
    adminTier: null,
    entitlementEndsAt: "2026-07-01",
    level: 14,
    xp: 4100,
    weeklyXp: 3890,
    streak: 8,
    referralCode: "SITI3D",
    joinDate: "2026-02-10",
    completedProfile: true,
    totalQuestions: 400,
    totalCorrect: 310,
    totalTryouts: 12,
  },
  {
    id: 7,
    name: "Andi Wijaya",
    email: "andi.w@example.com",
    institution: "Universitas Brawijaya",
    avatar: "👨",
    isAdmin: false,
    adminTier: null,
    entitlementEndsAt: null,
    level: 8,
    xp: 1200,
    weeklyXp: 3650,
    streak: 2,
    referralCode: "ANDI6E",
    joinDate: "2026-03-10",
    completedProfile: true,
    totalQuestions: 200,
    totalCorrect: 140,
    totalTryouts: 6,
  },
  {
    id: 8,
    name: "Maya Putri",
    email: "maya.p@example.com",
    institution: "Universitas Diponegoro",
    avatar: "👩‍💻",
    isAdmin: false,
    adminTier: null,
    entitlementEndsAt: null,
    level: 6,
    xp: 550,
    weeklyXp: 2800,
    streak: 1,
    referralCode: "MAYA8F",
    joinDate: "2026-04-01",
    completedProfile: true,
    totalQuestions: 100,
    totalCorrect: 65,
    totalTryouts: 3,
  },
  {
    id: 9,
    name: "Rizky Fauzan",
    email: "rizky.f@example.com",
    institution: "Universitas Andalas",
    avatar: "🧑‍💻",
    isAdmin: false,
    adminTier: null,
    entitlementEndsAt: "2026-09-01",
    level: 20,
    xp: 10500,
    weeklyXp: 2200,
    streak: 21,
    referralCode: "RIZK9G",
    joinDate: "2025-12-15",
    completedProfile: true,
    totalQuestions: 1200,
    totalCorrect: 960,
    totalTryouts: 35,
  },
  {
    id: 10,
    name: "Lina Kusuma",
    email: "lina.k@example.com",
    institution: "Universitas Udayana",
    avatar: "👩‍🏫",
    isAdmin: false,
    adminTier: null,
    entitlementEndsAt: null,
    level: 4,
    xp: 200,
    weeklyXp: 1500,
    streak: 0,
    referralCode: "LINA0H",
    joinDate: "2026-04-10",
    completedProfile: true,
    totalQuestions: 50,
    totalCorrect: 30,
    totalTryouts: 1,
  },
];

export function isPremium(user: User): boolean {
  if (!user.entitlementEndsAt) return false;
  return new Date(user.entitlementEndsAt) > new Date();
}

export function getLevelGrade(user: User): string {
  if (user.level >= 46) return "Pharmacy Authority";
  if (user.level >= 36) return "Pharmacy Legend";
  if (user.level >= 26) return "Pharmacy Expert";
  if (user.level >= 16) return "Pharmacy Professional";
  if (user.level >= 11) return "Pharmacy Practitioner";
  if (user.level >= 6) return "Pharmacy Trainee";
  if (user.level >= 3) return "Pharmacy Novice";
  return "Pharmacy Newbie";
}
