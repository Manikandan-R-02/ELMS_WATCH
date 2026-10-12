import { useMemo, useState } from "react";
import { Table, type Column, type SortDirection } from "../components/table/Table";
import { TableDatePicker } from "../components/table/TableDatePicker";
import { TextBadge } from "../components/badges/StatusBadge";
import { SearchBar } from "../components/search/SearchBar";
import { PlusTextButton, RefreshRoundedButton } from "../components/buttons";
import { showInfoToast } from "../store/toastStore";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { PreviewPage, PreviewSection, ComponentApi } from "./PreviewSection";

interface Order {
  id: number;
  customer: string;
  amount: number;
  status: "success" | "pending" | "error";
  shipDate: Date | null;
}

const ALL_ORDERS: Order[] = Array.from({ length: 47 }, (_, i) => ({
  id: 1000 + i,
  customer: ["Aditi Rao", "Ben Carter", "Chen Wei", "Diya Patel", "Ethan Ross"][i % 5],
  amount: Math.round((i + 1) * 137.5),
  status: (["success", "pending", "error"] as const)[i % 3],
  shipDate: new Date(2026, 0, 1 + i),
}));

/** Badge tone for each row status; anything else shows as an error. */
const STATUS_BADGE: Record<string, "success" | "pending"> = { success: "success", pending: "pending" };

export function TablePreviewPage() {
  const [orders, setOrders] = useState(ALL_ORDERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<string | null>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [demoState, setDemoState] = useState<"data" | "loading" | "empty">("data");

  function updateShipDate(id: number, date: Date | null) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, shipDate: date } : o)));
  }

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return orders;
    const q = debouncedSearch.toLowerCase();
    return orders.filter((o) => o.customer.toLowerCase().includes(q) || String(o.id).includes(q));
  }, [orders, debouncedSearch]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (!sortKey) return copy;
    copy.sort((a, b) => {
      const av = a[sortKey as keyof Order] ?? "";
      const bv = b[sortKey as keyof Order] ?? "";
      const cmp = Number(av > bv) - Number(av < bv);
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDirection]);

  const paged = demoState === "empty" ? [] : sorted.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<Order>[] = [
    { key: "id", header: "Order ID", sortable: true, accessor: (r) => `#${r.id}` },
    { key: "customer", header: "Customer", sortable: true, accessor: (r) => r.customer },
    { key: "amount", header: "Amount", sortable: true, align: "right", accessor: (r) => `$${r.amount.toFixed(2)}` },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <TextBadge status={STATUS_BADGE[r.status] ?? "error"} label={r.status} />
      ),
    },
    {
      key: "shipDate",
      header: "Ship date",
      render: (r) => (
        // Stop the click from bubbling to the row's own onRowClick below.
        <div // NOSONAR - wrapper only forwards pointer/keyboard events for its popup; it is deliberately non-semantic
          role="presentation" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <TableDatePicker value={r.shipDate} onChange={(date) => updateShipDate(r.id, date)} />
        </div>
      ),
    },
  ];

  return (
    <PreviewPage title="Table" description="Sortable columns, row click handling, loading/empty states, and built-in pagination — wired up as a real toolbar + table, not an isolated snippet.">
      <PreviewSection title="Orders">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by customer or order #"
            width={260}
          />
          <div className="flex items-center gap-2">
            <RefreshRoundedButton
              size="sm"
              onClick={() => {
                setSearch("");
                setDemoState("data");
                showInfoToast("Refreshed", "Order list reloaded.");
              }}
            />
            <PlusTextButton label="New Order" size="sm" />
          </div>
        </div>

        <div className="mb-3 flex gap-2 text-xs">
          <button onClick={() => setDemoState("data")} className="text-slate-400 underline-offset-2 hover:text-brand-600 hover:underline dark:hover:text-brand-400">
            Show data
          </button>
          <span className="text-slate-300">·</span>
          <button onClick={() => setDemoState("loading")} className="text-slate-400 underline-offset-2 hover:text-brand-600 hover:underline dark:hover:text-brand-400">
            Show loading state
          </button>
          <span className="text-slate-300">·</span>
          <button onClick={() => setDemoState("empty")} className="text-slate-400 underline-offset-2 hover:text-brand-600 hover:underline dark:hover:text-brand-400">
            Show empty state
          </button>
        </div>

        <Table
          columns={columns}
          data={paged}
          rowKey={(r) => r.id}
          loading={demoState === "loading"}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortChange={(key) => {
            if (key === sortKey) {
              setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
            } else {
              setSortKey(key);
              setSortDirection("asc");
            }
          }}
          onRowClick={(row) => showInfoToast(`Order #${row.id}`, `${row.customer} — $${row.amount.toFixed(2)}`)}
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

        <ComponentApi
          importCode={'import { Table, type Column } from "../components/table/Table";'}
          props={[
            { name: "columns", type: "Column<T>[]", description: "{ key, header, accessor?, render?, sortable?, align?, width? }[]" },
            { name: "data", type: "T[]", description: "Already-paginated/sorted rows for the current page." },
            { name: "rowKey", type: "(row: T, index: number) => string | number", description: "React key + used for click identification." },
            { name: "loading", type: "boolean", description: "Shows a centered Loader in place of rows." },
            { name: "onRowClick", type: "(row: T) => void", description: "Makes rows clickable/hoverable." },
            { name: "sortKey / sortDirection / onSortChange", type: "—", description: "Controlled sorting — the table doesn't sort data itself." },
            { name: "pagination", type: "PaginationProps", description: "{ page, pageSize, total, onPageChange, onPageSizeChange? } — omit to disable pagination." },
          ]}
        />

        <ComponentApi
          importCode={'import { TableDatePicker } from "../components/table/TableDatePicker";'}
          props={[
            { name: "value / onChange", type: "Date | null / (date: Date | null) => void", description: "Same contract as DatePicker — this is a DatePicker preset." },
            { name: "(behavior)", type: "—", description: 'Renders with no label, dense trigger padding, and portal={true} so the calendar panel escapes the table\'s "Ship date" cell instead of being clipped by the horizontal scroll container — remember to stopPropagation() in the cell if the row itself has onRowClick.' },
            { name: "...rest", type: "DatePickerProps", description: "minDate/maxDate/displayFormat/error/etc. all pass through — only label, helperText, portal, dense and style are fixed by the preset." },
          ]}
        />
      </PreviewSection>
    </PreviewPage>
  );
}
