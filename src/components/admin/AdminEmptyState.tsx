import type { ReactNode } from "react";

// The empty state used inside every admin panel and list.
export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="p-8 text-center">
      <p className="text-sm font-semibold text-stone-400">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-xs font-medium text-stone-400">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
