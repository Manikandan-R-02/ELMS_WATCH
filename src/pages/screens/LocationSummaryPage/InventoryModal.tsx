import { useEffect, useMemo, useState } from "react";
import { Boxes, Hash, Scale, ShoppingBag, Tag, Wallet, PackageSearch } from "lucide-react";
import { Modal } from "../../../components/modals/Modal";
import { Table, type Column, type SortDirection } from "../../../components/table/Table";
import { SearchBar } from "../../../components/search/SearchBar";
import { TextBadge } from "../../../components/badges/StatusBadge";
import { Loader } from "../../../components/loader/Loader";
import { formatAmount, formatQty } from "../../../store/numberFormatStore";
import { useApiRequest } from "../../../api/useApiRequest";
import { fetchInventoryByLocation, mapInventoryItem, type InventoryApiItem } from "./api";
import { HeaderLabel } from "../../../components/table/HeaderLabel";
import type { InventoryItem } from "./data";

interface InventoryModalProps {
  locationId: string | null;
  onClose: () => void;
  reportingMonth: Date;
  /** Loads the items; defaults to the location's current inventory. Location Details passes a
   * by-date loader so the same modal also serves a clicked date on its Inventory tab. */
  fetchItems?: (reportingMonth: Date, locationId: string) => Promise<InventoryApiItem[]>;
  /** Shown after the title, e.g. the date being viewed. */
  titleSuffix?: string;
}

export function InventoryModal({ locationId, onClose, reportingMonth, fetchItems = fetchInventoryByLocation, titleSuffix }: Readonly<InventoryModalProps>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const inventory = useApiRequest(fetchItems);
  useEffect(() => {
    if (locationId) inventory.run(reportingMonth, locationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, reportingMonth]);

  // A fresh search/sort (or a different location entirely) should always land back on page 1 —
  // otherwise narrowing a search on page 3 can leave the table showing an out-of-range empty page.
  useEffect(() => {
    setPage(1);
  }, [search, sortKey, sortDirection, locationId]);

  const items = useMemo(() => (inventory.data ?? []).map(mapInventoryItem), [inventory.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = q ? items.filter((i) => `${i.category} ${i.itemId} ${i.itemName} ${i.packageId}`.toLowerCase().includes(q)) : items;
    if (sortKey && sortDirection) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortKey as keyof InventoryItem];
        const bv = b[sortKey as keyof InventoryItem];
        const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [items, search, sortKey, sortDirection]);

  // Totals sum every matching row (the full filtered set), not just the current page — so the
  // footer always reflects the whole search result, matching what a user expects from "0 items ·
  // Qty 0.00 · Value 0.00" style summaries.
  const totals = useMemo(
    () => filtered.reduce((acc, i) => ({ qty: acc.qty + i.closingQty, value: acc.value + i.closingValue }), { qty: 0, value: 0 }),
    [filtered]
  );

  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  function handleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortKey(null);
      setSortDirection(null);
    }
  }

  const columns: Column<InventoryItem>[] = [
    { key: "category", header: <HeaderLabel icon={Tag} label="Category" />, render: (r) => <TextBadge status="info" label={r.category} /> },
    { key: "itemId", header: <HeaderLabel icon={Hash} label="Item ID" />, sortable: true, accessor: (r) => r.itemId },
    { key: "itemName", header: <HeaderLabel icon={ShoppingBag} label="Item name" />, sortable: true, accessor: (r) => r.itemName },
    { key: "packageId", header: <HeaderLabel icon={Boxes} label="Package ID" />, accessor: (r) => r.packageId },
    { key: "closingQty", header: <HeaderLabel icon={Scale} label="Closing qty" />, sortable: true, align: "right", accessor: (r) => formatQty(r.closingQty) },
    { key: "closingValue", header: <HeaderLabel icon={Wallet} label="Closing value" />, sortable: true, align: "right", accessor: (r) => formatAmount(r.closingValue) },
  ];

  const suffixPart = titleSuffix ? ` — ${titleSuffix}` : "";
  const modalTitle = `Inventory — ${locationId ?? ""}${suffixPart}`;
  return (
    <Modal open={!!locationId} onClose={onClose} size="2xl" title={modalTitle} icon={
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
        <PackageSearch className="h-[1.375rem] w-[1.375rem]" />
      </span>
    } accentClassName="bg-brand-500">
      <div data-tour="location-summary-inventory-modal" className="space-y-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search items..." width="100%" />
        {inventory.error && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-sm text-red-600 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
            Couldn't load inventory: {inventory.error.message}
          </div>
        )}
        {!inventory.error && (inventory.loading && items.length === 0) && (
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        )}
        {!inventory.error && !(inventory.loading && items.length === 0) && (
          <Table
            columns={columns}
            data={paged}
            rowKey={(r) => r.itemId}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={handleSort}
            emptyMessage="No inventory items found."
            pagination={{
              page,
              pageSize,
              total: filtered.length,
              onPageChange: setPage,
              onPageSizeChange: (size) => {
                setPageSize(size);
                setPage(1);
              },
            }}
          />
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-4 py-2.5 text-sm dark:bg-slate-800/50">
          <span className="text-body-sm">{filtered.length} item{filtered.length === 1 ? "" : "s"}</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            Qty {formatQty(totals.qty)} &middot; Value {formatAmount(totals.value)}
          </span>
        </div>
      </div>
    </Modal>
  );
}
