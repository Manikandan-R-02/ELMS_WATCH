import { useCallback, useEffect, useReducer, useRef } from "react";

/** The longest the page keeps re-aligning the section after the click (a slow request can take many seconds). */
const MAX_WAIT_MS = 30000;
/** Once the page has grown (the data arrived) and then stayed still this long, re-aligning stops. */
const QUIET_AFTER_GROWTH_MS = 2000;
/** How often the page height is checked while waiting. */
const POLL_MS = 150;

/** Scrolls `element` so its top sits at its own `scroll-margin-top`, if it isn't there already. */
function alignTop(element: HTMLElement, behavior: ScrollBehavior) {
  const margin = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
  if (Math.abs(element.getBoundingClientRect().top - margin) <= 4) return;
  element.scrollIntoView({ behavior, block: "start" });
}

/**
 * "Click a row, see what it opened": call `request()` from the click handler of a table row (or chart slice)
 * that opens a section further down the page, and put `ref` on that section (give it `scroll-mt-32` so the
 * sticky header doesn't cover its top). Once the section is on screen — right away if it was already there,
 * or on the render that mounts it — the page scrolls smoothly so its top is in view.
 *
 * A section that opens empty and then fills with data makes the page longer a moment later, which can leave
 * the first scroll short of the section (the page was not tall enough yet). So the hook keeps the section aligned
 * every time the page grows — however long the data takes (up to `MAX_WAIT_MS`) — and stops once the page has
 * grown and then been still for `QUIET_AFTER_GROWTH_MS`, or at once if the person scrolls, clicks or types.
 *
 * Only an explicit `request()` scrolls: a section that opens for any other reason (a filter, Refresh, the
 * guided tour, which scrolls on its own) leaves the page where it is.
 */
export function useScrollToSection<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const pending = useRef(false);
  const stopSettling = useRef<(() => void) | null>(null);
  const frameId = useRef(0);
  const [, forceRender] = useReducer((count: number) => count + 1, 0);

  // Runs after every render so a section that mounts only because of the click is found as soon as it exists.
  useEffect(() => {
    if (!pending.current || !ref.current) return;
    pending.current = false;
    const element = ref.current;

    stopSettling.current?.();
    // One frame later, so the layout (and any loader that replaced the previous content) has settled.
    // (Not cancelled when the next render happens — data arriving mid-frame must not drop the scroll.)
    frameId.current = requestAnimationFrame(() => {
      alignTop(element, "smooth");

      // Watch the page's scroll height rather than an element's size: the page body can have a fixed height (the
      // content simply overflows it), in which case nothing sized reports the growth when the data arrives.
      let lastHeight = document.documentElement.scrollHeight;
      let grewAt = 0;
      const events = ["wheel", "touchstart", "keydown", "mousedown"] as const;
      const maxTimer = setTimeout(stop, MAX_WAIT_MS);
      const poll = setInterval(() => {
        const height = document.documentElement.scrollHeight;
        if (height !== lastHeight) {
          lastHeight = height;
          grewAt = Date.now();
          const target = ref.current?.isConnected ? ref.current : element;
          if (target.isConnected) alignTop(target, "auto");
        } else if (grewAt > 0 && Date.now() - grewAt >= QUIET_AFTER_GROWTH_MS) {
          stop();
        }
      }, POLL_MS);
      function stop() {
        clearInterval(poll);
        clearTimeout(maxTimer);
        for (const name of events) globalThis.removeEventListener(name, stop);
        stopSettling.current = null;
      }
      for (const name of events) globalThis.addEventListener(name, stop, { passive: true });
      stopSettling.current = stop;
    });
  });

  useEffect(
    () => () => {
      cancelAnimationFrame(frameId.current);
      stopSettling.current?.();
    },
    []
  );

  const request = useCallback(() => {
    pending.current = true;
    forceRender(); // guarantees a render even when the click did not change any state
  }, []);

  return { ref, request };
}
