import { useMemo } from "react";
import { ArrowLeft, PieChart } from "lucide-react";
import { Card } from "../../../components/cards/Card";
import { ChartHeader, DistributionChartCard } from "../../../components/charts/ChartCards";
import { LegendTable, type DistributionPoint } from "../../../components/charts/LegendTable";
import { TextButton } from "../../../components/buttons/TextButton";
import { formatAmount } from "../../../store/numberFormatStore";
import type { CategoryAmount, ItemAnalysisRow } from "./data";

export interface CategoryDistributionProps {
  categories: CategoryAmount[];
  items: ItemAnalysisRow[];
  /** The category whose items are shown, or null for the all-categories view. Owned by the page so the
   * "Show tour" walkthrough can open the drilled view. */
  drill: string | null;
  onDrillChange: (category: string | null) => void;
}

/**
 * The old screen's donut chart — category breakdown by cost, drilling into one category's items
 * on click — rebuilt on the shared `DistributionChartCard` + `LegendTable` pairing (same pattern
 * as Consumption/WasteCost Analysis) instead of a hand-rolled Highcharts two-ring donut. The old
 * screen refetched a category's breakdown from a second endpoint on drill-down; this filters the
 * already-loaded item rows by `categoryId` instead (same data — item rows already carry their own
 * category — so no extra round-trip is needed).
 */
export function CategoryDistribution({ categories, items, drill, onDrillChange }: Readonly<CategoryDistributionProps>) {
  const topSeries = useMemo<DistributionPoint[]>(
    () => categories.map((c) => ({ name: c.categoryId, value: c.amount })).filter((d) => d.value > 0),
    [categories]
  );
  const drillSeries = useMemo<DistributionPoint[]>(() => {
    if (!drill) return [];
    return items
      .filter((i) => i.categoryId === drill)
      .map((i) => ({ name: i.itemName, value: i.amount, itemId: i.itemId }))
      .filter((d) => d.value > 0);
  }, [drill, items]);

  const activeSeries = drill ? drillSeries : topSeries;

  return (
    <Card>
      <ChartHeader
        title="Item Analysis Breakdown"
        subtitle={drill ? undefined : "Click a category to see its items"}
        actions={
          drill ? (
            <TextButton size="sm" variant="outline" tone="neutral" leadingIcon={<ArrowLeft className="h-3.5 w-3.5" />} onClick={() => onDrillChange(null)} data-tour="item-analysis-back">
              Back to all categories
            </TextButton>
          ) : undefined
        }
      />

      {activeSeries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-slate-400">
          <PieChart className="h-8 w-8 opacity-40" />
          <p className="text-sm">No chart data available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <DistributionChartCard
            embedded
            title={drill ? `${drill} — items` : "Cost by Category"}
            data={activeSeries.map((d) => ({ name: d.name, value: d.value }))}
            centerLabel="Total"
            formatValue={(v) => formatAmount(v)}
            onSelect={(point) => {
              if (!drill) onDrillChange(point.name);
            }}
          />
          <LegendTable data={activeSeries} valueLabel="Cost" onRowClick={(point) => !drill && onDrillChange(point.name)} />
        </div>
      )}
    </Card>
  );
}
