import { useState } from "react";
import { CalendarDays, Clock3, Scale, Tag, Target, TrendingUp, Users, Wallet, Trash2 } from "lucide-react";
import { Table, type Column } from "../../../components/table/Table";
import { ColumnVisibilityMenu } from "../../../components/table/ColumnVisibilityMenu";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import type { SrcDataRecord } from "./data";

const COLUMN_OPTIONS = [
  { key: "pob", label: "POB" },
  { key: "totalCost", label: "Total cost" },
  { key: "wasteCost", label: "Waste cost" },
  { key: "pobWastePRJ", label: "POB waste PRJ" },
  { key: "dailyCostPerPerson", label: "Daily cost/person" },
  { key: "targetPRJ", label: "Target PRJ" },
  { key: "cumulativeManday", label: "Cumul mandays" },
  { key: "cumulativeCost", label: "Cumul cost" },
  { key: "cumulativeDailyCost", label: "Cumul daily cost" },
];

/** "SRC Data" tab — one row per SRC type per date. Column set and order match the old app's
 * `srcColumns` (LmsDetails/index.jsx ~509-570) exactly, minus the two columns it left commented
 * out (Inventory Value / DIO, unused there too). */
export function SrcDataTable({ data, loading }: Readonly<{ data: SrcDataRecord[]; loading: boolean }>) {
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Set<string>>(new Set());
  const { rows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<SrcDataRecord>(
    data,
    (row, key) => row[key as keyof SrcDataRecord],
    10
  );

  const columns: Column<SrcDataRecord>[] = [
    { key: "srcType", header: <HeaderLabel icon={Tag} label="SRC" />, sortable: true, sticky: true, width: "110px", accessor: (r) => r.srcType },
    { key: "date", header: <HeaderLabel icon={CalendarDays} label="Date" />, sortable: true, sticky: true, width: "110px", accessor: (r) => r.date },
    { key: "pob", header: <HeaderLabel icon={Users} label="POB" />, sortable: true, align: "right", accessor: (r) => formatQty(r.pob) },
    { key: "totalCost", header: <HeaderLabel icon={Wallet} label="Total cost" />, sortable: true, align: "right", accessor: (r) => formatAmount(r.totalCost) },
    { key: "wasteCost", header: <HeaderLabel icon={Trash2} label="Waste cost" />, sortable: true, align: "right", accessor: (r) => formatAmount(r.wasteCost) },
    { key: "pobWastePRJ", header: <HeaderLabel icon={Scale} label="POB waste PRJ" />, sortable: true, align: "right", accessor: (r) => formatQty(r.pobWastePRJ) },
    { key: "dailyCostPerPerson", header: <HeaderLabel icon={TrendingUp} label="Daily cost/person" />, sortable: true, align: "right", accessor: (r) => formatAmount(r.dailyCostPerPerson) },
    { key: "targetPRJ", header: <HeaderLabel icon={Target} label="Target PRJ" />, sortable: true, align: "right", accessor: (r) => formatQty(r.targetPRJ) },
    { key: "cumulativeManday", header: <HeaderLabel icon={Clock3} label="Cumul mandays" />, sortable: true, align: "right", accessor: (r) => formatQty(r.cumulativeManday) },
    { key: "cumulativeCost", header: <HeaderLabel icon={Wallet} label="Cumul cost" />, sortable: true, align: "right", accessor: (r) => formatAmount(r.cumulativeCost) },
    { key: "cumulativeDailyCost", header: <HeaderLabel icon={Wallet} label="Cumul daily cost" />, sortable: true, align: "right", accessor: (r) => formatAmount(r.cumulativeDailyCost) },
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ColumnVisibilityMenu columns={COLUMN_OPTIONS} hiddenKeys={hiddenColumnKeys} onChange={setHiddenColumnKeys} label="Customize visible columns" />
      </div>
      <Table
        columns={columns.filter((c) => !hiddenColumnKeys.has(c.key))}
        data={rows}
        rowKey={(r, i) => `${r.srcType}-${r.date}-${i}`}
        loading={loading}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={onSortChange}
        pagination={pagination}
        emptyMessage="No SRC data for this location and month."
      />
    </div>
  );
}
