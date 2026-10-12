import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("../../../api/apiHelpers", () => ({ currentUserContext: () => ({ userId: "7", userType: 2 }) }));

import axiosClient from "../../../api/axiosClient";
import { fetchDayBasedData, fetchLocationBreakdownForMonth, fetchWasteDashboard, fetchWasteLocations } from "./api";

const get = vi.mocked(axiosClient.get);
const post = vi.mocked(axiosClient.post);

describe("WasteCostAnalysisPage api", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  describe("fetchWasteLocations", () => {
    it("calls the location dropdown endpoint with year/userType/userId and maps code->id", async () => {
      get.mockResolvedValue({ data: { responseContents: [{ code: "OMA1", name: "Site One" }] } });
      await expect(fetchWasteLocations(2026)).resolves.toEqual([{ id: "OMA1", name: "Site One" }]);
      expect(get).toHaveBeenCalledWith("/waste-cost-analysis-service/wasteCostController/locationDropdown/2026/2/7");
    });

    it("defaults to an empty array when responseContents is missing", async () => {
      get.mockResolvedValue({ data: {} });
      await expect(fetchWasteLocations(2026)).resolves.toEqual([]);
    });
  });

  describe("fetchWasteDashboard", () => {
    it("sends yearType 0 and locType 0 for a whole-year, all-locations query", async () => {
      post.mockResolvedValue({ data: { responseContent: {} } });
      await fetchWasteDashboard({ year: 2026 });
      expect(post).toHaveBeenCalledWith("/waste-cost-analysis-service/wasteCostController/wasteDataDashboard", {
        yearType: 0,
        year: 2026,
        locType: 0,
        userId: "7",
        userType: 2,
      });
    });

    it("sends yearType 1 and the month when a specific month is given", async () => {
      post.mockResolvedValue({ data: { responseContent: {} } });
      await fetchWasteDashboard({ year: 2026, month: 3 });
      expect(post).toHaveBeenCalledWith(
        "/waste-cost-analysis-service/wasteCostController/wasteDataDashboard",
        expect.objectContaining({ yearType: 1, month: 3, locType: 0 })
      );
    });

    it("sends locType 1 and the locationId when a specific location is given, and omits it for ALL", async () => {
      post.mockResolvedValue({ data: { responseContent: {} } });
      await fetchWasteDashboard({ year: 2026, locationId: "OMA1" });
      expect(post).toHaveBeenCalledWith(
        "/waste-cost-analysis-service/wasteCostController/wasteDataDashboard",
        expect.objectContaining({ locType: 1, locationId: "OMA1" })
      );

      post.mockClear();
      await fetchWasteDashboard({ year: 2026, locationId: "ALL" });
      const [, body] = post.mock.calls[0];
      expect(body).not.toHaveProperty("locationId");
      expect((body as { locType: number }).locType).toBe(0);
    });

    it("prefers wasteOverViewList over locationSubList for overviewRows, and fills missing figures with 0", async () => {
      post.mockResolvedValue({
        data: {
          responseContent: { rawMaterialCost: 500, wasteOverViewList: [{ month: 1 }], locationSubList: [{ locationId: "X" }] },
          responseContents2: [{ lossReason: "Spoilage", sumOfWeight: 10 }],
          responseContents3: [{ foodItem: "Rice", sumOfWeight: 5 }],
        },
      });
      const result = await fetchWasteDashboard({ year: 2026 });
      expect(result.overviewRows).toEqual([{ month: 1 }]);
      expect(result.totals.rawMaterialCost).toBe(500);
      expect(result.totals.currentMandays).toBe(0);
      expect(result.lossReasons).toEqual([{ lossReason: "Spoilage", sumOfWeight: 10 }]);
      expect(result.topWastedFood).toEqual([{ foodItem: "Rice", sumOfWeight: 5 }]);
    });

    it("falls back to locationSubList when wasteOverViewList is absent", async () => {
      post.mockResolvedValue({ data: { responseContent: { locationSubList: [{ locationId: "Y" }] } } });
      const result = await fetchWasteDashboard({ year: 2026, month: 2 });
      expect(result.overviewRows).toEqual([{ locationId: "Y" }]);
    });
  });

  describe("fetchLocationBreakdownForMonth", () => {
    it("always queries with locationId ALL and locType 0 for a specific month", async () => {
      post.mockResolvedValue({ data: { responseContent: { locationSubList: [{ locationId: "Z" }] } } });
      await expect(fetchLocationBreakdownForMonth(2026, 6)).resolves.toEqual([{ locationId: "Z" }]);
      expect(post).toHaveBeenCalledWith(
        "/waste-cost-analysis-service/wasteCostController/wasteDataDashboard",
        { yearType: 1, year: 2026, month: 6, locationId: "ALL", locType: 0, userId: "7", userType: 2 }
      );
    });
  });

  describe("fetchDayBasedData", () => {
    it("passes the typeName through and defaults nested lists to empty arrays", async () => {
      post.mockResolvedValue({ data: { responseContents: [{ date: "2026-06-01", totalWasteValue: 10 }] } });
      const result = await fetchDayBasedData(2026, 6, "OMA1", "Loss Reason");
      expect(post).toHaveBeenCalledWith("/waste-cost-analysis-service/wasteCostController/getDayBasedData", {
        year: 2026,
        month: 6,
        locationId: "OMA1",
        typeName: "Loss Reason",
      });
      expect(result[0].lossReasonList).toEqual([]);
      expect(result[0].foodItemByweight).toEqual([]);
      expect(result[0].currentMandays).toBe(0);
    });
  });
});
