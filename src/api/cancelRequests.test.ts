import { afterEach, describe, expect, it, vi } from "vitest";
import axios, { CanceledError, type AxiosAdapter } from "axios";
import axiosClient, { cancelScreenRequests, isRequestCanceled } from "./axiosClient";
import { withRetry } from "./apiHelpers";
import { useLoaderStore } from "../store/loaderStore";

/** An adapter that answers only after `ms` — and, like axios's own, rejects as soon as the request's signal aborts. */
function slowServer(ms: number) {
  const adapter: AxiosAdapter = (config) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve({ data: "late answer", status: 200, statusText: "OK", headers: {}, config }), ms);
      config.signal?.addEventListener?.("abort", () => {
        clearTimeout(timer);
        reject(new CanceledError(undefined, config));
      });
    });
  axiosClient.defaults.adapter = adapter;
}

/** Lets axios run its (asynchronous) request interceptors, i.e. the requests are really "in flight". */
const inFlight = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  cancelScreenRequests();
  useLoaderStore.setState({ activeRequests: 0, manualLoading: false, isLoading: false });
});

describe("leaving a screen cancels its requests", () => {
  it("rejects an in-flight request as cancelled, and the loader is released", async () => {
    slowServer(5000);
    const pending = axiosClient.get("/daily-prj-report");
    await inFlight();
    expect(useLoaderStore.getState().activeRequests).toBe(1);

    cancelScreenRequests();

    await expect(pending).rejects.toSatisfy(isRequestCanceled);
    expect(useLoaderStore.getState().activeRequests).toBe(0);
    expect(useLoaderStore.getState().isLoading).toBe(false);
  });

  it("cancels every request of the screen, but not the next screen's", async () => {
    slowServer(50);
    const a = axiosClient.get("/a");
    const b = axiosClient.post("/b", {});
    await inFlight();
    cancelScreenRequests();
    const next = axiosClient.get("/next-screen");

    await expect(a).rejects.toSatisfy(isRequestCanceled);
    await expect(b).rejects.toSatisfy(isRequestCanceled);
    await expect(next).resolves.toMatchObject({ data: "late answer" });
  });

  it("lets a write marked keepOnNavigation finish", async () => {
    slowServer(50);
    const save = axiosClient.post("/saveSomething", {}, { keepOnNavigation: true });
    await inFlight();
    cancelScreenRequests();
    await expect(save).resolves.toMatchObject({ data: "late answer" });
  });

  it("is not retried and not reported as a failure", async () => {
    slowServer(5000);
    const attempts = vi.fn(() => axiosClient.get("/heavy"));
    const run = withRetry(attempts, 3, 1);
    await inFlight();
    cancelScreenRequests();
    await expect(run).rejects.toSatisfy(isRequestCanceled);
    expect(attempts).toHaveBeenCalledTimes(1);
  });

  it("does not mistake an ordinary error for a cancellation", () => {
    expect(isRequestCanceled(new Error("boom"))).toBe(false);
    expect(isRequestCanceled(axios.isAxiosError)).toBe(false);
  });
});
