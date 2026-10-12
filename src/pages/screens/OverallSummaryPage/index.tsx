import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  Hash,
  LayoutDashboard,
  ListTree,
  MapPinned,
  PackageSearch,
  Percent,
  PieChart,
  PiggyBank,
  Tag,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/cards/Card";
import { Tabs, TabPanel } from "../../../components/common/Tabs";
import { Segmented } from "../../../components/common/Segmented";
import { ResponsiveSearchBar } from "../../../components/search/ResponsiveSearchBar";
import { RefreshSlideButton } from "../../../components/buttons/SlideButton";
import { RefreshRoundedButton } from "../../../components/buttons/ActionRoundedButtons";
import { TextButton } from "../../../components/buttons/TextButton";
import { StatCard } from "../../../components/charts/StatCard";
import { BarChartCard, ComparisonChartCard, DistributionChartCard } from "../../../components/charts/ChartCards";
import { Modal } from "../../../components/modals/Modal";
import { Table, type Column } from "../../../components/table/Table";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import { Loader } from "../../../components/loader/Loader";
import { usePeriodStore } from "../../../store/periodStore";
import { useApiRequest } from "../../../api/useApiRequest";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../../hooks/useRegisterScreenTour";
import { useScrollToSection } from "../../../hooks/useScrollToSection";
import { overallSummaryTourSteps, type WasteInsightsView } from "../../../components/onboarding/screenSteps/overallSummary";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { ROUTES } from "../../../routes/paths";
import type { LocationType } from "../LocationSummaryPage/data";
import { OVERALL_VIEW_LABELS, type CategoryDetailRecord, type CategoryRecord, type GroupRecord, type OverallView, type WasteLocationRecord } from "./data";
import {
  fetchCategoryDetail,
  fetchOverallSummary,
  formatDateForApi,
  mapCategoryDetailRecords,
  mapCategoryRecords,
  mapGroupRow,
  mapWasteLocationRecords,
} from "./api";
import { HelpModal } from "../../../components/modals/HelpModal";

/** Old app's `handleLocationClick`'s type mapping (LmsDashboard/index.jsx) — "manager" → "om",
 * "segment" → "segments", else "contracts" — carried over 1:1 against this screen's own
 * `OverallView` naming. */
const OVERALL_VIEW_TO_LOCATION_TYPE: Record<OverallView, LocationType> = {
  contract: "contracts",
  segment: "segments",
  operationManager: "om",
};

type ViewTab = "summary" | "categories";

const OVERALL_VIEWS: OverallView[] = ["contract", "segment", "operationManager"];

const USAGE_STEPS = [
  { q: "What does this screen show?", a: "A company-wide roll-up for the reporting month selected in the header — total locations, POB, mandays, cost and waste, broken down by Contract, Segment, or Operation Manager." },
  { q: "How do I switch the breakdown grouping?", a: 'Use the Contract / Segment / Operation Manager toggle above the Summary Overview table.' },
  { q: "What do the summary cards at the top do?", a: "Each one is clickable: Total POB / Total mandays jump to the Summary Overview table sorted by that figure, Total cost opens the Total Cost Distribution chart, and Waste cost opens Waste insights." },
  { q: "How do I jump straight to a contract, segment, or manager's locations?", a: "Click its name in the Summary Overview table, or click its slice in the Total Cost Distribution chart — both jump to Location Summary pre-filtered to it." },
  { q: "How do I see which locations drive a category's cost?", a: 'Click a row (or a slice of the pie) in "Categories by Cost" to load its per-location cost breakdown, then click a location there to jump to Item Analysis for it.' },
  { q: "How do I dig into a location's waste?", a: 'Open "Waste insights" — clicking a bar in "Top Locations by Waste Cost" jumps to Waste Cost Analysis for that location.' },
];

export function OverallSummaryPage() {
  const reportingMonth = usePeriodStore((s) => s.selectedMonth);
  const navigate = useNavigate();
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(startTour);

  const [activeTab, setActiveTab] = useState<ViewTab>("summary");
  const [view, setView] = useState<OverallView>("contract");
  const [summarySearch, setSummarySearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [wasteInsightsOpen, setWasteInsightsOpen] = useState(false);
  const [wasteInsightsView, setWasteInsightsView] = useState<WasteInsightsView>("locations");
  const [helpOpen, setHelpOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [summaryDrill, setSummaryDrill] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // The tabs card: brought into view (its top just below the sticky header) when a tab is chosen or a stat card
  // drills into the table, so the chart and table under the tab are on screen instead of below the fold.
  const tableSection = useScrollToSection();
  function drillIntoSummary(sortKey: string) {
    setActiveTab("summary");
    setSummaryDrill({ key: sortKey, direction: "desc" });
    tableSection.request();
  }

  // Old app's `handleLocationClick` (LmsDashboard/index.jsx) — clicking a name in the Summary
  // Overview table, or a slice of the Total Cost Distribution pie, jumps to Location Summary
  // pre-filtered to that contract/segment/manager. See LocationSummaryPage/index.tsx's own
  // `useState<LocationFilter>` initializer for the receiving end (router navigation state,
  // not the old app's localStorage handoff).
  function goToLocationSummary(name: string, forView: OverallView = view) {
    navigate(ROUTES.locationSummary, { state: { type: OVERALL_VIEW_TO_LOCATION_TYPE[forView], category: name } });
  }

  // Old app's category-drill-down pie's own click handler — jumps to Item Analysis for the
  // clicked location, scoped to the currently open category and reporting month.
  function goToItemAnalysis(locationId: string) {
    if (!selectedCategory) return;
    const params = new URLSearchParams({ locationId, date: formatDateForApi(reportingMonth), category: selectedCategory });
    navigate(`${ROUTES.itemAnalysis}?${params.toString()}`);
  }

  // Old app's "Top Locations by Waste Cost" bar chart's own click handler.
  function goToWasteCostAnalysis(locationId: string) {
    const params = new URLSearchParams({
      locationId,
      month: String(reportingMonth.getMonth() + 1),
      year: String(reportingMonth.getFullYear()),
    });
    navigate(`${ROUTES.wasteCostAnalysis}?${params.toString()}`);
  }

  const summary = useApiRequest(fetchOverallSummary);
  useEffect(() => {
    summary.run(reportingMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportingMonth, refreshKey]);

  function handleRefresh() {
    setActiveTab("summary");
    setView("contract");
    setSummarySearch("");
    setCategorySearch("");
    setSelectedCategory(null);
    setSummaryDrill(null);
    setRefreshKey((k) => k + 1);
  }

  const stats = {
    totalLocations: summary.data?.responseContent?.totalLocations ?? 0,
    totalPOB: summary.data?.responseContent?.totalPOB ?? 0,
    totalMandays: summary.data?.responseContent?.totalMandays ?? 0,
    totalCost: summary.data?.responseContent?.totalCost ?? 0,
    totalWasteCost: summary.data?.responseContent?.totalWasteCost ?? 0,
  };
  const avgCostManday = summary.data?.responseContent?.avgCostManday ?? (stats.totalMandays > 0 ? stats.totalCost / stats.totalMandays : 0);

  const costSeries = useMemo(() => {
    const map = summary.data?.responseContent?.dailyCostMap ?? {};
    return Object.keys(map)
      .filter((day) => (map[day]?.current ?? 0) > 0 || (map[day]?.previous ?? 0) > 0)
      .sort((a, b) => Number(a) - Number(b))
      .map((day) => ({ day, current: map[day]?.current ?? 0, previous: map[day]?.previous ?? 0 }));
  }, [summary.data]);

  const groupRowsRaw: GroupRecord[] = useMemo(() => {
    let source = summary.data?.responseContents3;
    if (view === "contract") source = summary.data?.responseContents;
    else if (view === "segment") source = summary.data?.responseContents2;
    return (source ?? []).map((r) => mapGroupRow(r, view));
  }, [summary.data, view]);

  const debouncedSummarySearch = useDebouncedValue(summarySearch, 200);
  const groupRows = useMemo(() => {
    const q = debouncedSummarySearch.trim().toLowerCase();
    if (!q) return groupRowsRaw;
    return groupRowsRaw.filter((r) => r.name.toLowerCase().includes(q));
  }, [groupRowsRaw, debouncedSummarySearch]);

  const categoryRowsRaw: CategoryRecord[] = useMemo(
    () => mapCategoryRecords(summary.data?.responseContent?.categoryListData),
    [summary.data]
  );
  const debouncedCategorySearch = useDebouncedValue(categorySearch, 200);
  const categoryRows = useMemo(() => {
    const q = debouncedCategorySearch.trim().toLowerCase();
    if (!q) return categoryRowsRaw;
    return categoryRowsRaw.filter((r) => r.category.toLowerCase().includes(q));
  }, [categoryRowsRaw, debouncedCategorySearch]);

  const wasteLocations: WasteLocationRecord[] = useMemo(
    () => mapWasteLocationRecords(summary.data?.responseContent?.wasteCostList),
    [summary.data]
  );
  const foodItems = useMemo(
    () =>
      [...(summary.data?.responseContent?.foodItemByweight ?? [])]
        .map((f) => ({ name: f.foodItem, weightKg: f.sumOfWeight ?? 0 }))
        .sort((a, b) => b.weightKg - a.weightKg)
        .slice(0, 8),
    [summary.data]
  );
  const lossReasons = useMemo(
    () => (summary.data?.responseContent?.lossReasonByweight ?? []).map((r) => ({ reason: r.lossReason ?? "Unknown", weightKg: r.sumOfWeight ?? 0 })),
    [summary.data]
  );

  const categoryDetail = useApiRequest(fetchCategoryDetail);
  const categoryDetailSection = useScrollToSection();
  function openCategoryDetail(category: string) {
    setSelectedCategory(category);
    categoryDetail.run(category, reportingMonth);
    categoryDetailSection.request();
  }

  // "Show tour" (help modal) — walks every part of the screen, opening the tab/modals each step
  // needs. Each control sets the whole view (see `TourStep.before`), and `endTour` hands the
  // screen back in its starting view however the tour ended.
  function startTour() {
    const closeModals = () => {
      setChartsOpen(false);
      setWasteInsightsOpen(false);
    };
    const showSummaryTab = () => {
      closeModals();
      setActiveTab("summary");
      setSelectedCategory(null);
    };
    const endTour = () => {
      showSummaryTab();
      setWasteInsightsView("locations");
    };
    startScreenTour(
      overallSummaryTourSteps({
        showSummaryTab,
        showCategoriesTab: () => {
          closeModals();
          setActiveTab("categories");
          setSelectedCategory(null);
        },
        openFirstCategory: () => {
          closeModals();
          setActiveTab("categories");
          const first = categoryRowsRaw[0];
          if (first) openCategoryDetail(first.category);
        },
        openCharts: () => {
          setWasteInsightsOpen(false);
          setActiveTab("summary");
          setSelectedCategory(null);
          setChartsOpen(true);
        },
        openWasteInsights: (view) => {
          setChartsOpen(false);
          setActiveTab("summary");
          setSelectedCategory(null);
          setWasteInsightsView(view);
          setWasteInsightsOpen(true);
        },
      }),
      endTour
    );
  }
  const categoryDetailRows: CategoryDetailRecord[] = useMemo(
    () => mapCategoryDetailRecords(categoryDetail.data ?? []),
    [categoryDetail.data]
  );

  return (
    <div className="space-y-3">
      <PageHeader
        icon={LayoutDashboard}
        title="Overall Summary"
        dataTour="overall-summary-header"
        onHelp={() => setHelpOpen(true)}
        actions={
          <>
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <RefreshRoundedButton label="Refresh" onClick={handleRefresh} data-tour="overall-summary-refresh" />
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <RefreshSlideButton onClick={handleRefresh} data-tour="overall-summary-refresh" />
            </div>
          </>
        }
      />

      {summary.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
          Couldn't load overall summary: {summary.error.message}
        </div>
      )}

      <div data-tour="overall-summary-stats" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Locations" value={formatQty(stats.totalLocations)} icon={MapPinned} tone="violet" variant="minimal" size="xs" className="rounded-md" />
        <StatCard
          label="Total POB"
          value={formatQty(stats.totalPOB)}
          icon={Users}
          tone="brand"
          variant="minimal"
          size="xs"
          className="rounded-md"
          onClick={() => drillIntoSummary("totalPOB")}
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
        <StatCard label="Total cost" value={formatAmount(stats.totalCost)} icon={Wallet} tone="emerald" variant="minimal" size="xs" className="rounded-md" onClick={() => setChartsOpen(true)} />
        <StatCard
          label="Avg cost/manday"
          value={formatAmount(avgCostManday)}
          icon={PiggyBank}
          tone="violet"
          variant="minimal"
          size="xs"
          className="rounded-md"
          onClick={() => drillIntoSummary("avgCostManday")}
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

      <div data-tour="overall-summary-chart">
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

      <div ref={tableSection.ref} className="scroll-mt-32">
        <Card padded={false}>
          <div className="flex items-center gap-3 px-5 pt-5">
            <div data-tour="overall-summary-tabs" className="min-w-0 flex-1">
              <Tabs
                items={[
                  { id: "summary" as const, label: "Summary Overview", icon: LayoutDashboard },
                  { id: "categories" as const, label: "Categories by Cost", icon: Tag },
                ]}
                value={activeTab}
                onChange={(id) => {
                  setActiveTab(id as ViewTab);
                  tableSection.request();
                }}
                className="border-b-0"
              />
            </div>
            <div className="hidden shrink-0 items-center gap-3 sm:flex">
              <TextButton
                variant="outline"
                size="sm"
                leadingIcon={<BarChart3 className="h-4 w-4" />}
                onClick={() => setChartsOpen(true)}
                data-tour="overall-summary-view-charts"
              >
                View charts
              </TextButton>
              <TextButton
                variant="outline"
                tone="danger"
                size="sm"
                leadingIcon={<Trash2 className="h-4 w-4" />}
                onClick={() => setWasteInsightsOpen(true)}
                data-tour="overall-summary-waste-button"
              >
                Waste insights
              </TextButton>
            </div>
          </div>
          <div className="mx-5 mt-3 border-b border-slate-200 dark:border-slate-800" />
          <div className="px-5 pb-5">
            <TabPanel active={activeTab === "summary"}>
              <div className="space-y-3">
                <div data-tour="overall-summary-filters" className="flex flex-wrap items-center justify-between gap-3">
                  <Segmented options={OVERALL_VIEWS.map((v) => ({ label: OVERALL_VIEW_LABELS[v], value: v }))} value={view} onChange={setView} />
                  <ResponsiveSearchBar
                    value={summarySearch}
                    onChange={setSummarySearch}
                    placeholder={`Search ${OVERALL_VIEW_LABELS[view].toLowerCase()}...`}
                    suggestions={groupRowsRaw.map((r) => r.name)}
                  />
                </div>
                <div data-tour="overall-summary-group-table">
                  <GroupTable
                    rows={groupRows}
                    loading={summary.loading}
                    initialSort={summaryDrill ?? undefined}
                    onNameClick={(name) => goToLocationSummary(name)}
                    key={`${view}-${summaryDrill ? summaryDrill.key + "-" + summaryDrill.direction : "default"}`}
                  />
                </div>
              </div>
            </TabPanel>

            <TabPanel active={activeTab === "categories"}>
              <div className="space-y-4">
                <div data-tour="overall-summary-categories" className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
                  {/* Selecting a slice/bar drills down exactly like clicking its table row does —
                      mirrors the old app's Highcharts "Categories by Cost" pie, whose slice click
                      handler is the same `fetchCategoryDetailData` the table row uses
                      (LmsDashboard/index.jsx). */}
                  <DistributionChartCard
                    title="Categories by Cost"
                    centerLabel="Total cost"
                    formatValue={formatAmount}
                    data={categoryRows.map((c) => ({ name: c.category, value: c.value }))}
                    onSelect={(point) => openCategoryDetail(point.name)}
                  />
                  <div className="space-y-2">
                    <div className="flex justify-end">
                      <ResponsiveSearchBar
                        value={categorySearch}
                        onChange={setCategorySearch}
                        placeholder="Search categories..."
                        suggestions={categoryRowsRaw.map((r) => r.category)}
                      />
                    </div>
                    <CategoryTable rows={categoryRows} loading={summary.loading} onSelect={openCategoryDetail} />
                  </div>
                </div>

                {selectedCategory && (
                  <div ref={categoryDetailSection.ref} data-tour="overall-summary-category-detail" className="scroll-mt-32 overflow-hidden rounded-xl border border-slate-200 shadow-soft dark:border-slate-800">
                    <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-brand-800 to-brand-600 px-4 py-3 dark:from-brand-600 dark:to-brand-500">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                          <PieChart className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">Locations for "{selectedCategory}"</p>
                          {!categoryDetail.loading && !categoryDetail.error && (
                            <p className="text-xs text-white/70">
                              {categoryDetailRows.length} location{categoryDetailRows.length === 1 ? "" : "s"} · {formatAmount(categoryDetailRows.reduce((sum, r) => sum + r.totalCost, 0))}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(null)}
                        aria-label="Close category detail"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-4">
                      {categoryDetail.loading && (
                        <div className="flex justify-center py-8">
                          <Loader />
                        </div>
                      )}
                      {!categoryDetail.loading && (categoryDetail.error) && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
                          Couldn't load category detail: {categoryDetail.error.message}
                        </div>
                      )}
                      {!categoryDetail.loading && !categoryDetail.error && (
                        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
                          {/* Old app's detail pie navigates to Item Analysis on slice click — same
                              handler as clicking a row in the table beside it. */}
                          <DistributionChartCard
                            title={`${selectedCategory} by location`}
                            centerLabel="Total cost"
                            formatValue={formatAmount}
                            data={categoryDetailRows.map((r) => ({ name: r.locationId, value: r.totalCost }))}
                            onSelect={(point) => goToItemAnalysis(point.name)}
                          />
                          <CategoryDetailTable rows={categoryDetailRows} onSelect={goToItemAnalysis} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabPanel>
          </div>
        </Card>
      </div>

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
        {/* Old app's "Total Cost Distribution" donut (LmsDashboard/index.jsx) — same
            contract/segment/manager grouping as the Summary Overview tab, so it reads as "this
            chart" for whichever view is currently selected there. Slice click jumps to Location
            Summary pre-filtered, same as clicking the table's name column. */}
        <div data-tour="overall-summary-charts-modal">
          <DistributionChartCard
            title="Total Cost Distribution"
            subtitle={`By ${OVERALL_VIEW_LABELS[view].toLowerCase()}`}
            centerLabel="Total cost"
            formatValue={formatAmount}
            data={groupRowsRaw.map((r) => ({ name: r.name, value: r.totalCost }))}
            onSelect={(point) => goToLocationSummary(point.name)}
          />
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
        <div>
          <div data-tour="overall-summary-waste-tabs">
            <Tabs
              items={[
                { id: "locations" as const, label: "Top Locations by Waste Cost", icon: MapPinned },
                { id: "foodItems" as const, label: "Top Wasted Food Items", icon: PackageSearch },
                { id: "reasons" as const, label: "Loss Reason by Weight", icon: ListTree },
              ]}
              value={wasteInsightsView}
              onChange={(id) => setWasteInsightsView(id as WasteInsightsView)}
              className="flex-nowrap overflow-x-auto"
            />
          </div>
          <div className="pt-4">
            {wasteInsightsView === "locations" && (
              <div data-tour="overall-summary-waste-locations">
                <BarChartCard
                  title="Top Locations by Waste Cost"
                  data={wasteLocations.map((w) => ({ name: w.locationId, cost: w.wastageCost }))}
                  dataKey="cost"
                  onBarClick={(point) => goToWasteCostAnalysis(point.name as string)}
                />
              </div>
            )}
            {wasteInsightsView === "foodItems" && (
              <div data-tour="overall-summary-waste-food">
                <BarChartCard title="Top Wasted Food Items" subtitle="By weight (kg)" data={foodItems.map((f) => ({ name: f.name, weight: f.weightKg }))} dataKey="weight" />
              </div>
            )}
            {wasteInsightsView === "reasons" && (
              <div data-tour="overall-summary-waste-reasons">
                <LossReasonTable data={lossReasons} />
              </div>
            )}
          </div>
        </div>
      </Modal>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} onShowTour={startTour} steps={USAGE_STEPS} />
    </div>
  );
}

function GroupTable({
  rows,
  loading,
  initialSort,
  onNameClick,
}: Readonly<{
  rows: GroupRecord[];
  loading: boolean;
  initialSort?: { key: string; direction: "asc" | "desc" };
  /** Old app's `handleLocationClick` — clicking the name (not the whole row) jumps to Location
   * Summary pre-filtered to that contract/segment/manager. */
  onNameClick: (name: string) => void;
}>) {
  const { rows: paged, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<GroupRecord>(
    rows,
    (row, key) => row[key as keyof GroupRecord],
    10,
    initialSort
  );

  const columns: Column<GroupRecord>[] = [
    {
      key: "name",
      header: <HeaderLabel icon={Building2} label="Name" />,
      sortable: true,
      render: (r) => (
        <button
          type="button"
          onClick={() => onNameClick(r.name)}
          className="text-left font-semibold text-brand-700 underline-offset-2 transition hover:text-brand-600 hover:underline dark:text-brand-400 dark:hover:text-brand-300"
        >
          {r.name}
        </button>
      ),
    },
    { key: "locationCount", header: <HeaderLabel icon={MapPinned} label="Locations" />, sortable: true, align: "right", accessor: (r) => formatQty(r.locationCount) },
    { key: "totalPOB", header: <HeaderLabel icon={Users} label="Total POB" />, sortable: true, align: "right", accessor: (r) => formatQty(r.totalPOB) },
    { key: "totalMandays", header: <HeaderLabel icon={ClipboardCheck} label="Total mandays" />, sortable: true, align: "right", accessor: (r) => formatQty(r.totalMandays) },
    { key: "totalCost", header: <HeaderLabel icon={Wallet} label="Total cost" />, sortable: true, align: "right", accessor: (r) => formatAmount(r.totalCost) },
    { key: "avgCostManday", header: <HeaderLabel icon={PiggyBank} label="Cost/manday" />, sortable: true, align: "right", accessor: (r) => formatAmount(r.avgCostManday) },
    { key: "totalWasteCost", header: <HeaderLabel icon={Trash2} label="Waste cost" />, sortable: true, align: "right", accessor: (r) => formatAmount(r.totalWasteCost) },
  ];

  return (
    <Table
      columns={columns}
      data={paged}
      rowKey={(r) => r.name}
      loading={loading}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
      pagination={pagination}
      emptyMessage="No data for the current selection."
    />
  );
}

function CategoryTable({
  rows,
  loading,
  onSelect,
}: Readonly<{
  rows: CategoryRecord[];
  loading: boolean;
  onSelect: (category: string) => void;
}>) {
  const { rows: paged, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<CategoryRecord>(
    rows,
    (row, key) => row[key as keyof CategoryRecord],
    10
  );

  const columns: Column<CategoryRecord>[] = [
    { key: "category", header: <HeaderLabel icon={Tag} label="Category" />, sortable: true, accessor: (r) => r.category },
    { key: "percentage", header: <HeaderLabel icon={Percent} label="%" />, sortable: true, align: "right", accessor: (r) => `${r.percentage.toFixed(1)}%` },
    { key: "value", header: <HeaderLabel icon={Wallet} label="Amount" />, sortable: true, align: "right", accessor: (r) => formatAmount(r.value) },
  ];

  return (
    <Table
      columns={columns}
      data={paged}
      rowKey={(r) => r.category}
      loading={loading}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
      pagination={pagination}
      onRowClick={(r) => onSelect(r.category)}
      emptyMessage="No category data for the current selection."
    />
  );
}

function CategoryDetailTable({ rows, onSelect }: Readonly<{ rows: CategoryDetailRecord[]; onSelect: (locationId: string) => void }>) {
  // Same sort+paginate pattern as every other table on this screen (GroupTable, CategoryTable)
  // — this one was left as a bare, unpaginated `<Table>` and could render 30+ rows at once with
  // no page controls, unlike the rest of the app.
  const { rows: paged, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<CategoryDetailRecord>(
    rows,
    (row, key) => row[key as keyof CategoryDetailRecord],
    10
  );

  const columns: Column<CategoryDetailRecord>[] = [
    {
      key: "locationId",
      header: <HeaderLabel icon={Hash} label="Location ID" />,
      sortable: true,
      render: (r) => (
        <button
          type="button"
          onClick={() => onSelect(r.locationId)}
          className="text-left font-semibold text-brand-700 underline-offset-2 transition hover:text-brand-600 hover:underline dark:text-brand-400 dark:hover:text-brand-300"
        >
          {r.locationId}
        </button>
      ),
    },
    { key: "percentage", header: <HeaderLabel icon={Percent} label="%" />, sortable: true, align: "right", accessor: (r) => `${r.percentage.toFixed(1)}%` },
    { key: "totalCost", header: <HeaderLabel icon={Wallet} label="Total cost" />, sortable: true, align: "right", accessor: (r) => formatAmount(r.totalCost) },
  ];
  return (
    <Table
      columns={columns}
      data={paged}
      rowKey={(r) => r.locationId}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
      pagination={pagination}
      onRowClick={(r) => onSelect(r.locationId)}
      emptyMessage="No locations for this category."
    />
  );
}

/** Column headers match the old app's "Loss Reason by Weight" table exactly
 * (LmsDashboard/index.jsx) — "Loss Reason" / "Weight (KG)". */
function LossReasonTable({ data }: Readonly<{ data: { reason: string; weightKg: number }[] }>) {
  const columns: Column<(typeof data)[number]>[] = [
    { key: "reason", header: <HeaderLabel icon={TrendingUp} label="Loss Reason" />, accessor: (r) => r.reason },
    { key: "weightKg", header: <HeaderLabel icon={Trash2} label="Weight (KG)" />, align: "right", render: (r) => <span className="font-semibold text-red-600 dark:text-red-400">{formatQty(r.weightKg)}</span> },
  ];
  return <Table columns={columns} data={data} rowKey={(r) => r.reason} emptyMessage="No loss-reason data available." />;
}
