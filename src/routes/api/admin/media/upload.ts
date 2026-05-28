import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { HttpError } from "../../../../lib/http/errors";

const maxImageBytes = 5 * 1024 * 1024;
const maxVideoBytes = 100 * 1024 * 1024;

export const Route = createFileRoute("/api/admin/media/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const [
            { getCurrentViewerFromHeaders },
            { requireAdmin },
            { db },
            { mediaAssets },
            { makeMediaAssetUrl },
            { getAllowedMediaType, uploadAdminMediaToS3 },
          ] = await Promise.all([
            import("../../../../lib/auth-functions"),
            import("../../../../features/identity/admin-membership"),
            import("../../../../lib/db/client"),
            import("../../../../lib/db/schema"),
            import("../../../../features/media/media-asset-url"),
            import("../../../../features/media/media-storage.server"),
          ]);
          const viewer = await getCurrentViewerFromHeaders(request.headers);

          if (!viewer) {
            return Response.json({ message: "Authentication is required." }, { status: 401 });
          }

          await requireAdmin(viewer.sessionEmail);

          const formData = await request.formData();
          const file = formData.get("file");

          if (!(file instanceof File)) {
            return Response.json({ message: "Media file is required." }, { status: 400 });
          }

          const mediaType = getAllowedMediaType(file.type);

          if (!mediaType) {
            return Response.json({ message: "Only JPG, PNG, WEBP, GIF, MP4, WEBM, OGG, MOV, or M4V media are supported." }, { status: 400 });
          }

          const maxBytes = getMaxUploadBytes(mediaType);

          if (file.size > maxBytes) {
            const maxMb = Math.floor(maxBytes / 1024 / 1024);
            return Response.json({ message: `Media must be ${maxMb} MB or smaller.` }, { status: 400 });
          }

          const body = Buffer.from(await file.arrayBuffer());
          const upload = await uploadAdminMediaToS3({
            fileName: file.name,
            contentType: file.type,
            body,
            mediaType,
          });
          const mediaId = randomUUID();
          const mediaUrl = makeMediaAssetUrl(mediaId);
          const [createdMedia] = await db
            .insert(mediaAssets)
            .values({
              id: mediaId,
              mediaType,
              fileName: file.name,
              storageKey: upload.key,
              url: mediaUrl,
              contentType: file.type,
              sizeBytes: file.size,
              uploadedByUserId: viewer.sessionUserId,
            })
            .returning({
              id: mediaAssets.id,
              mediaType: mediaAssets.mediaType,
              fileName: mediaAssets.fileName,
              url: mediaAssets.url,
              contentType: mediaAssets.contentType,
              sizeBytes: mediaAssets.sizeBytes,
              createdAt: mediaAssets.createdAt,
            });

          return Response.json({
            ...createdMedia,
            mediaType: createdMedia.mediaType as "image" | "video",
            url: new URL(createdMedia.url, request.url).toString(),
            createdAt: createdMedia.createdAt.toISOString(),
          });
        } catch (error) {
          if (error instanceof HttpError) {
            return Response.json({ message: error.message }, { status: error.status });
          }

          return Response.json({ message: "Media was not uploaded." }, { status: 500 });
        }
      },
    },
  },
});

function getMaxUploadBytes(mediaType: "image" | "video") {
  if (mediaType === "image") return maxImageBytes;

  return maxVideoBytes;
}
