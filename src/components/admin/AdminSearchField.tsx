import type { ChangeEvent } from "react";

export function AdminSearchField({
  label,
  value,
  onChange,
  placeholder,
  className = "w-full sm:w-64",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`relative block ${className}`}>
      <SearchIcon />
      <input
        type="search"
        aria-label={label}
        className="admin-control pl-9"
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" fill="none" aria-hidden="true">
      <path d="m20 20-4.2-4.2M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
