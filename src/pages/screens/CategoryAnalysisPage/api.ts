/**
 * Category Analysis's HTTP calls — all six now go to the new backend's single
 * `item-analysis-summary-service` (the dropdowns and the category-level call on its
 * `categoryAnalysisController`; the item drill-down on its `itemIngredientAnalysisController`, the
 * same controller Item Analysis will use). Same URL shapes and request fields as the old
 * ElmsWatch screen (`views/admin/categoryanalysis/index.jsx`), with the new `{ success, message,
 * data }` envelope on every response:
 *
 *  - `overallDropDown/{type}/{date}/{userType}/{userId}` — `type` 0 = every location, 1-3 = that
 *    location type's category list (0=all, 1=contracts, 2=segments, 3=om).
 *  - `dropDownByNameBased/{type}/{typeName}/{date}/{userType}/{userId}` — locations under a category.
 *  - `srcTypeDropDown/{period}/{locationId}/{userType}/{userId}`.
 *  - `listOfCategoryAnalysis` (POST) — `data.categoryList` rows + `data.summary.pob`.
 *  - `listOfItemIngredientAnalysis` (POST) — `data.itemList` rows. The new request takes the billing
 *    window as `fromDate`/`toDate` (the old screen sent `startDate`/`endDate`) and has `periodStr`.
 *
 * Every dropdown row is the backend's one very wide shared DTO, of which only `id`/`name` (or
 * `locationId`/`locationName`) and `startDay` are read.
 */
import axiosClient from "../../../api/axiosClient";
import { currentUserContext, formatDateForApi, textOf, unwrapEnvelope as unwrap, type ApiEnvelope } from "../../../api/apiHelpers";
import { LOCATION_TYPE_API_INDEX, type CategoryAnalysisFilter, type CategoryRow, type ItemRow, type LocationOption, type LocationType } from "./data";

const SERVICE = "/item-analysis-summary-service";
const CAT_BASE = `${SERVICE}/categoryAnalysisController`;
const ITEM_BASE = `${SERVICE}/itemIngredientAnalysisController`;

/** One row of any dropdown response. A location may arrive as `id`/`name` or as
 * `locationId`/`locationName`; a category (type 1-3 list) only needs `name`. `startDay` is typed as
 * a string in the new swagger (a number in the old app), so it is parsed. */
export interface LocationDropdownApiItem {
  id?: string;
  name?: string;
  locationId?: string;
  locationName?: string;
  startDay?: number | string;
}

/** Billing start day as a number, or undefined when it is missing or not a positive number. */
function startDayOf(value: number | string | undefined): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function mapLocationOption(row: LocationDropdownApiItem): LocationOption {
  return { id: textOf(row.id || row.locationId, ""), name: row.name || row.locationName || "", startDay: startDayOf(row.startDay) };
}

/** A category-list row (type 1-3): only the name is used, but it is kept as a dropdown row so the
 * picker can read `name` the same way for every response. */
function mapCategoryRow(row: LocationDropdownApiItem): LocationDropdownApiItem {
  return { name: row.name || row.locationName || "" };
}

export async function fetchAllLocationOptions(date: Date): Promise<LocationOption[]> {
  const { userId, userType } = currentUserContext();
  const { data: envelope } = await axiosClient.get<ApiEnvelope<LocationDropdownApiItem[]>>(
    `${CAT_BASE}/overallDropDown/0/${formatDateForApi(date)}/${userType}/${userId}`
  );
  return (unwrap(envelope) ?? []).map(mapLocationOption);
}

export async function fetchLocationTypeCategories(type: LocationType, date: Date): Promise<LocationDropdownApiItem[]> {
  const { userId, userType } = currentUserContext();
  const idx = LOCATION_TYPE_API_INDEX[type];
  const { data: envelope } = await axiosClient.get<ApiEnvelope<LocationDropdownApiItem[]>>(
    `${CAT_BASE}/overallDropDown/${idx}/${formatDateForApi(date)}/${userType}/${userId}`
  );
  return (unwrap(envelope) ?? []).map(mapCategoryRow);
}

export async function fetchLocationOptionsByCategory(type: LocationType, category: string, date: Date): Promise<LocationOption[]> {
  const { userId, userType } = currentUserContext();
  const idx = LOCATION_TYPE_API_INDEX[type];
  const { data: envelope } = await axiosClient.get<ApiEnvelope<LocationDropdownApiItem[]>>(
    `${CAT_BASE}/dropDownByNameBased/${idx}/${encodeURIComponent(category)}/${formatDateForApi(date)}/${userType}/${userId}`
  );
  return (unwrap(envelope) ?? []).map(mapLocationOption);
}

export async function fetchSrcTypeOptions(date: Date, locationId: string): Promise<string[]> {
  const { userId, userType } = currentUserContext();
  const { data: envelope } = await axiosClient.get<ApiEnvelope<{ name?: string }[]>>(
    `${CAT_BASE}/srcTypeDropDown/${formatDateForApi(date)}/${encodeURIComponent(locationId)}/${userType}/${userId}`
  );
  return (unwrap(envelope) ?? []).map((s) => s.name ?? "").filter(Boolean);
}

export interface CategoryAnalysisQuery {
  reportingMonth: Date;
  locationId: string;
  filter: CategoryAnalysisFilter;
  billingWindow?: { from: Date; to: Date };
}

interface CategoryAnalysisApiRow {
  categoryId?: unknown;
  groupOfCategory?: unknown;
  qty?: unknown;
  qtyCon?: unknown;
  amount?: unknown;
}

interface CategoryAnalysisApiData {
  summary?: { pob?: unknown };
  categoryList?: CategoryAnalysisApiRow[];
}

export interface CategoryAnalysisResult {
  categories: CategoryRow[];
  pob: number;
}

export async function fetchCategoryAnalysis(query: CategoryAnalysisQuery): Promise<CategoryAnalysisResult> {
  const { reportingMonth, locationId, filter, billingWindow } = query;
  const { data: envelope } = await axiosClient.post<ApiEnvelope<CategoryAnalysisApiData>>(`${CAT_BASE}/listOfCategoryAnalysis`, {
    month: reportingMonth.getMonth() + 1,
    year: reportingMonth.getFullYear(),
    locationId,
    ...(filter.date ? { srcDateString: formatDateForApi(filter.date) } : {}),
    ...(filter.srcType ? { srcType: filter.srcType } : {}),
    ...(billingWindow ? { fromDate: formatDateForApi(billingWindow.from), toDate: formatDateForApi(billingWindow.to) } : {}),
  });
  const data = unwrap(envelope);

  const categories: CategoryRow[] = (data?.categoryList ?? []).map((c) => ({
    categoryId: textOf(c.categoryId, ""),
    groupOfCategory: textOf(c.groupOfCategory, ""),
    qty: Number(c.qty) || 0,
    qtyCon: Number(c.qtyCon) || 0,
    amount: Number(c.amount) || 0,
  }));

  return { categories, pob: Number(data?.summary?.pob) || 0 };
}

export interface CategoryItemsQuery {
  reportingMonth: Date;
  locationId: string;
  categoryId: string;
  filter: CategoryAnalysisFilter;
  billingWindow?: { from: Date; to: Date };
}

interface ItemAnalysisApiData {
  itemList?: Partial<Record<keyof ItemRow, unknown>>[];
}

export async function fetchCategoryItems(query: CategoryItemsQuery): Promise<ItemRow[]> {
  const { reportingMonth, locationId, categoryId, filter, billingWindow } = query;
  const { data: envelope } = await axiosClient.post<ApiEnvelope<ItemAnalysisApiData>>(`${ITEM_BASE}/listOfItemIngredientAnalysis`, {
    dateString: formatDateForApi(reportingMonth),
    periodStr: formatDateForApi(reportingMonth),
    month: reportingMonth.getMonth() + 1,
    year: reportingMonth.getFullYear(),
    locationId,
    categoryId,
    ...(filter.date ? { srcDate: formatDateForApi(filter.date) } : {}),
    ...(filter.srcType ? { srcType: filter.srcType } : {}),
    ...(billingWindow ? { fromDate: formatDateForApi(billingWindow.from), toDate: formatDateForApi(billingWindow.to) } : {}),
  });

  return (unwrap(envelope)?.itemList ?? []).map((r) => ({
    categoryId: textOf(r.categoryId, categoryId),
    itemId: textOf(r.itemId, ""),
    itemName: r.itemName ? textOf(r.itemName) : textOf(r.itemId, "Unknown"),
    packageId: textOf(r.packageId, ""),
    qty: Number(r.qty) || 0,
    qtyCon: Number(r.qtyCon) || 0,
    uomCon: textOf(r.uomCon, ""),
    amount: Number(r.amount) || 0,
  }));
}
