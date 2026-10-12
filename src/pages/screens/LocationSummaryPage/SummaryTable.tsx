import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Clock,
  MapPin,
  PackageSearch,
  Scale,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format as formatDate } from "date-fns";
import { Table, type Column, type SortDirection } from "../../../components/table/Table";
import { cn } from "../../../lib/cn";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { ROUTES } from "../../../routes/paths";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import { usePeriodStore } from "../../../store/periodStore";
import { formatDateForApi } from "./api";
import type { LocationRecord } from "./data";

interface SummaryTableProps {
  data: LocationRecord[];
  loading: boolean;
  showTenDayColumns: boolean;
  onOpenInventory: (locationId: string) => void;
  /** Sorts the table by this column as soon as it mounts — set when a stat card drills into
   * the metric it summarizes (e.g. clicking "Total mandays" jumps here sorted by mandays). */
  initialSort?: { key: string; direction: SortDirection };
  /** Column keys to hide — driven by the "customize columns" menu, which the parent page
   * renders in its own toolbar (see `ColumnVisibilityMenu`) rather than this component owning
   * it, so the trigger can live wherever makes sense on the page instead of being pinned to
   * this table's own card. */
  hiddenColumnKeys: Set<string>;
}

/** The backend sends `lastUpdate` as a full ISO timestamp (e.g.
 * "2026-09-15T00:00:00.000+00:00") — the table only needs the date. */
function formatLastUpdated(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : formatDate(date, "dd-MM-yyyy");
}

export function SummaryTable({ data, loading, showTenDayColumns, onOpenInventory, initialSort, hiddenColumnKeys }: Readonly<SummaryTableProps>) {
  const navigate = useNavigate();
  const reportingMonth = usePeriodStore((s) => s.selectedMonth);
  const { rows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<LocationRecord>(
    data,
    (row, key) => row[key as keyof LocationRecord],
    10,
    initialSort
  );

  // Old app's `handleLocationIdClick` (LmsSummary/index.jsx) — jumps to Location Details for
  // this row, carrying the location ID and reporting date as query params.
  function goToLocationDetails(locationId: string) {
    const params = new URLSearchParams({ locationId, date: formatDateForApi(reportingMonth) });
    navigate(`${ROUTES.locationDetails}?${params.toString()}`);
  }

  const columns: Column<LocationRecord>[] = [
    {
      key: "id",
      header: <HeaderLabel icon={MapPin} label="Location ID" />,
      label: "Location ID",
      sortable: true,
      sticky: true,
      width: "110px",
      render: (r) => (
        <button
          type="button"
          onClick={() => goToLocationDetails(r.id)}
          className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          {r.id}
        </button>
      ),
    },
    {
      key: "name",
      header: <HeaderLabel icon={Building2} label="Location name" />,
      label: "Location name",
      sortable: true,
      sticky: true,
      width: "200px",
      accessor: (r) => r.name,
    },
    { key: "staff", header: <HeaderLabel icon={Users} label="Staff" />, label: "Staff", sortable: true, align: "right", accessor: (r) => formatQty(r.staff) },
    { key: "currentPOB", header: <HeaderLabel icon={Users} label="Current POB" />, label: "Current POB", sortable: true, align: "right", accessor: (r) => formatQty(r.currentPOB) },
    {
      key: "ratio",
      header: <HeaderLabel icon={Scale} label="Staff ratio" />,
      label: "Staff ratio",
      align: "right",
      accessor: (r) => `${formatQty(r.staff ? r.currentPOB / r.staff : 0)}`,
    },
    { key: "lastUpdated", header: <HeaderLabel icon={Clock} label="Last updated" />, label: "Last updated", sortable: true, accessor: (r) => formatLastUpdated(r.lastUpdated) },
    { key: "targetPRJ", header: <HeaderLabel icon={Target} label="Target PRJ" />, label: "Target PRJ", sortable: true, align: "right", accessor: (r) => formatQty(r.targetPRJ) },
    ...(showTenDayColumns
      ? ([
          { key: "tenDay", header: "10-day", label: "10-day", align: "right", accessor: (r: LocationRecord) => formatQty(r.tenDay) },
          { key: "twentyDay", header: "20-day", label: "20-day", align: "right", accessor: (r: LocationRecord) => formatQty(r.twentyDay) },
          { key: "thirtyDay", header: "30-day", label: "30-day", align: "right", accessor: (r: LocationRecord) => formatQty(r.thirtyDay) },
        ] as Column<LocationRecord>[])
      : []),
    {
      key: "actual",
      header: <HeaderLabel icon={TrendingUp} label="Actual" />,
      label: "Actual",
      sortable: true,
      align: "right",
      render: (r) => (
        <span className={cn("font-semibold", r.actual > r.targetPRJ ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
          {formatQty(r.actual)}
        </span>
      ),
    },
    {
      key: "delta",
      header: "Actual vs target",
      label: "Actual vs target",
      align: "right",
      render: (r) => {
        const delta = r.actual - r.targetPRJ;
        const over = delta > 0;
        return (
          <span className={cn("inline-flex items-center gap-0.5 font-semibold", over ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
            {over ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {formatQty(Math.abs(delta))}
          </span>
        );
      },
    },
    { key: "totalMandays", header: <HeaderLabel icon={CalendarDays} label="Total mandays" />, label: "Total mandays", sortable: true, align: "right", accessor: (r) => formatQty(r.totalMandays) },
    { key: "totalCost", header: <HeaderLabel icon={Wallet} label="Total cost" />, label: "Total cost", sortable: true, align: "right", accessor: (r) => formatAmount(r.totalCost) },
    { key: "wasteCost", header: <HeaderLabel icon={Trash2} label="Waste cost" />, label: "Waste cost", sortable: true, align: "right", accessor: (r) => formatAmount(r.wasteCost) },
    {
      key: "inventoryValue",
      header: <HeaderLabel icon={PackageSearch} label="Inventory value" />,
      label: "Inventory value",
      sortable: true,
      align: "right",
      render: (r) => (
        <button type="button" onClick={() => onOpenInventory(r.id)} className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
          {formatAmount(r.inventoryValue)}
        </button>
      ),
    },
    { key: "dio", header: <HeaderLabel icon={Timer} label="DIO" />, label: "DIO", sortable: true, align: "right", accessor: (r) => formatQty(r.dio) },
  ];

  return (
    <Table
      columns={columns.filter((c) => !hiddenColumnKeys.has(c.key))}
      data={rows}
      rowKey={(r) => r.id}
      loading={loading}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
      pagination={pagination}
      emptyMessage="No locations match the current filters."
    />
  );
}
