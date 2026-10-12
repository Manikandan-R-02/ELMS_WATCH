import { useEffect, useMemo, useState } from "react";
import { isAfter, startOfMonth, startOfToday } from "date-fns";
import { History, UserRound } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/cards/Card";
import { Segmented } from "../../../components/common/Segmented";
import { ResponsiveSearchBar } from "../../../components/search/ResponsiveSearchBar";
import { DatePicker } from "../../../components/datetime/DatePicker";
import { MonthPicker } from "../../../components/datetime/MonthPicker";
import { YearPicker } from "../../../components/datetime/YearPicker";
import { Table, type Column } from "../../../components/table/Table";
import { TextBadge } from "../../../components/badges/StatusBadge";
import { DownloadSlideButton, RefreshSlideButton, CancelSlideButton } from "../../../components/buttons/SlideButton";
import { DownloadRoundedButton, RefreshRoundedButton, CancelRoundedButton } from "../../../components/buttons/ActionRoundedButtons";
import { useApiRequest } from "../../../api/useApiRequest";
import { toApiError } from "../../../api/types";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { showErrorToast, showSuccessToast } from "../../../store/toastStore";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../../hooks/useRegisterScreenTour";
import { userLogTourSteps } from "../../../components/onboarding/screenSteps/userLog";
import { downloadUserLogExcel, fetchUserLog } from "./api";
import { PERIOD_OPTIONS, type UserLogEntry, type UserLogPeriod, type UserLogQuery } from "./data";
import { HelpModal } from "../../../components/modals/HelpModal";

const USAGE_STEPS = [
  { q: "What does this screen show?", a: "Every user's login and logout time for the period you choose — Current Day, Week, Month, or Year." },
  { q: "How do I narrow it down?", a: "Pick a period tab, then a date/month/year for it, and use the search box to filter by name, email, or role." },
  { q: "How do I export it?", a: 'Click "Export" to download the currently-shown period as an Excel workbook.' },
];

const currentYear = new Date().getFullYear();

export function UserLogPage() {
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(startTour);
  const [helpOpen, setHelpOpen] = useState(false);
  const [periodTab, setPeriodTab] = useState<UserLogPeriod>("year");
  const [dayValue, setDayValue] = useState<Date | null>(startOfToday());
  const [monthValue, setMonthValue] = useState<Date>(startOfMonth(new Date()));
  const [monthError, setMonthError] = useState("");
  const [yearValue, setYearValue] = useState<number>(currentYear);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 250);

  const query: UserLogQuery = useMemo(() => {
    if (periodTab === "day") return { period: "day", date: dayValue ?? startOfToday() };
    if (periodTab === "week") return { period: "week", date: dayValue ?? startOfToday() };
    if (periodTab === "month") return { period: "month", date: monthValue };
    return { period: "year", year: yearValue };
  }, [periodTab, dayValue, monthValue, yearValue]);

  const log = useApiRequest(fetchUserLog);

  useEffect(() => {
    log.run(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodTab, dayValue, monthValue, yearValue]);

  function handleReset() {
    setPeriodTab("year");
    setYearValue(currentYear);
    setDayValue(startOfToday());
    setMonthValue(startOfMonth(new Date()));
    setMonthError("");
    setSearch("");
  }

  function handleMonthChange(next: Date) {
    if (isAfter(startOfMonth(next), startOfMonth(new Date()))) {
      setMonthError("Period can't be in the future.");
      return;
    }
    setMonthError("");
    setMonthValue(next);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await downloadUserLogExcel(query);
      showSuccessToast("Export ready", "The user log workbook has downloaded.");
    } catch (err) {
      showErrorToast("Export failed", toApiError(err).message || "Please try again.");
    } finally {
      setExporting(false);
    }
  }

  // "Show tour" (help modal) — walks every control, switching the period tab for the steps that show a
  // different date picker. Each control sets the whole view (see `TourStep.before`), and the end puts the
  // period tab back as it was when the tour started. The tour never exports anything.
  function startTour() {
    const startPeriod = periodTab;
    startScreenTour(userLogTourSteps({ showPeriod: setPeriodTab, startPeriod }), () => setPeriodTab(startPeriod));
  }

  const allRows = useMemo(() => log.data ?? [], [log.data]);
  // One concatenated haystack per row (name, email, role) — same convention every other screen's
  // search uses, so the suggestion dropdown's entries are guaranteed to match once clicked.
  const rowHaystack = useMemo(
    () => allRows.map((r) => `${r.userName} ${r.userEmailId} ${r.userTypeWord ?? ""}`.toLowerCase()),
    [allRows]
  );
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((_, i) => rowHaystack[i].includes(q));
  }, [allRows, rowHaystack, debouncedSearch]);
  // Must be an actual substring of `rowHaystack`'s matching entry (same field order, no extra
  // punctuation) so clicking a suggestion is guaranteed to match it via the filter above.
  // De-duplicated — the same user has one row per login, so without this every suggestion would
  // repeat once per login event instead of once per user.
  const rowSuggestions = useMemo(() => Array.from(new Set(allRows.map((r) => `${r.userName} ${r.userEmailId}`.trim()))), [allRows]);

  const { rows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged(
    filtered,
    (row, key) => {
      if (key === "login") return row.loginStr ?? "";
      if (key === "logout") return row.logoutStr ?? "";
      return row.userEmailId;
    },
    10,
    { key: "user", direction: "asc" }
  );

  const columns: Column<UserLogEntry>[] = [
    { key: "index", header: "#", align: "center", width: "52px", render: (_row, i) => (pagination.page - 1) * pagination.pageSize + i + 1 },
    {
      key: "user",
      header: "User Detail",
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            {(row.userName || row.userEmailId).slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block whitespace-normal break-words font-medium text-slate-800 dark:text-slate-100">{row.userName || "—"}</span>
            <span className="flex items-center gap-1.5">
              <span className="block whitespace-normal break-all text-xs text-slate-400 dark:text-slate-500">{row.userEmailId}</span>
              {row.userTypeWord && <TextBadge status="info" label={row.userTypeWord} className="shrink-0" />}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "login",
      header: "Log In",
      sortable: true,
      render: (row) =>
        row.loginStr ? <TextBadge status="success" label={row.loginStr} /> : <span className="text-slate-400">—</span>,
    },
    {
      key: "logout",
      header: "Logout",
      sortable: true,
      render: (row) =>
        row.logoutStr ? <TextBadge status="error" label={row.logoutStr} /> : <span className="text-slate-400">—</span>,
    },
  ];

  return (
    <div className="space-y-3">
      <PageHeader
        icon={History}
        title="User Log"
        dataTour="user-log-header"
        onHelp={() => setHelpOpen(true)}
        badge={{ icon: UserRound, label: `${allRows.length} records` }}
        actions={
          <>
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <CancelRoundedButton label="Reset" onClick={handleReset} data-tour="user-log-reset" />
              <RefreshRoundedButton label="Refresh" onClick={() => log.run(query)} data-tour="user-log-refresh" />
              <DownloadRoundedButton label="Export" onClick={handleExport} disabled={allRows.length === 0 || exporting} data-tour="user-log-export" />
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <CancelSlideButton label="Reset" onClick={handleReset} data-tour="user-log-reset" />
              <RefreshSlideButton label="Refresh" onClick={() => log.run(query)} data-tour="user-log-refresh" />
              <DownloadSlideButton label="Export" onClick={handleExport} disabled={allRows.length === 0 || exporting} data-tour="user-log-export" />
            </div>
          </>
        }
      />

      {log.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
          Couldn't load the user log: {log.error.message}
        </div>
      )}

      <Card padded={false}>
        <div className="space-y-4 px-5 pt-5" data-tour="user-log-filters">
          <div data-tour="user-log-periods">
            <Segmented options={PERIOD_OPTIONS} value={periodTab} onChange={setPeriodTab} />
          </div>
          <div data-tour="user-log-picker" className="grid grid-cols-1 gap-4 sm:max-w-xs">
            {(periodTab === "day" || periodTab === "week") && (
              <DatePicker label={periodTab === "day" ? "Date" : "Any day in the week"} value={dayValue} onChange={setDayValue} maxDate={new Date()} portal />
            )}
            {periodTab === "month" && <MonthPicker label="Month" value={monthValue} onChange={handleMonthChange} error={monthError} portal />}
            {periodTab === "year" && <YearPicker label="Year" value={yearValue} onChange={setYearValue} minYear={currentYear - 4} maxYear={currentYear} portal />}
          </div>
        </div>
        <div className="mx-5 mt-4 border-b border-slate-200 dark:border-slate-800" />
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
          <span className="text-caption">
            Showing {filtered.length} of {allRows.length} records{debouncedSearch ? ` matching "${debouncedSearch}"` : ""}
          </span>
          <div data-tour="user-log-search">
            <ResponsiveSearchBar value={search} onChange={setSearch} placeholder="Search name, email, or role..." suggestions={rowSuggestions} />
          </div>
        </div>
        <div className="px-5 pb-5 pt-4" data-tour="user-log-table">
          <Table
            columns={columns}
            data={rows}
            rowKey={(row, i) => `${row.userEmailId}-${i}`}
            loading={log.loading}
            emptyMessage={debouncedSearch ? "No records match your search" : "No login activity for this period"}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={onSortChange}
            pagination={pagination}
          />
        </div>
      </Card>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} onShowTour={startTour} steps={USAGE_STEPS} />
    </div>
  );
}
