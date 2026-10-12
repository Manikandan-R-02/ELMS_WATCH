/**
 * Types (no mock data) for the Stock On Hand screen — the rebuild of the old ElmsWatch app's
 * `views/admin/StockOnHand/index.jsx` ("Stock on Hand" in the sidebar, component name `SohAnalysis`).
 * All real data comes from `api.ts`, which talks to the real `location-details-service` /
 * `location-summary-service` / `consolidated-python-report-service` endpoints read directly out of
 * that old file's `fetchLocationData`/`fetchLocationIds`/`fetchAllLocationIds`/`fetchAllSohSummary`/
 * `fetchSohData`/`handleDownloadExcel`. `StockOnHand/apiResponse.txt` was cross-checked against the
 * real `sohAnalysisLst` POST call in that file (not just trusted blindly — see AGENTS.md/CLAUDE.md's
 * "hard-won lessons") and its field names line up, so it was used to confirm the response shape below.
 */

export type { LocationType } from "../../../lib/locationTypes";
export { LOCATION_TYPE_LABELS, LOCATION_TYPE_API_INDEX } from "../../../lib/locationTypes";

export interface LocationOption {
  id: string;
  name: string;
}

/** One aggregated row of the "Location wise SOH Summary" table — old app's `aggregateLocationRows`,
 * summing every item-level row returned for that location by `sohAnalysisLst`. */
export interface SummaryRow {
  locationId: string;
  locationName: string;
  totalItems: number;
  prevTotalQty: number;
  prevConQty: number;
  pastTotalQty: number;
  pastConQty: number;
  curTotalQty: number;
  curConQty: number;
  avgTotalQty: number;
  avgConQty: number;
  closingQty: number;
  closingConQty: number;
  stockAmount: number;
}

/** One item-level row of the detail table / category chart source data (`responseContents`). */
export interface DetailRow {
  itemId: string;
  itemName: string;
  categoryName: string;
  itemUom: string;
  pkgCon: number;
  pkgConUom: string;
  rate: number;
  curTotalQty: number;
  curConQty: number;
  pastTotalQty: number;
  pastConQty: number;
  prevTotalQty: number;
  prevConQty: number;
  avgTotalQty: number;
  avgConQty: number;
  closingQty: number;
  closingConQty: number;
  daysHoldingPeriod: number;
  daysHoldingConPeriod: number;
  stockAmount: number;
}

/** A category-breakdown chart/legend point — `DistributionChartCard`'s own `{ name, value }` shape. */
export interface DistributionPoint {
  name: string;
  value: number;
}

export type CategoryMetric = "stockAmount" | "curQty" | "closingQty";
export const CATEGORY_METRIC_OPTIONS: { label: string; value: CategoryMetric }[] = [
  { label: "Stock Amount", value: "stockAmount" },
  { label: "Current Qty", value: "curQty" },
  { label: "Closing Qty", value: "closingQty" },
];
