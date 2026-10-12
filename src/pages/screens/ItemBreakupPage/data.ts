/**
 * Types for the Item Breakup screen — the rebuild of the old ElmsWatch app's
 * `views/admin/ingredientanalysis/index.jsx` (sidebar label "Item Breakup"; the old file's own
 * on-page copy says "Ingredient Analysis" / "Ingredient Details" — same screen, inconsistent
 * labeling in the old app). That file carried a fair amount of dead code copy-pasted from a
 * sibling screen (chart.js setup, a `MetricCard`, an unused pagination state, a `getPreviousData`
 * helper never called, an `error` state that was set but never rendered) — none of that is
 * replicated here; only the screen's actual behavior is.
 */
import { format } from "date-fns";

import type { LocationType } from "../../../lib/locationTypes";
export type { LocationType } from "../../../lib/locationTypes";
export { LOCATION_TYPE_LABELS, LOCATION_TYPE_API_INDEX } from "../../../lib/locationTypes";

export interface LocationOption {
  id: string;
  name: string;
}

export interface ItemBreakupFilter {
  locationType: LocationType;
  locationCategory: string | null;
  locationId: string | null;
  /** Required — unlike Consumption Analysis's "Item Category" filter, the old screen has no "All
   * Categories" option: both a location and a category must be chosen before it queries at all. */
  categoryId: string | null;
}

export const DEFAULT_ITEM_BREAKUP_FILTER: ItemBreakupFilter = {
  locationType: "all",
  locationCategory: null,
  locationId: null,
  categoryId: null,
};

export const COMPARISON_RANGE_OPTIONS = [3, 6, 9, 12] as const;
export type ComparisonRange = (typeof COMPARISON_RANGE_OPTIONS)[number];

/** One month's figures for an item — `offset` 0 is the reporting month, 1-11 are that many
 * months before it (matches the old screen's `currentQty`/`previousQty{n}` fields, normalized
 * into one lookup instead of 24 loosely-typed dynamic keys). */
export interface MonthFigures {
  qty: number;
  cost: number;
}

export interface ItemBreakupRow {
  categoryId: string;
  itemId: string;
  itemName: string;
  packageId: string;
  /** Package-to-consumption-unit conversion factor. */
  pkgCon: number;
  pkgConUom: string;
  /** Keyed by month offset (0 = reporting month, 1-11 = that many months before it). */
  figuresByOffset: Record<number, MonthFigures>;
}

/** "Con Qty" (converted quantity) — the old screen's only derived figure, computed client-side
 * per the old code (`qty * pkgCon`) rather than trusted from the API, despite the response
 * carrying `currentConQty`/`previousConQty{n}` header keys that are never actually read. */
export function convertedQty(row: ItemBreakupRow, offset: number): number {
  return (row.figuresByOffset[offset]?.qty ?? 0) * row.pkgCon;
}

/** A fixed, by-calendar-month color (not by position in the comparison range) — same intent as
 * the old screen's 12-entry palette indexed by `Date#getMonth()`, so a given calendar month (say,
 * every October) always reads the same color regardless of which "3/6/9/12 months" range is
 * selected. Decorative only — categorical chart-style colors are exempt from the brand-accent
 * rule (AGENTS.md rule 2), same as `ChartCards.tsx`'s `CATEGORICAL` palette. */
const MONTH_COLORS = [
  "#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300",
  "#4a3aa7", "#e34948", "#0891b2", "#c026d3", "#65a30d", "#b45309",
];

export interface MonthColumn {
  label: string;
  year: number;
  month: number;
  color: string;
  /** 0 = the reporting month, 1-11 = that many months before it. */
  offset: number;
}

/** Walks backward from `reportingMonth`, one entry per month, for however many months
 * `comparisonRange` asks for — mirrors the old screen's `getDynamicMonths()`. */
export function getDynamicMonths(reportingMonth: Date, comparisonRange: number): MonthColumn[] {
  const months: MonthColumn[] = [];
  const baseMonth = reportingMonth.getMonth();
  const baseYear = reportingMonth.getFullYear();
  for (let offset = 0; offset < comparisonRange; offset++) {
    const d = new Date(baseYear, baseMonth - offset, 1);
    months.push({
      label: format(d, "MMMM yyyy"),
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      color: MONTH_COLORS[d.getMonth()],
      offset,
    });
  }
  return months;
}
