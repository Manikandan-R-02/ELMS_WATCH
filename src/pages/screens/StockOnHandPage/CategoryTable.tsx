import { useMemo } from "react";
import { Table, type Column } from "../../../components/table/Table";
import { formatAmount } from "../../../store/numberFormatStore";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import type { DistributionPoint } from "./data";

const CHART_PALETTE = [
  "#6366f1", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899",
  "#14b8a6", "#ef4444", "#06b6d4", "#f97316", "#db2777", "#2563eb",
];

interface CategoryTableProps {
  data: DistributionPoint[];
  valueLabel: string;
}

/** Category breakdown legend, built on the shared paginated `Table` (10 rows/page) instead of a
 * hand-rolled `<table>` — same reasoning as `ConsumptionAnalysisPage/LegendTable.tsx`: an
 * unbounded custom table grows with the data and breaks the chart+table grid pairing beside it. */
export function CategoryTable({ data, valueLabel }: Readonly<CategoryTableProps>) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  const { rows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<DistributionPoint>(
    data,
    (row, key) => (key === "value" ? row.value : row.name),
    10,
    { key: "value", direction: "desc" }
  );

  const columns: Column<DistributionPoint>[] = [
    {
      key: "name",
      header: "Category",
      label: "Category",
      sortable: true,
      render: (r) => {
        const idx = data.indexOf(r);
        return (
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: CHART_PALETTE[idx % CHART_PALETTE.length] }} />
            <span className="max-w-[180px] whitespace-normal break-words font-medium">{r.name}</span>
          </span>
        );
      },
    },
    { key: "value", header: valueLabel, label: valueLabel, sortable: true, align: "right", render: (r) => formatAmount(r.value) },
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
    <Table
      columns={columns}
      data={rows}
      rowKey={(r, i) => `${r.name}-${i}`}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
      pagination={pagination}
      emptyMessage="No category breakdown available."
    />
  );
}
