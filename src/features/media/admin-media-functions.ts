import { createServerFn } from "@tanstack/react-start";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../lib/db/client";
import { mediaAssets } from "../../lib/db/schema";
import { parseInput } from "../../lib/http/validation";
import { adminMiddleware } from "../admin/admin-access";
import { makeMediaAssetUrl } from "./media-asset-url";

const mediaListSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  type: z.enum(["all", "image", "video"]).optional().default("all"),
});

const mediaPageSize = 12;

export const listMediaAdmin = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator((input) => parseInput(mediaListSchema, input))
  .handler(async ({ data }) => {
    const page = data.page;
    const offset = (page - 1) * mediaPageSize;
    const whereClause = data.type === "all"
      ? undefined
      : eq(mediaAssets.mediaType, data.type);

    const [mediaRows, countRows] = await Promise.all([
      db
        .select({
          id: mediaAssets.id,
          mediaType: mediaAssets.mediaType,
          fileName: mediaAssets.fileName,
          url: mediaAssets.url,
          contentType: mediaAssets.contentType,
          sizeBytes: mediaAssets.sizeBytes,
          createdAt: mediaAssets.createdAt,
        })
        .from(mediaAssets)
        .where(whereClause)
        .orderBy(desc(mediaAssets.createdAt))
        .limit(mediaPageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(${mediaAssets.id})` })
        .from(mediaAssets)
        .where(whereClause),
    ]);
    const total = Number(countRows[0]?.count ?? 0);
    const pageCount = Math.max(1, Math.ceil(total / mediaPageSize));

    return {
      media: mediaRows.map((row) => ({
        ...row,
        mediaType: row.mediaType as "image" | "video",
        url: makeMediaAssetUrl(row.id),
        createdAt: row.createdAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize: mediaPageSize,
        pageCount,
        total,
      },
    };
  });
