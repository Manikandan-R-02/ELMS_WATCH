import { describe, expect, it } from "vitest";
import { computeBillingWindow } from "./data";

describe("ItemAnalysisPage data helpers", () => {
  describe("computeBillingWindow", () => {
    it("anchors the cycle within the reference month when startDay is 1-15", () => {
      const { from, to } = computeBillingWindow(10, new Date(2026, 8, 1)); // September 2026
      expect(from).toEqual(new Date(2026, 8, 10));
      expect(to).toEqual(new Date(2026, 9, 9)); // one month later, minus a day
    });

    it("anchors the cycle in the prior month when startDay is 16-31", () => {
      const { from, to } = computeBillingWindow(25, new Date(2026, 8, 1)); // September 2026
      expect(from).toEqual(new Date(2026, 7, 25)); // August 25
      expect(to).toEqual(new Date(2026, 8, 24)); // September 24
    });

    it("clamps a start day beyond the target month's length", () => {
      // startDay 31, reference February 2026 -> prior month is January (31 days, no clamp needed)
      const { from } = computeBillingWindow(31, new Date(2026, 1, 1));
      expect(from).toEqual(new Date(2026, 0, 31));
    });

    it("clamps correctly when the prior month is shorter", () => {
      // startDay 31, reference May 2026 -> prior month April has only 30 days
      const { from } = computeBillingWindow(31, new Date(2026, 4, 1));
      expect(from).toEqual(new Date(2026, 3, 30));
    });

    it("rolls the end date into the next calendar year correctly", () => {
      const { from, to } = computeBillingWindow(20, new Date(2026, 11, 1)); // December 2026
      expect(from).toEqual(new Date(2026, 10, 20)); // November 20 (16-31 -> prior month)
      expect(to).toEqual(new Date(2026, 11, 19));
    });
  });
});
