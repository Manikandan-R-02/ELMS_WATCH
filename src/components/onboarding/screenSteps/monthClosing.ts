import type { TourStep } from "../onboarding.types";

/**
 * On-demand "Show tour" walkthrough for MonthClosingPage — started from that
 * page's own help modal (see `useOnboarding().startScreenTour`), not part of the
 * cross-route first-run tour in `tourSteps.ts`. One file per screen under this
 * folder so multiple screens' tours can be authored/edited independently without
 * touching a single shared registry file.
 */
export const monthClosingTourSteps: TourStep[] = [
  {
    id: "month-closing-header",
    target: '[data-tour="month-closing-header"]',
    title: "Month Closing",
    description: "Locks the current working period for every screen in the app and advances the whole application to the next month. This is global — it isn't per-location.",
    side: "bottom",
    align: "start",
  },
  {
    id: "month-closing-card",
    target: '[data-tour="month-closing-card"]',
    title: "Read this before closing",
    description: "Closing a month is permanent and cannot be undone. Once closed, no further entries can be made for this period. Don't close a month that's already closed, or one still under review.",
    side: "top",
    align: "start",
  },
  {
    id: "month-closing-button",
    target: '[data-tour="month-closing-button"]',
    title: "Close the month",
    description: "Click here to confirm. After closing, the page reloads automatically so every screen picks up the new working period — there is no reopen action.",
    side: "top",
    align: "center",
  },
];
