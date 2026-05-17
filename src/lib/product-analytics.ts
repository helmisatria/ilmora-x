import { z } from "zod";

export const acquisitionIntentSchema = z.enum([
  "home_signup",
  "home_tryout",
  "tryout_catalog_signup",
]);

export const analyticsSearchSchema = z.object({
  intent: acquisitionIntentSchema.optional(),
});

export type AcquisitionIntent = z.infer<typeof acquisitionIntentSchema>;

export type ProductAnalyticsProperties = Record<string, unknown>;

export const productAnalyticsEvents = {
  routeViewed: "route_viewed",
  homeSignupSelected: "home_signup_selected",
  homeTryoutSelected: "home_tryout_selected",
  signupStarted: "signup_started",
  accountCreated: "account_created",
  profileStepAdvanced: "profile_step_advanced",
  profileCompleted: "profile_completed",
  tryoutCatalogViewed: "tryout_catalog_viewed",
  tryoutCatalogSignupStarted: "tryout_catalog_signup_started",
  attemptAutosaveFailed: "attempt_autosave_failed",
  resultViewed: "result_viewed",
  tryoutStarted: "tryout_started",
  tryoutSubmitted: "tryout_submitted",
  tryoutReviewOpened: "tryout_review_opened",
  questionReported: "question_reported",
  materiBacklinkOpened: "materi_backlink_opened",
} as const;

export function getAcquisitionIntent(value: unknown): AcquisitionIntent | undefined {
  const result = acquisitionIntentSchema.safeParse(value);

  if (!result.success) {
    return undefined;
  }

  return result.data;
}

export function getLoginCallbackUrl(intent: AcquisitionIntent | undefined) {
  if (!intent) {
    return "/auth/complete-profile";
  }

  const params = new URLSearchParams({ intent });

  return `/auth/complete-profile?${params.toString()}`;
}
