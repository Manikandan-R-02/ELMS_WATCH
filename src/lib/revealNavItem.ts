/**
 * Scrolls the horizontal navigation strip so `item` is fully visible, centred when possible — so a tab that
 * is cut off at either edge (or hidden under the scroll arrows) is shown whole after it is clicked, whichever
 * side it was on. Only the strip scrolls; the page itself does not move. `instant` skips the smooth animation
 * (the guided tour measures its target the moment a step starts).
 */
export function revealNavItem(item: HTMLElement | null | undefined, { instant = false }: { instant?: boolean } = {}) {
  const strip = item?.parentElement;
  if (!item || !strip || strip.scrollWidth <= strip.clientWidth) return;
  const stripRect = strip.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const delta = itemRect.left - stripRect.left - (strip.clientWidth - itemRect.width) / 2;
  if (Math.abs(delta) < 1) return;
  strip.scrollBy({ left: delta, behavior: instant ? "instant" : "smooth" });
}

/** The nav link for a route path, in whichever orientation is on screen (see `data-tour-nav` in Sidebar.tsx). */
export function navItemFor(path: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-tour-nav="${CSS.escape(path)}"]`);
}
