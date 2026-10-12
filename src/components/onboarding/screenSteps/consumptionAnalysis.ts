import type { TourStep } from "../onboarding.types";

export type ConsumptionAnalysisTourTab = "category" | "srcType" | "srcTypePerManday";

/**
 * What the tour is allowed to change on ConsumptionAnalysisPage. Each one sets the *complete* state a step needs
 * — it always closes the dialogs and returns the chart to the Category tab unless the step is about one of
 * those — so Next, Back and "start over" all land in a known place (see `TourStep.before`). The tour never
 * applies a filter and never downloads anything.
 */
export interface ConsumptionAnalysisTourControls {
  /** The summary lists at least one location, so a location's detail can be opened. */
  hasSummary: boolean;
  /** The location already shown has source-type data (a "Source Type" chart tab). */
  hasSrcType: boolean;
  /** …and per-manday data (a "Source Type / Manday" chart tab). */
  hasPerManday: boolean;
  /** …and a category whose items the chart can be drilled into. */
  hasDrill: boolean;
  /** Show the page with every dialog closed and the chart on the Category tab. */
  showPage: () => void;
  /** Show the Location Detail with a location chosen (the first listed one when none is) and the chart on Category. */
  showDetail: () => void;
  /** Open the "Filter consumption detail" dialog. */
  openFilter: () => void;
  /** Open the "Download consumption report?" confirmation. */
  openDownloadConfirm: () => void;
  /** Show the location's chart on this tab, optionally drilled into its first category (Category tab only). */
  showChart: (tab: ConsumptionAnalysisTourTab, drilled: boolean) => void;
}

/**
 * On-demand "Show tour" walkthrough for ConsumptionAnalysisPage — started from that page's own help modal (see
 * `useOnboarding().startScreenTour`). Visits every control in reading order: Refresh, the summary's search,
 * Download Excel and its confirmation, the location table, the Filters button and its dialog, Clear, then — for a
 * location — the chart with its metric switch, tabs and drilled-in view, and the item table. Steps inside a
 * dialog or the location detail set `mountsOnDemand` + `before`.
 */
export function consumptionAnalysisTourSteps(c: ConsumptionAnalysisTourControls): TourStep[] {
  const page = c.showPage;

  const steps: TourStep[] = [
    {
      id: "consumption-analysis-header",
      target: '[data-tour="consumption-analysis-header"]',
      before: page,
      title: "Consumption Analysis",
      description:
        "Every location's consumption for the reporting month, plus one location's full item-level breakdown once you pick it. The ? button beside the title opens this guide again.",
      side: "bottom",
      align: "start",
    },
    {
      id: "consumption-analysis-refresh",
      target: '[data-tour="consumption-analysis-refresh"]',
      requireVisible: true,
      before: page,
      title: "Refresh",
      description: "Clears the filters and reloads the summary and the location detail from the server.",
      side: "bottom",
      align: "end",
    },
    {
      id: "consumption-analysis-summary",
      target: '[data-tour="consumption-analysis-summary"]',
      requireVisible: true,
      before: page,
      title: "Location wise Consumption Summary",
      description: "Every location's items, quantity, converted quantity and amount for the period. Click a location's Code to load its detail below.",
      side: "top",
      align: "start",
    },
    {
      id: "consumption-analysis-summary-search",
      target: '[data-tour="consumption-analysis-summary-search"]',
      requireVisible: true,
      before: page,
      title: "Find a location",
      description: "Type a location code or name to narrow the summary table; the suggestions list the locations.",
      side: "bottom",
      align: "end",
    },
    {
      id: "consumption-analysis-download",
      target: '[data-tour="consumption-analysis-download"]',
      requireVisible: true,
      before: page,
      title: "Download Excel",
      description: "Exports the consumption figures as an Excel file — for every location, or just the one chosen in the detail below. It asks you to confirm first.",
      side: "bottom",
      align: "end",
    },
    {
      id: "consumption-analysis-download-modal",
      target: '[data-tour="consumption-analysis-download-modal"]',
      before: c.openDownloadConfirm,
      mountsOnDemand: true,
      title: "Confirm the download",
      description:
        "Shows the period, whether it covers all locations or one, and the format. Download generates the file (this can take a moment) and then shows a \"Download started\" message; if the server refuses, its own message appears here. Cancel, Esc or a click outside closes it without downloading.",
      side: "bottom",
      align: "center",
    },
    {
      id: "consumption-analysis-summary-table",
      target: '[data-tour="consumption-analysis-summary-table"]',
      before: page,
      title: "Summary table",
      description: "Headings sort and the page controls move through the locations. Code and name stay pinned while you scroll sideways. Click a Code to open that location's detail.",
      side: "top",
      align: "start",
    },
    {
      id: "consumption-analysis-filter",
      target: '[data-tour="consumption-analysis-filter"]',
      requireVisible: true,
      before: page,
      title: "Filters",
      description: "Shows what is applied to the Location Detail, or No location selected. Click it to open the filters.",
      side: "bottom",
      align: "end",
    },
    {
      id: "consumption-analysis-filter-modal",
      target: '[data-tour="consumption-analysis-filter-modal"]',
      before: c.openFilter,
      mountsOnDemand: true,
      title: "Filter consumption detail",
      description:
        "Choose a Location Type (All, Segment, Contract or O&M based), then the category it groups by, then one Location; then an Item Category and a Source Type (the source type needs a location first). Anything left on its default means everything.",
      side: "bottom",
      align: "center",
    },
    {
      id: "consumption-analysis-filter-apply",
      target: '[data-tour="consumption-analysis-filter-apply"]',
      before: c.openFilter,
      mountsOnDemand: true,
      title: "Apply",
      description: "Applies the choices and loads that location's detail. Cancel, Esc or a click outside closes the dialog and keeps what was applied before.",
      side: "top",
      align: "end",
    },
    {
      id: "consumption-analysis-clear",
      target: '[data-tour="consumption-analysis-clear"]',
      requireVisible: true,
      before: page,
      title: "Clear filters",
      description: "The X appears beside the Filters button once something is applied. It removes every filter and returns to the empty detail.",
      side: "bottom",
      align: "end",
    },
  ];

  if (!c.hasSummary) {
    steps.push({
      id: "consumption-analysis-finish",
      before: page,
      title: "Pick a location to see the rest",
      description:
        "The chart and the item table appear once a location is chosen — from its Code in the summary or from Filters. The summary is empty right now, so they were skipped. Reload the page, then open this guide again from the ? button beside the title.",
    });
    return steps;
  }

  const detail = c.showDetail;
  steps.push(
    {
      id: "consumption-analysis-detail",
      target: '[data-tour="consumption-analysis-detail"]',
      before: detail,
      mountsOnDemand: true,
      title: "Location Detail",
      description: "One location's consumption by item. The tour picks the first listed location for you if none is chosen.",
      side: "top",
      align: "start",
    },
    {
      id: "consumption-analysis-chart",
      target: '[data-tour="consumption-analysis-chart"]',
      before: detail,
      mountsOnDemand: true,
      title: "Consumption Breakdown",
      description:
        "A donut and its legend by category. Click a slice, bar or legend row to see the items inside it. A location that has source-type data also gets Source Type and Source Type / Manday tabs here.",
      side: "top",
      align: "start",
    },
    {
      id: "consumption-analysis-chart-metric",
      target: '[data-tour="consumption-analysis-chart-metric"]',
      before: detail,
      mountsOnDemand: true,
      title: "What the chart measures",
      description: "On the Category tab: Amount, Qty, Converted Qty or Pkg Converted Qty. The other tabs have their own Qty / Converted Qty switch.",
      side: "bottom",
      align: "start",
    }
  );

  if (c.hasSrcType || c.hasPerManday) {
    steps.push({
      id: "consumption-analysis-chart-tabs",
      target: '[data-tour="consumption-analysis-chart-tabs"]',
      before: () => c.showChart("category", false),
      mountsOnDemand: true,
      title: "Chart tabs",
      description: "Category, Source Type, and Source Type / Manday (the same figures per manday). Switching tab returns the chart to its top level.",
      side: "bottom",
      align: "end",
    });
  }
  if (c.hasSrcType) {
    steps.push({
      id: "consumption-analysis-chart-srctype",
      target: '[data-tour="consumption-analysis-chart"]',
      before: () => c.showChart("srcType", false),
      mountsOnDemand: true,
      title: "Source Type",
      description: "Quantity or converted quantity split by source type; click a source type to see its items.",
      side: "top",
      align: "start",
    });
  }
  if (c.hasPerManday) {
    steps.push({
      id: "consumption-analysis-chart-perManday",
      target: '[data-tour="consumption-analysis-chart"]',
      before: () => c.showChart("srcTypePerManday", false),
      mountsOnDemand: true,
      title: "Source Type / Manday",
      description: "The same split divided by mandays, so locations of different sizes can be compared.",
      side: "top",
      align: "start",
    });
  }
  if (c.hasDrill) {
    steps.push(
      {
        id: "consumption-analysis-chart-drill",
        target: '[data-tour="consumption-analysis-chart"]',
        before: () => c.showChart("category", true),
        mountsOnDemand: true,
        title: "One category's items",
        description: "The tour opens the first category for you. Each slice is now one item of that category.",
        side: "top",
        align: "start",
      },
      {
        id: "consumption-analysis-chart-back",
        target: '[data-tour="consumption-analysis-chart-back"]',
        before: () => c.showChart("category", true),
        mountsOnDemand: true,
        title: "Back",
        description: "Returns the chart to its top level.",
        side: "bottom",
        align: "end",
      }
    );
  }

  steps.push(
    {
      id: "consumption-analysis-detail-table",
      target: '[data-tour="consumption-analysis-detail-table"]',
      before: detail,
      mountsOnDemand: true,
      title: "Item-wise Consumption",
      description:
        "Every item with its category, source type, unit, quantity, converted quantity, unit price and amount. Headings sort and the page controls move through the items; item code and name stay pinned while you scroll sideways.",
      side: "top",
      align: "start",
    },
    {
      id: "consumption-analysis-finish",
      before: page,
      title: "That's the whole screen",
      description: "You've seen every control on Consumption Analysis. Open this guide again any time from the ? button beside the title.",
    }
  );
  return steps;
}
