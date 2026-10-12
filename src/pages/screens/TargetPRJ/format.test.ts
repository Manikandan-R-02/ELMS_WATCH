import { describe, expect, it } from "vitest";
import { formatTargetValue, valueKey } from "./data";

describe("TargetPRJ value helpers", () => {
  it("formats a target to three decimals, and a dash when there is none", () => {
    expect(formatTargetValue(1.5)).toBe("1.500");
    expect(formatTargetValue(0)).toBe("0.000");
    expect(formatTargetValue(null)).toBe("—");
    expect(formatTargetValue(undefined)).toBe("—");
    expect(formatTargetValue(Number.NaN)).toBe("—");
  });

  it("builds a composite key from location and PRJ ids", () => {
    expect(valueKey("L1", "P2")).toBe("L1::P2");
  });
});
