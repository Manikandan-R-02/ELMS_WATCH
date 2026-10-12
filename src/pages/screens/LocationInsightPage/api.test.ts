import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

import axiosClient from "../../../api/axiosClient";
import { baseInsightPayload, fetchLocationInsight, mapInsightStats, mapSeries, mapSplitPrjSeries } from "./api";

const post = vi.mocked(axiosClient.post);
const DATE = new Date(2026, 8, 1);

describe("LocationInsightPage api (overallSummary-service)", () => {
  beforeEach(() => {
    post.mockReset();
  });

  it("posts to overallSummary-service's locationInsightController", async () => {
    post.mockResolvedValue({ data: { success: true, data: {} } });
    await fetchLocationInsight(baseInsightPayload(DATE, "L1"));

    expect(post.mock.calls[0][0]).toBe("/overallSummary-service/locationInsightController/listOfLocationInsight");
    expect(post.mock.calls[0][1]).toEqual({ dateString: "01-09-2026", month: 9, year: 2026, locationId: "L1" });
  });

  it("returns the envelope's data (summary + the three day-wise lists)", async () => {
    const data = { summary: { totalManday: 3 }, dayWiseMandayList: ["01-09-2026: 4"] };
    post.mockResolvedValue({ data: { success: true, message: "ok", data } });
    expect(await fetchLocationInsight(baseInsightPayload(DATE, "L1"))).toBe(data);
  });

  it("returns an empty object when the envelope has no data", async () => {
    post.mockResolvedValue({ data: { success: true } });
    expect(await fetchLocationInsight(baseInsightPayload(DATE, "L1"))).toEqual({});
  });

  it("throws the backend's message on success:false", async () => {
    post.mockResolvedValue({ data: { success: false, message: "No data" } });
    await expect(fetchLocationInsight(baseInsightPayload(DATE, "L1"))).rejects.toThrow("No data");
  });
});

describe("LocationInsightPage mappers", () => {
  it("maps summary figures, defaulting to 0", () => {
    expect(mapInsightStats({ totalManday: 5, totalCost: 100.5, cumDailyCost: 20 })).toEqual({ totalMandays: 5, totalCost: 100.5, cumulativeDailyCost: 20 });
    expect(mapInsightStats(undefined)).toEqual({ totalMandays: 0, totalCost: 0, cumulativeDailyCost: 0 });
  });

  it("parses 'DD-MM-YYYY: value' strings, with or without the space", () => {
    expect(mapSeries(["01-09-2026: 4.5", "02-09-2026:7"])).toEqual([
      { date: "01/09/2026", value: 4.5 },
      { date: "02/09/2026", value: 7 },
    ]);
    expect(mapSeries(undefined)).toEqual([]);
  });

  it("flattens the date-keyed splitPrjList in date order", () => {
    expect(mapSplitPrjSeries({ "2026-09-02": { FOOD: 2 }, "2026-09-01": { FOOD: 1, CLEANING: 3, DISPOSAL: 4, OTHERS: 5 } })).toEqual([
      { date: "2026-09-01", food: 1, cleaning: 3, disposal: 4, others: 5 },
      { date: "2026-09-02", food: 2, cleaning: 0, disposal: 0, others: 0 },
    ]);
  });
});
