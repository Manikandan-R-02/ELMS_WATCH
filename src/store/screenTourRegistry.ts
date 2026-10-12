import { useLoaderStore } from "./loaderStore";

/**
 * The mounted screen registers a function that starts its own "Show tour" (see `useRegisterScreenTour`). The
 * app-wide tour uses it to walk the menu one screen at a time: open the screen, run that screen's tour, move to
 * the next one. Only one screen is mounted at a time, so there is just one slot.
 */
let current: (() => void) | null = null;

export function setScreenTour(start: (() => void) | null) {
  current = start;
}

/** Clears the slot only if `start` is still the registered one (a newer screen may already have taken it). */
export function clearScreenTour(start: () => void) {
  if (current === start) current = null;
}

export function getScreenTour() {
  return current;
}

const POLL_MS = 100;
/** A screen without a tour never registers; once the route is open and idle for this long, stop waiting. */
const NO_TOUR_GRACE_MS = 1500;

/**
 * Waits for the screen at `path` to register its tour. Returns null if the screen turns out to have none (a
 * placeholder page), or if it never appears within `timeoutMs`.
 */
export async function waitForScreenTour(isAt: () => boolean, timeoutMs = 10000): Promise<(() => void) | null> {
  const startedAt = Date.now();
  let openSince = 0;
  while (Date.now() - startedAt < timeoutMs) {
    if (isAt()) {
      if (current) return current;
      openSince ||= Date.now();
      if (Date.now() - openSince > NO_TOUR_GRACE_MS && !useLoaderStore.getState().isLoading) return null;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  return null;
}

/** Waits until no request or route loader has been active for `quietMs` (or `timeoutMs` passes), so a screen's tour
 * starts once its data is on screen — the tour adapts to what is there (an empty list skips the detail steps). */
export async function waitForQuiet(quietMs = 500, timeoutMs = 15000) {
  const startedAt = Date.now();
  let quietSince = 0;
  while (Date.now() - startedAt < timeoutMs) {
    if (useLoaderStore.getState().isLoading) quietSince = 0;
    else {
      quietSince ||= Date.now();
      if (Date.now() - quietSince >= quietMs) return;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}
