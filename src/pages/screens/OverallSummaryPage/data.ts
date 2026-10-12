/**
 * Types and small presentational constants for the Overall Summary screen. All real data comes
 * from `overallSummary-service` via `api.ts` — nothing here is generated or hardcoded; see
 * the API audit in chat and `api.ts`'s own doc comment for the endpoint mapping this module's
 * types line up with.
 */

export type OverallView = "contract" | "segment" | "operationManager";

export const OVERALL_VIEW_LABELS: Record<OverallView, string> = {
  contract: "Contract",
  segment: "Segment",
  operationManager: "Operation Manager",
};

/** One row of the "Summary Overview" table — a contract/segment/operation-manager group's
 * rolled-up figures, after `api.ts`'s `mapGroupRow` translates whichever of `responseContents`
 * (contract) / `responseContents2` (segment) / `responseContents3` (operation manager) the
 * active view is reading from into this common shape. */
export interface GroupRecord {
  name: string;
  locationCount: number;
  totalPOB: number;
  totalMandays: number;
  totalCost: number;
  avgCostManday: number;
  totalWasteCost: number;
}

/** One row of the "Categories by Cost" table/pie — from `responseContent.categoryListData`
 * (an object keyed by category name), filtered to positive values and sorted descending
 * client-side, same as the old app. */
export interface CategoryRecord {
  category: string;
  value: number;
  percentage: number;
}

/** One row of the category drill-down table — `categoryWiseData`'s per-location cost split for
 * whichever category was clicked. */
export interface CategoryDetailRecord {
  locationId: string;
  totalCost: number;
  percentage: number;
}

/** One row of the "Top Locations by Waste Cost" chart/table — from
 * `responseContent.wasteCostList`, filtered to `wastageCost > 0`, sorted descending, top 10,
 * same as the old app. */
export interface WasteLocationRecord {
  locationId: string;
  locationName: string;
  wastageCost: number;
}
