import { Table, type Column } from "../../../components/table/Table";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { convertedQty, type ItemBreakupRow, type MonthColumn } from "./data";

export interface ItemBreakupTableProps {
  rows: ItemBreakupRow[];
  months: MonthColumn[];
  loading: boolean;
  emptyMessage: string;
}

function MonthMetricHeader({ month, metric }: Readonly<{ month: MonthColumn; metric: string }>) {
  return (
    <span className="flex flex-col items-end gap-0.5">
      <span className="flex items-center gap-1 text-[0.65rem] font-bold normal-case tracking-normal text-white/90">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: month.color }} />
        {month.label}
      </span>
      <span>{metric}</span>
    </span>
  );
}

/**
 * The old screen's "Ingredient Details" table — a sticky 6-column item identity, then a 3-column
 * group (Qty / Con Qty / Cost) per visible month. `Table` has no spanning/grouped-header support
 * (AGENTS.md rule 1 — never fork the shared table for one screen), so each month's three metrics
 * are flattened into their own sortable columns instead, with the old screen's per-calendar-month
 * color carried onto a small dot + label in the header so the grouping still reads at a glance.
 */
export function ItemBreakupTable({ rows, months, loading, emptyMessage }: Readonly<ItemBreakupTableProps>) {
  const { rows: paged, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<ItemBreakupRow>(
    rows,
    (row, key): string | number => {
      const [metric, ...rest] = key.split("-");
      const offsetStr = rest.at(0);
      let value: string | number = (row as unknown as Record<string, string>)[key] ?? "";
      if (key === "pkgCon") {
        value = row.pkgCon;
      } else if (offsetStr !== undefined) {
        const offset = Number(offsetStr);
        if (metric === "qty") value = row.figuresByOffset[offset]?.qty ?? 0;
        else if (metric === "conQty") value = convertedQty(row, offset);
        else if (metric === "cost") value = row.figuresByOffset[offset]?.cost ?? 0;
      }
      return value;
    },
    10,
    { key: "itemName", direction: "asc" }
  );

  const identityColumns: Column<ItemBreakupRow>[] = [
    { key: "categoryId", header: "Category", sortable: true, sticky: true, width: "110px", accessor: (r) => r.categoryId },
    { key: "itemId", header: "Item ID", sortable: true, sticky: true, width: "90px", accessor: (r) => r.itemId },
    { key: "itemName", header: "Item Name", sortable: true, sticky: true, width: "180px", render: (r) => <span className="font-medium text-slate-800 dark:text-slate-100">{r.itemName}</span> },
    { key: "packageId", header: "Package Id", sortable: true, sticky: true, width: "100px", accessor: (r) => r.packageId },
    { key: "pkgCon", header: "Pkg Con", sortable: true, sticky: true, width: "90px", align: "right", render: (r) => formatQty(r.pkgCon) },
    { key: "pkgConUom", header: "Pkg Con UOM", sortable: true, sticky: true, width: "100px", align: "center", accessor: (r) => r.pkgConUom },
  ];

  const monthColumns: Column<ItemBreakupRow>[] = months.flatMap((month) => [
    {
      key: `qty-${month.offset}`,
      header: <MonthMetricHeader month={month} metric="Qty" />,
      sortable: true,
      align: "right" as const,
      width: "100px",
      render: (r: ItemBreakupRow) => formatQty(r.figuresByOffset[month.offset]?.qty ?? 0),
    },
    {
      key: `conQty-${month.offset}`,
      header: <MonthMetricHeader month={month} metric="Con Qty" />,
      sortable: true,
      align: "right" as const,
      width: "100px",
      render: (r: ItemBreakupRow) => formatQty(convertedQty(r, month.offset)),
    },
    {
      key: `cost-${month.offset}`,
      header: <MonthMetricHeader month={month} metric="Cost" />,
      sortable: true,
      align: "right" as const,
      width: "110px",
      render: (r: ItemBreakupRow) => formatAmount(r.figuresByOffset[month.offset]?.cost ?? 0),
    },
  ]);

  return (
    <Table
      columns={[...identityColumns, ...monthColumns]}
      data={paged}
      rowKey={(r) => `${r.categoryId}-${r.itemId}`}
      loading={loading}
      emptyMessage={emptyMessage}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
      pagination={pagination}
    />
  );
}
