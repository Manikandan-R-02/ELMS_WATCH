import { useState } from "react";
import { CalendarDays, Tag, UtensilsCrossed, Users, Wallet } from "lucide-react";
import { Table, type Column } from "../../../components/table/Table";
import { ColumnVisibilityMenu } from "../../../components/table/ColumnVisibilityMenu";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import { Checkbox } from "../../../components/fields/Checkbox";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import type { SplitPrjRecord } from "./data";

/** "Split by PRJ" tab — cost split into 4 fixed buckets (Food/Cleaning/Disposal/Others) plus a
 * total, with a "per day" toggle that divides every cost column by that row's mandays — old
 * app's `isDivided`/`formatDivided` (index.jsx ~624-648). */
export function SplitByPrjTable({ data, loading }: Readonly<{ data: SplitPrjRecord[]; loading: boolean }>) {
  const [perDay, setPerDay] = useState(false);
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Set<string>>(new Set());
  const { rows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<SplitPrjRecord>(
    data,
    (row, key) => row[key as keyof SplitPrjRecord],
    10
  );

  function divided(value: number, mandays: number) {
    return perDay && mandays > 0 ? value / mandays : value;
  }

  function costColumn(key: keyof SplitPrjRecord, label: string): Column<SplitPrjRecord> {
    return {
      key,
      header: `${label}${perDay ? " (per day)" : ""}`,
      label,
      sortable: true,
      align: "right",
      accessor: (r) => formatAmount(divided(r[key] as number, r.totalMandays)),
    };
  }

  const columns: Column<SplitPrjRecord>[] = [
    { key: "srcType", header: <HeaderLabel icon={Tag} label="SRC" />, sortable: true, sticky: true, width: "110px", accessor: (r) => r.srcType },
    { key: "date", header: <HeaderLabel icon={CalendarDays} label="Date" />, sortable: true, sticky: true, width: "110px", accessor: (r) => r.date },
    { key: "totalMandays", header: <HeaderLabel icon={Users} label="Mandays" />, sortable: true, align: "right", accessor: (r) => formatQty(r.totalMandays) },
    costColumn("foodCost", "Food"),
    { key: "cleaningCost", header: `Cleaning${perDay ? " (per day)" : ""}`, label: "Cleaning", sortable: true, align: "right", accessor: (r) => formatAmount(divided(r.cleaningCost, r.totalMandays)) },
    { key: "disposalCost", header: `Disposal${perDay ? " (per day)" : ""}`, label: "Disposal", sortable: true, align: "right", accessor: (r) => formatAmount(divided(r.disposalCost, r.totalMandays)) },
    { key: "othersCost", header: `Others${perDay ? " (per day)" : ""}`, label: "Others", sortable: true, align: "right", accessor: (r) => formatAmount(divided(r.othersCost, r.totalMandays)) },
    { key: "total", header: <HeaderLabel icon={Wallet} label={`Total${perDay ? " (per day)" : ""}`} />, label: "Total", sortable: true, align: "right", accessor: (r) => formatAmount(divided(r.total, r.totalMandays)) },
  ];

  const columnOptions = columns.filter((c) => !c.sticky).map((c) => ({ key: c.key, label: c.label ?? c.key }));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-slate-400" />
          <Checkbox checked={perDay} onChange={setPerDay} label="Show cost per manday (divide by day)" />
        </div>
        <ColumnVisibilityMenu columns={columnOptions} hiddenKeys={hiddenColumnKeys} onChange={setHiddenColumnKeys} label="Customize visible columns" />
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
        emptyMessage="No split-by-PRJ data for this location and month."
      />
    </div>
  );
}

