import type { ReactNode } from "react";

export function AdminPanelHeader({
  id,
  title,
  badge,
  description,
  actions,
}: {
  id?: string;
  title: string;
  badge?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="admin-panel-header sm:flex sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id={id} className="admin-panel-title">{title}</h2>
          {badge}
        </div>
        {description && <p className="mt-1 text-xs font-medium text-stone-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
