import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

import axiosClient from "../../../api/axiosClient";
import { fetchProductivity, mapProductivityRow, modifyProductivity } from "./api";
import { buildValueMap } from "./data";

const get = vi.mocked(axiosClient.get);
const post = vi.mocked(axiosClient.post);
const SEPT_2026 = new Date(2026, 8, 15);
const SERVICE = "/overallSummary-service/locationInsightController";

const ROW = { locationId: "L1", locationName: "Site One", propertyValue: "2026-09-01", status: "A", period: "2026-09-01", productivity: 4.25 };

describe("ProductivityPage api (overallSummary-service)", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  describe("fetchProductivity", () => {
    it("GETs listOfPropertyProductivity with the reporting date as DD-MM-YYYY", async () => {
      get.mockResolvedValue({ data: { success: true, data: [ROW] } });
      await fetchProductivity(SEPT_2026);
      expect(get).toHaveBeenCalledWith(`${SERVICE}/listOfPropertyProductivity/15-09-2026`);
    });

    it("reads the envelope's data and keeps the server-side fields of each row", async () => {
      get.mockResolvedValue({ data: { success: true, data: [ROW] } });
      await expect(fetchProductivity(SEPT_2026)).resolves.toEqual([ROW]);
    });

    it("keeps a missing or empty productivity as null (and an empty edit box), never 0", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ locationId: "L2" }, { locationId: "L3", productivity: "" }, { locationId: "L4", productivity: "7.5" }] } });
      const rows = await fetchProductivity(SEPT_2026);
      expect(rows.map((r) => r.productivity)).toEqual([null, null, 7.5]);
      expect(buildValueMap(rows)).toEqual({ L2: "", L3: "", L4: 7.5 });
      expect(mapProductivityRow({ locationId: "L5", productivity: "abc" }).productivity).toBeNull();
    });

    it("treats a missing data array as no rows", async () => {
      get.mockResolvedValue({ data: { success: true } });
      await expect(fetchProductivity(SEPT_2026)).resolves.toEqual([]);
    });

    it("throws the backend's message on success:false", async () => {
      get.mockResolvedValue({ data: { success: false, message: "No data" } });
      await expect(fetchProductivity(SEPT_2026)).rejects.toThrow("No data");
    });
  });

  describe("modifyProductivity", () => {
    const PAYLOAD = { period: "15-09-2026", locations: [{ ...ROW, productivity: 5 }] };

    it("POSTs the payload to modifyPropertyProductivity unchanged", async () => {
      post.mockResolvedValue({ data: { success: true, message: "ok", data: "Updated" } });
      await expect(modifyProductivity(PAYLOAD)).resolves.toBeUndefined();
      expect(post).toHaveBeenCalledWith(`${SERVICE}/modifyPropertyProductivity`, PAYLOAD, { keepOnNavigation: true });
    });

    it("throws the backend's message when it answers success:false on an HTTP 200", async () => {
      post.mockResolvedValue({ data: { success: false, message: "Period is closed" } });
      await expect(modifyProductivity(PAYLOAD)).rejects.toThrow("Period is closed");
    });
  });
});
