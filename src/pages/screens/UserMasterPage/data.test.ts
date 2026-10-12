import { describe, expect, it } from "vitest";
import { apiStatusCode, roleFromUserType, roleLabel, statusFromApi } from "./data";

describe("UserMasterPage data helpers", () => {
  describe("roleFromUserType", () => {
    it("matches by canonical role name", () => {
      expect(roleFromUserType("Admin")).toBe("Admin");
      expect(roleFromUserType("Guest")).toBe("Guest");
    });

    it("matches by the old app's display label", () => {
      expect(roleFromUserType("Location's User")).toBe("User");
      expect(roleFromUserType("Super User")).toBe("Guest");
    });

    it("is case-insensitive", () => {
      expect(roleFromUserType("admin")).toBe("Admin");
      expect(roleFromUserType("SUPER USER")).toBe("Guest");
    });

    it("falls back to User for an unrecognized or missing value", () => {
      expect(roleFromUserType("something-else")).toBe("User");
      expect(roleFromUserType(undefined)).toBe("User");
    });
  });

  describe("roleLabel", () => {
    it("returns the display label for each canonical role", () => {
      expect(roleLabel("Admin")).toBe("Admin");
      expect(roleLabel("User")).toBe("Location's User");
      expect(roleLabel("Guest")).toBe("Super User");
    });
  });

  describe("statusFromApi", () => {
    it("treats any value starting with 'a' as Active", () => {
      expect(statusFromApi("a")).toBe("Active");
      expect(statusFromApi("Active")).toBe("Active");
      expect(statusFromApi("ACTIVE")).toBe("Active");
    });

    it("treats everything else, including missing, as In-Active", () => {
      expect(statusFromApi("i")).toBe("In-Active");
      expect(statusFromApi("In-Active")).toBe("In-Active");
      expect(statusFromApi(undefined)).toBe("In-Active");
    });
  });

  describe("apiStatusCode", () => {
    it("maps Active/In-Active to the backend's a/i codes", () => {
      expect(apiStatusCode("Active")).toBe("a");
      expect(apiStatusCode("In-Active")).toBe("i");
    });
  });
});
