import type { TourStep } from "../onboarding.types";

/**
 * What the tour is allowed to change on ItemBreakupPage. Each one sets the *complete* state a step
 * needs — it always closes the Filters modal first (except the step that shows it) — so Next, Back
 * and "start over" all land in a known place (see `TourStep.before`).
 */
export interface ItemBreakupTourControls {
  /** A location and an item category are applied. The months/search toolbar and the table only exist
   * once they are, so without them the tour covers just the header and the Filters modal. */
  hasFilter: boolean;
  /** Show the page with the Filters modal closed. */
  showPage: () => void;
  /** Open the "Filter item breakup" modal. */
  openFilter: () => void;
}

/**
 * On-demand "Show tour" walkthrough for ItemBreakupPage — started from that page's own help modal
 * (see `useOnboarding().startScreenTour`). Visits every part of the screen in reading order,
 * including what only appears after a click: the Filters modal. The modal step sets `mountsOnDemand`
 * + `before`.
 */
export function itemBreakupTourSteps(c: ItemBreakupTourControls): TourStep[] {
  const header: TourStep = {
    id: "item-breakup-header",
    target: '[data-tour="item-breakup-header"]',
    before: c.showPage,
    title: "Item Breakup",
    description:
      "Every item in one category at one location, with its quantity, converted quantity and cost for the reporting month and the months before it. The ? button beside the title opens this guide again.",
    side: "bottom",
    align: "start",
  };
  const filters: TourStep = {
    id: "item-breakup-filters",
    target: '[data-tour="item-breakup-filters"]',
    before: c.showPage,
    title: "Pick a location and category",
    description:
      "Shows the applied location and item category, or No filters applied. Click it to open Filters — both a location and a category are needed before any data loads.",
    side: "bottom",
    align: "end",
  };
  const filterModal: TourStep = {
    id: "item-breakup-filter-modal",
    target: '[data-tour="item-breakup-filter-modal"]',
    before: c.openFilter,
    mountsOnDemand: true,
    title: "Filter item breakup",
    description:
      "Choose a Location Type (All, Segment, Contract or O&M based), then the category it groups by, then one Location, and finally the item Category. Apply stays off until a location and a category are chosen; Cancel, Esc or a click outside closes it without changing anything.",
    side: "bottom",
    align: "center",
  };

  if (!c.hasFilter) {
    return [
      header,
      filters,
      filterModal,
      {
        id: "item-breakup-finish",
        before: c.showPage,
        title: "Apply filters to see the rest",
        description:
          "The months switch, search and item table appear once a location and category are applied. Apply them, then open this guide again from the ? button beside the title to see them.",
      },
    ];
  }

  return [
    header,
    filters,
    filterModal,
    {
      id: "item-breakup-clear",
      target: '[data-tour="item-breakup-clear"]',
      requireVisible: true,
      before: c.showPage,
      title: "Clear filters",
      description: "The X beside the Filters button appears once filters are applied. It removes both and returns to the empty state.",
      side: "bottom",
      align: "end",
    },
    {
      id: "item-breakup-months",
      target: '[data-tour="item-breakup-months"]',
      before: c.showPage,
      title: "3 / 6 / 9 / 12 months",
      description: "How many months of history show beside the reporting month. It only changes which columns are visible, not what is loaded.",
      side: "bottom",
      align: "start",
    },
    {
      id: "item-breakup-search",
      target: '[data-tour="item-breakup-search"]',
      requireVisible: true,
      before: c.showPage,
      title: "Search the items",
      description: "Type a category, item ID or item name to narrow the table; the suggestions list the items.",
      side: "bottom",
      align: "end",
    },
    {
      id: "item-breakup-table",
      target: '[data-tour="item-breakup-table"]',
      before: c.showPage,
      title: "Quantity, converted quantity and cost",
      description:
        "Category, item and package details stay pinned on the left while you scroll sideways. Each month then has Qty, Con Qty (the quantity multiplied by the package conversion, turning package units into consumption units) and Cost, under a month label with its colour. Click a heading to sort, and use the page controls under the table.",
      side: "top",
      align: "start",
    },
    {
      id: "item-breakup-finish",
      before: c.showPage,
      title: "That's the whole screen",
      description: "You've seen every control on Item Breakup. Open this guide again any time from the ? button beside the title.",
    },
  ];
}
