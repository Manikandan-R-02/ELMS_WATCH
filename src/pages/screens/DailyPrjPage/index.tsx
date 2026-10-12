import { useEffect, useMemo, useState } from "react";
import { Building2, CalendarClock, Eye, EyeOff, MapPin, Target } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/cards/Card";
import { SelectSearch } from "../../../components/fields/SelectSearch";
import { ResponsiveSearchBar } from "../../../components/search/ResponsiveSearchBar";
import { TextButton } from "../../../components/buttons/TextButton";
import { RefreshSlideButton, DownloadSlideButton } from "../../../components/buttons/SlideButton";
import { RefreshRoundedButton, DownloadRoundedButton } from "../../../components/buttons/ActionRoundedButtons";
import { ConfirmModal, SuccessModal } from "../../../components/modals/StatusModals";
import { usePeriodStore } from "../../../store/periodStore";
import { useApiRequest } from "../../../api/useApiRequest";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../../hooks/useRegisterScreenTour";
import { useScrollToSection } from "../../../hooks/useScrollToSection";
import { dailyPrjTourSteps } from "../../../components/onboarding/screenSteps/dailyPrj";
import { SummaryTable } from "./SummaryTable";
import { DetailTable } from "./DetailTable";
import { MonthSummaryTable } from "./MonthSummaryTable";
import { TargetTable } from "./TargetTable";
import {
  buildTargetSummaryRow,
  computeTotalAndAverage,
  fetchDailyPrjLocation,
  fetchDailyPrjSummary,
  flattenSummaryColumns,
  mapDetailRow,
  mapMonthHeaderRow,
  mapSummaryRows,
  mapTargetTable,
  targetDailyPrj,
} from "./api";
import { HelpModal } from "../../../components/modals/HelpModal";

const USAGE_STEPS = [
  { q: "What does this screen show?", a: "The food-cost PRJ (cost-per-manday) ratio for the reporting month — a summary across every location, and a day-by-day breakdown for whichever location you pick." },
  { q: "How do I see one location's daily figures?", a: 'Click a location\'s Code in the "Location wise PRJ Summary" table, or pick it directly from the "Daily PRJ Details" card\'s location field.' },
  { q: "What do the colored Var PRJ / Var Staff figures mean?", a: "Green with an up-arrow means over target for that day, red with a down-arrow means under, matching every variance column across this app." },
  { q: "What's the PRJ breakdown toggle?", a: "Turns on extra columns per PRJ type (e.g. SS, Omani, Suhur) — each type's own Food/Cleaning/Disposable/Mandays/Total/PRJ figures for that day." },
  { q: "Where does the Target figure come from?", a: 'The "PRJ Target Summary" table\'s "PRJ/Manday" row — its Total is this location\'s authoritative Daily PRJ target for the month, shown alongside Current/Previous Month and the Total/Avg rollups.' },
];

// A plain `<a>` click against a `Content-Disposition: attachment` URL is intercepted by the
// browser as a file save *before* any navigation happens — unlike `window.open(url, "_blank")`,
// which first opens a real (briefly blank, until the download kicks in) browsing tab/window.
// That flash-to-blank-then-back was the actual bug: nothing was wrong with the URL, just the
// mechanism used to fetch it.
function triggerExcelDownload(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function DailyPrjPage() {
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(startTour);
  const detailSection = useScrollToSection();
  const reportingMonth = usePeriodStore((s) => s.selectedMonth);
  const [summarySearch, setSummarySearch] = useState("");
  const [detailSearch, setDetailSearch] = useState("");
  const [locationId, setLocationId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  // Old app's per-card hide/show toggle (LmsWatch/DailyPrj/index.jsx) — collapses a card's table
  // down to just its header/toolbar, for a reader who wants the summary figures/filters on
  // screen without the (often long) table underneath.
  const [summaryTableVisible, setSummaryTableVisible] = useState(true);
  const [detailTableVisible, setDetailTableVisible] = useState(true);
  const [downloadConfirmOpen, setDownloadConfirmOpen] = useState(false);
  const [downloadSuccessOpen, setDownloadSuccessOpen] = useState(false);

  const summary = useApiRequest(fetchDailyPrjSummary);
  useEffect(() => {
    summary.run(reportingMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportingMonth, refreshKey]);

  function handleRefresh() {
    setSummarySearch("");
    setDetailSearch("");
    setLocationId(null);
    setRefreshKey((k) => k + 1);
  }

  function confirmDownload() {
    if (!downloadUrl) return;
    triggerExcelDownload(downloadUrl);
    setDownloadConfirmOpen(false);
    setDownloadSuccessOpen(true);
  }

  const columnDefs = useMemo(() => flattenSummaryColumns(summary.data?.summary_sheet?.columns), [summary.data]);
  const summaryRowsRaw = useMemo(() => mapSummaryRows(summary.data?.summary_sheet?.data), [summary.data]);

  const debouncedSummarySearch = useDebouncedValue(summarySearch, 200);
  const summaryRows = useMemo(() => {
    const q = debouncedSummarySearch.trim().toLowerCase();
    if (!q) return summaryRowsRaw;
    return summaryRowsRaw.filter((r) => `${r.id} ${r.name}`.toLowerCase().includes(q));
  }, [summaryRowsRaw, debouncedSummarySearch]);

  const downloadUrl = summary.data?.download_url;
  const locationOptions = useMemo(() => summaryRowsRaw.map((r) => ({ label: `${r.id} — ${r.name}`, value: r.id })), [summaryRowsRaw]);
  const summarySuggestions = useMemo(() => summaryRowsRaw.map((r) => `${r.id} ${r.name}`), [summaryRowsRaw]);

  // "Show tour" (help modal) — walks every control, opening the download dialog and a location's detail
  // for the steps that need them. Each control sets the whole view (see `TourStep.before`); the end
  // hands the screen back as it was when the tour started, however the tour ended.
  function startTour() {
    const startLocationId = locationId;
    const startSummaryVisible = summaryTableVisible;
    const startDetailVisible = detailTableVisible;
    const firstLocationId = summaryRowsRaw.at(0)?.id ?? null;
    const closeDialogs = () => {
      setDownloadConfirmOpen(false);
      setDownloadSuccessOpen(false);
    };
    startScreenTour(
      dailyPrjTourSteps({
        hasLocations: firstLocationId !== null,
        hasDownload: !!downloadUrl,
        showSummary: () => {
          closeDialogs();
          setSummaryTableVisible(true);
          setDetailTableVisible(true);
        },
        showDetail: () => {
          closeDialogs();
          setSummaryTableVisible(true);
          setDetailTableVisible(true);
          setLocationId((current) => current ?? firstLocationId);
        },
        openDownloadConfirm: () => {
          setDownloadSuccessOpen(false);
          setSummaryTableVisible(true);
          setDownloadConfirmOpen(true);
        },
      }),
      () => {
        closeDialogs();
        setSummaryTableVisible(startSummaryVisible);
        setDetailTableVisible(startDetailVisible);
        setLocationId(startLocationId);
      }
    );
  }

  const detail = useApiRequest(fetchDailyPrjLocation);
  useEffect(() => {
    if (!locationId) return;
    detail.run(reportingMonth, locationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, reportingMonth, refreshKey]);

  const detailRowsRaw = useMemo(() => (detail.data?.rows ?? detail.data?.current_month?.rows ?? []).map(mapDetailRow), [detail.data]);
  const debouncedDetailSearch = useDebouncedValue(detailSearch, 200);
  const detailRows = useMemo(() => {
    const q = debouncedDetailSearch.trim().toLowerCase();
    if (!q) return detailRowsRaw;
    return detailRowsRaw.filter((r) => `${r.date} ${r.sno}`.toLowerCase().includes(q));
  }, [detailRowsRaw, debouncedDetailSearch]);
  const detailSuggestions = useMemo(() => detailRowsRaw.map((r) => r.date), [detailRowsRaw]);

  const targetRows = useMemo(() => mapTargetTable(detail.data?.target_table), [detail.data]);
  const monthSummaryRows = useMemo(() => {
    const { total, avg } = computeTotalAndAverage(detailRowsRaw);
    return [
      mapMonthHeaderRow("Current Month", detail.data?.header_rows?.current_month),
      mapMonthHeaderRow("Previous Month", detail.data?.header_rows?.previous_month),
      total,
      avg,
      buildTargetSummaryRow(targetDailyPrj(targetRows), detail.data?.summary_row),
    ];
  }, [detail.data, detailRowsRaw, targetRows]);

  return (
    <div className="space-y-3">
      <PageHeader
        icon={CalendarClock}
        title="Daily PRJ"
        dataTour="daily-prj-header"
        onHelp={() => setHelpOpen(true)}
        actions={
          <>
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <RefreshRoundedButton label="Refresh" onClick={handleRefresh} data-tour="daily-prj-refresh" />
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <RefreshSlideButton onClick={handleRefresh} data-tour="daily-prj-refresh" />
            </div>
          </>
        }
      />

      {summary.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
          Couldn't load Daily PRJ summary: {summary.error.message}
        </div>
      )}

      <Card padded={false} data-tour="daily-prj-summary">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <h2 className="text-card-title">{summary.data?.summary_sheet?.title ?? "Location wise PRJ Summary"}</h2>
            </div>
            <p className="text-body-sm">Period: {format(reportingMonth, "MMMM yyyy")} · {summaryRowsRaw.length} locations</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div data-tour="daily-prj-summary-search">
              <ResponsiveSearchBar value={summarySearch} onChange={setSummarySearch} placeholder="Search location..." suggestions={summarySuggestions} />
            </div>
            {downloadUrl && (
              <>
                <div data-tour="daily-prj-download" className="sm:hidden">
                  <DownloadRoundedButton label="Download Excel" onClick={() => setDownloadConfirmOpen(true)} />
                </div>
                <div data-tour="daily-prj-download" className="hidden sm:block">
                  <DownloadSlideButton label="Download Excel" onClick={() => setDownloadConfirmOpen(true)} />
                </div>
              </>
            )}
            <TextButton
              variant="outline"
              tone="neutral"
              size="sm"
              data-tour="daily-prj-summary-hide"
              leadingIcon={summaryTableVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              onClick={() => setSummaryTableVisible((v) => !v)}
            >
              {summaryTableVisible ? "Hide table" : "Show table"}
            </TextButton>
          </div>
        </div>
        {summaryTableVisible && (
          <>
            <div className="mx-5 mt-3 border-b border-slate-200 dark:border-slate-800" />
            <div data-tour="daily-prj-summary-table" className="px-5 pb-5">
              <SummaryTable data={summaryRows} columns={columnDefs} loading={summary.loading} onSelectLocation={(id) => {
                  setLocationId(id);
                  detailSection.request();
                }} />
            </div>
          </>
        )}
      </Card>

      <div ref={detailSection.ref} className="scroll-mt-32">
    <Card padded={false} data-tour="daily-prj-detail">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <h2 className="text-card-title">Daily PRJ Details</h2>
              </div>
              <p className="text-body-sm">{locationId ? `Location ${locationId}` : "Pick a location to see its day-by-day figures"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3" data-tour="daily-prj-location-picker">
              <SelectSearch
                options={locationOptions}
                value={locationId}
                onChange={setLocationId}
                placeholder="Select location"
                containerClassName="w-64"
                autoFocusSearch={false}
              />
              {locationId && (
                <div data-tour="daily-prj-detail-search">
                  <ResponsiveSearchBar value={detailSearch} onChange={setDetailSearch} placeholder="Search date..." suggestions={detailSuggestions} />
                </div>
              )}
              <TextButton
                variant="outline"
                tone="neutral"
                size="sm"
                data-tour="daily-prj-detail-hide"
                leadingIcon={detailTableVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                onClick={() => setDetailTableVisible((v) => !v)}
              >
                {detailTableVisible ? "Hide table" : "Show table"}
              </TextButton>
            </div>
          </div>
          <div className="mx-5 mt-3 border-b border-slate-200 dark:border-slate-800" />
          <div className="space-y-4 px-5 pb-5">
            {locationId ? (
              <>
                {detail.error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
                    Couldn't load daily PRJ detail: {detail.error.message}
                  </div>
                )}
                {detailTableVisible && (
                  <>
                    <div data-tour="daily-prj-month-summary">
                      <MonthSummaryTable data={monthSummaryRows} />
                    </div>
                    <div data-tour="daily-prj-detail-table">
                      <DetailTable data={detailRows} prjTypes={detail.data?.prj_types ?? []} loading={detail.loading} />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Target className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                      <h3 className="text-section-title">PRJ Target Summary</h3>
                    </div>
                    <div data-tour="daily-prj-target">
                      <TargetTable data={targetRows} />
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <MapPin className="h-6 w-6" />
                </span>
                <p className="text-body">Pick a location above (or click its Code in the summary table) to see its daily PRJ breakdown.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} onShowTour={startTour} steps={USAGE_STEPS} />

      <ConfirmModal
        open={downloadConfirmOpen}
        onClose={() => setDownloadConfirmOpen(false)}
        onConfirm={confirmDownload}
        title="Download Daily PRJ report?"
        confirmLabel="Download"
        details={[
          { label: "Report", value: summary.data?.summary_sheet?.title ?? "Location wise PRJ Summary" },
          { label: "Period", value: format(reportingMonth, "MMMM yyyy") },
          { label: "Locations", value: summaryRowsRaw.length },
          { label: "Format", value: "Excel (.xlsx)" },
        ]}
      >
        <span data-tour="daily-prj-download-modal">This exports every location's PRJ summary for the selected month as an Excel file.</span>
      </ConfirmModal>

      <SuccessModal
        open={downloadSuccessOpen}
        onClose={() => setDownloadSuccessOpen(false)}
        title="Download started"
        primaryActionLabel="Done"
        details={[
          { label: "Period", value: format(reportingMonth, "MMMM yyyy") },
          { label: "Locations", value: summaryRowsRaw.length },
        ]}
      >
        Your browser is saving the Daily PRJ Excel report now — check your downloads.
      </SuccessModal>
    </div>
  );
}
