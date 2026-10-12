import { useEffect, useMemo, useState } from "react";
import { Tabs, TabPanel } from "../../../components/common/Tabs";
import { SelectSearch } from "../../../components/fields/SelectSearch";
import { MultiLineChartCard, BarChartCard, DistributionChartCard } from "../../../components/charts/ChartCards";
import { Loader } from "../../../components/loader/Loader";
import { useApiRequest } from "../../../api/useApiRequest";
import { formatAmount } from "../../../store/numberFormatStore";
import { fetchInventoryTrend, fetchSrcTypeOptions, mapInventoryTrendRow } from "./api";
import type { LocationDetailsGraphTab } from "../../../components/onboarding/screenSteps/locationDetails";
import type { ConsumptionRecord, SrcDataRecord } from "./data";

interface DetailGraphsProps {
  locationId: string;
  reportingMonth: Date;
  srcData: SrcDataRecord[];
  consumptionData: ConsumptionRecord[];
  /** The open chart. Owned by the page (not this component) so the screen tour can switch it. */
  tab: LocationDetailsGraphTab;
  onTabChange: (tab: LocationDetailsGraphTab) => void;
}

const GRAPH_TABS = [
  { id: "actualVsTarget" as const, label: "Actual vs. Target" },
  { id: "categoryBreakdown" as const, label: "Category Breakdown" },
  { id: "dioTrend" as const, label: "DIO Trend" },
];

/** "Graphical Presentation" card — mirrors the old app's `graphTabConfig` (index.jsx ~2987), with
 * "Consumption Data" and "Consumption Comparison Graph" folded into "Category Breakdown" (a
 * `DistributionChartCard` donut over this month's `categoryListData` totals — the same
 * underlying figures, just charted instead of duplicating the Consumption/Compare tables as a
 * second chart pair). */
export function DetailGraphs({ locationId, reportingMonth, srcData, consumptionData, tab, onTabChange }: Readonly<DetailGraphsProps>) {
  const [selectedSrc, setSelectedSrc] = useState<string | null>(null);

  const srcTypes = useApiRequest(fetchSrcTypeOptions);
  useEffect(() => {
    if (!locationId) return;
    srcTypes.run(reportingMonth, locationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, reportingMonth]);

  // Old app auto-fetches the inventory trend the moment the DIO Graph tab is opened
  // (index.jsx's `handleGraphTabChange`) rather than eagerly on page load.
  const inventoryTrend = useApiRequest(fetchInventoryTrend);
  useEffect(() => {
    if (tab === "dioTrend" && locationId) inventoryTrend.run(reportingMonth, locationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, locationId, reportingMonth]);

  // Old app's `getFilteredChartData` (index.jsx ~741-832): no SRC filter → group by date and
  // average Target/Actual across SRC types for that date; a specific SRC → plot its own rows.
  const targetVsActual = useMemo(() => {
    const filtered = selectedSrc ? srcData.filter((r) => r.srcType === selectedSrc) : srcData;
    if (!selectedSrc) {
      const byDate = new Map<string, { target: number; actual: number; count: number }>();
      for (const r of filtered) {
        const entry = byDate.get(r.date) ?? { target: 0, actual: 0, count: 0 };
        entry.target += r.targetPRJ;
        entry.actual += r.dailyCostPerPerson;
        entry.count += 1;
        byDate.set(r.date, entry);
      }
      return Array.from(byDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ name: date, target: v.target / v.count, actual: v.actual / v.count }));
    }
    return [...filtered].sort((a, b) => a.date.localeCompare(b.date)).map((r) => ({ name: r.date, target: r.targetPRJ, actual: r.dailyCostPerPerson }));
  }, [srcData, selectedSrc]);

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const row of consumptionData) {
      for (const [key, value] of Object.entries(row.categoryListData)) {
        totals.set(key, (totals.get(key) ?? 0) + (value || 0));
      }
    }
    return Array.from(totals.entries())
      .map(([key, value]) => ({ name: key.replace(/^LC_/, "").replaceAll("_", " "), value }))
      .filter((c) => c.value > 0);
  }, [consumptionData]);

  const dioTrendData = useMemo(() => (inventoryTrend.data ?? []).map(mapInventoryTrendRow).map((r) => ({ name: r.date, dio: r.dioDays })), [inventoryTrend.data]);

  const srcOptions = (srcTypes.data ?? []).map((s) => ({ label: s.name, value: s.name }));

  return (
    <div className="space-y-4">
      <div data-tour="location-details-graph-tabs">
        <Tabs items={GRAPH_TABS} value={tab} onChange={(id) => onTabChange(id as LocationDetailsGraphTab)} />
      </div>
      <TabPanel active={tab === "actualVsTarget"}>
        <div data-tour="location-details-graph-actual" className="space-y-3">
          <SelectSearch
            label="SRC type"
            options={srcOptions}
            value={selectedSrc}
            onChange={setSelectedSrc}
            placeholder="All SRC types (averaged)"
            containerClassName="max-w-xs"
          />
          <MultiLineChartCard
            title="Actual vs. target"
            subtitle={selectedSrc ? `SRC: ${selectedSrc}` : "Averaged across every SRC type"}
            data={targetVsActual}
            series={[
              { key: "target", label: "Target", color: "#2563eb" },
              { key: "actual", label: "Actual (cost/person)", color: "#ef4444" },
            ]}
          />
        </div>
      </TabPanel>
      <TabPanel active={tab === "categoryBreakdown"}>
        <div data-tour="location-details-graph-category">
          <DistributionChartCard title="Category breakdown" centerLabel="Total cost" formatValue={formatAmount} data={categoryTotals} defaultChartType="bar" />
        </div>
      </TabPanel>
      <TabPanel active={tab === "dioTrend"}>
        <div data-tour="location-details-graph-dio">
          {inventoryTrend.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
              Couldn't load DIO trend: {inventoryTrend.error.message}
            </div>
          )}
          {!inventoryTrend.error && (inventoryTrend.loading && dioTrendData.length === 0) && (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          )}
          {!inventoryTrend.error && !(inventoryTrend.loading && dioTrendData.length === 0) && (
            <BarChartCard title="Days of inventory on hand" subtitle="DIO by date" data={dioTrendData} dataKey="dio" xKey="name" />
          )}
        </div>
      </TabPanel>
    </div>
  );
}
