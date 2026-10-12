/**
 * All HTTP calls for the Location Summary screen — served by the new backend's single
 * `overallSummary-service` (which also serves Overall Summary, Location Details and Location
 * Insight; the old per-screen `location-summary-service` is not used any more). Same controller
 * and action names as the old ElmsWatch app (`ELmsWatch/src/views/admin/LmsSummary/index.jsx`)
 * but with the new backend's response shapes: every response is `{ success, message, data }`, and
 * `listOfLocationSummary` splits its old `responseContent`/`responseContents*` payload into
 * `data.summary` / `locationSummaryList` / `monthComparisonGraphList` / `dailyPrjList`.
 * `fetchLocationSummary` translates that back into the shape the screen's components already
 * read (`LocationSummaryApiResponse`), so none of them change. Every component on this screen
 * imports from here instead of calling `axiosClient` itself, so the request/response contract
 * lives in exactly one place.
 *
 * The new backend documents its per-month and per-day field names, and they match what
 * `monthFieldValue` / `dailyFieldValue` below read (`totalMandaysCurrent`,
 * `previousTotalManday1…12`, `pob1…25`, `actual1…25`, …).
 */
import axiosClient from "../../../api/axiosClient";
import { formatDateForApi, currentUserContext, unwrapEnvelope as unwrap, type ApiEnvelope } from "../../../api/apiHelpers";
import type { InventoryItem, LocationRecord, LocationType } from "./data";

const SERVICE = "/overallSummary-service/locationSummaryController";

export { formatDateForApi } from "../../../api/apiHelpers";

/** `type` index the backend expects — old app's `getTypeIndex()`. */
export const LOCATION_TYPE_API_INDEX: Record<LocationType | "all", number> = {
  all: 0,
  contracts: 1,
  segments: 2,
  om: 3,
};

// ─── listOfLocationSummary ───────────────────────────────────────────────────────────────

export type LocationSummaryFilterMode = "Data" | "Month Comparison" | "Month Comparison New" | "Daily PRJ";

export interface ListOfLocationSummaryPayload {
  date: string;
  month: number;
  year: number;
  dailyPRJDayRange: number;
  monthFilter: number;
  filter: LocationSummaryFilterMode;
  type: number;
  /** Numeric — the new backend's request body declares `userId` as an integer. */
  userId: number;
  userType: number;
  typeName?: string;
  locationId?: string;
  yearList?: { year: string; month: string }[];
}

/** One row of `responseContents` (filter "Data" — the Summary tab). */
export interface SummaryApiRow {
  locationId: string;
  locationName: string;
  staff?: number;
  currentPob?: number;
  staffRatio?: number;
  lastUpdate?: string;
  targetPRJ?: number;
  actual?: number;
  totalMandays?: number;
  totalCost?: number;
  totalWasteCost?: number;
  inventoryValue?: number;
  dio?: number;
  currentFirst10?: number;
  currentSecond10?: number;
  currentThrid10?: number;
}

/** One row of `responseContents2` (filter "Month Comparison" / "Month Comparison New"). Per-month
 * figures live on dynamically-suffixed keys (`totalMandaysCurrent`, `totalMandays1`, …) — see
 * `monthFieldValue` below instead of indexing this type directly. */
export type MonthComparisonApiRow = { locationId: string; locationName: string } & Record<string, number | string | undefined>;

/** One row of `responseContents3` (filter "Daily PRJ"). Per-day figures live on `pob{day}` /
 * `actual{day}` keys — see `dailyFieldValue` below. */
export type DailyPrjApiRow = { locationId: string; locationName: string } & Record<string, number | string | undefined>;

export interface LocationSummaryStats {
  totalLocations?: number;
  totalPOB?: number;
  totalMandays?: number;
  totalCost?: number;
  avgCostManday?: number;
  totalWasteCost?: number;
  costPercentageChange?: number | string;
  /** Field names verified against the old app's own `lossReasonData` usage
   * (LmsSummary/index.jsx, LmsDashboard/index.jsx) — `lossReason`/`sumOfWeight`. */
  lossReasonByweight?: { lossReason?: string; sumOfWeight?: number }[];
  foodItemByweight?: { foodItem: string; sumOfWeight?: number }[];
  dailyCostMap?: Record<string, { current?: number; previous?: number }>;
}

/** What the screen's components read — the old payload's field names, filled in from the new
 * response by `fetchLocationSummary` below. */
export interface LocationSummaryApiResponse {
  /** Summary tab rows (filter "Data"). */
  responseContents?: SummaryApiRow[];
  /** Month Comparison / Compare Custom Months / Location Graphs rows. */
  responseContents2?: MonthComparisonApiRow[];
  /** Daily PRJ rows. */
  responseContents3?: DailyPrjApiRow[];
  /** Headline stats, cost-comparison chart and waste breakdowns. */
  responseContent?: LocationSummaryStats;
}

/** `data` of `POST .../listOfLocationSummary`. Every entry is the same backend DTO; the screen
 * only reads the fields declared on the row/stats types above. */
interface LocationSummaryApiData {
  summary?: LocationSummaryStats;
  locationSummaryList?: SummaryApiRow[];
  monthComparisonGraphList?: MonthComparisonApiRow[];
  dailyPrjList?: DailyPrjApiRow[];
}

export async function fetchLocationSummary(payload: ListOfLocationSummaryPayload): Promise<LocationSummaryApiResponse> {
  const { data: envelope } = await axiosClient.post<ApiEnvelope<LocationSummaryApiData>>(`${SERVICE}/listOfLocationSummary`, payload);
  const body = unwrap(envelope);
  return {
    responseContent: body?.summary,
    responseContents: body?.locationSummaryList,
    responseContents2: body?.monthComparisonGraphList,
    responseContents3: body?.dailyPrjList,
  };
}

/** Builds the common part of the payload every fetch on this screen sends — callers only need
 * to add `filter` and whatever that filter mode requires (`typeName`/`locationId`/`yearList`). */
export function baseSummaryPayload(date: Date, filter: LocationSummaryFilterMode, monthFilter = 12): ListOfLocationSummaryPayload {
  const { userId, userType } = currentUserContext();
  return {
    date: formatDateForApi(date),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    dailyPRJDayRange: 9,
    monthFilter,
    filter,
    type: 0,
    userId: Number(userId),
    userType,
  };
}

/** Layers the location-filter (type/category/specific location) onto a payload — shared by every
 * fetch so the Summary, Month Comparison, Daily PRJ, and Location Graphs views all respect the
 * same header location filter. */
export function withLocationFilter(
  payload: ListOfLocationSummaryPayload,
  filter: { type: LocationType | "all"; category: string; locationId: string }
): ListOfLocationSummaryPayload {
  const next = { ...payload, type: LOCATION_TYPE_API_INDEX[filter.type] };
  if (filter.type !== "all" && filter.category) next.typeName = filter.category;
  if (filter.locationId) next.locationId = filter.locationId;
  return next;
}

/** Old app's `gf(prefixA, prefixB, idx)` (index.jsx ~2288), verbatim: `idx === 0` (the base/
 * reporting month) reads the `...Current` key, every other month reads its 1-based position
 * among the non-base months, trying the primary field name first and a `previous*` variant as
 * a fallback. */
export function monthFieldValue(row: MonthComparisonApiRow, prefixA: string, prefixB: string, idx: number): number {
  const suffix = idx === 0 ? "Current" : String(idx);
  return (row[`${prefixA}${suffix}`] as number) || (row[`${prefixB}${suffix}`] as number) || 0;
}

export function dailyFieldValue(row: DailyPrjApiRow, prefix: "pob" | "actual", day: number): number {
  return (row[`${prefix}${day}`] as number) || 0;
}

// ─── overallDropDown / dropDownByNameBased ───────────────────────────────────────────────────

export interface LocationDropdownItem {
  id?: string;
  name: string;
  category?: string;
  parent?: string;
}

/** One entry of a dropdown response. The backend returns one DTO type for every dropdown, so a
 * location may arrive as `id`/`name` or as `locationId`/`locationName`; a category (type 1-3
 * list) only needs `name`. */
interface DropdownApiRow {
  id?: string;
  name?: string;
  locationId?: string;
  locationName?: string;
  category?: string;
}

export function mapDropdownRow(row: DropdownApiRow): LocationDropdownItem {
  return {
    id: row.id || row.locationId || undefined,
    name: row.name || row.locationName || "",
    category: row.category || undefined,
  };
}

/** `apiIndex` 0 returns every location (used for the header search field and the "all
 * locations" specific-location list); 1/2/3 return that type's category list instead. */
export async function fetchLocationTypeOptions(apiIndex: number, date: Date): Promise<LocationDropdownItem[]> {
  const { userId, userType } = currentUserContext();
  const { data: envelope } = await axiosClient.get<ApiEnvelope<DropdownApiRow[]>>(
    `${SERVICE}/overallDropDown/${apiIndex}/${formatDateForApi(date)}/${userType}/${userId}`
  );
  return (unwrap(envelope) ?? []).map(mapDropdownRow);
}

export async function fetchLocationsByCategory(type: LocationType, category: string, date: Date): Promise<LocationDropdownItem[]> {
  const { userId, userType } = currentUserContext();
  const apiIndex = LOCATION_TYPE_API_INDEX[type];
  const { data: envelope } = await axiosClient.get<ApiEnvelope<DropdownApiRow[]>>(
    `${SERVICE}/dropDownByNameBased/${apiIndex}/${encodeURIComponent(category)}/${formatDateForApi(date)}/${userType}/${userId}`
  );
  return (unwrap(envelope) ?? []).map(mapDropdownRow);
}

// ─── inventoryDataByLocation ──────────────────────────────────────────────────────────────────

export interface InventoryApiItem {
  category: string;
  itemId: string;
  itemName: string;
  packageId: string;
  closingQty?: number;
  closingValue?: number;
}

export async function fetchInventoryByLocation(date: Date, locationId: string): Promise<InventoryApiItem[]> {
  const { data: envelope } = await axiosClient.get<ApiEnvelope<InventoryApiItem[]>>(
    `${SERVICE}/inventoryDataByLocation/${formatDateForApi(date)}/${encodeURIComponent(locationId)}`
  );
  return unwrap(envelope) ?? [];
}

// ─── Response → UI-model mapping ──────────────────────────────────────────────────────────────

export function mapSummaryRow(row: SummaryApiRow): LocationRecord {
  return {
    id: row.locationId,
    name: row.locationName,
    staff: row.staff ?? 0,
    currentPOB: row.currentPob ?? 0,
    lastUpdated: row.lastUpdate ?? "",
    targetPRJ: row.targetPRJ ?? 0,
    actual: row.actual ?? 0,
    totalMandays: row.totalMandays ?? 0,
    totalCost: row.totalCost ?? 0,
    wasteCost: row.totalWasteCost ?? 0,
    inventoryValue: row.inventoryValue ?? 0,
    dio: row.dio ?? 0,
    tenDay: row.currentFirst10 ?? 0,
    twentyDay: row.currentSecond10 ?? 0,
    thirtyDay: row.currentThrid10 ?? 0,
  };
}

export function mapInventoryItem(item: InventoryApiItem): InventoryItem {
  return {
    category: item.category,
    itemId: item.itemId,
    itemName: item.itemName,
    packageId: item.packageId,
    closingQty: item.closingQty ?? 0,
    closingValue: item.closingValue ?? 0,
  };
}
