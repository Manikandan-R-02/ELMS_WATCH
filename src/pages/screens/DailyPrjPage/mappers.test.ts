import { describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn() } }));

import { buildTargetSummaryRow, computeTotalAndAverage, mapDetailRow, mapMonthHeaderRow, mapSummaryRows, mapTargetTable, targetDailyPrj } from "./api";
import type { DetailDayRow } from "./data";

describe("DailyPrjPage api mappers", () => {
  it("mapSummaryRows splits the location columns from the values and tolerates missing input", () => {
    expect(mapSummaryRows(undefined)).toEqual([]);
    expect(mapSummaryRows([{ location_code: "L1", location_name: "Site", total: 5 }])).toEqual([{ id: "L1", name: "Site", values: { total: 5 } }]);
    expect(mapSummaryRows([{ total: 1 }])).toEqual([{ id: "", name: "", values: { total: 1 } }]);
  });

  it("mapDetailRow parses numbers, falls back through alias keys and maps the PRJ breakdown", () => {
    const row = mapDetailRow({
      sno: "3",
      date: "01-09-2026",
      food: 10,
      cleaning: "2.5",
      mandays: "",
      daily_prj: null,
      variance_prj: 4,
      staff_variance: 1,
      prj_breakdown: { SS: { food: 1, total: 9 }, XX: {} },
    } as never);
    expect(row.sno).toBe(3);
    expect(row.date).toBe("01-09-2026");
    expect(row.cleaning).toBe(2.5);
    expect(row.mandays).toBe(0);
    expect(row.dailyPrj).toBe(0);
    expect(row.varPrj).toBe(4);
    expect(row.varStaff).toBe(1);
    expect(row.prjBreakdown.SS).toEqual({ food: 1, cleaning: 0, disposable: 0, mandays: 0, total: 9, prj: 0 });
    expect(row.prjBreakdown.XX.total).toBe(0);
    expect(mapDetailRow({} as never).date).toBe("");
    expect(mapDetailRow({ food: "abc" } as never).food).toBe(0);
  });

  it("mapTargetTable and targetDailyPrj read the PRJ/Manday total", () => {
    expect(mapTargetTable(undefined)).toEqual([]);
    const rows = mapTargetTable([
      { prj: "PRJ/Manday", target_value: 5, mandays: 2, total: 7, impact_manday: 1 },
      { prj: "Other", target: 3 },
    ] as never);
    expect(rows[0]).toEqual({ prj: "PRJ/Manday", targetValue: 5, mandays: 2, total: 7, impactManday: 1 });
    expect(rows[1].targetValue).toBe(3);
    expect(targetDailyPrj(rows)).toBe(7);
    expect(targetDailyPrj([])).toBe(0);
  });

  it("mapMonthHeaderRow copies the rollup figures", () => {
    expect(mapMonthHeaderRow("Current Month", { food: 1, daily_prj: 2, staff: 3 })).toMatchObject({ label: "Current Month", food: 1, dailyPrj: 2, staff: 3 });
    expect(mapMonthHeaderRow("Previous Month", undefined).food).toBeUndefined();
  });

  it("computeTotalAndAverage sums every column and averages only the active days", () => {
    const base = mapDetailRow({} as never);
    const rows: DetailDayRow[] = [
      { ...base, food: 1, consumption: 10, mandays: 2, dailyPrj: 5, staff: 1, productivity: 4, others: 1 },
      { ...base, food: 2, consumption: 20, mandays: 0, dailyPrj: 0, staff: 0, productivity: 0, others: 2 },
      { ...base, food: 3, consumption: 30, mandays: 4, dailyPrj: 7, staff: 3, productivity: 8, others: 3 },
    ];
    const { total, avg } = computeTotalAndAverage(rows);
    expect(total).toMatchObject({ label: "Total", food: 6, consumption: 60, mandays: 6, dailyPrj: 10, staff: 4, others: 6 });
    expect(avg).toMatchObject({ label: "Avg", mandays: 3, dailyPrj: 6, staff: 2, productivity: 6 });
    const empty = computeTotalAndAverage([]);
    expect(empty.total.dailyPrj).toBe(0);
    expect(empty.avg.mandays).toBe(0);
  });

  it("buildTargetSummaryRow reads the staff and productivity targets, undefined when zero", () => {
    expect(buildTargetSummaryRow(9, { target_staff: 4, target_productivity: 2 } as never)).toEqual({ label: "Target", dailyPrj: 9, staff: 4, productivity: 2 });
    expect(buildTargetSummaryRow(9, undefined)).toEqual({ label: "Target", dailyPrj: 9, staff: undefined, productivity: undefined });
  });
});
