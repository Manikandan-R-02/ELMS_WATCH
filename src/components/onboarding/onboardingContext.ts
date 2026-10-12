import { createContext, useContext } from "react";
import type { TourStep } from "./onboarding.types";

export interface OnboardingContextValue {
  /** Starts (or restarts) the main tour from the beginning, regardless of completed/skipped state. */
  startTour: () => void;
  /**
   * Starts a one-off, single-page tour (e.g. a screen's own "Show tour" button in its help
   * modal) built from the given steps. Unlike `startTour`, this never navigates to another route
   * first and never updates the first-run `onboardingStore` completed/skipped flags — it's a
   * purely on-demand walkthrough of whatever screen the user is already on. `onEnd` runs when the
   * tour finishes or is skipped — use it to undo what the steps' `before` hooks opened.
   */
  startScreenTour: (steps: TourStep[], onEnd?: () => void) => void;
  isTourActive: boolean;
}

/**
 * Split into its own (non-component) file so `useOnboarding` doesn't live
 * in the same module as the `OnboardingProvider` component — keeps
 * fast-refresh happy and matches this file's single responsibility (context
 * definition + the hook that reads it, nothing else).
 */
export const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
