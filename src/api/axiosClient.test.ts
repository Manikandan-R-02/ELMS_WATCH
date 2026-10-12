import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axiosClient from "./axiosClient";
import { getToken, setToken, useAuthStore } from "../store/authStore";
import { SESSION_EXPIRED_EVENT } from "../lib/sessionEvents";

/** Makes every request fail the way axios does for an HTTP error response. */
function failWith(status: number) {
  axiosClient.defaults.adapter = async (config) => {
    throw Object.assign(new Error(`Request failed with status code ${status}`), { response: { status }, config });
  };
}

describe("axiosClient 401 handling", () => {
  const onExpired = vi.fn();

  beforeEach(() => {
    onExpired.mockReset();
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    setToken("a-token");
    useAuthStore.setState({ isLoggedIn: true, user: { id: "1", name: "A", email: "a@b.c", role: "Admin", initials: "A" }, bootstrapping: false });
  });

  afterEach(() => {
    window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    setToken(null);
  });

  it("raises the session-expired event and drops the token on a 401", async () => {
    failWith(401);
    await expect(axiosClient.get("/anything", { silent: true })).rejects.toBeDefined();

    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(getToken()).toBeNull();
  });

  it("leaves the user signed in so the session modal can show before the redirect", async () => {
    failWith(401);
    await expect(axiosClient.get("/anything", { silent: true })).rejects.toBeDefined();

    expect(useAuthStore.getState().isLoggedIn).toBe(true);
  });

  it("does nothing special for other errors", async () => {
    failWith(500);
    await expect(axiosClient.get("/anything", { silent: true })).rejects.toBeDefined();

    expect(onExpired).not.toHaveBeenCalled();
    expect(getToken()).toBe("a-token");
  });
});
