import { Table, type Column } from "../../../components/table/Table";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import type { ItemAnalysisRow } from "./data";

export interface ItemAnalysisTableProps {
  rows: ItemAnalysisRow[];
  loading: boolean;
  emptyMessage: string;
}

/** The old screen's "Item Details" table — Category/Item/Package identity columns, then Qty/Qty
 * Con/UOM Con/Cost. The old app's "UOM" column was defined but commented out of the actual
 * render (a leftover from an earlier column set) — not replicated here. */
export function ItemAnalysisTable({ rows, loading, emptyMessage }: Readonly<ItemAnalysisTableProps>) {
  const { rows: paged, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<ItemAnalysisRow>(
    rows,
    (row, key) => (row as unknown as Record<string, string | number>)[key] ?? "",
    10,
    { key: "itemName", direction: "asc" }
  );

  const columns: Column<ItemAnalysisRow>[] = [
    { key: "categoryId", header: "Category Name", sortable: true, accessor: (r) => r.categoryId },
    { key: "itemId", header: "Item ID", sortable: true, accessor: (r) => r.itemId },
    { key: "itemName", header: "Item Name", sortable: true, render: (r) => <span className="font-medium text-slate-800 dark:text-slate-100">{r.itemName}</span> },
    { key: "packageId", header: "Package Id", sortable: true, accessor: (r) => r.packageId },
    { key: "qty", header: "QTY", sortable: true, align: "right", render: (r) => formatQty(r.qty) },
    { key: "qtyCon", header: "QTY Con", sortable: true, align: "right", render: (r) => formatQty(r.qtyCon) },
    { key: "uomCon", header: "UOM Con", sortable: true, align: "center", accessor: (r) => r.uomCon },
    { key: "amount", header: "Cost", sortable: true, align: "right", render: (r) => formatAmount(r.amount) },
  ];

  return (
    <Table
      columns={columns}
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
