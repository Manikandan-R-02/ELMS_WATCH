/**
 * Types for the Category Analysis screen — the rebuild of the old ElmsWatch app's
 * `views/admin/categoryanalysis/index.jsx` (2041 lines). That screen is the same filter/location/
 * billing-cycle scaffolding as Item Analysis, re-skinned with a Group → Category → Item drill
 * hierarchy instead of Item Analysis's single Category → Item level. It carried its own dead
 * code — Chart.js imported and registered but never rendered (the real chart is Highcharts), a
 * chatbot widget imported but commented out of the render, and an unused 52KB `datePicker.jsx`
 * file in the same folder — none of that is replicated here.
 *
 * Two real simplifications from the old screen, both documented at their call sites: the item
 * level's two-concentric-ring donut (a 100%-of-category inner ring + an items outer ring) is
 * rendered as the same single-ring `DistributionChartCard` every other analysis screen in this
 * app uses, and the old screen's separate Table/Chart visibility checkboxes (item level) and a
 * free-form Top/Least-with-custom-limit modal are both dropped in favor of the one `ViewMode`
 * selector (All/Top 5/Top 10/Least 5/Least 10) applied uniformly at every level — the same
 * capability (seeing only the most/least significant rows), one control instead of three.
 */
export type { LocationType } from "../../../lib/locationTypes";
export { LOCATION_TYPE_LABELS, LOCATION_TYPE_API_INDEX } from "../../../lib/locationTypes";

export interface LocationOption {
  id: string;
  name: string;
  startDay?: number;
}

export type DrillLevel = "group" | "category" | "item";

export interface GroupRow {
  group: string;
  qty: number;
  amount: number;
}

export interface CategoryRow {
  categoryId: string;
  groupOfCategory: string;
  qty: number;
  qtyCon: number;
  amount: number;
}

export interface ItemRow {
  categoryId: string;
  itemId: string;
  itemName: string;
  packageId: string;
  qty: number;
  qtyCon: number;
  uomCon: string;
  amount: number;
}

export interface CategoryAnalysisFilter {
  srcType: string | null;
  date: Date | null;
}

export const DEFAULT_CATEGORY_ANALYSIS_FILTER: CategoryAnalysisFilter = {
  srcType: null,
  date: null,
};

export type ViewMode = "all" | "top5" | "top10" | "least5" | "least10";

export const VIEW_MODE_OPTIONS: { label: string; value: ViewMode }[] = [
  { label: "View All", value: "all" },
  { label: "Top 5", value: "top5" },
  { label: "Top 10", value: "top10" },
  { label: "Least 5", value: "least5" },
  { label: "Least 10", value: "least10" },
];

/**
 * Applies the old screen's View-mode limiting (group/category level's `viewMode` select, and the
 * item level's Top/Least-with-limit modal, unified into one control — see the file-level comment)
 * to any already-sorted-by-value, high-to-low array. The "least" cases take the tail of that same
 * descending array — already in high-to-low order within that slice, so no re-reversal is needed
 * (e.g. `[10,9,8,7,6,5,4,3,2,1,0].slice(-5)` is `[4,3,2,1,0]`, not ascending).
 */
export function applyViewMode<T>(rowsHighToLow: T[], mode: ViewMode): T[] {
  if (mode === "all") return rowsHighToLow;
  if (mode === "top5") return rowsHighToLow.slice(0, 5);
  if (mode === "top10") return rowsHighToLow.slice(0, 10);
  if (mode === "least5") return rowsHighToLow.slice(-5);
  return rowsHighToLow.slice(-10);
}

/**
 * Billing-cycle math — identical to Item Analysis's `computeBillingWindow` (same old-app formula,
 * copy-pasted across both screens originally); re-exported from there rather than duplicated.
 */
export { computeBillingWindow } from "../ItemAnalysisPage/data";

export function groupLabel(categoryId: string | undefined): string {
  return categoryId?.trim() || "Unknown";
}

/** Client-side aggregation of category rows into their parent groups — the old screen's "group"
 * drill level is not a separate API call, just categories bucketed by `groupOfCategory`. */
export function buildGroupRows(categories: CategoryRow[]): GroupRow[] {
  const totals = new Map<string, { qty: number; amount: number }>();
  for (const c of categories) {
    const key = groupLabel(c.groupOfCategory);
    const prev = totals.get(key) ?? { qty: 0, amount: 0 };
    totals.set(key, { qty: prev.qty + c.qty, amount: prev.amount + c.amount });
  }
  return Array.from(totals.entries()).map(([group, t]) => ({ group, ...t }));
}
