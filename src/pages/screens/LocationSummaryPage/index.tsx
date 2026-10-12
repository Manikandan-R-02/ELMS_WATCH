import { useScrollToSection } from "../../../hooks/useScrollToSection";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ClipboardCheck,
  FilterX,
  LayoutGrid,
  ListTree,
  MapPin,
  MapPinned,
  PackageSearch,
  PiggyBank,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { format, subMonths } from "date-fns";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/cards/Card";
import { Tabs, TabPanel } from "../../../components/common/Tabs";
import { Segmented } from "../../../components/common/Segmented";
import { LocationSearchBox } from "./LocationSearchBox";
import { Checkbox } from "../../../components/fields/Checkbox";
import { TextButton } from "../../../components/buttons/TextButton";
import { RefreshSlideButton } from "../../../components/buttons/SlideButton";
import { RefreshRoundedButton } from "../../../components/buttons/ActionRoundedButtons";
import { StatCard } from "../../../components/charts/StatCard";
import { MultiLineChartCard, BarChartCard, ComparisonChartCard } from "../../../components/charts/ChartCards";
import { MonthPicker } from "../../../components/datetime/MonthPicker";
import { MultiSelectSearch } from "../../../components/fields/MultiSelectSearch";
import { Modal } from "../../../components/modals/Modal";
import { Table, type Column } from "../../../components/table/Table";
import { ColumnVisibilityMenu } from "../../../components/table/ColumnVisibilityMenu";
import { usePeriodStore } from "../../../store/periodStore";
import { useBreadcrumbActionsStore } from "../../../store/breadcrumbActionsStore";
import { useApiRequest } from "../../../api/useApiRequest";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../../hooks/useRegisterScreenTour";
import { locationSummaryTourSteps, type LocationSummaryTab } from "../../../components/onboarding/screenSteps/locationSummary";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { LocationFilterModal, type LocationFilter } from "./LocationFilterModal";
import { InventoryModal } from "./InventoryModal";
import { SummaryTable } from "./SummaryTable";
import { MonthComparisonTable, type ComparisonMonth } from "./MonthComparisonTable";
import { DailyPrjTable, type DayRange } from "./DailyPrjTable";
import { LocationGraphs } from "./LocationGraphs";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import { monthKey, LOCATION_TYPE_LABELS } from "./data";
import { baseSummaryPayload, fetchLocationSummary, mapSummaryRow, withLocationFilter } from "./api";
import { HelpModal } from "../../../components/modals/HelpModal";

type ViewTab = LocationSummaryTab;

const TAB_ITEMS = [
  { id: "summary" as const, label: "Summary", icon: LayoutGrid },
  { id: "monthComparison" as const, label: "Month Comparison", icon: CalendarRange },
  { id: "customCompare" as const, label: "Compare Custom Months", icon: CalendarClock },
  { id: "dailyPrj" as const, label: "Daily PRJ", icon: CalendarDays },
  { id: "locationGraphs" as const, label: "Location Graphs", icon: BarChart3 },
];

const COMPARISON_RANGES = [3, 6, 9, 12] as const;
const DAY_RANGES: DayRange[] = ["1-9", "10-18", "19-25"];

// Mirrors SummaryTable's own column `key`/`label` pairs (the always-present ones — the
// 10/20/30-day columns are appended conditionally below) — kept here, not read off
// SummaryTable, so the "customize columns" trigger can live in this page's own toolbar
// instead of being pinned inside the table's card (see ColumnVisibilityMenu's doc comment for
// why: a table card's `overflow-hidden` clips a popover that lives inside it).
const SUMMARY_COLUMNS: { key: string; label: string }[] = [
  { key: "id", label: "Location ID" },
  { key: "name", label: "Location name" },
  { key: "staff", label: "Staff" },
  { key: "currentPOB", label: "Current POB" },
  { key: "ratio", label: "Staff ratio" },
  { key: "lastUpdated", label: "Last updated" },
  { key: "targetPRJ", label: "Target PRJ" },
  { key: "actual", label: "Actual" },
  { key: "delta", label: "Actual vs target" },
  { key: "totalMandays", label: "Total mandays" },
  { key: "totalCost", label: "Total cost" },
  { key: "wasteCost", label: "Waste cost" },
  { key: "inventoryValue", label: "Inventory value" },
  { key: "dio", label: "DIO" },
];

/** The location filter, moved into the page header (blue background) instead of its own card
 * below it — a translucent-white pill matching the header's existing badge/help-button
 * treatment, with a separate always-reachable clear button next to it. */
function HeaderLocationFilter({ label, active, onOpen, onClear }: Readonly<{ label: string; active: boolean; onOpen: () => void; onClear: () => void }>) {
  return (
    <div className="flex shrink-0 items-center gap-1" data-tour="location-summary-filter">
      <button
        type="button"
        onClick={onOpen}
        className="flex max-w-[220px] items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25"
      >
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" />
      </button>
      {active && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear location filter"
          title="Clear location filter"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/15 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

const USAGE_STEPS = [
  { q: "What does this screen show?", a: "Every location's staffing, mandays, cost, and waste for the reporting month selected in the header, with month-over-month and daily breakdowns." },
  { q: "How do I focus on one location or category?", a: 'Click the location pill in the top-right of the header (shows "All locations" until you narrow it) to filter by type (Segments / Contracts / O&M), category, or a specific location — or use the search field above the table to jump straight to one by ID or name.' },
  { q: "What do the summary cards at the top do?", a: "Each one is clickable, not just a number to read: \"Locations\" opens the same location filter, \"Waste cost\" opens Waste insights, \"Total cost\" opens the charts view, and \"Total POB\" / \"Total mandays\" / \"Avg cost/manday\" jump to the Summary table sorted by that figure." },
  { q: "How do I compare months?", a: 'Use the "Month Comparison" tab for the last 3–12 months relative to the reporting month, or "Compare Custom Months" to pick any base month plus any set of comparison months.' },
  { q: "How do I see a location's inventory?", a: "Click any Inventory Value figure in the Summary table to open a searchable, sortable breakdown for that location." },
  { q: "The table is wider than my screen — how do I see the rest?", a: "Location ID and Location Name stay pinned on the left as you scroll, so you always know which row you're looking at. Drag/swipe the table, or use the ‹ › buttons that appear at its edges, to see the remaining columns." },
  { q: "Where did the charts go?", a: 'The per-location charts and waste breakdown now open in a focused modal ("View charts" / "Waste insights") instead of always taking up screen space, so the table stays front and center.' },
];

export function LocationSummaryPage() {
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(startTour);
  const reportingMonth = usePeriodStore((s) => s.selectedMonth);

  // A stat-card/chart click on Overall Summary ("drill into this contract/segment/manager")
  // arrives here via router navigation state instead of the old app's localStorage handoff
  // (selectedLocationType/selectedLocationCategory/locationStateTimestamp in
  // ELmsWatch/src/views/admin/LmsDashboard/index.jsx's handleLocationClick) — React Router's
  // own per-navigation state is the idiomatic equivalent and leaves nothing stale behind.
  // Lazy `useState` initializer so this only ever seeds the *first* render, not every one.
  const location = useLocation();
  const [filter, setFilter] = useState<LocationFilter>(() => {
    const incoming = location.state as { type?: LocationFilter["type"]; category?: string } | null;
    if (incoming?.type) return { type: incoming.type, category: incoming.category ?? "", locationId: "" };
    return { type: "all", category: "", locationId: "" };
  });
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ViewTab>("summary");
  const [showTenDay, setShowTenDay] = useState(false);
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Set<string>>(new Set());
  const [comparisonRange, setComparisonRange] = useState<(typeof COMPARISON_RANGES)[number]>(3);
  const [dayRange, setDayRange] = useState<DayRange>("1-9");
  const [inventoryLocationId, setInventoryLocationId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [chartsView, setChartsView] = useState<"costWaste" | "targetActual">("costWaste");
  const [wasteInsightsOpen, setWasteInsightsOpen] = useState(false);
  const [wasteInsightsView, setWasteInsightsView] = useState<"reasons" | "topItems">("reasons");
  const [refreshKey, setRefreshKey] = useState(0);
  // Set when a stat card is clicked to "drill into" that metric — jumps to the Summary tab
  // sorted by the matching column. Keyed into SummaryTable's `key` so it remounts (and its
  // internal sort state re-initializes) each time a different card is clicked.
  const [summaryDrill, setSummaryDrill] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  // The tabs/table card a stat-card "drill" jumps to — scrolled into view below so a card
  // click's effect (switching tab + sort) is actually visible instead of silently happening
  // off-screen under the KPI strip/chart.
  const tableSection = useScrollToSection();

  function drillIntoSummary(sortKey: string) {
    setActiveTab("summary");
    setSummaryDrill({ key: sortKey, direction: "desc" });
    tableSection.request();
  }

  const [baseMonth, setBaseMonth] = useState<Date>(reportingMonth);
  const defaultCustomMonthKeys = () => [1, 2, 3].map((n) => monthKey(subMonths(reportingMonth, n).getFullYear(), subMonths(reportingMonth, n).getMonth() + 1));
  const [customMonthKeys, setCustomMonthKeys] = useState<string[]>(defaultCustomMonthKeys);

  // `baseMonth`/`customMonthKeys` are their own local state (so picking a base month inside
  // "Compare Custom Months" doesn't fight the header on every render), but they still need to
  // start from wherever the header's reporting month is — otherwise switching the header to a
  // different month leaves this tab quietly comparing against whatever month the page happened
  // to load on. Every screen and every other tab already reads `reportingMonth` directly; this
  // is the one place that copies it into local state, so it's the one place that needs to
  // re-sync when the header changes.
  useEffect(() => {
    setBaseMonth(reportingMonth);
    setCustomMonthKeys(defaultCustomMonthKeys());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportingMonth]);

  // The header Refresh button clears every filter/search/sort back to its default instead of
  // just re-running the current (possibly narrowed) view — "refresh" should mean "start over,"
  // matching what happens naturally on an actual page reload (all of this is plain component
  // state, so a real refresh already resets it for free).
  function handleRefresh() {
    setFilter({ type: "all", category: "", locationId: "" });
    setSearch("");
    setActiveTab("summary");
    setShowTenDay(false);
    setComparisonRange(3);
    setDayRange("1-9");
    setSummaryDrill(null);
    setBaseMonth(reportingMonth);
    setCustomMonthKeys(defaultCustomMonthKeys());
    setRefreshKey((k) => k + 1);
  }

  // The Summary tab's data — stats, table rows, the cost-comparison chart, and the waste
  // modal's loss-reason/top-item breakdowns all come back in one `listOfLocationSummary` call
  // (filter "Data"), same as the old app's `fetchAllData`/`updateAllStates`.
  const summary = useApiRequest(fetchLocationSummary);
  useEffect(() => {
    const payload = withLocationFilter(baseSummaryPayload(reportingMonth, "Data"), filter);
    summary.run(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportingMonth, filter, refreshKey]);

  // Slots the location search field into the top-right corner of the global breadcrumb row
  // instead of its own toolbar — cleared on unmount so it doesn't linger on whatever screen
  // is navigated to next.
  const setBreadcrumbActions = useBreadcrumbActionsStore((s) => s.setActions);
  useEffect(() => {
    setBreadcrumbActions(
      <LocationSearchBox
        value={search}
        onChange={setSearch}
        onSelectLocation={(locationId) => setFilter({ type: "all", category: "", locationId })}
        reportingMonth={reportingMonth}
      />
    );
    return () => setBreadcrumbActions(null);
  }, [search, reportingMonth, setBreadcrumbActions]);

  const filterButtonLabel = filter.locationId || filter.category || (filter.type === "all" ? "All locations" : LOCATION_TYPE_LABELS[filter.type]);
  const isFilterActive = !!filter.locationId || !!filter.category || filter.type !== "all";

  const allLocations = useMemo(() => (summary.data?.responseContents ?? []).map(mapSummaryRow), [summary.data]);
  // The location filter (type/category/specific location) is applied server-side, in the
  // request payload above — this is a client-only text search layered on top of whatever the
  // server already returned, so it only ever narrows the table, never the stat cards (those
  // reflect `responseContent`, computed by the server for the current filter).
  const searchedLocations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allLocations;
    return allLocations.filter((l) => l.id.toLowerCase().includes(q) || l.name.toLowerCase().includes(q));
  }, [allLocations, search]);

  const stats = {
    totalLocations: summary.data?.responseContent?.totalLocations ?? 0,
    totalPOB: summary.data?.responseContent?.totalPOB ?? 0,
    totalMandays: summary.data?.responseContent?.totalMandays ?? 0,
    totalCost: summary.data?.responseContent?.totalCost ?? 0,
    totalWasteCost: summary.data?.responseContent?.totalWasteCost ?? 0,
  };
  const avgCostManday = summary.data?.responseContent?.avgCostManday ?? (stats.totalMandays > 0 ? stats.totalCost / stats.totalMandays : 0);

  // Only the days the backend actually reports (non-zero current/previous), sorted — mirrors
  // the old app's `updateDailyCostMap`.
  const costSeries = useMemo(() => {
    const map = summary.data?.responseContent?.dailyCostMap ?? {};
    return Object.keys(map)
      .filter((day) => (map[day]?.current ?? 0) > 0 || (map[day]?.previous ?? 0) > 0)
      .sort((a, b) => Number(a) - Number(b))
      .map((day) => ({ day, current: map[day]?.current ?? 0, previous: map[day]?.previous ?? 0 }));
  }, [summary.data]);
  const lossReasons = useMemo(
    () => (summary.data?.responseContent?.lossReasonByweight ?? []).map((r) => ({ reason: r.lossReason ?? "Unknown", weightKg: r.sumOfWeight ?? 0 })),
    [summary.data]
  );
  const topFoodItems = useMemo(
    () =>
      [...(summary.data?.responseContent?.foodItemByweight ?? [])]
        .map((f) => ({ name: f.foodItem, weightKg: f.sumOfWeight ?? 0 }))
        .sort((a, b) => b.weightKg - a.weightKg)
        .slice(0, 8),
    [summary.data]
  );

  const costWasteByLocation = useMemo(
    () => searchedLocations.map((l) => ({ name: l.id, cost: l.totalCost, waste: l.wasteCost })),
    [searchedLocations]
  );
  const targetVsActual = useMemo(
    () => searchedLocations.map((l) => ({ name: l.id, target: l.targetPRJ, actual: l.actual })),
    [searchedLocations]
  );

  const rangeMonths: ComparisonMonth[] = useMemo(() => {
    return Array.from({ length: comparisonRange }, (_, i) => {
      const d = subMonths(reportingMonth, comparisonRange - 1 - i);
      return { key: monthKey(d.getFullYear(), d.getMonth() + 1), label: format(d, "MMM yyyy"), isBase: i === comparisonRange - 1 };
    });
  }, [reportingMonth, comparisonRange]);

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const d = subMonths(reportingMonth, i);
        return { label: format(d, "MMM yyyy"), value: monthKey(d.getFullYear(), d.getMonth() + 1) };
      }),
    [reportingMonth]
  );
  const baseKey = monthKey(baseMonth.getFullYear(), baseMonth.getMonth() + 1);
  const customMonths: ComparisonMonth[] = useMemo(() => {
    const base: ComparisonMonth = { key: baseKey, label: format(baseMonth, "MMM yyyy"), isBase: true };
    const others = customMonthKeys
      .filter((k) => k !== baseKey)
      .map((k) => monthOptions.find((o) => o.value === k))
      .filter((o): o is { label: string; value: string } => !!o)
      .map((o) => ({ key: o.value, label: o.label }));
    return [base, ...others];
  }, [baseKey, baseMonth, customMonthKeys, monthOptions]);

  // Keep in sync with SummaryTable's own conditional 10/20/30-day columns — same insertion
  // point (right after "Target PRJ") so the menu's order always matches the table's.
  const summaryColumnOptions = showTenDay
    ? [
        ...SUMMARY_COLUMNS.slice(0, 7),
        { key: "tenDay", label: "10-day" },
        { key: "twentyDay", label: "20-day" },
        { key: "thirtyDay", label: "30-day" },
        ...SUMMARY_COLUMNS.slice(7),
      ]
    : SUMMARY_COLUMNS;

  // "Show tour" (help modal) — walks every part of the screen, opening the tab/modal each step
  // needs. Each control sets the whole view (see `TourStep.before`), and `endTour` hands the
  // screen back as it was when the tour started, however the tour ended.
  function startTour() {
    const startTab = activeTab;
    const startChartsView = chartsView;
    const startWasteView = wasteInsightsView;
    const closeOverlays = () => {
      setFilterModalOpen(false);
      setInventoryLocationId(null);
      setChartsOpen(false);
      setWasteInsightsOpen(false);
    };
    const endTour = () => {
      closeOverlays();
      setActiveTab(startTab);
      setChartsView(startChartsView);
      setWasteInsightsView(startWasteView);
    };
    startScreenTour(
      locationSummaryTourSteps({
        showTab: (tab) => {
          closeOverlays();
          setActiveTab(tab);
        },
        openFilter: () => {
          closeOverlays();
          setActiveTab("summary");
          setFilterModalOpen(true);
        },
        openInventory: () => {
          closeOverlays();
          setActiveTab("summary");
          const first = searchedLocations[0];
          if (first) setInventoryLocationId(first.id);
        },
        openCharts: (view) => {
          closeOverlays();
          setActiveTab("summary");
          setChartsView(view);
          setChartsOpen(true);
        },
        openWaste: (view) => {
          closeOverlays();
          setActiveTab("summary");
          setWasteInsightsView(view);
          setWasteInsightsOpen(true);
        },
      }),
      endTour
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        icon={MapPin}
        title="Location Summary"
        dataTour="location-summary-header"
        onHelp={() => setHelpOpen(true)}
        actions={
          <>
            <HeaderLocationFilter
              label={filterButtonLabel}
              active={isFilterActive}
              onOpen={() => setFilterModalOpen(true)}
              onClear={() => setFilter({ type: "all", category: "", locationId: "" })}
            />
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <RefreshRoundedButton label="Refresh" onClick={handleRefresh} data-tour="location-summary-refresh" />
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <RefreshSlideButton onClick={handleRefresh} data-tour="location-summary-refresh" />
            </div>
          </>
        }
      />

      {/* Compact KPI strip — variant="minimal" size="xs": circular icon badge, value+label
          beside it, a colored left accent bar. `rounded-md` overrides the app-wide corner
          radius (often quite round) with a sharper, lighter corner that reads more like a
          dense report tile than a soft dashboard card. A grid (not flex-wrap) so all 6 sit on
          exactly one row from `xl:` up instead of wrapping unpredictably at odd widths.
          `StatCard`'s "minimal" variant now also gets a hover lift/tint + icon-badge scale
          when it's clickable (see StatCard.tsx) — a small affordance so it doesn't look like a
          static number. Each card is clickable — it drills into the Summary table sorted by
          that metric, or (Locations / Waste cost / Total cost) opens the filter or chart modal
          that already exists for that figure. Total cost additionally shows a real
          month-over-month trend chip (`costPercentageChange` from the API) — the only figure
          in this strip the backend gives a "vs previous period" delta for. */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6" data-tour="location-summary-stats">
        <StatCard
          label="Locations"
          value={formatQty(stats.totalLocations)}
          icon={MapPinned}
          tone="violet"
          variant="minimal"
          size="xs"
          className="rounded-md"
          onClick={() => setFilterModalOpen(true)}
        />
        <StatCard
          label="Total POB"
          value={formatQty(stats.totalPOB)}
          icon={Users}
          tone="brand"
          variant="minimal"
          size="xs"
          className="rounded-md"
          onClick={() => drillIntoSummary("currentPOB")}
        />
        <StatCard
          label="Total mandays"
          value={formatQty(stats.totalMandays)}
          icon={ClipboardCheck}
          tone="amber"
          variant="minimal"
          size="xs"
          className="rounded-md"
          onClick={() => drillIntoSummary("totalMandays")}
        />
        <StatCard
          label="Total cost"
          value={formatAmount(stats.totalCost)}
          icon={Wallet}
          tone="emerald"
          variant="minimal"
          size="xs"
          className="rounded-md"
          onClick={() => setChartsOpen(true)}
        />
        <StatCard
          label="Avg cost/manday"
          value={formatAmount(avgCostManday)}
          icon={PiggyBank}
          tone="violet"
          variant="minimal"
          size="xs"
          className="rounded-md"
          onClick={() => drillIntoSummary("totalCost")}
        />
        <StatCard
          label="Waste cost"
          value={formatAmount(stats.totalWasteCost)}
          icon={Trash2}
          tone="red"
          variant="minimal"
          size="xs"
          className="rounded-md"
          onClick={() => setWasteInsightsOpen(true)}
        />
      </div>

      <div data-tour="location-summary-chart">
        <ComparisonChartCard
          title="Cost comparison"
          subtitle={`Daily cost for ${format(reportingMonth, "MMMM yyyy")} vs. the previous month`}
          data={costSeries}
          xKey="day"
          series={[
            { key: "current", label: "Current month", color: "#2563eb" },
            { key: "previous", label: "Previous month", color: "#10b981" },
          ]}
        />
      </div>

      {/* `Card` is a plain function component (no forwardRef), so the scroll-target ref lives on
          this wrapper div instead — `scroll-mt-32` keeps the card's top edge clear of the sticky
          header area once `scrollIntoView` lands here from a stat-card click. */}
      <div ref={tableSection.ref} className="scroll-mt-32">
      <Card padded={false}>
        {/* Single row, always — Tabs now scrolls internally (edge chevrons) when the tab strip
            and the checkbox/action buttons don't both fit, instead of either wrapping to a
            second line or squeezing into a bare, easy-to-miss browser scrollbar. */}
        <div className="flex items-center gap-3 px-5 pt-5">
          <div data-tour="location-summary-tab-strip" className="min-w-0 flex-1">
            <Tabs items={TAB_ITEMS} value={activeTab} onChange={(id) => setActiveTab(id as ViewTab)} className="border-b-0" />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {/* One button that clears every active filter (location + search) at once, instead
                of making a reader hunt down the header's location-pill "x" and separately clear
                the search field. Only shown once there's actually something to clear. */}
            {(isFilterActive || !!search.trim()) && (
              <TextButton
                variant="outline"
                tone="neutral"
                size="sm"
                leadingIcon={<FilterX className="h-4 w-4" />}
                onClick={() => {
                  setFilter({ type: "all", category: "", locationId: "" });
                  setSearch("");
                }}
              >
                Clear filters
              </TextButton>
            )}
            {activeTab === "summary" && (
              <>
                <div data-tour="location-summary-columns">
                  <ColumnVisibilityMenu columns={summaryColumnOptions} hiddenKeys={hiddenColumnKeys} onChange={setHiddenColumnKeys} label="Customize visible columns" />
                </div>
                <div data-tour="location-summary-tenday" className="shrink-0">
                  <Checkbox checked={showTenDay} onChange={setShowTenDay} label="10/20/30-day columns" containerClassName="shrink-0" />
                </div>
                <TextButton
                  variant="outline"
                  size="sm"
                  leadingIcon={<BarChart3 className="h-4 w-4" />}
                  onClick={() => setChartsOpen(true)}
                  data-tour="location-summary-view-charts"
                >
                  View charts
                </TextButton>
              </>
            )}
            <TextButton
              variant="outline"
              tone="danger"
              size="sm"
              leadingIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setWasteInsightsOpen(true)}
              data-tour="location-summary-waste-button"
            >
              Waste insights
            </TextButton>
          </div>
        </div>
        <div className="mx-5 mt-3 border-b border-slate-200 dark:border-slate-800" />
        <div className="px-5 pb-5">
          <TabPanel active={activeTab === "summary"}>
            {summary.error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
                Couldn't load location summary: {summary.error.message}
              </div>
            )}
            <div data-tour="location-summary-table">
              <SummaryTable
                key={summaryDrill ? `${summaryDrill.key}-${summaryDrill.direction}` : "default"}
                data={searchedLocations}
                loading={summary.loading}
                showTenDayColumns={showTenDay}
                onOpenInventory={setInventoryLocationId}
                initialSort={summaryDrill ?? undefined}
                hiddenColumnKeys={hiddenColumnKeys}
              />
            </div>
          </TabPanel>

          <TabPanel active={activeTab === "monthComparison"}>
            <div className="space-y-4">
              <div data-tour="location-summary-month-range" className="w-fit">
                <Segmented
                  options={COMPARISON_RANGES.map((n) => ({ label: `${n} months`, value: n }))}
                  value={comparisonRange}
                  onChange={setComparisonRange}
                />
              </div>
              <div data-tour="location-summary-month-table">
                <MonthComparisonTable filter={filter} months={rangeMonths} date={reportingMonth} mode="range" />
              </div>
            </div>
          </TabPanel>

          <TabPanel active={activeTab === "customCompare"}>
            <div className="space-y-2">
              <div data-tour="location-summary-custom-pickers" className="flex flex-wrap items-end gap-3">
                <MonthPicker label="Base month" value={baseMonth} onChange={setBaseMonth} style={{ width: 200 }} />
                <MultiSelectSearch
                  label="Comparison months"
                  options={monthOptions.filter((o) => o.value !== baseKey)}
                  value={customMonthKeys.filter((k) => k !== baseKey)}
                  onChange={setCustomMonthKeys}
                  placeholder="Pick months to compare"
                  containerClassName="w-full max-w-sm"
                />
              </div>
              <div data-tour="location-summary-custom-table">
                <MonthComparisonTable filter={filter} months={customMonths} date={baseMonth} mode="custom" />
              </div>
            </div>
          </TabPanel>

          <TabPanel active={activeTab === "dailyPrj"}>
            <div className="space-y-4">
              <div data-tour="location-summary-daily-range" className="w-fit">
                <Segmented options={DAY_RANGES.map((r) => ({ label: `Day ${r}`, value: r }))} value={dayRange} onChange={setDayRange} />
              </div>
              <div data-tour="location-summary-daily-table">
                <DailyPrjTable filter={filter} reportingMonth={reportingMonth} dayRange={dayRange} />
              </div>
            </div>
          </TabPanel>

          <TabPanel active={activeTab === "locationGraphs"}>
            <div data-tour="location-summary-graphs">
              <LocationGraphs filter={filter} reportingMonth={reportingMonth} months={rangeMonths} />
            </div>
          </TabPanel>
        </div>
      </Card>
      </div>

      <LocationFilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        value={filter}
        onApply={setFilter}
        reportingMonth={reportingMonth}
      />
      <InventoryModal locationId={inventoryLocationId} onClose={() => setInventoryLocationId(null)} reportingMonth={reportingMonth} />

      <Modal
        open={chartsOpen}
        onClose={() => setChartsOpen(false)}
        size="2xl"
        title="Summary charts"
        icon={
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <BarChart3 className="h-[1.375rem] w-[1.375rem]" />
          </span>
        }
        accentClassName="bg-brand-500"
      >
        <div data-tour="location-summary-charts-modal">
          {/* One chart at a time instead of stacking both — a modal that's already scrolling
              from the chart above it doesn't need a second full chart pushing it further. */}
          <Tabs
            items={[
              { id: "costWaste", label: "Cost & waste", icon: Wallet },
              { id: "targetActual", label: "Actual vs. target", icon: TrendingUp },
            ]}
            value={chartsView}
            onChange={(id) => setChartsView(id as typeof chartsView)}
          />
          <div className="pt-4">
            {chartsView === "costWaste" ? (
              <BarChartCard
                title="Cost & waste by location"
                data={costWasteByLocation}
                series={[
                  { key: "cost", label: "Cost", color: "#2563eb" },
                  { key: "waste", label: "Waste", color: "#f97316" },
                ]}
              />
            ) : (
              <MultiLineChartCard
                title="Actual vs. target by location"
                data={targetVsActual}
                series={[
                  { key: "target", label: "Target", color: "#2563eb" },
                  { key: "actual", label: "Actual", color: "#10b981" },
                ]}
              />
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={wasteInsightsOpen}
        onClose={() => setWasteInsightsOpen(false)}
        size="2xl"
        title="Waste insights"
        icon={
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <Trash2 className="h-[1.375rem] w-[1.375rem]" />
          </span>
        }
        accentClassName="bg-red-500"
      >
        <div data-tour="location-summary-waste-modal">
          <Tabs
            items={[
              { id: "reasons", label: "Loss Reason by Weight", icon: ListTree },
              { id: "topItems", label: "Top Wasted Food Items", icon: PackageSearch },
            ]}
            value={wasteInsightsView}
            onChange={(id) => setWasteInsightsView(id as typeof wasteInsightsView)}
          />
          <div className="pt-4">
            {wasteInsightsView === "reasons" ? (
              <LossReasonTable data={lossReasons} />
            ) : (
              <BarChartCard title="Top Wasted Food Items" subtitle="By weight (kg)" data={topFoodItems.map((f) => ({ name: f.name, weight: f.weightKg }))} dataKey="weight" />
            )}
          </div>
        </div>
      </Modal>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} onShowTour={startTour} steps={USAGE_STEPS} />
    </div>
  );
}

/** Column headers match the old app's "Loss Reason by Weight" table exactly
 * (LmsSummary/index.jsx) — "Loss Reason" / "Weight (KG)". */
function LossReasonTable({ data }: Readonly<{ data: { reason: string; weightKg: number }[] }>) {
  const columns: Column<(typeof data)[number]>[] = [
    { key: "reason", header: <HeaderLabel icon={TrendingUp} label="Loss Reason" />, accessor: (r) => r.reason },
    { key: "weightKg", header: <HeaderLabel icon={Trash2} label="Weight (KG)" />, align: "right", render: (r) => <span className="font-semibold text-red-600 dark:text-red-400">{formatQty(r.weightKg)}</span> },
  ];
  return <Table columns={columns} data={data} rowKey={(r) => r.reason} emptyMessage="No loss-reason data available." />;
}
