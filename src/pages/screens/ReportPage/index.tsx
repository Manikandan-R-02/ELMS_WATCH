import { useScrollToSection } from "../../../hooks/useScrollToSection";
import { useEffect, useMemo, useRef, useState } from "react";
import { format, isAfter, startOfMonth } from "date-fns";
import { AlertCircle, CheckCircle2, FileSpreadsheet, FileText, History, Info } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/cards/Card";
import { SelectSearch } from "../../../components/fields/SelectSearch";
import { MonthPicker } from "../../../components/datetime/MonthPicker";
import { Table, type Column } from "../../../components/table/Table";
import { TextBadge, type BadgeStatus } from "../../../components/badges/StatusBadge";
import { DotsLoader } from "../../../components/loader/DotsLoader";
import { TextButton } from "../../../components/buttons/TextButton";
import { DeleteTextButton, DownloadTextButton } from "../../../components/buttons/ActionTextButtons";
import { RefreshSlideButton } from "../../../components/buttons/SlideButton";
import { RefreshRoundedButton } from "../../../components/buttons/ActionRoundedButtons";
import { usePeriodStore } from "../../../store/periodStore";
import { useApiRequest } from "../../../api/useApiRequest";
import { showErrorToast, showSuccessToast, showWarningToast } from "../../../store/toastStore";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../../hooks/useRegisterScreenTour";
import { reportTourSteps } from "../../../components/onboarding/screenSteps/report";
import { generateReport } from "./api";
import { HISTORY_LIMIT, REPORT_CATALOG, type ReportHistoryEntry, type ReportResult } from "./data";
import { HelpModal } from "../../../components/modals/HelpModal";

const USAGE_STEPS = [
  { q: "What does this screen do?", a: "Generates any of the consolidated Excel reports for a chosen month, then gives you a link to download it." },
  { q: "How do I generate a report?", a: 'Pick a report (type to search the list), check the period (it starts on the month selected in the top header), then click "Generate Report".' },
  { q: 'What does "No data" mean?', a: "The report ran, but there was nothing to export for that month — try a different period." },
  { q: "Where are my earlier reports?", a: 'Every attempt in this session is listed under "Recent Generations" (the last 10), with a Download button for each successful one. The list resets when you reload the page.' },
];

const REPORT_OPTIONS = [...REPORT_CATALOG]
  .sort((a, b) => a.label.localeCompare(b.label))
  .map((r) => ({ label: r.label, value: r.key }));

const RESULT_BADGE: Record<ReportResult["kind"], { status: BadgeStatus; label: string }> = {
  success: { status: "success", label: "Success" },
  nodata: { status: "warning", label: "No data" },
  error: { status: "error", label: "Failed" },
};

interface FormErrors {
  report?: string;
  period?: string;
}

/** Same anchor-click technique as Daily PRJ's Excel export — a `Content-Disposition: attachment`
 * response saves directly instead of flashing open a blank tab the way `window.open` does. */
function triggerDownload(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function validate(reportKey: string | null, period: Date | null): FormErrors {
  const errors: FormErrors = {};
  if (!reportKey) errors.report = "Select a report to generate.";
  if (!period) {
    errors.period = "Select a period.";
  } else if (isAfter(startOfMonth(period), startOfMonth(new Date()))) {
    errors.period = "Period can't be in the future.";
  }
  return errors;
}

export function ReportPage() {
  const reportingMonth = usePeriodStore((s) => s.selectedMonth);
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(() => startScreenTour(reportTourSteps));
  const [helpOpen, setHelpOpen] = useState(false);

  const [reportKey, setReportKey] = useState<string | null>(null);
  const [period, setPeriod] = useState<Date | null>(reportingMonth);
  const [errors, setErrors] = useState<FormErrors>({});

  // The latest attempt — kept separate from `history` so the result panel shows exactly the run the
  // reader just triggered, even after they change the form fields for the next one.
  const [lastRun, setLastRun] = useState<ReportHistoryEntry | null>(null);
  const [history, setHistory] = useState<ReportHistoryEntry[]>([]);
  const nextId = useRef(1);

  const generation = useApiRequest(generateReport);

  // The form's period starts on (and follows) the app-wide reporting month from the header, same
  // as every other screen — the reader can still pick a different one here for this report only.
  useEffect(() => {
    setPeriod(reportingMonth);
  }, [reportingMonth]);

  const selectedReport = useMemo(() => REPORT_CATALOG.find((r) => r.key === reportKey) ?? null, [reportKey]);

  const resultSection = useScrollToSection();

  async function handleGenerate() {
    if (generation.loading) return;
    resultSection.request();
    const nextErrors = validate(reportKey, period);
    setErrors(nextErrors);
    if (nextErrors.report || nextErrors.period || !selectedReport || !period) {
      showWarningToast("Check the form", "Fix the highlighted fields before generating.");
      return;
    }

    const result = await generation.run(selectedReport.key, period);
    // `null` only when a newer run superseded this one (useApiRequest's stale-response guard) —
    // `generateReport` itself never rejects.
    if (!result) return;

    const entry: ReportHistoryEntry = {
      id: nextId.current++,
      reportKey: selectedReport.key,
      reportLabel: selectedReport.label,
      period,
      generatedAt: new Date(),
      result,
    };
    setLastRun(entry);
    setHistory((prev) => [entry, ...prev].slice(0, HISTORY_LIMIT));

    if (result.kind === "success") showSuccessToast("Report generated", `${selectedReport.label} is ready to download.`);
    else if (result.kind === "nodata") showWarningToast("No data", result.message);
    else showErrorToast("Generation failed", result.message);
  }

  function handleReset() {
    setReportKey(null);
    setPeriod(reportingMonth);
    setErrors({});
    setLastRun(null);
  }

  const historyColumns: Column<ReportHistoryEntry>[] = [
    { key: "index", header: "#", align: "center", width: "56px", render: (_row, index) => index + 1 },
    {
      key: "report",
      header: "Report",
      render: (row) => (
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <FileSpreadsheet className="h-3.5 w-3.5" />
          </span>
          <span className="font-medium">{row.reportLabel}</span>
        </span>
      ),
    },
    { key: "period", header: "Period", render: (row) => <span className="font-semibold text-brand-700 dark:text-brand-300">{format(row.period, "MMM yyyy")}</span> },
    { key: "status", header: "Status", render: (row) => <TextBadge {...RESULT_BADGE[row.result.kind]} /> },
    { key: "time", header: "Generated at", render: (row) => format(row.generatedAt, "hh:mm a") },
    {
      key: "action",
      header: "Action",
      align: "center",
      render: (row) => {
        const result = row.result;
        return result.kind === "success" ? (
          <DownloadTextButton size="sm" onClick={() => triggerDownload(result.downloadUrl)} />
        ) : (
          <span className="text-slate-400">—</span>
        );
      },
    },
  ];

  return (
    <div className="space-y-3">
      <PageHeader
        icon={FileText}
        title="Report Generator"
        dataTour="report-header"
        onHelp={() => setHelpOpen(true)}
        badge={{ icon: FileSpreadsheet, label: `${REPORT_CATALOG.length} reports available` }}
        actions={
          <>
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <RefreshRoundedButton label="Reset form" onClick={handleReset} data-tour="report-reset" />
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <RefreshSlideButton label="Reset form" onClick={handleReset} data-tour="report-reset" />
            </div>
          </>
        }
      />

      <Card padded={false} data-tour="report-form">
        <div className="px-5 pt-5">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <h2 className="text-card-title">Generate Report</h2>
          </div>
          <p className="text-body-sm">Pick a report and a period, then generate the Excel file.</p>
        </div>
        <div className="mx-5 mt-3 border-b border-slate-200 dark:border-slate-800" />
        <div className="space-y-4 px-5 py-5">
          <div data-tour="report-filters" className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
            <div data-tour="report-select">
              <SelectSearch
                label="Report"
                required
                options={REPORT_OPTIONS}
                value={reportKey}
                onChange={(v) => {
                  setReportKey(v);
                  if (errors.report) setErrors((e) => ({ ...e, report: undefined }));
                }}
                placeholder="Select a report"
                searchPlaceholder="Search reports..."
                emptyMessage="No reports match your search"
                error={errors.report}
                disabled={generation.loading}
                portal
              />
            </div>
            <div data-tour="report-period">
              <MonthPicker
                label="Period"
                required
                value={period}
                onChange={(d) => {
                  setPeriod(d);
                  if (errors.period) setErrors((e) => ({ ...e, period: undefined }));
                }}
                error={errors.period}
                disabled={generation.loading}
                portal
              />
            </div>
            {/* `md:pt-[1.625rem]` drops the button by one field-label's height so it lines up with
                the two inputs beside it rather than their labels. */}
            <div className="md:pt-[1.625rem]">
              <TextButton
                data-tour="report-generate-button"
                onClick={handleGenerate}
                loading={generation.loading}
                leadingIcon={<FileSpreadsheet className="h-4 w-4" />}
                className="w-full md:w-auto"
              >
                {generation.loading ? "Generating..." : "Generate Report"}
              </TextButton>
            </div>
          </div>

          {(generation.loading || lastRun) && (
            <div data-tour="report-result" ref={resultSection.ref} className="scroll-mt-32">
              <ResultPanel generating={generation.loading} pendingLabel={selectedReport?.label} pendingPeriod={period} lastRun={lastRun} />
            </div>
          )}
        </div>
      </Card>

      {history.length > 0 && (
        <Card padded={false} data-tour="report-history">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
            <div>
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <h2 className="text-card-title">Recent Generations</h2>
              </div>
              <p className="text-body-sm">
                Last {history.length} of up to {HISTORY_LIMIT} this session
              </p>
            </div>
            <div data-tour="report-history-clear">
              <DeleteTextButton label="Clear history" size="sm" variant="outline" onClick={() => setHistory([])} />
            </div>
          </div>
          <div className="mx-5 mt-3 border-b border-slate-200 dark:border-slate-800" />
          <div className="px-5 pb-5 pt-4">
            <Table columns={historyColumns} data={history} rowKey={(row) => row.id} />
          </div>
        </Card>
      )}

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} onShowTour={() => startScreenTour(reportTourSteps)} steps={USAGE_STEPS} />
    </div>
  );
}

interface ResultPanelProps {
  generating: boolean;
  pendingLabel?: string;
  pendingPeriod: Date | null;
  lastRun: ReportHistoryEntry | null;
}

/** The status box under the form — "generating", then the outcome of the latest run. Uses
 * `role="status"`/`aria-live` so a screen reader announces the result without the reader having to
 * go looking for it. */
function ResultPanel({ generating, pendingLabel, pendingPeriod, lastRun }: Readonly<ResultPanelProps>) {
  if (generating) {
    return (
      <output aria-live="polite" className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-500/30 dark:bg-brand-500/10">
        <DotsLoader size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">Generating report...</p>
          <p className="text-body-sm truncate">
            {pendingLabel} · {pendingPeriod ? format(pendingPeriod, "MMMM yyyy") : ""}
          </p>
        </div>
      </output>
    );
  }

  if (!lastRun) return null;
  const { result } = lastRun;
  const subtitle = `${lastRun.reportLabel} · ${format(lastRun.period, "MMMM yyyy")}`;

  if (result.kind === "success") {
    return (
      <output aria-live="polite" className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <div className="flex min-w-0 items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Report generated successfully</p>
            <p className="text-body-sm truncate">{subtitle}</p>
            <p className="text-caption truncate">{result.filename}</p>
          </div>
        </div>
        <DownloadTextButton label="Download Excel" onClick={() => triggerDownload(result.downloadUrl)} className="shrink-0" />
      </output>
    );
  }

  if (result.kind === "nodata") {
    return (
      <output aria-live="polite" className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 dark:border-yellow-500/30 dark:bg-yellow-500/10">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">No data for this period</p>
          <p className="text-body-sm">{result.message}</p>
          <p className="text-caption truncate">{subtitle}</p>
        </div>
      </output>
    );
  }

  return (
    <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-500/10">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">Generation failed</p>
        <p className="text-body-sm">{result.message}</p>
        <p className="text-caption truncate">{subtitle}</p>
      </div>
    </div>
  );
}
