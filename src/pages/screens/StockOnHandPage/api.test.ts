import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("../../../api/apiHelpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../api/apiHelpers")>();
  return { ...actual, withRetry: <T,>(fn: () => Promise<T>) => fn(), currentUserContext: () => ({ userId: "7", userType: 2 }) };
});

import axiosClient from "../../../api/axiosClient";
import { aggregateLocationRows, downloadStockOnHandReport, fetchStockOnHandDetail, fetchStockOnHandSummary, mapDetailRow, stockOnHandReportFilename } from "./api";

const get = vi.mocked(axiosClient.get);
const post = vi.mocked(axiosClient.post);
const SEPT_2026 = new Date(2026, 8, 15);
const SUMMARY = "/analysis-service/locationSummaryController";

describe("StockOnHandPage api (analysis-service)", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it("mapDetailRow reads the quantities as numbers and defaults the text", () => {
    const row = mapDetailRow({ itemId: "I1", currentTotalQty: 3, closingConvertedQty: 4, stockAmount: 9.5 });
    expect(row).toMatchObject({ itemId: "I1", itemName: "I1", categoryName: "Unknown", curTotalQty: 3, closingConQty: 4, stockAmount: 9.5, rate: 0 });
  });

  it("aggregateLocationRows adds the columns up and counts the items", () => {
    const agg = aggregateLocationRows({ id: "L1", name: "One" }, [
      { currentTotalQty: 1, stockAmount: 10, closingQty: 2 },
      { currentTotalQty: 2, stockAmount: 5 },
    ]);
    expect(agg).toMatchObject({ locationId: "L1", locationName: "One", totalItems: 2, curTotalQty: 3, stockAmount: 15, closingQty: 2 });
  });

  describe("sohAnalysisLst", () => {
    it("detail: POSTs the location, DD-MM-YYYY period, userType and a numeric userId; reads sohList and summary.stockGrtDays", async () => {
      post.mockResolvedValue({ data: { success: true, data: { summary: { stockGrtDays: 30 }, sohList: [{ itemId: "I1", itemName: "Rice", currentTotalQty: 2 }] } } });
      const result = await fetchStockOnHandDetail("OMA1", SEPT_2026);
      expect(post).toHaveBeenCalledWith(`${SUMMARY}/sohAnalysisLst`, { locationId: "OMA1", periodStr: "15-09-2026", userType: 2, userId: 7 }, { headers: { "Content-Type": "application/json" } });
      expect(result.stockGrtDaysThreshold).toBe(30);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].itemName).toBe("Rice");
    });

    it("detail: a missing threshold is null and missing data is no rows; success:false throws the message", async () => {
      post.mockResolvedValueOnce({ data: { success: true, data: { sohList: [] } } });
      await expect(fetchStockOnHandDetail("OMA1", SEPT_2026)).resolves.toEqual({ rows: [], stockGrtDaysThreshold: null });
      post.mockResolvedValueOnce({ data: { success: false, message: "No stock" } });
      await expect(fetchStockOnHandDetail("OMA1", SEPT_2026)).rejects.toThrow("No stock");
    });

    it("summary: one call per location, sorted by id, a failed location shows zeros", async () => {
      post.mockImplementation(async (_url, body) => {
        const id = (body as { locationId: string }).locationId;
        if (id === "B2") throw new Error("boom");
        return { data: { success: true, data: { sohList: [{ currentTotalQty: 2, stockAmount: 5 }] } } };
      });
      const rows = await fetchStockOnHandSummary(SEPT_2026, [
        { id: "C3", name: "Three" },
        { id: "B2", name: "Two" },
        { id: "A1", name: "One" },
      ]);
      expect(post).toHaveBeenCalledTimes(3);
      expect(rows.map((r) => r.locationId)).toEqual(["A1", "B2", "C3"]);
      expect(rows[0]).toMatchObject({ totalItems: 1, stockAmount: 5 });
      expect(rows[1]).toMatchObject({ totalItems: 0, stockAmount: 0 });
    });

    it("summary: throws the first error when every location fails", async () => {
      post.mockRejectedValue(new Error("down"));
      await expect(fetchStockOnHandSummary(SEPT_2026, [{ id: "A1", name: "One" }])).rejects.toThrow("down");
    });
  });

  describe("getSohAnalysis", () => {
    const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    let click: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      Object.assign(URL, { createObjectURL: vi.fn(() => "blob:fake"), revokeObjectURL: vi.fn() });
      click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    });
    afterEach(() => click.mockRestore());

    function reply(body: BlobPart, type: string) {
      return { data: new Blob([body], { type }), headers: { "content-type": type } };
    }

    it("GETs with a YYYY-MM-DD period, userType and userFk (locationId only when given), as a blob", async () => {
      get.mockResolvedValue(reply("PK", XLSX));
      await downloadStockOnHandReport(SEPT_2026);
      expect(get).toHaveBeenCalledWith("/analysis-service/pythonReportController/getSohAnalysis", { params: { period: "2026-09-15", userType: 2, userFk: "7" }, responseType: "blob" });
      await downloadStockOnHandReport(SEPT_2026, "OMA1");
      expect(get).toHaveBeenLastCalledWith("/analysis-service/pythonReportController/getSohAnalysis", { params: { period: "2026-09-15", userType: 2, userFk: "7", locationId: "OMA1" }, responseType: "blob" });
    });

    it("saves the workbook under stock_on_hand_…, shows a JSON refusal's message, opens a JSON file link", async () => {
      get.mockResolvedValueOnce(reply("PK", XLSX));
      await downloadStockOnHandReport(SEPT_2026, "OMA1");
      expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe("stock_on_hand_2026_09_15_OMA1.xlsx");
      expect(stockOnHandReportFilename(SEPT_2026)).toBe("stock_on_hand_2026_09_15.xlsx");

      click.mockClear();
      get.mockResolvedValueOnce(reply(JSON.stringify({ success: false, message: "Nothing to export" }), "application/json"));
      await expect(downloadStockOnHandReport(SEPT_2026)).rejects.toThrow("Nothing to export");
      expect(click).not.toHaveBeenCalled();

      get.mockResolvedValueOnce(reply(JSON.stringify({ success: true, download_url: "https://host/dl?file=s.xlsx" }), "application/json"));
      await downloadStockOnHandReport(SEPT_2026);
      expect((click.mock.contexts[0] as HTMLAnchorElement).href).toBe("https://host/dl?file=s.xlsx");
    });
  });
});
