import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, MapPin, RotateCcw, Search, Utensils } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/cards/Card";
import { TextButton } from "../../../components/buttons/TextButton";
import { SelectSearch } from "../../../components/fields/SelectSearch";
import { DatePicker } from "../../../components/datetime/DatePicker";
import { ResponsiveSearchBar } from "../../../components/search/ResponsiveSearchBar";
import { RefreshSlideButton } from "../../../components/buttons/SlideButton";
import { RefreshRoundedButton } from "../../../components/buttons/ActionRoundedButtons";
import { usePeriodStore } from "../../../store/periodStore";
import { useApiRequest } from "../../../api/useApiRequest";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../../hooks/useRegisterScreenTour";
import { itemAnalysisTourSteps } from "../../../components/onboarding/screenSteps/itemAnalysis";
import { LocationPickerModal } from "./LocationPickerModal";
import { CategoryDistribution } from "./CategoryDistribution";
import { ItemAnalysisTable } from "./ItemAnalysisTable";
import { fetchAllLocationOptions, fetchCategoryOptions, fetchItemAnalysis, fetchSrcTypeOptions } from "./api";
import { ALL_CATEGORY, DEFAULT_ITEM_ANALYSIS_FILTER, computeBillingWindow, type ItemAnalysisFilter } from "./data";
import { HelpModal } from "../../../components/modals/HelpModal";

const USAGE_STEPS = [
  { q: "What does this screen show?", a: "One location's item-level consumption cost, broken down by category — pick a location to start." },
  { q: "How do I narrow it down?", a: 'Choose a Source Type and/or Category, optionally a specific Date, then click "Fetch". "Clear" resets all three back to everything.' },
  { q: "What's the billing window?", a: "If the location has a billing cycle configured (a start day other than the 1st), the Date field is limited to that cycle's window instead of the calendar month." },
  { q: "How do I drill into a category?", a: "Click a slice, bar, or legend row in the chart to see that category's items; click \"Back to all categories\" to return." },
];

export function ItemAnalysisPage() {
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(startTour);
  const reportingMonth = usePeriodStore((s) => s.selectedMonth);
  const [helpOpen, setHelpOpen] = useState(false);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [locationStartDay, setLocationStartDay] = useState<number | undefined>(undefined);
  // Another screen (Overall Summary's category drill-down) can send us here with `?locationId=…&category=…`: then
  // the location is already chosen, so the picker stays closed and the data loads straight away.
  const [searchParams, setSearchParams] = useSearchParams();
  const [incoming] = useState(() => ({ locationId: searchParams.get("locationId"), category: searchParams.get("category") }));
  const [pickerOpen, setPickerOpen] = useState(!incoming.locationId);
  const [filter, setFilter] = useState<ItemAnalysisFilter>(DEFAULT_ITEM_ANALYSIS_FILTER);
  const [search, setSearch] = useState("");
  const [drill, setDrill] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 250);

  const billingWindow = useMemo(
    () => (locationStartDay ? computeBillingWindow(locationStartDay, reportingMonth) : undefined),
    [locationStartDay, reportingMonth]
  );

  const categoriesReq = useApiRequest(fetchCategoryOptions);
  useEffect(() => {
    categoriesReq.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const srcTypesReq = useApiRequest(fetchSrcTypeOptions);
  useEffect(() => {
    if (!locationId) return;
    srcTypesReq.run(reportingMonth, locationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, reportingMonth]);

  const analysis = useApiRequest(fetchItemAnalysis);

  function runFetch(locId: string, f: ItemAnalysisFilter, sd: number | undefined) {
    const window = sd ? computeBillingWindow(sd, reportingMonth) : undefined;
    analysis.run({ reportingMonth, locationId: locId, filter: f, billingWindow: window });
  }

  function pickLocation(id: string, startDay?: number) {
    setLocationId(id);
    setLocationStartDay(startDay);
    setPickerOpen(false);
    setFilter(DEFAULT_ITEM_ANALYSIS_FILTER);
    setSearch("");
    runFetch(id, DEFAULT_ITEM_ANALYSIS_FILTER, startDay);
  }

  // Open on the location we were sent from. Its billing-cycle start day comes from the location list (the picker
  // would have supplied it); if that list can't be read the screen still loads, for the calendar month.
  useEffect(() => {
    const id = incoming.locationId;
    if (!id) return;
    let cancelled = false;
    async function openIncoming(locId: string) {
      setLocationId(locId); // shown in the header straight away, while the data loads
      let startDay: number | undefined;
      try {
        startDay = (await fetchAllLocationOptions(reportingMonth)).find((l) => l.id === locId)?.startDay;
      } catch {
        // No billing cycle known: the calendar month is used.
      }
      if (cancelled) return;
      const nextFilter: ItemAnalysisFilter = { ...DEFAULT_ITEM_ANALYSIS_FILTER, category: incoming.category || ALL_CATEGORY };
      setLocationId(locId);
      setLocationStartDay(startDay);
      setFilter(nextFilter);
      runFetch(locId, nextFilter, startDay);
      setSearchParams({}, { replace: true }); // the address is plain again, so a refresh keeps what is shown
    }
    void openIncoming(id);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFetch() {
    if (!locationId) return;
    runFetch(locationId, filter, locationStartDay);
  }

  function handleClear() {
    setFilter(DEFAULT_ITEM_ANALYSIS_FILTER);
    if (locationId) runFetch(locationId, DEFAULT_ITEM_ANALYSIS_FILTER, locationStartDay);
  }

  const items = useMemo(() => analysis.data?.items ?? [], [analysis.data]);
  const categories = analysis.data?.categories ?? [];

  // A fresh result (new location, Fetch, Clear, Refresh) always starts back on the all-categories chart.
  useEffect(() => setDrill(null), [analysis.data]);

  // "Show tour" (help modal) — walks every control, opening the location picker and the drilled-in chart for the
  // steps that show them. Each control sets the whole view (see `TourStep.before`), and the end hands the screen
  // back as it was when the tour started. The tour never changes the filters or fetches anything.
  function startTour() {
    const startPicker = pickerOpen;
    const startDrill = drill;
    const firstCategoryId = categories.find((c) => c.amount > 0 && items.some((i) => i.categoryId === c.categoryId))?.categoryId ?? null;
    startScreenTour(
      itemAnalysisTourSteps({
        hasLocation: !!locationId,
        hasDrill: firstCategoryId !== null,
        showPage: () => {
          setPickerOpen(false);
          setDrill(null);
        },
        openPicker: () => {
          setDrill(null);
          setPickerOpen(true);
        },
        showDrill: () => {
          setPickerOpen(false);
          setDrill(firstCategoryId);
        },
      }),
      () => {
        setPickerOpen(startPicker);
        setDrill(startDrill);
      }
    );
  }

  const rowHaystack = useMemo(() => items.map((r) => `${r.categoryId} ${r.itemId} ${r.itemName}`.toLowerCase()), [items]);
  const filteredItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter((_, i) => rowHaystack[i].includes(q));
  }, [items, rowHaystack, debouncedSearch]);
  const rowSuggestions = useMemo(() => items.map((r) => `${r.itemId} ${r.itemName}`), [items]);

  const categoryOptions = [{ label: "All Categories", value: ALL_CATEGORY }, ...(categoriesReq.data ?? []).map((c) => ({ label: c, value: c }))];
  const srcTypeOptions = [{ label: "All Source Types", value: "" }, ...(srcTypesReq.data ?? []).map((s) => ({ label: s, value: s }))];

  return (
    <div className="space-y-3">
      <PageHeader
        icon={Utensils}
        title="Item Analysis"
        dataTour="item-analysis-header"
        onHelp={() => setHelpOpen(true)}
        badge={{ icon: MapPin, label: locationId ? `Location ${locationId}` : "Select a location" }}
        actions={
          <>
            <button
              type="button"
              data-tour="item-analysis-location"
              onClick={() => setPickerOpen(true)}
              className="flex max-w-[220px] items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{locationId || "Select location"}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" />
            </button>
            {locationId && (
              <div className="flex shrink-0 items-center gap-2 sm:hidden">
                <RefreshRoundedButton label="Refresh" onClick={handleFetch} data-tour="item-analysis-refresh" />
              </div>
            )}
            {locationId && (
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <RefreshSlideButton label="Refresh" onClick={handleFetch} data-tour="item-analysis-refresh" />
              </div>
            )}
          </>
        }
      />

      {locationId ? (
        <>
          {analysis.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
              Couldn't load item analysis: {analysis.error.message}
            </div>
          )}
          {(srcTypesReq.error ?? categoriesReq.error) && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
              Couldn't load the filter lists: {(srcTypesReq.error ?? categoriesReq.error)?.message}
            </div>
          )}

          <Card padded={false} data-tour="item-analysis-filters">
            <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
              <div data-tour="item-analysis-srctype">
                <SelectSearch
                  label="Src Types"
                  options={srcTypeOptions}
                  value={filter.srcType ?? ""}
                  clearable={false}
                  searchable={srcTypeOptions.length > 8}
                  placeholder={srcTypesReq.loading ? "Loading…" : "All Source Types"}
                  portal
                  onChange={(v) => setFilter((f) => ({ ...f, srcType: v || null }))}
                />
              </div>
              <div data-tour="item-analysis-category">
                <SelectSearch
                  label="Category Lists"
                  options={categoryOptions}
                  value={filter.category}
                  clearable={false}
                  searchable={categoryOptions.length > 8}
                  placeholder={categoriesReq.loading ? "Loading…" : "All Categories"}
                  portal
                  onChange={(v) => setFilter((f) => ({ ...f, category: v ?? ALL_CATEGORY }))}
                />
              </div>
              <div data-tour="item-analysis-date">
                <DatePicker
                  label="Date"
                  value={filter.date}
                  onChange={(d) => setFilter((f) => ({ ...f, date: d }))}
                  minDate={billingWindow?.from ?? new Date(reportingMonth.getFullYear(), reportingMonth.getMonth(), 1)}
                  maxDate={billingWindow?.to ?? new Date(reportingMonth.getFullYear(), reportingMonth.getMonth() + 1, 0)}
                  helperText={locationStartDay ? `Billing day ${locationStartDay}` : undefined}
                  portal
                />
              </div>
              {/* `lg:pt-[1.625rem]` drops the buttons by one field-label's height so they line up
                  with the three inputs beside them once the grid actually puts all four in one
                  row (at `lg:`, matching the grid-cols breakpoint below) — `items-end` would
                  instead bottom-align this cell to the row's tallest sibling (Date's helper text
                  makes its cell taller), pushing the buttons noticeably below the dropdowns. */}
              <div data-tour="item-analysis-fetch" className="flex gap-2 lg:pt-[1.625rem]">
                <TextButton leadingIcon={<Search className="h-4 w-4" />} onClick={handleFetch} loading={analysis.loading} className="flex-1 lg:flex-none">
                  Fetch
                </TextButton>
                <TextButton variant="outline" tone="neutral" leadingIcon={<RotateCcw className="h-4 w-4" />} onClick={handleClear} className="flex-1 lg:flex-none">
                  Clear
                </TextButton>
              </div>
            </div>
          </Card>

          <div data-tour="item-analysis-chart">
            <CategoryDistribution categories={categories} items={items} drill={drill} onDrillChange={setDrill} />
          </div>

          <Card padded={false} data-tour="item-analysis-table">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
              <div>
                <h2 className="text-card-title">Item Details</h2>
                <p className="text-body-sm">
                  Showing {filteredItems.length} of {items.length} items{debouncedSearch ? ` matching "${debouncedSearch}"` : ""}
                </p>
              </div>
              <div data-tour="item-analysis-search">
                <ResponsiveSearchBar value={search} onChange={setSearch} placeholder="Search category, item ID, or name..." suggestions={rowSuggestions} />
              </div>
            </div>
            <div className="mx-5 mt-3 border-b border-slate-200 dark:border-slate-800" />
            <div className="px-5 pb-5 pt-4">
              <ItemAnalysisTable
                rows={filteredItems}
                loading={analysis.loading}
                emptyMessage={debouncedSearch ? "No items match your search" : "No data available"}
              />
            </div>
          </Card>
        </>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <Utensils className="h-6 w-6" />
            </span>
            <p className="text-body">Pick a location to see its item-level consumption cost breakdown.</p>
            <TextButton size="sm" onClick={() => setPickerOpen(true)}>
              Select a location
            </TextButton>
          </div>
        </Card>
      )}

      <LocationPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={pickLocation} reportingMonth={reportingMonth} />

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} onShowTour={startTour} steps={USAGE_STEPS} />
    </div>
  );
}
