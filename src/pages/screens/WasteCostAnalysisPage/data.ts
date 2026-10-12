/**
 * Types for the WasteCost Analysis screen — the rebuild of the old ElmsWatch app's
 * `views/admin/wastecost/index.jsx`. That screen computed `wastePercentage = totalWasteValue /
 * rawMaterialCost * 100` independently in six different places (the metric cards, three different
 * table row renders, and twice inside its "Day Based Data" modal) — centralized here as
 * `wastePercentage()` instead, so there's exactly one formula to get right.
 */

export interface WasteFigures {
  currentMandays: number;
  mealsCount: number;
  totalWasteWeight: number;
  totalWasteValue: number;
  transactionCount: number;
  rawMaterialCost: number;
  wasteMealsGms: number;
}

/** A row in the main "Waste Overview" table — either one calendar month of the selected year
 * (`month`/`year` set) or one location within a selected month (`locationId`/`locationName` set),
 * never both. */
export interface WasteOverviewRow extends WasteFigures {
  month?: number;
  year?: number;
  locationId?: string;
  locationName?: string;
}

export interface LossReasonRow {
  lossReason: string;
  sumOfWeight: number;
  sumOfCost?: number;
}

export interface TopWastedFoodRow {
  foodItem: string;
  sumOfWeight: number;
}

export interface LossReasonDetail extends WasteFigures {
  lossReason: string;
  sumOfCost: number;
  sumOfWeight: number;
}

export interface FoodItemDetail extends WasteFigures {
  foodCategory: string;
  foodItem: string;
  sumOfCost: number;
  sumOfWeight: number;
}

/** One calendar day inside the "Day Based Data" modal, with both breakdown types the old app
 * fetched in parallel — only whichever one `typeView` currently shows is rendered as sub-rows. */
export interface DayRow extends WasteFigures {
  date: string;
  lossReasonList: LossReasonDetail[];
  foodItemByweight: FoodItemDetail[];
}

export interface LocationOption {
  id: string;
  name: string;
}

export const ALL_LOCATIONS = "ALL";
export const ALL_MONTHS = 0;

export const MONTH_OPTIONS: { label: string; value: number }[] = [
  { label: "All Months", value: ALL_MONTHS },
  ...Array.from({ length: 12 }, (_, i) => ({
    label: new Date(2000, i, 1).toLocaleString("default", { month: "long" }),
    value: i + 1,
  })),
];

export function monthLabel(month: number): string {
  return MONTH_OPTIONS.find((m) => m.value === month)?.label ?? String(month);
}

/** A `WasteOverviewRow`'s display identity — its month (year rows) or "code — name" (location
 * rows), whichever the row actually carries. Shared by the overview table, the distribution
 * chart, and the chart's legend so all three always agree on how a row is labeled. */
export function identityLabelFor(row: WasteOverviewRow): string {
  if (row.month !== undefined) return monthLabel(row.month);
  return (row.locationId ?? "") + (row.locationName ? ` — ${row.locationName}` : "");
}

/** The one formula every waste-percentage figure on this screen uses — guards the same way the
 * old app's own inline copies did (a location/month with zero raw material cost reports 0%
 * instead of `NaN`/`Infinity`). */
export function wastePercentage(figures: Pick<WasteFigures, "totalWasteValue" | "rawMaterialCost">): number {
  if (!figures.rawMaterialCost) return 0;
  const pct = (figures.totalWasteValue / figures.rawMaterialCost) * 100;
  return Number.isFinite(pct) ? pct : 0;
}

export type DayBasedDataType = "Loss Reason" | "Food Item";
