import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { cn } from "../../lib/cn";
import { Loader } from "../loader/Loader";
import { IconButton } from "../buttons/IconButton";
import { Pagination, type PaginationProps } from "./Pagination";

/** Direction icon for a sortable header: the active direction, or a neutral icon when unsorted. */
function SortIcon({ active, direction }: Readonly<{ active: boolean; direction: SortDirection | undefined }>) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

/** The `aria-sort` value for a sortable header column. */
function ariaSortFor(active: boolean, direction: SortDirection | undefined): "ascending" | "descending" | "none" {
  if (!active) return "none";
  if (direction === "asc") return "ascending";
  return direction === "desc" ? "descending" : "none";
}

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Plain-text name for this column — not used by `Table` itself, but handy for a caller
   * building a "customize columns" menu (see `ColumnVisibilityMenu`) where `header` (often an
   * icon + styled label) isn't usable as-is. */
  label?: string;
  render?: (row: T, index: number) => ReactNode;
  accessor?: (row: T) => ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  /** Pins this column to the left edge while the table scrolls horizontally — for an ID/name
   * column the reader needs while paging through a wide table. Sticky columns must be the
   * leading columns, in order, and each needs a pixel `width` (e.g. "120px") so the next
   * sticky column's offset can be computed; the last one gets a divider shadow. */
  sticky?: boolean;
  /** Merges consecutive rows that return the same value here into one spanning cell (native
   * `rowSpan`) instead of repeating it per row — e.g. grouping several category rows under one
   * location, matching a report's original grouped layout (see `DataTrackerReportPage`'s
   * `DetailTable`, which merges its Location ID/Name/S.No columns this way). Only compares
   * *adjacent* rows in the currently displayed page, so the caller must keep same-group rows
   * next to each other (sort by the merge key, and pick a page size that's a multiple of the
   * group size so a group is never split across a page boundary). */
  mergeWith?: (row: T) => string | number;
}

export type SortDirection = "asc" | "desc" | null;

export interface TableProps<T> {
  // Pass an already-filtered array to hide columns (e.g. paired with `ColumnVisibilityMenu`,
  // rendered by the caller wherever makes sense) — `Table` itself has no visibility concept.
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  sortKey?: string | null;
  sortDirection?: SortDirection;
  onSortChange?: (key: string) => void;
  pagination?: PaginationProps;
  className?: string;
  /** "result" — a small, tightly padded table in a green pattern (header, stripes, borders) for a short
   * result/summary grid that sits under a bigger table (e.g. Daily PRJ's "PRJ Target Summary"). The default is
   * the full-size brand-blue data grid. */
  variant?: "default" | "result";
}

export function Table<T>({
  columns,
  data,
  rowKey,
  loading,
  emptyMessage = "No records found",
  onRowClick,
  sortKey,
  sortDirection,
  onSortChange,
  pagination,
  className,
  variant = "default",
}: Readonly<TableProps<T>>) {
  const result = variant === "result";
  const DEFAULT_STICKY_WIDTH = 140;
  let runningLeft = 0;
  const stickyOffsets = columns.map((col) => {
    if (!col.sticky) return null;
    const offset = runningLeft;
    runningLeft += col.width ? Number.parseInt(col.width, 10) || DEFAULT_STICKY_WIDTH : DEFAULT_STICKY_WIDTH;
    return offset;
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  // Re-check on container resize (ResizeObserver) and whenever the table's own content changes
  // shape (ResizeObserver only fires for the container's own box, not for its scrollWidth
  // changing because a column was added/removed or the row set changed).
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
  }, [updateScrollState, columns.length, data.length]);

  function scrollByPage(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  // A plain mouse wheel only ever produces vertical delta — with no visible scrollbar (see
  // `.no-scrollbar`) and a table that's often shorter than the viewport, there was no way to
  // scroll it horizontally with a mouse at all (only touch/trackpad swipe, or the edge
  // buttons). Redirects a vertical wheel gesture into horizontal scroll, but only when the
  // table actually overflows and the gesture is predominantly vertical — a trackpad's own
  // horizontal swipe (mostly deltaX) is left alone since that already scrolls natively.
  //
  // A real (non-React) listener, not React's `onWheel` prop — React registers wheel listeners
  // as passive at the root, so `preventDefault()` inside a JSX `onWheel` handler is silently
  // ignored (and logs a console error) instead of stopping the page from also scrolling
  // vertically underneath the redirected horizontal scroll.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onWheel(e: globalThis.WheelEvent) {
      if (!el || el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // For every `mergeWith` column, walk the currently displayed rows once and record each row's
  // rowSpan: the first row of a run of equal values gets the total run length, every other row in
  // that run gets 0 (skip rendering its `<td>` entirely — the run's first cell already spans down
  // over it). Plain per-render computation, not a hook — it's a cheap O(rows) pass and columns can
  // vary per render already (no rules-of-hooks concern from conditionally memoizing it).
  const mergeSpans = new Map<string, number[]>();
  for (const col of columns) {
    if (!col.mergeWith) continue;
    const spans = new Array(data.length).fill(1);
    for (let i = data.length - 1; i > 0; i--) {
      if (col.mergeWith(data[i]) === col.mergeWith(data[i - 1])) {
        spans[i - 1] += spans[i];
        spans[i] = 0;
      }
    }
    mergeSpans.set(col.key, spans);
  }

  return (
    // `rounded-md` — sharp-ish corners on purpose, not the app-wide `--app-radius` (often quite
    // round) — a dense data grid reads better with a tighter corner than a soft dashboard card.
    <div
      className={cn(
        "overflow-hidden rounded-md border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900",
        result && "w-fit max-w-full border-emerald-200 dark:border-emerald-900",
        className
      )}
    >
      {/* `relative` so the edge chevrons (only shown once there's actually more to reveal in
          that direction) can float over the table instead of taking up their own row — lets a
          reader page through wide tables with a click/tap in addition to sticky columns, the
          native drag-scroll, or trackpad/touch scrolling, all of which still work underneath. */}
      <div className="relative">
        {canScrollLeft && (
          // Pinned to the table's own left edge (not offset past the sticky columns) — floating
          // it mid-table instead reads as a stray, unexplained button sitting on top of a row.
          <div className="pointer-events-none absolute inset-y-0 left-0 z-30 flex items-center pl-1.5">
            <IconButton
              icon={ChevronLeft}
              label="Scroll table left"
              tone="brand"
              size="sm"
              className="pointer-events-auto shadow-elevated"
              onClick={() => scrollByPage(-1)}
            />
          </div>
        )}
        <div ref={scrollRef} onScroll={updateScrollState} className="no-scrollbar overflow-x-auto scroll-smooth">
          <table className="w-full text-left text-sm">
          <thead className={result ? "bg-gradient-to-r from-emerald-800 to-emerald-600" : "bg-gradient-to-r from-brand-800 to-brand-600"}>
            <tr>
              {columns.map((col, i) => (
                <th // NOSONAR - sortable header / clickable row of a real table: it must stay a th/tr, keyboard access is provided
                  key={col.key}
                  style={{
                    width: col.width,
                    // A sticky column's `left` offset (below) is computed from its declared
                    // `width` — if the actual rendered column ends up wider (e.g. a `<td>`'s
                    // content pushes it out, since plain `width` on a table cell is only a
                    // hint under the default `table-layout: auto`), every sticky column after
                    // it drifts out of alignment, opening a gap that the scrolled-past
                    // non-sticky columns show through. `minWidth`/`maxWidth` make the declared
                    // width authoritative for sticky columns specifically, so the offset math
                    // always matches what's actually on screen.
                    ...(col.sticky ? { left: stickyOffsets[i] ?? 0, minWidth: col.width, maxWidth: col.width } : {}),
                  }}
                  className={cn(
                    "select-none whitespace-nowrap border-r border-white/15 text-white last:border-r-0",
                    result ? "px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide" : "px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-wide",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.sortable &&
                      "cursor-pointer hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70",
                    // A solid fill, not the row's gradient — a sticky column only ever shows
                    // one slice of that gradient, and a slice can't reproduce a left-to-right
                    // blend, so it would show as a flat color seam against the gradient
                    // scrolling underneath anyway. `brand-700` reads as the gradient's midpoint.
                    col.sticky && "sticky z-20 overflow-hidden text-ellipsis bg-brand-700",
                    col.sticky && !columns[i + 1]?.sticky && "shadow-[2px_0_5px_-2px_rgba(0,0,0,0.25)]"
                  )}
                  onClick={() => col.sortable && onSortChange?.(col.key)}
                  // A sortable header is a click target with no equivalent keyboard access
                  // otherwise (rule 16) — `tabIndex`/`role="button"`/`onKeyDown` here match the
                  // exact contract this file already uses for a clickable `<tr>` below.
                  tabIndex={col.sortable ? 0 : undefined}
                  role={col.sortable ? "button" : undefined}
                  aria-sort={col.sortable ? ariaSortFor(sortKey === col.key, sortDirection) : undefined}
                  onKeyDown={
                    col.sortable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSortChange?.(col.key);
                          }
                        }
                      : undefined
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && <SortIcon active={sortKey === col.key} direction={sortDirection} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={result ? "divide-y divide-emerald-100 dark:divide-emerald-900/40" : "divide-y divide-slate-100 dark:divide-slate-800"}>
            {loading && (
              <tr>
                <td colSpan={columns.length} className="py-16">
                  <div className="flex justify-center">
                    <Loader />
                  </div>
                </td>
              </tr>
            )}
            {!loading && (data.length === 0) && (
              <tr>
                <td colSpan={columns.length} className="py-16">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Inbox className="h-8 w-8" />
                    <span className="text-sm">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading && data.length !== 0 && (
              data.map((row, index) => (
                <tr // NOSONAR - sortable header / clickable row of a real table: it must stay a th/tr, keyboard access is provided
                  key={rowKey(row, index)}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? "button" : undefined}
                  className={cn(
                    // Named group (`group/row`, not the bare `group`) — a cell's `render` can use
                    // `group-hover/row:` for a "reveal on row hover" affordance without colliding
                    // with a component it renders that has its own *unscoped* `group`/`group-hover:`
                    // pair (e.g. `SlideButton`'s hover-to-reveal label) — a bare `group` on both
                    // this `<tr>` and a nested `SlideButton` makes the label's reveal key off
                    // *either* being hovered, breaking the button's own hover-only behavior. Put a
                    // `TextButton` in a row action instead of a `SlideButton` for exactly this
                    // reason (see `TargetPRJ`'s action column).
                    "group/row transition-colors",
                    result
                      ? "odd:bg-white even:bg-emerald-50/70 dark:odd:bg-slate-900 dark:even:bg-emerald-500/5"
                      : "odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-800/40",
                    onRowClick &&
                      "cursor-pointer hover:bg-brand-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 dark:hover:bg-brand-500/5"
                  )}
                >
                  {columns.map((col, i) => {
                    const rowSpan = col.mergeWith ? mergeSpans.get(col.key)?.[index] : undefined;
                    if (rowSpan === 0) return null;
                    return (
                    <td
                      key={col.key}
                      rowSpan={rowSpan && rowSpan > 1 ? rowSpan : undefined}
                      // Same reasoning as the `<th>` above — without an explicit width here too,
                      // a data cell's own content (not just the header's) can push a sticky
                      // column wider than the `left` offsets were computed for.
                      style={col.sticky ? { left: stickyOffsets[i] ?? 0, width: col.width, minWidth: col.width, maxWidth: col.width } : undefined}
                      className={cn(
                        // A pinned (sticky) column has a fixed width, so a long value wraps onto a second line
                        // inside its own cell (words, or an unbroken code, break at the edge) instead of being
                        // cut off with "…". Every other column grows to fit its content on one line.
                        col.sticky ? "whitespace-normal break-words" : "whitespace-nowrap",
                        "border-r text-slate-700 last:border-r-0 dark:text-slate-200",
                        result
                          ? "border-emerald-100 px-2.5 py-1 text-xs dark:border-emerald-900/40"
                          : "border-slate-200 px-3 py-2 text-[0.8125rem] dark:border-slate-700",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        // Solid, non-striped background (not the row's translucent
                        // odd/even stripe) — a sticky cell needs to fully opaque-out
                        // whatever scrolls underneath it, and a `/60`-alpha stripe color
                        // would let that content show through.
                        col.sticky &&
                          cn(
                            "sticky z-10 bg-white align-middle dark:bg-slate-900",
                            !columns[i + 1]?.sticky && "shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]"
                          )
                      )}
                    >
                      {col.render ? col.render(row, index) : (col.accessor?.(row) ?? null)}
                    </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
        {canScrollRight && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-30 flex items-center pr-1.5">
            <IconButton
              icon={ChevronRight}
              label="Scroll table right"
              tone="brand"
              size="sm"
              className="pointer-events-auto shadow-elevated"
              onClick={() => scrollByPage(1)}
            />
          </div>
        )}
      </div>
      {pagination && <Pagination {...pagination} />}
    </div>
  );
}
