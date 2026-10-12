/**
 * All HTTP calls for the Location Details screen — served by the new backend's single
 * `overallSummary-service` (which also serves Overall Summary, Location Summary and Location
 * Insight; the old `location-details-service` / `location-summary-service` are not used any
 * more). Same controller and action names as the old ElmsWatch app, confirmed by reading
 * `ELmsWatch/src/views/admin/LmsDetails/index.jsx`'s `fetchAllData` (main payload/response),
 * `fetchInventoryTabData` (inventory trend / DIO), and its SRC-type dropdown call directly.
 * The location-picker dropdowns reuse `LocationSummaryPage/api.ts`'s `fetchLocationTypeOptions`/
 * `fetchLocationsByCategory` — same service, no reason to duplicate them here.
 *
 * Every response is the new backend's `{ success, message, data }`. `listOfLocationDetails` splits
 * its old `responseContent`/`responseContents…4` payload into `data.summary` / `srcDataList` /
 * `consumptionDataList` / `splitPrjList` / `consumptionComparisonList`; `fetchLocationDetails`
 * translates that back into the shape the screen's components already read
 * (`LocationDetailsApiResponse`), so none of them change.
 *
 * Two things worth knowing:
 *  - `inventoryData` is served by `locationSummaryController`, NOT `locationDetailsController`
 *    like this screen's other two calls — the backend confirmed the path, but it is an oddity to
 *    raise with them (it is flagged in the integration tracker).
 *  - The Consumption Compare tab's request carries `previousMonths` / `previousYears` (parallel
 *    lists of the comparison months) instead of the old `filter: "Month Comparison New"` +
 *    `yearList` pair, which the new request body no longer has. They are sent as the comparison
 *    months only (the base month is the request's own `month`/`year`), in the order the response's
 *    `previousMonthTotalCost1…11` columns are read — an assumption to confirm with the backend.
 */
import axiosClient from "../../../api/axiosClient";
import { formatDateForApi, currentUserContext, unwrapEnvelope as unwrap, type ApiEnvelope } from "../../../api/apiHelpers";
import type { InventoryApiItem } from "../LocationSummaryPage/api";
import type { ComparisonRecord, ConsumptionRecord, InventoryTrendRecord, SplitPrjRecord, SrcDataRecord } from "./data";

export { formatDateForApi } from "../../../api/apiHelpers";

const SERVICE = "/overallSummary-service";

// ─── listOfLocationDetails ────────────────────────────────────────────────────────────────────

export interface ListOfLocationDetailsPayload {
  date: string;
  month: number;
  year: number;
  type: number;
  locationId: string;
  dailyPRJDayRange: number;
  monthFilter: number;
  /** Consumption Compare only: the comparison months (not the base month), as parallel lists. */
  previousMonths?: number[];
  previousYears?: number[];
}

/** One row of `responseContents` (SRC Data). */
export interface SrcApiRow {
  srcType?: string;
  dateString?: string;
  pob?: number;
  totalCost?: number;
  wasteCost?: number;
  dailyCostPerPerson?: number;
  targetPRJ?: number;
  cumulativeManday?: number;
  cumulativeCost?: number;
  cumulativeDailyCost?: number;
}

/** One row of `responseContents2` (Consumption). */
export interface ConsumptionApiRow {
  srcType?: string;
  dateString?: string;
  srcDateString?: string;
  totalMandays?: number;
  categoryListData?: Record<string, number>;
  totalCost?: number;
  avgCostManday?: number;
}

/** One row of `responseContents3` (Split by PRJ) — read directly, no field renaming. */
export interface SplitPrjApiRow {
  srcType?: string;
  dateString?: string;
  totalMandays?: number;
  foodCost?: number;
  cleaningCost?: number;
  disposalCost?: number;
  othersCost?: number;
  total?: number;
}

/** One row of `responseContents4` (Consumption Compare) — per-month figures live on
 * `currentMonthTotalCost`/`totalCost_{year}_{month}`-style keys, see `categoryFieldValue`. */
export type ComparisonApiRow = { category: string } & Record<string, number | string | undefined>;

export interface LocationDetailsStats {
  totalMandays?: number;
  totalCost?: number;
  totalSales?: number;
  totalWasteCost?: number;
  cumulativeDailyCost?: number;
  costPercentageChange?: number | string;
  dailyCostMap?: Record<string, { current?: number; previous?: number }>;
}

/** What the screen's components read — the old payload's field names, filled in from the new
 * response by `fetchLocationDetails` below. */
export interface LocationDetailsApiResponse {
  /** Headline stats and the cost-comparison chart. */
  responseContent?: LocationDetailsStats;
  /** SRC Data tab rows. */
  responseContents?: SrcApiRow[];
  /** Consumption tab rows. */
  responseContents2?: ConsumptionApiRow[];
  /** Split by PRJ tab rows. */
  responseContents3?: SplitPrjApiRow[];
  /** Consumption Compare tab rows. */
  responseContents4?: ComparisonApiRow[];
}

/** `data` of `POST .../listOfLocationDetails`. Every entry is the same backend DTO; the screen
 * only reads the fields declared on the row/stats types above. */
interface LocationDetailsApiData {
  summary?: LocationDetailsStats;
  srcDataList?: SrcApiRow[];
  consumptionDataList?: ConsumptionApiRow[];
  splitPrjList?: SplitPrjApiRow[];
  consumptionComparisonList?: ComparisonApiRow[];
}

export async function fetchLocationDetails(payload: ListOfLocationDetailsPayload): Promise<LocationDetailsApiResponse> {
  const { data: envelope } = await axiosClient.post<ApiEnvelope<LocationDetailsApiData>>(
    `${SERVICE}/locationDetailsController/listOfLocationDetails`,
    payload
  );
  const body = unwrap(envelope);
  return {
    responseContent: body?.summary,
    responseContents: body?.srcDataList,
    responseContents2: body?.consumptionDataList,
    responseContents3: body?.splitPrjList,
    responseContents4: body?.consumptionComparisonList,
  };
}

export function baseDetailsPayload(date: Date, locationId: string, monthFilter = 12): ListOfLocationDetailsPayload {
  return {
    date: formatDateForApi(date),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    type: 0,
    locationId,
    dailyPRJDayRange: 9,
    monthFilter,
  };
}

/** The Consumption Compare request: the base month's own date/month/year, plus the comparison
 * months as `previousMonths` / `previousYears` (parallel lists, base month not included). The old
 * app sent `filter: "Month Comparison New"` + a `yearList` that started with the base month; the
 * new request body has neither field. */
export function categoryComparisonPayload(
  locationId: string,
  baseMonth: Date,
  comparisonMonths: { year: number; month: number }[]
): ListOfLocationDetailsPayload {
  return {
    ...baseDetailsPayload(baseMonth, locationId, comparisonMonths.length + 1),
    previousMonths: comparisonMonths.map((m) => m.month),
    previousYears: comparisonMonths.map((m) => m.year),
  };
}

/** Per-category month figure lookup: the base month reads `currentMonthTotalCost` /
 * `currentMonthCostManday`; every other month reads its position among the comparison months
 * (`previousMonthTotalCost{idx}` / `previousMonthCostManday{idx}`, idx 1…11). The old app's dated
 * keys (`totalCost_{year}_{month}`) are still tried first in case the backend ever sends them. */
export function categoryFieldValue(
  row: ComparisonApiRow,
  kind: "cost" | "costManday",
  idx: number,
  month?: { year: number; month: number }
): number {
  if (idx === 0) {
    const key = kind === "cost" ? "currentMonthTotalCost" : "currentMonthCostManday";
    return (row[key] as number) || 0;
  }
  if (month) {
    const datedKey = kind === "cost" ? `totalCost_${month.year}_${month.month}` : `costManday_${month.year}_${month.month}`;
    if (row[datedKey] != null) return (row[datedKey] as number) || 0;
  }
  const suffixKey = kind === "cost" ? `previousMonthTotalCost${idx}` : `previousMonthCostManday${idx}`;
  return (row[suffixKey] as number) || 0;
}

// ─── srcTypeDropDown ──────────────────────────────────────────────────────────────────────────

export interface SrcTypeOption {
  name: string;
}

/** One entry of the SRC-type dropdown response — the backend's shared dropdown DTO, of which only
 * the name matters here (`code`/`id` are fallbacks if `name` is ever empty). */
interface SrcTypeApiRow {
  name?: string;
  code?: string;
  id?: string;
}

export async function fetchSrcTypeOptions(date: Date, locationId: string): Promise<SrcTypeOption[]> {
  const { userId, userType } = currentUserContext();
  const { data: envelope } = await axiosClient.get<ApiEnvelope<SrcTypeApiRow[]>>(
    `${SERVICE}/locationDetailsController/srcTypeDropDown/${formatDateForApi(date)}/${encodeURIComponent(locationId)}/${userType}/${userId}`
  );
  return (unwrap(envelope) ?? []).map((row) => ({ name: row.name || row.code || row.id || "" })).filter((option) => option.name !== "");
}

// ─── inventoryData (trend, distinct from LocationSummaryPage's item-level inventory) ───────────

export interface InventoryTrendApiRow {
  entryDateStr?: string;
  totalClosingQty?: number;
  totalClosingValue?: number;
  dailyConsumptionValue?: number;
  cumConsumptionValue?: number;
  dioDays?: number;
}

/** NOTE: `locationSummaryController`, not `locationDetailsController` — see the file header. */
export async function fetchInventoryTrend(date: Date, locationId: string): Promise<InventoryTrendApiRow[]> {
  const { data: envelope } = await axiosClient.get<ApiEnvelope<InventoryTrendApiRow[]>>(
    `${SERVICE}/locationSummaryController/inventoryData/${formatDateForApi(date)}/${encodeURIComponent(locationId)}`
  );
  return unwrap(envelope) ?? [];
}

// ─── inventoryDataByLocationByDate (item-level inventory for one clicked date) ──────────────────

/** The item-level inventory for one date clicked on the Inventory tab (old app's
 * `handleInventoryDateClick`, index.jsx ~2931). Path params: `period` = the reporting date,
 * `locationId`, `date` = the clicked row's date. Like `inventoryData`, it is on
 * `locationSummaryController`. Response `{ success, data: [...] }`; only `category`, `itemId`,
 * `itemName`, `packageId`, `closingQty` and `closingValue` of each (very wide) row are used. */
export async function fetchInventoryByDate(period: Date, locationId: string, date: string): Promise<InventoryApiItem[]> {
  const { data: envelope } = await axiosClient.get<ApiEnvelope<InventoryApiItem[]>>(
    `${SERVICE}/locationSummaryController/inventoryDataByLocationByDate/${formatDateForApi(period)}/${encodeURIComponent(locationId)}/${encodeURIComponent(date)}`
  );
  return unwrap(envelope) ?? [];
}

// ─── Response → UI-model mapping ────────────────────────────────────────────────────────────────

export function mapSrcRow(row: SrcApiRow): SrcDataRecord {
  const pob = row.pob ?? 0;
  const wasteCost = row.wasteCost ?? 0;
  return {
    srcType: row.srcType ?? "",
    date: row.dateString ?? "",
    pob,
    totalCost: row.totalCost ?? 0,
    wasteCost,
    pobWastePRJ: pob > 0 ? wasteCost / pob : 0,
    dailyCostPerPerson: row.dailyCostPerPerson ?? 0,
    targetPRJ: row.targetPRJ ?? 0,
    cumulativeManday: row.cumulativeManday ?? 0,
    cumulativeCost: row.cumulativeCost ?? 0,
    cumulativeDailyCost: row.cumulativeDailyCost ?? 0,
  };
}

export function mapConsumptionRow(row: ConsumptionApiRow): ConsumptionRecord {
  return {
    srcType: row.srcType ?? "",
    date: row.srcDateString ?? row.dateString ?? "",
    totalMandays: row.totalMandays ?? 0,
    categoryListData: row.categoryListData ?? {},
    totalCost: row.totalCost ?? 0,
    avgCostManday: row.avgCostManday ?? 0,
  };
}

export function mapSplitPrjRow(row: SplitPrjApiRow): SplitPrjRecord {
  return {
    srcType: row.srcType ?? "",
    date: row.dateString ?? "",
    totalMandays: row.totalMandays ?? 0,
    foodCost: row.foodCost ?? 0,
    cleaningCost: row.cleaningCost ?? 0,
    disposalCost: row.disposalCost ?? 0,
    othersCost: row.othersCost ?? 0,
    total: row.total ?? 0,
  };
}

export function mapInventoryTrendRow(row: InventoryTrendApiRow): InventoryTrendRecord {
  return {
    date: row.entryDateStr ?? "",
    closingQty: row.totalClosingQty ?? 0,
    closingValue: row.totalClosingValue ?? 0,
    dailyConsumptionValue: row.dailyConsumptionValue ?? 0,
    cumulativeConsumptionValue: row.cumConsumptionValue ?? 0,
    dioDays: row.dioDays ?? 0,
  };
}

export function mapComparisonRows(
  rows: ComparisonApiRow[],
  months: { key: string; year: number; month: number; isBase?: boolean }[]
): ComparisonRecord[] {
  const monthIndex = new Map<string, number>();
  let counter = 0;
  for (const m of months) monthIndex.set(m.key, m.isBase ? 0 : ++counter);

  return rows.map((row) => {
    const figures: ComparisonRecord["figures"] = {};
    for (const m of months) {
      const idx = monthIndex.get(m.key) ?? 0;
      figures[m.key] = {
        cost: categoryFieldValue(row, "cost", idx, m),
        costPerManday: categoryFieldValue(row, "costManday", idx, m),
      };
    }
    return { category: String(row.category), figures };
  });
}
