import { PieChart } from "lucide-react";
import { Card } from "../../../components/cards/Card";
import { ChartHeader, DistributionChartCard } from "../../../components/charts/ChartCards";
import { LegendTable, type DistributionPoint } from "../../../components/charts/LegendTable";
import { SelectSearch } from "../../../components/fields/SelectSearch";
import { formatAmount } from "../../../store/numberFormatStore";
import { VIEW_MODE_OPTIONS, applyViewMode, type ViewMode } from "./data";

export interface CategoryAnalysisChartProps {
  title: string;
  subtitle?: string;
  points: DistributionPoint[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  /** Omitted at the deepest (item) drill level — nothing further to drill into. */
  onSelect?: (name: string) => void;
}

/**
 * The old screen's donut — one ring per drill level (Group, Category, or Item), rebuilt on the
 * same shared `DistributionChartCard` + `LegendTable` pairing every other analysis screen in this
 * app uses, instead of a hand-rolled Highcharts instance (and, at item level, the old screen's
 * second concentric "100% of category" ring — purely decorative context the center-total label
 * already conveys, see `data.ts`'s file comment). `applyViewMode` replicates the old screen's
 * View-All/Top-N/Least-N selector, limiting both the chart and its legend together.
 */
export function CategoryAnalysisChart({ title, subtitle, points, viewMode, onViewModeChange, onSelect }: Readonly<CategoryAnalysisChartProps>) {
  const sorted = [...points].sort((a, b) => b.value - a.value);
  const visible = applyViewMode(sorted, viewMode);

  return (
    <Card>
      <ChartHeader
        title={title}
        subtitle={subtitle}
        actions={
          <SelectSearch
            options={VIEW_MODE_OPTIONS}
            value={viewMode}
            onChange={(v) => onViewModeChange(v ?? "all")}
            clearable={false}
            searchable={false}
            containerClassName="w-36"
          />
        }
      />

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-slate-400">
          <PieChart className="h-8 w-8 opacity-40" />
          <p className="text-sm">No data available for selected filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <DistributionChartCard
            embedded
            title={title}
            data={visible.map((d) => ({ name: d.name, value: d.value }))}
            centerLabel="Total"
            formatValue={(v) => formatAmount(v)}
            onSelect={onSelect ? (point) => onSelect(point.name) : undefined}
          />
          <LegendTable data={visible} valueLabel="Amount" onRowClick={onSelect ? (point) => onSelect(point.name) : undefined} />
        </div>
      )}
    </Card>
  );
}
