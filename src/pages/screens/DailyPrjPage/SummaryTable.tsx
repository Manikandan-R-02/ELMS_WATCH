import { useMemo, useState } from "react";
import { Building2, MapPin } from "lucide-react";
import { Table, type Column } from "../../../components/table/Table";
import { ColumnVisibilityMenu } from "../../../components/table/ColumnVisibilityMenu";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import { cn } from "../../../lib/cn";
import { formatAmount } from "../../../store/numberFormatStore";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import type { SummaryColumnDef, SummaryRow } from "./data";

interface SummaryTableProps {
  data: SummaryRow[];
  columns: SummaryColumnDef[];
  loading: boolean;
  onSelectLocation: (locationId: string) => void;
}

/** One cell's value as the backend sent it — a number, a text figure such as "0.16 %", or nothing at all. */
function cellValue(row: SummaryRow, key: string): number | string | null | undefined {
  return row.values[key];
}

/** Green for a positive figure, red for a negative one, no colour for zero. */
function signTone(value: number): string {
  if (value > 0) return "text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "text-red-600 dark:text-red-400";
  return "";
}

/** A column whose key reads as a variance/percentage/ratio figure — old app colors these red
 * (negative) / green (positive) rather than showing every metric in flat neutral text. */
function isSignedColumn(key: string) {
  const k = key.toLowerCase();
  return k.includes("var") || k.includes("pct") || k.includes("ratio") || k.includes("per(%)");
}

/** Old app's own `formatColLabel` (LmsWatch/DailyPrj/index.jsx): snake_case/UPPERCASE →
 * Title Case, with a few domain abbreviations kept short instead of spelled out. */
function formatColLabel(raw: string): string {
  return raw
    .toLowerCase()
    .replaceAll(/last_m\b/g, "last_month")
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => {
      if (word === "vs") return "vs";
      if (word === "pct") return "Pct%";
      if (word === "lm") return "LM";
      if (word === "tgt") return "Tgt";
      if (word === "prj") return "PRJ";
      if (word === "per(%)") return "Per(%)";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/** The backend's raw group/label pair is often literally the same word repeated (e.g. group
 * "STAFF" containing a key labeled "STAFF") — the old app's 2-row header hides this because the
 * group only prints once above several sub-columns; flattened onto one line here, printing both
 * verbatim would read as "Staff · Staff". Dropping the group prefix whenever the label already
 * says the same thing keeps headers short (and the table narrower) without losing information. */
function combineHeader(group: string, label: string): string {
  const g = formatColLabel(group);
  const l = formatColLabel(label);
  return l.toLowerCase() === g.toLowerCase() ? g : `${g} · ${l}`;
}

/** "Location wise PRJ Summary" — one row per location, columns driven entirely by whatever the
 * backend's `summary_sheet.columns` describes for this period (group + key + label), flattened
 * to one column per (group, key) pair — the shared `Table` component has single-row headers, so
 * `"{Group} · {Label}"` carries the same information the old app's two-row grouped header did,
 * just on one line. */
export function SummaryTable({ data, columns, loading, onSelectLocation }: Readonly<SummaryTableProps>) {
  const { rows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<SummaryRow>(
    data,
    (row, key): string | number => {
      let value: string | number = row.values[key] ?? 0;
      if (key === "id") value = row.id;
      else if (key === "name") value = row.name;
      return value;
    },
    10
  );

  // This table can easily run to 20+ dynamic columns (however many the backend's own
  // `summary_sheet.columns` describes) — same "customize visible columns" pattern as Location
  // Summary's own wide table, so a reader isn't stuck horizontally scrolling past metrics they
  // don't care about right now.
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Set<string>>(new Set());
  const columnOptions = useMemo(() => columns.map((col) => ({ key: col.key, label: combineHeader(col.group, col.label) })), [columns]);

  const tableColumns: Column<SummaryRow>[] = useMemo(() => {
    const dynamic: Column<SummaryRow>[] = columns.map((col) => ({
      key: col.key,
      header: combineHeader(col.group, col.label),
      label: combineHeader(col.group, col.label),
      sortable: true,
      align: "right",
      render: (r) => {
        const raw = cellValue(r, col.key);
        if (raw === undefined || raw === null || raw === "") return <span className="text-slate-300 dark:text-slate-600">—</span>;
        // A text figure such as "0.16 %" or "-2.20 %" is shown as the backend sent it (Number() would make it
        // NaN), coloured by its sign like the numeric variance columns.
        if (typeof raw === "string") {
          const parsed = Number.parseFloat(raw);
          if (Number.isNaN(parsed) || !isSignedColumn(col.key)) return <span>{raw}</span>;
          return <span className={cn("font-semibold", signTone(parsed))}>{raw}</span>;
        }
        const n = Number(raw);
        if (isSignedColumn(col.key)) {
          return <span className={cn("font-semibold", signTone(n))}>{formatAmount(n)}</span>;
        }
        return <span>{formatAmount(n)}</span>;
      },
    }));
    return [
      { key: "id", header: <HeaderLabel icon={MapPin} label="Code" />, label: "Code", sortable: true, sticky: true, width: "120px", render: (r) => (
          <button type="button" onClick={() => onSelectLocation(r.id)} className="break-words text-left font-semibold text-brand-600 hover:underline dark:text-brand-400">
            {r.id}
          </button>
        ) },
      { key: "name", header: <HeaderLabel icon={Building2} label="Name" />, label: "Name", sortable: true, sticky: true, width: "200px", accessor: (r) => r.name },
      ...dynamic,
    ];
  }, [columns, onSelectLocation]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ColumnVisibilityMenu columns={columnOptions} hiddenKeys={hiddenColumnKeys} onChange={setHiddenColumnKeys} label="Customize visible columns" />
      </div>
      <Table
        columns={tableColumns.filter((c) => !hiddenColumnKeys.has(c.key))}
        data={rows}
        rowKey={(r) => r.id}
        loading={loading}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={onSortChange}
        pagination={pagination}
        emptyMessage="No locations match the current filters."
      />
    </div>
  );
}
