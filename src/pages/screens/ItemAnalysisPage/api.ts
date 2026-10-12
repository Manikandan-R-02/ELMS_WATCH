/**
 * Item Analysis's HTTP calls — all six now go to the new backend's `item-analysis-summary-service`, with the new
 * `{ success, message, data }` envelope on every response. Same URL shapes and request fields as the old ElmsWatch
 * screen (`views/admin/itemanalysis/index.jsx`):
 *
 *  - `itemIngredientAnalysisController/overallDropDown/{type}/{date}/{userType}/{userId}` — `type` 0 = every
 *    location, 1-3 = that location type's category list (0=all, 1=contracts, 2=segments, 3=om).
 *  - `itemIngredientAnalysisController/dropDownByNameBased/{type}/{typeName}/{date}/{userType}/{userId}`.
 *  - `itemIngredientAnalysisController/listOfItemIngredientAnalysis` (POST) — `data.itemList` (the item rows) and
 *    `data.categoryList` (the category totals for the chart).
 *  - The item category list comes from `itemBreakupController/categoryDropDown` and the SRC type list from
 *    `categoryAnalysisController/srcTypeDropDown/{period}/{locationId}/{userType}/{userId}` — the same new calls the
 *    Item Breakup and Category Analysis screens already use, reused here (the old app had its own copies of both
 *    on the item-ingredient service). Consumption Analysis, which used to share them, is untouched.
 *
 * Every dropdown row is the backend's one very wide shared DTO, of which only `id`/`name` (or `locationId`/
 * `locationName`) and `startDay` are read; `startDay` is a string in the new swagger, so it is parsed.
 */
import axiosClient from "../../../api/axiosClient";
import { currentUserContext, formatDateForApi, textOf, unwrapEnvelope as unwrap, type ApiEnvelope } from "../../../api/apiHelpers";
import { fetchCategoryOptions as fetchItemBreakupCategoryOptions } from "../ItemBreakupPage/api";
import { ALL_CATEGORY, LOCATION_TYPE_API_INDEX, type ItemAnalysisFilter, type ItemAnalysisRow, type CategoryAmount, type LocationOption, type LocationType } from "./data";

export { fetchSrcTypeOptions } from "../CategoryAnalysisPage/api";

const BASE = "/item-analysis-summary-service/itemIngredientAnalysisController";

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

/** The item categories for the filter. Same call Item Breakup uses; the old list also carried an "All Category"
 * entry, which this screen adds itself, so it is dropped here. */
export async function fetchCategoryOptions(): Promise<string[]> {
  const names = await fetchItemBreakupCategoryOptions();
  return names.filter((name) => name.trim().toLowerCase() !== "all category");
}

export async function fetchAllLocationOptions(date: Date): Promise<LocationOption[]> {
  const { userId, userType } = currentUserContext();
  const { data: envelope } = await axiosClient.get<ApiEnvelope<LocationDropdownApiItem[]>>(
    `${BASE}/overallDropDown/0/${formatDateForApi(date)}/${userType}/${userId}`
  );
  return (unwrap(envelope) ?? []).map(mapLocationOption);
}

/** The location type's category list (type 1-3); only `name` is kept. */
export async function fetchLocationTypeCategories(type: LocationType, date: Date): Promise<LocationDropdownApiItem[]> {
  const { userId, userType } = currentUserContext();
  const idx = LOCATION_TYPE_API_INDEX[type];
  const { data: envelope } = await axiosClient.get<ApiEnvelope<LocationDropdownApiItem[]>>(
    `${BASE}/overallDropDown/${idx}/${formatDateForApi(date)}/${userType}/${userId}`
  );
  return (unwrap(envelope) ?? []).map((row) => ({ name: row.name || row.locationName || "" }));
}

export async function fetchLocationOptionsByCategory(type: LocationType, category: string, date: Date): Promise<LocationOption[]> {
  const { userId, userType } = currentUserContext();
  const idx = LOCATION_TYPE_API_INDEX[type];
  const { data: envelope } = await axiosClient.get<ApiEnvelope<LocationDropdownApiItem[]>>(
    `${BASE}/dropDownByNameBased/${idx}/${encodeURIComponent(category)}/${formatDateForApi(date)}/${userType}/${userId}`
  );
  return (unwrap(envelope) ?? []).map(mapLocationOption);
}

export interface ItemAnalysisQuery {
  reportingMonth: Date;
  locationId: string;
  filter: ItemAnalysisFilter;
  /** The billing window, when the location has a `startDay` configured — sent as `fromDate`/
   * `toDate` exactly like the old screen; omitted for a location with no billing cycle set up. */
  billingWindow?: { from: Date; to: Date };
}

type ApiRow = Partial<Record<string, unknown>>;

interface ItemAnalysisApiData {
  summary?: ApiRow;
  itemList?: ApiRow[];
  categoryList?: ApiRow[];
}

export interface ItemAnalysisResult {
  items: ItemAnalysisRow[];
  categories: CategoryAmount[];
}

export function mapItemRow(r: ApiRow): ItemAnalysisRow {
  return {
    categoryId: textOf(r.categoryId, ""),
    itemId: textOf(r.itemId, ""),
    itemName: r.itemName ? textOf(r.itemName) : textOf(r.itemId, "Unknown"),
    packageId: textOf(r.packageId, ""),
    qty: Number(r.qty) || 0,
    qtyCon: Number(r.qtyCon) || 0,
    uomCon: textOf(r.uomCon, ""),
    amount: Number(r.amount) || 0,
  };
}

export function mapCategoryAmount(c: ApiRow): CategoryAmount {
  return { categoryId: textOf(c.categoryId || c.categoryName, ""), amount: Number(c.amount) || 0 };
}

export async function fetchItemAnalysis(query: ItemAnalysisQuery): Promise<ItemAnalysisResult> {
  const { reportingMonth, locationId, filter, billingWindow } = query;
  const { data: envelope } = await axiosClient.post<ApiEnvelope<ItemAnalysisApiData>>(`${BASE}/listOfItemIngredientAnalysis`, {
    month: reportingMonth.getMonth() + 1,
    year: reportingMonth.getFullYear(),
    locationId,
    periodStr: formatDateForApi(reportingMonth),
    ...(filter.date ? { srcDate: formatDateForApi(filter.date) } : {}),
    ...(filter.category === ALL_CATEGORY ? {} : { categoryId: filter.category }),
    ...(filter.srcType ? { srcType: filter.srcType } : {}),
    ...(billingWindow ? { fromDate: formatDateForApi(billingWindow.from), toDate: formatDateForApi(billingWindow.to) } : {}),
  });
  const data = unwrap(envelope);

  return {
    items: (data?.itemList ?? []).map(mapItemRow),
    categories: (data?.categoryList ?? []).map(mapCategoryAmount),
  };
}
