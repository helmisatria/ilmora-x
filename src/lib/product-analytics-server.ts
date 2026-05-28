import { PostHog } from "posthog-node";
import type { ProductAnalyticsProperties } from "./product-analytics";

let posthogClient: PostHog | null = null;

function shouldCaptureInThisEnvironment() {
  if (process.env.NODE_ENV === "production") {
    return true;
  }

  return process.env.POSTHOG_CAPTURE_IN_DEVELOPMENT === "true";
}

function getPostHogClient() {
  const apiKey = process.env.POSTHOG_KEY ?? process.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.POSTHOG_HOST ?? process.env.VITE_PUBLIC_POSTHOG_HOST;

  if (!apiKey || !host || !shouldCaptureInThisEnvironment()) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(apiKey, { host });
  }

  return posthogClient;
}

export function identifyProductAnalyticsUser({
  distinctId,
  properties,
}: {
  distinctId: string;
  properties: ProductAnalyticsProperties;
}) {
  const posthog = getPostHogClient();

  if (!posthog) {
    return;
  }

  posthog.identify({
    distinctId,
    properties,
  });
}

export function captureProductAnalyticsEvent({
  distinctId,
  event,
  properties,
}: {
  distinctId: string;
  event: string;
  properties?: ProductAnalyticsProperties;
}) {
  const posthog = getPostHogClient();

  if (!posthog) {
    return;
  }

  posthog.capture({
    distinctId,
    event,
    properties,
  });
}
