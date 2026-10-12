import { AlertTriangle, CalendarClock, Layers, Package, Tag, Wallet } from "lucide-react";
import { Table, type Column } from "../../../components/table/Table";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import { Tooltip } from "../../../components/common/Tooltip";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import type { DetailRow } from "./data";

interface DetailTableProps {
  data: DetailRow[];
  loading: boolean;
  /** Old app's `stockGrtDaysThreshold` (`responseContent.stockGrtDays`) — an item whose days-holding
   * exceeds this is flagged, same intent as the old sticky table's amber "stock-cell" styling. */
  stockGrtDaysThreshold: number | null;
}

/** Item-level Stock On Hand detail for the selected location — old app's sticky multi-level detail
 * table, flattened to `Table`'s single-row sticky-column header (see AGENTS.md's Table doc comment,
 * and `ConsumptionAnalysisPage/DetailTable.tsx` for the same flattening approach). */
export function DetailTable({ data, loading, stockGrtDaysThreshold }: Readonly<DetailTableProps>) {
  const { rows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<DetailRow>(
    data,
    (row, key) => (row as unknown as Record<string, string | number>)[key] ?? 0,
    10,
    { key: "stockAmount", direction: "desc" }
  );

  function overThreshold(r: DetailRow): boolean {
    return stockGrtDaysThreshold != null && r.daysHoldingPeriod > stockGrtDaysThreshold;
  }

  const columns: Column<DetailRow>[] = [
    { key: "itemId", header: "Item Code", label: "Item Code", sortable: true, sticky: true, width: "100px", accessor: (r) => r.itemId },
    { key: "itemName", header: "Item Name", label: "Item Name", sortable: true, sticky: true, width: "220px", accessor: (r) => r.itemName },
    { key: "categoryName", header: <HeaderLabel icon={Tag} label="Category" />, label: "Category", sortable: true, accessor: (r) => r.categoryName },
    { key: "itemUom", header: <HeaderLabel icon={Layers} label="UOM" />, label: "UOM", accessor: (r) => r.itemUom || "—" },
    { key: "curTotalQty", header: <HeaderLabel icon={Package} label="Current Qty" />, label: "Current Qty", sortable: true, align: "right", render: (r) => formatQty(r.curTotalQty) },
    { key: "pastTotalQty", header: "Past Qty", label: "Past Qty", sortable: true, align: "right", render: (r) => formatQty(r.pastTotalQty) },
    { key: "prevTotalQty", header: "Previous Qty", label: "Previous Qty", sortable: true, align: "right", render: (r) => formatQty(r.prevTotalQty) },
    { key: "avgTotalQty", header: "Average Qty", label: "Average Qty", sortable: true, align: "right", render: (r) => formatQty(r.avgTotalQty) },
    { key: "closingQty", header: "Closing Qty", label: "Closing Qty", sortable: true, align: "right", render: (r) => formatQty(r.closingQty) },
    {
      key: "daysHoldingPeriod",
      header: <HeaderLabel icon={CalendarClock} label="Days Holding" />,
      label: "Days Holding",
      sortable: true,
      align: "right",
      render: (r) =>
        overThreshold(r) ? (
          <Tooltip content={`Exceeds the ${formatQty(stockGrtDaysThreshold ?? 0)}-day holding threshold`}>
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {formatQty(r.daysHoldingPeriod)}
            </span>
          </Tooltip>
        ) : (
          formatQty(r.daysHoldingPeriod)
        ),
    },
    { key: "rate", header: "Rate", label: "Rate", sortable: true, align: "right", render: (r) => formatAmount(r.rate) },
    {
      key: "stockAmount",
      header: <HeaderLabel icon={Wallet} label="Stock Amount" />,
      label: "Stock Amount",
      sortable: true,
      align: "right",
      render: (r) => <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatAmount(r.stockAmount)}</span>,
    },
  ];

  return (
    <Table
      columns={columns}
      data={rows}
      rowKey={(r) => r.itemId}
      loading={loading}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
      pagination={pagination}
      emptyMessage="No item-level Stock On Hand for the current filters."
    />
  );
}
