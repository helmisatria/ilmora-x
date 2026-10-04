import type { listSettingsAudit } from "./admin-settings-audit";

type AuditRow = Awaited<ReturnType<typeof listSettingsAudit>>[number];

export function AdminSettingsAuditList({ rows, emptyText }: { rows: AuditRow[]; emptyText: string }) {
  return (
    <section className="admin-panel mt-4">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Change history</h2>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-5 text-sm font-semibold text-stone-400">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {rows.map((row) => (
            <li key={row.id} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-bold text-stone-800">{row.subject}</span>
                <span className="text-xs font-semibold text-stone-400">
                  {formatAuditDate(row.createdAt)} · {row.adminEmail}
                </span>
              </div>
              <ul className="mt-1 space-y-0.5">
                {row.changes.map((change) => (
                  <li key={change.field} className="text-xs font-semibold text-stone-500">
                    {change.field}: <span className="text-stone-400 line-through">{formatAuditValue(change.before)}</span>{" "}
                    → <span className="text-stone-700">{formatAuditValue(change.after)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatAuditValue(value: AuditRow["changes"][number]["before"]) {
  if (value === null) return "default";
  if (typeof value === "boolean") return value ? "on" : "off";

  return String(value);
}

function formatAuditDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}
