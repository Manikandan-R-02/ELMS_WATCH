/**
 * All HTTP calls for the Overall Summary screen — the new backend's `overallSummary-service`
 * (`lmsDashBoardController`), reached through the gateway like every other call (`axiosClient`
 * applies the base URL and token). Every component on this screen imports from here instead of
 * calling `axiosClient` itself, so the request/response contract lives in exactly one place —
 * same pattern as `LocationSummaryPage/api.ts`.
 *
 * The new service wraps every response in `{ success, message, data }` and splits the old
 * `responseContent`/`responseContents*` payload into `data.summary` / `data.contractList` /
 * `data.segmentList` / `data.operManagerList`. `fetchOverallSummary` translates that back into
 * the shape below (`OverallSummaryApiResponse`) so the screen itself stays untouched.
 */
import axiosClient from "../../../api/axiosClient";
import { formatDateForApi, currentUserContext, unwrapEnvelope as unwrap, type ApiEnvelope } from "../../../api/apiHelpers";
import type { CategoryDetailRecord, CategoryRecord, GroupRecord, OverallView, WasteLocationRecord } from "./data";

export { formatDateForApi } from "../../../api/apiHelpers";

const SERVICE = "/overallSummary-service/lmsDashBoardController";

// ─── listOfLmsDashBorard ──────────────────────────────────────────────────────────────────────

interface GroupApiRow {
  contract?: string;
  contractSummaryByNumOfLocation?: number;
  segment?: string;
  segmentSummaryByNumOfLocation?: number;
  operationManager?: string;
  operManagerSummaryByNumOfLocation?: number;
  totalPOB?: number;
  totalMandays?: number;
  totalCost?: number;
  avgCostManday?: number;
  totalWasteCost?: number;
}

interface OverallSummaryApiContent {
  totalLocations?: number;
  totalPOB?: number;
  totalMandays?: number;
  totalCost?: number;
  avgCostManday?: number;
  totalWasteCost?: number;
  costPercentageChange?: number | string;
  /** Field names verified against the old app's own `processLossReasonItem`
   * (LmsDashboard/index.jsx) — `lossReason`/`sumOfWeight`, not `reason`/`weightKg`. */
  lossReasonByweight?: { lossReason?: string; sumOfWeight?: number }[];
  foodItemByweight?: { foodItem: string; sumOfWeight?: number }[];
  wasteCostList?: { locationName: string; locationId: string; wastageCost?: number }[];
  /** Category → total cost, e.g. `{ "Meat": 12000, "Produce": 8400 }` — an object, not an array,
   * per the old app's `Object.entries(categoryListData)` usage. */
  categoryListData?: Record<string, number>;
  dailyCostMap?: Record<string, { current?: number; previous?: number }>;
}

/** What the screen reads — the old payload's field names, filled in from the new response below. */
export interface OverallSummaryApiResponse {
  responseContent?: OverallSummaryApiContent;
  /** Contract-grouped rows. */
  responseContents?: GroupApiRow[];
  /** Segment-grouped rows. */
  responseContents2?: GroupApiRow[];
  /** Operation-manager-grouped rows. */
  responseContents3?: GroupApiRow[];
}

/** `data` of `GET .../listOfLmsDashBorard/{date}/{userType}/{userId}`. Every entry is the same
 * backend DTO; the screen only reads the fields declared on the two row types it's typed as. */
interface OverallSummaryApiData {
  summary?: OverallSummaryApiContent;
  contractList?: GroupApiRow[];
  segmentList?: GroupApiRow[];
  operManagerList?: GroupApiRow[];
}

export async function fetchOverallSummary(date: Date): Promise<OverallSummaryApiResponse> {
  const { userId, userType } = currentUserContext();
  const { data: envelope } = await axiosClient.get<ApiEnvelope<OverallSummaryApiData>>(
    `${SERVICE}/listOfLmsDashBorard/${formatDateForApi(date)}/${userType}/${userId}`
  );
  const body = unwrap(envelope);
  return {
    responseContent: body?.summary,
    responseContents: body?.contractList,
    responseContents2: body?.segmentList,
    responseContents3: body?.operManagerList,
  };
}

// ─── categoryWiseData ─────────────────────────────────────────────────────────────────────────

interface CategoryDetailApiRow {
  locationId: string;
  totalCost?: number;
}

export async function fetchCategoryDetail(category: string, date: Date): Promise<CategoryDetailApiRow[]> {
  const { data: envelope } = await axiosClient.post<ApiEnvelope<CategoryDetailApiRow[]>>(
    `${SERVICE}/categoryWiseData`,
    { category, month: date.getMonth() + 1, year: date.getFullYear() }
  );
  return unwrap(envelope) ?? [];
}

// ─── Response → UI-model mapping ────────────────────────────────────────────────────────────

const GROUP_FIELD: Record<OverallView, { name: keyof GroupApiRow; count: keyof GroupApiRow }> = {
  contract: { name: "contract", count: "contractSummaryByNumOfLocation" },
  segment: { name: "segment", count: "segmentSummaryByNumOfLocation" },
  operationManager: { name: "operationManager", count: "operManagerSummaryByNumOfLocation" },
};

export function mapGroupRow(row: GroupApiRow, view: OverallView): GroupRecord {
  const field = GROUP_FIELD[view];
  return {
    name: (row[field.name] as string) ?? "",
    locationCount: (row[field.count] as number) ?? 0,
    totalPOB: row.totalPOB ?? 0,
    totalMandays: row.totalMandays ?? 0,
    totalCost: row.totalCost ?? 0,
    avgCostManday: row.avgCostManday ?? 0,
    totalWasteCost: row.totalWasteCost ?? 0,
  };
}

/** Filters to positive values and sorts descending, same as the old app's client-side handling
 * of `categoryListData` — the API returns raw amounts, not percentages, so `percentage` is
 * computed here against the group's own total (display-only, matches old app behavior). */
export function mapCategoryRecords(categoryListData: Record<string, number> | undefined): CategoryRecord[] {
  const entries = Object.entries(categoryListData ?? {}).filter(([, value]) => value > 0);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  return entries
    .map(([category, value]) => ({ category, value, percentage: total > 0 ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}

export function mapCategoryDetailRecords(rows: CategoryDetailApiRow[]): CategoryDetailRecord[] {
  const total = rows.reduce((sum, r) => sum + (r.totalCost ?? 0), 0);
  return rows
    .map((r) => ({
      locationId: r.locationId,
      totalCost: r.totalCost ?? 0,
      percentage: total > 0 ? ((r.totalCost ?? 0) / total) * 100 : 0,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);
}

/** Top-10 by waste cost, descending — same filter/sort/slice the old app applies client-side. */
export function mapWasteLocationRecords(list: OverallSummaryApiContent["wasteCostList"]): WasteLocationRecord[] {
  return (list ?? [])
    .map((w) => ({ locationId: w.locationId, locationName: w.locationName, wastageCost: w.wastageCost ?? 0 }))
    .filter((w) => w.wastageCost > 0)
    .sort((a, b) => b.wastageCost - a.wastageCost)
    .slice(0, 10);
}
