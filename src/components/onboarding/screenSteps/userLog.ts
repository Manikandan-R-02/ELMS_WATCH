import type { TourStep } from "../onboarding.types";

export type UserLogTourPeriod = "day" | "week" | "month" | "year";

/**
 * What the tour is allowed to change on UserLogPage: just the period tab (each tab shows a different date
 * picker). Each step sets the *complete* state it needs — Next, Back and "start over" all land in a known
 * place (see `TourStep.before`). The tour never exports anything.
 */
export interface UserLogTourControls {
  /** Show this period tab (and its date picker). */
  showPeriod: (period: UserLogTourPeriod) => void;
  /** The tab that was open when the tour started — the steps that are not about a specific tab return to it. */
  startPeriod: UserLogTourPeriod;
}

/**
 * On-demand "Show tour" walkthrough for UserLogPage — started from that page's own help modal (see
 * `useOnboarding().startScreenTour`). Visits every control in reading order: Reset, Refresh, Export, the
 * four period tabs with the date picker each one shows (Current Day, Week, Month, Year), the search box and
 * the log table. Steps that show a specific tab set `before`.
 */
export function userLogTourSteps(c: UserLogTourControls): TourStep[] {
  const start = () => c.showPeriod(c.startPeriod);
  const picker = (id: string, period: UserLogTourPeriod, title: string, description: string): TourStep => ({
    id,
    target: '[data-tour="user-log-picker"]',
    before: () => c.showPeriod(period),
    title,
    description,
    side: "bottom",
    align: "start",
  });

  return [
    {
      id: "user-log-header",
      target: '[data-tour="user-log-header"]',
      before: start,
      title: "User Log",
      description:
        "Every user's login and logout time for the period you choose. The ? button beside the title opens this guide again.",
      side: "bottom",
      align: "start",
    },
    {
      id: "user-log-reset",
      target: '[data-tour="user-log-reset"]',
      requireVisible: true,
      before: start,
      title: "Reset",
      description: "Goes back to the Year tab for the current year, with today's date and this month in the other pickers, and clears the search.",
      side: "bottom",
      align: "end",
    },
    {
      id: "user-log-refresh",
      target: '[data-tour="user-log-refresh"]',
      requireVisible: true,
      before: start,
      title: "Refresh",
      description: "Reloads the log from the server for the period shown.",
      side: "bottom",
      align: "end",
    },
    {
      id: "user-log-export",
      target: '[data-tour="user-log-export"]',
      requireVisible: true,
      before: start,
      title: "Export",
      description: "Downloads the period shown as an Excel workbook. It stays off while there are no records or an export is running, and shows the server's message if the export fails.",
      side: "bottom",
      align: "end",
    },
    {
      id: "user-log-periods",
      target: '[data-tour="user-log-periods"]',
      before: start,
      title: "Choose a period",
      description: "Current Day, Week, Month or Year. The log reloads whenever you switch tab or change the date. The next four steps show each tab's picker.",
      side: "bottom",
      align: "start",
    },
    picker("user-log-picker-day", "day", "Current Day", "Pick the date to see; future dates are not allowed."),
    picker("user-log-picker-week", "week", "Week", "Pick any day, and the log shows the whole week that day falls in."),
    picker("user-log-picker-month", "month", "Month", "Pick the month. A month in the future is not allowed."),
    picker("user-log-picker-year", "year", "Year", "Pick the year, from the last five years up to this one."),
    {
      id: "user-log-search",
      target: '[data-tour="user-log-search"]',
      requireVisible: true,
      before: start,
      title: "Narrow the results",
      description: "Search by name, email or role to filter the table down; the suggestions list each user once.",
      side: "top",
      align: "end",
    },
    {
      id: "user-log-table",
      target: '[data-tour="user-log-table"]',
      before: start,
      title: "Login and logout times",
      description:
        "One row per login: the user with their email and role, the Log In time in green and the Logout time in red (a dash while they are still signed in). Headings sort and the page controls move through the records.",
      side: "top",
      align: "start",
    },
    {
      id: "user-log-finish",
      before: start,
      title: "That's the whole screen",
      description: "You've seen every control on User Log. Open this guide again any time from the ? button beside the title.",
    },
  ];
}
