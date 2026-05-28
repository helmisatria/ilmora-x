import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";

export const Route = createFileRoute("/api/media/$mediaId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const mediaId = params.mediaId?.trim();

        if (!mediaId) {
          return Response.json({ message: "Media ID is required." }, { status: 400 });
        }

        try {
          const [{ db }, { mediaAssets }, { getMediaObjectFromS3 }] = await Promise.all([
            import("../../lib/db/client"),
            import("../../lib/db/schema"),
            import("../../features/media/media-storage.server"),
          ]);
          const [media] = await db
            .select({
              storageKey: mediaAssets.storageKey,
              fileName: mediaAssets.fileName,
              contentType: mediaAssets.contentType,
            })
            .from(mediaAssets)
            .where(eq(mediaAssets.id, mediaId))
            .limit(1);

          if (!media) {
            return Response.json({ message: "Media was not found." }, { status: 404 });
          }

          const s3Object = await getMediaObjectFromS3({
            key: media.storageKey,
            range: request.headers.get("range"),
          });
          const headers = makeMediaHeaders({
            contentType: s3Object.ContentType ?? media.contentType,
            contentLength: s3Object.ContentLength,
            contentRange: s3Object.ContentRange,
            eTag: s3Object.ETag,
            lastModified: s3Object.LastModified,
            fileName: media.fileName,
          });

          return new Response(toResponseBody(s3Object.Body), {
            status: s3Object.ContentRange ? 206 : 200,
            headers,
          });
        } catch {
          return Response.json({ message: "Media could not be loaded." }, { status: 500 });
        }
      },
    },
  },
});

function makeMediaHeaders({
  contentType,
  contentLength,
  contentRange,
  eTag,
  lastModified,
  fileName,
}: {
  contentType: string;
  contentLength?: number;
  contentRange?: string;
  eTag?: string;
  lastModified?: Date;
  fileName: string;
}) {
  const headers = new Headers();

  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("Content-Disposition", makeInlineContentDisposition(fileName));
  headers.set("Content-Type", contentType);

  if (contentLength !== undefined) {
    headers.set("Content-Length", String(contentLength));
  }

  if (contentRange) {
    headers.set("Content-Range", contentRange);
  }

  if (eTag) {
    headers.set("ETag", eTag);
  }

  if (lastModified) {
    headers.set("Last-Modified", lastModified.toUTCString());
  }

  return headers;
}

function makeInlineContentDisposition(fileName: string) {
  const safeFileName = fileName.replace(/["\r\n]/g, "");

  return `inline; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

function toResponseBody(body: unknown): BodyInit | null {
  if (!body) return null;
  if (body instanceof ReadableStream) return body;
  if (body instanceof Blob) return body;
  if (body instanceof ArrayBuffer) return body;
  if (body instanceof Uint8Array) {
    const bytes = new Uint8Array(body.byteLength);

    bytes.set(body);
    return bytes.buffer;
  }
  if (typeof body === "string") return body;

  const streamBody = body as { transformToWebStream?: () => ReadableStream<Uint8Array> };

  if (streamBody.transformToWebStream) {
    return streamBody.transformToWebStream();
  }

  throw new Error("Unsupported media response body.");
}
