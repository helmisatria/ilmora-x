import { z } from "zod";
import { acquisitionIntentSchema } from "./product-analytics";

export const postLoginRedirectSchema = z.enum(["/premium"]);

export const authSearchSchema = z.object({
  intent: acquisitionIntentSchema.optional(),
  redirectTo: postLoginRedirectSchema.optional(),
});

export type PostLoginRedirect = z.infer<typeof postLoginRedirectSchema>;

export function getPostLoginRedirectForPath(pathname: string) {
  const result = postLoginRedirectSchema.safeParse(pathname);

  if (!result.success) return undefined;

  return result.data;
}
