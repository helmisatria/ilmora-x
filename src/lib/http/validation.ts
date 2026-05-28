import { z } from "zod";
import { badRequest } from "./errors";

export function parseInput<TSchema extends z.ZodTypeAny>(schema: TSchema, input: unknown) {
  const result = schema.safeParse(input);

  if (result.success) {
    return result.data as z.infer<TSchema>;
  }

  throw badRequest("Invalid input.", result.error.flatten());
}
