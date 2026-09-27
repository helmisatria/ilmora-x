// Source: docs/IlmoraX - Structured Reference.md (Level Progression).
export const levels = [
  { level: 1, title: "Pharmacy Newbie I", xp: 0 },
  { level: 2, title: "Pharmacy Newbie II", xp: 100 },
  { level: 3, title: "Pharmacy Novice I", xp: 220 },
  { level: 4, title: "Pharmacy Novice II", xp: 360 },
  { level: 5, title: "Pharmacy Novice III", xp: 520 },
  { level: 6, title: "Pharmacy Trainee I", xp: 700 },
  { level: 7, title: "Pharmacy Trainee II", xp: 900 },
  { level: 8, title: "Pharmacy Trainee III", xp: 1120 },
  { level: 9, title: "Pharmacy Trainee IV", xp: 1360 },
  { level: 10, title: "Pharmacy Trainee V", xp: 1620 },
  { level: 11, title: "Pharmacy Practitioner I", xp: 1900 },
  { level: 12, title: "Pharmacy Practitioner II", xp: 2200 },
  { level: 13, title: "Pharmacy Practitioner III", xp: 2520 },
  { level: 14, title: "Pharmacy Practitioner IV", xp: 2860 },
  { level: 15, title: "Pharmacy Practitioner V", xp: 3220 },
  { level: 16, title: "Pharmacy Professional I", xp: 3620 },
  { level: 17, title: "Pharmacy Professional II", xp: 4050 },
  { level: 18, title: "Pharmacy Professional III", xp: 4510 },
  { level: 19, title: "Pharmacy Professional IV", xp: 5000 },
  { level: 20, title: "Pharmacy Professional V", xp: 5520 },
  { level: 21, title: "Pharmacy Specialist I", xp: 6070 },
  { level: 22, title: "Pharmacy Specialist II", xp: 6650 },
  { level: 23, title: "Pharmacy Specialist III", xp: 7260 },
  { level: 24, title: "Pharmacy Specialist IV", xp: 7900 },
  { level: 25, title: "Pharmacy Specialist V", xp: 8570 },
  { level: 26, title: "Pharmacy Expert I", xp: 9280 },
  { level: 27, title: "Pharmacy Expert II", xp: 10030 },
  { level: 28, title: "Pharmacy Expert III", xp: 10820 },
  { level: 29, title: "Pharmacy Expert IV", xp: 11650 },
  { level: 30, title: "Pharmacy Expert V", xp: 12520 },
  { level: 31, title: "Pharmacy Consultant I", xp: 13430 },
  { level: 32, title: "Pharmacy Consultant II", xp: 14380 },
  { level: 33, title: "Pharmacy Consultant III", xp: 15380 },
  { level: 34, title: "Pharmacy Consultant IV", xp: 16430 },
  { level: 35, title: "Pharmacy Consultant V", xp: 17530 },
  { level: 36, title: "Pharmacy Master I", xp: 18680 },
  { level: 37, title: "Pharmacy Master II", xp: 19880 },
  { level: 38, title: "Pharmacy Master III", xp: 21130 },
  { level: 39, title: "Pharmacy Master IV", xp: 22430 },
  { level: 40, title: "Pharmacy Master V", xp: 23780 },
  { level: 41, title: "Pharmacy Grand-Master I", xp: 25180 },
  { level: 42, title: "Pharmacy Grand-Master II", xp: 26680 },
  { level: 43, title: "Pharmacy Grand-Master III", xp: 28280 },
  { level: 44, title: "Pharmacy Grand-Master IV", xp: 29980 },
  { level: 45, title: "Pharmacy Grand-Master V", xp: 31780 },
  { level: 46, title: "Pharmacy Authority I", xp: 33680 },
  { level: 47, title: "Pharmacy Authority II", xp: 35680 },
  { level: 48, title: "Pharmacy Authority III", xp: 37780 },
  { level: 49, title: "Pharmacy Authority IV", xp: 39980 },
  { level: 50, title: "Pharmacy Legendary", xp: 42280 },
];

export type LevelEntry = (typeof levels)[number];

export function getLevelForXp(xp: number): LevelEntry {
  let result: LevelEntry = levels[0];
  for (const lvl of levels) {
    if (xp >= lvl.xp) result = lvl;
    else break;
  }
  return result;
}

// The tier is the level title without its roman numeral, e.g. "Pharmacy Novice II" -> "Pharmacy Novice".
export function getLevelTier(level: number): string {
  const entry = levels.find((lvl) => lvl.level === level) ?? (level > 1 ? levels[levels.length - 1] : levels[0]);

  return entry.title.replace(/ [IVX]+$/, "");
}

export function getNextLevel(xp: number) {
  const current = getLevelForXp(xp);
  const idx = levels.findIndex((l) => l.level === current.level);
  return idx < levels.length - 1 ? levels[idx + 1] : null;
}

export function getXpProgress(xp: number) {
  const current = getLevelForXp(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  return Math.round(((xp - current.xp) / (next.xp - current.xp)) * 100);
}