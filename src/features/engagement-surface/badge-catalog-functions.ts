import { createServerFn } from "@tanstack/react-start";
import { listEffectiveBadges } from "./engagement-surface";

// Badge catalog with Admin display overrides, for Student pages.
export const listBadgeCatalog = createServerFn({ method: "GET" }).handler(async () => listEffectiveBadges());
