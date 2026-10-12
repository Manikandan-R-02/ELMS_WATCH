let lockCount = 0;
let savedPaddingRight = "";

/**
 * Locks page scroll (Modal, CommandPalette, the mobile Sidebar drawer). Plain
 * `body.style.overflow = "hidden"` removes the scrollbar, which shrinks the
 * page's own reserved gutter and shifts every full-width element (the sticky
 * Header included) sideways by the scrollbar's width the instant it disappears
 * — very visible on Windows/Linux Chrome, Edge, and Firefox, which reserve
 * space for the scrollbar; invisible on macOS's overlay scrollbars, which is
 * why this class of bug often ships unnoticed. Compensating with an equal
 * `padding-right` cancels the shift on every browser, and does nothing (0px)
 * on platforms that don't reserve scrollbar space to begin with.
 *
 * Reference-counted so an overlapping second lock (e.g. the command palette
 * opened from inside a modal) doesn't get undone by the first one closing.
 */
export function lockScroll(): void {
  if (lockCount === 0) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    savedPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      const currentPadding = Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }
  }
  lockCount++;
}

export function unlockScroll(): void {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = "";
    document.body.style.paddingRight = savedPaddingRight;
  }
}
