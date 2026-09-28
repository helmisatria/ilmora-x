export const announcementPlacements = ["all", "landing", "app"] as const;

export type AnnouncementPlacement = (typeof announcementPlacements)[number];
export type AnnouncementSurface = "landing" | "app";
export type AnnouncementStatus = "live" | "scheduled" | "expired" | "disabled";

type AnnouncementWindow = {
  active: boolean;
  startsAt: Date | string;
  endsAt: Date | string;
};

export function getAnnouncementStatus(announcement: AnnouncementWindow, now = new Date()): AnnouncementStatus {
  if (!announcement.active) return "disabled";

  const nowMs = now.getTime();

  if (new Date(announcement.startsAt).getTime() > nowMs) return "scheduled";
  if (new Date(announcement.endsAt).getTime() <= nowMs) return "expired";

  return "live";
}

// Placements whose announcement should appear on the given surface.
export function getPlacementsForSurface(surface: AnnouncementSurface): AnnouncementPlacement[] {
  return ["all", surface];
}

export function isAnnouncementCtaUrl(value: string) {
  if (isAppPath(value)) return true;

  return /^https:\/\//i.test(value);
}

// Uploaded Media links are absolute, and may be http:// on a local dev server.
export function isAnnouncementImageUrl(value: string) {
  if (isAppPath(value)) return true;

  return /^https?:\/\//i.test(value);
}

function isAppPath(value: string) {
  if (!value.startsWith("/")) return false;

  try {
    return new URL(value, "https://announcement.invalid").origin === "https://announcement.invalid";
  } catch {
    return false;
  }
}

export function parseAnnouncementPlacement(value: string): AnnouncementPlacement {
  if (value === "landing" || value === "app") return value;

  return "all";
}
