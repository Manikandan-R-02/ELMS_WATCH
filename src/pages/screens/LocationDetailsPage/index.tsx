import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format, subMonths } from "date-fns";
import {
  Boxes,
  Building2,
  CalendarRange,
  ChevronDown,
  ClipboardList,
  Layers,
  LineChart,
  MapPin,
  MapPinned,
  PackageSearch,
  Tag,
  Trash2,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/cards/Card";
import { Tabs, TabPanel } from "../../../components/common/Tabs";
import { StatCard } from "../../../components/charts/StatCard";
import { TextButton } from "../../../components/buttons/TextButton";
import { ComparisonChartCard } from "../../../components/charts/ChartCards";
import { ResponsiveSearchBar } from "../../../components/search/ResponsiveSearchBar";
import { RefreshSlideButton } from "../../../components/buttons/SlideButton";
import { RefreshRoundedButton } from "../../../components/buttons/ActionRoundedButtons";
import { usePeriodStore } from "../../../store/periodStore";
import { useApiRequest } from "../../../api/useApiRequest";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../../hooks/useRegisterScreenTour";
import { locationDetailsTourSteps, type LocationDetailsGraphTab, type LocationDetailsTab } from "../../../components/onboarding/screenSteps/locationDetails";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { LocationPickerModal } from "./LocationPickerModal";
import { SrcDataTable } from "./SrcDataTable";
import { ConsumptionTable } from "./ConsumptionTable";
import { SplitByPrjTable } from "./SplitByPrjTable";
import { ComparisonTable } from "./ComparisonTable";
import { InventoryTrendTable } from "./InventoryTrendTable";
import { InventoryModal } from "../LocationSummaryPage/InventoryModal";
import { DetailGraphs } from "./DetailGraphs";
import { monthKey } from "./data";
import { baseDetailsPayload, fetchInventoryByDate, fetchLocationDetails, formatDateForApi, mapConsumptionRow, mapSplitPrjRow, mapSrcRow } from "./api";
import { HelpModal } from "../../../components/modals/HelpModal";

type DataTab = LocationDetailsTab;

const TAB_ITEMS = [
  { id: "srcData" as const, label: "SRC Data", icon: ClipboardList },
  { id: "consumption" as const, label: "Consumption", icon: UtensilsCrossed },
  { id: "splitPrj" as const, label: "Split by PRJ", icon: Layers },
  { id: "compare" as const, label: "Consumption Compare", icon: CalendarRange },
  { id: "inventory" as const, label: "Inventory", icon: PackageSearch },
];

const USAGE_STEPS = [
  { q: "What does this screen show?", a: "One location's day-by-day cost, consumption, and inventory figures for the reporting month selected in the header — the drill-down behind every location row on Location Summary." },
  { q: "How do I pick a different location?", a: "Click the location pill in the header to search by ID/name, or narrow by type and category first." },
  { q: "What's the difference between the data tabs?", a: '"SRC Data" is the raw per-SRC-type daily figures; "Consumption" breaks the same days down by spend category; "Split by PRJ" groups cost into Food/Cleaning/Disposal/Others; "Consumption Compare" lines up categories across any months you pick; "Inventory" tracks the closing stock position over the month.' },
  { q: "How do I compare months?", a: 'Open "Consumption Compare" and pick a base month plus any comparison months — every category\'s cost and cost/manday line up side by side.' },
  { q: "Where are the charts?", a: 'The "Graphical Presentation" card below the table has its own tabs: Actual vs. Target (optionally filtered to one SRC type), a category cost breakdown donut, and the DIO (days of inventory on hand) trend.' },
];

export function LocationDetailsPage() {
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(startTour);
  const reportingMonth = usePeriodStore((s) => s.selectedMonth);
  const [searchParams, setSearchParams] = useSearchParams();

  const [locationId, setLocationId] = useState(() => searchParams.get("locationId") ?? "");
  const [pickerOpen, setPickerOpen] = useState(() => !searchParams.get("locationId"));
  const [activeTab, setActiveTab] = useState<DataTab>("srcData");
  const [graphTab, setGraphTab] = useState<LocationDetailsGraphTab>("actualVsTarget");
  const [search, setSearch] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [baseMonth, setBaseMonth] = useState<Date>(reportingMonth);
  const defaultComparisonKeys = () => [1, 2, 3].map((n) => monthKey(subMonths(reportingMonth, n).getFullYear(), subMonths(reportingMonth, n).getMonth() + 1));
  const [comparisonMonthKeys, setComparisonMonthKeys] = useState<string[]>(defaultComparisonKeys);

  useEffect(() => {
    setBaseMonth(reportingMonth);
    setComparisonMonthKeys(defaultComparisonKeys());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportingMonth]);

  // Inventory tab → click a date → that date's item-level inventory (reuses Location Summary's
  // inventory modal). `firstInventoryDate` is only for the tour, which opens the first listed date.
  const [inventoryDate, setInventoryDate] = useState<string | null>(null);
  const firstInventoryDate = useRef<string | null>(null);
  const handleFirstInventoryDate = useCallback((date: string | null) => {
    firstInventoryDate.current = date;
  }, []);
  const fetchItemsForDate = useCallback(
    (month: Date, id: string) => fetchInventoryByDate(month, id, inventoryDate ?? ""),
    [inventoryDate]
  );

  function pickLocation(id: string) {
    setLocationId(id);
    setPickerOpen(false);
    setSearchParams({ locationId: id, date: formatDateForApi(reportingMonth) }, { replace: true });
  }

  function handleRefresh() {
    setSearch("");
    setActiveTab("srcData");
    setBaseMonth(reportingMonth);
    setComparisonMonthKeys(defaultComparisonKeys());
    setRefreshKey((k) => k + 1);
  }

  const details = useApiRequest(fetchLocationDetails);
  useEffect(() => {
    if (!locationId) return;
    details.run(baseDetailsPayload(reportingMonth, locationId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, reportingMonth, refreshKey]);

  const stats = {
    totalMandays: details.data?.responseContent?.totalMandays ?? 0,
    totalCost: details.data?.responseContent?.totalCost ?? 0,
    totalWasteCost: details.data?.responseContent?.totalWasteCost ?? 0,
    cumulativeDailyCost: details.data?.responseContent?.cumulativeDailyCost ?? 0,
  };

  const costSeries = useMemo(() => {
    const map = details.data?.responseContent?.dailyCostMap ?? {};
    return Object.keys(map)
      .filter((day) => (map[day]?.current ?? 0) > 0 || (map[day]?.previous ?? 0) > 0)
      .sort((a, b) => Number(a) - Number(b))
      .map((day) => ({ day, current: map[day]?.current ?? 0, previous: map[day]?.previous ?? 0 }));
  }, [details.data]);

  const srcRows = useMemo(() => (details.data?.responseContents ?? []).map(mapSrcRow), [details.data]);
  const consumptionRows = useMemo(() => (details.data?.responseContents2 ?? []).map(mapConsumptionRow), [details.data]);
  const splitPrjRows = useMemo(() => (details.data?.responseContents3 ?? []).map(mapSplitPrjRow), [details.data]);

  const debouncedSearch = useDebouncedValue(search, 200);
  const q = debouncedSearch.trim().toLowerCase();
  const searchedSrcRows = useMemo(() => (q ? srcRows.filter((r) => `${r.srcType} ${r.date}`.toLowerCase().includes(q)) : srcRows), [srcRows, q]);
  const searchedConsumptionRows = useMemo(() => (q ? consumptionRows.filter((r) => `${r.srcType} ${r.date}`.toLowerCase().includes(q)) : consumptionRows), [consumptionRows, q]);
  const searchedSplitPrjRows = useMemo(() => (q ? splitPrjRows.filter((r) => `${r.srcType} ${r.date}`.toLowerCase().includes(q)) : splitPrjRows), [splitPrjRows, q]);

  // Suggestions for the toolbar's search field follow whichever data tab is active — each tab's
  // rows share the same "SRC + date" shape, so one "{srcType} — {date}" suggestion list covers
  // all three (same pattern as OverallSummaryPage's per-tab `suggestions` prop on its own
  // `ResponsiveSearchBar`).
  const activeTabRows = { consumption: consumptionRows, splitPrj: splitPrjRows }[activeTab as "consumption" | "splitPrj"] ?? srcRows;
  const searchSuggestions = useMemo(() => {
    const seen = new Set<string>();
    // Matches the exact text the `q ? rows.filter(...)` calls above search against — a
    // suggestion clicked here must actually match itself once it becomes the search value.
    for (const r of activeTabRows) seen.add(`${r.srcType} ${r.date}`);
    return Array.from(seen);
  }, [activeTabRows]);

  // "Show tour" (help modal) — walks every part of the screen, switching the tab/chart/picker each
  // step needs. Each control sets the whole view (see `TourStep.before`), and `endTour` hands the
  // screen back as it was when the tour started, however the tour ended.
  function startTour() {
    const startTab = activeTab;
    const startGraphTab = graphTab;
    const endTour = () => {
      setPickerOpen(false);
      setInventoryDate(null);
      setActiveTab(startTab);
      setGraphTab(startGraphTab);
    };
    startScreenTour(
      locationDetailsTourSteps({
        hasLocation: !!locationId,
        showTab: (tab) => {
          setPickerOpen(false);
          setInventoryDate(null);
          setActiveTab(tab);
        },
        showGraph: (tab) => {
          setPickerOpen(false);
          setInventoryDate(null);
          setGraphTab(tab);
        },
        openPicker: () => {
          setInventoryDate(null);
          setPickerOpen(true);
        },
        openInventoryDate: () => {
          setPickerOpen(false);
          setActiveTab("inventory");
          setInventoryDate(firstInventoryDate.current);
        },
      }),
      endTour
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        icon={Building2}
        title="Location Details"
        dataTour="location-details-header"
        onHelp={() => setHelpOpen(true)}
        actions={
          <>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              data-tour="location-details-picker"
              className="flex max-w-[220px] items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{locationId || "Select location"}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" />
            </button>
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <RefreshRoundedButton label="Refresh" onClick={handleRefresh} data-tour="location-details-refresh" />
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <RefreshSlideButton onClick={handleRefresh} data-tour="location-details-refresh" />
            </div>
          </>
        }
      />

      {locationId ? (
        <>
          {details.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
              Couldn't load location details: {details.error.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5" data-tour="location-details-stats">
            {/* Same affordance as Location Summary's own "Locations" card — a stat card that
                doubles as the location-picker trigger, not just the header pill. */}
            <StatCard label="Location" value={locationId} icon={MapPinned} tone="violet" variant="minimal" size="xs" className="rounded-md" onClick={() => setPickerOpen(true)} />
            <StatCard label="Total mandays" value={formatQty(stats.totalMandays)} icon={Boxes} tone="violet" variant="minimal" size="xs" className="rounded-md" />
            <StatCard label="Total cost" value={formatAmount(stats.totalCost)} icon={Wallet} tone="emerald" variant="minimal" size="xs" className="rounded-md" />
            <StatCard label="Cumul. daily cost" value={formatAmount(stats.cumulativeDailyCost)} icon={LineChart} tone="brand" variant="minimal" size="xs" className="rounded-md" />
            <StatCard label="Waste cost" value={formatAmount(stats.totalWasteCost)} icon={Trash2} tone="red" variant="minimal" size="xs" className="rounded-md" />
          </div>

          <div data-tour="location-details-chart">
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

          <Card padded={false}>
            <div className="flex items-center gap-3 px-5 pt-5">
              <div data-tour="location-details-tab-strip" className="min-w-0 flex-1">
                <Tabs items={TAB_ITEMS} value={activeTab} onChange={(id) => setActiveTab(id as DataTab)} className="border-b-0" />
              </div>
              {activeTab !== "compare" && (
                <div data-tour="location-details-search" className="hidden shrink-0 sm:block">
                  <ResponsiveSearchBar value={search} onChange={setSearch} placeholder="Search SRC or date..." suggestions={searchSuggestions} />
                </div>
              )}
            </div>
            {activeTab !== "compare" && (
              <div data-tour="location-details-search" className="px-5 pt-3 sm:hidden">
                <ResponsiveSearchBar value={search} onChange={setSearch} placeholder="Search SRC or date..." suggestions={searchSuggestions} className="w-full" />
              </div>
            )}
            <div className="mx-5 mt-3 border-b border-slate-200 dark:border-slate-800" />
            <div className="px-5 pb-5">
              <TabPanel active={activeTab === "srcData"}>
                <div data-tour="location-details-src-table">
                  <SrcDataTable data={searchedSrcRows} loading={details.loading} />
                </div>
              </TabPanel>
              <TabPanel active={activeTab === "consumption"}>
                <div data-tour="location-details-consumption-table">
                  <ConsumptionTable data={searchedConsumptionRows} loading={details.loading} />
                </div>
              </TabPanel>
              <TabPanel active={activeTab === "splitPrj"}>
                <div data-tour="location-details-split-table">
                  <SplitByPrjTable data={searchedSplitPrjRows} loading={details.loading} />
                </div>
              </TabPanel>
              <TabPanel active={activeTab === "compare"}>
                <ComparisonTable
                  locationId={locationId}
                  baseMonth={baseMonth}
                  onBaseMonthChange={setBaseMonth}
                  comparisonMonthKeys={comparisonMonthKeys}
                  onComparisonMonthKeysChange={setComparisonMonthKeys}
                />
              </TabPanel>
              <TabPanel active={activeTab === "inventory"}>
                <div data-tour="location-details-inventory-table">
                  <InventoryTrendTable
                    locationId={locationId}
                    reportingMonth={reportingMonth}
                    onOpenDate={setInventoryDate}
                    onFirstDateChange={handleFirstInventoryDate}
                  />
                </div>
              </TabPanel>
            </div>
          </Card>

          <Card>
            <div className="mb-1 flex items-center gap-2">
              <Tag className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <h3 className="text-section-title">Graphical Presentation</h3>
            </div>
            <DetailGraphs
              locationId={locationId}
              reportingMonth={reportingMonth}
              srcData={srcRows}
              consumptionData={consumptionRows}
              tab={graphTab}
              onTabChange={setGraphTab}
            />
          </Card>
        </>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <Building2 className="h-6 w-6" />
            </span>
            <p className="text-body">Pick a location to see its cost, consumption, and inventory details.</p>
            <TextButton size="sm" onClick={() => setPickerOpen(true)}>
              Select a location
            </TextButton>
          </div>
        </Card>
      )}

      {/* Item-level inventory for one date clicked on the Inventory tab. `key` remounts it per date
          so a new date never shows the previous date's items while loading. */}
      <InventoryModal
        key={inventoryDate ?? "none"}
        locationId={inventoryDate ? locationId : null}
        onClose={() => setInventoryDate(null)}
        reportingMonth={reportingMonth}
        fetchItems={fetchItemsForDate}
        titleSuffix={inventoryDate ?? undefined}
      />

      <LocationPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={pickLocation}
        reportingMonth={reportingMonth}
      />

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} onShowTour={startTour} steps={USAGE_STEPS} />
    </div>
  );
}
