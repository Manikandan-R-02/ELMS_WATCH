import { Link, useLocation } from "react-router-dom";
import { ChevronRight, LayoutDashboard } from "lucide-react";
import { navItems } from "../sidebar/navItems";
import { ROUTES } from "../../routes/paths";
import { useBreadcrumbActionsStore } from "../../store/breadcrumbActionsStore";

/** Auto-derived from the current route against navItems — no per-page wiring needed. Every screen reads
 * "Overall Summary › <screen>" (Overall Summary is the app's landing page, so it is the root), with the current
 * screen shown as a highlighted pill carrying its own menu icon; on Overall Summary itself there is only the
 * one crumb. A page can slot its own controls into the right side of this same row via
 * `breadcrumbActionsStore` (see that file) — e.g. a search field pinned to the top-right corner. */
export function Breadcrumbs() {
  const { pathname } = useLocation();
  const current = navItems.find((item) => item.path === pathname);
  const actions = useBreadcrumbActionsStore((s) => s.actions);

  if (!current || pathname === "/") return null;

  const root = navItems.find((item) => item.path === ROUTES.overallSummary);
  const isRoot = current.path === ROUTES.overallSummary;
  const RootIcon = root?.icon ?? LayoutDashboard;
  const CurrentIcon = current.icon;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Breadcrumb" className="min-w-0 max-w-full">
        <ol className="flex min-w-0 items-center gap-1 text-xs sm:text-sm">
          {!isRoot && (
            <>
              <li className="shrink-0">
                <Link
                  to={ROUTES.overallSummary}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-slate-500 transition hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
                >
                  <RootIcon className="h-3.5 w-3.5" />
                  {root?.label ?? "Overall Summary"}
                </Link>
              </li>
              <li aria-hidden="true" className="shrink-0">
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
              </li>
            </>
          )}
          <li className="min-w-0">
            <span
              aria-current="page"
              className="flex min-w-0 items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-700 ring-1 ring-brand-100 dark:bg-brand-500/15 dark:text-brand-200 dark:ring-brand-500/20"
            >
              <CurrentIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{current.label}</span>
            </span>
          </li>
        </ol>
      </nav>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
