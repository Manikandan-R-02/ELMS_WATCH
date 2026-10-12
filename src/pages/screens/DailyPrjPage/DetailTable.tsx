import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, CalendarDays, Hash, PiggyBank, Sparkles, TrendingUp, UtensilsCrossed, Users } from "lucide-react";
import { Table, type Column } from "../../../components/table/Table";
import { ColumnVisibilityMenu } from "../../../components/table/ColumnVisibilityMenu";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import { Checkbox } from "../../../components/fields/Checkbox";
import { cn } from "../../../lib/cn";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import type { DetailDayRow, PrjBreakdownEntry } from "./data";

interface DetailTableProps {
  data: DetailDayRow[];
  prjTypes: string[];
  loading: boolean;
}

/** The fixed (non-sticky, non-cumulative, non-breakdown) columns — toggleable via
 * `ColumnVisibilityMenu` since with the optional breakdown/cumulative columns on top, this
 * table can get wide enough to need horizontal scrolling, same as Location Summary's own
 * "customize visible columns" table. */
const FIXED_COLUMN_OPTIONS = [
  { key: "food", label: "Food" },
  { key: "cleaning", label: "Cleaning" },
  { key: "disposable", label: "Disposable" },
  { key: "consumption", label: "Consumption" },
  { key: "mandays", label: "Mandays" },
  { key: "dailyPrj", label: "Daily PRJ" },
  { key: "varPrj", label: "Var PRJ" },
  { key: "staff", label: "Staff" },
  { key: "varStaff", label: "Var Staff" },
  { key: "productivity", label: "Productivity" },
  { key: "others", label: "Others" },
  { key: "extraProgram", label: "Extra Program" },
];

/** A signed figure (var PRJ / var Staff) — old app's `VarCell`: green + up-arrow when over,
 * red + down-arrow when under, neutral when exactly on target. */
function VarCell({ value }: Readonly<{ value: number }>) {
  if (value === 0) return <span className="font-semibold text-slate-500 dark:text-slate-400">{formatAmount(value)}</span>;
  const positive = value > 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-semibold", positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
      {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {formatAmount(Math.abs(value))}
    </span>
  );
}

/** "Daily PRJ Details" — one row per calendar day for the currently selected location, plus an
 * optional set of extra columns per PRJ type (Food/Cleaning/Disposable/Mandays/Total/PRJ) when
 * "Show PRJ breakdown" is on — same dynamic-columns-from-data pattern as Location Details'
 * Consumption tab, applied to a fixed `prjTypes` list from the API instead of arbitrary keys. */
export function DetailTable({ data, prjTypes, loading }: Readonly<DetailTableProps>) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showCumulative, setShowCumulative] = useState(false);
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Set<string>>(new Set());

  const { rows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<DetailDayRow>(
    data,
    (row, key): string | number => {
      let value = row[key as keyof DetailDayRow] as string | number;
      if (key.includes("::")) {
        const [prjType, field] = key.split("::");
        value = row.prjBreakdown[prjType]?.[field as keyof PrjBreakdownEntry] ?? 0;
      }
      return value;
    },
    10
  );

  const columns: Column<DetailDayRow>[] = useMemo(() => {
    const cols: Column<DetailDayRow>[] = [
      { key: "sno", header: <HeaderLabel icon={Hash} label="S.No" />, sortable: true, sticky: true, width: "60px", align: "right", accessor: (r) => r.sno },
      { key: "date", header: <HeaderLabel icon={CalendarDays} label="Date" />, sortable: true, sticky: true, width: "100px", accessor: (r) => r.date },
      { key: "food", header: "Food", sortable: true, align: "right", accessor: (r) => formatAmount(r.food) },
      { key: "cleaning", header: "Cleaning", sortable: true, align: "right", accessor: (r) => formatAmount(r.cleaning) },
      { key: "disposable", header: "Disposable", sortable: true, align: "right", accessor: (r) => formatAmount(r.disposable) },
      { key: "consumption", header: <HeaderLabel icon={UtensilsCrossed} label="Consumption" />, sortable: true, align: "right", render: (r) => <span className="font-semibold">{formatAmount(r.consumption)}</span> },
      { key: "mandays", header: <HeaderLabel icon={Users} label="Mandays" />, sortable: true, align: "right", accessor: (r) => formatQty(r.mandays) },
      { key: "dailyPrj", header: <HeaderLabel icon={PiggyBank} label="Daily PRJ" />, sortable: true, align: "right", render: (r) => <span className="font-semibold text-brand-600 dark:text-brand-400">{formatAmount(r.dailyPrj)}</span> },
      { key: "varPrj", header: <HeaderLabel icon={TrendingUp} label="Var PRJ" />, sortable: true, align: "right", render: (r) => <VarCell value={r.varPrj} /> },
      { key: "staff", header: "Staff", sortable: true, align: "right", accessor: (r) => formatQty(r.staff) },
      { key: "varStaff", header: "Var Staff", sortable: true, align: "right", render: (r) => <VarCell value={r.varStaff} /> },
      { key: "productivity", header: "Productivity", sortable: true, align: "right", accessor: (r) => formatAmount(r.productivity) },
      { key: "others", header: "Others", sortable: true, align: "right", accessor: (r) => formatAmount(r.others) },
      { key: "extraProgram", header: "Extra Program", sortable: true, align: "right", accessor: (r) => formatAmount(r.extraProgram) },
    ];
    if (showCumulative) {
      cols.push(
        { key: "cumConsumption", header: "Cum Consumption", sortable: true, align: "right", render: (r) => <span className="bg-amber-50 px-1.5 py-0.5 rounded dark:bg-amber-500/10">{formatAmount(r.cumConsumption)}</span> },
        { key: "cumMandays", header: "Cum Mandays", sortable: true, align: "right", render: (r) => <span className="bg-amber-50 px-1.5 py-0.5 rounded dark:bg-amber-500/10">{formatQty(r.cumMandays)}</span> },
        { key: "cumPrj", header: "Cum PRJ", sortable: true, align: "right", render: (r) => <span className="bg-amber-50 px-1.5 py-0.5 rounded dark:bg-amber-500/10">{formatAmount(r.cumPrj)}</span> }
      );
    }
    if (showBreakdown) {
      for (const prjType of prjTypes) {
        for (const field of ["food", "cleaning", "disposable", "mandays", "total", "prj"] as const) {
          cols.push({
            key: `${prjType}::${field}`,
            header: <HeaderLabel icon={Sparkles} label={`${prjType} · ${field === "prj" ? "PRJ" : field[0].toUpperCase() + field.slice(1)}`} />,
            sortable: true,
            align: "right",
            render: (r) => <span className="bg-emerald-50 px-1.5 py-0.5 rounded dark:bg-emerald-500/10">{formatAmount(r.prjBreakdown[prjType]?.[field] ?? 0)}</span>,
          });
        }
      }
    }
    return cols;
  }, [showBreakdown, showCumulative, prjTypes]);

  return (
    <div className="space-y-3">
      <div data-tour="daily-prj-detail-options" className="flex flex-wrap items-center justify-end gap-4">
        <Checkbox checked={showCumulative} onChange={setShowCumulative} label="Show cumulative columns" />
        {prjTypes.length > 0 && <Checkbox checked={showBreakdown} onChange={setShowBreakdown} label="Show PRJ breakdown" />}
        <ColumnVisibilityMenu columns={FIXED_COLUMN_OPTIONS} hiddenKeys={hiddenColumnKeys} onChange={setHiddenColumnKeys} label="Customize visible columns" />
      </div>
      <Table
        columns={columns.filter((c) => !hiddenColumnKeys.has(c.key))}
        data={rows}
        rowKey={(r) => r.sno}
        loading={loading}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={onSortChange}
        pagination={pagination}
        emptyMessage="No daily PRJ data for this location and month."
      />
    </div>
  );
}
