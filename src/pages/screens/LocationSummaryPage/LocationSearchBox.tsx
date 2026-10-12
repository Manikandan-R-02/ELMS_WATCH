import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { SearchBar } from "../../../components/search/SearchBar";
import { SearchSuggestionsList } from "../../../components/search/SearchSuggestionsList";
import { useClickOutside } from "../../../hooks/useClickOutside";
import { useSearchSuggestions } from "../../../hooks/useSearchSuggestions";
import { useApiRequest } from "../../../api/useApiRequest";
import { fetchLocationTypeOptions } from "./api";

interface LocationSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  /** Fires when a suggestion is clicked — the caller narrows the location filter to just this ID. */
  onSelectLocation: (locationId: string) => void;
  reportingMonth: Date;
}

/**
 * The filter bar's search field — collapses to a click-to-open icon ("slide" variant) on large
 * screens where the toolbar has other controls competing for space, but stays a plain
 * always-open field on small screens where there's nothing else on that row to save space
 * from and a collapsed icon would just be an extra tap. Both instances share the same
 * value/onChange so they never drift out of sync; only one is ever visible at a time.
 *
 * Typing shows a YouTube-style suggestions list of matching locations below the field —
 * clicking one narrows the whole screen to that location (via `onSelectLocation`) instead of
 * just leaving it as a text filter. Built on the same shared `useSearchSuggestions` +
 * `SearchSuggestionsList` every search-with-suggestions field in this app uses (see
 * `ResponsiveSearchBar`'s own `suggestions` prop for the plain-string version of the same
 * pattern) — reach for this pair directly, as done here, whenever a screen's suggestion rows
 * need more than a plain label (here: an icon plus an ID + name pair).
 */
export function LocationSearchBox({ value, onChange, onSelectLocation, reportingMonth }: Readonly<LocationSearchBoxProps>) {
  const wrapRef = useRef<HTMLDivElement>(null);

  // The full location list (apiIndex 0, all types), fetched once and searched client-side as
  // the user types — matches the old app's own `fetchAllLocationIds`, which this search field
  // and the filter modal's "all locations" list both draw from.
  const allLocations = useApiRequest(fetchLocationTypeOptions);
  useEffect(() => {
    allLocations.run(0, reportingMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportingMonth]);

  const locations = (allLocations.data ?? []).filter((l): l is typeof l & { id: string } => !!l.id);

  const { open, setOpen, activeIndex, setActiveIndex, visible, handleKeyDown } = useSearchSuggestions({
    query: value,
    items: locations,
    getSearchText: (l) => `${l.id} ${l.name}`,
  });
  useClickOutside(wrapRef, () => setOpen(false), open);

  function handleChange(next: string) {
    onChange(next);
    setOpen(true);
  }

  function handleSelect(loc: (typeof locations)[number]) {
    onSelectLocation(loc.id);
    onChange(loc.id);
    setOpen(false);
  }

  return (
    // `w-full` on mobile (the "normal" field genuinely needs the row) but content-sized
    // (`sm:w-auto`) from `sm:` up — this used to be `flex-1`, which stretched the wrapper to
    // fill whatever space the toolbar had left even though the collapsed "slide" icon is only
    // 36px, leaving a wide dead gap between the icon and whatever sits after it in the row.
    <div ref={wrapRef} data-tour="location-summary-search" className="relative w-full sm:w-auto">
      {/* Large screens: "Slide" — a colored icon button that opens into a field on click,
          matching the UI Preview page's SearchBar demo for this variant. */}
      <div className="hidden sm:block">
        <SearchBar
          variant="slide"
          value={value}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => handleKeyDown(e, handleSelect)}
          placeholder="Search locations..."
          width={300}
          // A `width` *style* on a flex child is still a flex-shrink target, not a floor — without
          // `shrink-0` a crowded toolbar row silently squeezes this down to an unusably narrow
          // field instead of respecting the 300px it asked for. `shrink-0` + the parent's
          // `flex-wrap` means a too-narrow row wraps the field to its own line instead.
          className="shrink-0"
        />
      </div>
      {/* Small screens: always-open field — there's no toolbar space being saved by collapsing
          it, and a second tap just to open search would be friction on mobile. */}
      <div className="sm:hidden">
        <SearchBar
          variant="normal"
          value={value}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => handleKeyDown(e, handleSelect)}
          placeholder="Search by location ID or name..."
          width="100%"
        />
      </div>

      {open && visible.length > 0 && (
        // Matches each variant's own rendered width exactly rather than the wrapper's — the
        // wrapper is a `flex-1` toolbar item and can be much wider than either field: the
        // mobile "normal" field fills it (`w-full`), but the desktop "slide" field renders at
        // a fixed 300px regardless of how wide the wrapper stretches, so `sm:w-[300px]` here
        // has to match that fixed width instead of inheriting the wrapper's.
        <SearchSuggestionsList
          items={visible}
          activeIndex={activeIndex}
          getKey={(loc) => loc.id}
          onSelect={handleSelect}
          onHover={setActiveIndex}
          className="sm:w-[300px]"
          renderItem={(loc) => (
            <>
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate">
                <span className="font-semibold text-brand-600 dark:text-brand-400">{loc.id}</span>
                <span className="text-slate-500 dark:text-slate-400"> — {loc.name}</span>
              </span>
            </>
          )}
        />
      )}
    </div>
  );
}
