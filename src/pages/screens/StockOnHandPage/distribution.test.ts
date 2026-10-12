import { describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn() } }));

import { buildCategoryDistribution } from "./api";
import type { DetailRow } from "./data";

const row = (over: Partial<DetailRow>) => ({ categoryName: "Veg", curTotalQty: 2, closingQty: 3, stockAmount: 40, ...over }) as DetailRow;

describe("StockOnHandPage buildCategoryDistribution", () => {
  const rows = [row({}), row({ stockAmount: 10 }), row({ categoryName: "Dairy", stockAmount: 100, curTotalQty: 0, closingQty: 0 })];

  it("sums each metric by category, largest first", () => {
    expect(buildCategoryDistribution(rows, "stockAmount")).toEqual([
      { name: "Dairy", value: 100 },
      { name: "Veg", value: 50 },
    ]);
    expect(buildCategoryDistribution(rows, "curQty")).toEqual([{ name: "Veg", value: 4 }]);
    expect(buildCategoryDistribution(rows, "closingQty")).toEqual([{ name: "Veg", value: 6 }]);
  });

  it("drops categories whose total is zero", () => {
    expect(buildCategoryDistribution([row({ stockAmount: 0 })], "stockAmount")).toEqual([]);
  });
});
