import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("../../../api/apiHelpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../api/apiHelpers")>();
  return { ...actual, currentUserContext: () => ({ userId: "7", userType: 2 }) };
});

import axiosClient from "../../../api/axiosClient";
import {
  fetchAllLocationOptions,
  fetchCategoryOptions,
  fetchItemAnalysis,
  fetchLocationOptionsByCategory,
  fetchLocationTypeCategories,
  fetchSrcTypeOptions,
  mapCategoryAmount,
} from "./api";
import { ALL_CATEGORY, DEFAULT_ITEM_ANALYSIS_FILTER } from "./data";

const get = vi.mocked(axiosClient.get);
const post = vi.mocked(axiosClient.post);
const SEPT_2026 = new Date(2026, 8, 15);
const SERVICE = "/item-analysis-summary-service";
const IIA = `${SERVICE}/itemIngredientAnalysisController`;
const QUERY = { reportingMonth: SEPT_2026, locationId: "OMA1", filter: DEFAULT_ITEM_ANALYSIS_FILTER };

describe("ItemAnalysisPage api (item-analysis-summary-service)", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  describe("fetchAllLocationOptions", () => {
    it("always uses type 0 and carries startDay through as a number", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ id: "OMA1", name: "Site One", startDay: "20" }] } });
      await expect(fetchAllLocationOptions(SEPT_2026)).resolves.toEqual([{ id: "OMA1", name: "Site One", startDay: 20 }]);
      expect(get).toHaveBeenCalledWith(`${IIA}/overallDropDown/0/15-09-2026/2/7`);
    });

    it("falls back to locationId / locationName and drops an unusable startDay", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ locationId: "OMA2", locationName: "Site Two", startDay: "n/a" }] } });
      await expect(fetchAllLocationOptions(SEPT_2026)).resolves.toEqual([{ id: "OMA2", name: "Site Two", startDay: undefined }]);
    });

    it("throws the backend's message on success:false", async () => {
      get.mockResolvedValue({ data: { success: false, message: "No locations" } });
      await expect(fetchAllLocationOptions(SEPT_2026)).rejects.toThrow("No locations");
    });
  });

  describe("fetchLocationTypeCategories", () => {
    it("maps each location type to its type index and keeps only the name", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ name: "Banking", id: "x", pk: 5 }] } });
      await expect(fetchLocationTypeCategories("segments", SEPT_2026)).resolves.toEqual([{ name: "Banking" }]);
      expect(get).toHaveBeenCalledWith(`${IIA}/overallDropDown/2/15-09-2026/2/7`);
    });
  });

  describe("fetchLocationOptionsByCategory", () => {
    it("URL-encodes the category and reads the envelope", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ id: "OMA2", name: "Site Two" }] } });
      await expect(fetchLocationOptionsByCategory("contracts", "North & South", SEPT_2026)).resolves.toEqual([{ id: "OMA2", name: "Site Two", startDay: undefined }]);
      expect(get).toHaveBeenCalledWith(`${IIA}/dropDownByNameBased/1/North%20%26%20South/15-09-2026/2/7`);
    });
  });

  describe("fetchCategoryOptions (reuses Item Breakup's itemBreakupController/categoryDropDown)", () => {
    it("calls that controller on the new service and drops the 'All Category' entry", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ name: "All Category" }, { name: "Vegetables" }, { name: "" }, { name: "Dairy" }] } });
      await expect(fetchCategoryOptions()).resolves.toEqual(["Vegetables", "Dairy"]);
      expect(get).toHaveBeenCalledWith(`${SERVICE}/itemBreakupController/categoryDropDown`);
    });
  });

  describe("fetchSrcTypeOptions (reuses Category Analysis's categoryAnalysisController/srcTypeDropDown)", () => {
    it("calls that controller on the new service with the period, location, userType and userId", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ name: "Kitchen" }] } });
      await expect(fetchSrcTypeOptions(SEPT_2026, "OMA1")).resolves.toEqual(["Kitchen"]);
      expect(get).toHaveBeenCalledWith(`${SERVICE}/categoryAnalysisController/srcTypeDropDown/15-09-2026/OMA1/2/7`);
    });
  });

  describe("fetchItemAnalysis", () => {
    it("sends only the base fields when the filter is all-default", async () => {
      post.mockResolvedValue({ data: { success: true, data: {} } });
      await fetchItemAnalysis(QUERY);
      expect(post).toHaveBeenCalledWith(`${IIA}/listOfItemIngredientAnalysis`, { month: 9, year: 2026, locationId: "OMA1", periodStr: "15-09-2026" });
    });

    it("adds srcDate/categoryId/srcType only when set, and omits categoryId for the ALL sentinel", async () => {
      post.mockResolvedValue({ data: { success: true, data: {} } });
      await fetchItemAnalysis({ ...QUERY, filter: { srcType: "Kitchen", category: "Vegetables", date: new Date(2026, 8, 20) } });
      expect(post).toHaveBeenCalledWith(`${IIA}/listOfItemIngredientAnalysis`, expect.objectContaining({ srcDate: "20-09-2026", categoryId: "Vegetables", srcType: "Kitchen" }));

      post.mockClear();
      await fetchItemAnalysis({ ...QUERY, filter: { srcType: null, category: ALL_CATEGORY, date: null } });
      const [, body] = post.mock.calls[0];
      expect(body).not.toHaveProperty("categoryId");
      expect(body).not.toHaveProperty("srcDate");
      expect(body).not.toHaveProperty("srcType");
    });

    it("adds fromDate/toDate when a billing window is given", async () => {
      post.mockResolvedValue({ data: { success: true, data: {} } });
      await fetchItemAnalysis({ ...QUERY, billingWindow: { from: new Date(2026, 7, 20), to: new Date(2026, 8, 19) } });
      expect(post).toHaveBeenCalledWith(`${IIA}/listOfItemIngredientAnalysis`, expect.objectContaining({ fromDate: "20-08-2026", toDate: "19-09-2026" }));
    });

    it("reads itemList and categoryList from the envelope, defaulting missing numeric fields to 0", async () => {
      post.mockResolvedValue({
        data: {
          success: true,
          data: {
            summary: { pob: 12 },
            itemList: [{ categoryId: "CAT1", itemId: "ITM1", itemName: "Rice", packageId: "PKG1", qty: 10, amount: 50 }],
            categoryList: [{ categoryId: "CAT1", amount: 50 }],
          },
        },
      });
      const result = await fetchItemAnalysis(QUERY);
      expect(result.items).toEqual([{ categoryId: "CAT1", itemId: "ITM1", itemName: "Rice", packageId: "PKG1", qty: 10, qtyCon: 0, uomCon: "", amount: 50 }]);
      expect(result.categories).toEqual([{ categoryId: "CAT1", amount: 50 }]);
    });

    it("falls back to itemId for itemName, and to categoryName when a category row has no categoryId", async () => {
      post.mockResolvedValue({ data: { success: true, data: { itemList: [{ itemId: "ITM9" }], categoryList: [{ categoryName: "Dairy", amount: 5 }] } } });
      const result = await fetchItemAnalysis(QUERY);
      expect(result.items[0].itemName).toBe("ITM9");
      expect(result.categories).toEqual([{ categoryId: "Dairy", amount: 5 }]);
      expect(mapCategoryAmount({ categoryId: "C1", categoryName: "Name", amount: "7" })).toEqual({ categoryId: "C1", amount: 7 });
    });

    it("defaults to empty lists when the envelope has no data, and throws the backend's message on success:false", async () => {
      post.mockResolvedValueOnce({ data: { success: true } });
      await expect(fetchItemAnalysis(QUERY)).resolves.toEqual({ items: [], categories: [] });

      post.mockResolvedValueOnce({ data: { success: false, message: "Bad location" } });
      await expect(fetchItemAnalysis(QUERY)).rejects.toThrow("Bad location");
    });
  });
});
