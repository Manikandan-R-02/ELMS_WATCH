import { useMemo } from "react";
import { Hash, MapPin, Tag } from "lucide-react";
import { Table, type Column } from "../../../components/table/Table";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import { cn } from "../../../lib/cn";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import type { DetailRow } from "./data";

interface DetailTableProps {
  data: DetailRow[];
  dayNumbers: number[];
  dayDates: string[];
  loading: boolean;
}

// Every location always has exactly 3 category rows (Consumption/Manday/Staff Onsite — see
// `data.ts`'s `CATEGORY_LABELS`) — page sizes here are all multiples of 3 so a location's group
// of rows is never split across a page boundary, which would otherwise break the merged-cell
// grouping below (`mergeWith` only compares *adjacent* rows on the currently displayed page).
const GROUP_SIZE = 3;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 40].map((locations) => locations * GROUP_SIZE);

/** "Data Availability Detail" — one row per (location, category) pair, one column per day of the
 * reporting month, each cell a colored Yes/No flag. Location S.No/ID/Name are merged via
 * `rowSpan` across each location's 3 category rows (`Table`'s `mergeWith` column option) to match
 * the old app's original grouped layout, while Category and the day columns stay per-row. Sorting
 * is restricted to the location-level columns (S.No/ID/Name are identical across a group, and a
 * stable sort keeps a group's 3 rows adjacent either way) — sorting by Category or a day column
 * would interleave rows from different locations and break the grouping, so those aren't
 * sortable. Location ID/Name/Category stay pinned (sticky) while the day columns scroll
 * horizontally — same pattern as every other wide report table in this app (`DailyPrjPage`'s
 * `SummaryTable`, `LocationSummaryPage`'s month-comparison tables). */
export function DetailTable({ data, dayNumbers, dayDates, loading }: Readonly<DetailTableProps>) {
  const { rows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<DetailRow>(
    data,
    (row, key) => (key === "sno" ? row.sno : (row as unknown as Record<string, string>)[key] ?? ""),
    PAGE_SIZE_OPTIONS[0],
    { key: "sno", direction: "asc" }
  );

  const columns: Column<DetailRow>[] = useMemo(() => {
    const dayColumns: Column<DetailRow>[] = dayNumbers.map((day, i) => ({
      key: `day-${day}`,
      header: <span title={dayDates[i] ?? ""}>{day}</span>,
      label: `Day ${day}`,
      align: "center",
      width: "60px",
      render: (r) => {
        const v = r.values[i];
        return (
          <span
            className={cn(
              "inline-flex min-w-[2.5rem] items-center justify-center rounded px-1.5 py-0.5 text-[0.7rem] font-bold",
              v === "Yes"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
            )}
          >
            {v ?? "—"}
          </span>
        );
      },
    }));

    return [
      { key: "sno", header: <HeaderLabel icon={Hash} label="S.No" />, label: "S.No", sortable: true, sticky: true, width: "64px", align: "center", accessor: (r) => r.sno, mergeWith: (r) => r.locationId },
      { key: "locationId", header: <HeaderLabel icon={MapPin} label="Location ID" />, label: "Location ID", sortable: true, sticky: true, width: "110px", accessor: (r) => r.locationId, mergeWith: (r) => r.locationId },
      { key: "locationName", header: "Location Name", label: "Location Name", sortable: true, sticky: true, width: "200px", accessor: (r) => r.locationName, mergeWith: (r) => r.locationId },
      { key: "category", header: <HeaderLabel icon={Tag} label="Category" />, label: "Category", sticky: true, width: "110px", accessor: (r) => r.category },
      ...dayColumns,
    ];
  }, [dayNumbers, dayDates]);

  return (
    <Table
      columns={columns}
      data={rows}
      rowKey={(r) => r.key}
      loading={loading}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
      pagination={{ ...pagination, pageSizeOptions: PAGE_SIZE_OPTIONS }}
      emptyMessage="No locations match the current search."
    />
  );
}
