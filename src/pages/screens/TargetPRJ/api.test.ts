import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

import axiosClient from "../../../api/axiosClient";
import { fetchTargetPrj, mapTargetLocation, modifyTargetPrj } from "./api";
import { buildValueMap, valueKey } from "./data";

const get = vi.mocked(axiosClient.get);
const post = vi.mocked(axiosClient.post);
const SEPT_2026 = new Date(2026, 8, 15);
const SERVICE = "/overallSummary-service/locationInsightController";

const LOCATION = {
  locationId: "L1",
  locationName: "Site One",
  propertyValue: "2026-09-01",
  status: "A",
  targetPrjList: [
    { prjId: "FOOD", controllPrjId: "C1", prjStatus: "A", period: "2026-09-01", targetValue: 1.5 },
    { prjId: "OTHERS", controllPrjId: "C2", prjStatus: "A", period: "2026-09-01", targetValue: null },
  ],
};

describe("TargetPRJ api (overallSummary-service)", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  describe("fetchTargetPrj", () => {
    it("GETs listOfPropertyTargetPrj with the reporting date as DD-MM-YYYY", async () => {
      get.mockResolvedValue({ data: { success: true, data: [LOCATION] } });
      await fetchTargetPrj(SEPT_2026);
      expect(get).toHaveBeenCalledWith(`${SERVICE}/listOfPropertyTargetPrj/15-09-2026`);
    });

    it("reads the envelope's data and keeps the server-side fields of each location and target", async () => {
      get.mockResolvedValue({ data: { success: true, data: [LOCATION] } });
      const [loc] = await fetchTargetPrj(SEPT_2026);
      expect(loc).toMatchObject({ locationId: "L1", locationName: "Site One", propertyValue: "2026-09-01", status: "A" });
      expect(loc.targetPrjList[0]).toEqual({ prjId: "FOOD", targetValue: 1.5, controllPrjId: "C1", prjStatus: "A", period: "2026-09-01" });
    });

    it("keeps a missing or empty target as null, never 0", async () => {
      get.mockResolvedValue({ data: { success: true, data: [LOCATION] } });
      const [loc] = await fetchTargetPrj(SEPT_2026);
      expect(loc.targetPrjList[1].targetValue).toBeNull();
      expect(buildValueMap([loc])[valueKey("L1", "OTHERS")]).toBe("");
      expect(mapTargetLocation({ locationId: "L2", targetPrjList: [{ prjId: "X", targetValue: "" }, { prjId: "Y", targetValue: "2.5" }] }).targetPrjList.map((p) => p.targetValue)).toEqual([null, 2.5]);
    });

    it("treats a missing data array as no locations, and a location with no list as empty", async () => {
      get.mockResolvedValueOnce({ data: { success: true } });
      await expect(fetchTargetPrj(SEPT_2026)).resolves.toEqual([]);
      expect(mapTargetLocation({ locationId: "L3" })).toEqual({ locationId: "L3", locationName: "", targetPrjList: [], propertyValue: undefined, status: undefined });
    });

    it("throws the backend's message on success:false", async () => {
      get.mockResolvedValue({ data: { success: false, message: "No targets" } });
      await expect(fetchTargetPrj(SEPT_2026)).rejects.toThrow("No targets");
    });
  });

  describe("modifyTargetPrj", () => {
    const PAYLOAD = {
      period: "15-09-2026",
      locations: [{ locationId: "L1", locationName: "Site One", propertyValue: "2026-09-01", status: "A", targetPrjList: [{ prjId: "FOOD", controllPrjId: "C1", prjStatus: "A", period: "2026-09-01", targetValue: 2 }] }],
    };

    it("POSTs the payload to modifyPropertyTargetPrj unchanged", async () => {
      post.mockResolvedValue({ data: { success: true, message: "ok", data: "Updated" } });
      await expect(modifyTargetPrj(PAYLOAD)).resolves.toBeUndefined();
      expect(post).toHaveBeenCalledWith(`${SERVICE}/modifyPropertyTargetPrj`, PAYLOAD, { keepOnNavigation: true });
    });

    it("throws the backend's message when it answers success:false on an HTTP 200", async () => {
      post.mockResolvedValue({ data: { success: false, message: "Period is closed" } });
      await expect(modifyTargetPrj(PAYLOAD)).rejects.toThrow("Period is closed");
    });
  });
});
