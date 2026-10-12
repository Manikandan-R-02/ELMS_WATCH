/**
 * The Report Generator's single HTTP call — confirmed by reading the old ElmsWatch app's
 * `views/admin/Report/Report.jsx` (`buildReportUrl` + `handleGenerate`):
 * `GET consolidated-python-report-service/pythonReportController/{reportKey}?period=YYYY-MM`.
 * The new backend serves the same path (e.g. `.../pythonReportController/stockReportConsolidated`
 * with a `period` query param); the last segment changes with the report the user picks.
 *
 * Never throws: every outcome (file produced, nothing for that period, request failed) comes back
 * as a `ReportResult`, so the screen can record each attempt in its history without juggling
 * `useApiRequest`'s async `error` state separately from the return value.
 */
import { safeMessage } from "../../../lib/safeMessage";
import { format } from "date-fns";
import { isAxiosError } from "axios";
import axiosClient from "../../../api/axiosClient";
import type { ReportResult } from "./data";

/** Generating a consolidated month of data is slow on the Python service. Deliberately no
 * automatic retry (unlike the read-only Daily PRJ summary) — a silent second attempt would
 * re-run an expensive generation the reader didn't ask for; they can just click Generate again. */
const REPORT_TIMEOUT_MS = 120000;

/** This endpoint takes `YYYY-MM` — not the `YYYY-MM-01` the Daily PRJ/Data Tracker reports use. */
export function periodForReport(date: Date): string {
  return format(date, "yyyy-MM");
}

interface ReportApiResponse {
  success?: boolean;
  download_url?: string;
  /** The new backend's own envelope names its file link `downloadUrlPath` (top level, or inside
   * `data`); the Python service's own reply uses `download_url`. All are accepted. */
  downloadUrlPath?: string;
  data?: { download_url?: string; downloadUrlPath?: string } | null;
  message?: string;
  error?: string;
}

/** The report file's link, from whichever of the known fields the backend filled in. */
function downloadUrlOf(body: ReportApiResponse | undefined): string | undefined {
  return body?.download_url || body?.downloadUrlPath || body?.data?.download_url || body?.data?.downloadUrlPath || undefined;
}

/** Prefers a `?file=` query param (the Python service's own download links look like
 * `.../download?file=name.xlsx`), then the last path segment, then a generic name. */
function filenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url, globalThis.location.origin);
    const fromQuery = parsed.searchParams.get("file");
    if (fromQuery) return fromQuery;
    const lastSegment = parsed.pathname.split("/").findLast(Boolean);
    if (lastSegment) return decodeURIComponent(lastSegment);
  } catch {
    // Unparseable URL — fall through to the generic name below.
  }
  return "report.xlsx";
}

export async function generateReport(reportKey: string, period: Date): Promise<ReportResult> {
  try {
    const { data } = await axiosClient.get<ReportApiResponse>(
      `/consolidated-python-report-service/pythonReportController/${encodeURIComponent(reportKey)}`,
      { params: { period: periodForReport(period) }, timeout: REPORT_TIMEOUT_MS }
    );
    // Same priority as the old app's own fix: a download URL means success, full stop — checking
    // `message` first used to misread every successful generation as "no data".
    const downloadUrl = downloadUrlOf(data);
    if (downloadUrl) {
      return { kind: "success", downloadUrl, filename: filenameFromUrl(downloadUrl) };
    }
    return { kind: "nodata", message: safeMessage(data?.message, "No data available for the selected period.") };
  } catch (err) {
    if (isAxiosError<ReportApiResponse>(err)) {
      if (err.code === "ECONNABORTED") {
        return { kind: "error", message: "The report took too long to generate. Please try again." };
      }
      const body = err.response?.data;
      return { kind: "error", message: safeMessage(body?.error || body?.message, "Failed to generate the report. Please try again.") };
    }
    return { kind: "error", message: safeMessage(err instanceof Error ? err.message : undefined, "Failed to generate the report. Please try again.") };
  }
}
