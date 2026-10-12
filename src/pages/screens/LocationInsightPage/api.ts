/**
 * All HTTP calls for the Location Insight screen — served by the new backend's single
 * `overallSummary-service` (which also serves Overall Summary, Location Summary and Location
 * Details; the old `location-insight-service` is not used any more). Same controller and action
 * name as the old ElmsWatch app, confirmed by reading
 * `ELmsWatch/src/views/admin/LocationInsight/index.jsx`'s `fetchAllData` directly. Its dropdown
 * endpoints follow the exact same `apiIndex` (0=all/1=contracts/2=segments/3=om) convention
 * `LocationSummaryPage/api.ts` already uses — see `LocationInsightPage/index.tsx` for why the
 * location *picker* itself reuses `LocationDetailsPage/LocationPickerModal` (and, through it,
 * `LocationSummaryPage`'s dropdown calls).
 *
 * The new response is `{ success, message, data: { summary, dayWiseMandayList,
 * dayWiseCumulativeDailyCostList, dayWiseConsumptionDataList } }`. `summary` carries the headline
 * figures and the date-keyed `splitPrjList`; the three `dayWise*` lists are string arrays. The
 * swagger doesn't show the string format, so they're parsed as the old app's `"DD-MM-YYYY: value"`
 * (`mapSeries`) — verify against a real response.
 */
import axiosClient from "../../../api/axiosClient";
import { formatDateForApi, unwrapEnvelope, type ApiEnvelope } from "../../../api/apiHelpers";
import type { InsightStats, SeriesPoint, SplitPrjPoint } from "./data";

export { formatDateForApi } from "../../../api/apiHelpers";

export interface ListOfLocationInsightPayload {
  dateString: string;
  month: number;
  year: number;
  locationId: string;
}

export function baseInsightPayload(date: Date, locationId: string): ListOfLocationInsightPayload {
  return {
    dateString: formatDateForApi(date),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    locationId,
  };
}

export interface SplitPrjApiEntry {
  FOOD?: number;
  CLEANING?: number;
  /** Old app tolerates this exact misspelling as a fallback field name (index.jsx line 322) —
   * kept here rather than "fixed", since the real backend may still send it. */
  CLENING?: number;
  DISPOSAL?: number;
  OTHERS?: number;
}

export interface LocationInsightStatsApi {
  totalManday?: number;
  totalCost?: number;
  cumDailyCost?: number;
  splitPrjList?: Record<string, SplitPrjApiEntry>;
}

/** The `data` of the response envelope. */
export interface LocationInsightApiResponse {
  summary?: LocationInsightStatsApi;
  /** Mandays series — each entry a `"DD-MM-YYYY: value"` string (old app's `parseContents`). */
  dayWiseMandayList?: string[];
  /** Cumulative daily cost series, same string-per-day shape. */
  dayWiseCumulativeDailyCostList?: string[];
  /** Daily consumption series, same string-per-day shape. */
  dayWiseConsumptionDataList?: string[];
}

export async function fetchLocationInsight(payload: ListOfLocationInsightPayload): Promise<LocationInsightApiResponse> {
  const { data } = await axiosClient.post<ApiEnvelope<LocationInsightApiResponse>>(
    "/overallSummary-service/locationInsightController/listOfLocationInsight",
    payload
  );
  return unwrapEnvelope(data) ?? {};
}

// ─── Response → UI-model mapping ────────────────────────────────────────────────────────────────

export function mapInsightStats(stats: LocationInsightStatsApi | undefined): InsightStats {
  return {
    totalMandays: stats?.totalManday ?? 0,
    totalCost: stats?.totalCost ?? 0,
    cumulativeDailyCost: stats?.cumDailyCost ?? 0,
  };
}

/** Old app's `parseContents()` (index.jsx ~160-170): splits each `"DD-MM-YYYY: value"` string
 * into a date label and a float, in whatever order the backend sent them. */
export function mapSeries(entries: string[] | undefined): SeriesPoint[] {
  return (entries ?? []).map((entry) => {
    const sep = entry.indexOf(":");
    const rawDate = (sep < 0 ? entry : entry.slice(0, sep)).trim();
    const rawValue = sep < 0 ? "" : entry.slice(sep + 1).trim();
    const parts = rawDate.split("-");
    return { date: parts.length === 3 ? `${parts[0]}/${parts[1]}/${parts[2]}` : rawDate, value: Number.parseFloat(rawValue) || 0 };
  });
}

/** Old app's split-by-PRJ chart data (index.jsx ~313-325): `splitPrjList` is a date-keyed object,
 * not an array — sorts by the raw `"YYYY-MM-DD"` key (sorts chronologically as plain strings)
 * before flattening. */
export function mapSplitPrjSeries(splitPrjList: Record<string, SplitPrjApiEntry> | undefined): SplitPrjPoint[] {
  if (!splitPrjList) return [];
  return Object.keys(splitPrjList)
    .sort((a, b) => a.localeCompare(b))
    .map((date) => {
      const entry = splitPrjList[date];
      return {
        date,
        food: entry?.FOOD ?? 0,
        cleaning: entry?.CLEANING ?? entry?.CLENING ?? 0,
        disposal: entry?.DISPOSAL ?? 0,
        others: entry?.OTHERS ?? 0,
      };
    });
}
