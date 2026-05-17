import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { adminMembers } from "../db/schema";
import { forbidden } from "../http/errors";

export type AdminRole = "admin" | "super_admin";

export type AdminMembership = {
  role: AdminRole;
};

export async function getActiveAdminMembership(email: string | null | undefined) {
  if (!email) return null;

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const [membership] = await db
    .select({
      role: adminMembers.role,
    })
    .from(adminMembers)
    .where(and(eq(adminMembers.email, normalizedEmail), isNull(adminMembers.removedAt)))
    .limit(1);

  if (!membership) return null;

  return {
    role: membership.role as AdminRole,
  };
}

export async function requireAdmin(email: string | null | undefined) {
  const membership = await getActiveAdminMembership(email);

  if (membership) {
    return membership;
  }

  throw forbidden("Admin access is required.");
}

export async function requireSuperAdmin(email: string | null | undefined) {
  const membership = await requireAdmin(email);

  if (membership.role === "super_admin") {
    return membership;
  }

  throw forbidden("Super-admin access is required.");
}
