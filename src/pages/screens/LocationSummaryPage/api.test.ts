import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

import axiosClient from "../../../api/axiosClient";
import { useAuthStore } from "../../../store/authStore";
import {
  baseSummaryPayload,
  fetchInventoryByLocation,
  fetchLocationSummary,
  fetchLocationsByCategory,
  fetchLocationTypeOptions,
  mapDropdownRow,
  monthFieldValue,
  withLocationFilter,
} from "./api";

const get = vi.mocked(axiosClient.get);
const post = vi.mocked(axiosClient.post);
const SERVICE = "/overallSummary-service/locationSummaryController";
const DATE = new Date(2026, 8, 1); // 01-09-2026

describe("LocationSummaryPage api (new backend envelope)", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    useAuthStore.setState({
      isLoggedIn: true,
      user: { id: "24", name: "A", email: "a@b.c", role: "Admin", initials: "A", userId: "24", userType: 1 },
    });
  });

  describe("listOfLocationSummary", () => {
    it("posts to the same path as before, with a numeric userId", async () => {
      post.mockResolvedValue({ data: { success: true, data: {} } });
      await fetchLocationSummary(baseSummaryPayload(DATE, "Data"));

      expect(post).toHaveBeenCalledTimes(1);
      const [url, body] = post.mock.calls[0];
      expect(url).toBe(`${SERVICE}/listOfLocationSummary`);
      expect(body).toMatchObject({ date: "01-09-2026", month: 9, year: 2026, filter: "Data", type: 0, userId: 24, userType: 1 });
    });

    it("maps data.summary / locationSummaryList / monthComparisonGraphList / dailyPrjList to the shape the screen reads", async () => {
      const summary = { totalLocations: 3, totalCost: 100 };
      const locationSummaryList = [{ locationId: "L1", locationName: "One" }];
      const monthComparisonGraphList = [{ locationId: "L1", locationName: "One", totalMandaysCurrent: 5 }];
      const dailyPrjList = [{ locationId: "L1", locationName: "One", pob1: 4 }];
      post.mockResolvedValue({ data: { success: true, message: "ok", data: { summary, locationSummaryList, monthComparisonGraphList, dailyPrjList } } });

      const result = await fetchLocationSummary(baseSummaryPayload(DATE, "Data"));

      expect(result.responseContent).toBe(summary);
      expect(result.responseContents).toBe(locationSummaryList);
      expect(result.responseContents2).toBe(monthComparisonGraphList);
      expect(result.responseContents3).toBe(dailyPrjList);
    });

    it("throws the backend's message when success is false, even on HTTP 200", async () => {
      post.mockResolvedValue({ data: { success: false, message: "No data for this period" } });
      await expect(fetchLocationSummary(baseSummaryPayload(DATE, "Data"))).rejects.toThrow("No data for this period");
    });

    it("carries the location filter into the body", () => {
      const payload = withLocationFilter(baseSummaryPayload(DATE, "Data"), { type: "contracts", category: "Acme", locationId: "L9" });
      expect(payload).toMatchObject({ type: 1, typeName: "Acme", locationId: "L9" });
    });
  });

  describe("month comparison fields", () => {
    it("reads the documented per-month keys: ...Current for the base month, previous...N for the others", () => {
      const row = { locationId: "L1", locationName: "One", totalMandaysCurrent: 10, previousTotalManday1: 7, previousTotalManday2: 5 };
      expect(monthFieldValue(row, "totalMandays", "previousTotalManday", 0)).toBe(10);
      expect(monthFieldValue(row, "totalMandays", "previousTotalManday", 1)).toBe(7);
      expect(monthFieldValue(row, "totalMandays", "previousTotalManday", 2)).toBe(5);
      expect(monthFieldValue(row, "totalMandays", "previousTotalManday", 3)).toBe(0);
    });
  });

  describe("dropdowns", () => {
    it("overallDropDown: same path, unwraps data, maps id/name", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ id: "L1", name: "One" }, { locationId: "L2", locationName: "Two" }] } });
      const result = await fetchLocationTypeOptions(0, DATE);

      expect(get).toHaveBeenCalledWith(`${SERVICE}/overallDropDown/0/01-09-2026/1/24`);
      expect(result).toEqual([
        { id: "L1", name: "One", category: undefined },
        { id: "L2", name: "Two", category: undefined },
      ]);
    });

    it("overallDropDown: a category list (type 1-3) only needs names", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ name: "Contract A" }, { name: "Contract B" }] } });
      const result = await fetchLocationTypeOptions(1, DATE);

      expect(get).toHaveBeenCalledWith(`${SERVICE}/overallDropDown/1/01-09-2026/1/24`);
      expect(result.map((r) => r.name)).toEqual(["Contract A", "Contract B"]);
      expect(result.every((r) => r.id === undefined)).toBe(true);
    });

    it("dropDownByNameBased: encodes the category in the path", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ id: "L1", name: "One" }] } });
      await fetchLocationsByCategory("segments", "Oil & Gas", DATE);

      expect(get).toHaveBeenCalledWith(`${SERVICE}/dropDownByNameBased/2/Oil%20%26%20Gas/01-09-2026/1/24`);
    });

    it("an empty or missing data array gives an empty list", async () => {
      get.mockResolvedValue({ data: { success: true } });
      expect(await fetchLocationTypeOptions(0, DATE)).toEqual([]);
    });

    it("mapDropdownRow treats empty strings as missing", () => {
      expect(mapDropdownRow({ id: "", locationId: "L3", name: "", locationName: "Three" })).toEqual({ id: "L3", name: "Three", category: undefined });
    });
  });

  describe("inventoryDataByLocation", () => {
    it("same path, unwraps data", async () => {
      const rows = [{ category: "Dry", itemId: "I1", itemName: "Rice", packageId: "P1", closingQty: 2, closingValue: 8 }];
      get.mockResolvedValue({ data: { success: true, data: rows } });

      const result = await fetchInventoryByLocation(DATE, "L1");

      expect(get).toHaveBeenCalledWith(`${SERVICE}/inventoryDataByLocation/01-09-2026/L1`);
      expect(result).toBe(rows);
    });

    it("surfaces success:false", async () => {
      get.mockResolvedValue({ data: { success: false, message: "Location not found" } });
      await expect(fetchInventoryByLocation(DATE, "L1")).rejects.toThrow("Location not found");
    });
  });
});
