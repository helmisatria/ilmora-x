export const levels = [
  { level: 1, title: "Pharmacy Newbie I", xp: 0 },
  { level: 2, title: "Pharmacy Newbie II", xp: 50 },
  { level: 3, title: "Pharmacy Novice I", xp: 100 },
  { level: 4, title: "Pharmacy Novice II", xp: 200 },
  { level: 5, title: "Pharmacy Learner I", xp: 350 },
  { level: 6, title: "Pharmacy Learner II", xp: 550 },
  { level: 7, title: "Pharmacy Student I", xp: 800 },
  { level: 8, title: "Pharmacy Student II", xp: 1100 },
  { level: 9, title: "Pharmacy Apprentice I", xp: 1450 },
  { level: 10, title: "Pharmacy Apprentice II", xp: 1850 },
  { level: 11, title: "Pharmacy Practitioner I", xp: 2300 },
  { level: 12, title: "Pharmacy Practitioner II", xp: 2850 },
  { level: 13, title: "Pharmacy Professional I", xp: 3500 },
  { level: 14, title: "Pharmacy Professional II", xp: 4200 },
  { level: 15, title: "Pharmacy Specialist I", xp: 5000 },
  { level: 16, title: "Pharmacy Specialist II", xp: 5900 },
  { level: 17, title: "Pharmacy Expert I", xp: 6900 },
  { level: 18, title: "Pharmacy Expert II", xp: 8000 },
  { level: 19, title: "Pharmacy Scholar I", xp: 9200 },
  { level: 20, title: "Pharmacy Scholar II", xp: 10500 },
  { level: 21, title: "Pharmacy Master I", xp: 11900 },
  { level: 22, title: "Pharmacy Master II", xp: 13400 },
  { level: 23, title: "Pharmacy Sage I", xp: 15000 },
  { level: 24, title: "Pharmacy Sage II", xp: 16700 },
  { level: 25, title: "Pharmacy Authority I", xp: 18500 },
  { level: 26, title: "Pharmacy Authority II", xp: 20400 },
  { level: 27, title: "Pharmacy Elite I", xp: 22400 },
  { level: 28, title: "Pharmacy Elite II", xp: 24500 },
  { level: 29, title: "Pharmacy Champion I", xp: 26700 },
  { level: 30, title: "Pharmacy Champion II", xp: 29000 },
  { level: 31, title: "Pharmacy Consultant I", xp: 31400 },
  { level: 32, title: "Pharmacy Consultant II", xp: 33900 },
  { level: 33, title: "Pharmacy Professor I", xp: 36500 },
  { level: 34, title: "Pharmacy Professor II", xp: 39200 },
  { level: 35, title: "Pharmacy Legend I", xp: 42000 },
  { level: 36, title: "Pharmacy Legend II", xp: 44900 },
  { level: 37, title: "Pharmacy Hero I", xp: 47900 },
  { level: 38, title: "Pharmacy Hero II", xp: 51000 },
  { level: 39, title: "Pharmacy Titan I", xp: 54200 },
  { level: 40, title: "Pharmacy Titan II", xp: 57500 },
  { level: 41, title: "Pharmacy Immortal I", xp: 60900 },
  { level: 42, title: "Pharmacy Immortal II", xp: 64400 },
  { level: 43, title: "Pharmacy Demigod I", xp: 68000 },
  { level: 44, title: "Pharmacy Demigod II", xp: 71700 },
  { level: 45, title: "Pharmacy Deity I", xp: 75500 },
  { level: 46, title: "Pharmacy Authority Badge", xp: 79400 },
  { level: 47, title: "Pharmacy Grand Master I", xp: 83400 },
  { level: 48, title: "Pharmacy Grand Master II", xp: 87500 },
  { level: 49, title: "Pharmacy Exalted I", xp: 91700 },
  { level: 50, title: "Pharmacy Legendary", xp: 96000 },
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