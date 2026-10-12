import type { TourStep } from "../onboarding.types";

export type LocationSummaryTab = "summary" | "monthComparison" | "customCompare" | "dailyPrj" | "locationGraphs";
export type LocationSummaryChartsView = "costWaste" | "targetActual";
export type LocationSummaryWasteView = "reasons" | "topItems";

/**
 * What the tour is allowed to change on LocationSummaryPage. Each one sets the *complete* state a
 * step needs — it always closes whatever overlay was open first — so Next, Back and "start over"
 * all land in a known place (see `TourStep.before`).
 */
export interface LocationSummaryTourControls {
  /** Show this tab with every modal closed. */
  showTab: (tab: LocationSummaryTab) => void;
  /** Summary tab with the "Filter locations" modal open. */
  openFilter: () => void;
  /** Summary tab with the Inventory modal open on the first listed location (if there is one). */
  openInventory: () => void;
  /** Summary tab with the Summary charts modal open on the given chart. */
  openCharts: (view: LocationSummaryChartsView) => void;
  /** Summary tab with the Waste insights modal open on the given view. */
  openWaste: (view: LocationSummaryWasteView) => void;
}

/**
 * On-demand "Show tour" walkthrough for LocationSummaryPage — started from that page's own help
 * modal (see `useOnboarding().startScreenTour`). Visits every part of the screen in reading
 * order, including what only appears after a click: the location filter, the inventory
 * drill-down, both charts and both waste views, and the content of all five tabs. Steps inside a
 * tab panel or modal set `mountsOnDemand` + `before`.
 */
export function locationSummaryTourSteps(c: LocationSummaryTourControls): TourStep[] {
  const summary = () => c.showTab("summary");
  return [
    {
      id: "location-summary-header",
      target: '[data-tour="location-summary-header"]',
      before: summary,
      title: "Location Summary",
      description:
        "Every location's staffing, mandays, cost and waste for the reporting month picked in the header, with month-over-month and daily views. The ? button beside the title opens this guide again.",
      side: "bottom",
      align: "start",
    },
    {
      id: "location-summary-filter",
      target: '[data-tour="location-summary-filter"]',
      before: summary,
      title: "Narrow by location",
      description:
        "Shows All locations until you narrow it. Click it to filter by type (Segment, Contract or O&M based), then a category, then one specific location. Once a filter is active an X appears beside it, and a Clear filters button appears above the table.",
      side: "bottom",
      align: "end",
    },
    {
      id: "location-summary-filter-modal",
      target: '[data-tour="location-summary-filter-modal"]',
      before: c.openFilter,
      mountsOnDemand: true,
      title: "Filter locations",
      description:
        "Pick a Location type, then the category it groups by, then optionally one specific location. The lists load from the server for the reporting month. Apply keeps your choice; Cancel leaves the screen as it was.",
      side: "bottom",
      align: "center",
    },
    {
      id: "location-summary-refresh",
      target: '[data-tour="location-summary-refresh"]',
      requireVisible: true,
      before: summary,
      title: "Refresh",
      description: "Clears every filter, search and sort, returns to the Summary tab and reloads the data.",
      side: "bottom",
      align: "end",
    },
    {
      id: "location-summary-search",
      target: '[data-tour="location-summary-search"]',
      before: summary,
      title: "Find a location",
      description:
        "Click the search icon and type a location ID or name. Matching locations are suggested, and picking one narrows the whole screen to it. Otherwise the text simply filters the table rows.",
      side: "bottom",
      align: "end",
    },
    {
      id: "location-summary-stats",
      target: '[data-tour="location-summary-stats"]',
      before: summary,
      title: "Six clickable cards",
      description:
        "Locations opens the location filter. Total POB and Total mandays sort the Summary table by that figure, and Avg cost/manday sorts it by total cost. Total cost opens the charts, and Waste cost opens Waste insights.",
      side: "bottom",
      align: "start",
    },
    {
      id: "location-summary-chart",
      target: '[data-tour="location-summary-chart"]',
      before: summary,
      title: "Cost comparison",
      description:
        "Daily cost for the reporting month against the previous month. Use the Area / Line / Bar switch in the card's corner to change how it is drawn, and hover a day for the exact amounts.",
      side: "top",
      align: "start",
    },
    {
      id: "location-summary-tab-strip",
      target: '[data-tour="location-summary-tab-strip"]',
      before: summary,
      title: "Five views",
      description:
        "Summary is the main table. Month Comparison compares the last 3 to 12 months, Compare Custom Months lets you choose the months, Daily PRJ shows POB and actual by day, and Location Graphs charts mandays for each location.",
      side: "bottom",
      align: "start",
    },
    {
      id: "location-summary-columns",
      target: '[data-tour="location-summary-columns"]',
      before: summary,
      mountsOnDemand: true,
      title: "Choose your columns",
      description: "Show or hide any column of the Summary table.",
      side: "bottom",
      align: "end",
    },
    {
      id: "location-summary-tenday",
      target: '[data-tour="location-summary-tenday"]',
      before: summary,
      mountsOnDemand: true,
      title: "10/20/30-day columns",
      description: "Adds 10-day, 20-day and 30-day columns to the Summary table, right after Target PRJ.",
      side: "bottom",
      align: "end",
    },
    {
      id: "location-summary-table",
      target: '[data-tour="location-summary-table"]',
      before: summary,
      mountsOnDemand: true,
      title: "Summary table",
      description:
        "One row per location. Click a column heading to sort and use the page controls under the table. Click a Location ID to open Location Details, or an Inventory value to open its breakdown. Location ID and name stay pinned on the left while you scroll sideways, and Actual is red when above target and green when on or under it.",
      side: "top",
      align: "start",
    },
    {
      id: "location-summary-inventory-modal",
      target: '[data-tour="location-summary-inventory-modal"]',
      before: c.openInventory,
      mountsOnDemand: true,
      title: "Inventory breakdown",
      description:
        "Search the location's items, sort by item or closing figures, page through the results, and read the total quantity and value of everything that matches at the bottom. If nothing opened, there are no locations listed yet.",
      side: "bottom",
      align: "center",
    },
    {
      id: "location-summary-view-charts",
      target: '[data-tour="location-summary-view-charts"]',
      before: summary,
      mountsOnDemand: true,
      title: "View charts",
      description: "Opens the location charts for the Summary rows. Clicking the Total cost card does the same.",
      side: "bottom",
      align: "end",
    },
    {
      id: "location-summary-charts-cost",
      target: '[data-tour="location-summary-charts-modal"]',
      before: () => c.openCharts("costWaste"),
      mountsOnDemand: true,
      title: "Cost and waste by location",
      description: "Bars compare each location's cost with its waste. The tabs at the top of this window switch between the two charts.",
      side: "bottom",
      align: "center",
    },
    {
      id: "location-summary-charts-target",
      target: '[data-tour="location-summary-charts-modal"]',
      before: () => c.openCharts("targetActual"),
      mountsOnDemand: true,
      title: "Actual vs. target by location",
      description: "Lines compare each location's target PRJ with what it actually reached.",
      side: "bottom",
      align: "center",
    },
    {
      id: "location-summary-waste-button",
      target: '[data-tour="location-summary-waste-button"]',
      before: summary,
      title: "Waste insights",
      description: "Opens the waste breakdowns. Clicking the Waste cost card does the same. This button is on every tab.",
      side: "bottom",
      align: "end",
    },
    {
      id: "location-summary-waste-reasons",
      target: '[data-tour="location-summary-waste-modal"]',
      before: () => c.openWaste("reasons"),
      mountsOnDemand: true,
      title: "Loss reason by weight",
      description: "Why food was lost, with the weight (kg) for each reason. The tab beside it shows the most-wasted food items.",
      side: "bottom",
      align: "center",
    },
    {
      id: "location-summary-waste-items",
      target: '[data-tour="location-summary-waste-modal"]',
      before: () => c.openWaste("topItems"),
      mountsOnDemand: true,
      title: "Top wasted food items",
      description: "The eight items wasted by the greatest weight (kg).",
      side: "bottom",
      align: "center",
    },
    {
      id: "location-summary-month-range",
      target: '[data-tour="location-summary-month-range"]',
      before: () => c.showTab("monthComparison"),
      mountsOnDemand: true,
      title: "Month Comparison",
      description: "Choose 3, 6, 9 or 12 months. The reporting month is the base month and the earlier months come before it.",
      side: "bottom",
      align: "start",
    },
    {
      id: "location-summary-month-table",
      target: '[data-tour="location-summary-month-table"]',
      before: () => c.showTab("monthComparison"),
      mountsOnDemand: true,
      title: "Comparison table",
      description:
        "For every location and month: mandays, cost, cost per manday, waste and waste per manday. The coloured chips above the table name the months, and the base month is marked.",
      side: "top",
      align: "start",
    },
    {
      id: "location-summary-custom-pickers",
      target: '[data-tour="location-summary-custom-pickers"]',
      before: () => c.showTab("customCompare"),
      mountsOnDemand: true,
      title: "Compare Custom Months",
      description: "Pick any Base month, then any months to compare against it.",
      side: "bottom",
      align: "start",
    },
    {
      id: "location-summary-custom-table",
      target: '[data-tour="location-summary-custom-table"]',
      before: () => c.showTab("customCompare"),
      mountsOnDemand: true,
      title: "Custom comparison",
      description: "The same figures as Month Comparison, for exactly the months you picked.",
      side: "top",
      align: "start",
    },
    {
      id: "location-summary-daily-range",
      target: '[data-tour="location-summary-daily-range"]',
      before: () => c.showTab("dailyPrj"),
      mountsOnDemand: true,
      title: "Daily PRJ",
      description: "Switch between days 1–9, 10–18 and 19–25 of the month.",
      side: "bottom",
      align: "start",
    },
    {
      id: "location-summary-daily-table",
      target: '[data-tour="location-summary-daily-table"]',
      before: () => c.showTab("dailyPrj"),
      mountsOnDemand: true,
      title: "POB and actual by day",
      description: "Each day shows its POB and actual for every location. The 19–25 view also adds total POB and total actual columns.",
      side: "top",
      align: "start",
    },
    {
      id: "location-summary-graphs",
      target: '[data-tour="location-summary-graphs"]',
      before: () => c.showTab("locationGraphs"),
      mountsOnDemand: true,
      title: "Location Graphs",
      description:
        "One small mandays chart per location, with one bar per compared month in the colours of the legend above. Only the first six show at first; use the Show all button to see the rest.",
      side: "top",
      align: "start",
    },
    {
      id: "location-summary-finish",
      before: summary,
      title: "That's the whole screen",
      description: "You've seen every control on Location Summary. Open this guide again any time from the ? button beside the title.",
    },
  ];
}
