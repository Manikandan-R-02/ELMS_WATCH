import { useEffect, useMemo } from "react";
import { Building2, MapPin, TrendingUp, Users } from "lucide-react";
import { Table, type Column } from "../../../components/table/Table";
import { formatQty } from "../../../store/numberFormatStore";
import { useApiRequest } from "../../../api/useApiRequest";
import { baseSummaryPayload, dailyFieldValue, fetchLocationSummary, withLocationFilter, type DailyPrjApiRow } from "./api";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import type { LocationFilter } from "./LocationFilterModal";

export type DayRange = "1-9" | "10-18" | "19-25";

const RANGE_DAYS: Record<DayRange, number[]> = {
  "1-9": Array.from({ length: 9 }, (_, i) => i + 1),
  "10-18": Array.from({ length: 9 }, (_, i) => i + 10),
  "19-25": Array.from({ length: 7 }, (_, i) => i + 19),
};
const ALL_DAYS = Array.from({ length: 25 }, (_, i) => i + 1);

interface DailyPrjTableProps {
  filter: LocationFilter;
  reportingMonth: Date;
  dayRange: DayRange;
}

type Row = { id: string; name: string } & Record<string, number | string>;

export function DailyPrjTable({ filter, reportingMonth, dayRange }: Readonly<DailyPrjTableProps>) {
  const days = RANGE_DAYS[dayRange];
  const showTotals = dayRange === "19-25";

  const request = useApiRequest(fetchLocationSummary);
  useEffect(() => {
    const payload = withLocationFilter(baseSummaryPayload(reportingMonth, "Daily PRJ"), filter);
    request.run(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, reportingMonth]);

  const rowsRaw: Row[] = useMemo(() => {
    const apiRows: DailyPrjApiRow[] = request.data?.responseContents3 ?? [];
    return apiRows.map((apiRow) => {
      const row: Row = { id: apiRow.locationId, name: apiRow.locationName };
      let totalPob = 0;
      let totalActual = 0;
      for (const day of ALL_DAYS) {
        const pob = dailyFieldValue(apiRow, "pob", day);
        const actual = dailyFieldValue(apiRow, "actual", day);
        totalPob += pob;
        totalActual += actual;
        if (days.includes(day)) {
          row[`d${day}.pob`] = pob;
          row[`d${day}.actual`] = actual;
        }
      }
      row.totalPob = totalPob;
      row.totalActual = totalActual;
      return row;
    });
  }, [request.data, days]);

  const { rows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<Row>(rowsRaw, (row, key) => row[key], 10);

  const columns: Column<Row>[] = useMemo(() => {
    const cols: Column<Row>[] = [
      { key: "id", header: <HeaderLabel icon={MapPin} label="Location ID" />, sortable: true, sticky: true, width: "110px", accessor: (r) => r.id },
      { key: "name", header: <HeaderLabel icon={Building2} label="Location name" />, sortable: true, sticky: true, width: "200px", accessor: (r) => r.name },
    ];
    for (const day of days) {
      cols.push({ key: `d${day}.pob`, header: <HeaderLabel icon={Users} label={`D${day} POB`} />, sortable: true, align: "right", accessor: (r) => formatQty(r[`d${day}.pob`] as number) }, { key: `d${day}.actual`, header: <HeaderLabel icon={TrendingUp} label={`D${day} Actual`} />, sortable: true, align: "right", accessor: (r) => formatQty(r[`d${day}.actual`] as number) });
    }
    if (showTotals) {
      cols.push({ key: "totalPob", header: <HeaderLabel icon={Users} label="Total POB" />, sortable: true, align: "right", accessor: (r) => formatQty(r.totalPob as number) }, { key: "totalActual", header: <HeaderLabel icon={TrendingUp} label="Total actual" />, sortable: true, align: "right", accessor: (r) => formatQty(r.totalActual as number) });
    }
    return cols;
  }, [days, showTotals]);

  return (
    <div className="space-y-2">
      {request.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
          Couldn't load Daily PRJ data: {request.error.message}
        </div>
      )}
      <Table
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        loading={request.loading}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={onSortChange}
        pagination={pagination}
        emptyMessage="No locations match the current filters."
      />
    </div>
  );
}
