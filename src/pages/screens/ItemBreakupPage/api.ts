/**
 * Item Breakup's HTTP calls — all five now go to the new backend's `item-analysis-summary-service`
 * (`itemBreakupController`), same URL shapes and request fields as the old ElmsWatch screen
 * (`views/admin/ingredientanalysis/index.jsx`), with the new `{ success, message, data }` envelope
 * on every response:
 *
 *  - `overallDropDown/{type}/{date}/{userType}/{userId}` — `type` 0 = every location, 1-3 = that
 *    location type's category list (0=all, 1=contracts, 2=segments, 3=om).
 *  - `dropDownByNameBased/{type}/{typeName}/{date}/{userType}/{userId}` — locations under a category.
 *  - `categoryDropDown` — the item categories.
 *  - `listOfItemBreakup` (POST) — `data` is the item rows themselves (not wrapped in an object).
 *
 * Every dropdown row is the backend's one very wide shared DTO, of which only `id`/`name` (or
 * `locationId`/`locationName`) are read. The new request has no `type` field (the old app always
 * sent 0), so it is no longer sent. The new response spells the 6-months-ago quantity
 * `previousQt6` (sic) next to `previousQty1…5,7…11`; `mapRow` reads both spellings.
 */
import axiosClient from "../../../api/axiosClient";
import { currentUserContext, formatDateForApi, textOf, unwrapEnvelope as unwrap, type ApiEnvelope } from "../../../api/apiHelpers";
import { LOCATION_TYPE_API_INDEX, type ItemBreakupRow, type LocationOption, type LocationType } from "./data";

const BASE = "/item-analysis-summary-service/itemBreakupController";

/** One row of any dropdown response. A location may arrive as `id`/`name` or as
 * `locationId`/`locationName`; a category list only needs `name`. */
export interface LocationDropdownApiItem {
  id?: string;
  name?: string;
  locationId?: string;
  locationName?: string;
}

export function mapLocationOption(row: LocationDropdownApiItem): LocationOption {
  return { id: textOf(row.id || row.locationId, ""), name: row.name || row.locationName || "" };
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

export async function fetchCategoryOptions(): Promise<string[]> {
  const { data: envelope } = await axiosClient.get<ApiEnvelope<{ name?: string }[]>>(`${BASE}/categoryDropDown`);
  return (unwrap(envelope) ?? []).map((c) => c.name ?? "").filter(Boolean);
}

export interface ItemBreakupQuery {
  reportingMonth: Date;
  locationId: string;
  categoryId: string;
}

interface ItemBreakupApiRow {
  categoryId?: string;
  itemId?: string;
  itemName?: string;
  packageId?: string;
  pkgCon?: number;
  pkgConUom?: string;
  currentQty?: number;
  currentCost?: number;
  [key: string]: unknown;
}

/** `previousQty{offset}`, except the new backend spells offset 6 `previousQt6`. */
function previousQty(raw: ItemBreakupApiRow, offset: number): number {
  return Number(raw[`previousQty${offset}`] ?? (offset === 6 ? raw.previousQt6 : undefined)) || 0;
}

export function mapRow(raw: ItemBreakupApiRow): ItemBreakupRow {
  const figuresByOffset: ItemBreakupRow["figuresByOffset"] = {
    0: { qty: Number(raw.currentQty) || 0, cost: Number(raw.currentCost) || 0 },
  };
  for (let offset = 1; offset <= 11; offset++) {
    figuresByOffset[offset] = {
      qty: previousQty(raw, offset),
      cost: Number(raw[`previousCost${offset}`]) || 0,
    };
  }
  return {
    categoryId: String(raw.categoryId ?? ""),
    itemId: String(raw.itemId ?? ""),
    itemName: raw.itemName ? String(raw.itemName) : String(raw.itemId ?? "Unknown"),
    packageId: String(raw.packageId ?? ""),
    pkgCon: Number(raw.pkgCon) || 0,
    pkgConUom: String(raw.pkgConUom ?? ""),
    figuresByOffset,
  };
}

export async function fetchItemBreakup(query: ItemBreakupQuery): Promise<ItemBreakupRow[]> {
  const { data: envelope } = await axiosClient.post<ApiEnvelope<ItemBreakupApiRow[]>>(`${BASE}/listOfItemBreakup`, {
    dateString: formatDateForApi(query.reportingMonth),
    month: query.reportingMonth.getMonth() + 1,
    year: query.reportingMonth.getFullYear(),
    locationId: query.locationId,
    categoryId: query.categoryId,
  });
  return (unwrap(envelope) ?? []).map(mapRow);
}
