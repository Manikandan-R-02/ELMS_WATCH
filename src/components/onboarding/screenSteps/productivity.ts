import type { TourStep } from "../onboarding.types";

/**
 * On-demand "Show tour" walkthrough for ProductivityPage — started from that page's own help modal (see
 * `useOnboarding().startScreenTour`), not part of the cross-route first-run tour in `tourSteps.ts`. This
 * screen edits inline in its table, with no dialogs or tabs, so no step needs to change the page first.
 * Visits every control in reading order: the reporting month, Refresh, search, the unsaved-changes marker,
 * Save and the table itself. The unsaved marker only exists once a value has been edited, so its step is
 * skipped until then; the tour never edits or saves a value.
 */
export const productivityTourSteps: TourStep[] = [
  {
    id: "productivity-header",
    target: '[data-tour="productivity-header"]',
    title: "Productivity Summary",
    description: "Every location's Productivity value for the reporting month. The ? button beside the title opens this guide again.",
    side: "bottom",
    align: "start",
  },
  {
    id: "productivity-period",
    target: '[data-tour="period-picker"]',
    requireVisible: true,
    title: "Change the period",
    description: "Use the month picker in the top header to switch the reporting month — the list reloads for that month and any unsaved edits are discarded.",
    side: "bottom",
    align: "end",
  },
  {
    id: "productivity-refresh",
    target: '[data-tour="productivity-refresh"]',
    requireVisible: true,
    title: "Refresh",
    description: "Clears the search and reloads the values from the server for the reporting month.",
    side: "bottom",
    align: "end",
  },
  {
    id: "productivity-search",
    target: '[data-tour="productivity-search"]',
    requireVisible: true,
    title: "Search",
    description: "Type a location ID or name to narrow the list; the suggestions list the locations.",
    side: "bottom",
    align: "end",
  },
  {
    id: "productivity-unsaved",
    target: '[data-tour="productivity-unsaved"]',
    requireVisible: true,
    title: "Unsaved changes",
    description: "Appears beside the search once a Productivity value has been edited but not saved yet, with how many.",
    side: "bottom",
    align: "end",
  },
  {
    id: "productivity-save",
    target: '[data-tour="productivity-save"]',
    requireVisible: true,
    title: "Save",
    description:
      "Saves every edited value at once, then reloads the list. It stays off until something is edited, and shows the server's message if the save fails.",
    side: "bottom",
    align: "end",
  },
  {
    id: "productivity-table",
    target: '[data-tour="productivity-table"]',
    title: "Productivity table",
    description:
      "One row per location. Click a Productivity box and type to replace the number — decimals and negative values are allowed, and an edited box gets an amber border until it is saved. Location ID and name stay pinned; headings sort and the page controls move through the list.",
    side: "top",
    align: "start",
  },
  {
    id: "productivity-finish",
    title: "That's the whole screen",
    description: "You've seen every control on Productivity Summary. Open this guide again any time from the ? button beside the title.",
  },
];
