/**
 * Types for the Item Analysis screen — the rebuild of the old ElmsWatch app's
 * `views/admin/itemanalysis/index.jsx` (2741 lines). That file carried a large amount of dead
 * code copy-pasted from a sibling dashboard screen — a `MetricCard` component defined but never
 * rendered (so despite appearances, the old screen has no stat cards), Chart.js imported and
 * registered but never actually used (the real chart is Highcharts), an `error` state set on every
 * fetch failure but never displayed anywhere, a `rowsPerPage`/`currentPage` pair that did nothing
 * (the table just scrolls, unpaginated), and half a dozen other state variables written to but
 * never read. None of that is replicated here — only the screen's real behavior is.
 */
import { addDays, addMonths, getDaysInMonth, setDate, subMonths } from "date-fns";

export type { LocationType } from "../../../lib/locationTypes";
export { LOCATION_TYPE_LABELS, LOCATION_TYPE_API_INDEX } from "../../../lib/locationTypes";

export interface LocationOption {
  id: string;
  name: string;
  /** Billing-cycle start day (1-31), when the backend has one configured for this location —
   * drives `computeBillingWindow` below. Absent for a location with no billing cycle set up. */
  startDay?: number;
}

export const ALL_CATEGORY = "ALL";

export interface ItemAnalysisFilter {
  srcType: string | null;
  /** `ALL_CATEGORY` or a real category name — never both unset, matching the old screen's
   * "Select Categories" + "ALL" + real-category three-way dropdown collapsed into one sentinel. */
  category: string;
  /** A specific day within the billing window/reporting month — optional, narrows the query to
   * one day instead of the whole period. */
  date: Date | null;
}

export const DEFAULT_ITEM_ANALYSIS_FILTER: ItemAnalysisFilter = {
  srcType: null,
  category: ALL_CATEGORY,
  date: null,
};

export interface ItemAnalysisRow {
  categoryId: string;
  itemId: string;
  itemName: string;
  packageId: string;
  qty: number;
  qtyCon: number;
  uomCon: string;
  amount: number;
}

export interface CategoryAmount {
  categoryId: string;
  amount: number;
}

/**
 * The old screen's billing-window math (`computeDateRangeForMonth`): a location's `startDay`
 * (1-31) anchors a rolling billing cycle rather than the calendar month —
 * - day 1-15 anchors a cycle starting *within* the reference month,
 * - day 16-31 anchors a cycle starting in the *prior* month (so day 31 of "October" actually
 *   starts the cycle on Sept 31st-clamped-to-30th, running through late October),
 * clamped to whatever day actually exists in its target month (e.g. day 31 in a 30-day month
 * becomes day 30), running exactly one calendar month from that start.
 */
export function computeBillingWindow(startDay: number, referenceMonth: Date): { from: Date; to: Date } {
  const baseMonth = startDay <= 15 ? referenceMonth : subMonths(referenceMonth, 1);
  const clampedDay = Math.min(startDay, getDaysInMonth(baseMonth));
  const from = setDate(baseMonth, clampedDay);
  const to = addDays(addMonths(from, 1), -1);
  return { from, to };
}
