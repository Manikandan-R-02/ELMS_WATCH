import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn() } }));
// No retry delay, and fixed user fields.
vi.mock("../../../api/apiHelpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../api/apiHelpers")>();
  return { ...actual, withRetry: <T,>(fn: () => Promise<T>) => fn(), currentUserContext: () => ({ userId: "7", userType: 2 }) };
});

import axiosClient from "../../../api/axiosClient";
import { fetchDailyPrjLocation, fetchDailyPrjSummary, flattenSummaryColumns, mapSummaryRows, periodForMonth } from "./api";

const get = vi.mocked(axiosClient.get);
const SEPT_2026 = new Date(2026, 8, 15);
const PATH = "/analysis-service/pythonReportController/dailyPRJ";

const SUMMARY = {
  summary_sheet: { title: "Location wise PRJ Summary", columns: { Cost: { total: "Total" } }, data: [{ location_code: "L1", location_name: "Site", total: 5 }] },
  download_url: "https://host/dl?file=prj.xlsx",
};

describe("DailyPrjPage api (analysis-service)", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("formats the period as YYYY-MM-01", () => {
    expect(periodForMonth(SEPT_2026)).toBe("2026-09-01");
  });

  it("summary: calls analysis-service dailyPRJ with period, userType and userFk and no locationId", async () => {
    get.mockResolvedValue({ data: SUMMARY });
    const result = await fetchDailyPrjSummary(SEPT_2026);
    expect(get).toHaveBeenCalledWith(PATH, expect.objectContaining({ params: { period: "2026-09-01", userType: 2, userFk: "7" } }));
    expect(result.summary_sheet?.data).toHaveLength(1);
    expect(result.download_url).toBe("https://host/dl?file=prj.xlsx");
  });

  it("summary: reads the same payload inside the new envelope, and downloadUrlPath for the link", async () => {
    const { download_url: _drop, ...rest } = SUMMARY;
    get.mockResolvedValue({ data: { success: true, message: "ok", data: { ...rest, downloadUrlPath: "https://host/dl?file=env.xlsx" } } });
    const result = await fetchDailyPrjSummary(SEPT_2026);
    expect(result.download_url).toBe("https://host/dl?file=env.xlsx");
    expect(result.summary_sheet?.title).toBe("Location wise PRJ Summary");
  });

  it("detail: same endpoint with locationId added, returned as sent", async () => {
    const body = { location_id: "L1", rows: [{ sno: 1, date: "01-09-2026" }], prj_types: ["SS"] };
    get.mockResolvedValue({ data: body });
    const result = await fetchDailyPrjLocation(SEPT_2026, "L1");
    expect(get).toHaveBeenCalledWith(PATH, expect.objectContaining({ params: { period: "2026-09-01", locationId: "L1", userType: 2, userFk: "7" } }));
    expect(result).toEqual(body);
  });

  it("detail: reads the envelope's data and throws the backend's message on success:false", async () => {
    get.mockResolvedValueOnce({ data: { success: true, data: { location_id: "L1", rows: [] } } });
    await expect(fetchDailyPrjLocation(SEPT_2026, "L1")).resolves.toEqual({ location_id: "L1", rows: [] });

    get.mockResolvedValueOnce({ data: { success: false, message: "No such location" } });
    await expect(fetchDailyPrjLocation(SEPT_2026, "L1")).rejects.toThrow("No such location");
  });

  describe("summary columns", () => {
    it("reads each group as a plain list of keys (the new backend) and skips the pinned location columns", () => {
      const defs = flattenSummaryColumns({
        location: ["location_code", "location_name"],
        prj: ["prj", "target", "Per(%)_vs_last_m"],
        mandays: ["mandays"],
      });
      expect(defs).toEqual([
        { key: "prj", group: "prj", label: "prj" },
        { key: "target", group: "prj", label: "target" },
        { key: "Per(%)_vs_last_m", group: "prj", label: "Per(%)_vs_last_m" },
        { key: "mandays", group: "mandays", label: "mandays" },
      ]);
    });

    it("still reads the old { key: label } groups", () => {
      expect(flattenSummaryColumns({ Cost: { total: "Total" } })).toEqual([{ key: "total", group: "Cost", label: "Total" }]);
    });

    it("keeps null and text values for the table to show", () => {
      const rows = mapSummaryRows([{ location_code: "OMA1", location_name: "Site", prj: 1.6, "Per(%)_vs_last_m": "0.16 %", productivity: undefined }]);
      expect(rows[0]).toMatchObject({ id: "OMA1", name: "Site", values: { prj: 1.6, "Per(%)_vs_last_m": "0.16 %" } });
    });
  });
});
