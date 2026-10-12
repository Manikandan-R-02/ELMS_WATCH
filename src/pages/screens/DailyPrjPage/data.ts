/**
 * Types for the Daily PRJ screen. All real data comes from
 * `consolidated-python-report-service` via `api.ts` — nothing here is generated or hardcoded.
 * Field names were confirmed against `ELmsWatch/src/views/admin/DailyPrj/index.jsx`.
 *
 * This is a genuinely different feature from `LocationSummaryPage`'s own "Daily PRJ" tab —
 * that one plots POB/Actual guest counts per day-as-*column* for every location at once; this
 * screen is the food-cost PRJ (cost-per-manday) ratio, day-as-*row*, scoped to one location at a
 * time via a picker. No endpoint, field, or table shape is shared between the two.
 */

/** One flattened summary-table column — the old app groups these two levels deep (e.g. group
 * "PRJ" containing keys `prj`/`target`/`var_vs_tgt`/…); flattened here into one column per
 * (group, key) pair since the shared `Table` component has single-row headers. */
export interface SummaryColumnDef {
  key: string;
  group: string;
  label: string;
}

/** One location's row in the all-locations summary table — `values` holds whatever dynamic
 * metric keys the backend's `summary_sheet.columns` describes for this reporting period. */
export interface SummaryRow {
  id: string;
  name: string;
  values: Record<string, number | string>;
}

/** One PRJ-type's cost breakdown for a single day (e.g. "SS", "Omani", "Suhur") — shown as an
 * optional set of extra columns on the day-detail table when "Show PRJ breakdown" is on. */
export interface PrjBreakdownEntry {
  food: number;
  cleaning: number;
  disposable: number;
  mandays: number;
  total: number;
  prj: number;
}

/** One day's row in the selected location's detail table. */
export interface DetailDayRow {
  sno: number;
  date: string;
  food: number;
  cleaning: number;
  disposable: number;
  consumption: number;
  mandays: number;
  dailyPrj: number;
  varPrj: number;
  staff: number;
  varStaff: number;
  productivity: number;
  cumConsumption: number;
  cumMandays: number;
  cumPrj: number;
  others: number;
  extraProgram: number;
  prjBreakdown: Record<string, PrjBreakdownEntry>;
}

/** One row of the small "PRJ Target Summary" table below the day-detail table. */
export interface TargetRow {
  prj: string;
  targetValue: number;
  mandays: number;
  total: number;
  impactManday: number;
}

/** The month-level rollup figures shown above the day-detail table (old app's sticky Current
 * Month / Previous Month / Total / Avg / Target header rows — rendered here as a small separate
 * summary table instead of pinned table rows, since the shared `Table` component has no notion
 * of a non-data pinned row). */
export interface MonthSummaryRow {
  label: string;
  food?: number;
  cleaning?: number;
  disposable?: number;
  consumption?: number;
  mandays?: number;
  dailyPrj?: number;
  staff?: number;
  productivity?: number;
  others?: number;
}

export interface LocationOption {
  id: string;
  name: string;
}
