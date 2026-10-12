/**
 * WasteCost Analysis's HTTP calls — confirmed by reading the old ElmsWatch app's
 * `views/admin/wastecost/index.jsx`. All three endpoints live under
 * `waste-cost-analysis-service/wasteCostController/` on the same gateway every other screen uses
 * (the old app's separate `WASTE_URL` constant resolves to the identical
 * `https://lmswatch.socat.com:8443/api-gateway` as `LOGIN_URL`/`USR_MASTER_URL` — just its own
 * named constant, not actually a different host), so this goes through the normal shared
 * `axiosClient` base URL like every other screen's `api.ts`.
 */
import axiosClient from "../../../api/axiosClient";
import { currentUserContext } from "../../../api/apiHelpers";
import { ALL_LOCATIONS, ALL_MONTHS, type DayBasedDataType, type DayRow, type LocationOption, type LossReasonRow, type TopWastedFoodRow, type WasteFigures, type WasteOverviewRow } from "./data";

const BASE = "/waste-cost-analysis-service/wasteCostController";

function emptyFigures(): WasteFigures {
  return { currentMandays: 0, mealsCount: 0, totalWasteWeight: 0, totalWasteValue: 0, transactionCount: 0, rawMaterialCost: 0, wasteMealsGms: 0 };
}

interface LocationDropdownResponse {
  responseContents?: { code: string; name: string }[];
}

export async function fetchWasteLocations(year: number): Promise<LocationOption[]> {
  const { userId, userType } = currentUserContext();
  const { data } = await axiosClient.get<LocationDropdownResponse>(`${BASE}/locationDropdown/${year}/${userType}/${userId}`);
  return (data.responseContents ?? []).map((l) => ({ id: l.code, name: l.name }));
}

export interface WasteDashboardQuery {
  year: number;
  /** Omit, or pass `ALL_MONTHS`, for the whole year. */
  month?: number;
  /** Omit, or pass `ALL_LOCATIONS`, for every location. */
  locationId?: string;
}

interface WasteDashboardContent extends Partial<WasteFigures> {
  wasteOverViewList?: WasteOverviewRow[];
  locationSubList?: WasteOverviewRow[];
}

interface WasteDashboardResponse {
  responseContent?: WasteDashboardContent;
  responseContents2?: LossReasonRow[];
  responseContents3?: TopWastedFoodRow[];
}

export interface WasteDashboardResult {
  totals: WasteFigures;
  /** The main "Waste Overview" table's rows for this query — one entry per month for a
   * year-wide/single-location query, or one entry per location for a whole-year-all-locations
   * query narrowed to a specific month. */
  overviewRows: WasteOverviewRow[];
  lossReasons: LossReasonRow[];
  topWastedFood: TopWastedFoodRow[];
}

export async function fetchWasteDashboard(query: WasteDashboardQuery): Promise<WasteDashboardResult> {
  const { userId, userType } = currentUserContext();
  const hasMonth = !!query.month && query.month !== ALL_MONTHS;
  const hasLocation = !!query.locationId && query.locationId !== ALL_LOCATIONS;

  const { data } = await axiosClient.post<WasteDashboardResponse>(`${BASE}/wasteDataDashboard`, {
    yearType: hasMonth ? 1 : 0,
    year: query.year,
    ...(hasMonth ? { month: query.month } : {}),
    ...(hasLocation ? { locationId: query.locationId } : {}),
    locType: hasLocation ? 1 : 0,
    userId,
    userType,
  });

  const content = data.responseContent ?? {};
  return {
    totals: { ...emptyFigures(), ...content },
    overviewRows: content.wasteOverViewList ?? content.locationSubList ?? [],
    lossReasons: data.responseContents2 ?? [],
    topWastedFood: data.responseContents3 ?? [],
  };
}

/** The per-location breakdown for one specific month, across every location — the same call the
 * old screen used both for expanding a month row inline and for the donut chart's month → location
 * drill-down, so both features in this rebuild share this one function. */
export async function fetchLocationBreakdownForMonth(year: number, month: number): Promise<WasteOverviewRow[]> {
  const { userId, userType } = currentUserContext();
  const { data } = await axiosClient.post<WasteDashboardResponse>(`${BASE}/wasteDataDashboard`, {
    yearType: 1,
    year,
    month,
    locationId: ALL_LOCATIONS,
    locType: 0,
    userId,
    userType,
  });
  return data.responseContent?.locationSubList ?? [];
}

interface DayBasedDataResponse {
  responseContents?: DayRow[];
}

export async function fetchDayBasedData(year: number, month: number, locationId: string, typeName: DayBasedDataType): Promise<DayRow[]> {
  const { data } = await axiosClient.post<DayBasedDataResponse>(`${BASE}/getDayBasedData`, { year, month, locationId, typeName });
  return (data.responseContents ?? []).map((row) => ({
    ...emptyFigures(),
    ...row,
    lossReasonList: row.lossReasonList ?? [],
    foodItemByweight: row.foodItemByweight ?? [],
  }));
}
