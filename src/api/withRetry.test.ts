import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withRetry } from "./apiHelpers";

describe("withRetry", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("retries a transient failure, waiting longer each time, then returns the result", async () => {
    const fn = vi.fn().mockRejectedValueOnce({ code: "ERR_NETWORK" }).mockRejectedValueOnce({ response: { status: 503 } }).mockResolvedValue("ok");
    const promise = withRetry(fn, 3, 100);
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);
    await expect(promise).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("gives up after the last attempt with the last error", async () => {
    const fn = vi.fn().mockRejectedValue({ code: "ECONNABORTED" });
    const promise = withRetry(fn, 2, 10);
    const assertion = expect(promise).rejects.toEqual({ code: "ECONNABORTED" });
    await vi.advanceTimersByTimeAsync(50);
    await assertion;
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["a 4xx", { response: { status: 400 } }],
    ["a cancelled request", { code: "ERR_CANCELED" }],
  ])("does not retry %s", async (_label, error) => {
    const fn = vi.fn().mockRejectedValue(error);
    await expect(withRetry(fn, 3, 10)).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
