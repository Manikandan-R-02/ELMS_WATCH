import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_NUMBER_FORMAT_SETTINGS,
  formatAmount,
  formatInteger,
  formatQty,
  useNumberFormatStore,
} from "./numberFormatStore";

describe("numberFormatStore", () => {
  beforeEach(() => {
    useNumberFormatStore.setState(DEFAULT_NUMBER_FORMAT_SETTINGS);
  });

  it("formats an amount with the default en-IN grouping and 2 decimals", () => {
    expect(formatAmount(1234567.8)).toBe("12,34,567.80");
  });

  it("formats a quantity with the qty-decimal setting, independent of amountDecimals", () => {
    useNumberFormatStore.setState({ amountDecimals: 3, qtyDecimals: 0 });
    expect(formatQty(42.9)).toBe("43");
    expect(formatAmount(42.9)).toBe("42.900");
  });

  it("formats a plain count with no decimals regardless of the amount/qty settings", () => {
    useNumberFormatStore.setState({ amountDecimals: 3, qtyDecimals: 3 });
    expect(formatInteger(1500)).toBe("1,500");
  });

  it("switches grouping style when the locale setting changes", () => {
    useNumberFormatStore.setState({ locale: "en-US" });
    expect(formatAmount(1234567.8)).toBe("1,234,567.80");
  });

  it("treats null/undefined/empty-string input as zero instead of throwing", () => {
    expect(formatAmount(null as unknown as number)).toBe("0.00");
    expect(formatAmount(undefined as unknown as number)).toBe("0.00");
    expect(formatAmount("")).toBe("0.00");
  });

  it("parses a comma-formatted string back into a number before formatting", () => {
    expect(formatAmount("12,345.6")).toBe("12,345.60");
  });
});
