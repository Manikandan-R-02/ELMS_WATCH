import { useEffect, useMemo } from "react";
import { format, subMonths } from "date-fns";
import { PiggyBank, Tag, Wallet } from "lucide-react";
import { Table, type Column } from "../../../components/table/Table";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import { MonthPicker } from "../../../components/datetime/MonthPicker";
import { MultiSelectSearch } from "../../../components/fields/MultiSelectSearch";
import { cn } from "../../../lib/cn";
import { formatAmount } from "../../../store/numberFormatStore";
import { useApiRequest } from "../../../api/useApiRequest";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import { categoryComparisonPayload, fetchLocationDetails, mapComparisonRows } from "./api";
import { monthKey, type ComparisonMonth } from "./data";

const GROUP_ACCENTS = ["bg-brand-600", "bg-purple-600", "bg-emerald-600", "bg-amber-600", "bg-cyan-600", "bg-pink-600"];

interface ComparisonTableProps {
  locationId: string;
  baseMonth: Date;
  onBaseMonthChange: (date: Date) => void;
  comparisonMonthKeys: string[];
  onComparisonMonthKeysChange: (keys: string[]) => void;
}

/** "Consumption Compare" tab — a category-by-category cost/cost-per-manday comparison across a
 * base month plus any number of picked comparison months. Merges the old app's two separate,
 * near-identical tabs ("Consumption Compare" fixed at 3 trailing months, and "Prev Compare" with
 * a custom base+months picker) into the one UI `LocationSummaryPage`'s own "Compare Custom
 * Months" tab already established for this exact base-month + `MultiSelectSearch` pattern. */
export function ComparisonTable({ locationId, baseMonth, onBaseMonthChange, comparisonMonthKeys, onComparisonMonthKeysChange }: Readonly<ComparisonTableProps>) {
  const request = useApiRequest(fetchLocationDetails);

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const d = subMonths(baseMonth, i + 1);
        return { label: format(d, "MMM yyyy"), value: monthKey(d.getFullYear(), d.getMonth() + 1) };
      }),
    [baseMonth]
  );

  const months: ComparisonMonth[] = useMemo(() => {
    const base: ComparisonMonth = { key: monthKey(baseMonth.getFullYear(), baseMonth.getMonth() + 1), label: format(baseMonth, "MMM yyyy"), year: baseMonth.getFullYear(), month: baseMonth.getMonth() + 1, isBase: true };
    const others = comparisonMonthKeys
      .map((k) => monthOptions.find((o) => o.value === k))
      .filter((o): o is { label: string; value: string } => !!o)
      .map((o) => {
        const [year, month] = o.value.split("-").map(Number);
        return { key: o.value, label: o.label, year, month };
      });
    return [base, ...others];
  }, [baseMonth, comparisonMonthKeys, monthOptions]);

  useEffect(() => {
    if (!locationId) return;
    const comparisonMonths = months.filter((m) => !m.isBase).map((m) => ({ year: m.year, month: m.month }));
    request.run(categoryComparisonPayload(locationId, baseMonth, comparisonMonths));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, baseMonth, comparisonMonthKeys]);

  const rows = useMemo(() => mapComparisonRows(request.data?.responseContents4 ?? [], months), [request.data, months]);
  const { rows: pagedRows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged(
    rows,
    (row, key): string | number => {
      const [monthKeyPart, field] = key.split("::");
      let value: string | number = row.category;
      if (field) value = row.figures[monthKeyPart]?.[field as "cost" | "costPerManday"] ?? 0;
      return value;
    },
    10
  );

  const columns: Column<(typeof rows)[number]>[] = useMemo(() => {
    const cols: Column<(typeof rows)[number]>[] = [
      { key: "category", header: <HeaderLabel icon={Tag} label="Category" />, sortable: true, sticky: true, width: "180px", accessor: (r) => r.category },
    ];
    for (const m of months) {
      cols.push({
        key: `${m.key}::cost`,
        header: <HeaderLabel icon={Wallet} label={`${m.label} · Cost`} />,
        sortable: true,
        align: "right",
        accessor: (r) => formatAmount(r.figures[m.key]?.cost ?? 0),
      }, {
        key: `${m.key}::costPerManday`,
        header: <HeaderLabel icon={PiggyBank} label={`${m.label} · Cost/Manday`} />,
        sortable: true,
        align: "right",
        accessor: (r) => formatAmount(r.figures[m.key]?.costPerManday ?? 0),
      });
    }
    return cols;
  }, [months]);

  return (
    <div className="space-y-3">
      <div data-tour="location-details-compare-pickers" className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <MonthPicker label="Base month" value={baseMonth} onChange={onBaseMonthChange} style={{ width: 200 }} />
        <MultiSelectSearch
          label="Comparison months"
          options={monthOptions}
          value={comparisonMonthKeys}
          onChange={onComparisonMonthKeysChange}
          placeholder="Pick months to compare"
          containerClassName="w-full max-w-sm"
        />
      </div>
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
      </div>
      {request.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
          Couldn't load consumption comparison: {request.error.message}
        </div>
      )}
      <div data-tour="location-details-compare-table">
        <Table
          columns={columns}
          data={pagedRows}
          rowKey={(r) => r.category}
          loading={request.loading}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortChange={onSortChange}
          pagination={pagination}
          emptyMessage="No consumption comparison data for the picked months."
        />
      </div>
    </div>
  );
}
