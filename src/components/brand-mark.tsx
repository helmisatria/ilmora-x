import { cn } from "../utils/cn";

type BrandMarkProps = {
  alt?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "size-10 rounded-[12px]",
  md: "size-11 rounded-[13px]",
  lg: "size-16 rounded-[19px]",
} as const;

export function BrandMark({
  alt = "",
  className,
  size = "md",
}: BrandMarkProps) {
  return (
    <img
      src="/ilmorax-mark-128.png"
      alt={alt}
      aria-hidden={alt ? undefined : true}
      decoding="async"
      draggable={false}
      width={128}
      height={128}
      className={cn(
        "shrink-0 object-cover shadow-[0_5px_14px_rgba(32,80,114,0.18)]",
        sizeClasses[size],
        className,
      )}
    />
  );
}
