import { beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn() } }));

import axiosClient from "../../../api/axiosClient";
import { generateReport, periodForReport } from "./api";

const get = vi.mocked(axiosClient.get);
const SEPT_2026 = new Date(2026, 8, 15);

function axiosErrorWith(code: string, data?: unknown, status = 500) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("Request failed", code, config, undefined, data === undefined ? undefined : { data, status, statusText: "", headers: {}, config });
}

describe("ReportPage api", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("formats the period as YYYY-MM (not the YYYY-MM-01 other reports use)", () => {
    expect(periodForReport(SEPT_2026)).toBe("2026-09");
  });

  it("calls the report's own method on the python report controller with the period param", async () => {
    get.mockResolvedValue({ data: { download_url: "https://x/download?file=a.xlsx" } });
    await generateReport("stockReportConsolidated", SEPT_2026);
    expect(get).toHaveBeenCalledWith(
      "/consolidated-python-report-service/pythonReportController/stockReportConsolidated",
      expect.objectContaining({ params: { period: "2026-09" } })
    );
  });

  it("treats a download_url as success and reads the filename from its ?file= param", async () => {
    get.mockResolvedValue({ data: { success: true, download_url: "http://host:5001/daily-prj/download?file=stock_2026-09.xlsx", message: "Excel downloaded" } });
    await expect(generateReport("stockReportConsolidated", SEPT_2026)).resolves.toEqual({
      kind: "success",
      downloadUrl: "http://host:5001/daily-prj/download?file=stock_2026-09.xlsx",
      filename: "stock_2026-09.xlsx",
    });
  });

  it("also reads the new envelope's downloadUrlPath, at the top level or inside data", async () => {
    get.mockResolvedValueOnce({ data: { success: true, downloadUrlPath: "https://host/dl?file=top.xlsx" } });
    await expect(generateReport("stockReportConsolidated", SEPT_2026)).resolves.toMatchObject({ kind: "success", filename: "top.xlsx" });

    get.mockResolvedValueOnce({ data: { success: true, data: { downloadUrlPath: "https://host/dl?file=inner.xlsx" } } });
    await expect(generateReport("stockReportConsolidated", SEPT_2026)).resolves.toMatchObject({ kind: "success", filename: "inner.xlsx" });
  });

  it("falls back to the URL's last path segment for the filename", async () => {
    get.mockResolvedValue({ data: { download_url: "https://host/files/cash%20entry.xlsx" } });
    const result = await generateReport("cashEntry", SEPT_2026);
    expect(result).toMatchObject({ kind: "success", filename: "cash entry.xlsx" });
  });

  it("reports 'no data' with the backend's own message when there's no download_url", async () => {
    get.mockResolvedValue({ data: { success: false, message: "No records for 2026-09" } });
    await expect(generateReport("cashEntry", SEPT_2026)).resolves.toEqual({ kind: "nodata", message: "No records for 2026-09" });
  });

  it("uses a default 'no data' message when the backend sends none", async () => {
    get.mockResolvedValue({ data: {} });
    await expect(generateReport("cashEntry", SEPT_2026)).resolves.toEqual({
      kind: "nodata",
      message: "No data available for the selected period.",
    });
  });

  it("surfaces the backend's `error` field on an HTTP failure, preferring it over `message`", async () => {
    get.mockRejectedValue(axiosErrorWith("ERR_BAD_RESPONSE", { error: "Period not closed yet", message: "generic" }));
    await expect(generateReport("cashEntry", SEPT_2026)).resolves.toEqual({ kind: "error", message: "Period not closed yet" });
  });

  it("gives a clear message on timeout instead of axios's raw one", async () => {
    get.mockRejectedValue(axiosErrorWith("ECONNABORTED"));
    await expect(generateReport("cashEntry", SEPT_2026)).resolves.toEqual({
      kind: "error",
      message: "The report took too long to generate. Please try again.",
    });
  });

  it("never rejects, even on a non-axios error", async () => {
    get.mockRejectedValue(new Error("socket hang up"));
    await expect(generateReport("cashEntry", SEPT_2026)).resolves.toEqual({ kind: "error", message: "Failed to generate the report. Please try again." });
  });
});
