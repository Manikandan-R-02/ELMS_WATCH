import { describe, expect, it } from "vitest";
import { MONTH_OPTIONS, identityLabelFor, monthLabel, wastePercentage } from "./data";

describe("WasteCostAnalysisPage data helpers", () => {
  describe("wastePercentage", () => {
    it("computes totalWasteValue / rawMaterialCost * 100", () => {
      expect(wastePercentage({ totalWasteValue: 25, rawMaterialCost: 100 })).toBe(25);
    });

    it("returns 0 when rawMaterialCost is 0, instead of Infinity/NaN", () => {
      expect(wastePercentage({ totalWasteValue: 50, rawMaterialCost: 0 })).toBe(0);
    });

    it("returns 0 when totalWasteValue is 0 too", () => {
      expect(wastePercentage({ totalWasteValue: 0, rawMaterialCost: 0 })).toBe(0);
    });
  });

  describe("MONTH_OPTIONS", () => {
    it("has 13 entries: All Months plus the 12 calendar months", () => {
      expect(MONTH_OPTIONS).toHaveLength(13);
      expect(MONTH_OPTIONS[0]).toEqual({ label: "All Months", value: 0 });
      expect(MONTH_OPTIONS[1].label).toBe("January");
      expect(MONTH_OPTIONS[12].label).toBe("December");
    });
  });

  describe("monthLabel", () => {
    it("resolves a month number to its name", () => {
      expect(monthLabel(1)).toBe("January");
      expect(monthLabel(12)).toBe("December");
    });

    it("falls back to the raw number for an unrecognized value", () => {
      expect(monthLabel(99)).toBe("99");
    });
  });

  describe("identityLabelFor", () => {
    it("labels a month row by its month name", () => {
      expect(identityLabelFor({ month: 3, currentMandays: 0, mealsCount: 0, totalWasteWeight: 0, totalWasteValue: 0, transactionCount: 0, rawMaterialCost: 0, wasteMealsGms: 0 })).toBe("March");
    });

    it("labels a location row as 'code — name'", () => {
      expect(
        identityLabelFor({ locationId: "OMA1", locationName: "Site One", currentMandays: 0, mealsCount: 0, totalWasteWeight: 0, totalWasteValue: 0, transactionCount: 0, rawMaterialCost: 0, wasteMealsGms: 0 })
      ).toBe("OMA1 — Site One");
    });

    it("falls back to just the code when a location row has no name", () => {
      expect(
        identityLabelFor({ locationId: "OMA1", currentMandays: 0, mealsCount: 0, totalWasteWeight: 0, totalWasteValue: 0, transactionCount: 0, rawMaterialCost: 0, wasteMealsGms: 0 })
      ).toBe("OMA1");
    });
  });
});
