import { createServerFn } from "@tanstack/react-start";
import { sql, type SQL } from "drizzle-orm";
import { db } from "../../lib/db/client";
import { superAdminMiddleware } from "./admin-access";

type SerializableJson =
  | null
  | boolean
  | number
  | string
  | SerializableJson[]
  | { [key: string]: SerializableJson };

type PgBossQueueRow = {
  name: string;
  policy: string;
  retryLimit: number;
  retryDelay: number;
  retryBackoff: boolean;
  expireSeconds: number;
  retentionSeconds: number;
  deletionSeconds: number;
  deadLetter: string | null;
  deferredCount: number;
  queuedCount: number;
  activeCount: number;
  totalCount: number;
  warningQueued: number;
  createdCount: number;
  retryCount: number;
  completedCount: number;
  cancelledCount: number;
  failedCount: number;
  oldestQueuedAt: Date | null;
  newestFailedAt: Date | null;
  monitorOn: Date | null;
  maintainOn: Date | null;
  createdOn: Date;
  updatedOn: Date;
};

type PgBossScheduleRow = {
  name: string;
  key: string;
  cron: string;
  timezone: string | null;
  data: SerializableJson;
  options: SerializableJson;
  createdOn: Date;
  updatedOn: Date;
};

async function executeRows<T>(query: SQL) {
  const result = (await db.execute(query)) as unknown;

  if (Array.isArray(result)) return result as T[];
  if (!result || typeof result !== "object") return [];
  if (!("rows" in result) || !Array.isArray(result.rows)) return [];

  return result.rows as T[];
}

async function pgBossTableExists(tableName: string) {
  const [row] = await executeRows<{ exists: boolean }>(sql`
    select exists (
      select 1
      from information_schema.tables
      where table_schema = 'pgboss'
        and table_name = ${tableName}
    ) as "exists"
  `);

  return row?.exists === true;
}

export const getQueueMonitoringAdmin = createServerFn({ method: "GET" })
  .middleware([superAdminMiddleware])
  .handler(async () => {
    const hasQueueTable = await pgBossTableExists("queue");
    const hasScheduleTable = await pgBossTableExists("schedule");
    const hasJobTable = await pgBossTableExists("job");

    if (!hasQueueTable && !hasScheduleTable && !hasJobTable) {
      return {
        installed: false,
        queues: [] as PgBossQueueRow[],
        schedules: [] as PgBossScheduleRow[],
      };
    }

    const queues = hasQueueTable && hasJobTable
      ? await executeRows<PgBossQueueRow>(sql`
          select
            q.name,
            q.policy,
            q.retry_limit as "retryLimit",
            q.retry_delay as "retryDelay",
            q.retry_backoff as "retryBackoff",
            q.expire_seconds as "expireSeconds",
            q.retention_seconds as "retentionSeconds",
            q.deletion_seconds as "deletionSeconds",
            q.dead_letter as "deadLetter",
            q.deferred_count as "deferredCount",
            q.queued_count as "queuedCount",
            q.active_count as "activeCount",
            q.total_count as "totalCount",
            q.warning_queued as "warningQueued",
            coalesce(count(j.id) filter (where j.state = 'created'::pgboss.job_state), 0)::int as "createdCount",
            coalesce(count(j.id) filter (where j.state = 'retry'::pgboss.job_state), 0)::int as "retryCount",
            coalesce(count(j.id) filter (where j.state = 'completed'::pgboss.job_state), 0)::int as "completedCount",
            coalesce(count(j.id) filter (where j.state = 'cancelled'::pgboss.job_state), 0)::int as "cancelledCount",
            coalesce(count(j.id) filter (where j.state = 'failed'::pgboss.job_state), 0)::int as "failedCount",
            min(j.created_on) filter (where j.state in ('created'::pgboss.job_state, 'retry'::pgboss.job_state)) as "oldestQueuedAt",
            max(j.completed_on) filter (where j.state = 'failed'::pgboss.job_state) as "newestFailedAt",
            q.monitor_on as "monitorOn",
            q.maintain_on as "maintainOn",
            q.created_on as "createdOn",
            q.updated_on as "updatedOn"
          from pgboss.queue q
          left join pgboss.job j on j.name = q.name
          group by q.name
          order by q.name
        `)
      : hasQueueTable
        ? await executeRows<PgBossQueueRow>(sql`
            select
              q.name,
              q.policy,
              q.retry_limit as "retryLimit",
              q.retry_delay as "retryDelay",
              q.retry_backoff as "retryBackoff",
              q.expire_seconds as "expireSeconds",
              q.retention_seconds as "retentionSeconds",
              q.deletion_seconds as "deletionSeconds",
              q.dead_letter as "deadLetter",
              q.deferred_count as "deferredCount",
              q.queued_count as "queuedCount",
              q.active_count as "activeCount",
              q.total_count as "totalCount",
              q.warning_queued as "warningQueued",
              0::int as "createdCount",
              0::int as "retryCount",
              0::int as "completedCount",
              0::int as "cancelledCount",
              0::int as "failedCount",
              null::timestamp with time zone as "oldestQueuedAt",
              null::timestamp with time zone as "newestFailedAt",
              q.monitor_on as "monitorOn",
              q.maintain_on as "maintainOn",
              q.created_on as "createdOn",
              q.updated_on as "updatedOn"
            from pgboss.queue q
            order by q.name
          `)
        : [];

    const schedules = hasScheduleTable
      ? await executeRows<PgBossScheduleRow>(sql`
          select
            name,
            key,
            cron,
            timezone,
            data,
            options,
            created_on as "createdOn",
            updated_on as "updatedOn"
          from pgboss.schedule
          order by name, key
        `)
      : [];

    return {
      installed: true,
      queues,
      schedules,
    };
  });
