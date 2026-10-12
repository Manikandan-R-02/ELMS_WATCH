import { useRef, type CSSProperties } from "react";
import { Search } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { SearchSuggestionsList } from "./SearchSuggestionsList";
import { cn } from "../../lib/cn";
import { useClickOutside } from "../../hooks/useClickOutside";
import { useSearchSuggestions } from "../../hooks/useSearchSuggestions";

export interface ResponsiveSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Expanded width of the "slide" field on `sm:` and up. Default 260. */
  slideWidth?: number;
  className?: string;
  /** Matching option labels to show as a suggestions dropdown while typing — e.g. the table's
   * own row names, filtered client-side against whatever's already loaded. Built on the same
   * shared `useSearchSuggestions` + `SearchSuggestionsList` every search-with-suggestions field
   * in this app uses (see `LocationSearchBox` for the richer, object-based version of the same
   * pattern) — reach for those two directly instead of this prop if a screen's suggestions need
   * more than a plain label (an icon, a subtitle, a non-text "select" action). Clicking one
   * commits it as the search value and closes the list. Omit for a plain filter field with no
   * dropdown.
   */
  suggestions?: string[];
  /** "light" (default) is styled for a white/slate card toolbar — the usual placement. "dark" is
   * for sitting directly in an accent-colored surface (e.g. `PageHeader`'s gradient band), same
   * as the underlying `SearchBar`'s own `tone` prop (see `TargetPRJ`'s page header for the
   * reference usage placing search there instead of a card toolbar). */
  tone?: "light" | "dark";
}

/**
 * The standard search field for a screen's toolbar — collapses to a click-to-open icon ("slide"
 * variant) on `sm:` and up, where it usually sits alongside other controls competing for space,
 * but stays a plain always-open field below `sm:`. Both instances share the same
 * `value`/`onChange` so they never drift out of sync; only one is ever visible at a time.
 *
 * Pass `suggestions` to add a dropdown of matching options as the reader types — this is the
 * default "search with suggestions" building block for any new screen; only reach for
 * `useSearchSuggestions`/`SearchSuggestionsList` directly when the suggestion rows need to be
 * more than a plain string (see `LocationSearchBox`).
 */
export function ResponsiveSearchBar({ value, onChange, placeholder, slideWidth = 260, className, suggestions, tone = "light" }: Readonly<ResponsiveSearchBarProps>) {
  const hasSuggestions = suggestions !== undefined;
  const wrapRef = useRef<HTMLDivElement>(null);
  const { open, setOpen, activeIndex, setActiveIndex, visible, handleKeyDown } = useSearchSuggestions({
    query: value,
    items: suggestions ?? [],
    getSearchText: (s) => s,
  });
  useClickOutside(wrapRef, () => setOpen(false), hasSuggestions && open);

  function handleChange(next: string) {
    onChange(next);
    if (hasSuggestions) setOpen(true);
  }

  function handleSelect(option: string) {
    onChange(option);
    setOpen(false);
  }

  const showDropdown = hasSuggestions && open && visible.length > 0;

  return (
    <div ref={wrapRef} className={cn("relative w-full sm:w-auto", className)} style={{ "--rsb-slide-w": `${slideWidth}px` } as CSSProperties}>
      <div className="hidden sm:block">
        <SearchBar
          variant="slide"
          tone={tone}
          value={value}
          onChange={handleChange}
          onFocus={hasSuggestions ? () => setOpen(true) : undefined}
          onKeyDown={hasSuggestions ? (e) => handleKeyDown(e, handleSelect) : undefined}
          placeholder={placeholder}
          width={slideWidth}
          className="shrink-0"
        />
      </div>
      <div className="sm:hidden">
        <SearchBar
          variant="normal"
          tone={tone}
          value={value}
          onChange={handleChange}
          onFocus={hasSuggestions ? () => setOpen(true) : undefined}
          onKeyDown={hasSuggestions ? (e) => handleKeyDown(e, handleSelect) : undefined}
          placeholder={placeholder}
          width="100%"
        />
      </div>

      {showDropdown && (
        // Matches each variant's own rendered width (`w-full` below `sm:`, the fixed
        // `slideWidth` from `sm:` up) rather than the wrapper's, same reasoning as
        // LocationSearchBox's own dropdown.
        <SearchSuggestionsList
          items={visible}
          activeIndex={activeIndex}
          getKey={(s) => s}
          onSelect={handleSelect}
          onHover={setActiveIndex}
          className="sm:w-[var(--rsb-slide-w)]"
          renderItem={(option) => (
            <>
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate">{option}</span>
            </>
          )}
        />
      )}
    </div>
  );
}
