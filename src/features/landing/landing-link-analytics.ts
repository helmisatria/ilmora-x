import { type AcquisitionIntent, productAnalyticsEvents } from "../../lib/product-analytics";
import { useProductAnalytics } from "../../lib/product-analytics-client";

export type LandingLinkPath = "/tryout" | "/premium" | "/auth/login";

export type LandingLinkEntryPoint =
  | "footer_cta"
  | "hero_primary"
  | "hero_secondary"
  | "landing_nav_login"
  | "landing_nav_signup"
  | "light_link"
  | "pricing_button"
  | "primary_link"
  | "secondary_link";

export function useLandingLinkAnalytics(to: LandingLinkPath, entryPoint: LandingLinkEntryPoint): {
  intent: AcquisitionIntent | undefined;
  trackLandingLinkClick: () => void;
} {
  const analytics = useProductAnalytics();
  const intent = getLandingLinkIntent(to);
  const event = getLandingLinkEvent(intent);

  function trackLandingLinkClick(): void {
    if (!event) return;

    analytics.capture(event, {
      intent,
      source_path: "/",
      entry_point: entryPoint,
    });
  }

  return { intent, trackLandingLinkClick };
}

function getLandingLinkIntent(to: LandingLinkPath): AcquisitionIntent | undefined {
  if (to === "/tryout") return "home_tryout";
  if (to === "/auth/login") return "home_signup";
  return undefined;
}

function getLandingLinkEvent(intent: AcquisitionIntent | undefined): string | null {
  if (intent === "home_tryout") return productAnalyticsEvents.homeTryoutSelected;
  if (intent === "home_signup") return productAnalyticsEvents.homeSignupSelected;
  return null;
}
