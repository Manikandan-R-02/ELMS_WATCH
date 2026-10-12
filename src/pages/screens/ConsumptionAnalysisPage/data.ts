/**
 * Types (no mock data) for the Consumption Analysis screen — the rebuild of the old ElmsWatch
 * app's `views/admin/LocationConsumptions/index.jsx` ("Consumption Analysis" in the sidebar).
 * All real data comes from `api.ts`, which talks to the real `item-ingredient-analysis-service`
 * / `location-details-service` / `location-summary-service` endpoints read directly out of that
 * old file's `fetchCategories`/`fetchSrcTypes`/`fetchLocationData`/`fetchAllSummary`/
 * `fetchConsumptionData` — NOT `LocationConsumptions/apiResponse.txt`, which is a stale/mismatched
 * sample (its shape matches the Daily PRJ report, not this screen).
 */

export type { LocationType } from "../../../lib/locationTypes";
export { LOCATION_TYPE_LABELS, LOCATION_TYPE_API_INDEX } from "../../../lib/locationTypes";

export interface LocationOption {
  id: string;
  name: string;
}

/** One row of the "Location wise Consumption Summary" table — one aggregated row per location. */
export interface SummaryRow {
  locationId: string;
  locationName: string;
  totalItems: number;
  totalQty: number;
  conQty: number;
  totalAmount: number;
}

/** One item-level row of the detail table / donut-chart source data (`responseContents`). */
export interface DetailRow {
  itemId: string;
  itemName: string;
  categoryName: string;
  srcType: string;
  unit: string;
  pkgCon: number;
  totalQty: number;
  conQty: number;
  totalAmount: number;
  unitPrice: number;
}

/** One item-level row carrying the dynamic per-source-type breakdown map (`responseContents2`
 * for qty/converted-qty, `responseContents3` for the per-manday variants) — keys look like
 * `"<srcType>_TotalQty"`, `"<srcType>_ConvertedQty"`, `"<srcType>_TotalQtyPerManday"`,
 * `"<srcType>_ConvertedQtyPerManday"`; see `api.ts`'s `sumDynamicSrcMap`/`buildItemSeriesFromRC`. */
export interface DynamicSrcRow {
  itemId: string;
  itemName: string;
  dynamicSrcTypeMap: Record<string, number>;
}

/** Moved to `components/charts/LegendTable.tsx` — shared by every `DistributionChartCard` pairing
 * (Consumption Analysis, WasteCost Analysis), not owned by this screen. Re-exported here so this
 * folder's own `api.ts`/`DistributionSection.tsx` imports don't need to change. */
export type { DistributionPoint } from "../../../components/charts/LegendTable";

export type CategoryMetric = "amount" | "qty" | "conQty" | "pkgConQty";
export const CATEGORY_METRIC_OPTIONS: { label: string; value: CategoryMetric }[] = [
  { label: "Amount", value: "amount" },
  { label: "Qty", value: "qty" },
  { label: "Converted Qty", value: "conQty" },
  { label: "Pkg Converted Qty", value: "pkgConQty" },
];

export type RcMetric = "qty" | "conQty";
export const RC_METRIC_OPTIONS: { label: string; value: RcMetric }[] = [
  { label: "Qty", value: "qty" },
  { label: "Converted Qty", value: "conQty" },
];

export type RcMandayMetric = "qtyPerManday" | "conQtyPerManday";
export const RC_MANDAY_METRIC_OPTIONS: { label: string; value: RcMandayMetric }[] = [
  { label: "Qty / Manday", value: "qtyPerManday" },
  { label: "Converted Qty / Manday", value: "conQtyPerManday" },
];

export type ChartTab = "category" | "srcType" | "srcTypePerManday";

export const CHART_TAB_LABELS: Record<ChartTab, string> = {
  category: "Category",
  srcType: "Source Type",
  srcTypePerManday: "Source Type / Manday",
};
