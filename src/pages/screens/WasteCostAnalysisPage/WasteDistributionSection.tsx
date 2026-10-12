import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, PieChart } from "lucide-react";
import { Card } from "../../../components/cards/Card";
import { ChartHeader, DistributionChartCard } from "../../../components/charts/ChartCards";
import { LegendTable, type DistributionPoint } from "../../../components/charts/LegendTable";
import { Segmented } from "../../../components/common/Segmented";
import { TextButton } from "../../../components/buttons/TextButton";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { fetchLocationBreakdownForMonth } from "./api";
import { identityLabelFor, monthLabel, wastePercentage, type WasteOverviewRow } from "./data";

type Metric = "value" | "weight" | "rawMaterial" | "wastePct";

const METRIC_OPTIONS: { label: string; value: Metric }[] = [
  { label: "Waste Value", value: "value" },
  { label: "Waste Weight", value: "weight" },
  { label: "Raw Material", value: "rawMaterial" },
  { label: "Waste %", value: "wastePct" },
];

function metricValue(row: WasteOverviewRow, metric: Metric): number {
  if (metric === "value") return row.totalWasteValue;
  if (metric === "weight") return row.totalWasteWeight;
  if (metric === "rawMaterial") return row.rawMaterialCost;
  return wastePercentage(row);
}

function toPoints(rows: WasteOverviewRow[], metric: Metric): DistributionPoint[] {
  return rows.map((row) => ({
    name: identityLabelFor(row),
    value: metricValue(row, metric),
    itemId: row.locationId ?? (row.month === undefined ? undefined : String(row.month)),
  }));
}

export interface WasteDistributionSectionProps {
  overviewRows: WasteOverviewRow[];
  year: number;
  mode: "yearAllLocations" | "monthAllLocations" | "locationAllMonths";
  /** Required in `monthAllLocations` mode — the specific month these rows are already scoped to. */
  month?: number;
  /** Required in `locationAllMonths` mode — the specific location these rows are already scoped to. */
  contextLocation?: { id: string; name?: string };
  onSelectDayContext: (month: number, locationId: string, locationName?: string) => void;
}

/**
 * The old screen's two-ring donut chart (year → month → location drill), rebuilt on the shared
 * `DistributionChartCard` + `LegendTable` pairing (same pattern as Consumption Analysis's own
 * category → item drill) instead of a hand-rolled Highcharts instance with a custom-rendered
 * center label. Only `mode: "yearAllLocations"` actually drills (month slice → that month's
 * per-location breakdown, fetched on demand) — the other two modes are already at location
 * granularity, so a slice click there goes straight to `onSelectDayContext`.
 */
export function WasteDistributionSection({ overviewRows, year, mode, month, contextLocation, onSelectDayContext }: Readonly<WasteDistributionSectionProps>) {
  const [metric, setMetric] = useState<Metric>("value");
  const [drillMonth, setDrillMonth] = useState<number | null>(null);
  const [drillRows, setDrillRows] = useState<WasteOverviewRow[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);

  useEffect(() => {
    setDrillMonth(null);
    setDrillRows([]);
  }, [mode, overviewRows]);

  const topSeries = useMemo(() => toPoints(overviewRows, metric), [overviewRows, metric]);
  const drillSeries = useMemo(() => toPoints(drillRows, metric), [drillRows, metric]);
  const activeSeries = drillMonth === null ? topSeries : drillSeries;

  async function handleSelect(point: DistributionPoint) {
    if (mode === "monthAllLocations") {
      if (point.itemId && month !== undefined) onSelectDayContext(month, point.itemId, point.name);
      return;
    }
    if (mode === "locationAllMonths") {
      if (point.itemId && contextLocation) onSelectDayContext(Number(point.itemId), contextLocation.id, contextLocation.name);
      return;
    }
    // yearAllLocations
    if (drillMonth !== null) {
      if (point.itemId) onSelectDayContext(drillMonth, point.itemId, point.name);
      return;
    }
    const clickedMonth = point.itemId ? Number(point.itemId) : null;
    if (!clickedMonth) return;
    setDrillLoading(true);
    setDrillMonth(clickedMonth);
    setDrillRows(await fetchLocationBreakdownForMonth(year, clickedMonth));
    setDrillLoading(false);
  }

  const title = drillMonth === null ? "Waste Distribution" : `${monthLabel(drillMonth)} — locations`;

  return (
    <Card>
      <ChartHeader
        title="Waste Distribution"
        subtitle={mode === "yearAllLocations" ? "Click a month to see its location breakdown" : "Click a slice to view its day-based data"}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {drillMonth !== null && (
              <TextButton size="sm" variant="outline" tone="neutral" leadingIcon={<ArrowLeft className="h-3.5 w-3.5" />} onClick={() => setDrillMonth(null)}>
                Back
              </TextButton>
            )}
            <Segmented options={METRIC_OPTIONS} value={metric} onChange={setMetric} />
          </div>
        }
      />

      {drillLoading && (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-slate-400">
          <PieChart className="h-8 w-8 animate-pulse opacity-40" />
          <p className="text-sm">Loading...</p>
        </div>
      )}
      {!drillLoading && (activeSeries.length === 0) && (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-slate-400">
          <PieChart className="h-8 w-8 opacity-40" />
          <p className="text-sm">No data to display</p>
        </div>
      )}
      {!drillLoading && activeSeries.length !== 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <DistributionChartCard
            embedded
            title={title}
            data={activeSeries.map((d) => ({ name: d.name, value: d.value }))}
            centerLabel={metric === "wastePct" ? "Avg %" : "Total"}
            formatValue={(v) => (metric === "wastePct" ? `${formatQty(v)}%` : formatAmount(v))}
            onSelect={(point) => {
              const match = activeSeries.find((d) => d.name === point.name);
              if (match) void handleSelect(match);
            }}
          />
          <LegendTable data={activeSeries} valueLabel={METRIC_OPTIONS.find((o) => o.value === metric)?.label} onRowClick={(point) => void handleSelect(point)} />
        </div>
      )}
    </Card>
  );
}
