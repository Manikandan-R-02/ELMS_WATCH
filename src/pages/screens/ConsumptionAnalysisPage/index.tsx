import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Building2, Filter as FilterIcon, MapPin, UtensilsCrossed, X } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/cards/Card";
import { ResponsiveSearchBar } from "../../../components/search/ResponsiveSearchBar";
import { RefreshSlideButton, DownloadSlideButton } from "../../../components/buttons/SlideButton";
import { RefreshRoundedButton, DownloadRoundedButton } from "../../../components/buttons/ActionRoundedButtons";
import { ConfirmModal, SuccessModal } from "../../../components/modals/StatusModals";
import { usePeriodStore } from "../../../store/periodStore";
import { useApiRequest } from "../../../api/useApiRequest";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { formatDateForApi } from "../../../api/apiHelpers";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../../hooks/useRegisterScreenTour";
import { useScrollToSection } from "../../../hooks/useScrollToSection";
import { consumptionAnalysisTourSteps } from "../../../components/onboarding/screenSteps/consumptionAnalysis";
import { toApiError } from "../../../api/types";
import { SummaryTable } from "./SummaryTable";
import { DetailTable } from "./DetailTable";
import { DistributionSection } from "./DistributionSection";
import { ALL_CATEGORY, ConsumptionFilterModal, DEFAULT_CONSUMPTION_FILTER, type ConsumptionFilter } from "./ConsumptionFilterModal";
import { buildCategoryDistribution, downloadConsumptionReport, fetchAllLocationOptions, fetchConsumptionByLocation, fetchConsumptionSummary } from "./api";
import type { ChartTab } from "./data";
import { HelpModal } from "../../../components/modals/HelpModal";

const USAGE_STEPS = [
  { q: "What does this screen show?", a: "Every location's consumption for the reporting month (items, quantity, converted quantity, and amount), plus one location's full item-level breakdown once you pick it." },
  { q: "How do I see one location's items?", a: 'Click a location\'s Code in the "Location wise Consumption Summary" table, or open the Filters button in the "Location Detail" card and pick it there.' },
  { q: "What do the Filters do?", a: 'The Filters button opens location type/category/ID, item category, and source type in one place — narrow the item-level detail table and chart to any combination, or leave item category / source type on their default ("All") to see everything for the chosen location.' },
  { q: "What's the chart's drill-down?", a: 'Click a category (or source-type) slice, bar, or legend row to see the items inside it; click "Back" to return to the top-level breakdown, or click an item to jump to its row in the detail table below.' },
  { q: "What are the Source Type / Manday tabs?", a: "Source Type shows quantity and converted quantity by source; Source Type / Manday shows the same figures normalized per manday — both only appear once the selected location has that data." },
];

function filterSummaryLabel(filter: ConsumptionFilter): string {
  const parts: string[] = [];
  if (filter.locationId) parts.push(filter.locationId);
  else if (filter.locationCategory) parts.push(filter.locationCategory);
  else if (filter.locationType !== "all") parts.push(filter.locationType);
  if (filter.category !== ALL_CATEGORY) parts.push(filter.category);
  if (filter.srcType) parts.push(filter.srcType);
  return parts.length ? parts.join(" · ") : "No location selected";
}

export function ConsumptionAnalysisPage() {
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(startTour);
  const detailSection = useScrollToSection();
  const reportingMonth = usePeriodStore((s) => s.selectedMonth);
  const [helpOpen, setHelpOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [filter, setFilter] = useState<ConsumptionFilter>(DEFAULT_CONSUMPTION_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const [summarySearch, setSummarySearch] = useState("");
  const filterActive = filter.locationId !== null || filter.category !== ALL_CATEGORY || filter.srcType !== null || filter.locationType !== "all";

  const [downloadConfirmOpen, setDownloadConfirmOpen] = useState(false);
  const [downloadSuccessOpen, setDownloadSuccessOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [chartTab, setChartTab] = useState<ChartTab>("category");
  const [chartDrill, setChartDrill] = useState<string | null>(null);

  function handleRefresh() {
    setFilter(DEFAULT_CONSUMPTION_FILTER);
    setRefreshKey((k) => k + 1);
  }

  // ── consumptionOverallSummary — the only call made automatically on page load ───────────────
  const summary = useApiRequest(fetchConsumptionSummary);
  useEffect(() => {
    summary.run(reportingMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportingMonth, refreshKey]);

  // Every location's name, purely to backfill `consumptionOverallSummary`'s often-empty
  // `locationName` per row (same gap the old app's own `fetchAllSummary` works around with its
  // `row.locationName || loc?.name` fallback) — independent of the filter modal's own copy of
  // this same dropdown, since this one has to always be loaded regardless of what's filtered.
  const allLocations = useApiRequest(fetchAllLocationOptions);
  useEffect(() => {
    allLocations.run(reportingMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportingMonth, refreshKey]);

  const summaryRowsRaw = useMemo(() => {
    const rows = summary.data ?? [];
    if (!rows.length) return rows;
    const nameById = new Map(allLocations.data?.map((l) => [l.id, l.name] as const) ?? []);
    return rows.map((r) => (r.locationName ? r : { ...r, locationName: nameById.get(r.locationId) ?? "" }));
  }, [summary.data, allLocations.data]);

  const debouncedSummarySearch = useDebouncedValue(summarySearch, 200);
  const summaryRows = useMemo(() => {
    const q = debouncedSummarySearch.trim().toLowerCase();
    if (!q) return summaryRowsRaw;
    return summaryRowsRaw.filter((r) => `${r.locationId} ${r.locationName}`.toLowerCase().includes(q));
  }, [summaryRowsRaw, debouncedSummarySearch]);
  const summarySuggestions = useMemo(() => summaryRowsRaw.map((r) => `${r.locationId} ${r.locationName}`), [summaryRowsRaw]);

  // ── consumptionByLocationByDate — the item-level detail + chart data for one location ──────
  const detail = useApiRequest(fetchConsumptionByLocation);
  useEffect(() => {
    if (!filter.locationId) return;
    detail.run({
      locationId: filter.locationId,
      periodStr: formatDateForApi(reportingMonth),
      ...(filter.category === ALL_CATEGORY ? {} : { category: filter.category }),
      ...(filter.srcType ? { srcType: filter.srcType } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.locationId, filter.category, filter.srcType, reportingMonth, refreshKey]);

  const detailRows = useMemo(() => detail.data?.details ?? [], [detail.data]);
  const rc2Rows = useMemo(() => detail.data?.srcTypeRows ?? [], [detail.data]);
  const rc3Rows = useMemo(() => detail.data?.perMandayRows ?? [], [detail.data]);

  // A fresh result (another location or filter, Refresh) starts back on the Category chart, not drilled in.
  useEffect(() => {
    setChartTab("category");
    setChartDrill(null);
  }, [detail.data]);

  function changeChartTab(next: ChartTab) {
    setChartTab(next);
    setChartDrill(null);
  }

  // "Show tour" (help modal) — walks every control, opening the dialogs, a location's detail and the chart's other
  // tabs for the steps that show them. Each control sets the whole view (see `TourStep.before`), and the end hands
  // the screen back as it was when the tour started. The tour never applies a filter or downloads anything.
  function startTour() {
    const startFilter = filter;
    const startTab = chartTab;
    const startDrill = chartDrill;
    const firstLocationId = summaryRowsRaw.at(0)?.locationId ?? null;
    const firstCategory = buildCategoryDistribution(detailRows, "amount").at(0)?.name ?? null;
    const closeDialogs = () => {
      setFilterOpen(false);
      setDownloadConfirmOpen(false);
      setDownloadSuccessOpen(false);
    };
    const showDetail = () => {
      closeDialogs();
      setFilter((f) => (f.locationId || !firstLocationId ? f : { ...f, locationId: firstLocationId }));
    };
    startScreenTour(
      consumptionAnalysisTourSteps({
        hasSummary: firstLocationId !== null,
        hasSrcType: rc2Rows.length > 0,
        hasPerManday: rc3Rows.length > 0,
        hasDrill: firstCategory !== null,
        showPage: () => {
          closeDialogs();
          setChartTab("category");
          setChartDrill(null);
        },
        showDetail: () => {
          showDetail();
          setChartTab("category");
          setChartDrill(null);
        },
        openFilter: () => {
          setDownloadConfirmOpen(false);
          setFilterOpen(true);
        },
        openDownloadConfirm: () => {
          setFilterOpen(false);
          setDownloadError("");
          setDownloadConfirmOpen(true);
        },
        showChart: (tab, drilled) => {
          showDetail();
          setChartTab(tab);
          setChartDrill(drilled ? firstCategory : null);
        },
      }),
      () => {
        closeDialogs();
        setFilter(startFilter);
        setChartTab(startTab);
        setChartDrill(startDrill);
      }
    );
  }

  function selectLocation(id: string) {
    setFilter((f) => ({ ...f, locationId: id }));
    detailSection.request();
  }

  async function handleDownloadRequest() {
    setDownloadError("");
    setDownloadConfirmOpen(true);
  }

  async function confirmDownload() {
    setDownloading(true);
    try {
      // `downloadConsumptionReport` saves a real file, or opens the link a JSON reply carries; the backend's own
      // message comes back as the error when it refuses (see src/api/fileDownload.ts).
      await downloadConsumptionReport(reportingMonth, filter.locationId ?? undefined);
      setDownloadConfirmOpen(false);
      setDownloadSuccessOpen(true);
    } catch (err) {
      setDownloadError(toApiError(err).message || "Failed to generate the Excel report. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-3">
      <PageHeader
        icon={UtensilsCrossed}
        title="Consumption Analysis"
        dataTour="consumption-analysis-header"
        onHelp={() => setHelpOpen(true)}
        actions={
          <>
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <RefreshRoundedButton label="Refresh" onClick={handleRefresh} data-tour="consumption-analysis-refresh" />
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <RefreshSlideButton onClick={handleRefresh} data-tour="consumption-analysis-refresh" />
            </div>
          </>
        }
      />

      {summary.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
          Couldn't load the consumption summary: {summary.error.message}
        </div>
      )}

      <Card padded={false} data-tour="consumption-analysis-summary">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <h2 className="text-card-title">Location wise Consumption Summary</h2>
            </div>
            <p className="text-body-sm">Period: {format(reportingMonth, "MMMM yyyy")} · {summaryRowsRaw.length} locations</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div data-tour="consumption-analysis-summary-search">
              <ResponsiveSearchBar value={summarySearch} onChange={setSummarySearch} placeholder="Search location..." suggestions={summarySuggestions} />
            </div>
            <div data-tour="consumption-analysis-download" className="sm:hidden">
              <DownloadRoundedButton label="Download Excel" onClick={handleDownloadRequest} />
            </div>
            <div data-tour="consumption-analysis-download" className="hidden sm:block">
              <DownloadSlideButton label="Download Excel" onClick={handleDownloadRequest} />
            </div>
          </div>
        </div>
        <div className="mx-5 mt-3 border-b border-slate-200 dark:border-slate-800" />
        <div data-tour="consumption-analysis-summary-table" className="px-5 pb-5">
          <SummaryTable data={summaryRows} loading={summary.loading} onSelectLocation={selectLocation} />
        </div>
      </Card>

      <div ref={detailSection.ref} className="scroll-mt-32">
    <Card padded={false} data-tour="consumption-analysis-detail">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <h2 className="text-card-title">Location Detail</h2>
              </div>
              <p className="text-body-sm">{filter.locationId ? `Location ${filter.locationId}` : "Pick a location to see its item-level consumption"}</p>
            </div>
            {/* Every "Location Detail" filter (location type/category/ID, item category, source
                type) used to sit inline as a five-wide row of dropdowns here — collapsed into one
                modal (same pattern as LocationSummaryPage's own `LocationFilterModal`) behind a
                single trigger pill that always shows what's currently applied. */}
            <div className="flex items-center gap-1.5" data-tour="consumption-analysis-filter">
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="flex max-w-[280px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:text-brand-400"
              >
                <FilterIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{filterSummaryLabel(filter)}</span>
              </button>
              {filterActive && (
                <button
                  type="button"
                  onClick={() => setFilter(DEFAULT_CONSUMPTION_FILTER)}
                  aria-label="Clear filters"
                  title="Clear filters"
                  data-tour="consumption-analysis-clear"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="mx-5 mt-3 border-b border-slate-200 dark:border-slate-800" />
          <div className="space-y-4 px-5 pb-5">
            {filter.locationId ? (
              <>
                {detail.error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
                    Couldn't load consumption detail: {detail.error.message}
                  </div>
                )}
                <div data-tour="consumption-analysis-chart">
                  <DistributionSection
                    detailRows={detailRows}
                    rc2Rows={rc2Rows}
                    rc3Rows={rc3Rows}
                    onItemClick={() => undefined}
                    tab={chartTab}
                    onTabChange={changeChartTab}
                    drill={chartDrill}
                    onDrillChange={setChartDrill}
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <FilterIcon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  <h3 className="text-section-title">Item-wise Consumption</h3>
                </div>
                <div data-tour="consumption-analysis-detail-table">
                  <DetailTable data={detailRows} loading={detail.loading} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <MapPin className="h-6 w-6" />
                </span>
                <p className="text-body">Pick a location (via Filters above, or its Code in the summary table) to see its consumption breakdown.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <ConsumptionFilterModal open={filterOpen} onClose={() => setFilterOpen(false)} value={filter} onApply={setFilter} reportingMonth={reportingMonth} />

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} onShowTour={startTour} steps={USAGE_STEPS} />

      <ConfirmModal
        open={downloadConfirmOpen}
        onClose={() => setDownloadConfirmOpen(false)}
        onConfirm={confirmDownload}
        title="Download consumption report?"
        confirmLabel={downloading ? "Generating..." : "Download"}
        details={[
          { label: "Period", value: format(reportingMonth, "MMMM yyyy") },
          { label: "Scope", value: filter.locationId ? `Location ${filter.locationId}` : "All locations" },
          { label: "Format", value: "Excel (.xlsx)" },
        ]}
      >
        <span data-tour="consumption-analysis-download-modal" className="block">
          {downloadError ? (
            <span className="text-red-600 dark:text-red-400">{downloadError}</span>
          ) : (
            "This exports the consumption figures for the selected scope and period as an Excel file."
          )}
        </span>
      </ConfirmModal>

      <SuccessModal
        open={downloadSuccessOpen}
        onClose={() => setDownloadSuccessOpen(false)}
        title="Download started"
        primaryActionLabel="Done"
        details={[
          { label: "Period", value: format(reportingMonth, "MMMM yyyy") },
          { label: "Scope", value: filter.locationId ? `Location ${filter.locationId}` : "All locations" },
        ]}
      >
        Your browser is saving the consumption Excel report now — check your downloads.
      </SuccessModal>
    </div>
  );
}
