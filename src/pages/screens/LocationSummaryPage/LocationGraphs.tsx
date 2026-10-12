import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BarChartCard } from "../../../components/charts/ChartCards";
import { Loader } from "../../../components/loader/Loader";
import { TextButton } from "../../../components/buttons/TextButton";
import { useApiRequest } from "../../../api/useApiRequest";
import { baseSummaryPayload, fetchLocationSummary, monthFieldValue, withLocationFilter, type MonthComparisonApiRow } from "./api";
import type { ComparisonMonth } from "./MonthComparisonTable";
import type { LocationFilter } from "./LocationFilterModal";

// One color per *month*, not per location — every card uses the same month→color mapping (see
// the reference screenshot in chat: green/blue/purple always mean the same three months across
// every location's card), so scanning down a column of cards for "the August bar" reads at a
// glance instead of every card using an arbitrary, unrelated color.
const MONTH_COLORS = ["#34d399", "#38bdf8", "#a78bfa", "#fbbf24", "#f472b6", "#22d3ee"];

const INITIAL_VISIBLE = 6;

interface LocationGraphsProps {
  filter: LocationFilter;
  reportingMonth: Date;
  months: ComparisonMonth[];
}

/**
 * A small mandays chart per location, one bar per compared month — mirrors the old app's
 * "Monthly Comparison Graph" view. Reuses the same "Month Comparison" fetch (and the same
 * `monthFieldValue` field lookup) as `MonthComparisonTable`'s range mode, since it's the same
 * underlying data, just charted instead of tabulated.
 */
export function LocationGraphs({ filter, reportingMonth, months }: Readonly<LocationGraphsProps>) {
  const request = useApiRequest(fetchLocationSummary);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (months.length === 0) return;
    const payload = withLocationFilter(baseSummaryPayload(reportingMonth, "Month Comparison", months.length), filter);
    request.run(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, reportingMonth, months]);

  // Collapsing back to the initial count on every new filter/month/location-set means a reader
  // never lands on a giant wall of charts left over from a previous, broader selection.
  useEffect(() => {
    setExpanded(false);
  }, [filter, reportingMonth, months]);

  const monthIndex = useMemo(() => {
    let counter = 0;
    const map = new Map<string, number>();
    for (const m of months) map.set(m.key, m.isBase ? 0 : ++counter);
    return map;
  }, [months]);

  const cards = useMemo(() => {
    const apiRows: MonthComparisonApiRow[] = request.data?.responseContents2 ?? [];
    return apiRows.map((row) => ({
      id: row.locationId,
      name: row.locationName,
      data: months.map((m) => ({
        name: m.label,
        mandays: monthFieldValue(row, "totalMandays", "previousTotalManday", monthIndex.get(m.key) ?? 0),
      })),
    }));
  }, [request.data, months, monthIndex]);

  if (months.length === 0) {
    return <p className="text-body-sm py-8 text-center">Pick at least one month to see per-location graphs.</p>;
  }

  if (request.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
        Couldn't load location graphs: {request.error.message}
      </div>
    );
  }

  if (request.loading && cards.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <Loader />
      </div>
    );
  }

  const visibleCards = expanded ? cards : cards.slice(0, INITIAL_VISIBLE);
  const hiddenCount = cards.length - visibleCards.length;

  return (
    <div className="space-y-4">
      {/* One shared legend for the whole grid — every card below uses this same month→color
          mapping, so repeating it on each of (potentially) dozens of cards would just be noise. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
        {months.map((m, i) => (
          <span key={m.key} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: MONTH_COLORS[i % MONTH_COLORS.length] }} />
            {m.label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleCards.map(({ id, name, data }) => (
          <BarChartCard key={id} compact title={id} subtitle={name} data={data} dataKey="mandays" colors={MONTH_COLORS} barSize={22} />
        ))}
      </div>

      {cards.length > INITIAL_VISIBLE && (
        <div className="flex justify-center pt-1">
          <TextButton
            variant="outline"
            size="sm"
            trailingIcon={expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Show fewer locations" : `Show all ${cards.length} locations (+${hiddenCount})`}
          </TextButton>
        </div>
      )}
    </div>
  );
}
