import { createServerFn } from "@tanstack/react-start";
import { isEmailPasswordAuthEnabled } from "./email-password-auth";

export const getEmailPasswordAuthEnabled = createServerFn({ method: "GET" }).handler(
  () => isEmailPasswordAuthEnabled(),
);
