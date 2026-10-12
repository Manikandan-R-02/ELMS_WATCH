import { useMemo, useState } from "react";
import { PieChart } from "lucide-react";
import { ChartHeader, DistributionChartCard } from "../../../components/charts/ChartCards";
import { Segmented } from "../../../components/common/Segmented";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { CategoryTable } from "./CategoryTable";
import { buildCategoryDistribution } from "./api";
import { CATEGORY_METRIC_OPTIONS, type CategoryMetric, type DetailRow } from "./data";

interface CategoryBreakdownProps {
  detailRows: DetailRow[];
}

/** The old app's category donut chart card, rebuilt with real template components: `Segmented` for
 * the metric switch (Stock Amount / Current Qty / Closing Qty), `DistributionChartCard` for the
 * chart itself (Pie/Bar/Rank built in, center total, top-12 cap), and `CategoryTable` for the
 * searchable legend — same "chart beside a bounded, paginated Table" grid pairing every other
 * chart+table combo in this app uses (see AGENTS.md's chart-card list and
 * `ConsumptionAnalysisPage/DistributionSection.tsx`). */
export function CategoryBreakdown({ detailRows }: Readonly<CategoryBreakdownProps>) {
  const [metric, setMetric] = useState<CategoryMetric>("stockAmount");

  const series = useMemo(() => buildCategoryDistribution(detailRows, metric), [detailRows, metric]);
  const valueLabel = CATEGORY_METRIC_OPTIONS.find((o) => o.value === metric)?.label ?? "Value";
  const formatValue = metric === "stockAmount" ? formatAmount : formatQty;

  return (
    <section>
      <ChartHeader
        title="Stock On Hand by Category"
        subtitle="Breakdown of the selected location's current stock"
        actions={<Segmented options={CATEGORY_METRIC_OPTIONS} value={metric} onChange={setMetric} />}
      />

      {series.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-slate-400">
          <PieChart className="h-8 w-8 opacity-40" />
          <p className="text-sm">No data to display</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <DistributionChartCard
            embedded
            title={`Stock On Hand by Category — ${valueLabel}`}
            data={series}
            centerLabel="Total"
            formatValue={(v) => formatValue(v)}
          />
          <CategoryTable data={series} valueLabel={valueLabel} />
        </div>
      )}
    </section>
  );
}
