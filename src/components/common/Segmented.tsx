import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

/** A compact, pill-style toggle row — for a small set of mutually-exclusive view/range options
 * (e.g. "3/6/9/12 months", "Contract/Segment/Operation Manager"). Replaces a plain radio-button
 * row with something more enterprise-looking; see LocationSummaryPage/OverallSummaryPage for
 * reference usage. An option's `icon` is optional — pass it for a chart-type/view switcher
 * (see ChartCards.tsx's `ComparisonChartCard`) where a glyph reads faster than text alone;
 * omit it for a plain text toggle like the existing range pickers. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: Readonly<{
  options: { label: string; value: T; icon?: LucideIcon }[];
  value: T;
  onChange: (v: T) => void;
}>) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
            opt.value === value
              ? "bg-white text-brand-700 shadow-soft dark:bg-slate-700 dark:text-brand-300"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          {opt.icon && <opt.icon className="h-3.5 w-3.5 shrink-0" />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
