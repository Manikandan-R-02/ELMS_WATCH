import type { TourStep } from "../onboarding.types";

/**
 * On-demand "Show tour" walkthrough for DataTrackerReportPage — started from that page's own help
 * modal (see `useOnboarding().startScreenTour`). Visits every control in reading order: Refresh, the
 * summary line, the Yes/No legend, the search box, Download Excel (only when the backend returned a
 * file link) and the grid itself. This screen has no modals or tabs, so no step needs to change the
 * page first.
 */
export const dataTrackerReportTourSteps: TourStep[] = [
  {
    id: "data-tracker-report-header",
    target: '[data-tour="data-tracker-report-header"]',
    title: "Data Tracker Report",
    description:
      "Whether every location reported its Consumption, Manday and Staff Onsite data on each day of the reporting month — a quick Yes/No availability grid. The ? button beside the title opens this guide again.",
    side: "bottom",
    align: "start",
  },
  {
    id: "data-tracker-report-refresh",
    target: '[data-tour="data-tracker-report-refresh"]',
    requireVisible: true,
    title: "Refresh",
    description: "Clears the search and reloads the report from the server for the reporting month.",
    side: "bottom",
    align: "end",
  },
  {
    id: "data-tracker-report-summary",
    target: '[data-tour="data-tracker-report-summary"]',
    title: "Data Availability Detail",
    description: "The period, the number of locations and the number of days covered by this grid.",
    side: "bottom",
    align: "start",
  },
  {
    id: "data-tracker-report-legend",
    target: '[data-tour="data-tracker-report-legend"]',
    title: "Yes / No",
    description: "Green Yes means the data was submitted that day; red No means it was not.",
    side: "bottom",
    align: "end",
  },
  {
    id: "data-tracker-report-search",
    target: '[data-tour="data-tracker-report-search"]',
    requireVisible: true,
    title: "Find a location",
    description: "Type a location ID or name to narrow the grid instantly without reloading; the suggestions list the locations.",
    side: "bottom",
    align: "end",
  },
  {
    id: "data-tracker-report-download",
    target: '[data-tour="data-tracker-report-download"]',
    requireVisible: true,
    title: "Download Excel",
    description: "Exports the same grid for the selected month. It only appears once the server has returned the file link.",
    side: "bottom",
    align: "end",
  },
  {
    id: "data-tracker-report-table",
    target: '[data-tour="data-tracker-report-table"]',
    title: "Read the grid",
    description:
      "Each location has three rows (Consumption, Manday, Staff Onsite) and one column per day; hover a day number for its date. A red \"No\" means that category wasn't submitted that day — worth following up before month-close. Location ID and name stay pinned while you scroll sideways; click a heading to sort and use the page controls under the table.",
    side: "top",
    align: "start",
  },
  {
    id: "data-tracker-report-finish",
    title: "That's the whole screen",
    description: "You've seen every control on Data Tracker Report. Open this guide again any time from the ? button beside the title.",
  },
];
