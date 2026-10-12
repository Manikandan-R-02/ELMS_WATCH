import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

export type FlipPlacement = "top" | "bottom";

interface UseFlipPositionOptions {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  /** Render the panel into document.body, fixed-positioned against the trigger. Default false. */
  portal?: boolean;
  gap?: number;
}

interface UseFlipPositionResult {
  /** Which side the panel should open on. Non-portal callers switch between
   * `top-full`/`bottom-full` Tailwind classes based on this; portal callers can ignore it and
   * just use `panelStyle`. */
  placement: FlipPlacement;
  /** Only populated when `portal` is true — a `fixed`, pixel-positioned style for a panel
   * rendered into `document.body`. Empty otherwise (non-portal panels stay `absolute` inside
   * their own `relative` trigger and only need the `placement` class swap above). */
  panelStyle: CSSProperties;
}

/**
 * Shared "flip to whichever side has more room" logic for every floating option panel
 * (SelectSearch, MultiSelectSearch, PickerShell, ColumnVisibilityMenu, ...). Prefers opening
 * below the trigger; flips above it once there isn't enough space below AND there's more room
 * above than below. Measures the panel's actual rendered height each time it opens (and on
 * scroll/resize while open), so it works for panels of any content length without a hardcoded
 * max-height assumption.
 */
// A portal panel's very first render (the instant `open` flips `true`, before this hook's
// `useLayoutEffect` has measured anything) has no `top`/`left`/`bottom` yet. `position: fixed`
// with every offset left `auto` doesn't stay invisible — per the CSS spec it falls back to the
// element's *static* position, i.e. wherever it would land in normal flow as the last child of
// `document.body`. For a page where that static position is nowhere near the trigger (common once
// the page has any real height), that one frame renders as a stray panel pinned near the top of
// the document instead of near the field — which, depending on exactly when the browser samples a
// paint relative to React's synchronous layout-effect flush, can be visible rather than a true
// single-frame flash. `visibility: hidden` (not `display: none`, which would make it unmeasurable)
// keeps the panel invisible but still layoutable until a real position has actually been computed.
const HIDDEN_UNTIL_POSITIONED: CSSProperties = { visibility: "hidden" };

export function useFlipPosition({ open, triggerRef, panelRef, portal = false, gap = 6 }: UseFlipPositionOptions): UseFlipPositionResult {
  const [placement, setPlacement] = useState<FlipPlacement>("bottom");
  const [panelStyle, setPanelStyle] = useState<CSSProperties>(HIDDEN_UNTIL_POSITIONED);

  useLayoutEffect(() => {
    if (!open) {
      // Reset so the next open never briefly shows a stale position left over from wherever the
      // trigger was the last time this panel was open, before `reposition()` runs again below.
      setPanelStyle(HIDDEN_UNTIL_POSITIONED);
      return;
    }

    function reposition() {
      const trigger = triggerRef.current;
      const panelEl = panelRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      // A trigger that hasn't actually been laid out yet (e.g. this same tick as a parent
      // re-render that just mounted it, before the browser's next layout pass) reports a
      // degenerate zero-sized rect at (0, 0) — computing a position from that pins the panel to
      // the top-left corner of the page instead of near the real field. Retry one frame later
      // instead of trusting it; the panel stays hidden (see `HIDDEN_UNTIL_POSITIONED`) until a
      // real measurement lands.
      if (rect.width === 0 && rect.height === 0) {
        requestAnimationFrame(reposition);
        return;
      }
      const panelHeight = panelEl?.offsetHeight ?? 0;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpward = spaceBelow < panelHeight + gap && spaceAbove > spaceBelow;
      setPlacement(openUpward ? "top" : "bottom");

      if (portal) {
        setPanelStyle({
          position: "fixed",
          visibility: "visible",
          left: Math.min(rect.left, window.innerWidth - rect.width - 8),
          top: openUpward ? undefined : rect.bottom + gap,
          bottom: openUpward ? window.innerHeight - rect.top + gap : undefined,
          // `w-full` in the panel's className only resolves against a sized ancestor — under a
          // portal, that's the viewport, not the trigger, so an explicit pixel width is
          // required here (inline style wins over the class either way).
          width: rect.width,
        });
      }
    }

    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, portal, gap]);

  return { placement, panelStyle };
}
