/**
 * All HTTP calls for the Daily PRJ screen — one GET endpoint, now on the new backend's
 * `analysis-service` (`/analysis-service/pythonReportController/dailyPRJ`; it was the old
 * `consolidated-python-report-service`). Same two calls as the old ElmsWatch app's
 * `views/admin/DailyPrj/index.jsx` (`fetchSummary`/`fetchLocationDetail`) — omitting `locationId`
 * returns every location's monthly summary row, passing it returns that one location's day-by-day
 * detail. Query params: `period` (YYYY-MM-01), `userFk`, `userType` and the optional `locationId`.
 * The response structure is unchanged from the old app; like Data Tracker Report it is read either
 * bare or inside the new `{ success, message, data }` envelope (`unwrapPayload`), and the Excel
 * link from `download_url` or `downloadUrlPath`.
 *
 * The detail response is read defensively (several possible field-name spellings per figure,
 * e.g. `var_prj`/`variance_prj`/`prj_variance`/`var_daily_prj`/`daily_prj_var`) — the old app's
 * own `transformApiLocation` does the same, which reads like even that codebase wasn't fully
 * sure which spelling the backend actually settled on. Treat the detail response shape as
 * best-effort until checked against a reachable backend.
 */
import { format } from "date-fns";
import axiosClient from "../../../api/axiosClient";
import { currentUserContext, unwrapPayload, withRetry } from "../../../api/apiHelpers";

/** This report aggregates every location's full month of figures in one response — heavy enough
 * that the shared client's default 30s timeout occasionally isn't enough, and a bare "couldn't
 * load" banner over what would have arrived a few seconds later is a worse experience than
 * waiting slightly longer. A longer per-request timeout plus `withRetry` (see apiHelpers.ts)
 * gives it real room before actually giving up. */
const HEAVY_REPORT_TIMEOUT_MS = 60000;

/** One endpoint for both the summary and the per-location detail. */
const DAILY_PRJ_PATH = "/analysis-service/pythonReportController/dailyPRJ";
import type { DetailDayRow, MonthSummaryRow, PrjBreakdownEntry, SummaryColumnDef, SummaryRow, TargetRow } from "./data";

/** `period` is always the first of the month, `YYYY-MM-DD` — old app's `pickerDate.startOf("month")`. */
export function periodForMonth(date: Date): string {
  return format(date, "yyyy-MM-01");
}

// ─── dailyPRJ (summary — no locationId) ──────────────────────────────────────────────────────

/** group label -> the group's columns, either `{ key: label }` (old backend) or a plain list of keys (new
 * backend: `{ location: ["location_code", ...], prj: ["prj", "target", ...] }`). */
export type SummaryColumnsMeta = Record<string, Record<string, string> | string[]>;
export type SummaryDataRow = Record<string, number | string | undefined> & { location_code?: string; location_name?: string };

export interface DailyPrjSummaryApiResponse {
  summary_sheet?: {
    title?: string;
    columns?: SummaryColumnsMeta;
    data?: SummaryDataRow[];
  };
  download_url?: string;
  /** The new backend's own envelope names its file link `downloadUrlPath`. */
  downloadUrlPath?: string;
}

export async function fetchDailyPrjSummary(date: Date): Promise<DailyPrjSummaryApiResponse> {
  const { userId, userType } = currentUserContext();
  return withRetry(async () => {
    const { data: body } = await axiosClient.get<DailyPrjSummaryApiResponse>(
      DAILY_PRJ_PATH,
      { params: { period: periodForMonth(date), userType, userFk: userId }, timeout: HEAVY_REPORT_TIMEOUT_MS }
    );
    const data = unwrapPayload(body);
    return { ...data, download_url: data.download_url || data.downloadUrlPath || undefined };
  });
}

// ─── dailyPRJ (detail — with locationId) ─────────────────────────────────────────────────────

export type DailyPrjDetailRowApi = Record<string, number | string | null | undefined> & {
  sno?: number;
  date?: string;
  prj_breakdown?: Record<string, Record<string, number | undefined>>;
};

export interface DailyPrjLocationApiResponse {
  location_id?: string;
  location_name?: string;
  rows?: DailyPrjDetailRowApi[];
  current_month?: { rows?: DailyPrjDetailRowApi[] };
  prj_types?: string[];
  target_table?: (Record<string, number | string | undefined> & { prj?: string })[];
  header_rows?: { current_month?: Record<string, number | undefined>; previous_month?: Record<string, number | undefined> };
  summary_row?: Record<string, number | string | undefined>;
}

export async function fetchDailyPrjLocation(date: Date, locationId: string): Promise<DailyPrjLocationApiResponse> {
  const { userId, userType } = currentUserContext();
  return withRetry(async () => {
    const { data: body } = await axiosClient.get<DailyPrjLocationApiResponse>(
      DAILY_PRJ_PATH,
      { params: { period: periodForMonth(date), locationId, userType, userFk: userId }, timeout: HEAVY_REPORT_TIMEOUT_MS }
    );
    return unwrapPayload(body);
  });
}

// ─── Response → UI-model mapping ────────────────────────────────────────────────────────────────

/** Flattens the summary sheet's 2-level column meta into one entry per (group, key) pair, in the order the
 * backend sent them — matches how `SummaryTable` renders one flat column per pair (see that file's doc comment
 * for why, vs. the old app's grouped header). A group is either `{ key: label }` or a plain list of keys (the
 * key doubles as its label). The location code/name columns are the table's own pinned Code / Name columns, so
 * they are not repeated here. */
export function flattenSummaryColumns(columns: SummaryColumnsMeta | undefined): SummaryColumnDef[] {
  const defs: SummaryColumnDef[] = [];
  for (const [group, keys] of Object.entries(columns ?? {})) {
    const pairs: [string, string][] = Array.isArray(keys) ? keys.map((key) => [String(key), String(key)]) : Object.entries(keys ?? {});
    for (const [key, label] of pairs) {
      if (key === "location_code" || key === "location_name") continue;
      defs.push({ key, group, label });
    }
  }
  return defs;
}

export function mapSummaryRows(rows: SummaryDataRow[] | undefined): SummaryRow[] {
  return (rows ?? []).map((row) => {
    const { location_code, location_name, ...values } = row ?? {};
    return { id: String(location_code ?? ""), name: String(location_name ?? ""), values: values as Record<string, number | string> };
  });
}

function num(row: DailyPrjDetailRowApi, ...keys: string[]): number {
  for (const key of keys) {
    const v = row[key];
    if (v !== undefined && v !== null && v !== "") return typeof v === "number" ? v : Number.parseFloat(String(v)) || 0;
  }
  return 0;
}

function mapPrjBreakdown(raw: Record<string, Record<string, number | undefined>> | undefined): Record<string, PrjBreakdownEntry> {
  const out: Record<string, PrjBreakdownEntry> = {};
  for (const [prjType, entry] of Object.entries(raw ?? {})) {
    out[prjType] = {
      food: entry?.food ?? 0,
      cleaning: entry?.cleaning ?? 0,
      disposable: entry?.disposable ?? 0,
      mandays: entry?.mandays ?? 0,
      total: entry?.total ?? 0,
      prj: entry?.prj ?? 0,
    };
  }
  return out;
}

export function mapDetailRow(row: DailyPrjDetailRowApi): DetailDayRow {
  return {
    sno: num(row, "sno"),
    date: String(row.date ?? ""),
    food: num(row, "food"),
    cleaning: num(row, "cleaning"),
    disposable: num(row, "disposable"),
    consumption: num(row, "consumption"),
    mandays: num(row, "mandays"),
    dailyPrj: num(row, "daily_prj"),
    varPrj: num(row, "var_prj", "variance_prj", "prj_variance", "var_daily_prj", "daily_prj_var"),
    staff: num(row, "staff"),
    varStaff: num(row, "var_staff", "variance_staff", "staff_variance"),
    productivity: num(row, "productivity"),
    cumConsumption: num(row, "cum_consumption"),
    cumMandays: num(row, "cum_mandays"),
    cumPrj: num(row, "cum_prj"),
    others: num(row, "others"),
    extraProgram: num(row, "extra_program"),
    prjBreakdown: mapPrjBreakdown(row.prj_breakdown),
  };
}

export function mapTargetTable(rows: DailyPrjLocationApiResponse["target_table"]): TargetRow[] {
  return (rows ?? []).map((row) => ({
    prj: String(row.prj ?? ""),
    targetValue: Number(row.target_value ?? row["target"] ?? 0) || 0,
    mandays: Number(row.mandays ?? 0) || 0,
    total: Number(row.total ?? 0) || 0,
    impactManday: Number(row.impact_manday ?? 0) || 0,
  }));
}

/** The screen's single authoritative "Target" figure for Daily PRJ — the `target_table` row
 * named "PRJ/Manday", its `total` field (old app's own comment calls this out as a deliberate
 * fix over averaging individual target values). */
export function targetDailyPrj(targetRows: TargetRow[]): number {
  return targetRows.find((r) => r.prj === "PRJ/Manday")?.total ?? 0;
}

/** A backend-reported header row (Current Month / Previous Month) as-is — same field names as
 * the day-detail rows, just one rollup figure per column instead of one per day. */
export function mapMonthHeaderRow(label: string, raw: Record<string, number | undefined> | undefined): MonthSummaryRow {
  return {
    label,
    food: raw?.food,
    cleaning: raw?.cleaning,
    disposable: raw?.disposable,
    consumption: raw?.consumption,
    mandays: raw?.mandays,
    dailyPrj: raw?.daily_prj,
    staff: raw?.staff,
    productivity: raw?.productivity,
    others: raw?.others,
  };
}

/** Old app's `computeSummaryFromRows`: client-side Total (sum) and Avg (mean over rows with a
 * positive value — "active" days) across the currently-loaded day rows, since the backend
 * itself only sends Current/Previous Month rollups, not Total/Avg. */
export function computeTotalAndAverage(rows: DetailDayRow[]): { total: MonthSummaryRow; avg: MonthSummaryRow } {
  const sum = (pick: (r: DetailDayRow) => number) => rows.reduce((s, r) => s + pick(r), 0);
  const avgActive = (pick: (r: DetailDayRow) => number) => {
    const active = rows.map(pick).filter((v) => v > 0);
    return active.length ? active.reduce((s, v) => s + v, 0) / active.length : 0;
  };
  const total: MonthSummaryRow = {
    label: "Total",
    food: sum((r) => r.food),
    cleaning: sum((r) => r.cleaning),
    disposable: sum((r) => r.disposable),
    consumption: sum((r) => r.consumption),
    mandays: sum((r) => r.mandays),
    dailyPrj: sum((r) => r.mandays) > 0 ? sum((r) => r.consumption) / sum((r) => r.mandays) : 0,
    staff: sum((r) => r.staff),
    productivity: undefined,
    others: sum((r) => r.others),
  };
  const avg: MonthSummaryRow = {
    label: "Avg",
    mandays: avgActive((r) => r.mandays),
    dailyPrj: avgActive((r) => r.dailyPrj),
    staff: avgActive((r) => r.staff),
    productivity: avgActive((r) => r.productivity),
  };
  return { total, avg };
}

/** The Target row shown alongside Current/Previous Month/Total/Avg — Daily PRJ from
 * `targetDailyPrj()`, Staff/Productivity targets from the location's own `summary_row`
 * (there's no per-day target for every column, unlike the others). */
export function buildTargetSummaryRow(dailyPrj: number, summaryRow: DailyPrjLocationApiResponse["summary_row"]): MonthSummaryRow {
  return {
    label: "Target",
    dailyPrj,
    staff: Number(summaryRow?.target_staff ?? 0) || undefined,
    productivity: Number(summaryRow?.target_productivity ?? 0) || undefined,
  };
}
