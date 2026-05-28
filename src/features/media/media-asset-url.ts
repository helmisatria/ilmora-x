export function makeMediaAssetUrl(mediaId: string) {
  return `/api/media/${encodeURIComponent(mediaId)}`;
}
