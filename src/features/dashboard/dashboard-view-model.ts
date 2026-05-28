export const dashboardPalettes = [
  {
    id: "mist",
    name: "Mist",
    page:
      "linear-gradient(180deg, #f4f8f7 0%, #f8faf8 38%, #f5f2ec 100%)",
    header:
      "radial-gradient(900px 340px at 10% -18%, rgba(32,80,114,0.15), transparent 62%), radial-gradient(720px 340px at 94% -12%, #d6c6a81f, transparent 68%), linear-gradient(180deg, #f4f8f7 0%, #fafaf9 100%)",
  },
  {
    id: "paper",
    name: "Paper",
    page:
      "linear-gradient(180deg, #f8f5ef 0%, #fbfaf7 45%, #f1f7f5 100%)",
    header:
      "radial-gradient(900px 340px at 10% -18%, rgba(32,80,114,0.13), transparent 62%), radial-gradient(720px 340px at 94% -12%, #c59f5d24, transparent 68%), linear-gradient(180deg, #f8f5ef 0%, #fbfaf7 100%)",
  },
  {
    id: "clinic",
    name: "Clinic",
    page:
      "linear-gradient(180deg, #eef8f6 0%, #f6fbfa 44%, #f7f3ea 100%)",
    header:
      "radial-gradient(900px 340px at 8% -18%, rgba(32,80,114,0.22), transparent 62%), radial-gradient(720px 340px at 94% -12%, #0ea5e91a, transparent 68%), linear-gradient(180deg, #eef8f6 0%, #fbfaf7 100%)",
  },
  {
    id: "stone",
    name: "Stone",
    page:
      "linear-gradient(180deg, #f2f0eb 0%, #fafaf9 42%, #eef6f3 100%)",
    header:
      "radial-gradient(900px 340px at 10% -18%, #78716c20, transparent 62%), radial-gradient(720px 340px at 94% -12%, rgba(32,80,114,0.13), transparent 68%), linear-gradient(180deg, #f2f0eb 0%, #fafaf9 100%)",
  },
] as const;

export const defaultDashboardPaletteId = "clinic";

type DashboardPaletteId = (typeof dashboardPalettes)[number]["id"];

type DashboardAccuracyInput = {
  totalQuestions: number;
  totalCorrect: number;
};

export function getDashboardPalette(paletteId: DashboardPaletteId = defaultDashboardPaletteId): (typeof dashboardPalettes)[number] {
  return dashboardPalettes.find((item) => item.id === paletteId) ?? dashboardPalettes[0];
}

export function getDashboardAccuracy(summary: DashboardAccuracyInput): number {
  if (summary.totalQuestions <= 0) return 0;

  return Math.round((summary.totalCorrect / summary.totalQuestions) * 100);
}
