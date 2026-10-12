import type { TourStep } from "../onboarding.types";

export type LocationDetailsTab = "srcData" | "consumption" | "splitPrj" | "compare" | "inventory";
export type LocationDetailsGraphTab = "actualVsTarget" | "categoryBreakdown" | "dioTrend";

/**
 * What the tour is allowed to change on LocationDetailsPage. Each one sets the *complete* state a
 * step needs — it always closes the location picker first — so Next, Back and "start over" all
 * land in a known place (see `TourStep.before`).
 */
export interface LocationDetailsTourControls {
  /** A location is chosen. Everything below the header only exists once one is, so without one
   * the tour covers just the header and the picker. */
  hasLocation: boolean;
  /** Show this data tab with the picker closed. */
  showTab: (tab: LocationDetailsTab) => void;
  /** Show this chart in the Graphical Presentation card with the picker closed. */
  showGraph: (tab: LocationDetailsGraphTab) => void;
  /** Open the "Select a location" picker. */
  openPicker: () => void;
  /** Inventory tab with the item list for its first listed date open (if there is one). */
  openInventoryDate: () => void;
}

/**
 * On-demand "Show tour" walkthrough for LocationDetailsPage — started from that page's own help
 * modal (see `useOnboarding().startScreenTour`). Visits every part of the screen in reading
 * order, including what only appears after a click: the location picker, all five data tabs and
 * the three charts. Steps inside a tab panel or modal set `mountsOnDemand` + `before`.
 */
export function locationDetailsTourSteps(c: LocationDetailsTourControls): TourStep[] {
  const srcData = () => c.showTab("srcData");

  const header: TourStep = {
    id: "location-details-header",
    target: '[data-tour="location-details-header"]',
    before: srcData,
    title: "Location Details",
    description:
      "One location's day-by-day cost, consumption and inventory for the reporting month picked in the header — the drill-down behind every row of Location Summary. The ? button beside the title opens this guide again.",
    side: "bottom",
    align: "start",
  };
  const picker: TourStep = {
    id: "location-details-picker",
    target: '[data-tour="location-details-picker"]',
    before: srcData,
    title: "Pick a location",
    description: "Shows the chosen location, or Select location if there is none yet. Click it to open the picker — the Location card below does the same.",
    side: "bottom",
    align: "end",
  };
  const pickerModal: TourStep = {
    id: "location-details-picker-modal",
    target: '[data-tour="location-details-picker-modal"]',
    before: c.openPicker,
    mountsOnDemand: true,
    title: "Select a location",
    description:
      "Choose a Location type, then the category it groups by, then one specific location, and press View details (it stays off until a location is chosen). Cancel, Esc or a click outside closes it without changing anything.",
    side: "bottom",
    align: "center",
  };
  const refresh: TourStep = {
    id: "location-details-refresh",
    target: '[data-tour="location-details-refresh"]',
    requireVisible: true,
    before: srcData,
    title: "Refresh",
    description: "Clears the search, returns to the SRC Data tab, resets the comparison months and reloads the figures for the chosen location.",
    side: "bottom",
    align: "end",
  };

  if (!c.hasLocation) {
    return [
      header,
      picker,
      pickerModal,
      refresh,
      {
        id: "location-details-finish",
        before: srcData,
        title: "Pick a location to see the rest",
        description:
          "The figures, five data tabs and charts appear once a location is chosen. Pick one, then open this guide again from the ? button beside the title to see them.",
      },
    ];
  }

  return [
    header,
    picker,
    pickerModal,
    refresh,
    {
      id: "location-details-stats",
      target: '[data-tour="location-details-stats"]',
      before: srcData,
      title: "Headline figures",
      description: "The location, its total mandays, total cost, cumulative daily cost and waste cost for the reporting month. Click the Location card to pick another location.",
      side: "bottom",
      align: "start",
    },
    {
      id: "location-details-chart",
      target: '[data-tour="location-details-chart"]',
      before: srcData,
      title: "Cost comparison",
      description:
        "Daily cost for the reporting month against the previous month. Use the Area / Line / Bar switch in the card's corner to change how it is drawn, and hover a day for the exact amounts.",
      side: "top",
      align: "start",
    },
    {
      id: "location-details-tab-strip",
      target: '[data-tour="location-details-tab-strip"]',
      before: srcData,
      title: "Five data tabs",
      description:
        "SRC Data is the raw daily figures for each SRC type. Consumption breaks the same days down by spend category. Split by PRJ groups cost into Food, Cleaning, Disposal and Others. Consumption Compare lines categories up across the months you pick. Inventory tracks closing stock over the month.",
      side: "bottom",
      align: "start",
    },
    {
      id: "location-details-search",
      target: '[data-tour="location-details-search"]',
      requireVisible: true,
      before: srcData,
      mountsOnDemand: true,
      title: "Search the rows",
      description:
        "Type an SRC type or a date to filter the rows of SRC Data, Consumption and Split by PRJ; the suggestions follow the open tab. It is hidden on Consumption Compare.",
      side: "bottom",
      align: "end",
    },
    {
      id: "location-details-src-table",
      target: '[data-tour="location-details-src-table"]',
      before: srcData,
      mountsOnDemand: true,
      title: "SRC Data",
      description:
        "One row per SRC type per date. The columns button above the table shows or hides columns, the headings sort, and the page controls move through the rows. SRC and date stay pinned on the left while you scroll sideways.",
      side: "top",
      align: "start",
    },
    {
      id: "location-details-consumption-table",
      target: '[data-tour="location-details-consumption-table"]',
      before: () => c.showTab("consumption"),
      mountsOnDemand: true,
      title: "Consumption",
      description:
        "The same days broken down by spend category — the category columns depend on the location. The columns button, sorting and paging work as on SRC Data.",
      side: "top",
      align: "start",
    },
    {
      id: "location-details-split-table",
      target: '[data-tour="location-details-split-table"]',
      before: () => c.showTab("splitPrj"),
      mountsOnDemand: true,
      title: "Split by PRJ",
      description: "Each day's cost split into Food, Cleaning, Disposal and Others, with the total and the mandays.",
      side: "top",
      align: "start",
    },
    {
      id: "location-details-compare-pickers",
      target: '[data-tour="location-details-compare-pickers"]',
      before: () => c.showTab("compare"),
      mountsOnDemand: true,
      title: "Choose months to compare",
      description: "Pick a Base month and any months to compare against it. The coloured chips below list the months, and the base month is marked.",
      side: "bottom",
      align: "start",
    },
    {
      id: "location-details-compare-table",
      target: '[data-tour="location-details-compare-table"]',
      before: () => c.showTab("compare"),
      mountsOnDemand: true,
      title: "Category comparison",
      description:
        "For every spend category: its cost and its cost per manday in the base month and in each comparison month. The headings sort and the page controls move through the rows.",
      side: "top",
      align: "start",
    },
    {
      id: "location-details-inventory-table",
      target: '[data-tour="location-details-inventory-table"]',
      before: () => c.showTab("inventory"),
      mountsOnDemand: true,
      title: "Inventory",
      description:
        "One row per date: closing quantity and value, daily and cumulative consumption, and DIO (days of inventory on hand). The columns button chooses what to show. Click a date to see the items in stock that day.",
      side: "top",
      align: "start",
    },
    {
      id: "location-details-inventory-date-modal",
      target: '[data-tour="location-summary-inventory-modal"]',
      before: c.openInventoryDate,
      mountsOnDemand: true,
      title: "Inventory on a date",
      description:
        "The items in stock on the date you clicked. Search them, sort by item or closing figures, page through the results, and read the total quantity and value of everything that matches at the bottom. If nothing opened, there are no dates listed yet.",
      side: "bottom",
      align: "center",
    },
    {
      id: "location-details-graph-tabs",
      target: '[data-tour="location-details-graph-tabs"]',
      before: () => c.showGraph("actualVsTarget"),
      mountsOnDemand: true,
      title: "Graphical Presentation",
      description: "Three charts, chosen with these tabs: Actual vs. Target, Category Breakdown and DIO Trend.",
      side: "top",
      align: "start",
    },
    {
      id: "location-details-graph-actual",
      target: '[data-tour="location-details-graph-actual"]',
      before: () => c.showGraph("actualVsTarget"),
      mountsOnDemand: true,
      title: "Actual vs. Target",
      description: "Target against the actual cost per person, by date. The SRC type box narrows it to one SRC type; left empty it averages every SRC type.",
      side: "top",
      align: "start",
    },
    {
      id: "location-details-graph-category",
      target: '[data-tour="location-details-graph-category"]',
      before: () => c.showGraph("categoryBreakdown"),
      mountsOnDemand: true,
      title: "Category Breakdown",
      description: "This month's cost for each spend category. The card's own buttons switch between a donut, bars and a ranked list.",
      side: "top",
      align: "start",
    },
    {
      id: "location-details-graph-dio",
      target: '[data-tour="location-details-graph-dio"]',
      before: () => c.showGraph("dioTrend"),
      mountsOnDemand: true,
      title: "DIO Trend",
      description: "Days of inventory on hand for each date of the month. It loads when this tab opens.",
      side: "top",
      align: "start",
    },
    {
      id: "location-details-finish",
      before: srcData,
      title: "That's the whole screen",
      description: "You've seen every control on Location Details. Open this guide again any time from the ? button beside the title.",
    },
  ];
}
