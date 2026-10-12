import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * First-time-user tour completion state — same persisted-Zustand pattern as
 * numberFormatStore/layoutStore, so it's consistent with how the rest of the
 * app remembers a preference. localStorage (not sessionStorage, unlike
 * authStore) so a returning user isn't shown the full tour again after
 * closing the tab, the same way `hasCompletedTour`/`hasSkippedTour` would
 * work with a raw `localStorage.getItem("elmswatch_onboarding_completed")`
 * check — this just keeps that logic in one typed, reactive place instead of
 * scattered `localStorage` calls.
 */
interface OnboardingState {
  hasCompletedTour: boolean;
  hasSkippedTour: boolean;
  /** User reached the last step and clicked Finish. */
  markCompleted: () => void;
  /** User closed/escaped out of the tour before finishing. */
  markSkipped: () => void;
  /** Used by "Restart Tour" — clears the flags so `OnboardingProvider` can treat this as a fresh run when `startTour()` is called explicitly (restart doesn't depend on these flags, but resetting keeps state consistent if the tour is completed again). */
  resetTourState: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedTour: false,
      hasSkippedTour: false,
      markCompleted: () => set({ hasCompletedTour: true, hasSkippedTour: false }),
      markSkipped: () => set({ hasSkippedTour: true }),
      resetTourState: () => set({ hasCompletedTour: false, hasSkippedTour: false }),
    }),
    { name: "elmswatch_onboarding_completed" }
  )
);
