import type { TourStep } from "../onboarding.types";

export type LocationInsightGraphTab = "cumulDailyCost" | "dailyConsumption" | "mandays" | "splitByPrj";

/**
 * What the tour is allowed to change on LocationInsightPage. Each one sets the *complete* state a
 * step needs — it always closes the location picker first — so Next, Back and "start over" all
 * land in a known place (see `TourStep.before`).
 */
export interface LocationInsightTourControls {
  /** A location is chosen. The figures and charts only exist once one is, so without one the tour
   * covers just the header, the picker and Refresh. */
  hasLocation: boolean;
  /** Show this chart in the Graphical Presentation card with the picker closed. */
  showGraph: (tab: LocationInsightGraphTab) => void;
  /** Open the "Select a location" picker. */
  openPicker: () => void;
}

/**
 * On-demand "Show tour" walkthrough for LocationInsightPage — started from that page's own help
 * modal (see `useOnboarding().startScreenTour`). Visits every part of the screen in reading order,
 * including what only appears after a click: the location picker and all four charts. Steps inside
 * the picker set `mountsOnDemand` + `before`.
 */
export function locationInsightTourSteps(c: LocationInsightTourControls): TourStep[] {
  const first = () => c.showGraph("cumulDailyCost");

  const header: TourStep = {
    id: "location-insight-header",
    target: '[data-tour="location-insight-header"]',
    before: first,
    title: "Location Insight",
    description:
      "One location's mandays, cost and consumption trends for the reporting month picked in the header, as charts rather than tables. The ? button beside the title opens this guide again.",
    side: "bottom",
    align: "start",
  };
  const picker: TourStep = {
    id: "location-insight-picker",
    target: '[data-tour="location-insight-picker"]',
    before: first,
    title: "Pick a location",
    description: "Shows the chosen location, or Select location if there is none yet. Click it to open the picker.",
    side: "bottom",
    align: "end",
  };
  const pickerModal: TourStep = {
    id: "location-insight-picker-modal",
    target: '[data-tour="location-details-picker-modal"]',
    before: c.openPicker,
    mountsOnDemand: true,
    title: "Select a location",
    description:
      "Choose a Location type, then the category it groups by, then one specific location, and confirm it. Cancel, Esc or a click outside closes it without changing anything.",
    side: "bottom",
    align: "center",
  };
  const refresh: TourStep = {
    id: "location-insight-refresh",
    target: '[data-tour="location-insight-refresh"]',
    requireVisible: true,
    before: first,
    title: "Refresh",
    description: "Reloads the figures and charts for the chosen location and reporting month.",
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
        id: "location-insight-finish",
        before: first,
        title: "Pick a location to see the rest",
        description:
          "The headline figures and the four charts appear once a location is chosen. Pick one, then open this guide again from the ? button beside the title to see them.",
      },
    ];
  }

  const chart = (tab: LocationInsightGraphTab, title: string, description: string): TourStep => ({
    id: `location-insight-chart-${tab}`,
    target: '[data-tour="location-insight-charts"]',
    before: () => c.showGraph(tab),
    title,
    description,
    side: "top",
    align: "start",
  });

  return [
    header,
    picker,
    pickerModal,
    refresh,
    {
      id: "location-insight-stats",
      target: '[data-tour="location-insight-stats"]',
      before: first,
      title: "Headline figures",
      description:
        "The chosen location, its total mandays, total cost and cumulative daily cost for the reporting month. Clicking the Location card opens the picker too.",
      side: "bottom",
      align: "start",
    },
    {
      id: "location-insight-tabs",
      target: '[data-tour="location-insight-tabs"]',
      before: first,
      title: "Four charts",
      description: "One chart shows at a time. Click a tab to switch, or use the arrow keys once a tab is focused.",
      side: "bottom",
      align: "start",
    },
    chart("cumulDailyCost", "Cumul Daily Cost", "Cost per manday, cumulative through the month. Hover a day for the exact figure."),
    chart("dailyConsumption", "Daily Consumption", "The amount consumed on each day of the month, as bars."),
    chart("mandays", "Mandays", "Mandays worked on each day of the month."),
    chart("splitByPrj", "Split By PRJ", "Each day's cost split into Food, Cleaning, Disposal and Others, one line each."),
    {
      id: "location-insight-finish",
      before: first,
      title: "That's the whole screen",
      description: "You've seen every control on Location Insight. Open this guide again any time from the ? button beside the title.",
    },
  ];
}
