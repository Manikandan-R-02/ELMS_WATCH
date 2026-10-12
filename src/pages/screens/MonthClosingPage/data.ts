/**
 * Types for the Month Closing screen — the rebuild of the old ElmsWatch app's
 * `views/admin/monthClosing/index.jsx`. That screen is a single global action (no per-location
 * concept, no list of past closings) that advances the app's active working period by one month;
 * this rebuild keeps that exact scope. The old screen also carried three per-module "checkbox"
 * flags (consumption/wasteWatch/dailyInventory) whose actual checkbox UI was commented out —
 * dead code that always left all three `true` — so they're dropped here rather than replicated.
 */

export interface MonthCloseApiResponse {
  status?: string;
  new_lms_period?: string;
  eiis_period_update?: {
    status?: string;
  };
  message?: string;
  error?: string;
}

export interface MonthCloseResult {
  ok: boolean;
  /** `YYYY-MM-DD`, the backend's new active period — only present when `ok` is true. */
  newPeriod?: string;
  message?: string;
}
