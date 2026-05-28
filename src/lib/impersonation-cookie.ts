export const impersonationCookieName = "ilmorax_impersonation";
export const impersonationMaxAgeSeconds = 60 * 60;

export type ImpersonationPayload = {
  adminUserId: string;
  targetUserId: string;
  issuedAt: number;
};

export async function createImpersonationCookieValue(payload: ImpersonationPayload) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = await signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export async function readImpersonationPayload(headers: Headers) {
  const value = getCookie(headers, impersonationCookieName);

  if (!value) return null;

  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature) return null;

  const expectedSignature = await signValue(encodedPayload);

  if (signature !== expectedSignature) return null;

  const payload = JSON.parse(decodeBase64Url(encodedPayload)) as ImpersonationPayload;
  const ageSeconds = Math.floor(Date.now() / 1000) - payload.issuedAt;

  if (ageSeconds > impersonationMaxAgeSeconds) return null;
  if (!payload.adminUserId || !payload.targetUserId) return null;

  return payload;
}

function getCookie(headers: Headers, name: string) {
  const cookieHeader = headers.get("cookie");

  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [rawName, ...rawValue] = cookie.trim().split("=");

    if (rawName === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}

function encodeBase64Url(value: string) {
  const buffer = getRuntimeBuffer();

  if (buffer) {
    return buffer.from(value).toString("base64url");
  }

  const bytes = new TextEncoder().encode(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function decodeBase64Url(value: string) {
  const buffer = getRuntimeBuffer();

  if (buffer) {
    return buffer.from(value, "base64url").toString("utf8");
  }

  const paddedValue = value.padEnd(Math.ceil(value.length / 4) * 4, "=");
  const base64 = paddedValue.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

function getRuntimeBuffer() {
  return (globalThis as typeof globalThis & {
    Buffer?: {
      from: (value: string, encoding?: BufferEncoding) => {
        toString: (encoding?: BufferEncoding) => string;
      };
    };
  }).Buffer;
}

async function signValue(value: string) {
  const { createHmac } = await import("node:crypto");
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required for impersonation cookies.");
  }

  return createHmac("sha256", secret).update(value).digest("base64url");
}
