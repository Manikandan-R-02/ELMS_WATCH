import { useEffect, useMemo, useState, useRef } from "react";
import { useFocusFirstInput } from "../../../hooks/useFocusFirstInput";
import { format } from "date-fns";
import { Gauge, Hash, MapPin } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Table, type Column } from "../../../components/table/Table";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import { ResponsiveSearchBar } from "../../../components/search/ResponsiveSearchBar";
import { NumberInput } from "../../../components/fields/NumberInput";
import { RefreshSlideButton, SaveSlideButton } from "../../../components/buttons/SlideButton";
import { RefreshRoundedButton, SaveRoundedButton } from "../../../components/buttons/ActionRoundedButtons";
import { usePeriodStore } from "../../../store/periodStore";
import { useBreadcrumbActionsStore } from "../../../store/breadcrumbActionsStore";
import { useApiRequest } from "../../../api/useApiRequest";
import { toApiError } from "../../../api/types";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import { formatDateForApi } from "../../../api/apiHelpers";
import { showErrorToast, showSuccessToast, showWarningToast } from "../../../store/toastStore";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../../hooks/useRegisterScreenTour";
import { productivityTourSteps } from "../../../components/onboarding/screenSteps/productivity";
import { fetchProductivity, modifyProductivity } from "./api";
import { buildValueMap } from "./data";
import type { ModifyProductivityLocation, ProductivityTableRow } from "./data";
import { HelpModal } from "../../../components/modals/HelpModal";

const USAGE_STEPS = [
  { q: "What does this screen show?", a: "Every location's Productivity value for the reporting month selected in the header." },
  { q: "How do I edit a value?", a: "Type directly into a location's Productivity field — an amber border marks it as unsaved. Click Save (top-right, next to the search field) to submit every changed value." },
  { q: "How do I change the period?", a: "Use the month picker in the top header — the list reloads for the newly selected month (any unsaved edits are discarded)." },
];

export function ProductivityPage() {
  const reportingMonth = usePeriodStore((s) => s.selectedMonth);
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(() => startScreenTour(productivityTourSteps));
  const [search, setSearch] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);

  const [editedValues, setEditedValues] = useState<Record<string, number | "">>({});
  const [originalValues, setOriginalValues] = useState<Record<string, number | "">>({});

  const fetchReq = useApiRequest(fetchProductivity);
  // The cursor goes to the first Productivity box as soon as the rows have loaded.
  const tableRef = useRef<HTMLDivElement>(null);
  useFocusFirstInput(tableRef, !fetchReq.loading && (fetchReq.data?.length ?? 0) > 0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetchReq.run(reportingMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportingMonth]);

  useEffect(() => {
    const rows = fetchReq.data ?? [];
    const map = buildValueMap(rows);
    setOriginalValues(map);
    setEditedValues(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchReq.data]);

  const allRows = useMemo(() => fetchReq.data ?? [], [fetchReq.data]);

  const debouncedSearch = useDebouncedValue(search, 200);
  const q = debouncedSearch.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    if (!q) return allRows;
    return allRows.filter((r) => r.locationId.toLowerCase().includes(q) || r.locationName.toLowerCase().includes(q));
  }, [allRows, q]);

  const { rows: pagedRowsRaw, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged(
    filteredRows,
    (row, key) => (row as unknown as Record<string, string>)[key] ?? "",
    10
  );
  const pagedRows: ProductivityTableRow[] = useMemo(
    () => pagedRowsRaw.map((r, i) => ({ ...r, sno: (pagination.page - 1) * pagination.pageSize + i + 1 })),
    [pagedRowsRaw, pagination.page, pagination.pageSize]
  );

  const searchSuggestions = useMemo(() => allRows.map((r) => `${r.locationId} — ${r.locationName}`), [allRows]);

  const dirtyCount = Object.keys(editedValues).filter((k) => editedValues[k] !== originalValues[k]).length;

  function handleValueChange(locationId: string, value: number | "") {
    setEditedValues((prev) => ({ ...prev, [locationId]: value }));
  }

  async function handleSave() {
    const locationsById = new Map(allRows.map((r) => [r.locationId, r]));
    // Each changed row is the loaded one (with its propertyValue / status / period) carrying the new
    // value, so the server gets back exactly what it sent apart from `productivity`.
    const locations: ModifyProductivityLocation[] = [];
    for (const locationId of Object.keys(editedValues)) {
      if (editedValues[locationId] === originalValues[locationId]) continue;
      const value = editedValues[locationId];
      if (value === "" || Number.isNaN(value)) continue;
      const loaded = locationsById.get(locationId);
      locations.push({
        locationId,
        locationName: loaded?.locationName ?? "",
        propertyValue: loaded?.propertyValue,
        status: loaded?.status,
        period: loaded?.period,
        productivity: value,
      });
    }

    if (locations.length === 0) {
      showWarningToast("No changes to save", "Edit a productivity value before saving.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await modifyProductivity({ period: formatDateForApi(reportingMonth), locations });
      showSuccessToast("Productivity values updated", `${locations.length} location(s) saved.`);
      fetchReq.run(reportingMonth);
    } catch (err) {
      const message = toApiError(err).message;
      setSaveError(message);
      showErrorToast("Couldn't save changes", message);
    } finally {
      setSaving(false);
    }
  }

  function handleRefresh() {
    setSearch("");
    setSaveError(null);
    fetchReq.run(reportingMonth);
  }

  // Search + Save slotted into the global breadcrumb row's right side instead of a page toolbar —
  // same mechanism Target PRJ and LocationSummaryPage use (`breadcrumbActionsStore`, read by
  // `Breadcrumbs.tsx` in `AppLayout`). Cleared on unmount so it doesn't linger on whatever screen
  // is navigated to next.
  const setBreadcrumbActions = useBreadcrumbActionsStore((s) => s.setActions);
  useEffect(() => {
    setBreadcrumbActions(
      <div className="flex flex-wrap items-center gap-2">
        {dirtyCount > 0 && (
          <span data-tour="productivity-unsaved" className="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-[11px] font-semibold text-yellow-700 dark:border-yellow-900 dark:bg-yellow-500/10 dark:text-yellow-400">
            {dirtyCount} unsaved change{dirtyCount > 1 ? "s" : ""}
          </span>
        )}
        <div data-tour="productivity-search">
          <ResponsiveSearchBar value={search} onChange={setSearch} placeholder="Search location..." suggestions={searchSuggestions} />
        </div>
        <div data-tour="productivity-save" className="sm:hidden">
          <SaveRoundedButton label="Save" onClick={handleSave} disabled={saving || dirtyCount === 0} />
        </div>
        <div data-tour="productivity-save" className="hidden sm:block">
          <SaveSlideButton onClick={handleSave} disabled={saving || dirtyCount === 0} />
        </div>
      </div>
    );
    return () => setBreadcrumbActions(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, searchSuggestions, dirtyCount, saving, setBreadcrumbActions]);

  const columns: Column<ProductivityTableRow>[] = [
    { key: "sno", header: <HeaderLabel icon={Hash} label="S.No" />, label: "S.No", align: "center", sticky: true, width: "64px", accessor: (r) => r.sno },
    { key: "locationId", header: <HeaderLabel icon={MapPin} label="Location ID" />, label: "Location ID", align: "center", sortable: true, sticky: true, width: "120px", accessor: (r) => r.locationId },
    { key: "locationName", header: "Location Name", label: "Location Name", sortable: true, sticky: true, width: "300px", accessor: (r) => r.locationName || "—" },
    {
      key: "productivity",
      header: "Productivity",
      label: "Productivity",
      align: "right",
      render: (row) => {
        const value = editedValues[row.locationId] ?? "";
        const isDirty = editedValues[row.locationId] !== originalValues[row.locationId];
        return (
          <NumberInput
            value={value}
            onChange={(v) => handleValueChange(row.locationId, v)}
            onFocus={(e) => e.currentTarget.select()}
            allowDecimal
            allowNegative
            placeholder="0.00"
            containerClassName="ml-auto w-32"
            className={isDirty ? "border-yellow-400 text-right dark:border-yellow-500" : "text-right"}
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-3">
      <PageHeader
        icon={Gauge}
        title="Productivity Summary"
        dataTour="productivity-header"
        onHelp={() => setHelpOpen(true)}
        badge={{ icon: MapPin, label: `${allRows.length} locations` }}
        actions={
          <>
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <RefreshRoundedButton label="Refresh" onClick={handleRefresh} data-tour="productivity-refresh" />
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <RefreshSlideButton onClick={handleRefresh} data-tour="productivity-refresh" />
            </div>
          </>
        }
      />

      {fetchReq.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
          Couldn't load productivity data: {fetchReq.error.message}
        </div>
      )}

      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
          Couldn't save changes: {saveError}
        </div>
      )}

      <div data-tour="productivity-table" ref={tableRef}>
        <Table
          columns={columns}
          data={pagedRows}
          rowKey={(row) => row.locationId}
          loading={fetchReq.loading}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortChange={onSortChange}
          pagination={pagination}
          emptyMessage={`No productivity data found for ${format(reportingMonth, "MMMM yyyy")}.`}
        />
      </div>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} onShowTour={() => startScreenTour(productivityTourSteps)} steps={USAGE_STEPS} />
    </div>
  );
}
