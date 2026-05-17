import { PostHogProvider, usePostHog } from "@posthog/react";
import { useEffect, useMemo, type ReactNode } from "react";
import type { Viewer } from "./auth-functions";
import type { ProductAnalyticsProperties } from "./product-analytics";

type ProductAnalyticsClient = {
  capture: (event: string, properties?: ProductAnalyticsProperties) => void;
  identify: (distinctId: string, properties?: ProductAnalyticsProperties) => void;
};

function getPostHogKey() {
  return import.meta.env.VITE_POSTHOG_KEY || import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN || "";
}

function getPostHogHost() {
  return import.meta.env.VITE_POSTHOG_HOST || import.meta.env.VITE_PUBLIC_POSTHOG_HOST || "";
}

function shouldCaptureInThisEnvironment() {
  if (import.meta.env.PROD) {
    return true;
  }

  return import.meta.env.VITE_POSTHOG_CAPTURE_IN_DEVELOPMENT === "true";
}

function getViewerRole(viewer: Viewer) {
  if (viewer.admin?.role === "super_admin") {
    return "super_admin";
  }

  if (viewer.admin) {
    return "admin";
  }

  return "student";
}

function getViewerProperties(viewer: Viewer): ProductAnalyticsProperties {
  return {
    email: viewer.email,
    name: viewer.profile?.displayName ?? viewer.name,
    institution: viewer.profile?.institution ?? null,
    role: getViewerRole(viewer),
    profile_completed: Boolean(viewer.admin || viewer.profile?.completed),
    impersonated: Boolean(viewer.impersonation),
  };
}

export function ProductAnalyticsProvider({ children }: { children: ReactNode }) {
  const apiKey = getPostHogKey();
  const apiHost = getPostHogHost();

  if (!apiKey || !apiHost || !shouldCaptureInThisEnvironment()) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider
      apiKey={apiKey}
      options={{
        api_host: apiHost,
        capture_pageview: false,
      }}
    >
      {children}
    </PostHogProvider>
  );
}

export function ProductAnalyticsIdentity({ viewer }: { viewer: Viewer | null }) {
  const analytics = useProductAnalytics();

  useEffect(() => {
    if (!viewer) {
      return;
    }

    analytics.identify(viewer.userId, getViewerProperties(viewer));
  }, [analytics, viewer]);

  return null;
}

export function useProductAnalytics(): ProductAnalyticsClient {
  const posthog = usePostHog();

  return useMemo(
    () => ({
      capture(event, properties) {
        posthog?.capture(event, properties);
      },
      identify(distinctId, properties) {
        posthog?.identify(distinctId, properties);
      },
    }),
    [posthog],
  );
}
