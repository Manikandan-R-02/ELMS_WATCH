import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("../../../api/apiHelpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../api/apiHelpers")>();
  return { ...actual, currentUserContext: () => ({ userId: "7", userType: 2 }) };
});

import axiosClient from "../../../api/axiosClient";
import { fetchAllLocationOptions, fetchCategoryOptions, fetchItemBreakup, fetchLocationOptionsByCategory, fetchLocationTypeCategories } from "./api";

const get = vi.mocked(axiosClient.get);
const post = vi.mocked(axiosClient.post);
const SEPT_2026 = new Date(2026, 8, 15);
const BASE = "/item-analysis-summary-service/itemBreakupController";
const QUERY = { reportingMonth: SEPT_2026, locationId: "OMA1", categoryId: "Vegetables" };

describe("ItemBreakupPage api (item-analysis-summary-service)", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  describe("fetchAllLocationOptions", () => {
    it("always uses type 0 and maps id/name from the envelope", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ id: "OMA1", name: "Site One" }] } });
      await expect(fetchAllLocationOptions(SEPT_2026)).resolves.toEqual([{ id: "OMA1", name: "Site One" }]);
      expect(get).toHaveBeenCalledWith(`${BASE}/overallDropDown/0/15-09-2026/2/7`);
    });

    it("falls back to locationId/locationName", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ locationId: "OMA2", locationName: "Site Two" }] } });
      await expect(fetchAllLocationOptions(SEPT_2026)).resolves.toEqual([{ id: "OMA2", name: "Site Two" }]);
    });

    it("throws the backend's message on success:false", async () => {
      get.mockResolvedValue({ data: { success: false, message: "No locations" } });
      await expect(fetchAllLocationOptions(SEPT_2026)).rejects.toThrow("No locations");
    });
  });

  describe("fetchLocationTypeCategories", () => {
    it("maps location type to the type index and keeps only the name", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ name: "Banking", id: "x", pk: 5 }] } });
      await expect(fetchLocationTypeCategories("contracts", SEPT_2026)).resolves.toEqual([{ name: "Banking" }]);
      expect(get).toHaveBeenCalledWith(`${BASE}/overallDropDown/1/15-09-2026/2/7`);

      await fetchLocationTypeCategories("segments", SEPT_2026);
      expect(get).toHaveBeenCalledWith(`${BASE}/overallDropDown/2/15-09-2026/2/7`);

      await fetchLocationTypeCategories("om", SEPT_2026);
      expect(get).toHaveBeenCalledWith(`${BASE}/overallDropDown/3/15-09-2026/2/7`);
    });
  });

  describe("fetchLocationOptionsByCategory", () => {
    it("URL-encodes the category and maps id/name", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ id: "OMA2", name: "Site Two" }] } });
      await expect(fetchLocationOptionsByCategory("segments", "North & South", SEPT_2026)).resolves.toEqual([{ id: "OMA2", name: "Site Two" }]);
      expect(get).toHaveBeenCalledWith(`${BASE}/dropDownByNameBased/2/North%20%26%20South/15-09-2026/2/7`);
    });
  });

  describe("fetchCategoryOptions", () => {
    it("maps data to a list of names, dropping blanks", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ name: "Vegetables" }, { name: "" }, { name: "Dairy" }] } });
      await expect(fetchCategoryOptions()).resolves.toEqual(["Vegetables", "Dairy"]);
      expect(get).toHaveBeenCalledWith(`${BASE}/categoryDropDown`);
    });

    it("treats a missing data array as empty", async () => {
      get.mockResolvedValue({ data: { success: true } });
      await expect(fetchCategoryOptions()).resolves.toEqual([]);
    });
  });

  describe("fetchItemBreakup", () => {
    it("sends dateString/month/year/locationId/categoryId and no longer sends type", async () => {
      post.mockResolvedValue({ data: { success: true, data: [] } });
      await fetchItemBreakup(QUERY);
      expect(post).toHaveBeenCalledWith(`${BASE}/listOfItemBreakup`, {
        dateString: "15-09-2026",
        month: 9,
        year: 2026,
        locationId: "OMA1",
        categoryId: "Vegetables",
      });
    });

    it("normalizes currentQty/currentCost and previousQty{n}/previousCost{n} into figuresByOffset", async () => {
      post.mockResolvedValue({
        data: {
          success: true,
          data: [{ categoryId: "CAT1", itemId: "ITM1", itemName: "Rice", packageId: "PKG1", pkgCon: 25, pkgConUom: "KG", currentQty: 10, currentCost: 100, previousQty1: 8, previousCost1: 80 }],
        },
      });
      const [row] = await fetchItemBreakup(QUERY);
      expect(row.figuresByOffset[0]).toEqual({ qty: 10, cost: 100 });
      expect(row.figuresByOffset[1]).toEqual({ qty: 8, cost: 80 });
      expect(row.figuresByOffset[2]).toEqual({ qty: 0, cost: 0 });
      expect(row.figuresByOffset[11]).toEqual({ qty: 0, cost: 0 });
    });

    it("reads the new backend's previousQt6 spelling for 6 months ago, preferring previousQty6 if sent", async () => {
      post.mockResolvedValue({ data: { success: true, data: [{ itemId: "A", previousQt6: 6, previousCost6: 60 }, { itemId: "B", previousQty6: 7, previousQt6: 99 }] } });
      const [a, b] = await fetchItemBreakup(QUERY);
      expect(a.figuresByOffset[6]).toEqual({ qty: 6, cost: 60 });
      expect(b.figuresByOffset[6].qty).toBe(7);
    });

    it("falls back to itemId for itemName when the backend sends none", async () => {
      post.mockResolvedValue({ data: { success: true, data: [{ itemId: "ITM9" }] } });
      const [row] = await fetchItemBreakup(QUERY);
      expect(row.itemName).toBe("ITM9");
    });

    it("defaults to an empty array when data is missing, and throws on success:false", async () => {
      post.mockResolvedValueOnce({ data: { success: true } });
      await expect(fetchItemBreakup(QUERY)).resolves.toEqual([]);

      post.mockResolvedValueOnce({ data: { success: false, message: "Bad category" } });
      await expect(fetchItemBreakup(QUERY)).rejects.toThrow("Bad category");
    });
  });
});
