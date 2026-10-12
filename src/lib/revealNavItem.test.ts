import { describe, expect, it, vi } from "vitest";
import { revealNavItem } from "./revealNavItem";

function strip({ scrollWidth, clientWidth, itemLeft, itemWidth }: { scrollWidth: number; clientWidth: number; itemLeft: number; itemWidth: number }) {
  const el = document.createElement("div");
  const item = document.createElement("a");
  el.append(item);
  Object.defineProperty(el, "scrollWidth", { value: scrollWidth });
  Object.defineProperty(el, "clientWidth", { value: clientWidth });
  el.getBoundingClientRect = () => ({ left: 0, width: clientWidth }) as DOMRect;
  item.getBoundingClientRect = () => ({ left: itemLeft, width: itemWidth }) as DOMRect;
  el.scrollBy = vi.fn() as unknown as typeof el.scrollBy;
  return { el, item };
}

describe("revealNavItem", () => {
  it("scrolls a tab cut off on the right back to the centre", () => {
    const { el, item } = strip({ scrollWidth: 2000, clientWidth: 1000, itemLeft: 950, itemWidth: 100 });
    revealNavItem(item);
    expect(el.scrollBy).toHaveBeenCalledWith({ left: 500, behavior: "smooth" });
  });

  it("scrolls a tab cut off on the left the other way", () => {
    const { el, item } = strip({ scrollWidth: 2000, clientWidth: 1000, itemLeft: -40, itemWidth: 100 });
    revealNavItem(item, { instant: true });
    expect(el.scrollBy).toHaveBeenCalledWith({ left: -490, behavior: "instant" });
  });

  it("does nothing when the whole menu already fits", () => {
    const { el, item } = strip({ scrollWidth: 800, clientWidth: 1000, itemLeft: 700, itemWidth: 100 });
    revealNavItem(item);
    expect(el.scrollBy).not.toHaveBeenCalled();
  });
});
