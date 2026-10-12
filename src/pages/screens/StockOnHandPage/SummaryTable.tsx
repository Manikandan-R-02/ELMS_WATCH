import { Boxes, Hash, MapPin, Wallet } from "lucide-react";
import { Table, type Column } from "../../../components/table/Table";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import { formatInteger, formatQty, formatAmount } from "../../../store/numberFormatStore";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import type { SummaryRow } from "./data";

interface SummaryTableProps {
  data: SummaryRow[];
  loading: boolean;
  onSelectLocation: (locationId: string) => void;
}

/** "Location wise SOH Summary" — one aggregated row per location, click the Code to load that
 * location's item-level detail + category chart below (old app's `handleSummaryLocationClick`). */
export function SummaryTable({ data, loading, onSelectLocation }: Readonly<SummaryTableProps>) {
  const { rows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<SummaryRow>(
    data,
    (row, key) => (row as unknown as Record<string, string | number>)[key] ?? 0,
    10,
    { key: "locationId", direction: "asc" }
  );

  const columns: Column<SummaryRow>[] = [
    {
      key: "locationId",
      header: <HeaderLabel icon={MapPin} label="Code" />,
      label: "Code",
      sortable: true,
      sticky: true,
      width: "110px",
      render: (r) => (
        <button type="button" onClick={() => onSelectLocation(r.locationId)} className="break-words text-left font-semibold text-brand-600 hover:underline dark:text-brand-400">
          {r.locationId}
        </button>
      ),
    },
    { key: "locationName", header: "Name", label: "Name", sortable: true, sticky: true, width: "220px", accessor: (r) => r.locationName || "—" },
    {
      key: "totalItems",
      header: <HeaderLabel icon={Hash} label="Items" />,
      label: "Items",
      sortable: true,
      align: "right",
      render: (r) => formatInteger(r.totalItems),
    },
    {
      key: "curTotalQty",
      header: <HeaderLabel icon={Boxes} label="Current Qty" />,
      label: "Current Qty",
      sortable: true,
      align: "right",
      render: (r) => formatQty(r.curTotalQty),
    },
    { key: "pastTotalQty", header: "Past Qty", label: "Past Qty", sortable: true, align: "right", render: (r) => formatQty(r.pastTotalQty) },
    { key: "prevTotalQty", header: "Previous Qty", label: "Previous Qty", sortable: true, align: "right", render: (r) => formatQty(r.prevTotalQty) },
    { key: "avgTotalQty", header: "Average Qty", label: "Average Qty", sortable: true, align: "right", render: (r) => formatQty(r.avgTotalQty) },
    { key: "closingQty", header: "Closing Qty", label: "Closing Qty", sortable: true, align: "right", render: (r) => formatQty(r.closingQty) },
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
      rowKey={(r) => r.locationId}
      loading={loading}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
      pagination={pagination}
      emptyMessage="No Stock On Hand summary for this period."
    />
  );
}
