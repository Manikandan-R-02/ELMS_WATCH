import type { TourStep } from "../onboarding.types";

/**
 * What the tour is allowed to change on DailyPrjPage. Each one sets the *complete* state a step needs
 * — it always closes the download dialogs and shows both tables — so Next, Back and "start over" all
 * land in a known place (see `TourStep.before`).
 */
export interface DailyPrjTourControls {
  /** The summary has at least one location, so a location's detail can be opened. */
  hasLocations: boolean;
  /** The backend returned an Excel link, so Download Excel and its confirm dialog exist. */
  hasDownload: boolean;
  /** Show the summary with both tables visible and every dialog closed; the chosen location is kept. */
  showSummary: () => void;
  /** Show the detail card with both tables visible and every dialog closed. Opens the first listed
   * location when none is chosen yet, since the detail only exists for a chosen location. */
  showDetail: () => void;
  /** Open the "Download Daily PRJ report?" confirm dialog. */
  openDownloadConfirm: () => void;
}

/**
 * On-demand "Show tour" walkthrough for DailyPrjPage — started from that page's own help modal (see
 * `useOnboarding().startScreenTour`). Visits every control in reading order: Refresh, the summary's
 * search, Download Excel and its confirm dialog, Hide/Show table and column chooser, the location
 * table, then — for a location — the picker, date search, the month rollups, the day table with its
 * cumulative / PRJ-breakdown switches and the PRJ Target Summary. Steps inside the dialog or the
 * location detail set `mountsOnDemand` + `before`.
 */
export function dailyPrjTourSteps(c: DailyPrjTourControls): TourStep[] {
  const summary = c.showSummary;

  const steps: TourStep[] = [
    {
      id: "daily-prj-header",
      target: '[data-tour="daily-prj-header"]',
      before: summary,
      title: "Daily PRJ",
      description:
        "The food-cost PRJ (cost-per-manday) ratio for the reporting month — a summary across every location, and a day-by-day breakdown for whichever location you pick. The ? button beside the title opens this guide again.",
      side: "bottom",
      align: "start",
    },
    {
      id: "daily-prj-refresh",
      target: '[data-tour="daily-prj-refresh"]',
      requireVisible: true,
      before: summary,
      title: "Refresh",
      description: "Clears both searches and the chosen location, and reloads the summary from the server.",
      side: "bottom",
      align: "end",
    },
    {
      id: "daily-prj-summary",
      target: '[data-tour="daily-prj-summary"]',
      requireVisible: true,
      before: summary,
      title: "Location wise PRJ Summary",
      description: "One row per location for the reporting month. Click a location's Code to load its day-by-day figures below.",
      side: "top",
      align: "start",
    },
    {
      id: "daily-prj-summary-search",
      target: '[data-tour="daily-prj-summary-search"]',
      requireVisible: true,
      before: summary,
      title: "Find a location",
      description: "Type a location ID or name to narrow the summary table; the suggestions list the locations.",
      side: "bottom",
      align: "end",
    },
  ];

  if (c.hasDownload) {
    steps.push(
      {
        id: "daily-prj-download",
        target: '[data-tour="daily-prj-download"]',
        requireVisible: true,
        before: summary,
        title: "Download Excel",
        description: "Exports every location's PRJ summary for the reporting month. It asks you to confirm first, and only appears once the server has returned the file link.",
        side: "bottom",
        align: "end",
      },
      {
        id: "daily-prj-download-modal",
        target: '[data-tour="daily-prj-download-modal"]',
        before: c.openDownloadConfirm,
        mountsOnDemand: true,
        title: "Confirm the download",
        description:
          "Shows the report, period and number of locations. Download starts saving the Excel file and then shows a \"Download started\" message; Cancel, Esc or a click outside closes this without downloading.",
        side: "bottom",
        align: "center",
      }
    );
  }

  steps.push(
    {
      id: "daily-prj-summary-hide",
      target: '[data-tour="daily-prj-summary-hide"]',
      before: summary,
      title: "Hide table",
      description: "Collapses the summary table down to its header and toolbar; the same button then reads Show table.",
      side: "bottom",
      align: "end",
    },
    {
      id: "daily-prj-summary-table",
      target: '[data-tour="daily-prj-summary-table"]',
      before: summary,
      title: "Summary table",
      description:
        "The columns button above it shows or hides columns, headings sort, and the page controls move through the locations. Location code and name stay pinned while you scroll sideways. Click a Code to open that location's detail.",
      side: "top",
      align: "start",
    }
  );

  if (!c.hasLocations) {
    steps.push({
      id: "daily-prj-finish",
      before: summary,
      title: "No locations to open yet",
      description:
        "The location detail — its picker, daily table and PRJ Target Summary — appears once the summary lists a location. Reload the page or press Refresh, then open this guide again from the ? button beside the title.",
    });
    return steps;
  }

  const detail = c.showDetail;
  steps.push(
    {
      id: "daily-prj-detail",
      target: '[data-tour="daily-prj-detail"]',
      requireVisible: true,
      before: detail,
      mountsOnDemand: true,
      title: "Daily PRJ Details",
      description: "One location's day-by-day figures for the reporting month. The tour opens the first listed location for you.",
      side: "top",
      align: "start",
    },
    {
      id: "daily-prj-location-picker",
      target: '[data-tour="daily-prj-location-picker"]',
      requireVisible: true,
      before: detail,
      mountsOnDemand: true,
      title: "Pick a location",
      description: "Or select a location directly here instead of clicking its Code in the summary.",
      side: "bottom",
      align: "end",
    },
    {
      id: "daily-prj-detail-search",
      target: '[data-tour="daily-prj-detail-search"]',
      requireVisible: true,
      before: detail,
      mountsOnDemand: true,
      title: "Search a date",
      description: "Appears once a location is chosen. Type a date or serial number to jump to a specific day.",
      side: "bottom",
      align: "end",
    },
    {
      id: "daily-prj-detail-hide",
      target: '[data-tour="daily-prj-detail-hide"]',
      before: detail,
      mountsOnDemand: true,
      title: "Hide table",
      description: "Collapses the month rollups, the day table and the PRJ Target Summary, leaving just this card's header; the same button then reads Show table.",
      side: "bottom",
      align: "end",
    },
    {
      id: "daily-prj-month-summary",
      target: '[data-tour="daily-prj-month-summary"]',
      before: detail,
      mountsOnDemand: true,
      title: "Month rollups",
      description: "Current Month and Previous Month come from the server; Total and Avg are worked out from the days below; Target is the location's own target.",
      side: "top",
      align: "start",
    },
    {
      id: "daily-prj-detail-options",
      target: '[data-tour="daily-prj-detail-options"]',
      before: detail,
      mountsOnDemand: true,
      title: "Extra columns",
      description:
        "Show cumulative columns adds running totals. Show PRJ breakdown adds Food, Cleaning, Disposable, Mandays, Total and PRJ for each PRJ type, when the location has any. The columns button shows or hides the standard columns.",
      side: "bottom",
      align: "end",
    },
    {
      id: "daily-prj-detail-table",
      target: '[data-tour="daily-prj-detail-table"]',
      before: detail,
      mountsOnDemand: true,
      title: "Day by day",
      description:
        "One row per day. In Var PRJ and Var Staff, green with an up-arrow is over target and red with a down-arrow is under. S.No and Date stay pinned while you scroll sideways; headings sort and the page controls move through the days.",
      side: "top",
      align: "start",
    },
    {
      id: "daily-prj-target",
      target: '[data-tour="daily-prj-target"]',
      before: detail,
      mountsOnDemand: true,
      title: "PRJ Target Summary",
      description: "The location's targets for the month. Its PRJ/Manday Total is the authoritative Daily PRJ target shown in the Target rollup above.",
      side: "top",
      align: "start",
    },
    {
      id: "daily-prj-finish",
      before: summary,
      title: "That's the whole screen",
      description: "You've seen every control on Daily PRJ. Open this guide again any time from the ? button beside the title.",
    }
  );
  return steps;
}
