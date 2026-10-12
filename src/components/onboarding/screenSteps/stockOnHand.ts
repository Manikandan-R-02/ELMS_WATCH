import type { TourStep } from "../onboarding.types";

/**
 * What the tour is allowed to change on StockOnHandPage. Each one sets the *complete* state a step needs — it
 * always closes the download dialogs — so Next, Back and "start over" all land in a known place (see
 * `TourStep.before`). The tour never downloads anything.
 */
export interface StockOnHandTourControls {
  /** The summary lists at least one location, so a location's detail can be opened. */
  hasSummary: boolean;
  /** Show the page with the download dialogs closed. */
  showPage: () => void;
  /** Show the Location Detail with a location chosen (the first listed one when none is) and the dialogs closed. */
  showDetail: () => void;
  /** Open the "Download Stock On Hand report?" confirmation (for all locations). */
  openDownloadConfirm: () => void;
}

/**
 * On-demand "Show tour" walkthrough for StockOnHandPage — started from that page's own help modal (see
 * `useOnboarding().startScreenTour`). Visits every control in reading order: Refresh, the summary's search,
 * Download All and its confirmation, the location table, the location picker and Download Location, then — for a
 * location — the category chart with its metric switch, the item category filter, the item search and the item
 * table. Steps inside the dialog or the location detail set `mountsOnDemand` + `before`.
 */
export function stockOnHandTourSteps(c: StockOnHandTourControls): TourStep[] {
  const page = c.showPage;

  const steps: TourStep[] = [
    {
      id: "stock-on-hand-header",
      target: '[data-tour="stock-on-hand-header"]',
      before: page,
      title: "Stock On Hand",
      description:
        "Every location's Stock On Hand for the reporting month — item count, current, past, previous, average and closing quantity, and stock amount. The ? button beside the title opens this guide again.",
      side: "bottom",
      align: "start",
    },
    {
      id: "stock-on-hand-refresh",
      target: '[data-tour="stock-on-hand-refresh"]',
      requireVisible: true,
      before: page,
      title: "Refresh",
      description: "Clears the chosen location and the item filters and reloads everything from the server.",
      side: "bottom",
      align: "end",
    },
    {
      id: "stock-on-hand-summary",
      target: '[data-tour="stock-on-hand-summary"]',
      requireVisible: true,
      before: page,
      title: "Location wise SOH Summary",
      description:
        "One row per location. The figures are added up location by location, so a big list takes a moment to fill in. Click a location's Code to load its item breakdown below.",
      side: "top",
      align: "start",
    },
    {
      id: "stock-on-hand-summary-search",
      target: '[data-tour="stock-on-hand-summary-search"]',
      requireVisible: true,
      before: page,
      title: "Find a location",
      description: "Type a location code or name to narrow the summary table; the suggestions list the locations.",
      side: "bottom",
      align: "end",
    },
    {
      id: "stock-on-hand-download-all",
      target: '[data-tour="stock-on-hand-download-all"]',
      requireVisible: true,
      before: page,
      title: "Download All",
      description: "Exports the Stock On Hand figures of every location as an Excel file, whatever is chosen below. It asks you to confirm first.",
      side: "bottom",
      align: "end",
    },
    {
      id: "stock-on-hand-download-modal",
      target: '[data-tour="stock-on-hand-download-modal"]',
      before: c.openDownloadConfirm,
      mountsOnDemand: true,
      title: "Confirm the download",
      description:
        "Shows the period, whether it covers all locations or one, and the format. Download generates the file (this can take a moment) and then shows a \"Download started\" message; if the server refuses, its own message appears here. Cancel, Esc or a click outside closes it without downloading.",
      side: "bottom",
      align: "center",
    },
    {
      id: "stock-on-hand-summary-table",
      target: '[data-tour="stock-on-hand-summary-table"]',
      before: page,
      title: "Summary table",
      description: "Headings sort and the page controls move through the locations. Click a Code to open that location's detail.",
      side: "top",
      align: "start",
    },
    {
      id: "stock-on-hand-picker",
      target: '[data-tour="stock-on-hand-picker"]',
      requireVisible: true,
      before: page,
      title: "Pick a location",
      description:
        "Choose a Location Type (All, Segment, Contract or O&M based), then the category it groups by, then a Location — each choice applies at once, so you can jump to a location without scrolling the table.",
      side: "bottom",
      align: "end",
    },
    {
      id: "stock-on-hand-download-location",
      target: '[data-tour="stock-on-hand-download-location"]',
      requireVisible: true,
      before: page,
      title: "Download Location",
      description: "Exports just the chosen location as an Excel file. It stays off until a location is chosen, and asks you to confirm first.",
      side: "bottom",
      align: "end",
    },
  ];

  if (!c.hasSummary) {
    steps.push({
      id: "stock-on-hand-finish",
      before: page,
      title: "Pick a location to see the rest",
      description:
        "The category chart, the item filters and the item table appear once a location is chosen. The summary is empty right now, so they were skipped. Reload the page, then open this guide again from the ? button beside the title.",
    });
    return steps;
  }

  const detail = c.showDetail;
  steps.push(
    {
      id: "stock-on-hand-detail",
      target: '[data-tour="stock-on-hand-detail"]',
      before: detail,
      mountsOnDemand: true,
      title: "Location Detail",
      description: "One location's stock by item. The tour picks the first listed location for you if none is chosen.",
      side: "top",
      align: "start",
    },
    {
      id: "stock-on-hand-chart",
      target: '[data-tour="stock-on-hand-chart"]',
      before: detail,
      mountsOnDemand: true,
      title: "Stock On Hand by Category",
      description:
        "A donut and its table by item category. The switch in the card's corner changes what it measures: Stock Amount, Current Qty or Closing Qty. It always shows the full breakdown, whatever the item filters below are set to.",
      side: "top",
      align: "start",
    },
    {
      id: "stock-on-hand-category",
      target: '[data-tour="stock-on-hand-category"]',
      requireVisible: true,
      before: detail,
      mountsOnDemand: true,
      title: "Item category",
      description: "Narrow the item table to one category, or leave All Category.",
      side: "bottom",
      align: "end",
    },
    {
      id: "stock-on-hand-item-search",
      target: '[data-tour="stock-on-hand-item-search"]',
      requireVisible: true,
      before: detail,
      mountsOnDemand: true,
      title: "Search items",
      description: "Type an item code or name to narrow the item table; the suggestions list the items.",
      side: "bottom",
      align: "end",
    },
    {
      id: "stock-on-hand-detail-table",
      target: '[data-tour="stock-on-hand-detail-table"]',
      before: detail,
      mountsOnDemand: true,
      title: "Item-wise Stock On Hand",
      description:
        "Every item with its quantities, rate and stock amount. An item whose days holding exceeds the location's threshold is flagged with an amber warning icon. Headings sort and the page controls move through the items.",
      side: "top",
      align: "start",
    },
    {
      id: "stock-on-hand-finish",
      before: page,
      title: "That's the whole screen",
      description: "You've seen every control on Stock On Hand. Open this guide again any time from the ? button beside the title.",
    }
  );
  return steps;
}
