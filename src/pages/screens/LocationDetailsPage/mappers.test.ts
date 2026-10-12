import { describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

import { mapConsumptionRow, mapInventoryTrendRow, mapSplitPrjRow, mapSrcRow } from "./api";

describe("LocationDetailsPage row mappers", () => {
  it("mapSrcRow copies the figures and derives waste-per-POB, guarding against a zero POB", () => {
    const row = mapSrcRow({ srcType: "BF", dateString: "01-09-2026", pob: 4, wasteCost: 10, totalCost: 50, targetPRJ: 3 } as never);
    expect(row).toMatchObject({ srcType: "BF", date: "01-09-2026", pob: 4, totalCost: 50, wasteCost: 10, pobWastePRJ: 2.5, targetPRJ: 3 });
    expect(mapSrcRow({ pob: 0, wasteCost: 10 } as never)).toMatchObject({ srcType: "", date: "", pob: 0, pobWastePRJ: 0, totalCost: 0 });
  });

  it("mapConsumptionRow prefers srcDateString, then dateString, and defaults the rest", () => {
    expect(mapConsumptionRow({ srcType: "BF", srcDateString: "a", dateString: "b", totalMandays: 2, categoryListData: { Meat: 1 }, totalCost: 9, avgCostManday: 4 } as never)).toEqual({
      srcType: "BF",
      date: "a",
      totalMandays: 2,
      categoryListData: { Meat: 1 },
      totalCost: 9,
      avgCostManday: 4,
    });
    expect(mapConsumptionRow({ dateString: "b" } as never)).toMatchObject({ srcType: "", date: "b", totalMandays: 0, categoryListData: {}, totalCost: 0 });
    expect(mapConsumptionRow({} as never).date).toBe("");
  });

  it("mapSplitPrjRow copies the cost split and defaults missing values to zero", () => {
    expect(mapSplitPrjRow({ srcType: "BF", dateString: "d", totalMandays: 2, foodCost: 1, cleaningCost: 2, disposalCost: 3, othersCost: 4, total: 10 } as never)).toEqual({
      srcType: "BF",
      date: "d",
      totalMandays: 2,
      foodCost: 1,
      cleaningCost: 2,
      disposalCost: 3,
      othersCost: 4,
      total: 10,
    });
    expect(mapSplitPrjRow({} as never)).toMatchObject({ srcType: "", date: "", foodCost: 0, total: 0 });
  });

  it("mapInventoryTrendRow renames the backend fields and defaults missing values to zero", () => {
    expect(
      mapInventoryTrendRow({ entryDateStr: "d", totalClosingQty: 1, totalClosingValue: 2, dailyConsumptionValue: 3, cumConsumptionValue: 4, dioDays: 5 } as never)
    ).toEqual({ date: "d", closingQty: 1, closingValue: 2, dailyConsumptionValue: 3, cumulativeConsumptionValue: 4, dioDays: 5 });
    expect(mapInventoryTrendRow({} as never)).toEqual({ date: "", closingQty: 0, closingValue: 0, dailyConsumptionValue: 0, cumulativeConsumptionValue: 0, dioDays: 0 });
  });
});
