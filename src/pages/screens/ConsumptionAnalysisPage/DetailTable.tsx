import { Layers, Package, Tag, Wallet } from "lucide-react";
import { Table, type Column } from "../../../components/table/Table";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import type { DetailRow } from "./data";

interface DetailTableProps {
  data: DetailRow[];
  loading: boolean;
}

/** Item-level consumption detail for the selected location — old app's sticky multi-level
 * detail table, flattened to `Table`'s single-row sticky-column header (see AGENTS.md's Table
 * doc comment). */
export function DetailTable({ data, loading }: Readonly<DetailTableProps>) {
  const { rows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<DetailRow>(
    data,
    (row, key) => (row as unknown as Record<string, string | number>)[key] ?? 0,
    10,
    { key: "totalAmount", direction: "desc" }
  );

  const columns: Column<DetailRow>[] = [
    { key: "itemId", header: "Item Code", label: "Item Code", sortable: true, sticky: true, width: "100px", accessor: (r) => r.itemId },
    { key: "itemName", header: "Item Name", label: "Item Name", sortable: true, sticky: true, width: "220px", accessor: (r) => r.itemName },
    { key: "categoryName", header: <HeaderLabel icon={Tag} label="Category" />, label: "Category", sortable: true, accessor: (r) => r.categoryName },
    { key: "srcType", header: <HeaderLabel icon={Layers} label="Source Type" />, label: "Source Type", sortable: true, accessor: (r) => r.srcType || "—" },
    { key: "unit", header: "Unit", label: "Unit", accessor: (r) => r.unit || "—" },
    { key: "totalQty", header: <HeaderLabel icon={Package} label="Total Qty" />, label: "Total Qty", sortable: true, align: "right", render: (r) => formatQty(r.totalQty) },
    { key: "conQty", header: "Converted Qty", label: "Converted Qty", sortable: true, align: "right", render: (r) => formatQty(r.conQty) },
    { key: "unitPrice", header: "Unit Price", label: "Unit Price", sortable: true, align: "right", render: (r) => formatAmount(r.unitPrice) },
    {
      key: "totalAmount",
      header: <HeaderLabel icon={Wallet} label="Amount" />,
      label: "Amount",
      sortable: true,
      align: "right",
      render: (r) => <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatAmount(r.totalAmount)}</span>,
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
      emptyMessage="No item-level consumption for the current filters."
    />
  );
}
