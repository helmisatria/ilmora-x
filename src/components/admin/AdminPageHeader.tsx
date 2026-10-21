import type { ReactNode } from "react";

// The standard top block of every admin page: back link, title, one line of context.
export function AdminPageHeader({
  title,
  description,
  backHref = "/admin",
  backLabel = "Admin",
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  // Pass null on the admin home page, where there is nothing to go back to.
  backHref?: string | null;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="admin-header flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {backHref && <a href={backHref} className="admin-back-link">{backLabel}</a>}
        <h1 className="admin-title min-w-0 break-words">{title}</h1>
        {description && <p className="admin-description">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
