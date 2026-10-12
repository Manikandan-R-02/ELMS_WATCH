import { afterEach, describe, expect, it, vi } from "vitest";
import { detectBrowserInfo, fetchClientIp } from "./deviceInfo";

function setUserAgent(ua: string, platform?: string) {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(ua);
  Object.defineProperty(navigator, "userAgentData", { value: platform ? { platform } : undefined, configurable: true });
}

describe("detectBrowserInfo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, "userAgentData");
  });

  it.each([
    ["Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537", "Chrome (Windows)"],
    ["Mozilla/5.0 (X11; Linux x86_64) Firefox/120", "Firefox (Linux)"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X) Version/17 Safari/605", "Safari (macOS)"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17) Safari/604", "Safari (iOS)"],
    ["Mozilla/5.0 (Linux; Android 14) Chrome/120", "Chrome (Android)"],
    ["Mozilla/5.0 (Windows NT 10.0; Trident/7.0)", "Internet Explorer (Windows)"],
    ["SomethingElse/1.0", "Unknown (Unknown)"],
  ])("reads %s", (ua, expected) => {
    setUserAgent(ua);
    expect(detectBrowserInfo()).toBe(expected);
  });

  it("prefers the platform from userAgentData", () => {
    setUserAgent("Mozilla/5.0 Chrome/120", "Chrome OS");
    expect(detectBrowserInfo()).toBe("Chrome (Chrome OS)");
  });
});

describe("fetchClientIp", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns the ip from the lookup service", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ ip: "1.2.3.4" }) }));
    await expect(fetchClientIp()).resolves.toBe("1.2.3.4");
  });

  it("returns Unknown when the reply has no ip or the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({}) }));
    await expect(fetchClientIp()).resolves.toBe("Unknown");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(fetchClientIp()).resolves.toBe("Unknown");
  });
});
