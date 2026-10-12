import { describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

import { dailyFieldValue, mapInventoryItem, mapSummaryRow } from "./api";

describe("LocationSummaryPage row mappers", () => {
  it("dailyFieldValue reads the numbered day column, zero when absent", () => {
    expect(dailyFieldValue({ pob3: 7, actual3: 9 } as never, "pob", 3)).toBe(7);
    expect(dailyFieldValue({ pob3: 7, actual3: 9 } as never, "actual", 3)).toBe(9);
    expect(dailyFieldValue({} as never, "pob", 3)).toBe(0);
  });

  it("mapSummaryRow renames the backend fields and defaults missing values", () => {
    const row = mapSummaryRow({
      locationId: "L1",
      locationName: "Site",
      staff: 2,
      currentPob: 3,
      lastUpdate: "yesterday",
      targetPRJ: 4,
      actual: 5,
      totalMandays: 6,
      totalCost: 7,
      totalWasteCost: 8,
      inventoryValue: 9,
      dio: 10,
      currentFirst10: 11,
      currentSecond10: 12,
      currentThrid10: 13,
    } as never);
    expect(row).toEqual({
      id: "L1",
      name: "Site",
      staff: 2,
      currentPOB: 3,
      lastUpdated: "yesterday",
      targetPRJ: 4,
      actual: 5,
      totalMandays: 6,
      totalCost: 7,
      wasteCost: 8,
      inventoryValue: 9,
      dio: 10,
      tenDay: 11,
      twentyDay: 12,
      thirtyDay: 13,
    });
    expect(mapSummaryRow({ locationId: "L2", locationName: "B" } as never)).toMatchObject({ staff: 0, currentPOB: 0, lastUpdated: "", wasteCost: 0, thirtyDay: 0 });
  });

  it("mapInventoryItem copies the item and defaults missing quantities to zero", () => {
    expect(mapInventoryItem({ category: "Veg", itemId: "i", itemName: "Onion", packageId: "p", closingQty: 2, closingValue: 30 } as never)).toEqual({
      category: "Veg",
      itemId: "i",
      itemName: "Onion",
      packageId: "p",
      closingQty: 2,
      closingValue: 30,
    });
    expect(mapInventoryItem({ category: "Veg", itemId: "i", itemName: "Onion", packageId: "p" } as never)).toMatchObject({ closingQty: 0, closingValue: 0 });
  });
});
