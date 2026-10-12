import { useEffect, useMemo, useState } from "react";
import type { SortDirection } from "../components/table/Table";

/**
 * Shared client-side sort + paginate behavior for a report-style table (search filtering is
 * applied by the caller before this hook — each table searches a different set of fields, this
 * only handles the sort/page slice that's otherwise identical across screens). See
 * LocationSummaryPage/SummaryTable.tsx and OverallSummaryPage for reference usage.
 */
export function useSortedPaged<T>(
  rows: T[],
  getSortValue: (row: T, key: string) => string | number,
  defaultPageSize = 10,
  initialSort?: { key: string; direction: SortDirection }
) {
  const [sortKey, setSortKey] = useState<string | null>(initialSort?.key ?? null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSort?.direction ?? null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return rows;
    return [...rows].sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDirection === "asc" ? cmp : -cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sortKey, sortDirection]);

  // A new filtered/searched row count means the current page may no longer exist.
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length]);

  const start = (page - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);

  function onSortChange(key: string) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortKey(null);
      setSortDirection(null);
    }
    setPage(1);
  }

  return {
    rows: paged,
    sortKey,
    sortDirection,
    onSortChange,
    pagination: {
      page,
      pageSize,
      total: rows.length,
      onPageChange: setPage,
      onPageSizeChange: (size: number) => {
        setPageSize(size);
        setPage(1);
      },
    },
  };
}
