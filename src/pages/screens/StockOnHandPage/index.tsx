import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Building2, Filter as FilterIcon, MapPin, PackageSearch } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/cards/Card";
import { ResponsiveSearchBar } from "../../../components/search/ResponsiveSearchBar";
import { SelectSearch } from "../../../components/fields/SelectSearch";
import { RefreshSlideButton, DownloadSlideButton } from "../../../components/buttons/SlideButton";
import { RefreshRoundedButton, DownloadRoundedButton } from "../../../components/buttons/ActionRoundedButtons";
import { ConfirmModal, SuccessModal } from "../../../components/modals/StatusModals";
import { usePeriodStore } from "../../../store/periodStore";
import { useApiRequest } from "../../../api/useApiRequest";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../../hooks/useRegisterScreenTour";
import { useScrollToSection } from "../../../hooks/useScrollToSection";
import { stockOnHandTourSteps } from "../../../components/onboarding/screenSteps/stockOnHand";
import { toApiError } from "../../../api/types";
import { SummaryTable } from "./SummaryTable";
import { DetailTable } from "./DetailTable";
import { CategoryBreakdown } from "./CategoryBreakdown";
import {
  DEFAULT_STOCK_ON_HAND_FILTER,
  StockOnHandLocationPicker,
  type StockOnHandFilter,
} from "./StockOnHandLocationPicker";
import { downloadStockOnHandReport, fetchAllLocationOptions, fetchStockOnHandDetail, fetchStockOnHandSummary } from "./api";
import { HelpModal } from "../../../components/modals/HelpModal";

const USAGE_STEPS = [
  { q: "What does this screen show?", a: "Every location's current Stock On Hand for the reporting month (item count, current/past/previous/average/closing quantity, stock amount), plus one location's full item-level breakdown once you pick it." },
  { q: "How do I see one location's items?", a: 'Click a location\'s Code in the "Location wise SOH Summary" table, or use the Location Type / Location fields in the "Location Detail" card.' },
  { q: "What does the Category filter do?", a: "Once a location is selected, use the Category dropdown above the item table to narrow it to one item category — the chart above the table always shows the full breakdown regardless of that filter." },
  { q: "What's the Days Holding warning?", a: "An item whose days-holding exceeds the location's stock-holding threshold is flagged with an amber warning icon in the detail table." },
];

const ALL_CATEGORY = "All Category";

export function StockOnHandPage() {
  const reportingMonth = usePeriodStore((s) => s.selectedMonth);
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(startTour);
  const detailSection = useScrollToSection();
  const [helpOpen, setHelpOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [filter, setFilter] = useState<StockOnHandFilter>(DEFAULT_STOCK_ON_HAND_FILTER);

  const [summarySearch, setSummarySearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [itemCategory, setItemCategory] = useState(ALL_CATEGORY);

  const [downloadConfirmOpen, setDownloadConfirmOpen] = useState(false);
  const [downloadSuccessOpen, setDownloadSuccessOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  // Old app's own two separate buttons — "Download All" (always every location, regardless of
  // whatever's currently selected) beside the summary table, and "Download Location" (only the
  // selected location, disabled until one is picked) inside the detail card — undefined vs. a
  // specific ID, rather than one ambiguous button that silently changes scope based on whatever
  // `filter.locationId` happens to be at click time.
  const [downloadScope, setDownloadScope] = useState<string | undefined>(undefined);

  function handleRefresh() {
    setFilter(DEFAULT_STOCK_ON_HAND_FILTER);
    setItemCategory(ALL_CATEGORY);
    setItemSearch("");
    setRefreshKey((k) => k + 1);
  }

  // ── All locations — drives both the filter modal and the summary aggregation below ───────────
  const allLocations = useApiRequest(fetchAllLocationOptions);
  useEffect(() => {
    allLocations.run(reportingMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportingMonth, refreshKey]);

  // ── sohAnalysisLst, once per location — the "Location wise SOH Summary" table ─────────────────
  const summary = useApiRequest(fetchStockOnHandSummary);
  useEffect(() => {
    if (!allLocations.data || allLocations.data.length === 0) return;
    summary.run(reportingMonth, allLocations.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLocations.data, reportingMonth, refreshKey]);

  const summaryRows = useMemo(() => summary.data ?? [], [summary.data]);
  const debouncedSummarySearch = useDebouncedValue(summarySearch, 200);
  const filteredSummaryRows = useMemo(() => {
    const q = debouncedSummarySearch.trim().toLowerCase();
    if (!q) return summaryRows;
    return summaryRows.filter((r) => `${r.locationId} ${r.locationName}`.toLowerCase().includes(q));
  }, [summaryRows, debouncedSummarySearch]);
  const summarySuggestions = useMemo(() => summaryRows.map((r) => `${r.locationId} ${r.locationName}`), [summaryRows]);

  // ── sohAnalysisLst, for the selected location — the item-level detail + category chart ───────
  const detail = useApiRequest(fetchStockOnHandDetail);
  useEffect(() => {
    if (!filter.locationId) return;
    detail.run(filter.locationId, reportingMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.locationId, reportingMonth, refreshKey]);

  const detailRows = useMemo(() => detail.data?.rows ?? [], [detail.data]);
  const stockGrtDaysThreshold = detail.data?.stockGrtDaysThreshold ?? null;

  const categoryOptions = useMemo(() => {
    const cats = Array.from(new Set(detailRows.map((r) => r.categoryName).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    return [{ label: ALL_CATEGORY, value: ALL_CATEGORY }, ...cats.map((c) => ({ label: c, value: c }))];
  }, [detailRows]);

  useEffect(() => setItemCategory(ALL_CATEGORY), [filter.locationId]);

  const debouncedItemSearch = useDebouncedValue(itemSearch, 200);
  const filteredDetailRows = useMemo(() => {
    let rows = detailRows;
    if (itemCategory !== ALL_CATEGORY) rows = rows.filter((r) => r.categoryName === itemCategory);
    const q = debouncedItemSearch.trim().toLowerCase();
    if (q) rows = rows.filter((r) => `${r.itemId} ${r.itemName}`.toLowerCase().includes(q));
    return rows;
  }, [detailRows, itemCategory, debouncedItemSearch]);
  const itemSuggestions = useMemo(() => detailRows.map((r) => `${r.itemId} ${r.itemName}`), [detailRows]);

  // "Show tour" (help modal) — walks every control, opening the download confirmation and a location's detail for
  // the steps that need them. Each control sets the whole view (see `TourStep.before`), and the end hands the
  // screen back as it was when the tour started. The tour never changes the picker's own choices beyond choosing
  // the first listed location when none is chosen, and never downloads anything.
  function startTour() {
    const startFilter = filter;
    const firstLocationId = summaryRows.at(0)?.locationId ?? null;
    const closeDialogs = () => {
      setDownloadConfirmOpen(false);
      setDownloadSuccessOpen(false);
    };
    startScreenTour(
      stockOnHandTourSteps({
        hasSummary: firstLocationId !== null,
        showPage: closeDialogs,
        showDetail: () => {
          closeDialogs();
          setFilter((f) => (f.locationId || !firstLocationId ? f : { ...f, locationId: firstLocationId }));
        },
        openDownloadConfirm: () => {
          setDownloadSuccessOpen(false);
          setDownloadError("");
          setDownloadScope(undefined);
          setDownloadConfirmOpen(true);
        },
      }),
      () => {
        closeDialogs();
        setFilter(startFilter);
      }
    );
  }

  function selectLocation(id: string) {
    setFilter((f) => ({ ...f, locationId: id }));
    detailSection.request();
  }

  function handleDownloadRequest(scopeLocationId?: string) {
    setDownloadError("");
    setDownloadScope(scopeLocationId);
    setDownloadConfirmOpen(true);
  }

  async function confirmDownload() {
    setDownloading(true);
    try {
      // Saves a real file, or opens the link a JSON reply carries; the backend's own message comes back as the
      // error when it refuses (see src/api/fileDownload.ts).
      await downloadStockOnHandReport(reportingMonth, downloadScope);
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
        icon={PackageSearch}
        title="Stock On Hand"
        dataTour="stock-on-hand-header"
        onHelp={() => setHelpOpen(true)}
        actions={
          <>
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <RefreshRoundedButton label="Refresh" onClick={handleRefresh} data-tour="stock-on-hand-refresh" />
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <RefreshSlideButton onClick={handleRefresh} data-tour="stock-on-hand-refresh" />
            </div>
          </>
        }
      />

      {allLocations.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
          Couldn't load the locations: {allLocations.error.message}
        </div>
      )}
      {summary.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
          Couldn't load the Stock On Hand summary: {summary.error.message}
        </div>
      )}

      <Card padded={false} data-tour="stock-on-hand-summary">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <h2 className="text-card-title">Location wise SOH Summary</h2>
            </div>
            <p className="text-body-sm">Period: {format(reportingMonth, "MMMM yyyy")} · {summaryRows.length} locations</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div data-tour="stock-on-hand-summary-search">
              <ResponsiveSearchBar value={summarySearch} onChange={setSummarySearch} placeholder="Search location..." suggestions={summarySuggestions} />
            </div>
            <div data-tour="stock-on-hand-download-all" className="sm:hidden">
              <DownloadRoundedButton label="Download All" onClick={() => handleDownloadRequest()} />
            </div>
            <div data-tour="stock-on-hand-download-all" className="hidden sm:block">
              <DownloadSlideButton label="Download All" onClick={() => handleDownloadRequest()} />
            </div>
          </div>
        </div>
        <div className="mx-5 mt-3 border-b border-slate-200 dark:border-slate-800" />
        <div data-tour="stock-on-hand-summary-table" className="px-5 pb-5">
          <SummaryTable data={filteredSummaryRows} loading={summary.loading || allLocations.loading} onSelectLocation={selectLocation} />
        </div>
      </Card>

      <div ref={detailSection.ref} className="scroll-mt-32">
    <Card padded={false} data-tour="stock-on-hand-detail">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <h2 className="text-card-title">Location Detail</h2>
              </div>
              <p className="text-body-sm">{filter.locationId ? `Location ${filter.locationId}` : "Pick a location to see its Stock On Hand breakdown"}</p>
            </div>
            {/* Location type + category + ID, inline in this same header row instead of behind a
                filter-modal trigger — this screen only ever has the one picker (no item-category/
                source-type filters competing for the row like Consumption Analysis has), so keeping
                it inline is simpler than a modal indirection. */}
            <div data-tour="stock-on-hand-picker" className="flex flex-wrap items-center gap-2">
              <StockOnHandLocationPicker value={filter} onChange={setFilter} reportingMonth={reportingMonth} />
              {/* Old app's separate "Download Location" button (disabled until a location is
                  picked) — distinct from the summary card's "Download All" above, not the same
                  button silently changing scope based on whatever's currently selected. */}
              <div data-tour="stock-on-hand-download-location" className="sm:hidden">
                <DownloadRoundedButton label="Download Location" onClick={() => handleDownloadRequest(filter.locationId ?? undefined)} disabled={!filter.locationId} />
              </div>
              <div data-tour="stock-on-hand-download-location" className="hidden sm:block">
                <DownloadSlideButton label="Download Location" onClick={() => handleDownloadRequest(filter.locationId ?? undefined)} disabled={!filter.locationId} />
              </div>
            </div>
          </div>
          <div className="mx-5 mt-3 border-b border-slate-200 dark:border-slate-800" />
          <div className="space-y-4 px-5 pb-5">
            {filter.locationId ? (
              <>
                {detail.error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
                    Couldn't load Stock On Hand detail: {detail.error.message}
                  </div>
                )}
                <div data-tour="stock-on-hand-chart">
                  <CategoryBreakdown detailRows={detailRows} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <FilterIcon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    <h3 className="text-section-title">Item-wise Stock On Hand</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div data-tour="stock-on-hand-category">
                    <SelectSearch
                      options={categoryOptions}
                      value={itemCategory}
                      clearable={false}
                      searchable={categoryOptions.length > 8}
                      portal
                      onChange={(v) => setItemCategory(v ?? ALL_CATEGORY)}
                      containerClassName="w-48"
                    />
                    </div>
                    <div data-tour="stock-on-hand-item-search">
                    <ResponsiveSearchBar value={itemSearch} onChange={setItemSearch} placeholder="Search item..." suggestions={itemSuggestions} />
                    </div>
                  </div>
                </div>
                <div data-tour="stock-on-hand-detail-table">
                  <DetailTable data={filteredDetailRows} loading={detail.loading} stockGrtDaysThreshold={stockGrtDaysThreshold} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <MapPin className="h-6 w-6" />
                </span>
                <p className="text-body">Pick a location above (or click its Code in the summary table) to see its Stock On Hand breakdown.</p>
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
        title="Download Stock On Hand report?"
        confirmLabel={downloading ? "Generating..." : "Download"}
        details={[
          { label: "Period", value: format(reportingMonth, "MMMM yyyy") },
          { label: "Scope", value: downloadScope ? `Location ${downloadScope}` : "All locations" },
          { label: "Format", value: "Excel (.xlsx)" },
        ]}
      >
        <span data-tour="stock-on-hand-download-modal" className="block">
          {downloadError ? (
            <span className="text-red-600 dark:text-red-400">{downloadError}</span>
          ) : (
            "This exports the Stock On Hand figures for the selected scope and period as an Excel file."
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
          { label: "Scope", value: downloadScope ? `Location ${downloadScope}` : "All locations" },
        ]}
      >
        Your browser is saving the Stock On Hand Excel report now — check your downloads.
      </SuccessModal>
    </div>
  );
}
