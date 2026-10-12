import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useScrollToSection } from "../../../hooks/useScrollToSection";
import {
  Banknote,
  Hash,
  Percent,
  ReceiptText,
  Trash2,
  UtensilsCrossed,
  Users,
  Weight,
  } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/cards/Card";
import { StatCard } from "../../../components/charts/StatCard";
import { DistributionChartCard } from "../../../components/charts/ChartCards";
import { SelectSearch } from "../../../components/fields/SelectSearch";
import { YearPicker } from "../../../components/datetime/YearPicker";
import { ResponsiveSearchBar } from "../../../components/search/ResponsiveSearchBar";
import { CancelSlideButton, RefreshSlideButton } from "../../../components/buttons/SlideButton";
import { CancelRoundedButton, RefreshRoundedButton } from "../../../components/buttons/ActionRoundedButtons";
import { useApiRequest } from "../../../api/useApiRequest";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../../hooks/useRegisterScreenTour";
import { wasteCostAnalysisTourSteps } from "../../../components/onboarding/screenSteps/wasteCostAnalysis";
import { OverviewTable } from "./OverviewTable";
import { WasteDistributionSection } from "./WasteDistributionSection";
import { DailyWasteSection } from "./DailyWasteSection";
import { LossReasonTable } from "./LossReasonTable";
import { DayBasedDataModal } from "./DayBasedDataModal";
import { fetchWasteDashboard, fetchWasteLocations } from "./api";
import { ALL_LOCATIONS, ALL_MONTHS, MONTH_OPTIONS, identityLabelFor, wastePercentage } from "./data";
import { HelpModal } from "../../../components/modals/HelpModal";

const USAGE_STEPS = [
  { q: "What does this screen show?", a: "Waste cost, weight, and percentage across your locations for a chosen year, optionally narrowed to one month and/or one location." },
  { q: "How do the filters interact?", a: 'Leave Month and Location on "All" for a year-wide, per-month overview. Pick a Month to see that month broken down by location. Pick a Location to see that location\'s trend across every month.' },
  { q: "How do I see day-by-day detail?", a: "Once a chart slice, table row, or the filters themselves pin down one specific month AND one specific location, a daily chart appears — click a day's bar to see that day's loss-reason and food-item breakdown, or click a row's eye icon to open the same detail in a table." },
];

const currentYear = new Date().getFullYear();
const FIRST_YEAR = 2023;

/** The filters another screen sent us with (Overall Summary's top-locations-by-waste bar: `?locationId=…&month=9&year=2026`).
 * Anything missing or out of range is ignored, so a bad link just opens the default view. */
function incomingFilters(params: URLSearchParams): { year?: number; month?: number; locationId?: string } {
  const year = Number(params.get("year"));
  const month = Number(params.get("month"));
  return {
    year: Number.isInteger(year) && year >= FIRST_YEAR && year <= currentYear ? year : undefined,
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : undefined,
    locationId: params.get("locationId") || undefined,
  };
}

/** Which dashboard query the page is showing, from whether a location and a month are picked. */
function viewModeFor(hasLocation: boolean, allMonths: boolean): "yearAllLocations" | "monthAllLocations" | "locationAllMonths" {
  if (hasLocation) return "locationAllMonths";
  return allMonths ? "yearAllLocations" : "monthAllLocations";
}

export function WasteCostAnalysisPage() {
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(() => startScreenTour(wasteCostAnalysisTourSteps));
  const [helpOpen, setHelpOpen] = useState(false);
  // Opened from another screen with a location / month / year: start on exactly that, instead of the year overview.
  const [searchParams, setSearchParams] = useSearchParams();
  const [incoming] = useState(() => incomingFilters(searchParams));
  const [year, setYear] = useState(incoming.year ?? currentYear);
  const [month, setMonth] = useState<number>(incoming.month ?? ALL_MONTHS);
  const [locationId, setLocationId] = useState<string | null>(incoming.locationId ?? null);
  useEffect(() => {
    if (searchParams.size > 0) setSearchParams({}, { replace: true }); // plain address afterwards, so Reset and refresh behave
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [dayContext, setDayContext] = useState<{ month: number; locationId: string; locationName?: string } | null>(null);
  const [dayModal, setDayModal] = useState<{ month: number; locationId: string; locationName?: string } | null>(null);
  // Clicking a chart slice or table row opens the day-by-day section below; the page scrolls to it. (Setting the same
  // thing through the filters does not scroll.)
  const dailySection = useScrollToSection();

  const locations = useApiRequest(fetchWasteLocations);
  useEffect(() => {
    locations.run(year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const dashboard = useApiRequest(fetchWasteDashboard);
  useEffect(() => {
    dashboard.run({ year, month: month === ALL_MONTHS ? undefined : month, locationId: locationId ?? undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, locationId]);

  // Any filter change invalidates a previous chart/table drill-down — except the one combination
  // (a specific location AND a specific month both already chosen via the filters themselves)
  // where the day-level context is unambiguous, so it's set automatically instead of requiring a
  // redundant extra click on a chart/table that's already showing exactly one row.
  useEffect(() => {
    if (locationId && month !== ALL_MONTHS) {
      setDayContext({ month, locationId, locationName: locations.data?.find((l) => l.id === locationId)?.name });
    } else {
      setDayContext(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, locationId, locations.data]);

  function handleReset() {
    setYear(currentYear);
    setMonth(ALL_MONTHS);
    setLocationId(null);
    setSearch("");
  }

  const viewMode = viewModeFor(locationId !== null, month === ALL_MONTHS);

  const overviewRows = dashboard.data?.overviewRows ?? [];
  const rowSuggestions = useMemo(() => overviewRows.map(identityLabelFor), [overviewRows]);
  const filteredRows = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return overviewRows;
    return overviewRows.filter((r) => identityLabelFor(r).toLowerCase().includes(q));
  }, [overviewRows, debouncedSearch]);

  const contextLocation = locationId ? { id: locationId, name: locations.data?.find((l) => l.id === locationId)?.name } : null;
  const totals = dashboard.data?.totals;
  const lossReasons = dashboard.data?.lossReasons ?? [];
  const topWastedFood = dashboard.data?.topWastedFood ?? [];

  return (
    <div className="space-y-3">
      <PageHeader
        icon={Trash2}
        title="WasteCost Analysis"
        dataTour="waste-cost-analysis-header"
        onHelp={() => setHelpOpen(true)}
        badge={{ icon: Hash, label: `${overviewRows.length} ${viewMode === "monthAllLocations" ? "locations" : "months"}` }}
        actions={
          <>
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <RefreshRoundedButton label="Refresh" onClick={() => dashboard.run({ year, month: month === ALL_MONTHS ? undefined : month, locationId: locationId ?? undefined })} />
              <CancelRoundedButton label="Reset" onClick={handleReset} />
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <RefreshSlideButton label="Refresh" onClick={() => dashboard.run({ year, month: month === ALL_MONTHS ? undefined : month, locationId: locationId ?? undefined })} />
              <CancelSlideButton label="Reset" onClick={handleReset} />
            </div>
          </>
        }
      />

      <Card padded={false}>
        <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-3" data-tour="waste-cost-analysis-filters">
          <YearPicker label="Year" value={year} onChange={setYear} minYear={2023} maxYear={currentYear} portal />
          <SelectSearch label="Month" options={MONTH_OPTIONS} value={month} onChange={(v) => setMonth(v ?? ALL_MONTHS)} clearable={false} searchable={false} portal />
          <SelectSearch
            label="Location"
            options={[{ label: "All Locations", value: ALL_LOCATIONS }, ...(locations.data ?? []).map((l) => ({ label: `${l.id} — ${l.name}`, value: l.id }))]}
            value={locationId ?? ALL_LOCATIONS}
            onChange={(v) => setLocationId(!v || v === ALL_LOCATIONS ? null : v)}
            disabled={locations.loading}
            portal
          />
        </div>
      </Card>

      {totals && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-8">
          <StatCard label="Raw Material Cost" value={formatAmount(totals.rawMaterialCost)} icon={Banknote} tone="brand" variant="minimal" size="xs" className="rounded-md" />
          <StatCard label="Current Manday" value={formatQty(totals.currentMandays)} icon={Users} tone="violet" variant="minimal" size="xs" className="rounded-md" />
          <StatCard label="Meals Count" value={formatQty(totals.mealsCount)} icon={UtensilsCrossed} tone="amber" variant="minimal" size="xs" className="rounded-md" />
          <StatCard label="Waste Weight (KG)" value={formatQty(totals.totalWasteWeight)} icon={Weight} tone="red" variant="minimal" size="xs" className="rounded-md" />
          <StatCard label="Total Waste Value" value={formatAmount(totals.totalWasteValue)} icon={ReceiptText} tone="red" variant="minimal" size="xs" className="rounded-md" />
          <StatCard label="Waste %" value={`${formatQty(wastePercentage(totals))}%`} icon={Percent} tone="red" variant="minimal" size="xs" className="rounded-md" />
          <StatCard label="Waste/GMS" value={formatQty(totals.wasteMealsGms)} icon={UtensilsCrossed} tone="amber" variant="minimal" size="xs" className="rounded-md" />
          <StatCard label="Transactions" value={formatQty(totals.transactionCount)} icon={Hash} tone="brand" variant="minimal" size="xs" className="rounded-md" />
        </div>
      )}

      {dashboard.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
          Couldn't load waste data: {dashboard.error.message}
        </div>
      )}

      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <div>
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <h2 className="text-card-title">Waste Overview</h2>
            </div>
            <p className="text-body-sm">
              {viewMode === "yearAllLocations" && "Every month of the year, across all locations"}
              {viewMode === "monthAllLocations" && "Every location for the selected month"}
              {viewMode === "locationAllMonths" && "Every month for the selected location"}
            </p>
          </div>
          <ResponsiveSearchBar value={search} onChange={setSearch} placeholder="Search month or location..." suggestions={rowSuggestions} />
        </div>
        <div className="mx-5 mt-3 border-b border-slate-200 dark:border-slate-800" />
        <div className="px-5 pb-5 pt-4" data-tour="waste-cost-analysis-overview">
          <OverviewTable
            rows={filteredRows}
            loading={dashboard.loading}
            year={year}
            expandableByLocation={viewMode === "yearAllLocations"}
            contextLocation={contextLocation}
            emptyMessage={debouncedSearch ? "No rows match your search" : "No data available"}
            onOpenDay={(m, locId, locName) => setDayModal({ month: m, locationId: locId, locationName: locName })}
          />
        </div>
      </Card>

      {overviewRows.length > 0 && (
        <WasteDistributionSection
          overviewRows={overviewRows}
          year={year}
          mode={viewMode}
          month={month === ALL_MONTHS ? undefined : month}
          contextLocation={contextLocation ?? undefined}
          onSelectDayContext={(m, locId, locName) => {
              setDayContext({ month: m, locationId: locId, locationName: locName });
              dailySection.request();
            }}
        />
      )}

      {dayContext && (
        <div ref={dailySection.ref} className="scroll-mt-32">
          <DailyWasteSection year={year} month={dayContext.month} locationId={dayContext.locationId} locationName={dayContext.locationName} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" data-tour="waste-cost-analysis-breakdown">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <h2 className="text-card-title">Loss Reason by Weight</h2>
          </div>
          <LossReasonTable data={lossReasons} loading={dashboard.loading} />
        </Card>

        {topWastedFood.length === 0 ? (
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <h2 className="text-card-title">Top Wasted Food</h2>
            </div>
            <p className="text-body-sm py-10 text-center">No data available</p>
          </Card>
        ) : (
          <DistributionChartCard
            title="Top Wasted Food"
            subtitle="Top food items contributing most to waste by weight (KG), ranked highest to lowest"
            data={topWastedFood.map((f) => ({ name: f.foodItem, value: f.sumOfWeight }))}
            defaultChartType="barHorizontal"
            formatValue={(v) => formatQty(v)}
          />
        )}
      </div>

      {dayModal && (
        <DayBasedDataModal
          open
          onClose={() => setDayModal(null)}
          year={year}
          month={dayModal.month}
          locationId={dayModal.locationId}
          locationName={dayModal.locationName}
        />
      )}

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} onShowTour={() => startScreenTour(wasteCostAnalysisTourSteps)} steps={USAGE_STEPS} />
    </div>
  );
}
