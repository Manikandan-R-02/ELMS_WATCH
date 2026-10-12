import type { LucideIcon } from "lucide-react";

/** An icon + text column header — pair with `Table`'s `Column.header` (any `ReactNode`) instead
 * of a plain string, for a report-style table where every column carries a small glyph. */
export function HeaderLabel({ icon: Icon, label }: Readonly<{ icon: LucideIcon; label: string }>) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="h-3 w-3 shrink-0 opacity-80" />
      {label}
    </span>
  );
}
