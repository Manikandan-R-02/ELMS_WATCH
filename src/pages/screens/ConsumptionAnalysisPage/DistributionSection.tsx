import { useMemo, useState } from "react";
import { ArrowLeft, PieChart } from "lucide-react";
import { ChartHeader, DistributionChartCard } from "../../../components/charts/ChartCards";
import { Segmented } from "../../../components/common/Segmented";
import { TextButton } from "../../../components/buttons/TextButton";
import { formatAmount } from "../../../store/numberFormatStore";
import { LegendTable } from "../../../components/charts/LegendTable";
import {
  buildCategoryDistribution,
  buildItemDistributionForCategory,
  buildItemDistributionForSrcType,
  buildSrcTypeDistribution,
} from "./api";
import {
  CATEGORY_METRIC_OPTIONS,
  CHART_TAB_LABELS,
  RC_MANDAY_METRIC_OPTIONS,
  RC_METRIC_OPTIONS,
  type CategoryMetric,
  type ChartTab,
  type DetailRow,
  type DynamicSrcRow,
  type RcMandayMetric,
  type RcMetric,
} from "./data";

export interface DistributionSectionProps {
  detailRows: DetailRow[];
  rc2Rows: DynamicSrcRow[];
  rc3Rows: DynamicSrcRow[];
  onItemClick?: (itemId: string) => void;
  /** The chart tab and the category / source type drilled into, owned by the page so the "Show tour"
   * walkthrough can open them. A tab whose data the location does not have falls back to Category. */
  tab: ChartTab;
  onTabChange: (tab: ChartTab) => void;
  drill: string | null;
  onDrillChange: (name: string | null) => void;
}

/**
 * The old app's donut-chart card, rebuilt with real template components: `Segmented` for the
 * Category / Source Type / Source Type-per-Manday tabs (old app's chart-type radio group) and
 * per-tab metric switch, `DistributionChartCard` for the chart itself (Pie/Bar/Rank built in,
 * center total, top-12 cap — see AGENTS.md's chart-card list), and `LegendTable` for the
 * searchable legend with category/source-type -> item drill-down (old app's donut slice /
 * legend-row click) — legend rows are real keyboard-operable table rows (rule 16), and so is
 * every slice/bar via `DistributionChartCard`'s own `onSelect`.
 */
/** Chart title for each distribution tab (the per-manday tab is the fallback). */
const TAB_TITLES: Record<string, string> = {
  category: "Consumption by Category",
  srcType: "Consumption by Source Type",
};

export function DistributionSection({ detailRows, rc2Rows, rc3Rows, onItemClick, tab: requestedTab, onTabChange, drill, onDrillChange }: Readonly<DistributionSectionProps>) {
  const [categoryMetric, setCategoryMetric] = useState<CategoryMetric>("amount");
  const [rcMetric, setRcMetric] = useState<RcMetric>("qty");
  const [rcMandayMetric, setRcMandayMetric] = useState<RcMandayMetric>("qtyPerManday");

  const tabOptions = useMemo(() => {
    const opts: { label: string; value: ChartTab }[] = [{ label: CHART_TAB_LABELS.category, value: "category" }];
    if (rc2Rows.length) opts.push({ label: CHART_TAB_LABELS.srcType, value: "srcType" });
    if (rc3Rows.length) opts.push({ label: CHART_TAB_LABELS.srcTypePerManday, value: "srcTypePerManday" });
    return opts;
  }, [rc2Rows.length, rc3Rows.length]);
  const tab: ChartTab = tabOptions.some((o) => o.value === requestedTab) ? requestedTab : "category";

  const topSeries = useMemo(() => {
    if (tab === "category") return buildCategoryDistribution(detailRows, categoryMetric);
    if (tab === "srcType") return buildSrcTypeDistribution(rc2Rows, rcMetric, false);
    return buildSrcTypeDistribution(rc3Rows, rcMandayMetric, true);
  }, [tab, detailRows, categoryMetric, rc2Rows, rcMetric, rc3Rows, rcMandayMetric]);

  const drillSeries = useMemo(() => {
    if (!drill) return [];
    if (tab === "category") return buildItemDistributionForCategory(detailRows, drill, categoryMetric);
    if (tab === "srcType") return buildItemDistributionForSrcType(rc2Rows, drill, rcMetric, false);
    return buildItemDistributionForSrcType(rc3Rows, drill, rcMandayMetric, true);
  }, [drill, tab, detailRows, categoryMetric, rc2Rows, rcMetric, rc3Rows, rcMandayMetric]);

  const activeSeries = drill ? drillSeries : topSeries;
  const chartTitle = drill ? `${drill} — items` : (TAB_TITLES[tab] ?? "Consumption by Source Type (per Manday)");

  function handleSelectName(name: string, itemId?: string) {
    if (drill) {
      if (itemId) onItemClick?.(itemId);
      return;
    }
    onDrillChange(name);
  }

  return (
    <section>
      <ChartHeader
        title="Consumption Breakdown"
        subtitle="Click a slice, bar, or legend row to drill into items"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {drill && (
              <TextButton size="sm" variant="outline" tone="neutral" leadingIcon={<ArrowLeft className="h-3.5 w-3.5" />} onClick={() => onDrillChange(null)} data-tour="consumption-analysis-chart-back">
                Back
              </TextButton>
            )}
            {tabOptions.length > 1 && (
              <div data-tour="consumption-analysis-chart-tabs">
                <Segmented options={tabOptions} value={tab} onChange={onTabChange} />
              </div>
            )}
          </div>
        }
      />

      {!drill && (
        <div className="mb-3" data-tour="consumption-analysis-chart-metric">
          {tab === "category" && <Segmented options={CATEGORY_METRIC_OPTIONS} value={categoryMetric} onChange={setCategoryMetric} />}
          {tab === "srcType" && <Segmented options={RC_METRIC_OPTIONS} value={rcMetric} onChange={setRcMetric} />}
          {tab === "srcTypePerManday" && <Segmented options={RC_MANDAY_METRIC_OPTIONS} value={rcMandayMetric} onChange={setRcMandayMetric} />}
        </div>
      )}

      {activeSeries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-slate-400">
          <PieChart className="h-8 w-8 opacity-40" />
          <p className="text-sm">No data to display</p>
        </div>
      ) : (
        // Same `grid-cols-[wider_narrower]` pairing OverallSummaryPage uses for its own
        // DistributionChartCard + paginated Table pairs (CategoryTable/GroupTable) — `LegendTable`
        // is now built on the same shared, paginated `Table`, so its height is bounded by a fixed
        // page size (10 rows + header + footer) instead of tracking however many items a category
        // happens to have, which is what kept it from lining up with the chart beside it.
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <DistributionChartCard
            embedded
            title={chartTitle}
            data={activeSeries.map((d) => ({ name: d.name, value: d.value }))}
            centerLabel={drill ? "Item total" : "Total"}
            formatValue={(v) => formatAmount(v)}
            onSelect={(point) => {
              const item = drill ? drillSeries.find((d) => d.name === point.name) : undefined;
              handleSelectName(point.name, item?.itemId);
            }}
          />
          <LegendTable
            data={activeSeries}
            valueLabel={!drill && tab === "category" ? CATEGORY_METRIC_OPTIONS.find((o) => o.value === categoryMetric)?.label : "Value"}
            onRowClick={(point) => handleSelectName(point.name, point.itemId)}
          />
        </div>
      )}
    </section>
  );
}
