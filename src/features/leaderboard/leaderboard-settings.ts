export const DEFAULT_WEEKLY_PARTICIPANT_THRESHOLD = 10;

export type ParticipantThresholdSource = "admin" | "env" | "default";

// Admin setting wins, then WEEKLY_LEADERBOARD_PARTICIPANT_THRESHOLD, then the built-in default.
export function resolveWeeklyParticipantThreshold({
  adminValue,
  envValue,
}: {
  adminValue: number | null | undefined;
  envValue: string | undefined;
}): { value: number; source: ParticipantThresholdSource } {
  if (isValidThreshold(adminValue)) return { value: adminValue, source: "admin" };

  const configuredThreshold = Number(envValue);

  if (envValue?.trim() && isValidThreshold(configuredThreshold)) {
    return { value: configuredThreshold, source: "env" };
  }

  return { value: DEFAULT_WEEKLY_PARTICIPANT_THRESHOLD, source: "default" };
}

function isValidThreshold(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}
