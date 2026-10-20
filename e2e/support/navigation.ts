import type { Page } from "@playwright/test";

// Pages are server-rendered, so a visible heading only proves the HTML arrived.
// Client chunks still have to load and hydrate before a click or a keystroke does
// anything. Waiting for the network to settle after the navigation is the one signal
// that works for every route, including the lazily loaded Admin panels.
export async function gotoHydrated(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}
