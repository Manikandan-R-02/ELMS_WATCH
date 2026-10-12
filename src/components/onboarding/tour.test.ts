import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveVisibleTarget } from "./tourUtils";
import { overallSummaryTourSteps, type OverallSummaryTourControls, type WasteInsightsView } from "./screenSteps/overallSummary";
import {
  locationDetailsTourSteps,
  type LocationDetailsGraphTab,
  type LocationDetailsTab,
  type LocationDetailsTourControls,
} from "./screenSteps/locationDetails";
import { consumptionAnalysisTourSteps, type ConsumptionAnalysisTourControls, type ConsumptionAnalysisTourTab } from "./screenSteps/consumptionAnalysis";
import { headerTourSteps, navIntroStep } from "./tourSteps";
import { stockOnHandTourSteps } from "./screenSteps/stockOnHand";
import { itemAnalysisTourSteps, type ItemAnalysisTourControls } from "./screenSteps/itemAnalysis";
import { userLogTourSteps, type UserLogTourControls, type UserLogTourPeriod } from "./screenSteps/userLog";
import { locationRightsTourSteps, type LocationRightsTourControls } from "./screenSteps/locationRights";
import { userMasterTourSteps, type UserMasterTourControls } from "./screenSteps/userMaster";
import { productivityTourSteps } from "./screenSteps/productivity";
import { targetPrjTourSteps, type TargetPrjTourControls } from "./screenSteps/targetPrj";
import { dailyPrjTourSteps, type DailyPrjTourControls } from "./screenSteps/dailyPrj";
import { dataTrackerReportTourSteps } from "./screenSteps/dataTrackerReport";
import { reportTourSteps } from "./screenSteps/report";
import { itemBreakupTourSteps, type ItemBreakupTourControls } from "./screenSteps/itemBreakup";
import { categoryAnalysisTourSteps, type CategoryAnalysisTourControls, type CategoryAnalysisTourLevel } from "./screenSteps/categoryAnalysis";
import {
  locationSummaryTourSteps,
  type LocationSummaryChartsView,
  type LocationSummaryTab,
  type LocationSummaryTourControls,
  type LocationSummaryWasteView,
} from "./screenSteps/locationSummary";

/** jsdom has no layout, so every element reports no client rects ("hidden") — fake a visible one. */
function addTarget(value: string, visible: boolean): HTMLElement {
  const el = document.createElement("div");
  el.setAttribute("data-tour", value);
  Object.defineProperty(el, "getClientRects", { value: () => (visible ? [{}] : []) });
  document.body.appendChild(el);
  return el;
}

describe("resolveVisibleTarget", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns undefined when nothing matches", () => {
    expect(resolveVisibleTarget('[data-tour="missing"]')).toBeUndefined();
  });

  it("treats a hidden (display:none) match as absent", () => {
    addTarget("only-hidden", false);
    expect(resolveVisibleTarget('[data-tour="only-hidden"]')).toBeUndefined();
  });

  it("skips a hidden twin that comes first and returns the visible one (sm:hidden / hidden sm:flex pairs)", () => {
    addTarget("pair", false);
    const visible = addTarget("pair", true);
    expect(resolveVisibleTarget('[data-tour="pair"]')).toBe(visible);
  });
});

function controls() {
  return {
    showSummaryTab: vi.fn<() => void>(),
    showCategoriesTab: vi.fn<() => void>(),
    openFirstCategory: vi.fn<() => void>(),
    openCharts: vi.fn<() => void>(),
    openWasteInsights: vi.fn<(view: WasteInsightsView) => void>(),
  } satisfies OverallSummaryTourControls;
}

describe("overallSummaryTourSteps", () => {
  it("visits every part of the screen, including the modals and the Categories tab", () => {
    const ids = overallSummaryTourSteps(controls()).map((s) => s.id);
    expect(ids).toEqual([
      "overall-summary-header",
      "overall-summary-refresh",
      "overall-summary-stats",
      "overall-summary-chart",
      "overall-summary-tabs",
      "overall-summary-filters",
      "overall-summary-table",
      "overall-summary-categories",
      "overall-summary-category-detail",
      "overall-summary-view-charts",
      "overall-summary-charts-modal",
      "overall-summary-waste-button",
      "overall-summary-waste-tabs",
      "overall-summary-waste-locations",
      "overall-summary-waste-food",
      "overall-summary-waste-reasons",
      "overall-summary-finish",
    ]);
  });

  it("gives every step that mounts on demand a `before` that prepares it", () => {
    const onDemand = overallSummaryTourSteps(controls()).filter((s) => s.mountsOnDemand);
    expect(onDemand.length).toBeGreaterThan(0);
    for (const step of onDemand) expect(step.before, step.id).toBeTypeOf("function");
  });

  it("ends on a targetless step so the engine always has a step after the last on-demand one", () => {
    const last = overallSummaryTourSteps(controls()).at(-1)!;
    expect(last.target).toBeUndefined();
    expect(last.mountsOnDemand).toBeFalsy();
  });

  it("opens each of the three waste views and the charts modal through the controls", () => {
    const c = controls();
    const byId = Object.fromEntries(overallSummaryTourSteps(c).map((s) => [s.id, s]));

    byId["overall-summary-charts-modal"].before?.();
    expect(c.openCharts).toHaveBeenCalledTimes(1);

    byId["overall-summary-waste-locations"].before?.();
    byId["overall-summary-waste-food"].before?.();
    byId["overall-summary-waste-reasons"].before?.();
    expect(c.openWasteInsights.mock.calls.map((call) => call[0])).toEqual(["locations", "foodItems", "reasons"]);

    byId["overall-summary-categories"].before?.();
    expect(c.showCategoriesTab).toHaveBeenCalledTimes(1);
    byId["overall-summary-category-detail"].before?.();
    expect(c.openFirstCategory).toHaveBeenCalledTimes(1);
  });
});

function locationControls() {
  return {
    showTab: vi.fn<(tab: LocationSummaryTab) => void>(),
    openFilter: vi.fn<() => void>(),
    openInventory: vi.fn<() => void>(),
    openCharts: vi.fn<(view: LocationSummaryChartsView) => void>(),
    openWaste: vi.fn<(view: LocationSummaryWasteView) => void>(),
  } satisfies LocationSummaryTourControls;
}

describe("locationSummaryTourSteps", () => {
  it("visits every control: header, filter, search, cards, chart, all five tabs, and every modal", () => {
    const ids = locationSummaryTourSteps(locationControls()).map((s) => s.id);
    expect(ids).toEqual([
      "location-summary-header",
      "location-summary-filter",
      "location-summary-filter-modal",
      "location-summary-refresh",
      "location-summary-search",
      "location-summary-stats",
      "location-summary-chart",
      "location-summary-tab-strip",
      "location-summary-columns",
      "location-summary-tenday",
      "location-summary-table",
      "location-summary-inventory-modal",
      "location-summary-view-charts",
      "location-summary-charts-cost",
      "location-summary-charts-target",
      "location-summary-waste-button",
      "location-summary-waste-reasons",
      "location-summary-waste-items",
      "location-summary-month-range",
      "location-summary-month-table",
      "location-summary-custom-pickers",
      "location-summary-custom-table",
      "location-summary-daily-range",
      "location-summary-daily-table",
      "location-summary-graphs",
      "location-summary-finish",
    ]);
  });

  it("gives every on-demand step a `before`, and ends on a targetless step", () => {
    const steps = locationSummaryTourSteps(locationControls());
    for (const step of steps.filter((s) => s.mountsOnDemand)) expect(step.before, step.id).toBeTypeOf("function");
    const last = steps.at(-1)!;
    expect(last.target).toBeUndefined();
    expect(last.mountsOnDemand).toBeFalsy();
  });

  it("sets up the right tab or modal for each step through the controls", () => {
    const c = locationControls();
    const byId = Object.fromEntries(locationSummaryTourSteps(c).map((s) => [s.id, s]));

    byId["location-summary-filter-modal"].before?.();
    expect(c.openFilter).toHaveBeenCalledTimes(1);
    byId["location-summary-inventory-modal"].before?.();
    expect(c.openInventory).toHaveBeenCalledTimes(1);

    byId["location-summary-charts-cost"].before?.();
    byId["location-summary-charts-target"].before?.();
    expect(c.openCharts.mock.calls.map((call) => call[0])).toEqual(["costWaste", "targetActual"]);
    byId["location-summary-waste-reasons"].before?.();
    byId["location-summary-waste-items"].before?.();
    expect(c.openWaste.mock.calls.map((call) => call[0])).toEqual(["reasons", "topItems"]);

    byId["location-summary-month-table"].before?.();
    byId["location-summary-custom-table"].before?.();
    byId["location-summary-daily-table"].before?.();
    byId["location-summary-graphs"].before?.();
    expect(c.showTab.mock.calls.map((call) => call[0])).toEqual(["monthComparison", "customCompare", "dailyPrj", "locationGraphs"]);
  });

  it("returns Back-navigation to the Summary tab for steps that live on it", () => {
    const c = locationControls();
    const byId = Object.fromEntries(locationSummaryTourSteps(c).map((s) => [s.id, s]));
    byId["location-summary-table"].before?.();
    byId["location-summary-waste-button"].before?.();
    byId["location-summary-finish"].before?.();
    expect(c.showTab.mock.calls.map((call) => call[0])).toEqual(["summary", "summary", "summary"]);
  });
});

function detailsControls(hasLocation = true) {
  return {
    hasLocation,
    showTab: vi.fn<(tab: LocationDetailsTab) => void>(),
    showGraph: vi.fn<(tab: LocationDetailsGraphTab) => void>(),
    openPicker: vi.fn<() => void>(),
    openInventoryDate: vi.fn<() => void>(),
  } satisfies LocationDetailsTourControls;
}

describe("locationDetailsTourSteps", () => {
  it("visits every part of the screen: picker, all five data tabs and all three charts", () => {
    const ids = locationDetailsTourSteps(detailsControls()).map((s) => s.id);
    expect(ids).toEqual([
      "location-details-header",
      "location-details-picker",
      "location-details-picker-modal",
      "location-details-refresh",
      "location-details-stats",
      "location-details-chart",
      "location-details-tab-strip",
      "location-details-search",
      "location-details-src-table",
      "location-details-consumption-table",
      "location-details-split-table",
      "location-details-compare-pickers",
      "location-details-compare-table",
      "location-details-inventory-table",
      "location-details-inventory-date-modal",
      "location-details-graph-tabs",
      "location-details-graph-actual",
      "location-details-graph-category",
      "location-details-graph-dio",
      "location-details-finish",
    ]);
  });

  it("with no location chosen, covers only the header and the picker (the rest doesn't exist yet)", () => {
    const steps = locationDetailsTourSteps(detailsControls(false));
    expect(steps.map((s) => s.id)).toEqual([
      "location-details-header",
      "location-details-picker",
      "location-details-picker-modal",
      "location-details-refresh",
      "location-details-finish",
    ]);
    expect(steps.at(-1)!.target).toBeUndefined();
  });

  it("gives every on-demand step a `before`, and ends on a targetless step", () => {
    for (const hasLocation of [true, false]) {
      const steps = locationDetailsTourSteps(detailsControls(hasLocation));
      for (const step of steps.filter((s) => s.mountsOnDemand)) expect(step.before, step.id).toBeTypeOf("function");
      const last = steps.at(-1)!;
      expect(last.target).toBeUndefined();
      expect(last.mountsOnDemand).toBeFalsy();
    }
  });

  it("opens the picker and sets each data tab and chart through the controls", () => {
    const c = detailsControls();
    const byId = Object.fromEntries(locationDetailsTourSteps(c).map((s) => [s.id, s]));

    byId["location-details-picker-modal"].before?.();
    expect(c.openPicker).toHaveBeenCalledTimes(1);

    for (const id of ["location-details-src-table", "location-details-consumption-table", "location-details-split-table", "location-details-compare-pickers", "location-details-compare-table", "location-details-inventory-table"]) {
      byId[id].before?.();
    }
    expect(c.showTab.mock.calls.map((call) => call[0])).toEqual(["srcData", "consumption", "splitPrj", "compare", "compare", "inventory"]);

    byId["location-details-inventory-date-modal"].before?.();
    expect(c.openInventoryDate).toHaveBeenCalledTimes(1);

    for (const id of ["location-details-graph-tabs", "location-details-graph-actual", "location-details-graph-category", "location-details-graph-dio"]) {
      byId[id].before?.();
    }
    expect(c.showGraph.mock.calls.map((call) => call[0])).toEqual(["actualVsTarget", "actualVsTarget", "categoryBreakdown", "dioTrend"]);
  });

  it("returns Back-navigation to the SRC Data tab for steps that live above the tabs", () => {
    const c = detailsControls();
    const byId = Object.fromEntries(locationDetailsTourSteps(c).map((s) => [s.id, s]));
    byId["location-details-stats"].before?.();
    byId["location-details-finish"].before?.();
    expect(c.showTab.mock.calls.map((call) => call[0])).toEqual(["srcData", "srcData"]);
  });
});

describe("tour targets exist on a page", () => {
  const sources = import.meta.glob<string>("/src/**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true });
  const isStepsFile = (path: string) => path.includes("/components/onboarding/screenSteps/") || path.endsWith("/components/onboarding/tourSteps.ts");
  const isTest = (path: string) => /\.test\.tsx?$/.test(path);

  const markers = new Set<string>();
  for (const [path, text] of Object.entries(sources)) {
    if (isStepsFile(path) || isTest(path)) continue;
    for (const m of text.matchAll(/(?:data-tour|tourId)="([^"]+)"/g)) markers.add(m[1]);
    for (const m of text.matchAll(/dataTour[=:]\s*\{?"([^"]+)"/g)) markers.add(m[1]);
  }

  const stepFiles = Object.entries(sources).filter(([path]) => isStepsFile(path));

  it("finds the tour step files", () => {
    expect(stepFiles.length).toBeGreaterThanOrEqual(21);
  });

  it.each(stepFiles.map(([path, text]) => [path.split("/").at(-1), text] as const))(
    "%s only points at data-tour markers that exist",
    (_name, text) => {
      const targets = [...text.matchAll(/target:\s*'\[data-tour="([^"]+)"\]'/g)].map((m) => m[1]);
      const dead = targets.filter((t) => !markers.has(t));
      expect(dead).toEqual([]);
    }
  );
});

function categoryControls(over: Partial<Pick<CategoryAnalysisTourControls, "hasLocation" | "hasGroup" | "hasCategory">> = {}) {
  return {
    hasLocation: true,
    hasGroup: true,
    hasCategory: true,
    ...over,
    showLevel: vi.fn<(level: CategoryAnalysisTourLevel) => void>(),
    openPicker: vi.fn<() => void>(),
  } satisfies CategoryAnalysisTourControls;
}

describe("categoryAnalysisTourSteps", () => {
  it("visits every part of the screen: picker, filters, all three drill levels", () => {
    const ids = categoryAnalysisTourSteps(categoryControls()).map((s) => s.id);
    expect(ids).toEqual([
      "category-analysis-header",
      "category-analysis-location",
      "category-analysis-picker-modal",
      "category-analysis-refresh",
      "category-analysis-srctype",
      "category-analysis-date",
      "category-analysis-fetch",
      "category-analysis-pob",
      "category-analysis-chart-group",
      "category-analysis-search",
      "category-analysis-table-group",
      "category-analysis-back",
      "category-analysis-chart-category",
      "category-analysis-table-category",
      "category-analysis-chart-item",
      "category-analysis-table-item",
      "category-analysis-finish",
    ]);
  });

  it("with no location chosen, covers only the header and the picker", () => {
    const steps = categoryAnalysisTourSteps(categoryControls({ hasLocation: false }));
    expect(steps.map((s) => s.id)).toEqual([
      "category-analysis-header",
      "category-analysis-location",
      "category-analysis-picker-modal",
      "category-analysis-finish",
    ]);
    expect(steps.at(-1)!.target).toBeUndefined();
  });

  it("stops at the level that has data to open", () => {
    const noGroups = categoryAnalysisTourSteps(categoryControls({ hasGroup: false, hasCategory: false })).map((s) => s.id);
    expect(noGroups).not.toContain("category-analysis-table-category");
    expect(noGroups).not.toContain("category-analysis-table-item");
    const noCategory = categoryAnalysisTourSteps(categoryControls({ hasCategory: false })).map((s) => s.id);
    expect(noCategory).toContain("category-analysis-table-category");
    expect(noCategory).not.toContain("category-analysis-table-item");
  });

  it("gives every on-demand step a `before`, and ends on a targetless step", () => {
    for (const over of [{}, { hasLocation: false }, { hasGroup: false, hasCategory: false }, { hasCategory: false }]) {
      const steps = categoryAnalysisTourSteps(categoryControls(over));
      for (const step of steps.filter((s) => s.mountsOnDemand)) expect(step.before, step.id).toBeTypeOf("function");
      const last = steps.at(-1)!;
      expect(last.target).toBeUndefined();
      expect(last.mountsOnDemand).toBeFalsy();
    }
  });

  it("opens the picker and sets each drill level through the controls", () => {
    const c = categoryControls();
    const byId = Object.fromEntries(categoryAnalysisTourSteps(c).map((s) => [s.id, s]));

    byId["category-analysis-picker-modal"].before?.();
    expect(c.openPicker).toHaveBeenCalledTimes(1);

    for (const id of ["category-analysis-chart-group", "category-analysis-table-group", "category-analysis-back", "category-analysis-chart-category", "category-analysis-table-category", "category-analysis-chart-item", "category-analysis-table-item"]) {
      byId[id].before?.();
    }
    expect(c.showLevel.mock.calls.map((call) => call[0])).toEqual(["group", "group", "category", "category", "category", "item", "item"]);
  });

  it("returns Back-navigation to the group level for steps that live above the drill levels", () => {
    const c = categoryControls();
    const byId = Object.fromEntries(categoryAnalysisTourSteps(c).map((s) => [s.id, s]));
    byId["category-analysis-srctype"].before?.();
    byId["category-analysis-finish"].before?.();
    expect(c.showLevel.mock.calls.map((call) => call[0])).toEqual(["group", "group"]);
  });
});

function breakupControls(hasFilter = true) {
  return {
    hasFilter,
    showPage: vi.fn<() => void>(),
    openFilter: vi.fn<() => void>(),
  } satisfies ItemBreakupTourControls;
}

describe("itemBreakupTourSteps", () => {
  it("visits every part of the screen: Filters modal, clear, months, search and table", () => {
    const ids = itemBreakupTourSteps(breakupControls()).map((s) => s.id);
    expect(ids).toEqual([
      "item-breakup-header",
      "item-breakup-filters",
      "item-breakup-filter-modal",
      "item-breakup-clear",
      "item-breakup-months",
      "item-breakup-search",
      "item-breakup-table",
      "item-breakup-finish",
    ]);
  });

  it("with no filter applied, covers only the header and the Filters modal", () => {
    const steps = itemBreakupTourSteps(breakupControls(false));
    expect(steps.map((s) => s.id)).toEqual(["item-breakup-header", "item-breakup-filters", "item-breakup-filter-modal", "item-breakup-finish"]);
    expect(steps.at(-1)!.target).toBeUndefined();
  });

  it("gives every on-demand step a `before`, and ends on a targetless step", () => {
    for (const hasFilter of [true, false]) {
      const steps = itemBreakupTourSteps(breakupControls(hasFilter));
      for (const step of steps.filter((s) => s.mountsOnDemand)) expect(step.before, step.id).toBeTypeOf("function");
      const last = steps.at(-1)!;
      expect(last.target).toBeUndefined();
      expect(last.mountsOnDemand).toBeFalsy();
    }
  });

  it("opens the Filters modal for its step and closes it for every other step", () => {
    const c = breakupControls();
    const steps = itemBreakupTourSteps(c);
    for (const step of steps) step.before?.();
    expect(c.openFilter).toHaveBeenCalledTimes(1);
    expect(c.showPage).toHaveBeenCalledTimes(steps.filter((s) => s.before).length - 1);
  });
});

describe("reportTourSteps", () => {
  it("visits every control: reset, report, period, generate, result, history and clear", () => {
    expect(reportTourSteps.map((s) => s.id)).toEqual([
      "report-header",
      "report-reset",
      "report-form",
      "report-select",
      "report-period",
      "report-generate-button",
      "report-result",
      "report-history",
      "report-history-clear",
      "report-finish",
    ]);
  });

  it("ends on a targetless step, and the parts that only exist after a run are skipped when absent", () => {
    const last = reportTourSteps.at(-1)!;
    expect(last.target).toBeUndefined();
    expect(last.mountsOnDemand).toBeFalsy();
    for (const id of ["report-reset", "report-result", "report-history", "report-history-clear"]) {
      expect(reportTourSteps.find((s) => s.id === id)?.requireVisible, id).toBe(true);
    }
  });
});

describe("dataTrackerReportTourSteps", () => {
  it("visits every control: refresh, summary, legend, search, download and the grid", () => {
    expect(dataTrackerReportTourSteps.map((s) => s.id)).toEqual([
      "data-tracker-report-header",
      "data-tracker-report-refresh",
      "data-tracker-report-summary",
      "data-tracker-report-legend",
      "data-tracker-report-search",
      "data-tracker-report-download",
      "data-tracker-report-table",
      "data-tracker-report-finish",
    ]);
  });

  it("ends on a targetless step; steps with a responsive twin or a late element use requireVisible", () => {
    const last = dataTrackerReportTourSteps.at(-1)!;
    expect(last.target).toBeUndefined();
    expect(last.mountsOnDemand).toBeFalsy();
    for (const id of ["data-tracker-report-refresh", "data-tracker-report-search", "data-tracker-report-download"]) {
      expect(dataTrackerReportTourSteps.find((s) => s.id === id)?.requireVisible, id).toBe(true);
    }
  });
});

function dailyPrjControls(over: Partial<Pick<DailyPrjTourControls, "hasLocations" | "hasDownload">> = {}) {
  return {
    hasLocations: true,
    hasDownload: true,
    ...over,
    showSummary: vi.fn<() => void>(),
    showDetail: vi.fn<() => void>(),
    openDownloadConfirm: vi.fn<() => void>(),
  } satisfies DailyPrjTourControls;
}

describe("dailyPrjTourSteps", () => {
  it("visits every control: refresh, search, download and its dialog, hide, summary table, then the location detail", () => {
    expect(dailyPrjTourSteps(dailyPrjControls()).map((s) => s.id)).toEqual([
      "daily-prj-header",
      "daily-prj-refresh",
      "daily-prj-summary",
      "daily-prj-summary-search",
      "daily-prj-download",
      "daily-prj-download-modal",
      "daily-prj-summary-hide",
      "daily-prj-summary-table",
      "daily-prj-detail",
      "daily-prj-location-picker",
      "daily-prj-detail-search",
      "daily-prj-detail-hide",
      "daily-prj-month-summary",
      "daily-prj-detail-options",
      "daily-prj-detail-table",
      "daily-prj-target",
      "daily-prj-finish",
    ]);
  });

  it("leaves out the download steps when there is no file link, and the detail when there are no locations", () => {
    const noDownload = dailyPrjTourSteps(dailyPrjControls({ hasDownload: false })).map((s) => s.id);
    expect(noDownload).not.toContain("daily-prj-download");
    expect(noDownload).not.toContain("daily-prj-download-modal");

    const noLocations = dailyPrjTourSteps(dailyPrjControls({ hasLocations: false }));
    expect(noLocations.map((s) => s.id)).toEqual([
      "daily-prj-header",
      "daily-prj-refresh",
      "daily-prj-summary",
      "daily-prj-summary-search",
      "daily-prj-download",
      "daily-prj-download-modal",
      "daily-prj-summary-hide",
      "daily-prj-summary-table",
      "daily-prj-finish",
    ]);
    expect(noLocations.at(-1)!.target).toBeUndefined();
  });

  it("gives every on-demand step a `before`, and ends on a targetless step", () => {
    for (const over of [{}, { hasDownload: false }, { hasLocations: false }]) {
      const steps = dailyPrjTourSteps(dailyPrjControls(over));
      for (const step of steps.filter((s) => s.mountsOnDemand)) expect(step.before, step.id).toBeTypeOf("function");
      const last = steps.at(-1)!;
      expect(last.target).toBeUndefined();
      expect(last.mountsOnDemand).toBeFalsy();
    }
  });

  it("opens the confirm dialog for its step, the location detail for the detail steps, and the summary for the rest", () => {
    const c = dailyPrjControls();
    const byId = Object.fromEntries(dailyPrjTourSteps(c).map((s) => [s.id, s]));
    byId["daily-prj-download-modal"].before?.();
    expect(c.openDownloadConfirm).toHaveBeenCalledTimes(1);

    for (const id of ["daily-prj-detail", "daily-prj-location-picker", "daily-prj-detail-search", "daily-prj-detail-hide", "daily-prj-month-summary", "daily-prj-detail-options", "daily-prj-detail-table", "daily-prj-target"]) {
      byId[id].before?.();
    }
    expect(c.showDetail).toHaveBeenCalledTimes(8);

    byId["daily-prj-header"].before?.();
    byId["daily-prj-finish"].before?.();
    expect(c.showSummary).toHaveBeenCalledTimes(2);
  });
});

function targetControls(hasLocations = true) {
  return {
    hasLocations,
    showTable: vi.fn<() => void>(),
    openModal: vi.fn<() => void>(),
  } satisfies TargetPrjTourControls;
}

describe("targetPrjTourSteps", () => {
  it("visits every control: period, refresh, search, download, the list, Update Target and the dialog", () => {
    expect(targetPrjTourSteps(targetControls()).map((s) => s.id)).toEqual([
      "target-prj-header",
      "target-prj-period",
      "target-prj-refresh",
      "target-prj-search",
      "target-prj-download",
      "target-prj-unsaved",
      "target-prj-table",
      "target-prj-update",
      "target-prj-modal-table",
      "target-prj-modal-reset",
      "target-prj-modal-save",
      "target-prj-finish",
    ]);
  });

  it("with no locations, stops after the list and says why", () => {
    const steps = targetPrjTourSteps(targetControls(false));
    expect(steps.map((s) => s.id)).toEqual([
      "target-prj-header",
      "target-prj-period",
      "target-prj-refresh",
      "target-prj-search",
      "target-prj-download",
      "target-prj-unsaved",
      "target-prj-table",
      "target-prj-finish",
    ]);
    expect(steps.at(-1)!.target).toBeUndefined();
  });

  it("gives every on-demand step a `before`, and ends on a targetless step", () => {
    for (const hasLocations of [true, false]) {
      const steps = targetPrjTourSteps(targetControls(hasLocations));
      for (const step of steps.filter((s) => s.mountsOnDemand)) expect(step.before, step.id).toBeTypeOf("function");
      const last = steps.at(-1)!;
      expect(last.target).toBeUndefined();
      expect(last.mountsOnDemand).toBeFalsy();
    }
  });

  it("opens the dialog only for the three dialog steps and closes it for every other step", () => {
    const c = targetControls();
    const steps = targetPrjTourSteps(c);
    for (const step of steps) step.before?.();
    expect(c.openModal).toHaveBeenCalledTimes(3);
    expect(c.showTable).toHaveBeenCalledTimes(steps.filter((s) => s.before).length - 3);
  });

  it("uses the global period picker for the month step, and only skippable (requireVisible) parts that may not exist", () => {
    const byId = Object.fromEntries(targetPrjTourSteps(targetControls()).map((s) => [s.id, s]));
    expect(byId["target-prj-period"].target).toBe('[data-tour="period-picker"]');
    for (const id of ["target-prj-period", "target-prj-refresh", "target-prj-search", "target-prj-download", "target-prj-unsaved", "target-prj-update"]) {
      expect(byId[id].requireVisible, id).toBe(true);
    }
  });
});

describe("productivityTourSteps", () => {
  it("visits every control: period, refresh, search, unsaved marker, save and the table", () => {
    expect(productivityTourSteps.map((s) => s.id)).toEqual([
      "productivity-header",
      "productivity-period",
      "productivity-refresh",
      "productivity-search",
      "productivity-unsaved",
      "productivity-save",
      "productivity-table",
      "productivity-finish",
    ]);
  });

  it("uses the global period picker, ends on a targetless step, and only skippable parts use requireVisible", () => {
    const byId = Object.fromEntries(productivityTourSteps.map((s) => [s.id, s]));
    expect(byId["productivity-period"].target).toBe('[data-tour="period-picker"]');
    for (const id of ["productivity-period", "productivity-refresh", "productivity-search", "productivity-unsaved", "productivity-save"]) {
      expect(byId[id].requireVisible, id).toBe(true);
    }
    const last = productivityTourSteps.at(-1)!;
    expect(last.target).toBeUndefined();
    expect(last.mountsOnDemand).toBeFalsy();
    expect(productivityTourSteps.some((s) => s.mountsOnDemand)).toBe(false);
  });
});

function userControls(hasUsers = true) {
  return {
    hasUsers,
    showList: vi.fn<() => void>(),
    openAdd: vi.fn<() => void>(),
    openEdit: vi.fn<() => void>(),
    openReset: vi.fn<() => void>(),
  } satisfies UserMasterTourControls;
}

describe("userMasterTourSteps", () => {
  it("visits every control: refresh, add, search, table, row buttons and all three dialogs", () => {
    expect(userMasterTourSteps(userControls()).map((s) => s.id)).toEqual([
      "user-master-header",
      "user-master-refresh",
      "user-master-add",
      "user-master-search",
      "user-master-table",
      "user-master-modify",
      "user-master-reset",
      "user-master-add-form",
      "user-master-add-password",
      "user-master-add-submit",
      "user-master-edit-form",
      "user-master-edit-status",
      "user-master-edit-save",
      "user-master-reset-form",
      "user-master-reset-submit",
      "user-master-finish",
    ]);
  });

  it("with no users, keeps the Add User dialog but leaves out the row buttons and the Modify / Reset dialogs", () => {
    const steps = userMasterTourSteps(userControls(false));
    expect(steps.map((s) => s.id)).toEqual([
      "user-master-header",
      "user-master-refresh",
      "user-master-add",
      "user-master-search",
      "user-master-table",
      "user-master-add-form",
      "user-master-add-password",
      "user-master-add-submit",
      "user-master-finish",
    ]);
    expect(steps.at(-1)!.target).toBeUndefined();
  });

  it("gives every on-demand step a `before`, and ends on a targetless step", () => {
    for (const hasUsers of [true, false]) {
      const steps = userMasterTourSteps(userControls(hasUsers));
      for (const step of steps.filter((s) => s.mountsOnDemand)) expect(step.before, step.id).toBeTypeOf("function");
      const last = steps.at(-1)!;
      expect(last.target).toBeUndefined();
      expect(last.mountsOnDemand).toBeFalsy();
    }
  });

  it("opens each dialog only for its own steps and shows the plain list for every other step", () => {
    const c = userControls();
    const steps = userMasterTourSteps(c);
    for (const step of steps) step.before?.();
    expect(c.openAdd).toHaveBeenCalledTimes(3);
    expect(c.openEdit).toHaveBeenCalledTimes(3);
    expect(c.openReset).toHaveBeenCalledTimes(2);
    expect(c.showList).toHaveBeenCalledTimes(steps.filter((s) => s.before).length - 8);
  });
});

function rightsControls(hasUsers = true) {
  return {
    hasUsers,
    showPage: vi.fn<() => void>(),
    showTable: vi.fn<() => void>(),
    openConfirm: vi.fn<() => void>(),
  } satisfies LocationRightsTourControls;
}

describe("locationRightsTourSteps", () => {
  it("visits every control: reset, save, user picker, toolbar, checkboxes and the save confirmation", () => {
    expect(locationRightsTourSteps(rightsControls()).map((s) => s.id)).toEqual([
      "location-rights-header",
      "location-rights-reset",
      "location-rights-save",
      "location-rights-user",
      "location-rights-refresh",
      "location-rights-selected",
      "location-rights-search",
      "location-rights-select-all",
      "location-rights-table",
      "location-rights-confirm",
      "location-rights-finish",
    ]);
  });

  it("with no users, stops after the user picker and says why", () => {
    const steps = locationRightsTourSteps(rightsControls(false));
    expect(steps.map((s) => s.id)).toEqual([
      "location-rights-header",
      "location-rights-reset",
      "location-rights-save",
      "location-rights-user",
      "location-rights-finish",
    ]);
    expect(steps.at(-1)!.target).toBeUndefined();
  });

  it("gives every on-demand step a `before`, and ends on a targetless step", () => {
    for (const hasUsers of [true, false]) {
      const steps = locationRightsTourSteps(rightsControls(hasUsers));
      for (const step of steps.filter((s) => s.mountsOnDemand)) expect(step.before, step.id).toBeTypeOf("function");
      const last = steps.at(-1)!;
      expect(last.target).toBeUndefined();
      expect(last.mountsOnDemand).toBeFalsy();
    }
  });

  it("shows the table for the user's locations, opens the confirmation only for its own step, and never reaches for a save", () => {
    const c = rightsControls();
    const steps = locationRightsTourSteps(c);
    for (const step of steps) step.before?.();
    expect(c.openConfirm).toHaveBeenCalledTimes(1);
    expect(c.showTable).toHaveBeenCalledTimes(5);
    expect(c.showPage).toHaveBeenCalledTimes(steps.filter((s) => s.before).length - 6);
  });
});

function logControls(startPeriod: UserLogTourPeriod = "year") {
  return { startPeriod, showPeriod: vi.fn<(period: UserLogTourPeriod) => void>() } satisfies UserLogTourControls;
}

describe("userLogTourSteps", () => {
  it("visits every control: reset, refresh, export, the four period pickers, search and the table", () => {
    expect(userLogTourSteps(logControls()).map((s) => s.id)).toEqual([
      "user-log-header",
      "user-log-reset",
      "user-log-refresh",
      "user-log-export",
      "user-log-periods",
      "user-log-picker-day",
      "user-log-picker-week",
      "user-log-picker-month",
      "user-log-picker-year",
      "user-log-search",
      "user-log-table",
      "user-log-finish",
    ]);
  });

  it("switches to each tab for its own picker step and returns to the starting tab for every other step", () => {
    const c = logControls("month");
    const steps = userLogTourSteps(c);
    for (const step of steps) step.before?.();
    const calls = c.showPeriod.mock.calls.map((call) => call[0]);
    expect(steps.filter((s) => s.id.startsWith("user-log-picker-"))).toHaveLength(4);
    expect(calls).toEqual(["month", "month", "month", "month", "month", "day", "week", "month", "year", "month", "month", "month"]);
  });

  it("ends on a targetless step and has no dialogs to open", () => {
    const steps = userLogTourSteps(logControls());
    const last = steps.at(-1)!;
    expect(last.target).toBeUndefined();
    expect(last.mountsOnDemand).toBeFalsy();
    expect(steps.some((s) => s.mountsOnDemand)).toBe(false);
  });

  it("uses requireVisible for the controls that have a small-screen twin or may be hidden", () => {
    const byId = Object.fromEntries(userLogTourSteps(logControls()).map((s) => [s.id, s]));
    for (const id of ["user-log-reset", "user-log-refresh", "user-log-export", "user-log-search"]) {
      expect(byId[id].requireVisible, id).toBe(true);
    }
  });
});

function itemControls(over: Partial<Pick<ItemAnalysisTourControls, "hasLocation" | "hasDrill">> = {}) {
  return {
    hasLocation: true,
    hasDrill: true,
    ...over,
    showPage: vi.fn<() => void>(),
    openPicker: vi.fn<() => void>(),
    showDrill: vi.fn<() => void>(),
  } satisfies ItemAnalysisTourControls;
}

describe("itemAnalysisTourSteps", () => {
  it("visits every control: picker, refresh, the three filters, Fetch / Clear, the chart and its drilled view, search and the table", () => {
    expect(itemAnalysisTourSteps(itemControls()).map((s) => s.id)).toEqual([
      "item-analysis-header",
      "item-analysis-location",
      "item-analysis-picker-modal",
      "item-analysis-refresh",
      "item-analysis-srctype",
      "item-analysis-category",
      "item-analysis-date",
      "item-analysis-fetch",
      "item-analysis-chart",
      "item-analysis-drill",
      "item-analysis-back",
      "item-analysis-search",
      "item-analysis-table",
      "item-analysis-finish",
    ]);
  });

  it("with no location, covers only the header and the picker; with nothing to drill into, leaves the drilled steps out", () => {
    const noLocation = itemAnalysisTourSteps(itemControls({ hasLocation: false }));
    expect(noLocation.map((s) => s.id)).toEqual(["item-analysis-header", "item-analysis-location", "item-analysis-picker-modal", "item-analysis-finish"]);
    expect(noLocation.at(-1)!.target).toBeUndefined();

    const noDrill = itemAnalysisTourSteps(itemControls({ hasDrill: false })).map((s) => s.id);
    expect(noDrill).not.toContain("item-analysis-drill");
    expect(noDrill).not.toContain("item-analysis-back");
    expect(noDrill).toContain("item-analysis-chart");
  });

  it("gives every on-demand step a `before`, and ends on a targetless step", () => {
    for (const over of [{}, { hasLocation: false }, { hasDrill: false }]) {
      const steps = itemAnalysisTourSteps(itemControls(over));
      for (const step of steps.filter((s) => s.mountsOnDemand)) expect(step.before, step.id).toBeTypeOf("function");
      const last = steps.at(-1)!;
      expect(last.target).toBeUndefined();
      expect(last.mountsOnDemand).toBeFalsy();
    }
  });

  it("opens the picker and the drilled chart only for their own steps, and shows the plain page for every other step", () => {
    const c = itemControls();
    const steps = itemAnalysisTourSteps(c);
    for (const step of steps) step.before?.();
    expect(c.openPicker).toHaveBeenCalledTimes(1);
    expect(c.showDrill).toHaveBeenCalledTimes(2);
    expect(c.showPage).toHaveBeenCalledTimes(steps.filter((s) => s.before).length - 3);
  });
});

function consumptionControls(over: Partial<Pick<ConsumptionAnalysisTourControls, "hasSummary" | "hasSrcType" | "hasPerManday" | "hasDrill">> = {}) {
  return {
    hasSummary: true,
    hasSrcType: true,
    hasPerManday: true,
    hasDrill: true,
    ...over,
    showPage: vi.fn<() => void>(),
    showDetail: vi.fn<() => void>(),
    openFilter: vi.fn<() => void>(),
    openDownloadConfirm: vi.fn<() => void>(),
    showChart: vi.fn<(tab: ConsumptionAnalysisTourTab, drilled: boolean) => void>(),
  } satisfies ConsumptionAnalysisTourControls;
}

describe("consumptionAnalysisTourSteps", () => {
  it("visits every control: refresh, search, download and its dialog, the table, the filter and its dialog, the chart tabs and drill, the item table", () => {
    expect(consumptionAnalysisTourSteps(consumptionControls()).map((s) => s.id)).toEqual([
      "consumption-analysis-header",
      "consumption-analysis-refresh",
      "consumption-analysis-summary",
      "consumption-analysis-summary-search",
      "consumption-analysis-download",
      "consumption-analysis-download-modal",
      "consumption-analysis-summary-table",
      "consumption-analysis-filter",
      "consumption-analysis-filter-modal",
      "consumption-analysis-filter-apply",
      "consumption-analysis-clear",
      "consumption-analysis-detail",
      "consumption-analysis-chart",
      "consumption-analysis-chart-metric",
      "consumption-analysis-chart-tabs",
      "consumption-analysis-chart-srctype",
      "consumption-analysis-chart-perManday",
      "consumption-analysis-chart-drill",
      "consumption-analysis-chart-back",
      "consumption-analysis-detail-table",
      "consumption-analysis-finish",
    ]);
  });

  it("with an empty summary stops after Clear and says why; without source-type data or a category it leaves those steps out", () => {
    const empty = consumptionAnalysisTourSteps(consumptionControls({ hasSummary: false }));
    expect(empty.at(-1)!.id).toBe("consumption-analysis-finish");
    expect(empty.map((s) => s.id)).not.toContain("consumption-analysis-detail");
    expect(empty.at(-1)!.target).toBeUndefined();

    const plain = consumptionAnalysisTourSteps(consumptionControls({ hasSrcType: false, hasPerManday: false, hasDrill: false })).map((s) => s.id);
    for (const id of ["consumption-analysis-chart-tabs", "consumption-analysis-chart-srctype", "consumption-analysis-chart-perManday", "consumption-analysis-chart-drill", "consumption-analysis-chart-back"]) {
      expect(plain).not.toContain(id);
    }
    expect(plain).toContain("consumption-analysis-chart");
    expect(plain).toContain("consumption-analysis-detail-table");

    const onlySrc = consumptionAnalysisTourSteps(consumptionControls({ hasPerManday: false })).map((s) => s.id);
    expect(onlySrc).toContain("consumption-analysis-chart-srctype");
    expect(onlySrc).not.toContain("consumption-analysis-chart-perManday");
  });

  it("gives every on-demand step a `before`, and ends on a targetless step", () => {
    for (const over of [{}, { hasSummary: false }, { hasSrcType: false, hasPerManday: false, hasDrill: false }]) {
      const steps = consumptionAnalysisTourSteps(consumptionControls(over));
      for (const step of steps.filter((s) => s.mountsOnDemand)) expect(step.before, step.id).toBeTypeOf("function");
      const last = steps.at(-1)!;
      expect(last.target).toBeUndefined();
      expect(last.mountsOnDemand).toBeFalsy();
    }
  });

  it("opens each dialog only for its own steps and sets the chart tab / drill through showChart", () => {
    const c = consumptionControls();
    const steps = consumptionAnalysisTourSteps(c);
    for (const step of steps) step.before?.();
    expect(c.openDownloadConfirm).toHaveBeenCalledTimes(1);
    expect(c.openFilter).toHaveBeenCalledTimes(2);
    expect(c.showChart.mock.calls).toEqual([
      ["category", false],
      ["srcType", false],
      ["srcTypePerManday", false],
      ["category", true],
      ["category", true],
    ]);
  });
});

function sohControls(hasSummary = true) {
  return {
    hasSummary,
    showPage: vi.fn<() => void>(),
    showDetail: vi.fn<() => void>(),
    openDownloadConfirm: vi.fn<() => void>(),
  };
}

describe("stockOnHandTourSteps", () => {
  it("visits every control: refresh, search, download and its dialog, tables, picker, chart, item filters", () => {
    expect(stockOnHandTourSteps(sohControls()).map((s) => s.id)).toEqual([
      "stock-on-hand-header",
      "stock-on-hand-refresh",
      "stock-on-hand-summary",
      "stock-on-hand-summary-search",
      "stock-on-hand-download-all",
      "stock-on-hand-download-modal",
      "stock-on-hand-summary-table",
      "stock-on-hand-picker",
      "stock-on-hand-download-location",
      "stock-on-hand-detail",
      "stock-on-hand-chart",
      "stock-on-hand-category",
      "stock-on-hand-item-search",
      "stock-on-hand-detail-table",
      "stock-on-hand-finish",
    ]);
  });

  it("with an empty summary stops after Download Location on a targetless step", () => {
    const steps = stockOnHandTourSteps(sohControls(false));
    expect(steps.at(-1)!.id).toBe("stock-on-hand-finish");
    expect(steps.map((s) => s.id)).not.toContain("stock-on-hand-detail");
    expect(steps.at(-1)!.target).toBeUndefined();
  });

  it("gives every on-demand step a `before`, ends targetless, and opens the dialog only for its own step", () => {
    for (const has of [true, false]) {
      const c = sohControls(has);
      const steps = stockOnHandTourSteps(c);
      for (const step of steps.filter((s) => s.mountsOnDemand)) expect(step.before, step.id).toBeTypeOf("function");
      expect(steps.at(-1)!.target).toBeUndefined();
      for (const step of steps) step.before?.();
      expect(c.openDownloadConfirm).toHaveBeenCalledTimes(1);
    }
  });
});

describe("the app-wide tour's building blocks", () => {
  it("a menu item gets one step pointing at it, with a position counter and an 'open this screen' button", () => {
    const step = navIntroStep({ label: "Stock on Hand", path: "/stock-on-hand" }, 6, 21);
    expect(step.target).toBe('[data-tour-nav="/stock-on-hand"]');
    expect(step.title).toBe("Stock on Hand (7 of 21)");
    expect(step.description).toMatch(/stock/i);
    expect(step.nextLabel).toBe("Open this screen");
    expect(step.onEnter).toBeTypeOf("function");
    expect(step.onExit).toBeTypeOf("function");
  });

  it("a screen without a written blurb still gets a line", () => {
    expect(navIntroStep({ label: "Brand New Screen", path: "/brand-new" }, 0, 1).description).toContain("Opens Brand New Screen.");
  });

  it("the closing part covers the header controls and ends on a targetless step", () => {
    const steps = headerTourSteps();
    expect(steps.map((s) => s.id)).toEqual(["search", "period-picker", "appearance", "help", "finish"]);
    expect(steps.at(-1)!.target).toBeUndefined();
  });
});
