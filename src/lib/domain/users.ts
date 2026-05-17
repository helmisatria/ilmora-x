import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { studentProfiles } from "../db/schema";

export type StudentStatus = "active" | "suspended";

export function isProfileComplete(profile: Pick<typeof studentProfiles.$inferSelect, "displayName" | "institution" | "profileCompletedAt"> | null) {
  if (!profile) return false;
  if (!profile.displayName.trim()) return false;
  if (!profile.institution?.trim()) return false;
  return profile.profileCompletedAt !== null;
}

export async function getStudentProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, userId))
    .limit(1);

  return profile ?? null;
}
