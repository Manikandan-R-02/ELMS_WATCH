import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLoaderStore } from "./loaderStore";
import { waitForQuiet } from "./screenTourRegistry";

describe("waitForQuiet", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useLoaderStore.setState({ activeRequests: 0, manualLoading: false, isLoading: false });
  });
  afterEach(() => vi.useRealTimers());

  it("resolves once nothing has been loading for the quiet period", async () => {
    let done = false;
    void waitForQuiet(300, 5000).then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(100);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1000);
    expect(done).toBe(true);
  });

  it("restarts the quiet period while a request is active, and gives up at the timeout", async () => {
    useLoaderStore.setState({ isLoading: true });
    let done = false;
    void waitForQuiet(300, 2000).then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(1500);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1500);
    expect(done).toBe(true);
  });
});
