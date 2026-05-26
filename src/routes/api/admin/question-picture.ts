import { createFileRoute } from "@tanstack/react-router";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { HttpError } from "../../../lib/http/errors";

const maxPictureBytes = 5 * 1024 * 1024;

export const Route = createFileRoute("/api/admin/question-picture")({
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
          ] = await Promise.all([
            import("../../../lib/auth-functions"),
            import("../../../lib/domain/admin"),
            import("../../../lib/db/client"),
            import("../../../lib/db/schema"),
            import("../../../lib/media-url"),
          ]);
          const viewer = await getCurrentViewerFromHeaders(request.headers);

          if (!viewer) {
            return Response.json({ message: "Authentication is required." }, { status: 401 });
          }

          await requireAdmin(viewer.sessionEmail);

          const formData = await request.formData();
          const file = formData.get("file");

          if (!(file instanceof File)) {
            return Response.json({ message: "Image file is required." }, { status: 400 });
          }

          const { isAllowedQuestionPictureType, uploadQuestionPictureToS3 } = await import("../../../lib/s3-upload.server");

          if (!isAllowedQuestionPictureType(file.type)) {
            return Response.json({ message: "Only JPG, PNG, WEBP, or GIF images are supported." }, { status: 400 });
          }

          if (file.size > maxPictureBytes) {
            return Response.json({ message: "Image must be 5 MB or smaller." }, { status: 400 });
          }

          const body = Buffer.from(await file.arrayBuffer());
          const upload = await uploadQuestionPictureToS3({
            fileName: file.name,
            contentType: file.type,
            body,
          });
          const mediaId = randomUUID();
          const mediaUrl = makeMediaAssetUrl(mediaId);

          await db
            .insert(mediaAssets)
            .values({
              id: mediaId,
              mediaType: "image",
              fileName: file.name,
              storageKey: upload.key,
              url: mediaUrl,
              contentType: file.type,
              sizeBytes: file.size,
              uploadedByUserId: viewer.sessionUserId,
            });

          return Response.json({
            key: upload.key,
            mediaType: upload.mediaType,
            url: new URL(mediaUrl, request.url).toString(),
          });
        } catch (error) {
          if (error instanceof HttpError) {
            return Response.json({ message: error.message }, { status: error.status });
          }

          return Response.json({ message: "Image was not uploaded." }, { status: 500 });
        }
      },
    },
  },
});
