import { Table, type Column } from "../../../components/table/Table";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import type { CategoryRow, GroupRow, ItemRow } from "./data";

function percentOf(amount: number, total: number): number {
  return total > 0 ? (amount / total) * 100 : 0;
}

export interface GroupTableProps {
  rows: GroupRow[];
  loading: boolean;
  onDrill: (group: string) => void;
}

/** Top drill level — categories aggregated by group. No "Qty Con" column here (that figure only
 * exists per-category/per-item on the old screen's API responses, not at this client-aggregated
 * level). */
export function GroupTable({ rows, loading, onDrill }: Readonly<GroupTableProps>) {
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  const { rows: paged, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<GroupRow>(
    rows,
    (row, key) => (key === "pct" ? percentOf(row.amount, total) : (row as unknown as Record<string, string | number>)[key] ?? ""),
    10,
    { key: "amount", direction: "desc" }
  );

  const columns: Column<GroupRow>[] = [
    { key: "group", header: "Group", sortable: true, render: (r) => <span className="font-medium text-slate-800 dark:text-slate-100">{r.group}</span> },
    { key: "qty", header: "Qty", sortable: true, align: "right", render: (r) => formatQty(r.qty) },
    { key: "amount", header: "Amount", sortable: true, align: "right", render: (r) => formatAmount(r.amount) },
    { key: "pct", header: "%", sortable: true, align: "right", render: (r) => `${percentOf(r.amount, total).toFixed(1)}%` },
  ];

  return (
    <Table
      columns={columns}
      data={paged}
      rowKey={(r) => r.group}
      loading={loading}
      emptyMessage="No data available for selected filters"
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
      pagination={pagination}
      onRowClick={(r) => onDrill(r.group)}
    />
  );
}

export interface CategoryTableProps {
  rows: CategoryRow[];
  loading: boolean;
  onDrill: (categoryId: string) => void;
}

export function CategoryTable({ rows, loading, onDrill }: Readonly<CategoryTableProps>) {
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  const { rows: paged, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<CategoryRow>(
    rows,
    (row, key) => (key === "pct" ? percentOf(row.amount, total) : (row as unknown as Record<string, string | number>)[key] ?? ""),
    10,
    { key: "amount", direction: "desc" }
  );

  const columns: Column<CategoryRow>[] = [
    { key: "categoryId", header: "Category", sortable: true, render: (r) => <span className="font-medium text-slate-800 dark:text-slate-100">{r.categoryId}</span> },
    { key: "qty", header: "Qty", sortable: true, align: "right", render: (r) => formatQty(r.qty) },
    { key: "qtyCon", header: "Qty Con", sortable: true, align: "right", render: (r) => formatQty(r.qtyCon) },
    { key: "amount", header: "Amount", sortable: true, align: "right", render: (r) => formatAmount(r.amount) },
    { key: "pct", header: "%", sortable: true, align: "right", render: (r) => `${percentOf(r.amount, total).toFixed(1)}%` },
  ];

  return (
    <Table
      columns={columns}
      data={paged}
      rowKey={(r) => r.categoryId}
      loading={loading}
      emptyMessage="No data available for selected filters"
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
      pagination={pagination}
      onRowClick={(r) => onDrill(r.categoryId)}
    />
  );
}

export interface ItemTableProps {
  rows: ItemRow[];
  loading: boolean;
  pob: number;
}

/** Deepest drill level — item details, plus the old screen's POB-derived Qty/Person and
 * Cost/Person columns (POB = "people on board" for the period, from the category-level
 * response). No `%` column at this level, matching the old screen exactly. */
export function ItemTable({ rows, loading, pob }: Readonly<ItemTableProps>) {
  const { rows: paged, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<ItemRow>(
    rows,
    (row, key): string | number => {
      let value: string | number = (row as unknown as Record<string, string | number>)[key] ?? "";
      if (key === "qtyPerPerson") value = pob > 0 ? row.qty / pob : 0;
      else if (key === "costPerPerson") value = pob > 0 ? row.amount / pob : 0;
      return value;
    },
    10,
    { key: "amount", direction: "desc" }
  );

  const columns: Column<ItemRow>[] = [
    { key: "itemName", header: "Item Name", sortable: true, render: (r) => <span className="font-medium text-slate-800 dark:text-slate-100">{r.itemName}</span> },
    { key: "itemId", header: "Item ID", sortable: true, accessor: (r) => r.itemId },
    { key: "packageId", header: "Package Id", sortable: true, accessor: (r) => r.packageId },
    { key: "qty", header: "QTY", sortable: true, align: "right", render: (r) => formatQty(r.qty) },
    { key: "qtyCon", header: "QTY Con", sortable: true, align: "right", render: (r) => `${formatQty(r.qtyCon)}${uomSuffix(r.uomCon)}` },
    { key: "amount", header: "Cost", sortable: true, align: "right", render: (r) => formatAmount(r.amount) },
    { key: "qtyPerPerson", header: "Qty/Person", sortable: true, align: "right", render: (r) => (pob > 0 ? `${(r.qty / pob).toFixed(4)}${uomSuffix(r.uomCon)}` : "-") },
    { key: "costPerPerson", header: "Cost/Person", sortable: true, align: "right", render: (r) => (pob > 0 ? formatAmount(r.amount / pob) : "-") },
  ];

  return (
    <Table
      columns={columns}
      data={paged}
      rowKey={(r) => `${r.categoryId}-${r.itemId}`}
      loading={loading}
      emptyMessage="No data available for selected filters"
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
      pagination={pagination}
    />
  );
}

/** " <uom>" suffix for a quantity, or "" when no unit of measure is set. */
function uomSuffix(uomCon: string | null | undefined): string {
  return uomCon ? ` ${uomCon}` : "";
}
