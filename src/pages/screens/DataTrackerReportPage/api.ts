/**
 * All HTTP calls for the Data Tracker Report screen — one GET, now on the new backend's
 * `analysis-service` (`/analysis-service/pythonReportController/lmsDataTrackerReport`; it was the
 * old `consolidated-python-report-service`). Same call as the old ElmsWatch app's `handleGenerate`
 * (`views/admin/DataTrackerReport/DataTrackerReport.jsx`): `period` is `YYYY-MM-01`, and the new
 * swagger also lists an optional `locationId` that this screen never sends (it shows every location).
 * The one response carries both the grid (`detail_sheet`, `days`, …) and the Excel link, so there is
 * no separate download-link request.
 *
 * The new swagger declares the response as an empty object (`{}`), so the shape is not confirmed:
 * the body is read either bare (the Python service's own JSON, as before) or inside the new
 * `{ success, message, data }` envelope (`unwrapPayload`), and the file link from `download_url` or
 * `downloadUrlPath`. Check against a real response.
 */
import { safeMessage } from "../../../lib/safeMessage";
import { format } from "date-fns";
import axiosClient from "../../../api/axiosClient";
import { unwrapPayload, withRetry } from "../../../api/apiHelpers";
import { CATEGORY_LABELS, type CategoryKey, type DataTrackerReportSummary, type DetailRow } from "./data";

/** This report aggregates every location's full month of Yes/No flags in one response — same
 * "heavy report" reasoning as Daily PRJ's own longer timeout + retry. */
const HEAVY_REPORT_TIMEOUT_MS = 60000;

export function periodForMonth(date: Date): string {
  return format(date, "yyyy-MM-01");
}

interface DetailSheetLocationRow {
  sno?: number;
  location_id?: string;
  location_name?: string;
  consumption?: string[];
  mandays?: string[];
  staff_onsite?: string[];
}

export interface DataTrackerReportApiResponse {
  status?: string;
  message?: string;
  error?: string;
  period?: string;
  download_url?: string;
  /** The new backend's own envelope names its file link `downloadUrlPath`. */
  downloadUrlPath?: string;
  day_numbers?: number[];
  days?: string[];
  detail_sheet?: { data?: DetailSheetLocationRow[] };
}

export async function fetchDataTrackerReport(date: Date): Promise<DataTrackerReportSummary> {
  return withRetry(async () => {
    const { data: body } = await axiosClient.get<DataTrackerReportApiResponse>(
      "/analysis-service/pythonReportController/lmsDataTrackerReport",
      { params: { period: periodForMonth(date) }, timeout: HEAVY_REPORT_TIMEOUT_MS }
    );
    const data = unwrapPayload(body);
    if (data.status && data.status !== "success") {
      throw new Error(safeMessage(data.message || data.error, "Failed to generate the report. Please try again."));
    }
    return mapReport(data);
  });
}

function mapReport(data: DataTrackerReportApiResponse): DataTrackerReportSummary {
  const locations = data.detail_sheet?.data ?? [];
  const rows: DetailRow[] = [];
  for (const [locIndex, loc] of locations.entries()) {
    for (const key of Object.keys(CATEGORY_LABELS) as CategoryKey[]) {
      const apiKey = key === "staffOnsite" ? "staff_onsite" : key;
      rows.push({
        key: `${loc.location_id ?? locIndex}-${key}`,
        sno: loc.sno ?? locIndex + 1,
        locationId: loc.location_id ?? "",
        locationName: loc.location_name ?? "",
        category: CATEGORY_LABELS[key],
        values: (loc as unknown as Record<string, string[] | undefined>)[apiKey] ?? [],
      });
    }
  }
  return {
    period: data.period ?? "",
    downloadUrl: data.download_url || data.downloadUrlPath || undefined,
    dayNumbers: data.day_numbers ?? [],
    dayDates: data.days ?? [],
    locationCount: locations.length,
    rows,
  };
}
