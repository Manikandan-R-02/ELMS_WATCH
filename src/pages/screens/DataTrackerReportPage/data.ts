/**
 * Types (no mock data) for the Data Tracker Report screen — the rebuild of the old ElmsWatch
 * app's `views/admin/DataTrackerReport/DataTrackerReport.jsx` ("Data Tracker Report" in the
 * sidebar). A monthly "did this location report its data on this day" grid: one row per
 * (location, category) pair, one column per day of the reporting month, each cell a Yes/No.
 */

export const CATEGORY_LABELS = {
  consumption: "Consumption",
  mandays: "Manday",
  staffOnsite: "Staff Onsite",
} as const;

export type CategoryKey = keyof typeof CATEGORY_LABELS;

/** One (location, category) row, flattened from the old app's 3-rows-per-location grouping —
 * the old app merges Location ID/Name across the 3 rows with `rowSpan`, which the shared,
 * paginated `Table` component (used everywhere else in this app) can't express since it always
 * renders one row per data item. Repeating the location's ID/Name on every row instead (same
 * "flatten instead of fork the shared component" approach `SummaryTable`'s `combineHeader` uses
 * for a 2-level *header* down to one row) keeps this screen on the same shared, keyboard-
 * accessible, paginated table every other screen uses, rather than a one-off hand-rolled grid. */
export interface DetailRow {
  key: string;
  sno: number;
  locationId: string;
  locationName: string;
  category: string;
  values: string[];
}

export interface DataTrackerReportSummary {
  period: string;
  downloadUrl?: string;
  dayNumbers: number[];
  dayDates: string[];
  locationCount: number;
  rows: DetailRow[];
}
