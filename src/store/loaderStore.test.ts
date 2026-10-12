import { beforeEach, describe, expect, it } from "vitest";
import { useLoaderStore } from "./loaderStore";

describe("loaderStore", () => {
  beforeEach(() => useLoaderStore.setState({ activeRequests: 0, manualLoading: false, isLoading: false }));

  it("is loading while any request is in flight and never counts below zero", () => {
    const s = useLoaderStore.getState();
    s.start();
    s.start();
    expect(useLoaderStore.getState()).toMatchObject({ activeRequests: 2, isLoading: true });
    s.stop();
    expect(useLoaderStore.getState().isLoading).toBe(true);
    s.stop();
    s.stop();
    expect(useLoaderStore.getState()).toMatchObject({ activeRequests: 0, isLoading: false });
  });

  it("stays loading while the manual flag is set, even with no requests", () => {
    const s = useLoaderStore.getState();
    s.setManualLoading(true);
    expect(useLoaderStore.getState().isLoading).toBe(true);
    s.start();
    s.stop();
    expect(useLoaderStore.getState().isLoading).toBe(true);
    s.setManualLoading(false);
    expect(useLoaderStore.getState().isLoading).toBe(false);
  });
});
