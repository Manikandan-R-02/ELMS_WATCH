import { afterEach, describe, expect, it, vi } from "vitest";
import { clearScreenTour, getScreenTour, setScreenTour, waitForScreenTour } from "./screenTourRegistry";

afterEach(() => {
  setScreenTour(null);
  vi.useRealTimers();
});

describe("screenTourRegistry", () => {
  it("returns the screen's tour once the route is open and the screen has registered", async () => {
    const start = vi.fn();
    setTimeout(() => setScreenTour(start), 250);
    await expect(waitForScreenTour(() => true, 3000)).resolves.toBe(start);
  });

  it("gives up (null) on a screen that never registers a tour, once the route has been open a moment", async () => {
    await expect(waitForScreenTour(() => true, 4000)).resolves.toBeNull();
  }, 8000);

  it("does not take a registration while the route is still the old one", async () => {
    setScreenTour(vi.fn());
    await expect(waitForScreenTour(() => false, 400)).resolves.toBeNull();
  });

  it("clear only removes its own registration", () => {
    const a = vi.fn();
    const b = vi.fn();
    setScreenTour(b);
    clearScreenTour(a);
    expect(getScreenTour()).toBe(b);
    clearScreenTour(b);
    expect(getScreenTour()).toBeNull();
  });
});
