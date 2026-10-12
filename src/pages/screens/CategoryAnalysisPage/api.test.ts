import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("../../../api/apiHelpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../api/apiHelpers")>();
  return { ...actual, currentUserContext: () => ({ userId: "7", userType: 2 }) };
});

import axiosClient from "../../../api/axiosClient";
import {
  fetchAllLocationOptions,
  fetchCategoryAnalysis,
  fetchCategoryItems,
  fetchLocationOptionsByCategory,
  fetchLocationTypeCategories,
  fetchSrcTypeOptions,
} from "./api";
import { DEFAULT_CATEGORY_ANALYSIS_FILTER } from "./data";

const get = vi.mocked(axiosClient.get);
const post = vi.mocked(axiosClient.post);
const SEPT_2026 = new Date(2026, 8, 15);
const SERVICE = "/item-analysis-summary-service";
const CAT = `${SERVICE}/categoryAnalysisController`;

describe("CategoryAnalysisPage api (item-analysis-summary-service)", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  describe("fetchAllLocationOptions", () => {
    it("hits overallDropDown/0 and reads id/name, parsing startDay", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ id: "OMA1", name: "Site One", startDay: "12" }] } });
      await expect(fetchAllLocationOptions(SEPT_2026)).resolves.toEqual([{ id: "OMA1", name: "Site One", startDay: 12 }]);
      expect(get).toHaveBeenCalledWith(`${CAT}/overallDropDown/0/15-09-2026/2/7`);
    });

    it("falls back to locationId/locationName and drops an unusable startDay", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ locationId: "OMA2", locationName: "Site Two", startDay: "n/a" }] } });
      await expect(fetchAllLocationOptions(SEPT_2026)).resolves.toEqual([{ id: "OMA2", name: "Site Two", startDay: undefined }]);
    });

    it("throws the backend's message on success:false", async () => {
      get.mockResolvedValue({ data: { success: false, message: "No locations" } });
      await expect(fetchAllLocationOptions(SEPT_2026)).rejects.toThrow("No locations");
    });
  });

  describe("fetchLocationTypeCategories", () => {
    it("hits overallDropDown with the type's index (segments = 2) and keeps only the name", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ name: "Banking", id: "x", pk: 5 }] } });
      await expect(fetchLocationTypeCategories("segments", SEPT_2026)).resolves.toEqual([{ name: "Banking" }]);
      expect(get).toHaveBeenCalledWith(`${CAT}/overallDropDown/2/15-09-2026/2/7`);
    });
  });

  describe("fetchLocationOptionsByCategory", () => {
    it("URL-encodes the category", async () => {
      get.mockResolvedValue({ data: { success: true, data: [] } });
      await fetchLocationOptionsByCategory("om", "North & South", SEPT_2026);
      expect(get).toHaveBeenCalledWith(`${CAT}/dropDownByNameBased/3/North%20%26%20South/15-09-2026/2/7`);
    });
  });

  describe("fetchSrcTypeOptions", () => {
    it("includes userType/userId and reads names from the envelope", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ name: "Kitchen" }, { name: "" }] } });
      await expect(fetchSrcTypeOptions(SEPT_2026, "OMA1")).resolves.toEqual(["Kitchen"]);
      expect(get).toHaveBeenCalledWith(`${CAT}/srcTypeDropDown/15-09-2026/OMA1/2/7`);
    });

    it("treats a missing data array as empty", async () => {
      get.mockResolvedValue({ data: { success: true } });
      await expect(fetchSrcTypeOptions(SEPT_2026, "OMA1")).resolves.toEqual([]);
    });
  });

  describe("fetchCategoryAnalysis", () => {
    it("sends only the base fields when the filter is all-default", async () => {
      post.mockResolvedValue({ data: { success: true, data: {} } });
      await fetchCategoryAnalysis({ reportingMonth: SEPT_2026, locationId: "OMA1", filter: DEFAULT_CATEGORY_ANALYSIS_FILTER });
      expect(post).toHaveBeenCalledWith(`${CAT}/listOfCategoryAnalysis`, { month: 9, year: 2026, locationId: "OMA1" });
    });

    it("adds srcDateString/srcType/fromDate/toDate only when set", async () => {
      post.mockResolvedValue({ data: { success: true, data: {} } });
      await fetchCategoryAnalysis({
        reportingMonth: SEPT_2026,
        locationId: "OMA1",
        filter: { srcType: "Kitchen", date: new Date(2026, 8, 20) },
        billingWindow: { from: new Date(2026, 7, 20), to: new Date(2026, 8, 19) },
      });
      expect(post).toHaveBeenCalledWith(
        `${CAT}/listOfCategoryAnalysis`,
        expect.objectContaining({ srcDateString: "20-09-2026", srcType: "Kitchen", fromDate: "20-08-2026", toDate: "19-09-2026" })
      );
    });

    it("normalizes categoryList rows and reads pob from summary", async () => {
      post.mockResolvedValue({
        data: {
          success: true,
          data: {
            summary: { pob: 42 },
            categoryList: [{ categoryId: "CAT1", categoryName: "Cat One", groupOfCategory: "Food", qty: 10, qtyCon: 5, amount: 100 }],
          },
        },
      });
      const result = await fetchCategoryAnalysis({ reportingMonth: SEPT_2026, locationId: "OMA1", filter: DEFAULT_CATEGORY_ANALYSIS_FILTER });
      expect(result.categories).toEqual([{ categoryId: "CAT1", groupOfCategory: "Food", qty: 10, qtyCon: 5, amount: 100 }]);
      expect(result.pob).toBe(42);
    });

    it("defaults to an empty list and 0 pob when the envelope has no data", async () => {
      post.mockResolvedValue({ data: { success: true } });
      const result = await fetchCategoryAnalysis({ reportingMonth: SEPT_2026, locationId: "OMA1", filter: DEFAULT_CATEGORY_ANALYSIS_FILTER });
      expect(result.categories).toEqual([]);
      expect(result.pob).toBe(0);
    });

    it("throws the backend's message on success:false", async () => {
      post.mockResolvedValue({ data: { success: false, message: "Bad location" } });
      await expect(
        fetchCategoryAnalysis({ reportingMonth: SEPT_2026, locationId: "OMA1", filter: DEFAULT_CATEGORY_ANALYSIS_FILTER })
      ).rejects.toThrow("Bad location");
    });
  });

  describe("fetchCategoryItems", () => {
    it("posts to itemIngredientAnalysisController on item-analysis-summary-service with fromDate/toDate and periodStr", async () => {
      post.mockResolvedValue({ data: { success: true, data: {} } });
      await fetchCategoryItems({
        reportingMonth: SEPT_2026,
        locationId: "OMA1",
        categoryId: "CAT1",
        filter: DEFAULT_CATEGORY_ANALYSIS_FILTER,
        billingWindow: { from: new Date(2026, 7, 20), to: new Date(2026, 8, 19) },
      });
      expect(post).toHaveBeenCalledWith(`${SERVICE}/itemIngredientAnalysisController/listOfItemIngredientAnalysis`, {
        dateString: "15-09-2026",
        periodStr: "15-09-2026",
        month: 9,
        year: 2026,
        locationId: "OMA1",
        categoryId: "CAT1",
        fromDate: "20-08-2026",
        toDate: "19-09-2026",
      });
    });

    it("reads itemList, falling back to the given categoryId and itemId-as-name", async () => {
      post.mockResolvedValue({ data: { success: true, data: { itemList: [{ itemId: "ITM9", qty: 2, amount: 8, uomCon: "kg" }] } } });
      const [row] = await fetchCategoryItems({ reportingMonth: SEPT_2026, locationId: "OMA1", categoryId: "CAT1", filter: DEFAULT_CATEGORY_ANALYSIS_FILTER });
      expect(row).toMatchObject({ categoryId: "CAT1", itemId: "ITM9", itemName: "ITM9", qty: 2, amount: 8, uomCon: "kg" });
    });

    it("returns an empty list when the envelope has no itemList", async () => {
      post.mockResolvedValue({ data: { success: true, data: {} } });
      await expect(
        fetchCategoryItems({ reportingMonth: SEPT_2026, locationId: "OMA1", categoryId: "CAT1", filter: DEFAULT_CATEGORY_ANALYSIS_FILTER })
      ).resolves.toEqual([]);
    });
  });
});
