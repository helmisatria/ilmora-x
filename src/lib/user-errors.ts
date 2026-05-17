const INTERNAL_ERROR_PATTERNS = [
  /failed query:/i,
  /\binsert into\b/i,
  /\bselect\b[\s\S]*\bfrom\b/i,
  /\bupdate\b[\s\S]*\bset\b/i,
  /\bdelete from\b/i,
  /\balter table\b/i,
  /\bcreate table\b/i,
  /\bconstraint\b/i,
  /\bviolates\b/i,
  /\bsyntax error\b/i,
  /\brelation\b.*\bdoes not exist\b/i,
  /\bundefined column\b/i,
  /at\s+[\w$]+\(/i,
];

export function getSafeErrorMessage(error: unknown, fallback: string) {
  if (!error) return fallback;

  const rawMessage = extractErrorMessage(error);

  if (!rawMessage) return fallback;
  if (looksLikeInternalError(rawMessage)) return fallback;

  return rawMessage;
}

function extractErrorMessage(error: unknown) {
  if (error instanceof Error && error.message?.trim()) {
    return error.message.trim();
  }

  if (typeof error === "string") return error.trim();

  if (typeof error === "object" && error !== null) {
    const possible = (error as { message?: unknown }).message;

    if (typeof possible === "string" && possible.trim()) {
      return possible.trim();
    }
  }

  return "";
}

function looksLikeInternalError(message: string) {
  return INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}
