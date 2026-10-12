import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

import axiosClient from "../../../api/axiosClient";
import { useAuthStore } from "../../../store/authStore";
import {
  baseDetailsPayload,
  categoryComparisonPayload,
  categoryFieldValue,
  fetchInventoryByDate,
  fetchInventoryTrend,
  fetchLocationDetails,
  fetchSrcTypeOptions,
  mapComparisonRows,
} from "./api";

const get = vi.mocked(axiosClient.get);
const post = vi.mocked(axiosClient.post);
const SERVICE = "/overallSummary-service";
const DATE = new Date(2026, 8, 1); // 01-09-2026

describe("LocationDetailsPage api (overallSummary-service)", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    useAuthStore.setState({ isLoggedIn: true, user: { id: "24", name: "A", email: "a@b.c", role: "Admin", initials: "A", userId: "24", userType: 1 } });
  });

  describe("listOfLocationDetails", () => {
    it("posts to locationDetailsController on overallSummary-service with the base payload", async () => {
      post.mockResolvedValue({ data: { success: true, data: {} } });
      await fetchLocationDetails(baseDetailsPayload(DATE, "L1"));

      expect(post.mock.calls[0][0]).toBe(`${SERVICE}/locationDetailsController/listOfLocationDetails`);
      expect(post.mock.calls[0][1]).toEqual({ date: "01-09-2026", month: 9, year: 2026, type: 0, locationId: "L1", dailyPRJDayRange: 9, monthFilter: 12 });
    });

    it("maps data.summary / srcDataList / consumptionDataList / splitPrjList / consumptionComparisonList to the shape the screen reads", async () => {
      const summary = { totalCost: 5 };
      const srcDataList = [{ srcType: "BF" }];
      const consumptionDataList = [{ srcType: "BF" }];
      const splitPrjList = [{ srcType: "BF" }];
      const consumptionComparisonList = [{ category: "Meat" }];
      post.mockResolvedValue({ data: { success: true, message: "ok", data: { summary, srcDataList, consumptionDataList, splitPrjList, consumptionComparisonList } } });

      const result = await fetchLocationDetails(baseDetailsPayload(DATE, "L1"));

      expect(result.responseContent).toBe(summary);
      expect(result.responseContents).toBe(srcDataList);
      expect(result.responseContents2).toBe(consumptionDataList);
      expect(result.responseContents3).toBe(splitPrjList);
      expect(result.responseContents4).toBe(consumptionComparisonList);
    });

    it("throws the backend's message when success is false, even on HTTP 200", async () => {
      post.mockResolvedValue({ data: { success: false, message: "No such location" } });
      await expect(fetchLocationDetails(baseDetailsPayload(DATE, "L1"))).rejects.toThrow("No such location");
    });
  });

  describe("Consumption Compare request", () => {
    it("sends the comparison months as parallel previousMonths / previousYears, not the old filter + yearList", () => {
      const payload = categoryComparisonPayload("L1", DATE, [
        { year: 2026, month: 8 },
        { year: 2026, month: 7 },
        { year: 2025, month: 12 },
      ]);

      expect(payload).toMatchObject({ locationId: "L1", month: 9, year: 2026, monthFilter: 4, previousMonths: [8, 7, 12], previousYears: [2026, 2026, 2025] });
      expect(payload).not.toHaveProperty("filter");
      expect(payload).not.toHaveProperty("yearList");
    });

    it("excludes the base month from the comparison lists", () => {
      const payload = categoryComparisonPayload("L1", DATE, []);
      expect(payload.previousMonths).toEqual([]);
      expect(payload.previousYears).toEqual([]);
    });

    it("reads the base month from currentMonth… and the others from previousMonth…N by position", () => {
      const row = {
        category: "Meat",
        currentMonthTotalCost: 100,
        currentMonthCostManday: 4,
        previousMonthTotalCost1: 90,
        previousMonthCostManday1: 3.5,
        previousMonthTotalCost2: 80,
        previousMonthCostManday2: 3,
      };
      expect(categoryFieldValue(row, "cost", 0)).toBe(100);
      expect(categoryFieldValue(row, "costManday", 0)).toBe(4);
      expect(categoryFieldValue(row, "cost", 1)).toBe(90);
      expect(categoryFieldValue(row, "costManday", 2)).toBe(3);
      expect(categoryFieldValue(row, "cost", 3)).toBe(0);
    });

    it("builds a row per category with a figure for every picked month", () => {
      const months = [
        { key: "2026-09", year: 2026, month: 9, isBase: true },
        { key: "2026-08", year: 2026, month: 8 },
      ];
      const rows = mapComparisonRows(
        [{ category: "Meat", currentMonthTotalCost: 100, currentMonthCostManday: 4, previousMonthTotalCost1: 90, previousMonthCostManday1: 3.5 }],
        months
      );
      expect(rows).toEqual([{ category: "Meat", figures: { "2026-09": { cost: 100, costPerManday: 4 }, "2026-08": { cost: 90, costPerManday: 3.5 } } }]);
    });
  });

  describe("srcTypeDropDown", () => {
    it("same path shape under the new service, unwraps data and keeps the names", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ name: "BF" }, { name: "LN" }] } });
      const result = await fetchSrcTypeOptions(DATE, "L1");

      expect(get).toHaveBeenCalledWith(`${SERVICE}/locationDetailsController/srcTypeDropDown/01-09-2026/L1/1/24`);
      expect(result).toEqual([{ name: "BF" }, { name: "LN" }]);
    });

    it("falls back to code or id when name is empty, and drops entries with no label at all", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ name: "", code: "DN" }, { id: "X1" }, {}] } });
      expect(await fetchSrcTypeOptions(DATE, "L1")).toEqual([{ name: "DN" }, { name: "X1" }]);
    });

    it("an empty or missing data array gives an empty list", async () => {
      get.mockResolvedValue({ data: { success: true } });
      expect(await fetchSrcTypeOptions(DATE, "L1")).toEqual([]);
    });
  });

  describe("inventoryData", () => {
    it("is served by locationSummaryController (not locationDetailsController) on overallSummary-service", async () => {
      const rows = [{ entryDateStr: "01-09-2026", totalClosingQty: 4, totalClosingValue: 90, dailyConsumptionValue: 2, cumConsumptionValue: 7, dioDays: 3 }];
      get.mockResolvedValue({ data: { success: true, data: rows } });

      const result = await fetchInventoryTrend(DATE, "L1");

      expect(get).toHaveBeenCalledWith(`${SERVICE}/locationSummaryController/inventoryData/01-09-2026/L1`);
      expect(result).toBe(rows);
    });

    it("surfaces success:false and treats a missing data array as empty", async () => {
      get.mockResolvedValueOnce({ data: { success: false, message: "Location not found" } });
      await expect(fetchInventoryTrend(DATE, "L1")).rejects.toThrow("Location not found");

      get.mockResolvedValueOnce({ data: { success: true } });
      expect(await fetchInventoryTrend(DATE, "L1")).toEqual([]);
    });
  });

  describe("inventoryDataByLocationByDate", () => {
    it("is served by locationSummaryController on overallSummary-service with period / locationId / date", async () => {
      const items = [{ category: "Dry", itemId: "I1", itemName: "Rice", packageId: "P1", closingQty: 2, closingValue: 10 }];
      get.mockResolvedValue({ data: { success: true, data: items } });

      expect(await fetchInventoryByDate(DATE, "L1", "05-09-2026")).toBe(items);
      expect(get).toHaveBeenCalledWith(`${SERVICE}/locationSummaryController/inventoryDataByLocationByDate/01-09-2026/L1/05-09-2026`);
    });

    it("surfaces success:false and treats a missing data array as empty", async () => {
      get.mockResolvedValueOnce({ data: { success: false, message: "No stock" } });
      await expect(fetchInventoryByDate(DATE, "L1", "05-09-2026")).rejects.toThrow("No stock");

      get.mockResolvedValueOnce({ data: { success: true } });
      expect(await fetchInventoryByDate(DATE, "L1", "05-09-2026")).toEqual([]);
    });
  });
});
