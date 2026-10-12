import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("../../../api/apiHelpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../api/apiHelpers")>();
  // No retry delay, and fixed user fields.
  return { ...actual, withRetry: <T,>(fn: () => Promise<T>) => fn(), currentUserContext: () => ({ userId: "7", userType: 2 }) };
});

import axiosClient from "../../../api/axiosClient";
import {
  consumptionReportFilename,
  downloadConsumptionReport,
  fetchAllLocationOptions,
  fetchCategoryOptions,
  fetchConsumptionByLocation,
  fetchConsumptionSummary,
  fetchLocationOptionsByCategory,
  fetchLocationTypeCategories,
  fetchSrcTypeOptions,
  mapDetailRow,
  mapDynamicSrcRow,
} from "./api";

const get = vi.mocked(axiosClient.get);
const post = vi.mocked(axiosClient.post);
const SEPT_2026 = new Date(2026, 8, 15);
const SERVICE = "/analysis-service";

describe("ConsumptionAnalysisPage api (analysis-service)", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  describe("dropdowns", () => {
    it("categoryDropDown: itemIngredientAnalysisController, dropping blanks and the 'All Category' entry", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ name: "All Category" }, { name: "Vegetables" }, { name: "" }, { name: "Dairy" }] } });
      await expect(fetchCategoryOptions()).resolves.toEqual(["Vegetables", "Dairy"]);
      expect(get).toHaveBeenCalledWith(`${SERVICE}/itemIngredientAnalysisController/categoryDropDown`);
    });

    it("srcTypeDropDown: only the period and the location in the path (no userType / userId)", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ name: "Kitchen" }, { name: "" }] } });
      await expect(fetchSrcTypeOptions(SEPT_2026, "OMA1")).resolves.toEqual(["Kitchen"]);
      expect(get).toHaveBeenCalledWith(`${SERVICE}/itemIngredientAnalysisController/srcTypeDropDown/15-09-2026/OMA1`);
    });

    it("overallDropDown: locationDetailsController, type 0 for every location and the type index for a category list", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ id: "OMA1", name: "Site One" }, { locationId: "OMA2", locationName: "Site Two" }] } });
      await expect(fetchAllLocationOptions(SEPT_2026)).resolves.toEqual([{ id: "OMA1", name: "Site One" }, { id: "OMA2", name: "Site Two" }]);
      expect(get).toHaveBeenCalledWith(`${SERVICE}/locationDetailsController/overallDropDown/0/15-09-2026/2/7`);

      get.mockResolvedValue({ data: { success: true, data: [{ name: "Banking", id: "x" }] } });
      await expect(fetchLocationTypeCategories("segments", SEPT_2026)).resolves.toEqual([{ name: "Banking" }]);
      expect(get).toHaveBeenLastCalledWith(`${SERVICE}/locationDetailsController/overallDropDown/2/15-09-2026/2/7`);
    });

    it("dropDownByNameBased: locationDetailsController, URL-encoding the category", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ id: "OMA2", name: "Site Two" }] } });
      await expect(fetchLocationOptionsByCategory("om", "North & South", SEPT_2026)).resolves.toEqual([{ id: "OMA2", name: "Site Two" }]);
      expect(get).toHaveBeenCalledWith(`${SERVICE}/locationDetailsController/dropDownByNameBased/3/North%20%26%20South/15-09-2026/2/7`);
    });

    it("throws the backend's message on success:false, and treats missing data as empty", async () => {
      get.mockResolvedValueOnce({ data: { success: false, message: "No locations" } });
      await expect(fetchAllLocationOptions(SEPT_2026)).rejects.toThrow("No locations");
      get.mockResolvedValueOnce({ data: { success: true } });
      await expect(fetchCategoryOptions()).resolves.toEqual([]);
    });
  });

  describe("fetchConsumptionSummary", () => {
    it("GETs consumptionOverallSummary/{period}/{userType}/{userId} and maps itemCount / convertedQty", async () => {
      get.mockResolvedValue({
        data: { success: true, data: [{ locationId: "L1", locationName: "Site", itemCount: 12, totalQty: 100, convertedQty: 80, totalAmount: 500.5, userType: 2, previousCost1: 9 }, {}] },
      });
      const rows = await fetchConsumptionSummary(SEPT_2026);
      expect(get).toHaveBeenCalledWith(`${SERVICE}/locationSummaryController/consumptionOverallSummary/15-09-2026/2/7`);
      expect(rows[0]).toEqual({ locationId: "L1", locationName: "Site", totalItems: 12, totalQty: 100, conQty: 80, totalAmount: 500.5 });
      expect(rows[1]).toEqual({ locationId: "Unknown", locationName: "", totalItems: 0, totalQty: 0, conQty: 0, totalAmount: 0 });
    });

    it("throws the backend's message on success:false", async () => {
      get.mockResolvedValue({ data: { success: false, message: "No data" } });
      await expect(fetchConsumptionSummary(SEPT_2026)).rejects.toThrow("No data");
    });
  });

  describe("fetchConsumptionByLocation", () => {
    const PAYLOAD = { locationId: "L1", periodStr: "15-09-2026" };

    it("POSTs consumptionByLocationByDate with the payload unchanged", async () => {
      post.mockResolvedValue({ data: { success: true, data: {} } });
      await fetchConsumptionByLocation({ ...PAYLOAD, category: "Dairy", srcType: "Kitchen" });
      expect(post).toHaveBeenCalledWith(`${SERVICE}/locationSummaryController/consumptionByLocationByDate`, { ...PAYLOAD, category: "Dairy", srcType: "Kitchen" });
    });

    it("maps summaryList to item rows (unit from itemUom, convertedQty to conQty, unit price worked out)", async () => {
      post.mockResolvedValue({
        data: {
          success: true,
          data: {
            summaryList: [{ itemId: "I1", itemName: "Rice", categoryName: "Dry", srcType: "Kitchen", itemUom: "KG", pkgCon: 25, totalQty: 4, convertedQty: 100, totalAmount: 20 }],
            srcTypeMasterList: [{ a: "b" }],
          },
        },
      });
      const { details } = await fetchConsumptionByLocation(PAYLOAD);
      expect(details).toEqual([{ itemId: "I1", itemName: "Rice", categoryName: "Dry", srcType: "Kitchen", unit: "KG", pkgCon: 25, totalQty: 4, conQty: 100, totalAmount: 20, unitPrice: 5 }]);
    });

    it("gives a zero unit price when there is no quantity, and falls back through itemName / categoryName / unit", () => {
      expect(mapDetailRow({ itemId: "I2", totalAmount: 9, pkgConUom: "BOX" })).toEqual({
        itemId: "I2",
        itemName: "I2",
        categoryName: "Unknown",
        srcType: "",
        unit: "BOX",
        pkgCon: 0,
        totalQty: 0,
        conQty: 0,
        totalAmount: 9,
        unitPrice: 0,
      });
    });

    it("maps srcTypeList and perMandayList to the per-source-type rows, preferring dynamicPerMandayMap for per-manday", async () => {
      post.mockResolvedValue({
        data: {
          success: true,
          data: {
            srcTypeList: [{ itemId: "I1", itemName: "Rice", dynamicSrcTypeMap: { Kitchen_TotalQty: 3 }, dynamicPerMandayMap: { ignored: 1 } }],
            perMandayList: [
              { itemId: "I1", itemName: "Rice", dynamicSrcTypeMap: { old_TotalQtyPerManday: 1 }, dynamicPerMandayMap: { Kitchen_TotalQtyPerManday: 0.5 } },
              { itemId: "I2", itemName: "Oil", dynamicSrcTypeMap: { Kitchen_TotalQtyPerManday: 2 } },
            ],
          },
        },
      });
      const { srcTypeRows, perMandayRows } = await fetchConsumptionByLocation(PAYLOAD);
      expect(srcTypeRows).toEqual([{ itemId: "I1", itemName: "Rice", dynamicSrcTypeMap: { Kitchen_TotalQty: 3 } }]);
      expect(perMandayRows.map((r) => r.dynamicSrcTypeMap)).toEqual([{ Kitchen_TotalQtyPerManday: 0.5 }, { Kitchen_TotalQtyPerManday: 2 }]);
      expect(mapDynamicSrcRow({ itemId: "I3", dynamicSrcTypeMap: null }, true).dynamicSrcTypeMap).toEqual({});
    });

    it("returns empty lists when the envelope has no data, and throws the backend's message on success:false", async () => {
      post.mockResolvedValueOnce({ data: { success: true } });
      await expect(fetchConsumptionByLocation(PAYLOAD)).resolves.toEqual({ details: [], srcTypeRows: [], perMandayRows: [] });

      post.mockResolvedValueOnce({ data: { success: false, message: "Bad location" } });
      await expect(fetchConsumptionByLocation(PAYLOAD)).rejects.toThrow("Bad location");
    });
  });

  describe("downloadConsumptionReport", () => {
    const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    let click: ReturnType<typeof vi.spyOn>;
    let createUrl: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      createUrl = vi.fn(() => "blob:fake");
      Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: vi.fn() });
      click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    });

    afterEach(() => {
      click.mockRestore();
    });

    function reply(body: BlobPart, type: string) {
      return { data: new Blob([body], { type }), headers: { "content-type": type } };
    }

    it("GETs getConsumptionReport with period, userType and userFk (and locationId only when given), asking for a blob", async () => {
      get.mockResolvedValue(reply("PK-binary", XLSX));
      await downloadConsumptionReport(SEPT_2026);
      expect(get).toHaveBeenCalledWith(`${SERVICE}/pythonReportController/getConsumptionReport`, { params: { period: "15-09-2026", userType: 2, userFk: "7" }, responseType: "blob" });

      await downloadConsumptionReport(SEPT_2026, "OMA1");
      expect(get).toHaveBeenLastCalledWith(`${SERVICE}/pythonReportController/getConsumptionReport`, { params: { period: "15-09-2026", userType: 2, userFk: "7", locationId: "OMA1" }, responseType: "blob" });
    });

    it("saves a real workbook under consumption_… (with the location when one is chosen)", async () => {
      get.mockResolvedValue(reply("PK-binary", XLSX));
      await downloadConsumptionReport(SEPT_2026, "OMA1");
      expect(click).toHaveBeenCalledTimes(1);
      expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe("consumption_15_09_2026_OMA1.xlsx");
      expect(consumptionReportFilename(SEPT_2026)).toBe("consumption_15_09_2026.xlsx");
    });

    it("shows the backend's message for a JSON refusal instead of saving a broken file, and opens a JSON file link", async () => {
      get.mockResolvedValueOnce(reply(JSON.stringify({ success: false, message: "No consumption for this period" }), "application/json"));
      await expect(downloadConsumptionReport(SEPT_2026)).rejects.toThrow("No consumption for this period");
      expect(click).not.toHaveBeenCalled();

      get.mockResolvedValueOnce(reply(JSON.stringify({ success: true, download_url: "https://host/dl?file=c.xlsx" }), "application/json"));
      await downloadConsumptionReport(SEPT_2026);
      expect((click.mock.contexts[0] as HTMLAnchorElement).href).toBe("https://host/dl?file=c.xlsx");
    });

    it("turns an HTTP error whose JSON body arrived as a blob into the backend's own message", async () => {
      const config = { headers: new AxiosHeaders() };
      const body = new Blob([JSON.stringify({ message: "Report failed on the server" })], { type: "application/json" });
      get.mockRejectedValue(new AxiosError("Request failed with status code 500", "ERR_BAD_RESPONSE", config, undefined, { data: body, status: 500, statusText: "", headers: {}, config }));
      await expect(downloadConsumptionReport(SEPT_2026)).rejects.toThrow("Report failed on the server");
    });
  });
});
