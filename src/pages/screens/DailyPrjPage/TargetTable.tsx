import type { ReactNode } from "react";
import { Target } from "lucide-react";
import { Table, type Column } from "../../../components/table/Table";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import { cn } from "../../../lib/cn";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import type { TargetRow } from "./data";

/** The row that carries the screen's single authoritative Daily PRJ target figure. */
const HIGHLIGHT_ROW = "PRJ/Manday";

/** One value cell: bold green on the highlighted row, plain text on every other. */
function cell(row: TargetRow, text: ReactNode) {
  const tone = row.prj === HIGHLIGHT_ROW ? "font-bold text-emerald-800 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200";
  return <span className={cn(tone)}>{text}</span>;
}

const COLUMNS: Column<TargetRow>[] = [
  { key: "prj", header: <HeaderLabel icon={Target} label="PRJ" />, render: (r) => cell(r, r.prj) },
  { key: "targetValue", header: "Target value", align: "right", render: (r) => cell(r, formatAmount(r.targetValue)) },
  { key: "mandays", header: "Mandays", align: "right", render: (r) => cell(r, formatQty(r.mandays)) },
  { key: "total", header: "Total (Target × MD)", align: "right", render: (r) => cell(r, formatAmount(r.total)) },
  { key: "impactManday", header: "Impact manday", align: "right", render: (r) => cell(r, formatAmount(r.impactManday)) },
];

/** "PRJ Target Summary" — one row per PRJ type, plus a highlighted "PRJ/Manday" row (the
 * screen's single authoritative Daily PRJ target figure, see `api.ts`'s `targetDailyPrj`). A result
 * grid, so it is shown small and in the green "result" table pattern rather than full width. */
export function TargetTable({ data }: Readonly<{ data: TargetRow[] }>) {
  return (
    <Table
      columns={COLUMNS}
      data={data}
      variant="result"
      rowKey={(r) => r.prj}
      emptyMessage="No PRJ target data for this location and month."
    />
  );
}
