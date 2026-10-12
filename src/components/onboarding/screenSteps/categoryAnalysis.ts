import type { TourStep } from "../onboarding.types";

export type CategoryAnalysisTourLevel = "group" | "category" | "item";

/**
 * What the tour is allowed to change on CategoryAnalysisPage. Each one sets the *complete* state a
 * step needs — it always closes the location picker first — so Next, Back and "start over" all land
 * in a known place (see `TourStep.before`).
 */
export interface CategoryAnalysisTourControls {
  /** A location is chosen. Everything below the header only exists once one is, so without one the
   * tour covers just the header and the picker. */
  hasLocation: boolean;
  /** The location has category data, so the category level can be opened on its first group. */
  hasGroup: boolean;
  /** …and that group has a category, so the item level can be opened on it. */
  hasCategory: boolean;
  /** Show this drill level (group → category → item) with the picker closed. The category and item
   * levels open on the first group / category. */
  showLevel: (level: CategoryAnalysisTourLevel) => void;
  /** Open the "Select a location" picker. */
  openPicker: () => void;
}

/**
 * On-demand "Show tour" walkthrough for CategoryAnalysisPage — started from that page's own help
 * modal (see `useOnboarding().startScreenTour`). Visits every part of the screen in reading order,
 * including what only appears after a click: the location picker and all three drill levels (group,
 * category, item). Steps inside the picker set `mountsOnDemand` + `before`.
 */
export function categoryAnalysisTourSteps(c: CategoryAnalysisTourControls): TourStep[] {
  const group = () => c.showLevel("group");

  const header: TourStep = {
    id: "category-analysis-header",
    target: '[data-tour="category-analysis-header"]',
    before: group,
    title: "Category Analysis",
    description:
      "One location's spending drilled down from group → category → item, with a donut chart and table at each level. The ? button beside the title opens this guide again.",
    side: "bottom",
    align: "start",
  };
  const location: TourStep = {
    id: "category-analysis-location",
    target: '[data-tour="category-analysis-location"]',
    before: group,
    title: "Pick a location",
    description: "Everything on this screen is scoped to one location at a time. Shows the chosen location, or Select location if there is none yet — click it to switch.",
    side: "bottom",
    align: "end",
  };
  const pickerModal: TourStep = {
    id: "category-analysis-picker-modal",
    target: '[data-tour="category-analysis-picker-modal"]',
    before: c.openPicker,
    mountsOnDemand: true,
    title: "Select a location",
    description:
      "Choose a Location type, then the category it groups by, then one specific location, and press View category analysis (it stays off until a location is chosen). Cancel, Esc or a click outside closes it without changing anything.",
    side: "bottom",
    align: "center",
  };

  if (!c.hasLocation) {
    return [
      header,
      location,
      pickerModal,
      {
        id: "category-analysis-finish",
        before: group,
        title: "Pick a location to see the rest",
        description:
          "The filters, chart and tables appear once a location is chosen. Pick one, then open this guide again from the ? button beside the title to see them.",
      },
    ];
  }

  const steps: TourStep[] = [
    header,
    location,
    pickerModal,
    {
      id: "category-analysis-refresh",
      target: '[data-tour="category-analysis-refresh"]',
      requireVisible: true,
      before: group,
      title: "Refresh",
      description: "Reloads the figures for the chosen location with the filters as they are now.",
      side: "bottom",
      align: "end",
    },
    {
      id: "category-analysis-srctype",
      target: '[data-tour="category-analysis-srctype"]',
      requireVisible: true,
      before: group,
      title: "Source type",
      description: "Narrow everything to one source type, or leave All Source Types. The list comes from the server for the chosen location.",
      side: "bottom",
      align: "start",
    },
    {
      id: "category-analysis-date",
      target: '[data-tour="category-analysis-date"]',
      requireVisible: true,
      before: group,
      title: "Date",
      description: "Optionally pick one day. Only days inside the location's billing period can be chosen; the hint under the box shows its billing day.",
      side: "bottom",
      align: "center",
    },
    {
      id: "category-analysis-fetch",
      target: '[data-tour="category-analysis-fetch"]',
      requireVisible: true,
      before: group,
      title: "Fetch and Clear",
      description: "Fetch applies the source type and date. Clear resets both and reloads everything for the period.",
      side: "bottom",
      align: "end",
    },
    {
      id: "category-analysis-pob",
      target: '[data-tour="category-analysis-pob"]',
      requireVisible: true,
      before: group,
      title: "POB",
      description: "People on board for the period. It appears once data loads, and the item level uses it for its per-person columns.",
      side: "bottom",
      align: "start",
    },
    {
      id: "category-analysis-chart-group",
      target: '[data-tour="category-analysis-chart"]',
      before: group,
      title: "Spending by group",
      description:
        "A donut and its legend, one slice per group. Click a slice, a bar or a legend row to go one level deeper. The View All / Top / Least box in the card's corner limits both the chart and the legend to the highest or lowest rows.",
      side: "top",
      align: "start",
    },
    {
      id: "category-analysis-search",
      target: '[data-tour="category-analysis-search"]',
      requireVisible: true,
      before: group,
      title: "Search the rows",
      description: "Type to filter the table and chart at whichever level is open; the suggestions follow that level.",
      side: "bottom",
      align: "end",
    },
    {
      id: "category-analysis-table-group",
      target: '[data-tour="category-analysis-table"]',
      before: group,
      title: "Groups",
      description:
        "Categories added up by group: quantity, amount and share of the total. Click a heading to sort, use the page controls under the table, and click a row to open that group's categories.",
      side: "top",
      align: "start",
    },
  ];

  if (c.hasGroup) {
    const category = () => c.showLevel("category");
    steps.push(
      {
        id: "category-analysis-back",
        target: '[data-tour="category-analysis-back"]',
        before: category,
        mountsOnDemand: true,
        title: "Back",
        description: "Appears below the first level. Goes back up one level (item → category → group); the line beside it shows where you are.",
        side: "bottom",
        align: "start",
      },
      {
        id: "category-analysis-chart-category",
        target: '[data-tour="category-analysis-chart"]',
        before: category,
        mountsOnDemand: true,
        title: "Categories in a group",
        description: "The same donut, now one slice per category inside the group you opened. Click a slice or a legend row to see that category's items.",
        side: "top",
        align: "start",
      },
      {
        id: "category-analysis-table-category",
        target: '[data-tour="category-analysis-table"]',
        before: category,
        mountsOnDemand: true,
        title: "Categories",
        description: "Quantity, converted quantity, amount and share for each category of the group. Click a row to open its items.",
        side: "top",
        align: "start",
      }
    );
  }

  if (c.hasCategory) {
    const item = () => c.showLevel("item");
    steps.push(
      {
        id: "category-analysis-chart-item",
        target: '[data-tour="category-analysis-chart"]',
        before: item,
        mountsOnDemand: true,
        title: "Items in a category",
        description: "One slice per item of the category you opened. There is nothing deeper, so slices are not clickable here.",
        side: "top",
        align: "start",
      },
      {
        id: "category-analysis-table-item",
        target: '[data-tour="category-analysis-table"]',
        before: item,
        mountsOnDemand: true,
        title: "Item details",
        description: "Each item's quantity, converted quantity and cost, plus Qty/Person and Cost/Person worked out from the POB.",
        side: "top",
        align: "start",
      }
    );
  }

  steps.push({
    id: "category-analysis-finish",
    before: group,
    title: "That's the whole screen",
    description: "You've seen every control on Category Analysis. Open this guide again any time from the ? button beside the title.",
  });
  return steps;
}
