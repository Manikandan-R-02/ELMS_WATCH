import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Everything Tab can actually land on inside `root` — skips elements hidden with `display: none`
 * (e.g. a `hidden sm:block` mobile/desktop button pair), which have no client rects. */
export function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => el.getClientRects().length > 0);
}

/** The things a person fills in or picks from: text-like inputs, textareas, native selects, and the trigger buttons
 * of the app's own dropdowns / pickers (all marked `aria-haspopup="listbox"`). Checkboxes, radios, files and
 * buttons that merely act are not "the first field". */
const FIELD_SELECTOR =
  'input:not([disabled]):not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([type="button"]), textarea:not([disabled]), select:not([disabled]), button[aria-haspopup="listbox"]:not([disabled])';

/** The first field (in reading order) inside `root` that can take focus, or null. */
export function firstFieldWithin(root: HTMLElement): HTMLElement | null {
  // `checkVisibility` (every current browser) also catches a field inside a `display: none` ancestor; without it
  // (older engines, jsdom) every matching field counts as visible.
  return Array.from(root.querySelectorAll<HTMLElement>(FIELD_SELECTOR)).find((el) => (typeof el.checkVisibility === "function" ? el.checkVisibility() : true)) ?? null;
}

const TRAP_ATTR = "data-focus-trap";

interface FocusTrapOptions {
  /** Called on Escape (unless something inside already handled it — an open dropdown's own
   * Escape stops propagation, so one Escape closes one layer at a time). */
  onEscape?: () => void;
  /** On open, focus the first input / textarea / select / dropdown inside (so the person can start typing at once)
   * instead of the container itself. A dialog without any field — a confirmation — still focuses the container. */
  focusFirstField?: boolean;
}

/**
 * Keyboard containment for any overlay that sits on top of the page (Modal, the appearance
 * drawer, the mobile nav drawer): while `active`, focus moves into `containerRef` (the container
 * itself — give it `tabIndex={-1}` — unless something inside already took focus), Tab / Shift+Tab
 * wrap around inside it instead of wandering into the page behind the backdrop, and when it
 * deactivates focus returns to whatever had it before (usually the button that opened it).
 */
export function useFocusTrap(active: boolean, containerRef: RefObject<HTMLElement | null>, { onEscape, focusFirstField }: FocusTrapOptions = {}) {
  // Held in a ref so a caller's inline `onEscape={() => ...}` (a new function every render) doesn't
  // re-run the effect below — which would re-capture "previously focused" as an element *inside*
  // the overlay and then "restore" focus there on close.
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!active) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Marks this overlay as one of ours, so a stacked overlay (a confirm opened from inside a
    // modal) knows it may take focus from it — see the check below.
    containerRef.current?.setAttribute(TRAP_ATTR, "");
    const raf = requestAnimationFrame(() => {
      const container = containerRef.current;
      const current = document.activeElement;
      if (!container || container.contains(current)) return;
      // Don't pull focus out of a *foreign* dialog in front — the onboarding tour's popover opens
      // the mobile drawer programmatically while keeping focus on its own buttons. Our own
      // overlays carry TRAP_ATTR, so a modal opened from another modal still takes focus.
      const otherDialog = current instanceof HTMLElement ? current.closest('[role="dialog"]') : null;
      if (otherDialog && otherDialog !== container && !otherDialog.hasAttribute(TRAP_ATTR)) return;
      (focusFirstField ? firstFieldWithin(container) : null)?.focus();
      if (!container.contains(document.activeElement)) container.focus();
    });

    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented) return;
      if (e.key === "Escape") {
        onEscapeRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;
      const focusables = focusableWithin(container);
      if (focusables.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables.at(-1) ?? first;
      const current = document.activeElement;
      // Focus is in some *other* layer (the onboarding tour's popover, a portaled dropdown's own
      // search box) — that layer owns Tab; never yank focus away from it.
      if (!container.contains(current)) return;
      if (current === container) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const trapped = containerRef.current;
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      trapped?.removeAttribute(TRAP_ATTR);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [active, containerRef, focusFirstField]);
}
