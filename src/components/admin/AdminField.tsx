import { cloneElement, isValidElement, useId } from "react";
import type { ReactElement, ReactNode } from "react";

// Labels a single native control and shows its inline error or hint.
// data-field lets a form focus the first invalid control.
export function AdminField({
  label,
  field,
  error,
  hint,
  children,
}: {
  label: string;
  field?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  if (!isValidElement(children)) return null;

  const control = children as ReactElement<Record<string, unknown>>;
  const className = String(control.props.className ?? "");

  return (
    <div className="block min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-stone-600">{label}</label>
      {cloneElement(control, {
        id,
        "data-field": field,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error || hint ? messageId : undefined,
        className: error ? `${className} admin-control-invalid` : className,
      })}
      {error ? (
        <p id={messageId} className="admin-field-error">{error}</p>
      ) : (
        hint && <p id={messageId} className="mt-1 text-[11px] font-medium text-stone-400">{hint}</p>
      )}
    </div>
  );
}
