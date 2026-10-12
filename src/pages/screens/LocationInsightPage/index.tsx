import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Activity, ChevronDown, ClipboardCheck, LineChart, MapPin, MapPinned, Wallet } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/cards/Card";
import { StatCard } from "../../../components/charts/StatCard";
import { TextButton } from "../../../components/buttons/TextButton";
import { RefreshSlideButton } from "../../../components/buttons/SlideButton";
import { RefreshRoundedButton } from "../../../components/buttons/ActionRoundedButtons";
import { usePeriodStore } from "../../../store/periodStore";
import { useApiRequest } from "../../../api/useApiRequest";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../../hooks/useRegisterScreenTour";
import { locationInsightTourSteps, type LocationInsightGraphTab } from "../../../components/onboarding/screenSteps/locationInsight";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { LocationPickerModal } from "../LocationDetailsPage/LocationPickerModal";
import { InsightGraphs } from "./InsightGraphs";
import { baseInsightPayload, fetchLocationInsight, formatDateForApi, mapInsightStats, mapSeries, mapSplitPrjSeries } from "./api";
import { HelpModal } from "../../../components/modals/HelpModal";

const USAGE_STEPS = [
  { q: "What does this screen show?", a: "One location's mandays, cost, and consumption trends for the reporting month selected in the header, as charts rather than tables." },
  { q: "How do I pick a different location?", a: "Click the location pill in the header to search by ID/name, or narrow by type and category first." },
  { q: "What's on the Graphical Presentation card?", a: '4 tabs, one chart at a time: "Cumul Daily Cost" (running cost per manday through the month), "Daily Consumption", "Mandays", and "Split By PRJ" (cost split into Food / Cleaning / Disposal / Others).' },
  { q: "How is this different from Location Details?", a: "Location Details drills into per-SRC-type daily tables and comparisons; Location Insight is the same location's headline trends at a glance, chart-only." },
];

export function LocationInsightPage() {
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(startTour);
  const reportingMonth = usePeriodStore((s) => s.selectedMonth);
  const [searchParams, setSearchParams] = useSearchParams();

  const [locationId, setLocationId] = useState(() => searchParams.get("locationId") ?? "");
  const [pickerOpen, setPickerOpen] = useState(() => !searchParams.get("locationId"));
  const [helpOpen, setHelpOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [graphTab, setGraphTab] = useState<LocationInsightGraphTab>("cumulDailyCost");

  function pickLocation(id: string) {
    setLocationId(id);
    setPickerOpen(false);
    setSearchParams({ locationId: id, date: formatDateForApi(reportingMonth) }, { replace: true });
  }

  function handleRefresh() {
    setGraphTab("cumulDailyCost");
    setRefreshKey((k) => k + 1);
  }

  // "Show tour" (help modal) — each control sets the whole view the step needs (see
  // `TourStep.before`), and `endTour` hands the screen back as it was when the tour started.
  function startTour() {
    const startGraphTab = graphTab;
    startScreenTour(
      locationInsightTourSteps({
        hasLocation: !!locationId,
        showGraph: (tab) => {
          setPickerOpen(false);
          setGraphTab(tab);
        },
        openPicker: () => setPickerOpen(true),
      }),
      () => {
        setPickerOpen(false);
        setGraphTab(startGraphTab);
      }
    );
  }

  const insight = useApiRequest(fetchLocationInsight);
  useEffect(() => {
    if (!locationId) return;
    insight.run(baseInsightPayload(reportingMonth, locationId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, reportingMonth, refreshKey]);

  const stats = mapInsightStats(insight.data?.summary);
  const mandays = mapSeries(insight.data?.dayWiseMandayList);
  const cumulDailyCost = mapSeries(insight.data?.dayWiseCumulativeDailyCostList);
  const dailyConsumption = mapSeries(insight.data?.dayWiseConsumptionDataList);
  const splitByPrj = mapSplitPrjSeries(insight.data?.summary?.splitPrjList);

  return (
    <div className="space-y-3">
      <PageHeader
        icon={Activity}
        title="Location Insight"
        dataTour="location-insight-header"
        onHelp={() => setHelpOpen(true)}
        actions={
          <>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              data-tour="location-insight-picker"
              className="flex max-w-[220px] items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{locationId || "Select location"}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" />
            </button>
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <RefreshRoundedButton label="Refresh" onClick={handleRefresh} data-tour="location-insight-refresh" />
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <RefreshSlideButton onClick={handleRefresh} data-tour="location-insight-refresh" />
            </div>
          </>
        }
      />

      {locationId ? (
        <>
          {insight.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
              Couldn't load location insight: {insight.error.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" data-tour="location-insight-stats">
            {/* Same affordance as Location Summary's own "Locations" card — a stat card that
                doubles as the location-picker trigger, not just the header pill. */}
            <StatCard label="Location" value={locationId} icon={MapPinned} tone="violet" variant="minimal" size="xs" className="rounded-md" onClick={() => setPickerOpen(true)} />
            <StatCard label="Total mandays" value={formatQty(stats.totalMandays)} icon={ClipboardCheck} tone="violet" variant="minimal" size="xs" className="rounded-md" />
            <StatCard label="Total cost" value={formatAmount(stats.totalCost)} icon={Wallet} tone="emerald" variant="minimal" size="xs" className="rounded-md" />
            <StatCard label="Cumul. daily cost" value={formatAmount(stats.cumulativeDailyCost)} icon={LineChart} tone="brand" variant="minimal" size="xs" className="rounded-md" />
          </div>

          <Card data-tour="location-insight-charts">
            <div className="mb-1 flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <h3 className="text-section-title">Graphical Presentation</h3>
            </div>
            <InsightGraphs
              cumulDailyCost={cumulDailyCost}
              dailyConsumption={dailyConsumption}
              mandays={mandays}
              splitByPrj={splitByPrj}
              tab={graphTab}
              onTabChange={setGraphTab}
            />
          </Card>
        </>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <Activity className="h-6 w-6" />
            </span>
            <p className="text-body">Pick a location to see its mandays, cost, and consumption trends.</p>
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
