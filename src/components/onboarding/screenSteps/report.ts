import type { TourStep } from "../onboarding.types";

/**
 * On-demand "Show tour" walkthrough for ReportPage — started from that page's own help modal (see
 * `useOnboarding().startScreenTour`), not part of the cross-route first-run tour in `tourSteps.ts`.
 * Visits every control in reading order: Reset form, the report picker, the period, Generate, and —
 * once a report has been generated — the result panel and Recent Generations. Those last parts only
 * exist after a run, so their steps are skipped until then, and the closing step says where they
 * appear.
 */
export const reportTourSteps: TourStep[] = [
  {
    id: "report-header",
    target: '[data-tour="report-header"]',
    title: "Report Generator",
    description: "Generates any of the consolidated Excel reports for a chosen month, then gives you a link to download it. The ? button beside the title opens this guide again.",
    side: "bottom",
    align: "start",
  },
  {
    id: "report-reset",
    target: '[data-tour="report-reset"]',
    requireVisible: true,
    title: "Reset form",
    description: "Clears the chosen report and the result below, and puts the period back on the month selected in the top header. Recent Generations is kept.",
    side: "bottom",
    align: "end",
  },
  {
    id: "report-form",
    target: '[data-tour="report-form"]',
    title: "Generate a report",
    description: "Pick a report and a period, then generate the Excel file. A result panel below shows whether it succeeded, found no data, or failed.",
    side: "bottom",
    align: "start",
  },
  {
    id: "report-select",
    target: '[data-tour="report-select"]',
    title: "Report",
    description: "Required. Click to open the list of 35 consolidated reports and type to search it. Each report has its own server call, chosen by what you pick here.",
    side: "bottom",
    align: "start",
  },
  {
    id: "report-period",
    target: '[data-tour="report-period"]',
    title: "Period",
    description: "Required. Starts on the month selected in the top header — pick a different one here for this report only. A month in the future is not allowed.",
    side: "bottom",
    align: "center",
  },
  {
    id: "report-generate-button",
    target: '[data-tour="report-generate-button"]',
    title: "Generate",
    description: "Click here to run the report. It can take a while for a whole month, so the button shows Generating… and the form is locked until it finishes. A missing report or period is highlighted instead of running.",
    side: "top",
    align: "center",
  },
  {
    id: "report-result",
    target: '[data-tour="report-result"]',
    requireVisible: true,
    title: "Result",
    description: "Green with a Download Excel button when the file is ready, yellow when there was no data for that month, red when the request failed.",
    side: "top",
    align: "start",
  },
  {
    id: "report-history",
    target: '[data-tour="report-history"]',
    requireVisible: true,
    title: "Recent Generations",
    description: "Every attempt in this session (the last 10) with its report, period, status and time, and a Download button for each successful one. The list resets when you reload the page.",
    side: "top",
    align: "start",
  },
  {
    id: "report-history-clear",
    target: '[data-tour="report-history-clear"]',
    requireVisible: true,
    title: "Clear history",
    description: "Empties Recent Generations. It does not delete any file already on the server.",
    side: "bottom",
    align: "end",
  },
  {
    id: "report-finish",
    title: "That's the whole screen",
    description:
      "The result panel and Recent Generations appear after you generate a report, so they were skipped if you haven't yet. Generate one and open this guide again to see them. The ? button beside the title opens it any time.",
  },
];
