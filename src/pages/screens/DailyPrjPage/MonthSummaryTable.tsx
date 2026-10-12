import { CalendarRange } from "lucide-react";
import { Table, type Column } from "../../../components/table/Table";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import { cn } from "../../../lib/cn";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import type { MonthSummaryRow } from "./data";

/** Current Month / Previous Month / Total / Avg / Target, side by side — old app pins these as
 * sticky header rows above the day-by-day table; rendered here as their own small table instead
 * (the shared `Table` component has no notion of a non-data pinned row), directly above the
 * day-detail table it summarizes. */
export function MonthSummaryTable({ data }: Readonly<{ data: MonthSummaryRow[] }>) {
  function cell(value: number | undefined, formatter: (v: number) => string) {
    return value === undefined ? <span className="text-slate-300 dark:text-slate-600">—</span> : formatter(value);
  }

  const columns: Column<MonthSummaryRow>[] = [
    { key: "label", header: <HeaderLabel icon={CalendarRange} label="" />, render: (r) => <span className={cn("font-semibold", r.label === "Target" && "text-emerald-700 dark:text-emerald-300")}>{r.label}</span> },
    { key: "food", header: "Food", align: "right", render: (r) => cell(r.food, formatAmount) },
    { key: "cleaning", header: "Cleaning", align: "right", render: (r) => cell(r.cleaning, formatAmount) },
    { key: "disposable", header: "Disposable", align: "right", render: (r) => cell(r.disposable, formatAmount) },
    { key: "consumption", header: "Consumption", align: "right", render: (r) => cell(r.consumption, formatAmount) },
    { key: "mandays", header: "Mandays", align: "right", render: (r) => cell(r.mandays, formatQty) },
    { key: "dailyPrj", header: "Daily PRJ", align: "right", render: (r) => <span className="font-semibold">{cell(r.dailyPrj, formatAmount)}</span> },
    { key: "staff", header: "Staff", align: "right", render: (r) => cell(r.staff, formatQty) },
    { key: "productivity", header: "Productivity", align: "right", render: (r) => cell(r.productivity, formatAmount) },
    { key: "others", header: "Others", align: "right", render: (r) => cell(r.others, formatAmount) },
  ];

  return <Table columns={columns} data={data} rowKey={(r) => r.label} emptyMessage="No month rollup data available." />;
}
