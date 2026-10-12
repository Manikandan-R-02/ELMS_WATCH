import { useState } from "react";
import { ChevronDown, ChevronRight, Eye } from "lucide-react";
import { Table, type Column } from "../../../components/table/Table";
import { IconButton } from "../../../components/buttons/IconButton";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { fetchLocationBreakdownForMonth } from "./api";
import { identityLabelFor, wastePercentage, type WasteOverviewRow } from "./data";

export interface OverviewTableProps {
  rows: WasteOverviewRow[];
  loading: boolean;
  year: number;
  emptyMessage: string;
  /** True only for the year-wide, all-locations view — every other view's rows are already as
   * granular as they get, so there's nothing left to expand inline. */
  expandableByLocation: boolean;
  /** The page-level Location filter, when a specific one is chosen — a month row in that scope
   * carries no `locationId` of its own (the API only echoes it per-row for a location-breakdown
   * response), so this is the fallback used to make its eye button open the right location. */
  contextLocation?: { id: string; name?: string } | null;
  onOpenDay: (month: number, locationId: string, locationName?: string) => void;
}

type FlatRow =
  | { kind: "row"; key: string; row: WasteOverviewRow }
  | { kind: "sub"; key: string; row: WasteOverviewRow }
  | { kind: "subEmpty"; key: string }
  | { kind: "subLoading"; key: string };

function rowKeyOf(row: WasteOverviewRow): string {
  return row.month === undefined ? `l-${row.locationId}` : `m-${row.month}`;
}

/**
 * The old screen's "Waste Overview Table" — a sticky-first-column table whose identity column
 * switches between "Month" and "Location" depending on the current filter scope (see
 * `WasteCostAnalysisPage/index.tsx`'s `viewMode`), plus the old app's month-row-expands-into-
 * per-location-breakdown behavior for the year-wide overview specifically.
 */
export function OverviewTable({ rows, loading, year, emptyMessage, expandableByLocation, contextLocation, onOpenDay }: Readonly<OverviewTableProps>) {
  const [expanded, setExpanded] = useState<Record<string, WasteOverviewRow[] | "loading" | undefined>>({});

  async function toggleExpand(row: WasteOverviewRow) {
    const key = rowKeyOf(row);
    const month = row.month;
    if (month === undefined) return;
    if (expanded[key] !== undefined) {
      setExpanded((e) => ({ ...e, [key]: undefined }));
      return;
    }
    setExpanded((e) => ({ ...e, [key]: "loading" }));
    const sub = await fetchLocationBreakdownForMonth(year, month);
    setExpanded((e) => ({ ...e, [key]: sub }));
  }

  const flat: FlatRow[] = [];
  for (const row of rows) {
    const key = rowKeyOf(row);
    flat.push({ kind: "row", key, row });
    const sub = expanded[key];
    if (sub === "loading") flat.push({ kind: "subLoading", key: `${key}-loading` });
    else if (Array.isArray(sub)) {
      if (sub.length === 0) flat.push({ kind: "subEmpty", key: `${key}-empty` });
      else for (const s of sub) flat.push({ kind: "sub", key: `${key}-${s.locationId}`, row: s });
    }
  }

  const columns: Column<FlatRow>[] = [
    {
      key: "identity",
      header: expandableByLocation || rows[0]?.month !== undefined ? "Month" : "Location",
      sticky: true,
      width: "180px",
      render: (fr) => {
        if (fr.kind === "subLoading") return <span className="pl-5 text-slate-400">Loading location data...</span>;
        if (fr.kind === "subEmpty") return <span className="pl-5 text-slate-400">No location data available</span>;
        if (fr.kind === "sub") return <span className="pl-5 text-slate-600 dark:text-slate-300">{identityLabelFor(fr.row)}</span>;
        const canExpand = expandableByLocation && fr.row.month !== undefined;
        const isOpen = expanded[fr.key] !== undefined;
        return canExpand ? (
          <button
            type="button"
            onClick={() => toggleExpand(fr.row)}
            className="flex items-center gap-1.5 font-semibold text-slate-800 hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400"
          >
            {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
            {identityLabelFor(fr.row)}
          </button>
        ) : (
          <span className="font-semibold text-slate-800 dark:text-slate-100">{identityLabelFor(fr.row)}</span>
        );
      },
    },
    { key: "manday", header: "Manday", align: "right", render: (fr) => ("row" in fr ? formatQty(fr.row.currentMandays) : "") },
    { key: "meals", header: "Meal Count", align: "right", render: (fr) => ("row" in fr ? formatQty(fr.row.mealsCount) : "") },
    { key: "wasteWt", header: "Waste Wt", align: "right", render: (fr) => ("row" in fr ? formatQty(fr.row.totalWasteWeight) : "") },
    { key: "wasteVal", header: "Waste Val", align: "right", render: (fr) => ("row" in fr ? formatAmount(fr.row.totalWasteValue) : "") },
    { key: "txn", header: "Transaction", align: "right", render: (fr) => ("row" in fr ? formatQty(fr.row.transactionCount) : "") },
    { key: "rawMaterial", header: "Raw Material", align: "right", render: (fr) => ("row" in fr ? formatAmount(fr.row.rawMaterialCost) : "") },
    { key: "wastePct", header: "Waste %", align: "right", render: (fr) => ("row" in fr ? `${formatQty(wastePercentage(fr.row))}%` : "") },
    { key: "wasteGms", header: "Waste/GMS", align: "right", render: (fr) => ("row" in fr ? formatQty(fr.row.wasteMealsGms) : "") },
    {
      key: "actions",
      header: "",
      align: "center",
      width: "56px",
      render: (fr) => {
        if (fr.kind !== "row" && fr.kind !== "sub") return null;
        const locationId = fr.row.locationId ?? contextLocation?.id;
        const locationName = fr.row.locationName ?? contextLocation?.name;
        const month = fr.row.month;
        // A row can only open the day-level modal once both a concrete month and a concrete
        // location are known for it — a year-wide month row with no location breakdown yet
        // expanded, and no location pinned by the page filter either, has neither (matches the
        // old screen, where only location-identified rows/sub-rows were eye-able).
        if (!locationId || month === undefined) return null;
        return <IconButton icon={Eye} label="View day-based data" tone="brand" size="sm" onClick={() => onOpenDay(month, locationId, locationName)} />;
      },
    },
  ];

  return <Table columns={columns} data={flat} rowKey={(fr) => fr.key} loading={loading} emptyMessage={emptyMessage} />;
}
