import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface SearchSuggestionsListProps<T> {
  items: T[];
  activeIndex: number;
  getKey: (item: T) => string;
  onSelect: (item: T) => void;
  /** Fires on mouse-enter — keeps keyboard and mouse highlighting in sync, same as a native
   * combobox. */
  onHover: (index: number) => void;
  /** The row's own content — an icon + label is the common case, but this stays a render prop
   * so a richer row (e.g. `LocationSearchBox`'s id + name) isn't forced into one fixed shape. */
  renderItem: (item: T, active: boolean) => ReactNode;
  /** Extra classes for the dropdown panel itself — most callers only need this to set the
   * `sm:w-[...]` that matches their trigger field's own width (a "slide" field's dropdown
   * shouldn't inherit its wrapper's often-much-wider flex width). */
  className?: string;
}

/**
 * The suggestions dropdown panel shared by every search-with-suggestions field in this app —
 * pair with `useSearchSuggestions` for the filtering/keyboard-nav state behind it. This is the
 * one place that owns the dropdown's look (rounded card, `role="listbox"`, hover/active-row
 * highlight, scale-in entrance) so a future screen's search field matches `LocationSummaryPage`'s
 * and `ResponsiveSearchBar`'s existing ones automatically instead of a new one-off being
 * hand-rolled per screen.
 */
export function SearchSuggestionsList<T>({ items, activeIndex, getKey, onSelect, onHover, renderItem, className }: Readonly<SearchSuggestionsListProps<T>>) {
  return (
    <div
      className={cn(
        "absolute z-30 mt-1.5 w-full animate-scale-in overflow-hidden rounded-lg border border-slate-200 bg-white shadow-elevated dark:border-slate-700 dark:bg-slate-900",
        className
      )}
    >
      <ul>
        {items.map((item, idx) => {
          const active = idx === activeIndex;
          return (
            <li key={getKey(item)}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                onMouseEnter={() => onHover(idx)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-brand-50 dark:hover:bg-brand-500/10",
                  active && "bg-brand-50 dark:bg-brand-500/10"
                )}
              >
                {renderItem(item, active)}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
