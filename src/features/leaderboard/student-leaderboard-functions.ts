import { createServerFn } from "@tanstack/react-start";
import { resolveAvatarDisplay } from "../../lib/avatar";
import { getStudentViewer } from "../student/student-viewer.server";
import {
  getJakartaWeekStartDateKey,
  getJakartaWeekWindow,
  listWeeklyLeaderboardEntriesForWeek,
} from "./leaderboard";

export const listLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const viewer = await getStudentViewer();
  const viewerExcludedReason = viewer.admin ? "admin_account" : null;
  const weekStartDate = getJakartaWeekStartDateKey();
  const weekWindow = getJakartaWeekWindow(weekStartDate);
  const rewardsFinaliseAt = new Date(weekWindow.endsAt.getTime() + 5 * 60 * 1000);
  const rows = await listWeeklyLeaderboardEntriesForWeek(weekStartDate);

  const entries = rows.map((row) => {
    const avatar = resolveAvatarDisplay({
      avatar: row.avatar,
      photoUrl: row.photoUrl,
      googlePhotoUrl: row.image,
      fallbackName: row.displayName || row.name,
    });

    return {
      rank: row.rank,
      userId: row.studentUserId,
      name: row.displayName || row.name,
      avatar: avatar.avatar,
      photoUrl: avatar.photoUrl,
      xp: row.xp,
      me: row.studentUserId === viewer.userId,
    };
  });

  return {
    entries,
    week: {
      weekStartDate,
      startsAt: weekWindow.startsAt.toISOString(),
      endsAt: weekWindow.endsAt.toISOString(),
      rewardsFinaliseAt: rewardsFinaliseAt.toISOString(),
    },
    viewerExcludedReason,
  };
});
