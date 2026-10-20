export type CatalogOrderRow = {
  title: string;
  accessLevel: "free" | "premium";
  catalogOrder: number | null;
  publishedAt: string | null;
};

// Mirrors the student catalog query: admin-set order first, then free, then newest, then title.
export function sortTryoutsForCatalog<TRow extends CatalogOrderRow>(rows: TRow[]) {
  return [...rows].sort((first, second) => {
    if (first.catalogOrder !== second.catalogOrder) {
      if (first.catalogOrder === null) return 1;
      if (second.catalogOrder === null) return -1;
      return first.catalogOrder - second.catalogOrder;
    }

    if (first.accessLevel !== second.accessLevel) return first.accessLevel === "free" ? -1 : 1;

    const publishedDelta = toTime(second.publishedAt) - toTime(first.publishedAt);
    if (publishedDelta !== 0) return publishedDelta;

    return first.title.localeCompare(second.title);
  });
}

function toTime(value: string | null) {
  return value ? new Date(value).getTime() : 0;
}
