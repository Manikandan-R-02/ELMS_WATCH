import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "../../lib/cn";
import { SelectSearch } from "../fields/SelectSearch";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
}: Readonly<PaginationProps>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages = getPageWindow(page, totalPages);
  const pageItems = pages.map((p, idx) => {
    if (p !== "...") return { p, id: `page-${p}` };
    return { p, id: idx < pages.length / 2 ? "dots-start" : "dots-end" };
  });

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm sm:flex-row dark:border-slate-800">
      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
        <span>
          Showing <span className="font-medium text-slate-700 dark:text-slate-200">{from}</span>
          {"–"}
          <span className="font-medium text-slate-700 dark:text-slate-200">{to}</span> of{" "}
          <span className="font-medium text-slate-700 dark:text-slate-200">{total}</span>
        </span>
        {onPageSizeChange && (
          <SelectSearch
            options={pageSizeOptions.map((n) => ({ label: `${n} / page`, value: n }))}
            value={pageSize}
            onChange={(size) => size !== null && onPageSizeChange(size)}
            searchable={false}
            clearable={false}
            portal
            containerClassName="w-28"
          />
        )}
      </div>

      <div className="flex items-center gap-1">
        <PageBtn onClick={() => onPageChange(1)} disabled={page === 1} label="First page">
          <ChevronsLeft className="h-4 w-4" />
        </PageBtn>
        <PageBtn onClick={() => onPageChange(page - 1)} disabled={page === 1} label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </PageBtn>
        {pageItems.map(({ p, id }) =>
          p === "..." ? (
            <span key={id} className="px-2 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                "h-8 min-w-8 rounded-md px-2 text-sm font-medium transition",
                p === page
                  ? "bg-gradient-to-r from-brand-800 to-brand-600 text-white shadow-soft dark:from-brand-600 dark:to-brand-400"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              {p}
            </button>
          )
        )}
        <PageBtn onClick={() => onPageChange(page + 1)} disabled={page === totalPages} label="Next page">
          <ChevronRight className="h-4 w-4" />
        </PageBtn>
        <PageBtn onClick={() => onPageChange(totalPages)} disabled={page === totalPages} label="Last page">
          <ChevronsRight className="h-4 w-4" />
        </PageBtn>
      </div>
    </div>
  );
}

function PageBtn({
  onClick,
  disabled,
  label,
  children,
}: Readonly<{
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
    >
      {children}
    </button>
  );
}

function getPageWindow(page: number, totalPages: number): (number | "...")[] {
  const delta = 1;
  const range: (number | "...")[] = [];
  const start = Math.max(2, page - delta);
  const end = Math.min(totalPages - 1, page + delta);

  range.push(1);
  if (start > 2) range.push("...");
  for (let i = start; i <= end; i++) range.push(i);
  if (end < totalPages - 1) range.push("...");
  if (totalPages > 1) range.push(totalPages);

  return range;
}
