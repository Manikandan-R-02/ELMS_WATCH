/**
 * All HTTP calls for the Consumption Analysis screen — all eight now go to the new backend's `analysis-service`
 * (they were spread over the old item-ingredient, location-details, location-summary and
 * consolidated-python-report services). Same URL shapes and request fields as the old ElmsWatch screen
 * (`views/admin/LocationConsumptions/index.jsx`), with the new `{ success, message, data }` envelope on every
 * JSON response:
 *
 * - `itemIngredientAnalysisController/categoryDropDown` and
 *   `itemIngredientAnalysisController/srcTypeDropDown/{period}/{location}` (no userType / userId here).
 * - `locationDetailsController/overallDropDown/{type}/{date}/{userType}/{userId}` (type 0 = every location, 1-3 =
 *   that location type's category list) and `locationDetailsController/dropDownByNameBased/{type}/{typeName}/...`.
 * - `locationSummaryController/consumptionOverallSummary/{period}/{userType}/{userId}` — one aggregated row per
 *   location, the only call made on page load.
 * - `locationSummaryController/consumptionByLocationByDate` (POST) — the item detail and every chart tab for one
 *   location. The old response's `responseContents` / `responseContents2` / `responseContents3` / `responseContents4`
 *   are now `data.summaryList` / `data.srcTypeList` / `data.perMandayList` / `data.srcTypeMasterList`
 *   (the last was never used by the screen). See `mapConsumptionByLocation`.
 * - `pythonReportController/getConsumptionReport` — the Excel export; the swagger gives no response structure, so
 *   it goes through `requestFile` (src/api/fileDownload.ts), which saves a real file, shows a JSON error's own
 *   message, or opens a JSON file link.
 *
 * Every dropdown row is the backend's one very wide shared DTO, of which only `id`/`name` (or
 * `locationId`/`locationName`) are read.
 */
import axiosClient from "../../../api/axiosClient";
import { currentUserContext, formatDateForApi, textOf, unwrapEnvelope as unwrap, withRetry, type ApiEnvelope } from "../../../api/apiHelpers";
import { requestFile } from "../../../api/fileDownload";
import type {
  CategoryMetric,
  DetailRow,
  DistributionPoint,
  DynamicSrcRow,
  LocationOption,
  LocationType,
  RcMandayMetric,
  RcMetric,
  SummaryRow,
} from "./data";
import { LOCATION_TYPE_API_INDEX } from "./data";

const SERVICE = "/analysis-service";
const ITEM_BASE = `${SERVICE}/itemIngredientAnalysisController`;
const DETAILS_BASE = `${SERVICE}/locationDetailsController`;
const SUMMARY_BASE = `${SERVICE}/locationSummaryController`;

/** One row of any dropdown response. A location may arrive as `id`/`name` or as `locationId`/`locationName`;
 * a category list only needs `name`. */
export interface LocationDropdownApiItem {
  id?: string;
  name?: string;
  locationId?: string;
  locationName?: string;
}

export function mapLocationOption(row: LocationDropdownApiItem): LocationOption {
  return { id: textOf(row.id || row.locationId, ""), name: row.name || row.locationName || "" };
}

// ─── categoryDropDown ─────────────────────────────────────────────────────────────────────────

export async function fetchCategoryOptions(): Promise<string[]> {
  const { data: envelope } = await axiosClient.get<ApiEnvelope<{ name?: string }[]>>(`${ITEM_BASE}/categoryDropDown`);
  return (unwrap(envelope) ?? [])
    .map((c) => c.name ?? "")
    .filter((name) => name && name.trim().toLowerCase() !== "all category");
}

// ─── srcTypeDropDown ──────────────────────────────────────────────────────────────────────────

export async function fetchSrcTypeOptions(date: Date, locationId: string): Promise<string[]> {
  const { data: envelope } = await axiosClient.get<ApiEnvelope<{ name?: string }[]>>(
    `${ITEM_BASE}/srcTypeDropDown/${formatDateForApi(date)}/${encodeURIComponent(locationId)}`
  );
  return (unwrap(envelope) ?? []).map((s) => s.name ?? "").filter(Boolean);
}

// ─── overallDropDown / dropDownByNameBased ──────────────────────────────────────────────────────

export async function fetchAllLocationOptions(date: Date): Promise<LocationOption[]> {
  const { userId, userType } = currentUserContext();
  const { data: envelope } = await axiosClient.get<ApiEnvelope<LocationDropdownApiItem[]>>(
    `${DETAILS_BASE}/overallDropDown/0/${formatDateForApi(date)}/${userType}/${userId}`
  );
  return (unwrap(envelope) ?? []).map(mapLocationOption);
}

/** The location type's category list (type 1-3); only `name` is kept. */
export async function fetchLocationTypeCategories(type: LocationType, date: Date): Promise<LocationDropdownApiItem[]> {
  const { userId, userType } = currentUserContext();
  const idx = LOCATION_TYPE_API_INDEX[type];
  const { data: envelope } = await axiosClient.get<ApiEnvelope<LocationDropdownApiItem[]>>(
    `${DETAILS_BASE}/overallDropDown/${idx}/${formatDateForApi(date)}/${userType}/${userId}`
  );
  return (unwrap(envelope) ?? []).map((row) => ({ name: row.name || row.locationName || "" }));
}

export async function fetchLocationOptionsByCategory(type: LocationType, category: string, date: Date): Promise<LocationOption[]> {
  const { userId, userType } = currentUserContext();
  const idx = LOCATION_TYPE_API_INDEX[type];
  const { data: envelope } = await axiosClient.get<ApiEnvelope<LocationDropdownApiItem[]>>(
    `${DETAILS_BASE}/dropDownByNameBased/${idx}/${encodeURIComponent(category)}/${formatDateForApi(date)}/${userType}/${userId}`
  );
  return (unwrap(envelope) ?? []).map(mapLocationOption);
}

// ─── consumptionOverallSummary ──────────────────────────────────────────────────────────────────

interface SummaryApiRow {
  locationId?: string;
  locationName?: string;
  itemCount?: number;
  totalQty?: number;
  convertedQty?: number;
  totalAmount?: number;
}

export function mapSummaryRow(row: SummaryApiRow): SummaryRow {
  return {
    locationId: row.locationId ?? "Unknown",
    locationName: row.locationName ?? "",
    totalItems: Number(row.itemCount) || 0,
    totalQty: Number(row.totalQty) || 0,
    conQty: Number(row.convertedQty) || 0,
    totalAmount: Number(row.totalAmount) || 0,
  };
}

export async function fetchConsumptionSummary(date: Date): Promise<SummaryRow[]> {
  const { userId, userType } = currentUserContext();
  return withRetry(async () => {
    const { data: envelope } = await axiosClient.get<ApiEnvelope<SummaryApiRow[]>>(
      `${SUMMARY_BASE}/consumptionOverallSummary/${formatDateForApi(date)}/${userType}/${userId}`
    );
    return (unwrap(envelope) ?? []).map(mapSummaryRow);
  });
}

// ─── consumptionByLocationByDate ────────────────────────────────────────────────────────────────

export interface ConsumptionByLocationPayload {
  locationId: string;
  periodStr: string;
  category?: string;
  srcType?: string;
}

/** One row of any of the three lists — the new DTO is shared by `summaryList`, `srcTypeList` and `perMandayList`. */
interface ConsumptionApiRow {
  itemId?: string;
  itemName?: string;
  categoryName?: string;
  srcType?: string;
  itemUom?: string;
  pkgConUom?: string;
  pkgCon?: number;
  totalQty?: number;
  convertedQty?: number;
  totalAmount?: number;
  dynamicSrcTypeMap?: Record<string, number> | null;
  dynamicPerMandayMap?: Record<string, number> | null;
}

interface ConsumptionByLocationApiData {
  summaryList?: ConsumptionApiRow[];
  srcTypeList?: ConsumptionApiRow[];
  perMandayList?: ConsumptionApiRow[];
  srcTypeMasterList?: unknown[];
}

/** What the screen needs for one location: the item rows and the two per-source-type row sets (the old
 * response's `responseContents`, `responseContents2` and `responseContents3`). */
export interface ConsumptionByLocation {
  details: DetailRow[];
  srcTypeRows: DynamicSrcRow[];
  perMandayRows: DynamicSrcRow[];
}

/** The new DTO carries no unit price, so it is worked out as amount per unit of quantity (0 without a quantity). */
export function mapDetailRow(row: ConsumptionApiRow): DetailRow {
  const totalQty = Number(row.totalQty) || 0;
  const totalAmount = Number(row.totalAmount) || 0;
  return {
    itemId: row.itemId ?? "",
    itemName: row.itemName ?? row.itemId ?? "Unknown",
    categoryName: row.categoryName ?? "Unknown",
    srcType: row.srcType ?? "",
    unit: row.itemUom ?? row.pkgConUom ?? "",
    pkgCon: Number(row.pkgCon) || 0,
    totalQty,
    conQty: Number(row.convertedQty) || 0,
    totalAmount,
    unitPrice: totalQty > 0 ? totalAmount / totalQty : 0,
  };
}

/** `perManday` rows read the per-manday map first (`dynamicPerMandayMap`), falling back to
 * `dynamicSrcTypeMap`, since the swagger does not say which of the two the per-manday figures arrive in. */
export function mapDynamicSrcRow(row: ConsumptionApiRow, perManday = false): DynamicSrcRow {
  const perMandayMap = row.dynamicPerMandayMap ?? {};
  const srcMap = row.dynamicSrcTypeMap ?? {};
  const map = perManday && Object.keys(perMandayMap).length > 0 ? perMandayMap : srcMap;
  return {
    itemId: row.itemId ?? "",
    itemName: row.itemName ?? row.itemId ?? "Unknown",
    dynamicSrcTypeMap: map,
  };
}

export function mapConsumptionByLocation(data: ConsumptionByLocationApiData | undefined): ConsumptionByLocation {
  return {
    details: (data?.summaryList ?? []).map(mapDetailRow),
    srcTypeRows: (data?.srcTypeList ?? []).map((row) => mapDynamicSrcRow(row)),
    perMandayRows: (data?.perMandayList ?? []).map((row) => mapDynamicSrcRow(row, true)),
  };
}

export async function fetchConsumptionByLocation(payload: ConsumptionByLocationPayload): Promise<ConsumptionByLocation> {
  return withRetry(async () => {
    const { data: envelope } = await axiosClient.post<ApiEnvelope<ConsumptionByLocationApiData>>(`${SUMMARY_BASE}/consumptionByLocationByDate`, payload);
    return mapConsumptionByLocation(unwrap(envelope));
  });
}

// ─── getConsumptionReport — Excel export ────────────────────────────────────────────────────────

/** `consumption_{period}[_{location}].xlsx`, alphanumeric-only so it is valid on every OS. */
export function consumptionReportFilename(date: Date, locationId?: string): string {
  const safe = (text: string) => text.replaceAll(/\W/g, "_");
  const locationPart = locationId ? `_${safe(locationId)}` : "";
  return `consumption_${safe(formatDateForApi(date))}${locationPart}.xlsx`;
}

/** Downloads the consumption workbook for the period — every location, or just `locationId`. */
export async function downloadConsumptionReport(date: Date, locationId?: string): Promise<void> {
  const { userId, userType } = currentUserContext();
  await requestFile(
    () =>
      axiosClient.get<Blob>(`${SERVICE}/pythonReportController/getConsumptionReport`, {
        params: { period: formatDateForApi(date), userType, userFk: userId, ...(locationId ? { locationId } : {}) },
        responseType: "blob",
      }),
    consumptionReportFilename(date, locationId)
  );
}

// ─── Donut-chart distribution builders (old app's `categorySeriesTop`/`buildItemDataFromRC`) ────

function categoryMetricValue(row: DetailRow, metric: CategoryMetric): number {
  if (metric === "amount") return row.totalAmount;
  if (metric === "qty") return row.totalQty;
  if (metric === "conQty") return row.conQty;
  return row.totalQty * row.pkgCon; // pkgConQty
}

/** Groups the detail rows by category for the "Category" chart tab's top level. */
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

/** Item-level drill-down once a category slice/legend row is clicked. */
export function buildItemDistributionForCategory(rows: DetailRow[], category: string, metric: CategoryMetric): DistributionPoint[] {
  return rows
    .filter((row) => row.categoryName === category)
    .map((row) => ({ name: row.itemName, value: categoryMetricValue(row, metric), itemId: row.itemId }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

/** `responseContents2`'s (qty-based) or `responseContents3`'s (per-manday) `dynamicSrcTypeMap`
 * keys look like `"<srcType>_TotalQty"` / `"<srcType>_ConvertedQty"` (RC2) or
 * `"<srcType>_TotalQtyPerManday"` / `"<srcType>_ConvertedQtyPerManday"` (RC3). Splits on the
 * last known suffix so a source-type name containing an underscore is still read correctly. */
const RC_SUFFIXES = ["_TotalQty", "_ConvertedQty"] as const;
const RC_MANDAY_SUFFIXES = ["_TotalQtyPerManday", "_ConvertedQtyPerManday"] as const;

function splitDynamicKey(key: string, suffixes: readonly string[]): { srcType: string; suffix: string } | null {
  for (const suffix of suffixes) {
    if (key.endsWith(suffix)) return { srcType: key.slice(0, key.length - suffix.length), suffix: suffix.slice(1) };
  }
  return null;
}

/** Sums every row's `dynamicSrcTypeMap` grouped by source type, for the "Source Type" /
 * "Source Type / Manday" chart tabs' top level. `perManday` picks which suffix set to parse. */
export function buildSrcTypeDistribution(rows: DynamicSrcRow[], metric: RcMetric | RcMandayMetric, perManday: boolean): DistributionPoint[] {
  const suffixes = perManday ? RC_MANDAY_SUFFIXES : RC_SUFFIXES;
  const wantSuffix = metric === "qty" || metric === "qtyPerManday" ? suffixes[0].slice(1) : suffixes[1].slice(1);
  const totals = new Map<string, number>();
  for (const row of rows) {
    for (const [key, value] of Object.entries(row.dynamicSrcTypeMap)) {
      const parsed = splitDynamicKey(key, suffixes);
      if (parsed?.suffix !== wantSuffix) continue;
      totals.set(parsed.srcType, (totals.get(parsed.srcType) ?? 0) + (Number(value) || 0));
    }
  }
  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

/** Item-level drill-down once a source-type slice/legend row is clicked on the RC2/RC3 tabs. */
export function buildItemDistributionForSrcType(
  rows: DynamicSrcRow[],
  srcType: string,
  metric: RcMetric | RcMandayMetric,
  perManday: boolean
): DistributionPoint[] {
  const suffixes = perManday ? RC_MANDAY_SUFFIXES : RC_SUFFIXES;
  const wantSuffix = metric === "qty" || metric === "qtyPerManday" ? suffixes[0].slice(1) : suffixes[1].slice(1);
  const key = `${srcType}_${wantSuffix}`;
  return rows
    .map((row) => ({ name: row.itemName, value: Number(row.dynamicSrcTypeMap[key]) || 0, itemId: row.itemId }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}
