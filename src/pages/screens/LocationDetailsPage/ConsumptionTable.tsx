import { useMemo, useState } from "react";
import { CalendarDays, PiggyBank, Tag, Users, Wallet } from "lucide-react";
import { Table, type Column } from "../../../components/table/Table";
import { ColumnVisibilityMenu } from "../../../components/table/ColumnVisibilityMenu";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import type { ConsumptionRecord } from "./data";

/** Old app strips the `LC_` prefix and turns underscores into spaces for the column header
 * (index.jsx line 591) — the raw key is kept as the sort/lookup key. */
function categoryLabel(key: string) {
  return key.replace(/^LC_/, "").replaceAll("_", " ");
}

/** "Consumption" tab — one row per SRC type per date, plus one column per category key present
 * in that location's `categoryListData` (varies by location, so columns are built from the data
 * itself rather than a fixed list — matches the old app's `Object.keys(...).map(...)` column
 * generation). A location with many spend categories is exactly the case that needs the
 * "customize visible columns" menu most, since that's what makes this table run wide enough to
 * need horizontal scrolling in the first place. */
export function ConsumptionTable({ data, loading }: Readonly<{ data: ConsumptionRecord[]; loading: boolean }>) {
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Set<string>>(new Set());
  const categoryKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const r of data) for (const k of Object.keys(r.categoryListData)) keys.add(k);
    return Array.from(keys).sort((a, b) => a.localeCompare(b));
  }, [data]);

  type Row = ConsumptionRecord & { __key: string };
  const rowsWithKey = useMemo(() => data.map((r, i) => ({ ...r, __key: `${r.srcType}-${r.date}-${i}` })), [data]);

  const { rows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<Row>(
    rowsWithKey,
    (row, key) => (key.startsWith("category_") ? row.categoryListData[key.slice("category_".length)] ?? 0 : (row[key as keyof ConsumptionRecord] as string | number)),
    10
  );

  const columns: Column<Row>[] = [
    { key: "srcType", header: <HeaderLabel icon={Tag} label="SRC" />, sortable: true, sticky: true, width: "110px", accessor: (r) => r.srcType },
    { key: "date", header: <HeaderLabel icon={CalendarDays} label="Date" />, sortable: true, sticky: true, width: "110px", accessor: (r) => r.date },
    { key: "totalMandays", header: <HeaderLabel icon={Users} label="Mandays" />, label: "Mandays", sortable: true, align: "right", accessor: (r) => formatQty(r.totalMandays) },
    ...categoryKeys.map(
      (key): Column<Row> => ({
        key: `category_${key}`,
        header: categoryLabel(key),
        label: categoryLabel(key),
        sortable: true,
        align: "right",
        accessor: (r) => formatAmount(r.categoryListData[key] ?? 0),
      })
    ),
    { key: "totalCost", header: <HeaderLabel icon={Wallet} label="Total cost" />, label: "Total cost", sortable: true, align: "right", accessor: (r) => formatAmount(r.totalCost) },
    { key: "avgCostManday", header: <HeaderLabel icon={PiggyBank} label="Cost/manday" />, label: "Cost/manday", sortable: true, align: "right", accessor: (r) => formatAmount(r.avgCostManday) },
  ];

  const columnOptions = columns.filter((c) => !c.sticky).map((c) => ({ key: c.key, label: c.label ?? c.key }));

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ColumnVisibilityMenu columns={columnOptions} hiddenKeys={hiddenColumnKeys} onChange={setHiddenColumnKeys} label="Customize visible columns" />
      </div>
      <Table
        columns={columns.filter((c) => !hiddenColumnKeys.has(c.key))}
        data={rows}
        rowKey={(r) => r.__key}
        loading={loading}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={onSortChange}
        pagination={pagination}
        emptyMessage="No consumption data for this location and month."
      />
    </div>
  );
}
