import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Target as TargetIcon, MapPin } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Table, type Column } from "../../../components/table/Table";
import { ResponsiveSearchBar } from "../../../components/search/ResponsiveSearchBar";
import { TextButton } from "../../../components/buttons/TextButton";
import { RefreshSlideButton, DownloadSlideButton } from "../../../components/buttons/SlideButton";
import { RefreshRoundedButton, DownloadRoundedButton } from "../../../components/buttons/ActionRoundedButtons";
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
import { targetPrjTourSteps } from "../../../components/onboarding/screenSteps/targetPrj";
import { fetchTargetPrj, modifyTargetPrj } from "./api";
import { buildValueMap, valueKey } from "./data";
import type { TargetPrjEntry, TargetPrjRow } from "./data";
import { TargetDetailModal } from "./TargetDetailModal";
import { HelpModal } from "../../../components/modals/HelpModal";

const USAGE_STEPS = [
  { q: "What does this screen show?", a: "Every location's PRJ / SRC target values for the reporting month selected in the header." },
  { q: "How do I edit a target value?", a: 'Click "Modify" on a location\'s row to open its PRJ / SRC breakdown, edit any value, then Save. Unsaved edits show an amber marker until saved or reset.' },
  { q: "How do I change the period?", a: "Use the month picker in the top header — the list and any unsaved edits reload for the newly selected month." },
];

function downloadCsv(rows: TargetPrjRow[], dateLabel: string) {
  const header = ["S.No", "Location ID", "Location Name", "PRJ / SRC", "Target Value"];
  const lines = [header.join(",")];
  for (const r of rows) {
    const list = r.targetPrjList.length > 0 ? r.targetPrjList : [{ prjId: "", targetValue: null }];
    for (const prj of list) {
      const value = prj.targetValue?.toFixed(3) ?? "";
      lines.push(
        [r.sno, r.locationId, `"${r.locationName.replaceAll('"', '""')}"`, `"${(prj.prjId || "").replaceAll('"', '""')}"`, value].join(",")
      );
    }
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = globalThis.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `target_prj_${dateLabel}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.URL.revokeObjectURL(url);
}

export function TargetPrjPage() {
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(startTour);
  const reportingMonth = usePeriodStore((s) => s.selectedMonth);
  const [search, setSearch] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [modalLocationId, setModalLocationId] = useState<string | null>(null);

  const [editedValues, setEditedValues] = useState<Record<string, number | "">>({});
  const [originalValues, setOriginalValues] = useState<Record<string, number | "">>({});

  const fetchReq = useApiRequest(fetchTargetPrj);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchReq.run(reportingMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportingMonth]);

  useEffect(() => {
    const locs = fetchReq.data ?? [];
    const map = buildValueMap(locs);
    setOriginalValues(map);
    setEditedValues(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchReq.data]);

  const allRows = useMemo(
    () =>
      (fetchReq.data ?? []).map((loc) => ({
        ...loc,
        locationName: loc.locationName || "—",
        sno: 0,
      })),
    [fetchReq.data]
  );

  const debouncedSearch = useDebouncedValue(search, 200);
  const q = debouncedSearch.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    if (!q) return allRows;
    return allRows.filter(
      (r) =>
        r.locationId.toLowerCase().includes(q) ||
        r.locationName.toLowerCase().includes(q) ||
        r.targetPrjList.some((prj) => (prj.prjId || "").toLowerCase().includes(q))
    );
  }, [allRows, q]);

  const { rows: pagedRowsRaw, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<TargetPrjRow>(
    filteredRows,
    (row, key) => (row as unknown as Record<string, string>)[key] ?? "",
    10
  );
  const pagedRows: TargetPrjRow[] = useMemo(
    () => pagedRowsRaw.map((r, i) => ({ ...r, sno: (pagination.page - 1) * pagination.pageSize + i + 1 })),
    [pagedRowsRaw, pagination.page, pagination.pageSize]
  );

  const searchSuggestions = useMemo(() => {
    const seen = new Set<string>();
    for (const r of allRows) seen.add(`${r.locationId} — ${r.locationName}`);
    return Array.from(seen);
  }, [allRows]);

  const totalDirtyCount = Object.keys(editedValues).filter((k) => editedValues[k] !== originalValues[k]).length;

  // Search + Download slotted into the global breadcrumb row's right side instead of a page
  // toolbar — same mechanism LocationSummaryPage already uses for its own location search
  // (`breadcrumbActionsStore`, read by `Breadcrumbs.tsx` in `AppLayout`). Cleared on unmount so it
  // doesn't linger on whatever screen is navigated to next.
  const setBreadcrumbActions = useBreadcrumbActionsStore((s) => s.setActions);
  useEffect(() => {
    setBreadcrumbActions(
      <div className="flex flex-wrap items-center gap-2">
        {totalDirtyCount > 0 && (
          <span data-tour="target-prj-unsaved" className="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-[11px] font-semibold text-yellow-700 dark:border-yellow-900 dark:bg-yellow-500/10 dark:text-yellow-400">
            {totalDirtyCount} unsaved change{totalDirtyCount > 1 ? "s" : ""}
          </span>
        )}
        <div data-tour="target-prj-search">
          <ResponsiveSearchBar value={search} onChange={setSearch} placeholder="Search location or PRJ..." suggestions={searchSuggestions} />
        </div>
        <div data-tour="target-prj-download" className="sm:hidden">
          <DownloadRoundedButton label="Download" onClick={() => downloadCsv(filteredRows.map((r, i) => ({ ...r, sno: i + 1 })), formatDateForApi(reportingMonth))} />
        </div>
        <div data-tour="target-prj-download" className="hidden sm:block">
          <DownloadSlideButton label="Download" onClick={() => downloadCsv(filteredRows.map((r, i) => ({ ...r, sno: i + 1 })), formatDateForApi(reportingMonth))} />
        </div>
      </div>
    );
    return () => setBreadcrumbActions(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, searchSuggestions, totalDirtyCount, filteredRows, reportingMonth, setBreadcrumbActions]);

  function dirtyCountForLocation(locationId: string) {
    const prefix = `${locationId}::`;
    return Object.keys(editedValues).filter((k) => k.startsWith(prefix) && editedValues[k] !== originalValues[k]).length;
  }

  function handleValueChange(locationId: string, prjId: string, value: number | "") {
    setEditedValues((prev) => ({ ...prev, [valueKey(locationId, prjId)]: value }));
  }

  function handleResetEdits(scopeLocationId: string) {
    const prefix = `${scopeLocationId}::`;
    setEditedValues((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(originalValues)) {
        if (key.startsWith(prefix)) next[key] = originalValues[key];
      }
      return next;
    });
  }

  async function handleSave(scopeLocationId: string) {
    const prefix = `${scopeLocationId}::`;
    const location = allRows.find((r) => r.locationId === scopeLocationId);
    // Each changed entry is the loaded one (with its controllPrjId / prjStatus / period) carrying the new
    // value, so the server gets back exactly what it sent apart from `targetValue`.
    const changed: (TargetPrjEntry & { targetValue: number })[] = [];
    for (const key of Object.keys(editedValues)) {
      if (!key.startsWith(prefix)) continue;
      if (editedValues[key] === originalValues[key]) continue;
      const value = editedValues[key];
      if (value === "" || Number.isNaN(value)) continue;
      const prjId = key.slice(prefix.length);
      const loaded = location?.targetPrjList.find((prj) => prj.prjId === prjId);
      changed.push({ ...loaded, prjId, targetValue: value });
    }

    if (changed.length === 0) {
      showWarningToast("No changes to save", "Edit a target value before saving.");
      return;
    }

    setSaving(true);
    try {
      await modifyTargetPrj({
        period: formatDateForApi(reportingMonth),
        locations: [
          {
            locationId: scopeLocationId,
            locationName: location?.locationName === "—" ? "" : location?.locationName,
            propertyValue: location?.propertyValue,
            status: location?.status,
            targetPrjList: changed,
          },
        ],
      });
      showSuccessToast("Target values updated", `${changed.length} value(s) saved for ${scopeLocationId}.`);
      setModalLocationId(null);
      fetchReq.run(reportingMonth);
    } catch (err) {
      showErrorToast("Couldn't save changes", toApiError(err).message);
    } finally {
      setSaving(false);
    }
  }

  function handleRefresh() {
    setSearch("");
    setModalLocationId(null);
    fetchReq.run(reportingMonth);
  }

  // "Show tour" (help modal) — walks every control, opening the first location's "PRJ / SRC & Target Value"
  // dialog for the steps that show it. Each control sets the whole view (see `TourStep.before`), and the
  // end hands the screen back with the dialog as it was when the tour started. Unsaved edits are never
  // touched or saved by the tour.
  function startTour() {
    const startModalLocationId = modalLocationId;
    const firstLocationId = allRows.at(0)?.locationId ?? null;
    startScreenTour(
      targetPrjTourSteps({
        hasLocations: firstLocationId !== null,
        showTable: () => setModalLocationId(null),
        openModal: () => setModalLocationId(firstLocationId),
      }),
      () => setModalLocationId(startModalLocationId)
    );
  }

  const modalLocation = modalLocationId ? allRows.find((r) => r.locationId === modalLocationId) ?? null : null;

  const columns: Column<TargetPrjRow>[] = [
    { key: "sno", header: "S.No", align: "center", width: "60px", sticky: true, accessor: (row) => row.sno },
    { key: "locationId", header: "Location ID", align: "center", sortable: true, sticky: true, width: "120px", accessor: (row) => row.locationId },
    { key: "locationName", header: "Location Name", sortable: true, accessor: (row) => row.locationName },
    {
      key: "action",
      header: "Action",
      align: "center",
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          {/* A plain, always-visible TextButton here instead of a SlideButton — a hover-to-reveal
              slide button placed inside a table row conflicts with the row's own (unscoped)
              `group` hover class on `Table.tsx`'s `<tr>` (see that file's `group/row` scoping
              fix), making the reveal behave unreliably. A table action doesn't need the slide
              animation anyway — it's always visible either way. `tone="brand"` (deep blue, not
              the `Modify` preset's cyan) plus the `Target` icon makes this action's own identity
              clear at a glance, distinct from the "modify a record" implication of a generic
              Modify button. */}
          <TextButton data-tour="target-prj-update" tone="brand" size="sm" leadingIcon={<TargetIcon className="h-3.5 w-3.5" />} onClick={() => setModalLocationId(row.locationId)}>
            Update Target
          </TextButton>
          {dirtyCountForLocation(row.locationId) > 0 && (
            <span
              className="h-2 w-2 rounded-full bg-yellow-500"
              title={`${dirtyCountForLocation(row.locationId)} unsaved change(s)`}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <PageHeader
        icon={TargetIcon}
        title="Target Prj Summary"
        dataTour="target-prj-header"
        onHelp={() => setHelpOpen(true)}
        badge={{ icon: MapPin, label: `${allRows.length} locations` }}
        actions={
          <>
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <RefreshRoundedButton label="Refresh" onClick={handleRefresh} data-tour="target-prj-refresh" />
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <RefreshSlideButton onClick={handleRefresh} data-tour="target-prj-refresh" />
            </div>
          </>
        }
      />

      {fetchReq.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
          Couldn't load target data: {fetchReq.error.message}
        </div>
      )}

      <div data-tour="target-prj-table">
        <Table
          columns={columns}
          data={pagedRows}
          rowKey={(row: TargetPrjRow) => row.locationId}
          loading={fetchReq.loading}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortChange={onSortChange}
          pagination={pagination}
          emptyMessage={`No target data found for ${format(reportingMonth, "MMMM yyyy")}.`}
        />
      </div>

      <TargetDetailModal
        open={!!modalLocation}
        location={modalLocation}
        editedValues={editedValues}
        originalValues={originalValues}
        saving={saving}
        onValueChange={handleValueChange}
        onReset={handleResetEdits}
        onSave={handleSave}
        onClose={() => setModalLocationId(null)}
      />

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} onShowTour={startTour} steps={USAGE_STEPS} />
    </div>
  );
}

export default TargetPrjPage;
