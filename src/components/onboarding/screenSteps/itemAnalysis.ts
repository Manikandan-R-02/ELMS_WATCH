import type { TourStep } from "../onboarding.types";

/**
 * What the tour is allowed to change on ItemAnalysisPage. Each one sets the *complete* state a step needs — it
 * always closes the location picker and returns the chart to its all-categories view unless the step is about
 * one of those — so Next, Back and "start over" all land in a known place (see `TourStep.before`). The tour
 * never changes the filters and never fetches.
 */
export interface ItemAnalysisTourControls {
  /** A location is chosen. Everything below the header only exists once one is, so without one the tour covers
   * just the header and the picker. */
  hasLocation: boolean;
  /** The chart has a category with items, so the drilled-in view can be shown. */
  hasDrill: boolean;
  /** Show the page with the picker closed and the chart on all categories. */
  showPage: () => void;
  /** Open the "Select a location" picker. */
  openPicker: () => void;
  /** Show the chart drilled into its first category (picker closed). */
  showDrill: () => void;
}

/**
 * On-demand "Show tour" walkthrough for ItemAnalysisPage — started from that page's own help modal (see
 * `useOnboarding().startScreenTour`). Visits every control in reading order: the location pill and picker,
 * Refresh, Source Type, Category, Date, Fetch / Clear, the category chart and its drilled-in view with the
 * Back button, the item search and the table. Steps inside the picker or the drilled chart set `mountsOnDemand`
 * + `before`.
 */
export function itemAnalysisTourSteps(c: ItemAnalysisTourControls): TourStep[] {
  const page = c.showPage;

  const header: TourStep = {
    id: "item-analysis-header",
    target: '[data-tour="item-analysis-header"]',
    before: page,
    title: "Item Analysis",
    description:
      "One location's item-level consumption cost, broken down by category. The ? button beside the title opens this guide again.",
    side: "bottom",
    align: "start",
  };
  const location: TourStep = {
    id: "item-analysis-location",
    target: '[data-tour="item-analysis-location"]',
    before: page,
    title: "Pick a location",
    description: "Everything on this screen is scoped to one location at a time. Shows the chosen location, or Select location if there is none yet — click it to switch.",
    side: "bottom",
    align: "end",
  };
  const pickerModal: TourStep = {
    id: "item-analysis-picker-modal",
    target: '[data-tour="item-analysis-picker-modal"]',
    before: c.openPicker,
    mountsOnDemand: true,
    title: "Select a location",
    description:
      "Choose a Location type, then the category it groups by, then one specific location, and press View item analysis (it stays off until a location is chosen). Cancel, Esc or a click outside closes it without changing anything.",
    side: "bottom",
    align: "center",
  };

  if (!c.hasLocation) {
    return [
      header,
      location,
      pickerModal,
      {
        id: "item-analysis-finish",
        before: page,
        title: "Pick a location to see the rest",
        description:
          "The filters, chart and item table appear once a location is chosen. Pick one, then open this guide again from the ? button beside the title to see them.",
      },
    ];
  }

  const steps: TourStep[] = [
    header,
    location,
    pickerModal,
    {
      id: "item-analysis-refresh",
      target: '[data-tour="item-analysis-refresh"]',
      requireVisible: true,
      before: page,
      title: "Refresh",
      description: "Reloads the figures for the chosen location with the filters as they are now.",
      side: "bottom",
      align: "end",
    },
    {
      id: "item-analysis-srctype",
      target: '[data-tour="item-analysis-srctype"]',
      requireVisible: true,
      before: page,
      title: "Source type",
      description: "Narrow everything to one source type, or leave All Source Types. The list comes from the server for the chosen location.",
      side: "bottom",
      align: "start",
    },
    {
      id: "item-analysis-category",
      target: '[data-tour="item-analysis-category"]',
      requireVisible: true,
      before: page,
      title: "Category",
      description: "Limit the figures to one item category, or leave All Categories.",
      side: "bottom",
      align: "center",
    },
    {
      id: "item-analysis-date",
      target: '[data-tour="item-analysis-date"]',
      requireVisible: true,
      before: page,
      title: "Date",
      description: "Optionally pick one day. Only days inside the location's billing period can be chosen; the hint under the box shows its billing day.",
      side: "bottom",
      align: "center",
    },
    {
      id: "item-analysis-fetch",
      target: '[data-tour="item-analysis-fetch"]',
      requireVisible: true,
      before: page,
      title: "Fetch and Clear",
      description: "Fetch applies the source type, category and date. Clear resets all three and reloads everything for the month.",
      side: "bottom",
      align: "end",
    },
    {
      id: "item-analysis-chart",
      target: '[data-tour="item-analysis-chart"]',
      before: page,
      title: "Cost by category",
      description:
        "A donut and its legend, one slice per category by cost. Click a slice or a legend row to see that category's items.",
      side: "top",
      align: "start",
    },
  ];

  if (c.hasDrill) {
    steps.push(
      {
        id: "item-analysis-drill",
        target: '[data-tour="item-analysis-chart"]',
        before: c.showDrill,
        mountsOnDemand: true,
        title: "One category's items",
        description: "The tour opens the first category for you. Each slice is now one item of that category; there is nothing deeper, so slices are not clickable here.",
        side: "top",
        align: "start",
      },
      {
        id: "item-analysis-back",
        target: '[data-tour="item-analysis-back"]',
        before: c.showDrill,
        mountsOnDemand: true,
        title: "Back to all categories",
        description: "Returns the chart to the category view. A new fetch also starts back there.",
        side: "bottom",
        align: "end",
      }
    );
  }

  steps.push(
    {
      id: "item-analysis-search",
      target: '[data-tour="item-analysis-search"]',
      requireVisible: true,
      before: page,
      title: "Search the items",
      description: "Type a category, item ID or item name to narrow the table; the suggestions list the items.",
      side: "bottom",
      align: "end",
    },
    {
      id: "item-analysis-table",
      target: '[data-tour="item-analysis-table"]',
      before: page,
      title: "Item details",
      description:
        "Every item with its category, package, quantity, converted quantity with its unit, and cost. Headings sort and the page controls move through the items.",
      side: "top",
      align: "start",
    },
    {
      id: "item-analysis-finish",
      before: page,
      title: "That's the whole screen",
      description: "You've seen every control on Item Analysis. Open this guide again any time from the ? button beside the title.",
    }
  );
  return steps;
}
