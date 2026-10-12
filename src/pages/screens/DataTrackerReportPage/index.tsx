import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ClipboardList, ClipboardCheck } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/cards/Card";
import { ResponsiveSearchBar } from "../../../components/search/ResponsiveSearchBar";
import { RefreshSlideButton, DownloadSlideButton } from "../../../components/buttons/SlideButton";
import { RefreshRoundedButton, DownloadRoundedButton } from "../../../components/buttons/ActionRoundedButtons";
import { usePeriodStore } from "../../../store/periodStore";
import { useApiRequest } from "../../../api/useApiRequest";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../../hooks/useRegisterScreenTour";
import { dataTrackerReportTourSteps } from "../../../components/onboarding/screenSteps/dataTrackerReport";
import { DetailTable } from "./DetailTable";
import { fetchDataTrackerReport } from "./api";
import { HelpModal } from "../../../components/modals/HelpModal";

const USAGE_STEPS = [
  { q: "What does this screen show?", a: "Whether every location reported its Consumption, Manday, and Staff Onsite data on each day of the reporting month — a quick Yes/No availability grid instead of hunting through each screen individually." },
  { q: "How do I find one location?", a: "Use the search field to filter by location ID or name — it narrows the table instantly without reloading the report." },
  { q: "What does a red \"No\" mean?", a: "That location didn't submit that category's data for that day — worth following up on before month-close." },
  { q: "How do I get this as a file?", a: 'Click "Download Excel" to export the exact same grid for the selected month.' },
];

function triggerExcelDownload(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function DataTrackerReportPage() {
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(() => startScreenTour(dataTrackerReportTourSteps));
  const reportingMonth = usePeriodStore((s) => s.selectedMonth);
  const [helpOpen, setHelpOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");

  const report = useApiRequest(fetchDataTrackerReport);
  useEffect(() => {
    report.run(reportingMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportingMonth, refreshKey]);

  function handleRefresh() {
    setSearch("");
    setRefreshKey((k) => k + 1);
  }

  const rowsRaw = useMemo(() => report.data?.rows ?? [], [report.data]);
  const debouncedSearch = useDebouncedValue(search, 200);
  const rows = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return rowsRaw;
    return rowsRaw.filter((r) => `${r.locationId} ${r.locationName}`.toLowerCase().includes(q));
  }, [rowsRaw, debouncedSearch]);
  const searchSuggestions = useMemo(() => {
    const byId = new Map(rowsRaw.map((r) => [r.locationId, `${r.locationId} ${r.locationName}`] as const));
    return Array.from(byId.values());
  }, [rowsRaw]);

  const downloadUrl = report.data?.downloadUrl;

  return (
    <div className="space-y-3">
      <PageHeader
        icon={ClipboardList}
        title="Data Tracker Report"
        dataTour="data-tracker-report-header"
        onHelp={() => setHelpOpen(true)}
        actions={
          <>
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <RefreshRoundedButton label="Refresh" onClick={handleRefresh} data-tour="data-tracker-report-refresh" />
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <RefreshSlideButton onClick={handleRefresh} data-tour="data-tracker-report-refresh" />
            </div>
          </>
        }
      />

      {report.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
          Couldn't load the Data Tracker report: {report.error.message}
        </div>
      )}

      <Card padded={false} data-tour="data-tracker-report-table">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <div data-tour="data-tracker-report-summary">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <h2 className="text-card-title">Data Availability Detail</h2>
            </div>
            <p className="text-body-sm">
              Period: {format(reportingMonth, "MMMM yyyy")} · {report.data?.locationCount ?? 0} locations · {report.data?.dayNumbers.length ?? 0} days
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3" data-tour="data-tracker-report-toolbar">
            <div data-tour="data-tracker-report-legend" className="flex items-center gap-3 text-caption">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Yes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> No
              </span>
            </div>
            <div data-tour="data-tracker-report-search">
              <ResponsiveSearchBar value={search} onChange={setSearch} placeholder="Search location..." suggestions={searchSuggestions} />
            </div>
            {downloadUrl && (
              <>
                <div data-tour="data-tracker-report-download" className="sm:hidden">
                  <DownloadRoundedButton label="Download Excel" onClick={() => triggerExcelDownload(downloadUrl)} />
                </div>
                <div data-tour="data-tracker-report-download" className="hidden sm:block">
                  <DownloadSlideButton label="Download Excel" onClick={() => triggerExcelDownload(downloadUrl)} />
                </div>
              </>
            )}
          </div>
        </div>
        <div className="mx-5 mt-3 border-b border-slate-200 dark:border-slate-800" />
        <div className="px-5 pb-5">
          <DetailTable data={rows} dayNumbers={report.data?.dayNumbers ?? []} dayDates={report.data?.dayDates ?? []} loading={report.loading} />
        </div>
      </Card>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} onShowTour={() => startScreenTour(dataTrackerReportTourSteps)} steps={USAGE_STEPS} />
    </div>
  );
}
