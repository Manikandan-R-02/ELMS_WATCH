import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

import axiosClient from "../../../api/axiosClient";
import { fetchLocationAccess, fetchRightsUsers, mapLocationAccess, saveLocationRights } from "./api";
import type { LocationAccessRow } from "./data";

const get = vi.mocked(axiosClient.get);
const post = vi.mocked(axiosClient.post);
const BASE = "/login-credential-service/loginController";

describe("LocationRightsPage api (login-credential-service)", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  describe("fetchRightsUsers", () => {
    it("GETs userDropdownByLocatinRights (the backend's own spelling) and maps pk / name from the envelope", async () => {
      get.mockResolvedValue({ data: { success: true, data: [{ pk: 7, name: "Asha", code: "ignored", pkThree: 99 }, { pk: "8", name: "Ravi" }] } });
      await expect(fetchRightsUsers()).resolves.toEqual([{ pk: 7, name: "Asha" }, { pk: 8, name: "Ravi" }]);
      expect(get).toHaveBeenCalledWith(`${BASE}/userDropdownByLocatinRights`);
    });

    it("also reads the old responseContents shape, treats no data as an empty list, and throws the backend's message on success:false", async () => {
      get.mockResolvedValueOnce({ data: { responseContents: [{ pk: 1, name: "A" }] } });
      await expect(fetchRightsUsers()).resolves.toEqual([{ pk: 1, name: "A" }]);

      get.mockResolvedValueOnce({ data: { success: true } });
      await expect(fetchRightsUsers()).resolves.toEqual([]);

      get.mockResolvedValueOnce({ data: { success: false, message: "Not allowed" } });
      await expect(fetchRightsUsers()).rejects.toThrow("Not allowed");
    });
  });

  describe("fetchLocationAccess", () => {
    it("GETs userDropdownByLocatinRights/{userFk} and maps each location with its own pk, the user's pk and the check flag", async () => {
      get.mockResolvedValue({
        data: { success: true, data: [{ pk: 11, pkThree: 7, code: "L1", name: "Site One", check: true }, { pk: 12, pkThree: 7, code: "L2", name: "Site Two", check: false }] },
      });
      const rows = await fetchLocationAccess(7);
      expect(get).toHaveBeenCalledWith(`${BASE}/userDropdownByLocatinRights/7`);
      expect(rows).toEqual([
        { pk: 11, pkThree: 7, code: "L1", name: "Site One", check: true },
        { pk: 12, pkThree: 7, code: "L2", name: "Site Two", check: false },
      ]);
    });

    it("accepts locationId / locationName when code / name are empty, and a missing check as not allowed", () => {
      expect(mapLocationAccess({ pk: 5, pkThree: 7, locationId: "L9", locationName: "Nine" })).toEqual({ pk: 5, pkThree: 7, code: "L9", name: "Nine", check: false });
      expect(mapLocationAccess({ pk: 6, code: "L1", name: "One", check: "true" }).check).toBe(true);
    });

    it("throws the backend's message on success:false", async () => {
      get.mockResolvedValue({ data: { success: false, message: "Unknown user" } });
      await expect(fetchLocationAccess(7)).rejects.toThrow("Unknown user");
    });
  });

  describe("saveLocationRights", () => {
    const ROWS: LocationAccessRow[] = [
      { pk: 11, pkThree: 7, code: "L1", name: "Site One", check: true },
      { pk: 12, pkThree: 7, code: "L2", name: "Site Two", check: false },
    ];

    it("POSTs the full list (not a diff) as a bare array of { pkThree, locationId, check }, keyed by each row's own pk", async () => {
      post.mockResolvedValue({ data: { success: true, message: "ok", data: "Saved" } });
      await expect(saveLocationRights(ROWS, new Set([12]))).resolves.toBeUndefined();
      expect(post).toHaveBeenCalledWith(`${BASE}/saveLocationRights`, [
        { pkThree: 7, locationId: "L1", check: false },
        { pkThree: 7, locationId: "L2", check: true },
      ], { keepOnNavigation: true });
    });

    it("throws the backend's message when it answers success:false on an HTTP 200", async () => {
      post.mockResolvedValue({ data: { success: false, message: "User is inactive" } });
      await expect(saveLocationRights(ROWS, new Set())).rejects.toThrow("User is inactive");
    });
  });
});
