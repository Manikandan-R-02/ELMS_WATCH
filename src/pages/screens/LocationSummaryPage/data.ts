/**
 * Types and small presentational constants for the Location Summary screen. All real data
 * comes from `overallSummary-service` via `api.ts` — nothing here is generated or
 * hardcoded; see the API audit in chat and `api.ts`'s own doc comment for the endpoint
 * mapping this module's types line up with.
 */

export type LocationType = "segments" | "contracts" | "om";

/** Option label for the "Location type" dropdown — mirrors the old ElmsWatch app's
 * LmsSummary location modal (`<option>All Locations / Segment Based / Contract Based / OM
 * Based</option>`) instead of the shorter "Segments / Contracts / O&M" wording. */
export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  segments: "Segment Based",
  contracts: "Contract Based",
  om: "OM Based",
};

/** The second dropdown's label changes with the selected type in the old app — "Segment" for
 * segments, "Contract" for contracts, "Manager" for O&M — rather than a single generic
 * "Category" label that doesn't reflect what O&M locations are actually grouped by. */
export const LOCATION_TYPE_CATEGORY_LABELS: Record<LocationType, string> = {
  segments: "Segment",
  contracts: "Contract",
  om: "Manager",
};

/** A Summary-table row, after `api.ts`'s `mapSummaryRow` translates the backend's field names
 * (`locationId`, `currentPob`, `totalWasteCost`, …) into these. */
export interface LocationRecord {
  id: string;
  name: string;
  staff: number;
  currentPOB: number;
  lastUpdated: string;
  targetPRJ: number;
  actual: number;
  totalMandays: number;
  totalCost: number;
  wasteCost: number;
  inventoryValue: number;
  dio: number;
  tenDay: number;
  twentyDay: number;
  thirtyDay: number;
}

/** A single location's figures for one compared month (Month Comparison / Compare Custom
 * Months / Location Graphs), after `api.ts`'s `monthFieldValue` pulls them off the raw row. */
export interface MonthlyFigure {
  totalMandays: number;
  totalCost: number;
  costPerManday: number;
  wasteCost: number;
  wasteCostPerManday: number;
}

/** A single location's figures for one day of the month (Daily PRJ), after `api.ts`'s
 * `dailyFieldValue` pulls them off the raw row. */
export interface DailyFigure {
  pob: number;
  actual: number;
}

/** One row of the Inventory Value drill-down modal — matches `inventoryDataByLocation`'s
 * response fields directly, one to one. */
export interface InventoryItem {
  category: string;
  itemId: string;
  itemName: string;
  packageId: string;
  closingQty: number;
  closingValue: number;
}

/** month key format: "YYYY-MM" */
export function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}
