import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn() } }));
vi.mock("../../../api/fileDownload", () => ({ requestFile: vi.fn(async (fn: () => Promise<unknown>) => void (await fn())) }));
vi.mock("../../../api/apiHelpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../api/apiHelpers")>();
  return { ...actual, currentUserContext: () => ({ userId: "7", userType: 2 }) };
});

import axiosClient from "../../../api/axiosClient";
import { requestFile } from "../../../api/fileDownload";
import {
  buildCategoryDistribution,
  buildItemDistributionForCategory,
  buildItemDistributionForSrcType,
  buildSrcTypeDistribution,
  consumptionReportFilename,
  downloadConsumptionReport,
} from "./api";
import type { DetailRow, DynamicSrcRow } from "./data";

const row = (over: Partial<DetailRow>): DetailRow => ({
  itemId: "i",
  itemName: "Item",
  categoryName: "Veg",
  srcType: "Kitchen",
  unit: "kg",
  pkgCon: 2,
  totalQty: 3,
  conQty: 5,
  totalAmount: 30,
  unitPrice: 10,
  ...over,
});

describe("ConsumptionAnalysisPage distribution builders", () => {
  const rows = [
    row({ itemId: "a", itemName: "A" }),
    row({ itemId: "b", itemName: "B", totalAmount: 10 }),
    row({ itemId: "c", itemName: "C", categoryName: "Dairy", totalAmount: 0, totalQty: 0, conQty: 0 }),
  ];

  it("groups by category for every metric and drops zero totals", () => {
    expect(buildCategoryDistribution(rows, "amount")).toEqual([{ name: "Veg", value: 40 }]);
    expect(buildCategoryDistribution(rows, "qty")).toEqual([{ name: "Veg", value: 6 }]);
    expect(buildCategoryDistribution(rows, "conQty")).toEqual([{ name: "Veg", value: 10 }]);
    expect(buildCategoryDistribution(rows, "pkgConQty")).toEqual([{ name: "Veg", value: 12 }]);
  });

  it("drills into a category sorted by value", () => {
    expect(buildItemDistributionForCategory(rows, "Veg", "amount")).toEqual([
      { name: "A", value: 30, itemId: "a" },
      { name: "B", value: 10, itemId: "b" },
    ]);
    expect(buildItemDistributionForCategory(rows, "Dairy", "amount")).toEqual([]);
  });

  const src: DynamicSrcRow[] = [
    { itemId: "a", itemName: "A", dynamicSrcTypeMap: { Kitchen_TotalQty: 4, Kitchen_ConvertedQty: 1, Bar_TotalQty: 9, Odd_Other: 5 } },
    { itemId: "b", itemName: "B", dynamicSrcTypeMap: { Kitchen_TotalQty: 2, Kitchen_TotalQtyPerManday: 7, Kitchen_ConvertedQtyPerManday: 3 } },
  ];

  it("sums the dynamic source-type map by suffix", () => {
    expect(buildSrcTypeDistribution(src, "qty", false)).toEqual([
      { name: "Bar", value: 9 },
      { name: "Kitchen", value: 6 },
    ]);
    expect(buildSrcTypeDistribution(src, "conQty", false)).toEqual([{ name: "Kitchen", value: 1 }]);
    expect(buildSrcTypeDistribution(src, "qtyPerManday", true)).toEqual([{ name: "Kitchen", value: 7 }]);
    expect(buildSrcTypeDistribution(src, "conQtyPerManday", true)).toEqual([{ name: "Kitchen", value: 3 }]);
  });

  it("drills into a source type", () => {
    expect(buildItemDistributionForSrcType(src, "Kitchen", "qty", false)).toEqual([
      { name: "A", value: 4, itemId: "a" },
      { name: "B", value: 2, itemId: "b" },
    ]);
    expect(buildItemDistributionForSrcType(src, "Kitchen", "conQtyPerManday", true)).toEqual([{ name: "B", value: 3, itemId: "b" }]);
  });
});

describe("consumption report download", () => {
  beforeEach(() => vi.mocked(axiosClient.get).mockReset());

  it("names the file after the period and optional location", () => {
    expect(consumptionReportFilename(new Date(2026, 8, 15))).toMatch(/^consumption_\w+\.xlsx$/);
    expect(consumptionReportFilename(new Date(2026, 8, 15), "L/1 x")).toMatch(/_L_1_x\.xlsx$/);
  });

  it("requests the workbook as a blob, with the location only when given", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({ data: new Blob() });
    await downloadConsumptionReport(new Date(2026, 8, 15), "L1");
    await downloadConsumptionReport(new Date(2026, 8, 15));
    expect(requestFile).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(axiosClient.get).mock.calls;
    expect(calls[0][1]).toMatchObject({ responseType: "blob", params: { userFk: "7", userType: 2, locationId: "L1" } });
    expect((calls[1][1] as { params: object }).params).not.toHaveProperty("locationId");
  });
});
