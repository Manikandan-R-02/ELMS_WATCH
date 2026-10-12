import { useEffect, useMemo, useState, type KeyboardEvent } from "react";

export interface UseSearchSuggestionsOptions<T> {
  /** The search field's current text — suggestions are empty whenever this is blank, so the
   * list only ever appears once the reader has actually started typing. */
  query: string;
  /** The full candidate list to filter client-side — already-loaded rows/options, never a
   * per-keystroke API call. */
  items: T[];
  /** The text matched against `query` (case-insensitive substring) for each item — e.g. a
   * location's `"${id} ${name}"`. */
  getSearchText: (item: T) => string;
  /** Caps how many matches render — a long unfiltered list would otherwise dwarf the field
   * that opened it. Default 6. */
  limit?: number;
}

/**
 * The shared "YouTube-style" typeahead behavior behind every search-with-suggestions field in
 * this app — `ResponsiveSearchBar`'s own `suggestions` prop and `LocationSearchBox` both build on
 * this instead of each hand-rolling their own open/active-index/keyboard-nav state, so every
 * future screen's search field gets the same filtering and arrow-key/Enter/Escape behavior for
 * free. Pair with `SearchSuggestionsList` for the dropdown's markup.
 *
 * The caller still owns the text input itself (any `SearchBar`/`<input>`) and the "is a
 * suggestion picked" action — this hook only tracks whether the list is open, which match is
 * highlighted, and which matches to show.
 */
export function useSearchSuggestions<T>({ query, items, getSearchText, limit = 6 }: UseSearchSuggestionsOptions<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items.filter((item) => getSearchText(item).toLowerCase().includes(q)).slice(0, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query, limit]);

  useEffect(() => setActiveIndex(0), [visible.length, query]);

  /** Wire this to the input's `onKeyDown`, passing the callback that commits a pick (usually
   * "set the field's value to this item and close the list"). */
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, onSelect: (item: T) => void) {
    if (e.key === "Escape") {
      // Same reasoning as SelectSearch.tsx's identical fix — stops this Escape from also
      // closing an ancestor modal in the same keystroke. Only while the list is actually open,
      // though: with it closed, Escape must still reach that modal so it can close.
      if (open) {
        e.stopPropagation();
        setOpen(false);
      }
      return;
    }
    if (!open || visible.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      onSelect(visible[activeIndex]);
    }
  }

  return { open, setOpen, activeIndex, setActiveIndex, visible, handleKeyDown };
}
