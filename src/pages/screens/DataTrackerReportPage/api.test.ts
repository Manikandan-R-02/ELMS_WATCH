import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn() } }));
// No retry delay: a failing call should surface immediately in these tests.
vi.mock("../../../api/apiHelpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../api/apiHelpers")>();
  return { ...actual, withRetry: <T,>(fn: () => Promise<T>) => fn() };
});

import axiosClient from "../../../api/axiosClient";
import { fetchDataTrackerReport, periodForMonth } from "./api";

const get = vi.mocked(axiosClient.get);
const SEPT_2026 = new Date(2026, 8, 15);

const PAYLOAD = {
  status: "success",
  period: "2026-09-01",
  download_url: "https://host/dl?file=tracker.xlsx",
  day_numbers: [1, 2],
  days: ["01-09-2026", "02-09-2026"],
  detail_sheet: {
    data: [{ sno: 1, location_id: "L1", location_name: "Site", consumption: ["Yes", "No"], mandays: ["Yes", "Yes"], staff_onsite: ["No", "No"] }],
  },
};

describe("DataTrackerReportPage api (analysis-service)", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("formats the period as YYYY-MM-01", () => {
    expect(periodForMonth(SEPT_2026)).toBe("2026-09-01");
  });

  it("calls analysis-service's pythonReportController with only the period (no locationId)", async () => {
    get.mockResolvedValue({ data: PAYLOAD });
    await fetchDataTrackerReport(SEPT_2026);
    expect(get).toHaveBeenCalledWith(
      "/analysis-service/pythonReportController/lmsDataTrackerReport",
      expect.objectContaining({ params: { period: "2026-09-01" } })
    );
  });

  it("maps the bare payload into 3 category rows per location plus the days and download link", async () => {
    get.mockResolvedValue({ data: PAYLOAD });
    const result = await fetchDataTrackerReport(SEPT_2026);
    expect(result.downloadUrl).toBe("https://host/dl?file=tracker.xlsx");
    expect(result.dayNumbers).toEqual([1, 2]);
    expect(result.locationCount).toBe(1);
    expect(result.rows).toHaveLength(3);
    expect(result.rows.map((r) => r.values)).toEqual([["Yes", "No"], ["Yes", "Yes"], ["No", "No"]]);
  });

  it("reads the same payload inside the new { success, data } envelope, and downloadUrlPath", async () => {
    const { download_url: _drop, ...rest } = PAYLOAD;
    get.mockResolvedValue({ data: { success: true, message: "ok", data: { ...rest, downloadUrlPath: "https://host/dl?file=env.xlsx" } } });
    const result = await fetchDataTrackerReport(SEPT_2026);
    expect(result.downloadUrl).toBe("https://host/dl?file=env.xlsx");
    expect(result.rows).toHaveLength(3);
  });

  it("throws the backend's message when the envelope says success:false or the status is not success", async () => {
    get.mockResolvedValueOnce({ data: { success: false, message: "No data" } });
    await expect(fetchDataTrackerReport(SEPT_2026)).rejects.toThrow("No data");

    get.mockResolvedValueOnce({ data: { status: "error", message: "Period not closed" } });
    await expect(fetchDataTrackerReport(SEPT_2026)).rejects.toThrow("Period not closed");
  });

  it("returns an empty grid and no download link for an empty object", async () => {
    get.mockResolvedValue({ data: {} });
    const result = await fetchDataTrackerReport(SEPT_2026);
    expect(result).toMatchObject({ rows: [], dayNumbers: [], locationCount: 0, downloadUrl: undefined });
  });
});
