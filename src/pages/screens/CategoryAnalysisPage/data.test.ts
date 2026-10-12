import { describe, expect, it } from "vitest";
import { applyViewMode, buildGroupRows, groupLabel, type CategoryRow } from "./data";

describe("CategoryAnalysisPage data helpers", () => {
  describe("groupLabel", () => {
    it("falls back to Unknown for a missing or blank group", () => {
      expect(groupLabel(undefined)).toBe("Unknown");
      expect(groupLabel("")).toBe("Unknown");
      expect(groupLabel("   ")).toBe("Unknown");
    });

    it("passes through a real group name", () => {
      expect(groupLabel("Food")).toBe("Food");
    });
  });

  describe("buildGroupRows", () => {
    it("sums qty/amount for categories sharing the same group", () => {
      const categories: CategoryRow[] = [
        { categoryId: "A", groupOfCategory: "Food", qty: 10, qtyCon: 0, amount: 100 },
        { categoryId: "B", groupOfCategory: "Food", qty: 5, qtyCon: 0, amount: 50 },
        { categoryId: "C", groupOfCategory: "Cleaning", qty: 2, qtyCon: 0, amount: 20 },
      ];
      const groups = buildGroupRows(categories);
      expect(groups).toHaveLength(2);
      expect(groups.find((g) => g.group === "Food")).toEqual({ group: "Food", qty: 15, amount: 150 });
      expect(groups.find((g) => g.group === "Cleaning")).toEqual({ group: "Cleaning", qty: 2, amount: 20 });
    });

    it("buckets categories with no group under Unknown", () => {
      const categories: CategoryRow[] = [{ categoryId: "A", groupOfCategory: "", qty: 1, qtyCon: 0, amount: 10 }];
      expect(buildGroupRows(categories)).toEqual([{ group: "Unknown", qty: 1, amount: 10 }]);
    });

    it("returns an empty array for no categories", () => {
      expect(buildGroupRows([])).toEqual([]);
    });
  });

  describe("applyViewMode", () => {
    const rows = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

    it("returns everything unchanged for 'all'", () => {
      expect(applyViewMode(rows, "all")).toEqual(rows);
    });

    it("takes the first 5/10 for top5/top10", () => {
      expect(applyViewMode(rows, "top5")).toEqual([10, 9, 8, 7, 6]);
      expect(applyViewMode(rows, "top10")).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    });

    it("takes the last 5/10, reversed to stay high-to-low, for least5/least10", () => {
      expect(applyViewMode(rows, "least5")).toEqual([4, 3, 2, 1, 0]);
      expect(applyViewMode(rows, "least10")).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
    });
  });
});
