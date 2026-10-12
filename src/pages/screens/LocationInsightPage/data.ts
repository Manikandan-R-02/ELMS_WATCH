/**
 * Types for the Location Insight screen. All real data comes from `overallSummary-service`'s
 * locationInsightController via `api.ts` — nothing here is generated or hardcoded. Field names were confirmed against
 * `ELmsWatch/src/views/admin/LocationInsight/index.jsx`'s own `fetchAllData`/render code.
 */

/** One point of a date/value series (Mandays, Cumul Daily Cost, Daily Consumption) — old app's
 * `parseContents()` splits each `"DD-MM-YYYY: value"` string into this shape. */
export interface SeriesPoint {
  date: string;
  value: number;
  // Index signature so a `SeriesPoint[]` can be passed straight into `ChartCards`' `data` props
  // (typed `Record<string, string | number>[]`) without a cast.
  [key: string]: string | number;
}

/** One date's Split-by-PRJ breakdown — old app's `responseContent.splitPrjList` is a date-keyed
 * object (not an array); `api.ts`'s `mapSplitPrjSeries` flattens it into this shape, sorted by
 * date. */
export interface SplitPrjPoint {
  date: string;
  food: number;
  cleaning: number;
  disposal: number;
  others: number;
  [key: string]: string | number;
}

export interface InsightStats {
  totalMandays: number;
  totalCost: number;
  cumulativeDailyCost: number;
}
