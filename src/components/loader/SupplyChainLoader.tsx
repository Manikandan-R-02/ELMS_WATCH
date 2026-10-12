import { Package, Truck } from "lucide-react";
import { cn } from "../../lib/cn";

const SIZE = {
  sm: { box: "h-10 w-24", truck: "h-7 w-7", crate: "h-3 w-3 -translate-x-6", label: "text-xs" },
  md: { box: "h-14 w-32", truck: "h-9 w-9", crate: "h-4 w-4 -translate-x-8", label: "text-sm" },
  lg: { box: "h-20 w-44", truck: "h-12 w-12", crate: "h-5 w-5 -translate-x-11", label: "text-base" },
} as const;

export interface SupplyChainLoaderProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Project-themed loading indicator (a truck driving a dashed route, crate bobbing
 * ahead of it) — a sibling of the app's default `LocationLoader`, not currently wired into
 * `GlobalLoader`. Prefer this over a generic spinner anywhere the loading state represents
 * "fetching/syncing SCM data" specifically. See `ConveyorLoader` / `ScanLoader` for sibling
 * themed loaders sized for tighter spaces.
 */
export function SupplyChainLoader({ label = "Loading supply chain data...", size = "md", className }: Readonly<SupplyChainLoaderProps>) {
  const s = SIZE[size];
  return (
    <output className={cn("flex flex-col items-center gap-4", className)} aria-live="polite">
      <div className={cn("relative flex items-end justify-center", s.box)}>
        <Package className={cn("absolute -top-1 left-1/2 animate-crate-bob text-brand-400 dark:text-brand-500", s.crate)} />
        <Truck className={cn("relative z-10 animate-truck-drive text-brand-600 dark:text-brand-400", s.truck)} />
        <div
          className="absolute bottom-0 h-[3px] w-full animate-road-move rounded-full bg-[repeating-linear-gradient(90deg,var(--brand-300)_0,var(--brand-300)_10px,transparent_10px,transparent_18px)] dark:bg-[repeating-linear-gradient(90deg,var(--brand-700)_0,var(--brand-700)_10px,transparent_10px,transparent_18px)]"
        />
      </div>
      {label && <p className={cn("font-medium text-slate-600 dark:text-slate-300", s.label)}>{label}</p>}
    </output>
  );
}
