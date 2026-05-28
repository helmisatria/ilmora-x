import type { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type UploadQuestionPictureInput = {
  fileName: string;
  contentType: string;
  body: Buffer;
};

type UploadAdminMediaInput = UploadQuestionPictureInput & {
  mediaType?: MediaAssetType;
};

export type MediaAssetType = "image" | "video";

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const allowedVideoTypes = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-m4v",
]);

const safeMediaExtensions = new Set([
  ".gif",
  ".jpeg",
  ".jpg",
  ".m4v",
  ".mov",
  ".mp4",
  ".ogg",
  ".png",
  ".webm",
  ".webp",
]);

export function isAllowedQuestionPictureType(contentType: string) {
  return allowedImageTypes.has(contentType);
}

export function getAllowedMediaType(contentType: string): MediaAssetType | null {
  if (allowedImageTypes.has(contentType)) return "image";
  if (allowedVideoTypes.has(contentType)) return "video";

  return null;
}

export async function uploadAdminMediaToS3({
  fileName,
  contentType,
  body,
  mediaType,
}: UploadAdminMediaInput) {
  const resolvedMediaType = mediaType ?? getAllowedMediaType(contentType);

  if (!resolvedMediaType) {
    throw new Error("Unsupported media type.");
  }

  const bucket = getRequiredEnv("AWS_S3_BUCKET_NAME");
  const key = makeMediaKey(fileName, resolvedMediaType);
  const client = makeS3Client();

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));

  return {
    key,
    mediaType: resolvedMediaType,
  };
}

export async function uploadQuestionPictureToS3({
  fileName,
  contentType,
  body,
}: UploadQuestionPictureInput) {
  return uploadAdminMediaToS3({
    fileName,
    contentType,
    body,
    mediaType: "image",
  });
}

export async function getMediaObjectFromS3({
  key,
  range,
}: {
  key: string;
  range?: string | null;
}) {
  const bucket = getRequiredEnv("AWS_S3_BUCKET_NAME");
  const client = makeS3Client();

  return client.send(new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    Range: range || undefined,
  }));
}

function makeS3Client() {
  const endpoint = process.env.AWS_ENDPOINT_URL?.trim();
  const region = process.env.AWS_DEFAULT_REGION?.trim() || "auto";
  const accessKeyId = getRequiredEnv("AWS_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("AWS_SECRET_ACCESS_KEY");

  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: getForcePathStyle(endpoint),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function getForcePathStyle(endpoint: string | undefined) {
  const rawValue = process.env.AWS_S3_FORCE_PATH_STYLE?.trim().toLowerCase();

  if (rawValue === "false") return false;
  if (rawValue === "true") return true;

  return Boolean(endpoint);
}

function makeMediaKey(fileName: string, mediaType: MediaAssetType) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const extension = getSafeExtension(fileName);

  return `media/${mediaType}s/${year}/${month}/${randomUUID()}${extension}`;
}

function getSafeExtension(fileName: string) {
  const extension = extname(fileName).toLowerCase();

  if (safeMediaExtensions.has(extension)) return extension;

  return "";
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (value) return value;

  throw new Error(`${name} is required.`);
}
