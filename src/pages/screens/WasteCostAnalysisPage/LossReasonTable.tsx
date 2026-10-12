import { Table, type Column } from "../../../components/table/Table";
import { formatQty } from "../../../store/numberFormatStore";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import type { LossReasonRow } from "./data";

export interface LossReasonTableProps {
  data: LossReasonRow[];
  loading: boolean;
}

/** The old screen's "Loss Reason by Weight" table — two sortable columns, scoped to whatever
 * year/month/location the page's filters currently select. */
export function LossReasonTable({ data, loading }: Readonly<LossReasonTableProps>) {
  const { rows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<LossReasonRow>(
    data,
    (row, key) => (key === "sumOfWeight" ? row.sumOfWeight : row.lossReason),
    10,
    { key: "sumOfWeight", direction: "desc" }
  );

  const columns: Column<LossReasonRow>[] = [
    { key: "lossReason", header: "Loss Reason", sortable: true, accessor: (r) => r.lossReason },
    { key: "sumOfWeight", header: "Weight (KG)", sortable: true, align: "right", render: (r) => formatQty(r.sumOfWeight) },
  ];

  return <Table columns={columns} data={rows} rowKey={(r, i) => `${r.lossReason}-${i}`} loading={loading} emptyMessage="No data available" sortKey={sortKey} sortDirection={sortDirection} onSortChange={onSortChange} pagination={pagination} />;
}
