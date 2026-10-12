import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { IconButton } from "../buttons/IconButton";

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

/** Underline tab strip — accent-colored active indicator, keyboard/focus-visible native buttons.
 * Scrolls internally (hidden native scrollbar, edge chevrons only when there's more to reveal)
 * rather than wrapping to a second line or showing a bare browser scrollbar when a caller's
 * other row content (e.g. action buttons alongside the tabs) leaves too little room for every
 * tab — same pattern as the horizontal-orientation top nav (`Sidebar.tsx`). */
export function Tabs({ items, value, onChange, className }: Readonly<TabsProps>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);
    window.addEventListener("resize", updateScrollState);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, items.length]);

  function scrollByPage(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  /** Standard tab-list keys: Left/Right step between tabs (wrapping), Home/End jump to the ends —
   * each also activates the tab it lands on. Only the active tab is in the page's Tab order (see
   * `tabIndex` below), so Tab moves past the whole strip in one keystroke instead of through
   * every tab. */
  function handleTabKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (index + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next === null) return;
    e.preventDefault();
    onChange(items[next].id);
    scrollRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  return (
    <div className={cn("relative flex min-w-0 items-center border-b border-slate-200 dark:border-slate-800", className)}>
      {canScrollLeft && (
        <div className="absolute inset-y-0 left-0 z-10 flex items-center bg-gradient-to-r from-white from-60% to-transparent pr-6 dark:from-slate-900">
          {/* Mouse-only: arrow keys on the tabs already scroll the focused tab into view. */}
          <IconButton icon={ChevronLeft} label="Scroll tabs left" variant="ghost" size="sm" tabIndex={-1} onClick={() => scrollByPage(-1)} />
        </div>
      )}
      <div
        ref={scrollRef}
        role="tablist"
        onScroll={updateScrollState}
        className={cn("no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scroll-smooth", canScrollLeft && "pl-10", canScrollRight && "pr-10")}
      >
        {items.map((item, index) => {
          const active = item.id === value;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              // Roving tabindex: only the active tab is reachable with Tab; arrows move between tabs.
              // Falls back to the first tab if `value` matches none, so the strip is never unreachable.
              tabIndex={active || (!items.some((i) => i.id === value) && index === 0) ? 0 : -1}
              onClick={() => onChange(item.id)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-medium transition focus-visible:rounded-t-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500",
                active
                  ? "border-brand-600 text-brand-700 dark:text-brand-400"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200"
              )}
            >
              {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
              {item.label}
            </button>
          );
        })}
      </div>
      {canScrollRight && (
        <div className="absolute inset-y-0 right-0 z-10 flex items-center bg-gradient-to-l from-white from-60% to-transparent pl-6 dark:from-slate-900">
          <IconButton icon={ChevronRight} label="Scroll tabs right" variant="ghost" size="sm" tabIndex={-1} onClick={() => scrollByPage(1)} />
        </div>
      )}
    </div>
  );
}

/** Simple visibility gate for a tab's content — pairs with `Tabs` when panels stay mounted. */
export function TabPanel({ active, children }: Readonly<{ active: boolean; children: ReactNode }>) {
  if (!active) return null;
  return (
    <div role="tabpanel" className="pt-6">
      {children}
    </div>
  );
}
