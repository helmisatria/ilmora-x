import { useState } from "react";
import { TryoutIcon, tryoutIconOptions } from "../TryoutIcon";

const maxIconUploadBytes = 160 * 1024;

type TryoutIconFieldProps = {
  value: string;
  accent?: string;
  tryoutId?: string;
  onChange: (value: string) => void;
  onError: (message: string) => void;
};

export function TryoutIconField({
  value,
  accent = "#205072",
  tryoutId,
  onChange,
  onError,
}: TryoutIconFieldProps) {
  const [hoveredIcon, setHoveredIcon] = useState("");

  const uploadIcon = (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onError("Try-out icon must be an image file.");
      return;
    }

    if (file.type === "image/svg+xml") {
      onError("Use PNG, JPG, or WebP for uploaded Try-out icons.");
      return;
    }

    if (file.size > maxIconUploadBytes) {
      onError("Try-out icon upload must be 160 KB or smaller.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        onError("Try-out icon could not be read.");
        return;
      }

      onChange(reader.result);
    };

    reader.onerror = () => {
      onError("Try-out icon could not be read.");
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2"
          style={{
            color: accent,
            background: `${accent}18`,
            borderColor: `${accent}28`,
          }}
        >
          <TryoutIcon icon={value || null} tryoutId={tryoutId} />
        </div>

        <div className="flex flex-wrap gap-2">
          {tryoutIconOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-colors ${
                value === option.value
                  ? "border-primary bg-primary-tint text-primary"
                  : "border-stone-200 bg-white text-stone-500 hover:border-primary-soft hover:bg-primary-tint"
              }`}
              onClick={() => onChange(option.value)}
              onMouseEnter={() => setHoveredIcon(option.value)}
              onMouseLeave={() => setHoveredIcon("")}
              aria-label={`Use ${option.label} icon`}
            >
              <TryoutIcon icon={option.value} className="h-5 w-5" />
              <span
                className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 text-[11px] font-bold text-white shadow-sm transition-opacity ${
                  hoveredIcon === option.value ? "opacity-100" : "opacity-0"
                }`}
              >
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="admin-button-secondary cursor-pointer">
          Upload icon
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => uploadIcon(event.target.files?.[0])}
          />
        </label>
        <button
          type="button"
          className="admin-button-ghost"
          onClick={() => onChange("")}
        >
          Use default
        </button>
      </div>
    </div>
  );
}
