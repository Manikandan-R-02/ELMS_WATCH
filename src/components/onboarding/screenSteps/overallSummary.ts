import type { TourStep } from "../onboarding.types";

export type WasteInsightsView = "locations" | "foodItems" | "reasons";

/**
 * What the tour is allowed to change on OverallSummaryPage. Each one sets the *complete* state a
 * step needs (see `TourStep.before`), so Next, Back and "start over" all land in a known place.
 */
export interface OverallSummaryTourControls {
  /** Summary Overview tab, every modal closed, no category detail open. */
  showSummaryTab: () => void;
  /** Categories by Cost tab, every modal closed, no category detail open. */
  showCategoriesTab: () => void;
  /** Categories by Cost tab with the first category's per-location detail open (if there is one). */
  openFirstCategory: () => void;
  /** Summary charts modal open. */
  openCharts: () => void;
  /** Waste insights modal open on the given view. */
  openWasteInsights: (view: WasteInsightsView) => void;
}

/**
 * On-demand "Show tour" walkthrough for OverallSummaryPage — started from that page's own help
 * modal (see `useOnboarding().startScreenTour`), not part of the cross-route first-run tour in
 * `tourSteps.ts`. One file per screen under this folder so multiple screens' tours can be
 * authored/edited independently without touching a single shared registry file.
 *
 * Visits every part of the screen in reading order, including what only appears after a click:
 * the Categories tab and its per-location detail, the Summary charts modal, and each of the three
 * Waste insights views. Steps inside a tab panel or modal set `mountsOnDemand` + `before`.
 */
export function overallSummaryTourSteps(c: OverallSummaryTourControls): TourStep[] {
  return [
    {
      id: "overall-summary-header",
      target: '[data-tour="overall-summary-header"]',
      before: c.showSummaryTab,
      title: "Overall Summary",
      description:
        "A company-wide roll-up for the reporting month picked in the header: locations, POB, mandays, cost and waste, grouped by Contract, Segment or Operation Manager. The ? button beside the title opens this guide again.",
      side: "bottom",
      align: "start",
    },
    {
      id: "overall-summary-refresh",
      target: '[data-tour="overall-summary-refresh"]',
      requireVisible: true,
      before: c.showSummaryTab,
      title: "Refresh",
      description: "Reloads the data for the selected month and puts the screen back to its starting view.",
      side: "bottom",
      align: "end",
    },
    {
      id: "overall-summary-stats",
      target: '[data-tour="overall-summary-stats"]',
      before: c.showSummaryTab,
      title: "Quick stats",
      description:
        "Six headline figures for the month. Click Total POB, Total mandays or Cost/manday to sort the summary table by that figure, Total cost to open the cost chart, and Waste cost to open Waste insights. Locations is for reading only.",
      side: "bottom",
      align: "start",
    },
    {
      id: "overall-summary-chart",
      target: '[data-tour="overall-summary-chart"]',
      before: c.showSummaryTab,
      title: "Cost comparison",
      description:
        "Daily cost for the selected month against the previous month, so a spike or dip stands out. Use the Area / Line / Bar switch in the card's corner to change how it is drawn, and hover a day for the exact amounts.",
      side: "top",
      align: "start",
    },
    {
      id: "overall-summary-tabs",
      target: '[data-tour="overall-summary-tabs"]',
      before: c.showSummaryTab,
      title: "Two views",
      description:
        "Summary Overview has one row per contract, segment or operation manager. Categories by Cost shows where the money goes, category by category. The buttons on the right open the cost charts and the waste insights.",
      side: "bottom",
      align: "start",
    },
    {
      id: "overall-summary-filters",
      target: '[data-tour="overall-summary-filters"]',
      before: c.showSummaryTab,
      mountsOnDemand: true,
      title: "Choose the grouping",
      description:
        "Switch between Contract, Segment and Operation Manager. The search box filters the table by name and suggests matching names as you type.",
      side: "bottom",
      align: "start",
    },
    {
      id: "overall-summary-table",
      target: '[data-tour="overall-summary-group-table"]',
      before: c.showSummaryTab,
      mountsOnDemand: true,
      title: "Summary Overview",
      description:
        "One row per group. Click a column heading to sort, use the page controls under the table to move through the rows, and click a name to open Location Summary already filtered to that group.",
      side: "top",
      align: "start",
    },
    {
      id: "overall-summary-categories",
      target: '[data-tour="overall-summary-categories"]',
      before: c.showCategoriesTab,
      mountsOnDemand: true,
      title: "Categories by Cost",
      description:
        "The donut and the table show the same figures: each category's share of the month's cost. Search to find a category. Click a slice or a row to see which locations drive that category.",
      side: "top",
      align: "start",
    },
    {
      id: "overall-summary-category-detail",
      target: '[data-tour="overall-summary-category-detail"]',
      before: c.openFirstCategory,
      mountsOnDemand: true,
      title: "Locations for a category",
      description:
        "The chosen category's cost per location, as a donut and a table. Click a location (its name or its slice) to open Item Analysis for it. The X in the corner closes this panel. If nothing opened here, the month has no category cost yet.",
      side: "top",
      align: "start",
    },
    {
      id: "overall-summary-view-charts",
      target: '[data-tour="overall-summary-view-charts"]',
      requireVisible: true,
      before: c.showSummaryTab,
      title: "View charts",
      description: "Opens the Total Cost Distribution chart for whichever grouping is selected. Clicking the Total cost card does the same.",
      side: "bottom",
      align: "end",
    },
    {
      id: "overall-summary-charts-modal",
      target: '[data-tour="overall-summary-charts-modal"]',
      before: c.openCharts,
      mountsOnDemand: true,
      title: "Total Cost Distribution",
      description:
        "Each slice is one contract, segment or operation manager, sized by its total cost. Click a slice to open Location Summary filtered to it. Press Esc or click outside to close it.",
      side: "bottom",
      align: "center",
    },
    {
      id: "overall-summary-waste-button",
      target: '[data-tour="overall-summary-waste-button"]',
      requireVisible: true,
      before: c.showSummaryTab,
      title: "Waste insights",
      description: "Opens three views of where food is being wasted. Clicking the Waste cost card does the same.",
      side: "bottom",
      align: "end",
    },
    {
      id: "overall-summary-waste-tabs",
      target: '[data-tour="overall-summary-waste-tabs"]',
      before: () => c.openWasteInsights("locations"),
      mountsOnDemand: true,
      title: "Three waste views",
      description: "Switch between the top locations by waste cost, the most-wasted food items, and the loss reasons by weight.",
      side: "bottom",
      align: "start",
    },
    {
      id: "overall-summary-waste-locations",
      target: '[data-tour="overall-summary-waste-locations"]',
      before: () => c.openWasteInsights("locations"),
      mountsOnDemand: true,
      title: "Top locations by waste cost",
      description: "Locations ranked by waste cost for the month. Click a bar to open Waste Cost Analysis for that location.",
      side: "top",
      align: "center",
    },
    {
      id: "overall-summary-waste-food",
      target: '[data-tour="overall-summary-waste-food"]',
      before: () => c.openWasteInsights("foodItems"),
      mountsOnDemand: true,
      title: "Top wasted food items",
      description: "The eight food items wasted by the greatest weight (kg) this month.",
      side: "top",
      align: "center",
    },
    {
      id: "overall-summary-waste-reasons",
      target: '[data-tour="overall-summary-waste-reasons"]',
      before: () => c.openWasteInsights("reasons"),
      mountsOnDemand: true,
      title: "Loss reasons by weight",
      description: "Why food was lost, with the weight (kg) recorded against each reason.",
      side: "top",
      align: "center",
    },
    {
      id: "overall-summary-finish",
      before: c.showSummaryTab,
      title: "That's the whole screen",
      description: "You've seen every control on Overall Summary. Open this guide again any time from the ? button beside the title.",
    },
  ];
}
