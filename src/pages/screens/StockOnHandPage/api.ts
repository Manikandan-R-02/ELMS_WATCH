/**
 * All HTTP calls for the Stock On Hand screen — all six now go to the new backend's `analysis-service`
 * (`locationDetailsController`, `locationSummaryController` and `pythonReportController`; they were on the old
 * location-details, location-summary and consolidated-python-report services). Same URL shapes and request
 * fields as the old ElmsWatch screen (`views/admin/StockOnHand/index.jsx`), with the new
 * `{ success, message, data }` envelope on every JSON response:
 *
 * - `locationDetailsController/overallDropDown/{type}/{date}/{userType}/{userId}` and
 *   `locationDetailsController/dropDownByNameBased/{type}/{typeName}/...` — the location lists. They are the very
 *   same calls Consumption Analysis uses, so that screen's functions are reused rather than copied. (The swagger
 *   for the first one was given without its controller name; `locationDetailsController` is assumed from the
 *   identical parameters.)
 * - `locationSummaryController/sohAnalysisLst` (POST) — one location's item rows. The response is now
 *   `data: { summary, sohList }` (it was `responseContents` + `responseContent`): the items are `sohList` and the
 *   days-holding threshold is `summary.stockGrtDays`. The old app's own comment explains why the all-locations
 *   summary is still built by calling this once per location (in small concurrent batches) and summing the
 *   columns itself: the bulk call (no `locationId`) does not reliably tag each row with its location.
 * - `pythonReportController/getSohAnalysis` — the Excel export, `period` as `YYYY-MM-DD` (not `DD-MM-YYYY` like the
 *   other calls here), optional `locationId`. The swagger shows an empty response, so it goes through
 *   `requestFile` (src/api/fileDownload.ts), which saves a real file, shows a JSON error's own message, or opens a
 *   JSON file link — the old reply was JSON with a `download_url`, which still works.
 */
import axiosClient from "../../../api/axiosClient";
import { currentUserContext, formatDateForApi, unwrapEnvelope as unwrap, type ApiEnvelope } from "../../../api/apiHelpers";
import { requestFile } from "../../../api/fileDownload";
import { format } from "date-fns";
import type { CategoryMetric, DetailRow, DistributionPoint, LocationOption, SummaryRow } from "./data";

const SUMMARY_BASE = "/analysis-service/locationSummaryController";

// ─── overallDropDown / dropDownByNameBased — shared with Consumption Analysis ───────────────────

export { fetchAllLocationOptions, fetchLocationOptionsByCategory, fetchLocationTypeCategories } from "../ConsumptionAnalysisPage/api";

// ─── sohAnalysisLst ───────────────────────────────────────────────────────────────────────────────

interface SohApiRow {
  locationId?: string;
  categoryName?: string;
  itemId?: string;
  itemName?: string;
  rate?: number;
  itemUom?: string;
  pkgCon?: number;
  pkgConUom?: string;
  currentTotalQty?: number;
  currentConvertedQty?: number;
  pastTotalQty?: number;
  pastConvertedQty?: number;
  previousTotalQty?: number;
  previousConvertedQty?: number;
  avgTotalQty?: number;
  avgConvertedQty?: number;
  closingQty?: number;
  closingConvertedQty?: number;
  daysHoldingPeriod?: number;
  daysHoldingConvertedPeriod?: number;
  stockAmount?: number;
}

interface SohApiData {
  summary?: { stockGrtDays?: number | null } | null;
  sohList?: SohApiRow[];
}

export function mapDetailRow(row: SohApiRow): DetailRow {
  return {
    itemId: row.itemId ?? "",
    itemName: row.itemName ?? row.itemId ?? "Unknown",
    categoryName: row.categoryName ?? "Unknown",
    itemUom: row.itemUom ?? "",
    pkgCon: Number(row.pkgCon) || 0,
    pkgConUom: row.pkgConUom ?? "",
    rate: Number(row.rate) || 0,
    curTotalQty: Number(row.currentTotalQty) || 0,
    curConQty: Number(row.currentConvertedQty) || 0,
    pastTotalQty: Number(row.pastTotalQty) || 0,
    pastConQty: Number(row.pastConvertedQty) || 0,
    prevTotalQty: Number(row.previousTotalQty) || 0,
    prevConQty: Number(row.previousConvertedQty) || 0,
    avgTotalQty: Number(row.avgTotalQty) || 0,
    avgConQty: Number(row.avgConvertedQty) || 0,
    closingQty: Number(row.closingQty) || 0,
    closingConQty: Number(row.closingConvertedQty) || 0,
    daysHoldingPeriod: Number(row.daysHoldingPeriod) || 0,
    daysHoldingConPeriod: Number(row.daysHoldingConvertedPeriod) || 0,
    stockAmount: Number(row.stockAmount) || 0,
  };
}

export function aggregateLocationRows(loc: LocationOption, rows: SohApiRow[]): SummaryRow {
  const agg: SummaryRow = {
    locationId: loc.id,
    locationName: loc.name,
    totalItems: rows.length,
    prevTotalQty: 0,
    prevConQty: 0,
    pastTotalQty: 0,
    pastConQty: 0,
    curTotalQty: 0,
    curConQty: 0,
    avgTotalQty: 0,
    avgConQty: 0,
    closingQty: 0,
    closingConQty: 0,
    stockAmount: 0,
  };
  for (const row of rows) {
    agg.prevTotalQty += Number(row.previousTotalQty) || 0;
    agg.prevConQty += Number(row.previousConvertedQty) || 0;
    agg.pastTotalQty += Number(row.pastTotalQty) || 0;
    agg.pastConQty += Number(row.pastConvertedQty) || 0;
    agg.curTotalQty += Number(row.currentTotalQty) || 0;
    agg.curConQty += Number(row.currentConvertedQty) || 0;
    agg.avgTotalQty += Number(row.avgTotalQty) || 0;
    agg.avgConQty += Number(row.avgConvertedQty) || 0;
    agg.closingQty += Number(row.closingQty) || 0;
    agg.closingConQty += Number(row.closingConvertedQty) || 0;
    agg.stockAmount += Number(row.stockAmount) || 0;
  }
  return agg;
}

function sortByLocationId<T extends { locationId: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => String(a.locationId).localeCompare(String(b.locationId), undefined, { numeric: true, sensitivity: "base" }));
}

/** One `sohAnalysisLst` call: the response's data. `userId` is a number in the new request (it was whatever the
 * login gave before). */
async function postSoh(locationId: string, periodStr: string, userType: number, userId: string): Promise<SohApiData | undefined> {
  const { data: envelope } = await axiosClient.post<ApiEnvelope<SohApiData>>(
    `${SUMMARY_BASE}/sohAnalysisLst`,
    { locationId, periodStr, userType, userId: Number(userId) },
    { headers: { "Content-Type": "application/json" } }
  );
  return unwrap(envelope);
}

/** The all-locations "Location wise SOH Summary" table — one aggregated row per location, built by
 * calling `sohAnalysisLst` once per location (in small concurrent batches, same as the old app's
 * `fetchAllSohSummary`) rather than trusting a bulk endpoint's unreliable per-row `locationId`. A location whose
 * call fails shows zeros (as before) — but if every call fails the first error is thrown, so the page shows why
 * instead of a table of zeros. */
export async function fetchStockOnHandSummary(date: Date, locations: LocationOption[]): Promise<SummaryRow[]> {
  const { userId, userType } = currentUserContext();
  const periodStr = formatDateForApi(date);
  const BATCH_SIZE = 6;
  const ordered = sortByLocationId(locations.map((l) => ({ ...l, locationId: l.id })));
  const collected: SummaryRow[] = [];
  let failures = 0;
  let firstError: unknown;

  for (let i = 0; i < ordered.length; i += BATCH_SIZE) {
    const batch = ordered.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (loc) => {
        try {
          const data = await postSoh(loc.id, periodStr, userType, userId);
          return aggregateLocationRows(loc, data?.sohList ?? []);
        } catch (err) {
          failures += 1;
          firstError ??= err;
          return aggregateLocationRows(loc, []);
        }
      })
    );
    collected.push(...batchResults);
  }

  if (ordered.length > 0 && failures === ordered.length) throw firstError;
  return sortByLocationId(collected);
}

export interface SohDetailResult {
  rows: DetailRow[];
  stockGrtDaysThreshold: number | null;
}

/** One location's item-level Stock On Hand rows — drives the detail table and the category chart. */
export async function fetchStockOnHandDetail(locationId: string, date: Date): Promise<SohDetailResult> {
  const { userId, userType } = currentUserContext();
  const data = await postSoh(locationId, formatDateForApi(date), userType, userId);
  const threshold = data?.summary?.stockGrtDays;
  return {
    rows: (data?.sohList ?? []).map(mapDetailRow),
    stockGrtDaysThreshold: threshold ?? null,
  };
}

// ─── getSohAnalysis — Excel export ──────────────────────────────────────────────────────────────

/** `stock_on_hand_{period}[_{location}].xlsx`, alphanumeric-only so it is valid on every OS. */
export function stockOnHandReportFilename(date: Date, locationId?: string): string {
  const safe = (text: string) => text.replaceAll(/\W/g, "_");
  const locationPart = locationId ? `_${safe(locationId)}` : "";
  return `stock_on_hand_${safe(format(date, "yyyy-MM-dd"))}${locationPart}.xlsx`;
}

/** Downloads the Stock On Hand workbook for the period — every location, or just `locationId`. */
export async function downloadStockOnHandReport(date: Date, locationId?: string): Promise<void> {
  const { userId, userType } = currentUserContext();
  await requestFile(
    () =>
      axiosClient.get<Blob>("/analysis-service/pythonReportController/getSohAnalysis", {
        params: { period: format(date, "yyyy-MM-dd"), userType, userFk: userId, ...(locationId ? { locationId } : {}) },
        responseType: "blob",
      }),
    stockOnHandReportFilename(date, locationId)
  );
}

// ─── Category distribution builder (old app's `categoryAgg`/donut chart source) ─────────────────

function categoryMetricValue(row: DetailRow, metric: CategoryMetric): number {
  if (metric === "curQty") return row.curTotalQty;
  if (metric === "closingQty") return row.closingQty;
  return row.stockAmount;
}

/** Groups the detail rows by category for the category breakdown chart. */
export function buildCategoryDistribution(rows: DetailRow[], metric: CategoryMetric): DistributionPoint[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.categoryName, (totals.get(row.categoryName) ?? 0) + categoryMetricValue(row, metric));
  }
  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}
