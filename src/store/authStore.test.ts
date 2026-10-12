import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/deviceInfo", () => ({
  detectBrowserInfo: () => "test-browser",
  fetchClientIp: async () => "127.0.0.1",
}));

import type { InternalAxiosRequestConfig } from "axios";
import axiosClient from "../api/axiosClient";
import { currentUserContext } from "../api/apiHelpers";
import { getToken, setToken, useAuthStore } from "./authStore";
import { usePeriodStore } from "./periodStore";

const TOKEN = "eyJhbGciOiJkaXIifQ..test-iv.test-cipher.test-tag";

/** The new backend's login response: everything under `data`, numeric ids, `authToken` in the body. */
const NEW_LOGIN_RESPONSE = {
  success: true,
  message: "Login successful.",
  data: {
    apistatusmsg: null,
    authToken: TOKEN,
    destination: "Overall Admin",
    emailId: "user@example.com",
    passwordExpiryDays: 59,
    period: "01-09-2026",
    resultPK: 2173,
    screenRights: [{ accessible: true, screenCode: "OVERALL_SUMMARY", screenName: "Overall Summary" }],
    sessionId: "579B1A6D1E85DE48CE6940318426C2DA",
    userId: 24,
    userName: "venky",
    userType: 1,
    userTypeName: "Admin",
  },
};

function mockLoginFetch(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, json: async () => body });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("authStore login (new backend response)", () => {
  beforeEach(() => {
    setToken(null);
    sessionStorage.clear();
    useAuthStore.setState({ isLoggedIn: false, user: null, bootstrapping: false });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads the user fields from `data`, stringifying the numeric ids", async () => {
    mockLoginFetch(NEW_LOGIN_RESPONSE);
    await useAuthStore.getState().login("user@example.com", "pw");

    const { user, isLoggedIn } = useAuthStore.getState();
    expect(isLoggedIn).toBe(true);
    expect(user).toMatchObject({ name: "venky", role: "Admin", userId: "24", userType: 1, resultPK: "2173" });
    // What every screen's API calls are built from.
    expect(currentUserContext()).toEqual({ userId: "24", userType: 1 });
    expect(user?.screenRights).toHaveLength(1);
  });

  it("keeps `data.authToken` as the token and mirrors it to sessionStorage, never into the profile", async () => {
    mockLoginFetch(NEW_LOGIN_RESPONSE);
    await useAuthStore.getState().login("user@example.com", "pw");

    expect(getToken()).toBe(TOKEN);
    expect(sessionStorage.getItem("scm-auth-token")).toBe(TOKEN);
    expect(JSON.stringify(sessionStorage.getItem("scm-auth"))).not.toContain(TOKEN);
  });

  it("sends the login request without credentials or an Authorization header", async () => {
    const fetchMock = mockLoginFetch(NEW_LOGIN_RESPONSE);
    await useAuthStore.getState().login("user@example.com", "pw");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.credentials).toBeUndefined();
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("makes the login period the app's reporting month", async () => {
    mockLoginFetch(NEW_LOGIN_RESPONSE);
    await useAuthStore.getState().login("user@example.com", "pw");

    const month = usePeriodStore.getState().selectedMonth;
    expect([month.getFullYear(), month.getMonth(), month.getDate()]).toEqual([2026, 8, 1]);
  });

  it("rejects with the backend's message when `success` is false, and stores no token", async () => {
    mockLoginFetch({ success: false, message: "Invalid credentials" });
    await expect(useAuthStore.getState().login("user@example.com", "bad")).rejects.toThrow("Invalid credentials");

    expect(useAuthStore.getState().isLoggedIn).toBe(false);
    expect(getToken()).toBeNull();
  });

  it("still accepts the old backend's shape (statusCode 1025, fields at the top level)", async () => {
    mockLoginFetch({ statusCode: 1025, message: "Success", userId: "7", userType: 2, userName: "old", resultPK: "9" });
    await useAuthStore.getState().login("old@example.com", "pw");

    expect(useAuthStore.getState().user).toMatchObject({ userId: "7", userType: 2, name: "old" });
    expect(getToken()).toBeNull();
  });

  it("clears the token on logout", async () => {
    mockLoginFetch(NEW_LOGIN_RESPONSE);
    await useAuthStore.getState().login("user@example.com", "pw");
    useAuthStore.getState().logout();

    expect(getToken()).toBeNull();
    expect(sessionStorage.getItem("scm-auth-token")).toBeNull();
  });
});

describe("axiosClient auth header", () => {
  let seen: InternalAxiosRequestConfig | undefined;

  beforeEach(() => {
    setToken(null);
    seen = undefined;
    axiosClient.defaults.adapter = async (config) => {
      seen = config;
      return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    };
  });

  it("sends the token as a Bearer header and no credentials", async () => {
    setToken(TOKEN);
    await axiosClient.get("/anything", { silent: true });

    expect(seen?.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(seen?.withCredentials).toBeFalsy();
  });

  it("sends no Authorization header when there is no token", async () => {
    await axiosClient.get("/anything", { silent: true });

    expect(seen?.headers.Authorization).toBeUndefined();
  });
});
