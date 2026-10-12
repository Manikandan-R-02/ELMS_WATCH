import { useEffect, useMemo } from "react";
import { Building2, CalendarDays, MapPin, PiggyBank, Trash2, Wallet } from "lucide-react";
import { Table, type Column } from "../../../components/table/Table";
import { cn } from "../../../lib/cn";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { useApiRequest } from "../../../api/useApiRequest";
import { baseSummaryPayload, fetchLocationSummary, monthFieldValue, withLocationFilter, type MonthComparisonApiRow } from "./api";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import type { LocationFilter } from "./LocationFilterModal";

export interface ComparisonMonth {
  key: string;
  label: string; 
  /** The base/reference month renders with a stronger accent header, same idea as the old
   * app's distinct base-month column-group color. */
  isBase?: boolean;
}

interface MonthComparisonTableProps {
  filter: LocationFilter;
  months: ComparisonMonth[];
  /** The reporting month for "range" mode (the backend derives the last N months from it
   * itself), or the picked base month for "custom" mode. */
  date: Date;
  /** "range" → filter "Month Comparison", backend picks the last N months relative to `date`.
   * "custom" → filter "Month Comparison New", explicit `yearList` built from `months`. */
  mode: "range" | "custom";
}

type Row = { id: string; name: string } & Record<string, number | string>;

const GROUP_ACCENTS = ["bg-brand-600", "bg-purple-600", "bg-emerald-600", "bg-amber-600", "bg-cyan-600", "bg-pink-600"];

export function MonthComparisonTable({ filter, months, date, mode }: Readonly<MonthComparisonTableProps>) {
  const request = useApiRequest(fetchLocationSummary);

  useEffect(() => {
    if (months.length === 0) return;
    const payload = withLocationFilter(
      baseSummaryPayload(date, mode === "range" ? "Month Comparison" : "Month Comparison New", months.length),
      filter
    );
    if (mode === "custom") {
      payload.yearList = months
        .filter((m) => !m.isBase)
        .map((m) => {
          const [year, month] = m.key.split("-");
          return { year, month: String(Number(month)) };
        });
    }
    request.run(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, months, date, mode]);

  // Old app's per-month field suffix: the base/reporting month reads the "...Current" key,
  // every other month reads its 1-based position among the non-base months (see api.ts's
  // `monthFieldValue` doc comment).
  const monthIndex = useMemo(() => {
    let counter = 0;
    const map = new Map<string, number>();
    for (const m of months) map.set(m.key, m.isBase ? 0 : ++counter);
    return map;
  }, [months]);

  const rowsRaw: Row[] = useMemo(() => {
    const apiRows: MonthComparisonApiRow[] = request.data?.responseContents2 ?? [];
    return apiRows.map((apiRow) => {
      const row: Row = { id: apiRow.locationId, name: apiRow.locationName };
      for (const m of months) {
        const idx = monthIndex.get(m.key) ?? 0;
        row[`${m.key}.mandays`] = monthFieldValue(apiRow, "totalMandays", "previousTotalManday", idx);
        row[`${m.key}.cost`] = monthFieldValue(apiRow, "totalCost", "previousTotalCost", idx);
        row[`${m.key}.costPerManday`] = monthFieldValue(apiRow, "avgCostManday", "previousAvgCostManday", idx);
        row[`${m.key}.waste`] = monthFieldValue(apiRow, "totalWasteCost", "previousWasteCost", idx);
        row[`${m.key}.wastePerManday`] = monthFieldValue(apiRow, "wasteCostManday", "previousWasteCostManday", idx);
      }
      return row;
    });
  }, [request.data, months, monthIndex]);

  const { rows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<Row>(rowsRaw, (row, key) => row[key], 10);

  const columns: Column<Row>[] = useMemo(() => {
    const cols: Column<Row>[] = [
      { key: "id", header: <HeaderLabel icon={MapPin} label="Location ID" />, sortable: true, sticky: true, width: "110px", accessor: (r) => r.id },
      { key: "name", header: <HeaderLabel icon={Building2} label="Location name" />, sortable: true, sticky: true, width: "200px", accessor: (r) => r.name },
    ];
    for (const m of months) {
      const group = (key: string, icon: typeof CalendarDays, header: string, formatter: (v: number) => string) =>
        cols.push({
          key: `${m.key}.${key}`,
          header: <HeaderLabel icon={icon} label={`${m.label} · ${header}`} />,
          sortable: true,
          align: "right",
          render: (r) => <span className="tabular-nums">{formatter(r[`${m.key}.${key}`] as number)}</span>,
        } satisfies Column<Row>);
      group("mandays", CalendarDays, "Mandays", formatQty);
      group("cost", Wallet, "Cost", formatAmount);
      group("costPerManday", PiggyBank, "Cost/Manday", formatAmount);
      group("waste", Trash2, "Waste", formatAmount);
      group("wastePerManday", Trash2, "Waste/Manday", formatAmount);
    }
    return cols;
  }, [months]);

  return (
    <div className="space-y-2">
      {months.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {months.map((m, i) => (
            <span
              key={m.key}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold text-white",
                m.isBase ? "bg-slate-800 dark:bg-slate-700" : GROUP_ACCENTS[i % GROUP_ACCENTS.length]
              )}
            >
              {m.label}
              {m.isBase && " (base)"}
            </span>
          ))}
        </div>
      )}
      {request.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
          Couldn't load month comparison data: {request.error.message}
        </div>
      )}
      <Table
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        loading={request.loading}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={onSortChange}
        pagination={pagination}
        emptyMessage="Pick at least one month to compare."
      />
    </div>
  );
}
