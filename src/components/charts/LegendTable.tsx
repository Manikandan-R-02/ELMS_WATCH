import { useMemo, useState } from "react";
import { Table, type Column } from "../table/Table";
import { SearchBar } from "../search/SearchBar";
import { formatAmount } from "../../store/numberFormatStore";
import { useSortedPaged } from "../../hooks/useSortedPaged";

/** A donut-chart / legend-table point — `DistributionChartCard`'s own `{ name, value }` shape,
 * plus an optional original-row id so a legend/slice click can route back into a drill-down
 * (e.g. an item id within a category, a day within a month). */
export interface DistributionPoint {
  name: string;
  value: number;
  itemId?: string;
}

const CHART_PALETTE = [
  "#6366f1", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899",
  "#14b8a6", "#ef4444", "#06b6d4", "#f97316", "#db2777", "#2563eb",
];

export interface LegendTableProps {
  data: DistributionPoint[];
  onRowClick?: (point: DistributionPoint, index: number) => void;
  valueLabel?: string;
  showSearch?: boolean;
  emptyMessage?: string;
}

/** The old app's donut-chart legend + search, rebuilt on the shared, paginated `Table` component
 * instead of a hand-rolled `<table>` with an unbounded/fixed-cap scroll region — a category can
 * have 30+ items (e.g. every vegetable in a "Vegetables" category), and without real pagination
 * that either grew the card far taller than its chart sibling or, capped at a fixed pixel height,
 * still left the two cards' heights unrelated to each other. `Table`'s own fixed page size (10
 * rows + header + pagination footer) gives this a bounded, predictable height every time, matching
 * how every other chart+table pairing in the app already behaves (see OverallSummaryPage's
 * `CategoryTable`/`GroupTable` beside their own `DistributionChartCard`). Shared here (not owned
 * by one screen's folder) since every `DistributionChartCard` pairing across the app — Consumption
 * Analysis, WasteCost Analysis — needs the exact same legend behavior. */
export function LegendTable({ data, onRowClick, valueLabel = "Value", showSearch = true, emptyMessage = "No results" }: Readonly<LegendTableProps>) {
  const [query, setQuery] = useState("");

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((d) => d.name.toLowerCase().includes(q));
  }, [data, query]);

  const { rows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<DistributionPoint>(
    filtered,
    (row, key) => (key === "value" ? row.value : row.name),
    10,
    { key: "value", direction: "desc" }
  );

  const columns: Column<DistributionPoint>[] = [
    {
      key: "name",
      header: "Name",
      label: "Name",
      sortable: true,
      render: (r) => {
        const idx = data.indexOf(r);
        return (
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: CHART_PALETTE[idx % CHART_PALETTE.length] }} />
            <span className="max-w-[160px] whitespace-normal break-words font-medium">{r.name}</span>
          </span>
        );
      },
    },
    {
      key: "value",
      header: valueLabel,
      label: valueLabel,
      sortable: true,
      align: "right",
      render: (r) => formatAmount(r.value),
    },
    {
      key: "pct",
      header: "%",
      label: "%",
      align: "right",
      render: (r) => {
        const idx = data.indexOf(r);
        const pct = total > 0 ? ((r.value / total) * 100).toFixed(1) : "0";
        return (
          <span className="font-bold" style={{ color: CHART_PALETTE[idx % CHART_PALETTE.length] }}>
            {pct}%
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-2">
      {showSearch && <SearchBar value={query} onChange={setQuery} placeholder="Search items..." className="w-full" />}
      <Table
        columns={columns}
        data={rows}
        rowKey={(r, i) => `${r.name}-${i}`}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={onSortChange}
        onRowClick={onRowClick ? (r) => onRowClick(r, data.indexOf(r)) : undefined}
        pagination={pagination}
        emptyMessage={emptyMessage}
      />
    </div>
  );
}
