/**
 * Types for the Location Details screen. All real data comes from `overallSummary-service`
 * (`locationDetailsController`, plus `locationSummaryController` for the inventory trend) via `api.ts` — nothing here is
 * generated or hardcoded. Field names were confirmed against
 * `ELmsWatch/src/views/admin/LmsDetails/index.jsx`'s own `fetchAllData`/render code.
 */

/** One row of the "SRC Data" tab — one SRC type's figures for one date. */
export interface SrcDataRecord {
  srcType: string;
  date: string;
  pob: number;
  totalCost: number;
  wasteCost: number;
  /** `wasteCost / pob` — old app's `pobWastePRJ` (index.jsx ~2477), computed client-side, not a
   * backend field. Can be 0 when `pob` is 0 (guarded here, unlike the old app). */
  pobWastePRJ: number;
  dailyCostPerPerson: number;
  targetPRJ: number;
  cumulativeManday: number;
  cumulativeCost: number;
  cumulativeDailyCost: number;
}

/** One row of the "Consumption" tab — one SRC type's figures for one date, plus a per-category
 * cost breakdown whose keys vary by location (`categoryListData`). */
export interface ConsumptionRecord {
  srcType: string;
  date: string;
  totalMandays: number;
  categoryListData: Record<string, number>;
  totalCost: number;
  avgCostManday: number;
}

/** One row of the "Split by PRJ" tab — one SRC type's figures for one date, cost split into 4
 * fixed buckets. */
export interface SplitPrjRecord {
  srcType: string;
  date: string;
  totalMandays: number;
  foodCost: number;
  cleaningCost: number;
  disposalCost: number;
  othersCost: number;
  total: number;
}

/** One row of the "Consumption Compare" tab — one category's cost/cost-per-manday for the base
 * month plus every picked comparison month, after `api.ts`'s `categoryFieldValue` pulls each
 * month's figures off the raw suffixed/dated keys. */
export interface ComparisonRecord {
  category: string;
  figures: Record<string, { cost: number; costPerManday: number }>;
}

/** One row of the "Inventory" tab / DIO graph — one date's closing inventory position, from
 * `overallSummary-service`'s `locationSummaryController/inventoryData` endpoint (distinct from the item-level
 * `inventoryDataByLocation` endpoint `LocationSummaryPage`'s own Inventory modal uses). */
export interface InventoryTrendRecord {
  date: string;
  closingQty: number;
  closingValue: number;
  dailyConsumptionValue: number;
  cumulativeConsumptionValue: number;
  dioDays: number;
}

/** A single comparison month, keyed the same way `LocationSummaryPage`'s own
 * `ComparisonMonth`/`monthKey` are — "YYYY-MM". */
export interface ComparisonMonth {
  key: string;
  label: string;
  year: number;
  month: number;
  isBase?: boolean;
}

export function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}
