import { useEffect, useMemo, useState } from "react";
import { Filter as FilterIcon, PackageSearch, PieChart as PieChartIcon, X } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/cards/Card";
import { Segmented } from "../../../components/common/Segmented";
import { ResponsiveSearchBar } from "../../../components/search/ResponsiveSearchBar";
import { usePeriodStore } from "../../../store/periodStore";
import { useApiRequest } from "../../../api/useApiRequest";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../../hooks/useRegisterScreenTour";
import { itemBreakupTourSteps } from "../../../components/onboarding/screenSteps/itemBreakup";
import { ItemBreakupTable } from "./ItemBreakupTable";
import { ItemBreakupFilterModal } from "./ItemBreakupFilterModal";
import { fetchItemBreakup } from "./api";
import { COMPARISON_RANGE_OPTIONS, DEFAULT_ITEM_BREAKUP_FILTER, getDynamicMonths, type ComparisonRange, type ItemBreakupFilter } from "./data";
import { HelpModal } from "../../../components/modals/HelpModal";

const USAGE_STEPS = [
  { q: "What does this screen show?", a: "Every item in one category at one location, with its quantity, converted quantity (quantity × package conversion), and cost for the reporting month and however many months before it." },
  { q: "How do I pick what to see?", a: 'Click "Filters", then choose a location (optionally narrowed by type/category first) and an item category — both are required before any data loads.' },
  { q: "What does 3/6/9/12 Months do?", a: "Controls how many months of history are shown alongside the reporting month — it only changes which columns are visible, not what's fetched." },
  { q: "What is Con Qty?", a: "Converted quantity — the raw quantity multiplied by the item's package conversion factor, turning package units into consumption units." },
];

const COMPARISON_OPTIONS = COMPARISON_RANGE_OPTIONS.map((v) => ({ label: `${v} Months`, value: v }));

export function ItemBreakupPage() {
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(startTour);
  const reportingMonth = usePeriodStore((s) => s.selectedMonth);
  const [helpOpen, setHelpOpen] = useState(false);
  const [filter, setFilter] = useState<ItemBreakupFilter>(DEFAULT_ITEM_BREAKUP_FILTER);
  // Opens automatically on first visit, same as Location Insight's own location picker — the old
  // screen forced this choice before showing anything at all; this keeps that "pick a location
  // first" guidance without actually trapping the reader (Cancel/Escape/backdrop all still close
  // it, same as every other modal in this app).
  const [filterOpen, setFilterOpen] = useState(() => !DEFAULT_ITEM_BREAKUP_FILTER.locationId || !DEFAULT_ITEM_BREAKUP_FILTER.categoryId);
  const [comparisonRange, setComparisonRange] = useState<ComparisonRange>(3);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const filterActive = !!filter.locationId && !!filter.categoryId;

  const breakup = useApiRequest(fetchItemBreakup);
  useEffect(() => {
    if (!filter.locationId || !filter.categoryId) return;
    breakup.run({ reportingMonth, locationId: filter.locationId, categoryId: filter.categoryId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.locationId, filter.categoryId, reportingMonth]);

  const months = useMemo(() => getDynamicMonths(reportingMonth, comparisonRange), [reportingMonth, comparisonRange]);

  const allRows = useMemo(() => breakup.data ?? [], [breakup.data]);
  // One concatenated haystack per row (category, item id, item name) — same convention every
  // other screen's search uses, so the suggestion dropdown's entries are guaranteed to match once
  // clicked.
  const rowHaystack = useMemo(() => allRows.map((r) => `${r.categoryId} ${r.itemId} ${r.itemName}`.toLowerCase()), [allRows]);
  const filteredRows = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((_, i) => rowHaystack[i].includes(q));
  }, [allRows, rowHaystack, debouncedSearch]);
  const rowSuggestions = useMemo(() => allRows.map((r) => `${r.itemId} ${r.itemName}`), [allRows]);

  const filterSummaryLabel = filterActive ? `${filter.locationId} · ${filter.categoryId}` : "No filters applied";

  // "Show tour" (help modal) — walks every part of the screen, opening the Filters modal for the step
  // that shows it. Each control sets the whole view (see `TourStep.before`), and the end hands the
  // screen back with the modal as it was when the tour started, however the tour ended.
  function startTour() {
    const startFilterOpen = filterOpen;
    startScreenTour(
      itemBreakupTourSteps({
        hasFilter: filterActive,
        showPage: () => setFilterOpen(false),
        openFilter: () => setFilterOpen(true),
      }),
      () => setFilterOpen(startFilterOpen)
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        icon={PieChartIcon}
        title="Item Breakup"
        dataTour="item-breakup-header"
        onHelp={() => setHelpOpen(true)}
        badge={{ icon: PackageSearch, label: `${allRows.length} items` }}
      />

      <Card padded={false} data-tour="item-breakup-table">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <div>
            <h2 className="text-card-title">Item-wise Breakup</h2>
            <p className="text-body-sm">{filterActive ? "Quantity, converted quantity, and cost by month" : "Pick a location and category to see its item breakup"}</p>
          </div>
          <div className="flex items-center gap-1.5" data-tour="item-breakup-filters">
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="flex max-w-[280px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:text-brand-400"
            >
              <FilterIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{filterSummaryLabel}</span>
            </button>
            {filterActive && (
              <button
                type="button"
                onClick={() => setFilter(DEFAULT_ITEM_BREAKUP_FILTER)}
                aria-label="Clear filters"
                title="Clear filters"
                data-tour="item-breakup-clear"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="mx-5 mt-3 border-b border-slate-200 dark:border-slate-800" />
        <div className="space-y-3 px-5 pb-5 pt-4">
          {filterActive ? (
            <>
              {breakup.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
                  Couldn't load item breakup: {breakup.error.message}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div data-tour="item-breakup-months">
                  <Segmented options={COMPARISON_OPTIONS} value={comparisonRange} onChange={setComparisonRange} />
                </div>
                <div data-tour="item-breakup-search">
                  <ResponsiveSearchBar value={search} onChange={setSearch} placeholder="Search category, item ID, or name..." suggestions={rowSuggestions} />
                </div>
              </div>
              <ItemBreakupTable
                rows={filteredRows}
                months={months}
                loading={breakup.loading}
                emptyMessage={debouncedSearch ? "No items match your search" : "No data available"}
              />
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <FilterIcon className="h-6 w-6" />
              </span>
              <p className="text-body">Pick a location and category (via Filters above) to see its item breakup.</p>
            </div>
          )}
        </div>
      </Card>

      <ItemBreakupFilterModal open={filterOpen} onClose={() => setFilterOpen(false)} value={filter} onApply={setFilter} reportingMonth={reportingMonth} />

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} onShowTour={startTour} steps={USAGE_STEPS} />
    </div>
  );
}
