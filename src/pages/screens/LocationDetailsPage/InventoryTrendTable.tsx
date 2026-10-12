import { useEffect, useMemo, useState } from "react";
import { CalendarDays, PackageSearch, Scale, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Table, type Column } from "../../../components/table/Table";
import { ColumnVisibilityMenu } from "../../../components/table/ColumnVisibilityMenu";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { useApiRequest } from "../../../api/useApiRequest";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import { fetchInventoryTrend, mapInventoryTrendRow } from "./api";
import type { InventoryTrendRecord } from "./data";

interface InventoryTrendTableProps {
  locationId: string;
  reportingMonth: Date;
  /** Opens that date's item-level inventory (old app: clicking a date on this tab). */
  onOpenDate: (date: string) => void;
  /** Reports the first listed date (or null) so the page's tour can open the date popup. */
  onFirstDateChange?: (date: string | null) => void;
}

/** "Inventory" tab — one row per date's closing inventory position, from
 * `overallSummary-service`'s `locationSummaryController/inventoryData` endpoint (old app's `fetchInventoryTabData`,
 * index.jsx ~2902-2929). The old app's own table columns there (`date`/`inventory`/`dio`) don't
 * actually match that endpoint's real field names (`totalClosingQty`, `dioDays`, …) — those
 * columns rendered blank in the old app. This uses the real field names instead. */
export function InventoryTrendTable({ locationId, reportingMonth, onOpenDate, onFirstDateChange }: Readonly<InventoryTrendTableProps>) {
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Set<string>>(new Set());
  const request = useApiRequest(fetchInventoryTrend);

  useEffect(() => {
    if (!locationId) return;
    request.run(reportingMonth, locationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, reportingMonth]);

  const data = useMemo(() => (request.data ?? []).map(mapInventoryTrendRow), [request.data]);

  const firstDate = data[0]?.date || null;
  useEffect(() => {
    onFirstDateChange?.(firstDate);
    return () => onFirstDateChange?.(null);
  }, [firstDate, onFirstDateChange]);
  const { rows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged<InventoryTrendRecord>(
    data,
    (row, key) => row[key as keyof InventoryTrendRecord],
    10
  );

  const columns: Column<InventoryTrendRecord>[] = [
    { key: "date", header: <HeaderLabel icon={CalendarDays} label="Date" />, label: "Date", sortable: true, sticky: true,
      width: "110px",
      render: (r) => (
        <button
          type="button"
          onClick={() => onOpenDate(r.date)}
          title={`View inventory items for ${r.date}`}
          className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          {r.date}
        </button>
      ),
    },
    { key: "closingQty", header: <HeaderLabel icon={Scale} label="Closing qty" />, label: "Closing qty", sortable: true, align: "right", accessor: (r) => formatQty(r.closingQty) },
    { key: "closingValue", header: <HeaderLabel icon={Wallet} label="Closing value" />, label: "Closing value", sortable: true, align: "right", accessor: (r) => formatAmount(r.closingValue) },
    { key: "dailyConsumptionValue", header: <HeaderLabel icon={TrendingDown} label="Daily consumption" />, label: "Daily consumption", sortable: true, align: "right", accessor: (r) => formatAmount(r.dailyConsumptionValue) },
    { key: "cumulativeConsumptionValue", header: <HeaderLabel icon={TrendingUp} label="Cumulative consumption" />, label: "Cumulative consumption", sortable: true, align: "right", accessor: (r) => formatAmount(r.cumulativeConsumptionValue) },
    { key: "dioDays", header: <HeaderLabel icon={PackageSearch} label="DIO (days)" />, label: "DIO (days)", sortable: true, align: "right", accessor: (r) => formatQty(r.dioDays) },
  ];

  const columnOptions = columns.filter((c) => !c.sticky).map((c) => ({ key: c.key, label: c.label ?? c.key }));

  return (
    <>
      {request.error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
          Couldn't load inventory trend: {request.error.message}
        </div>
      )}
      <div className="mb-3 flex justify-end">
        <ColumnVisibilityMenu columns={columnOptions} hiddenKeys={hiddenColumnKeys} onChange={setHiddenColumnKeys} label="Customize visible columns" />
      </div>
      <Table
        columns={columns.filter((c) => !hiddenColumnKeys.has(c.key))}
        data={rows}
        rowKey={(r, i) => `${r.date}-${i}`}
        loading={request.loading}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={onSortChange}
        pagination={pagination}
        emptyMessage="No inventory data for this location and month."
      />
    </>
  );
}
