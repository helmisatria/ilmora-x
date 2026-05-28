export type ReturnScrollPage = "evaluation" | "progress";

export function saveReturnScroll(page: ReturnScrollPage): void {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(getReturnScrollKey(page), String(window.scrollY));
}

export function restoreReturnScroll(page: ReturnScrollPage): void {
  if (typeof window === "undefined") return;

  const key = getReturnScrollKey(page);
  const rawValue = sessionStorage.getItem(key);

  if (!rawValue) return;

  sessionStorage.removeItem(key);

  const top = Number(rawValue);

  if (!Number.isFinite(top)) return;

  window.requestAnimationFrame(() => {
    window.scrollTo({ top, behavior: "instant" });
  });
}

function getReturnScrollKey(page: ReturnScrollPage): string {
  return `ilmorax:return-scroll:${page}`;
}
