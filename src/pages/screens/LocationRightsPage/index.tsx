import { useEffect, useMemo, useState } from "react";
import { KeyRound, MapPin, MapPinOff } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/cards/Card";
import { ResponsiveSearchBar } from "../../../components/search/ResponsiveSearchBar";
import { SelectSearch } from "../../../components/fields/SelectSearch";
import { CheckboxOption } from "../../../components/fields/Checkbox";
import { Table, type Column } from "../../../components/table/Table";
import { TextBadge } from "../../../components/badges/StatusBadge";
import { SaveSlideButton, CancelSlideButton, RefreshSlideButton } from "../../../components/buttons/SlideButton";
import { SaveRoundedButton, CancelRoundedButton, RefreshRoundedButton } from "../../../components/buttons/ActionRoundedButtons";
import { ConfirmModal } from "../../../components/modals/StatusModals";
import { useApiRequest } from "../../../api/useApiRequest";
import { toApiError } from "../../../api/types";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../../hooks/useRegisterScreenTour";
import { locationRightsTourSteps } from "../../../components/onboarding/screenSteps/locationRights";
import { showErrorToast, showSuccessToast } from "../../../store/toastStore";
import { fetchLocationAccess, fetchRightsUsers, saveLocationRights } from "./api";
import type { LocationAccessRow } from "./data";
import { HelpModal } from "../../../components/modals/HelpModal";

const USAGE_STEPS = [
  { q: "What does this screen do?", a: "Controls which locations a chosen user is allowed to access — pick a user, then check or uncheck each location they should be able to see." },
  { q: "How do I change access?", a: 'Select a user from "Select User", then toggle the checkbox (or click the Allowed/Restricted pill) on each location row. The header checkbox toggles every location currently matching your search.' },
  { q: "What happens when I click Save Rights?", a: "You'll be asked to confirm, then the full access list for that user is saved and the screen resets — select the user again to see the saved state." },
  { q: "What does Refresh do?", a: "Reloads this user's access list from the server, discarding any unsaved checkbox changes." },
];

export function LocationRightsPage() {
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(startTour);
  const [helpOpen, setHelpOpen] = useState(false);
  const [selectedUserPk, setSelectedUserPk] = useState<number | null>(null);
  const [allowed, setAllowed] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const users = useApiRequest(fetchRightsUsers);
  const access = useApiRequest(fetchLocationAccess);

  useEffect(() => {
    users.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-seed the editable selection every time a fresh access list loads (new user, or a refresh).
  useEffect(() => {
    if (access.data) setAllowed(new Set(access.data.filter((r) => r.check).map((r) => r.pk)));
  }, [access.data]);

  function selectUser(pk: number | null) {
    setSelectedUserPk(pk);
    setSearch("");
    if (pk) access.run(pk);
    else access.setData(null);
  }

  function handleReset() {
    setSelectedUserPk(null);
    setSearch("");
    setAllowed(new Set());
    access.setData(null);
  }

  // "Show tour" (help modal) — walks every control. The table steps need a user's locations, so the tour
  // selects the first listed user when none is chosen; the confirm dialog step opens it without ever
  // confirming. Each control sets the whole view (see `TourStep.before`) and the end hands the screen back
  // as it was when the tour started. The tour never saves.
  function startTour() {
    const firstUserPk = users.data?.[0]?.pk ?? null;
    // These callbacks keep running with this render's values, so "was a user chosen" is tracked here
    // rather than read from state: the tour picks the first user at most once, and only when none was
    // chosen, so ending it only has to undo that one choice.
    let selectedByTour = false;
    const ensureUser = () => {
      if (selectedUserPk || !firstUserPk || selectedByTour) return;
      selectedByTour = true;
      selectUser(firstUserPk);
    };
    startScreenTour(
      locationRightsTourSteps({
        hasUsers: firstUserPk !== null,
        showPage: () => setSaveConfirmOpen(false),
        showTable: () => {
          setSaveConfirmOpen(false);
          ensureUser();
        },
        openConfirm: () => {
          ensureUser();
          setSaveConfirmOpen(true);
        },
      }),
      () => {
        setSaveConfirmOpen(false);
        if (selectedByTour) selectUser(null);
      }
    );
  }

  const rows = useMemo(() => access.data ?? [], [access.data]);
  const selectedUser = useMemo(() => users.data?.find((u) => u.pk === selectedUserPk) ?? null, [users.data, selectedUserPk]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.code} ${r.name}`.toLowerCase().includes(q));
  }, [rows, debouncedSearch]);
  const locationSuggestions = useMemo(() => rows.map((r) => `${r.code} ${r.name}`), [rows]);

  const { rows: paged, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged(
    filtered,
    (row, key) => (key === "code" ? row.code : row.name),
    10,
    { key: "name", direction: "asc" }
  );

  function toggleRow(pk: number) {
    setAllowed((prev) => {
      const next = new Set(prev);
      if (next.has(pk)) next.delete(pk);
      else next.add(pk);
      return next;
    });
  }

  const filteredAllowedCount = filtered.filter((r) => allowed.has(r.pk)).length;
  const allFilteredAllowed = filtered.length > 0 && filteredAllowedCount === filtered.length;
  const someFilteredAllowed = filteredAllowedCount > 0 && !allFilteredAllowed;

  function toggleAllFiltered(next: boolean) {
    setAllowed((prev) => {
      const nextSet = new Set(prev);
      for (const r of filtered) (next ? nextSet.add(r.pk) : nextSet.delete(r.pk));
      return nextSet;
    });
  }

  async function handleSaveConfirmed() {
    setSaving(true);
    try {
      await saveLocationRights(rows, allowed);
      showSuccessToast("Location rights saved", selectedUser ? `Updated access for ${selectedUser.name}.` : "Access updated.");
      setSaveConfirmOpen(false);
      handleReset();
    } catch (err) {
      showErrorToast("Couldn't save", toApiError(err).message || "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<LocationAccessRow>[] = [
    {
      key: "select",
      header: (
        <span data-tour="location-rights-select-all">
          <CheckboxOption
            checked={allFilteredAllowed}
            indeterminate={someFilteredAllowed}
            onChange={toggleAllFiltered}
            disabled={filtered.length === 0}
          />
        </span>
      ),
      align: "center",
      width: "44px",
      render: (row) => (
        <span data-tour="location-rights-row-check">
          <CheckboxOption checked={allowed.has(row.pk)} onChange={() => toggleRow(row.pk)} />
        </span>
      ),
    },
    { key: "index", header: "#", align: "center", width: "52px", render: (_row, i) => (pagination.page - 1) * pagination.pageSize + i + 1 },
    {
      key: "code",
      header: "Location ID",
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          <MapPin className="h-3 w-3" />
          {row.code}
        </span>
      ),
    },
    { key: "name", header: "Location Name", sortable: true, render: (row) => <span className="font-medium text-slate-800 dark:text-slate-100">{row.name}</span> },
    {
      key: "access",
      header: "Access",
      align: "center",
      render: (row) => {
        const isAllowed = allowed.has(row.pk);
        return (
          <button type="button" data-tour="location-rights-pill" onClick={() => toggleRow(row.pk)} className="cursor-pointer rounded-full transition hover:opacity-80">
            <TextBadge status={isAllowed ? "success" : "error"} label={isAllowed ? "Allowed" : "Restricted"} />
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-3">
      <PageHeader
        icon={KeyRound}
        title="Location Rights"
        dataTour="location-rights-header"
        onHelp={() => setHelpOpen(true)}
        badge={{ icon: MapPin, label: selectedUser ? `${allowed.size} of ${rows.length} allowed` : "Select a user" }}
        actions={
          <>
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <CancelRoundedButton label="Reset" onClick={handleReset} data-tour="location-rights-reset" />
              <SaveRoundedButton label="Save Rights" onClick={() => setSaveConfirmOpen(true)} disabled={!access.data} data-tour="location-rights-save" />
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <CancelSlideButton label="Reset" onClick={handleReset} data-tour="location-rights-reset" />
              <SaveSlideButton label="Save Rights" onClick={() => setSaveConfirmOpen(true)} disabled={!access.data} data-tour="location-rights-save" />
            </div>
          </>
        }
      />

      {users.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
          Couldn't load the user list: {users.error.message}
        </div>
      )}
      {access.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
          Couldn't load this user's locations: {access.error.message}
        </div>
      )}

      <Card padded={false}>
        <div className="px-5 pt-5" data-tour="location-rights-user">
          <SelectSearch
            label="Select User"
            portal
            containerClassName="w-full max-w-sm"
            options={(users.data ?? []).map((u) => ({ label: u.name, value: u.pk }))}
            value={selectedUserPk}
            onChange={selectUser}
            placeholder="Choose a user"
            searchPlaceholder="Search users..."
            disabled={users.loading}
          />
        </div>

        {selectedUserPk ? (
          <>
            <div className="mx-5 mt-4 border-b border-slate-200 dark:border-slate-800" />
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4" data-tour="location-rights-toolbar">
              <div className="flex items-center gap-2">
                <RefreshSlideButton label="Refresh" onClick={() => access.run(selectedUserPk)} className="hidden sm:inline-flex" data-tour="location-rights-refresh" />
                <RefreshRoundedButton label="Refresh" onClick={() => access.run(selectedUserPk)} className="sm:hidden" data-tour="location-rights-refresh" />
                <span className="text-caption">
                  Showing {filtered.length} of {rows.length} locations{debouncedSearch ? ` matching "${debouncedSearch}"` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span data-tour="location-rights-selected">
                  <TextBadge status="info" label={`${allowed.size} selected`} />
                </span>
                <div data-tour="location-rights-search">
                  <ResponsiveSearchBar value={search} onChange={setSearch} placeholder="Search location ID or name..." suggestions={locationSuggestions} />
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 pt-4" data-tour="location-rights-table">
              <Table
                columns={columns}
                data={paged}
                rowKey={(row) => row.pk}
                loading={access.loading}
                emptyMessage="No locations found. Try adjusting your search query."
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSortChange={onSortChange}
                pagination={pagination}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 px-5 py-16 text-center text-slate-400">
            <MapPinOff className="h-8 w-8" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Select a user to view their locations</p>
            <p className="text-caption max-w-sm">Choose a user from the dropdown above to see and edit which locations they can access.</p>
          </div>
        )}
      </Card>

      <ConfirmModal
        open={saveConfirmOpen}
        onClose={() => setSaveConfirmOpen(false)}
        onConfirm={handleSaveConfirmed}
        title="Save Location Rights?"
        confirmLabel="Save Rights"
        loading={saving}
        details={[
          { label: "User", value: selectedUser?.name ?? "—" },
          { label: "Locations allowed", value: `${allowed.size} of ${rows.length}` },
        ]}
      >
        <span data-tour="location-rights-confirm" className="block">
          You are about to update location access for <strong>{selectedUser?.name}</strong>. This action cannot be undone.
        </span>
      </ConfirmModal>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} onShowTour={startTour} steps={USAGE_STEPS} />
    </div>
  );
}
