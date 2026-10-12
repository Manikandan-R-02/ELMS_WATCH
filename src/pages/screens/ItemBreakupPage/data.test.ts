import { describe, expect, it } from "vitest";
import { convertedQty, getDynamicMonths, type ItemBreakupRow } from "./data";

function makeRow(overrides: Partial<ItemBreakupRow> = {}): ItemBreakupRow {
  return {
    categoryId: "CAT1",
    itemId: "ITM1",
    itemName: "Rice",
    packageId: "PKG1",
    pkgCon: 25,
    pkgConUom: "KG",
    figuresByOffset: { 0: { qty: 10, cost: 100 } },
    ...overrides,
  };
}

describe("ItemBreakupPage data helpers", () => {
  describe("convertedQty", () => {
    it("multiplies the month's qty by the item's package conversion factor", () => {
      expect(convertedQty(makeRow(), 0)).toBe(250);
    });

    it("returns 0 for a month offset with no figures", () => {
      expect(convertedQty(makeRow(), 5)).toBe(0);
    });
  });

  describe("getDynamicMonths", () => {
    it("returns one entry per requested month, starting at the reporting month", () => {
      const months = getDynamicMonths(new Date(2026, 8, 15), 3); // September 2026
      expect(months).toHaveLength(3);
      expect(months[0]).toMatchObject({ label: "September 2026", month: 9, year: 2026, offset: 0 });
      expect(months[1]).toMatchObject({ label: "August 2026", month: 8, year: 2026, offset: 1 });
      expect(months[2]).toMatchObject({ label: "July 2026", month: 7, year: 2026, offset: 2 });
    });

    it("rolls over into the previous year correctly", () => {
      const months = getDynamicMonths(new Date(2026, 1, 10), 4); // February 2026
      expect(months.map((m) => `${m.month}/${m.year}`)).toEqual(["2/2026", "1/2026", "12/2025", "11/2025"]);
    });

    it("assigns a color by calendar month, not by position in the range", () => {
      const sept2026 = getDynamicMonths(new Date(2026, 8, 1), 1)[0];
      const sept2025 = getDynamicMonths(new Date(2025, 8, 1), 1)[0];
      expect(sept2026.color).toBe(sept2025.color);
    });
  });
});
