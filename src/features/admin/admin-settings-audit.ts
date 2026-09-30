import { desc, eq } from "drizzle-orm";
import { db } from "../../lib/db/client";
import { activityEvents } from "../../lib/db/schema";

type SettingsAuditEventType = "admin_leaderboard_settings_updated" | "admin_badge_settings_updated";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type SettingsAuditChange = {
  field: string;
  before: string | number | boolean | null;
  after: string | number | boolean | null;
};

export async function recordSettingsAudit(
  tx: Transaction,
  {
    eventType,
    admin,
    subject,
    changes,
  }: {
    eventType: SettingsAuditEventType;
    admin: { sessionUserId: string; sessionEmail: string };
    subject: string;
    changes: SettingsAuditChange[];
  },
) {
  await tx.insert(activityEvents).values({
    eventType,
    metadata: {
      adminUserId: admin.sessionUserId,
      adminEmail: admin.sessionEmail,
      subject,
      changes,
    },
  });
}

export async function listSettingsAudit(eventType: SettingsAuditEventType, limit = 20) {
  const rows = await db
    .select({
      id: activityEvents.id,
      metadata: activityEvents.metadata,
      createdAt: activityEvents.createdAt,
    })
    .from(activityEvents)
    .where(eq(activityEvents.eventType, eventType))
    .orderBy(desc(activityEvents.createdAt))
    .limit(limit);

  return rows.map((row) => {
    const metadata = (row.metadata ?? {}) as {
      adminEmail?: string;
      subject?: string;
      changes?: SettingsAuditChange[];
    };

    return {
      id: row.id,
      adminEmail: metadata.adminEmail ?? "Unknown Admin",
      subject: metadata.subject ?? "",
      changes: Array.isArray(metadata.changes) ? metadata.changes : [],
      createdAt: row.createdAt.toISOString(),
    };
  });
}
