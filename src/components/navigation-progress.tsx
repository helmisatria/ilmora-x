import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

// Fast navigations finish before this and show nothing.
const SHOW_DELAY_MS = 80;
// Matches the fade-out in .nav-progress.
const FADE_OUT_MS = 250;

type Phase = "idle" | "loading" | "done";

export function NavigationProgress() {
  const isNavigating = useRouterState({ select: (state) => state.isLoading || state.status === "pending" });
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    if (isNavigating) {
      const timer = setTimeout(() => setPhase("loading"), SHOW_DELAY_MS);

      return () => clearTimeout(timer);
    }

    setPhase((current) => (current === "loading" ? "done" : "idle"));
    const timer = setTimeout(() => setPhase("idle"), FADE_OUT_MS);

    return () => clearTimeout(timer);
  }, [isNavigating]);

  return <div aria-hidden="true" className="nav-progress" data-phase={phase} />;
}
