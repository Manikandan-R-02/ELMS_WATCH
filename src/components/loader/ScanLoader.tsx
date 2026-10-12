import { PackageSearch } from "lucide-react";
import { cn } from "../../lib/cn";

const SIZE = {
  sm: { box: "h-10 w-10", icon: "h-6 w-6", label: "text-xs" },
  md: { box: "h-14 w-14", icon: "h-8 w-8", label: "text-sm" },
  lg: { box: "h-20 w-20", icon: "h-11 w-11", label: "text-base" },
} as const;

export interface ScanLoaderProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * A scan line sweeping up/down over a package icon — themed loader for barcode/inventory
 * scanning contexts (goods receipt, stock check). Sibling to `SupplyChainLoader`/`ConveyorLoader`;
 * the most compact of the three, good for an inline empty-state or a modal body.
 */
export function ScanLoader({ label = "Scanning...", size = "md", className }: Readonly<ScanLoaderProps>) {
  const s = SIZE[size];
  return (
    <output className={cn("flex flex-col items-center gap-3", className)} aria-live="polite">
      <div className={cn("relative flex items-center justify-center overflow-hidden rounded-lg border border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10", s.box)}>
        <PackageSearch className={cn("text-brand-500 dark:text-brand-400", s.icon)} />
        <div className="absolute inset-x-0 h-0.5 animate-scan-sweep bg-brand-500 shadow-[0_0_6px_var(--brand-500)] dark:bg-brand-400" />
      </div>
      {label && <p className={cn("font-medium text-slate-600 dark:text-slate-300", s.label)}>{label}</p>}
    </output>
  );
}
