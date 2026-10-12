import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";

vi.mock("../../../api/axiosClient", () => ({ default: { post: vi.fn() } }));

import axiosClient from "../../../api/axiosClient";
import { closeCurrentMonth } from "./api";

const post = vi.mocked(axiosClient.post);

function axiosErrorWith(data?: unknown, status = 500) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("Request failed", "ERR_BAD_RESPONSE", config, undefined, data === undefined ? undefined : { data, status, statusText: "", headers: {}, config });
}

describe("MonthClosingPage api", () => {
  beforeEach(() => {
    post.mockReset();
    vi.stubEnv("VITE_MONTH_CLOSING_URL", "http://103.73.189.202:5000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("posts to the month-closing service named by VITE_MONTH_CLOSING_URL, with no body", async () => {
    post.mockResolvedValue({ data: { status: "ok", new_lms_period: "2026-10-01" } });
    await closeCurrentMonth();
    expect(post).toHaveBeenCalledWith("http://103.73.189.202:5000/pull/month-closing", {}, expect.objectContaining({ headers: { Accept: "application/json" } }));
  });

  it("ignores a trailing slash on the configured address", async () => {
    vi.stubEnv("VITE_MONTH_CLOSING_URL", "http://103.73.189.202:5000/");
    post.mockResolvedValue({ data: { status: "ok" } });
    await closeCurrentMonth();
    expect(post).toHaveBeenCalledWith("http://103.73.189.202:5000/pull/month-closing", {}, expect.anything());
  });

  it("says so, without calling anything, when the address isn't configured", async () => {
    vi.stubEnv("VITE_MONTH_CLOSING_URL", "");
    await expect(closeCurrentMonth()).resolves.toEqual({
      ok: false,
      message: "Month closing isn't configured for this environment (VITE_MONTH_CLOSING_URL).",
    });
    expect(post).not.toHaveBeenCalled();
  });

  it("treats status ok with no eiis_period_update as success", async () => {
    post.mockResolvedValue({ data: { status: "ok", new_lms_period: "2026-10-01" } });
    await expect(closeCurrentMonth()).resolves.toEqual({ ok: true, newPeriod: "2026-10-01" });
  });

  it("treats status ok with eiis_period_update also ok as success", async () => {
    post.mockResolvedValue({ data: { status: "ok", new_lms_period: "2026-10-01", eiis_period_update: { status: "ok" } } });
    await expect(closeCurrentMonth()).resolves.toEqual({ ok: true, newPeriod: "2026-10-01" });
  });

  it("fails when the top-level status isn't ok", async () => {
    post.mockResolvedValue({ data: { status: "error", message: "Already closed" } });
    await expect(closeCurrentMonth()).resolves.toEqual({ ok: false, message: "Already closed" });
  });

  it("fails when eiis_period_update reports a failure even if the top-level status is ok", async () => {
    post.mockResolvedValue({ data: { status: "ok", eiis_period_update: { status: "error" } } });
    await expect(closeCurrentMonth()).resolves.toEqual({ ok: false, message: "Month closing failed. Please try again." });
  });

  it("surfaces the backend's error field on an HTTP failure", async () => {
    post.mockRejectedValue(axiosErrorWith({ error: "Server busy" }));
    await expect(closeCurrentMonth()).resolves.toEqual({ ok: false, message: "Server busy" });
  });

  it("never throws, even on a non-axios error", async () => {
    post.mockRejectedValue(new Error("socket hang up"));
    await expect(closeCurrentMonth()).resolves.toEqual({ ok: false, message: "Couldn't reach the server. Please try again." });
  });
});
