import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, MapPin, RotateCcw, Search, Tags, Users } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/cards/Card";
import { TextButton } from "../../../components/buttons/TextButton";
import { SelectSearch } from "../../../components/fields/SelectSearch";
import { DatePicker } from "../../../components/datetime/DatePicker";
import { ResponsiveSearchBar } from "../../../components/search/ResponsiveSearchBar";
import { TextBadge } from "../../../components/badges/StatusBadge";
import { RefreshSlideButton } from "../../../components/buttons/SlideButton";
import { RefreshRoundedButton } from "../../../components/buttons/ActionRoundedButtons";
import { usePeriodStore } from "../../../store/periodStore";
import { useApiRequest } from "../../../api/useApiRequest";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { formatQty } from "../../../store/numberFormatStore";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../../hooks/useRegisterScreenTour";
import { categoryAnalysisTourSteps } from "../../../components/onboarding/screenSteps/categoryAnalysis";
import { LocationPickerModal } from "./LocationPickerModal";
import { CategoryAnalysisChart } from "./CategoryAnalysisChart";
import { GroupTable, CategoryTable, ItemTable } from "./DrillTable";
import { fetchCategoryAnalysis, fetchCategoryItems, fetchSrcTypeOptions } from "./api";
import { DEFAULT_CATEGORY_ANALYSIS_FILTER, buildGroupRows, computeBillingWindow, groupLabel, type CategoryAnalysisFilter, type CategoryRow, type DrillLevel, type GroupRow, type ItemRow, type ViewMode } from "./data";
import { HelpModal } from "../../../components/modals/HelpModal";

/** Item-level data is only fetched when the item level is open with a location and category chosen. */
function itemTarget(level: DrillLevel, locationId: string | null, categoryId: string | null): { locationId: string; categoryId: string } | null {
  if (level !== "item" || !locationId || !categoryId) return null;
  return { locationId, categoryId };
}

/** The billing window for a location's start day, or undefined when no start day is set. */
function billingWindowFor(startDay: number | undefined, month: Date) {
  return startDay ? computeBillingWindow(startDay, month) : undefined;
}

/** Keeps the rows whose search text contains the query (every row when the query is empty). */
function filterByHaystack<T>(rows: T[], haystack: string[], q: string): T[] {
  if (!q) return rows;
  return rows.filter((_, i) => haystack[i].includes(q));
}

/** Search-box suggestions for the current drill level. */
function suggestionsForLevel(level: DrillLevel, groups: GroupRow[], categories: CategoryRow[], items: ItemRow[]): string[] {
  if (level === "group") return groups.map((r) => r.group);
  if (level === "category") return categories.map((r) => r.categoryId);
  return items.map((r) => `${r.itemId} ${r.itemName}`);
}

/** Chart points (name + value) for the current drill level, dropping zero-value rows. */
function chartPointsForLevel(level: DrillLevel, groups: GroupRow[], categories: CategoryRow[], items: ItemRow[]) {
  if (level === "group") return groups.map((r) => ({ name: r.group, value: r.amount })).filter((p) => p.value > 0);
  if (level === "category") return categories.map((r) => ({ name: r.categoryId, value: r.amount })).filter((p) => p.value > 0);
  return items.map((r) => ({ name: r.itemName, value: r.amount, itemId: r.itemId })).filter((p) => p.value > 0);
}

const USAGE_STEPS = [
  { q: "What does this screen show?", a: "One location's spending drilled down from group → category → item, with a donut chart and table at each level." },
  { q: "How do I drill down?", a: "Click a slice, bar, or legend row (or a table row) to go one level deeper; use \"Back\" to return." },
  { q: "What's POB?", a: "People On Board for the period — shown once category data loads, and used for the item level's Qty/Person and Cost/Person columns." },
  { q: "What does View All/Top N/Least N do?", a: "Limits the chart and legend to only the highest or lowest N rows by amount, at whichever level you're currently viewing." },
];

/** The level a drill-down returns to when going back (the top level stays put). */
const PARENT_LEVEL: Record<DrillLevel, DrillLevel> = { item: "category", category: "group", group: "group" };

/** Refresh: a round icon button on small screens, the sliding labelled button from `sm` up. */
function RefreshActions({ onRefresh }: Readonly<{ onRefresh: () => void }>) {
  return (
    <>
      <div className="flex shrink-0 items-center gap-2 sm:hidden">
        <RefreshRoundedButton label="Refresh" onClick={onRefresh} data-tour="category-analysis-refresh" />
      </div>
      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <RefreshSlideButton label="Refresh" onClick={onRefresh} data-tour="category-analysis-refresh" />
      </div>
    </>
  );
}

export function CategoryAnalysisPage() {
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(startTour);
  const reportingMonth = usePeriodStore((s) => s.selectedMonth);
  const [helpOpen, setHelpOpen] = useState(false);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [locationStartDay, setLocationStartDay] = useState<number | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(true);
  const [filter, setFilter] = useState<CategoryAnalysisFilter>(DEFAULT_CATEGORY_ANALYSIS_FILTER);
  const [level, setLevel] = useState<DrillLevel>("group");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const billingWindow = useMemo(() => billingWindowFor(locationStartDay, reportingMonth), [locationStartDay, reportingMonth]);

  const srcTypesReq = useApiRequest(fetchSrcTypeOptions);
  useEffect(() => {
    if (!locationId) return;
    srcTypesReq.run(reportingMonth, locationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, reportingMonth]);

  const analysis = useApiRequest(fetchCategoryAnalysis);
  const itemsReq = useApiRequest(fetchCategoryItems);

  function runCategoryFetch(locId: string, f: CategoryAnalysisFilter, sd: number | undefined) {
    const window = billingWindowFor(sd, reportingMonth);
    analysis.run({ reportingMonth, locationId: locId, filter: f, billingWindow: window });
  }

  function pickLocation(id: string, startDay?: number) {
    setLocationId(id);
    setLocationStartDay(startDay);
    setPickerOpen(false);
    setFilter(DEFAULT_CATEGORY_ANALYSIS_FILTER);
    setLevel("group");
    setSelectedGroup(null);
    setSelectedCategoryId(null);
    setSearch("");
    runCategoryFetch(id, DEFAULT_CATEGORY_ANALYSIS_FILTER, startDay);
  }

  function handleFetch() {
    if (!locationId) return;
    runCategoryFetch(locationId, filter, locationStartDay);
  }

  function handleClear() {
    setFilter(DEFAULT_CATEGORY_ANALYSIS_FILTER);
    if (locationId) runCategoryFetch(locationId, DEFAULT_CATEGORY_ANALYSIS_FILTER, locationStartDay);
  }

  // Item-level data is fetched separately, re-running whenever the category being viewed or the
  // shared filters change — mirrors the old screen's own item-level refetch effect.
  useEffect(() => {
    const target = itemTarget(level, locationId, selectedCategoryId);
    if (!target) return;
    itemsReq.run({ reportingMonth, locationId: target.locationId, categoryId: target.categoryId, filter, billingWindow });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, locationId, selectedCategoryId, filter, billingWindow]);

  function drillToCategory(group: string) {
    setSelectedGroup(group);
    setLevel("category");
    setSearch("");
  }

  function drillToItems(categoryId: string) {
    setSelectedCategoryId(categoryId);
    setLevel("item");
    setSearch("");
  }

  function goBack() {
    // One level up; the selection made at the level being left is dropped (the top level has nothing above it).
    if (level === "item") setSelectedCategoryId(null);
    if (level === "category") setSelectedGroup(null);
    setLevel(PARENT_LEVEL[level]);
    setSearch("");
  }

  const categories = useMemo(() => analysis.data?.categories ?? [], [analysis.data]);
  const pob = analysis.data?.pob ?? 0;
  const groupRows = useMemo(() => buildGroupRows(categories), [categories]);
  const categoryRowsForGroup = useMemo(
    () => categories.filter((c) => groupLabel(c.groupOfCategory) === selectedGroup),
    [categories, selectedGroup]
  );
  const itemRows = useMemo(() => itemsReq.data ?? [], [itemsReq.data]);

  // The item level has its own request; the group and category levels share the analysis request.
  const levelRequest = { group: analysis, category: analysis, item: itemsReq }[level];
  const levelLoading = levelRequest.loading;
  const levelError = levelRequest.error;

  // Search haystacks per level — same single-concatenated-string convention as every other
  // screen's search, so the suggestion dropdown's entries are guaranteed to match once clicked.
  const groupHaystack = useMemo(() => groupRows.map((r) => r.group.toLowerCase()), [groupRows]);
  const categoryHaystack = useMemo(() => categoryRowsForGroup.map((r) => r.categoryId.toLowerCase()), [categoryRowsForGroup]);
  const itemHaystack = useMemo(() => itemRows.map((r) => `${r.categoryId} ${r.itemId} ${r.itemName}`.toLowerCase()), [itemRows]);

  const q = debouncedSearch.trim().toLowerCase();
  const filteredGroupRows = filterByHaystack(groupRows, groupHaystack, q);
  const filteredCategoryRows = filterByHaystack(categoryRowsForGroup, categoryHaystack, q);
  const filteredItemRows = filterByHaystack(itemRows, itemHaystack, q);

  const suggestions = suggestionsForLevel(level, groupRows, categoryRowsForGroup, itemRows);

  const chartPoints = chartPointsForLevel(level, groupRows, categoryRowsForGroup, itemRows);

  const breadcrumb = [level === "group" ? null : "All Groups", level === "item" ? selectedGroup : null].filter(Boolean);

  // "Show tour" (help modal) — walks every part of the screen, switching the drill level / picker each
  // step needs. Each control sets the whole view (see `TourStep.before`); the category and item levels
  // open on the first group / category, and `endTour` hands the screen back as it was when the tour
  // started, however the tour ended.
  function startTour() {
    const startLevel = level;
    const startGroup = selectedGroup;
    const startCategoryId = selectedCategoryId;
    const firstGroup = groupRows.at(0)?.group ?? null;
    const firstCategoryId = categories.find((c) => groupLabel(c.groupOfCategory) === firstGroup)?.categoryId ?? null;
    startScreenTour(
      categoryAnalysisTourSteps({
        hasLocation: !!locationId,
        hasGroup: firstGroup !== null,
        hasCategory: firstCategoryId !== null,
        showLevel: (target) => {
          setPickerOpen(false);
          setSearch("");
          setLevel(target);
          setSelectedGroup(target === "group" ? null : firstGroup);
          setSelectedCategoryId(target === "item" ? firstCategoryId : null);
        },
        openPicker: () => setPickerOpen(true),
      }),
      () => {
        setPickerOpen(false);
        setLevel(startLevel);
        setSelectedGroup(startGroup);
        setSelectedCategoryId(startCategoryId);
      }
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        icon={Tags}
        title="Category Analysis"
        dataTour="category-analysis-header"
        onHelp={() => setHelpOpen(true)}
        badge={{ icon: MapPin, label: locationId ? `Location ${locationId}` : "Select a location" }}
        actions={
          <>
            <button
              type="button"
              data-tour="category-analysis-location"
              onClick={() => setPickerOpen(true)}
              className="flex max-w-[220px] items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{locationId || "Select location"}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" />
            </button>
            {locationId && <RefreshActions onRefresh={handleFetch} />}
          </>
        }
      />

      {locationId ? (
        <>
          {levelError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
              Couldn't load data: {levelError.message}
            </div>
          )}

          <Card padded={false} data-tour="category-analysis-filters">
            <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
              <div data-tour="category-analysis-srctype">
                <SelectSearch
                  label="Src Types"
                  options={[{ label: "All Source Types", value: "" }, ...(srcTypesReq.data ?? []).map((s) => ({ label: s, value: s }))]}
                  value={filter.srcType ?? ""}
                  clearable={false}
                  searchable={(srcTypesReq.data ?? []).length > 8}
                  placeholder={srcTypesReq.loading ? "Loading…" : "All Source Types"}
                  portal
                  onChange={(v) => setFilter((f) => ({ ...f, srcType: v || null }))}
                />
              </div>
              <div data-tour="category-analysis-date">
                <DatePicker
                  label="Date"
                  value={filter.date}
                  onChange={(d) => setFilter((f) => ({ ...f, date: d }))}
                  minDate={billingWindow?.from ?? new Date(reportingMonth.getFullYear(), reportingMonth.getMonth(), 1)}
                  maxDate={billingWindow?.to ?? new Date(reportingMonth.getFullYear(), reportingMonth.getMonth() + 1, 0)}
                  helperText={locationStartDay ? `Billing day ${locationStartDay}` : undefined}
                  portal
                />
              </div>
              {/* `lg:pt-[1.625rem]` lines these up with the two inputs beside them — see
                  ItemAnalysisPage/index.tsx for the full reasoning (matching the row's tallest
                  sibling via `items-end` instead pushes them below the inputs whenever Date's
                  helper text makes its own cell taller). */}
              <div data-tour="category-analysis-fetch" className="flex gap-2 lg:pt-[1.625rem]">
                <TextButton leadingIcon={<Search className="h-4 w-4" />} onClick={handleFetch} loading={analysis.loading} className="flex-1 lg:flex-none">
                  Fetch
                </TextButton>
                <TextButton variant="outline" tone="neutral" leadingIcon={<RotateCcw className="h-4 w-4" />} onClick={handleClear} className="flex-1 lg:flex-none">
                  Clear
                </TextButton>
              </div>
            </div>
            {pob > 0 && (
              <div data-tour="category-analysis-pob" className="flex items-center gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
                <TextBadge status="success" label={`POB: ${formatQty(pob)}`} />
                <span className="flex items-center gap-1 text-caption">
                  <Users className="h-3 w-3" /> People on board for the period
                </span>
              </div>
            )}
          </Card>

          <div data-tour="category-analysis-back" className="flex flex-wrap items-center gap-2">
            {level !== "group" && (
              <TextButton size="sm" variant="outline" tone="neutral" leadingIcon={<ArrowLeft className="h-3.5 w-3.5" />} onClick={goBack}>
                Back
              </TextButton>
            )}
            {breadcrumb.length > 0 && <span className="text-caption">{breadcrumb.join(" / ")}</span>}
          </div>

          <div data-tour="category-analysis-chart">
            <CategoryAnalysisChart
              title={{ group: "Spending by Group", category: `${selectedGroup} — categories`, item: `${selectedCategoryId} — items` }[level]}
              subtitle={level === "item" ? undefined : "Click a slice, bar, or legend row to drill in"}
              points={chartPoints}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onSelect={{ group: drillToCategory, category: drillToItems, item: undefined }[level]}
            />
          </div>

          <Card padded={false} data-tour="category-analysis-table">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
              <div>
                <h2 className="text-card-title">{{ group: "Groups", category: "Categories", item: "Item Details" }[level]}</h2>
                <p className="text-body-sm">
                  Showing {{ group: filteredGroupRows.length, category: filteredCategoryRows.length, item: filteredItemRows.length }[level]}
                  {debouncedSearch ? ` matching "${debouncedSearch}"` : ""}
                </p>
              </div>
              <div data-tour="category-analysis-search">
                <ResponsiveSearchBar value={search} onChange={setSearch} placeholder="Search..." suggestions={suggestions} />
              </div>
            </div>
            <div className="mx-5 mt-3 border-b border-slate-200 dark:border-slate-800" />
            <div className="px-5 pb-5 pt-4">
              {level === "group" && <GroupTable rows={filteredGroupRows} loading={levelLoading} onDrill={drillToCategory} />}
              {level === "category" && <CategoryTable rows={filteredCategoryRows} loading={levelLoading} onDrill={drillToItems} />}
              {level === "item" && <ItemTable rows={filteredItemRows} loading={levelLoading} pob={pob} />}
            </div>
          </Card>
        </>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <Tags className="h-6 w-6" />
            </span>
            <p className="text-body">Pick a location to see its spending broken down by group and category.</p>
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
