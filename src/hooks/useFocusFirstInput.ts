import { useEffect, type RefObject } from "react";

/** How long to keep looking for the first input after `ready` (rows can mount a frame or two later). */
const LOOK_FOR_MS = 1500;

/** True when focus is somewhere the hook must not take it from: a field the person is typing in, or a dialog /
 * popover (a modal, the guided tour). A link or button — typically the menu item that opened this screen, which
 * keeps focus after the click — does not count. */
function focusIsBusy(active: Element | null): boolean {
  if (!active || active === document.body) return false;
  if (active.closest('[role="dialog"]')) return true;
  if (active instanceof HTMLElement && active.isContentEditable) return true;
  return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement;
}

/**
 * Puts the cursor in the first input inside `containerRef` once `ready` turns true (typically "the data has
 * loaded and the editable rows are on screen"), so a person can start typing without clicking. Runs again when
 * `ready` goes false → true (a refresh), never on other re-renders.
 *
 * The inputs may mount a frame after `ready` flips, so it looks for up to `LOOK_FOR_MS`. It never takes focus from
 * a field the person is already in, or from a dialog / the tour (see `focusIsBusy`), but it does take it from the
 * menu link they just clicked to get here. The text inside is selected so typing replaces the value.
 */
export function useFocusFirstInput(containerRef: RefObject<HTMLElement | null>, ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    const startedAt = performance.now();
    const attempt = () => {
      if (focusIsBusy(document.activeElement)) return;
      const input = containerRef.current?.querySelector<HTMLInputElement>("input:not([disabled]):not([readonly]):not([type=hidden])");
      if (input) {
        input.focus({ preventScroll: true });
        input.select();
        return;
      }
      if (performance.now() - startedAt < LOOK_FOR_MS) frame = requestAnimationFrame(attempt);
    };
    frame = requestAnimationFrame(attempt);
    return () => cancelAnimationFrame(frame);
  }, [ready, containerRef]);
}
