import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronRight, ListTree } from "lucide-react";
import { Modal } from "../../../components/modals/Modal";
import { Segmented } from "../../../components/common/Segmented";
import { Table, type Column } from "../../../components/table/Table";
import { useApiRequest } from "../../../api/useApiRequest";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { fetchDayBasedData } from "./api";
import { monthLabel, wastePercentage, type DayBasedDataType, type DayRow, type WasteFigures } from "./data";

const TYPE_OPTIONS: { label: string; value: DayBasedDataType }[] = [
  { label: "Loss Reason", value: "Loss Reason" },
  { label: "Food Item", value: "Food Item" },
];

type ModalRow =
  | { kind: "day"; day: DayRow }
  | { kind: "detail"; parentDate: string; label: string; figures: WasteFigures }
  | { kind: "empty"; parentDate: string };

/** Flattens the days into table rows: each day, plus its breakdown lines when it is expanded. */
function buildModalRows(dayData: DayRow[], expandedDate: string | null, typeView: string): ModalRow[] {
  const out: ModalRow[] = [];
  for (const day of dayData) {
    out.push({ kind: "day", day });
    if (expandedDate !== day.date) continue;
    const details = typeView === "Loss Reason" ? day.lossReasonList : day.foodItemByweight;
    if (details.length === 0) {
      out.push({ kind: "empty", parentDate: day.date });
      continue;
    }
    for (const d of details) {
      const label = "lossReason" in d ? d.lossReason : `${d.foodCategory} — ${d.foodItem}`;
      out.push({ kind: "detail", parentDate: day.date, label, figures: d });
    }
  }
  return out;
}

/** Rows that carry waste figures (a whole day or one of its breakdown lines). */
function isDataRow(r: ModalRow): r is Extract<ModalRow, { kind: "day" | "detail" }> {
  return r.kind === "day" || r.kind === "detail";
}

/** The figures to show for a data row: a day's totals, or a breakdown line's own figures. */
function figuresOf(r: Extract<ModalRow, { kind: "day" | "detail" }>) {
  return r.kind === "day" ? r.day : r.figures;
}

export interface DayBasedDataModalProps {
  open: boolean;
  onClose: () => void;
  year: number;
  month: number;
  locationId: string;
  locationName?: string;
}

function safeFormatDate(iso: string): string {
  try {
    return format(parseISO(iso), "dd MMM yyyy");
  } catch {
    return iso;
  }
}

/** The old screen's "Day Based Data" modal — a day-by-day table for one location/month, where
 * each day expands in place to either its loss-reason or food-item breakdown depending on the
 * toggle. Self-contained (fetches its own data on open, like `ResetPasswordModal`/every other
 * modal in this app) so it works whether it's opened from an already-drilled-into location or a
 * bare table row, without the page needing to hand it pre-fetched data either way. */
export function DayBasedDataModal({ open, onClose, year, month, locationId, locationName }: Readonly<DayBasedDataModalProps>) {
  const [typeView, setTypeView] = useState<DayBasedDataType>("Loss Reason");
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const days = useApiRequest(fetchDayBasedData);

  useEffect(() => {
    if (!open) return;
    setExpandedDate(null);
    days.run(year, month, locationId, typeView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, year, month, locationId, typeView]);

  const dayData = days.data ?? [];

  const rows = useMemo(() => buildModalRows(dayData, expandedDate, typeView), [dayData, expandedDate, typeView]);

  const columns: Column<ModalRow>[] = [
    {
      key: "label",
      header: "Date",
      render: (row) => {
        if (row.kind === "day") {
          const isOpen = expandedDate === row.day.date;
          return (
            <button
              type="button"
              onClick={() => setExpandedDate(isOpen ? null : row.day.date)}
              className="flex items-center gap-1.5 font-semibold text-slate-800 hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400"
            >
              {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              {safeFormatDate(row.day.date)}
            </button>
          );
        }
        if (row.kind === "empty") return <span className="pl-5 text-slate-400">No {typeView} data for this day</span>;
        return <span className="whitespace-normal break-words pl-5 text-slate-600 dark:text-slate-300">{row.label}</span>;
      },
    },
    { key: "manday", header: "Manday", align: "right", render: (r) => (isDataRow(r) ? formatQty(figuresOf(r).currentMandays) : "") },
    { key: "meals", header: "Mealcount", align: "right", render: (r) => (isDataRow(r) ? formatQty(figuresOf(r).mealsCount) : "") },
    { key: "wasteWt", header: "Waste Weight", align: "right", render: (r) => (isDataRow(r) ? formatQty(figuresOf(r).totalWasteWeight) : "") },
    { key: "wasteVal", header: "Waste Value", align: "right", render: (r) => (isDataRow(r) ? formatAmount(figuresOf(r).totalWasteValue) : "") },
    { key: "txn", header: "Transaction", align: "right", render: (r) => (isDataRow(r) ? formatQty(figuresOf(r).transactionCount) : "") },
    { key: "rawMaterial", header: "Raw Material", align: "right", render: (r) => (isDataRow(r) ? formatAmount(figuresOf(r).rawMaterialCost) : "") },
    { key: "wastePct", header: "Waste %", align: "right", render: (r) => (isDataRow(r) ? `${formatQty(wastePercentage(figuresOf(r)))}%` : "") },
    { key: "wasteGms", header: "Waste/GMS", align: "right", render: (r) => (isDataRow(r) ? formatQty(figuresOf(r).wasteMealsGms) : "") },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={locationId + (locationName ? ` — ${locationName}` : "")}
      icon={
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <ListTree className="h-[1.375rem] w-[1.375rem]" />
        </span>
      }
      accentClassName="bg-brand-500"
      size="2xl"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-body-sm">{monthLabel(month)} {year}</p>
          <Segmented options={TYPE_OPTIONS} value={typeView} onChange={setTypeView} />
        </div>
        <Table columns={columns} data={rows} rowKey={(row, i) => `${row.kind}-${i}`} loading={days.loading} emptyMessage="No data available" />
      </div>
    </Modal>
  );
}
