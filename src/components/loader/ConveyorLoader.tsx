import { Package2 } from "lucide-react";
import { cn } from "../../lib/cn";

const SIZE = {
  sm: { track: "h-8 w-28", box: "h-4 w-4", label: "text-xs" },
  md: { track: "h-10 w-40", box: "h-5 w-5", label: "text-sm" },
  lg: { track: "h-14 w-56", box: "h-7 w-7", label: "text-base" },
} as const;

export interface ConveyorLoaderProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Boxes riding a conveyor belt, looping endlessly — a themed loader for warehouse/pick-pack
 * contexts (order fulfillment, inventory sync). Sibling to `SupplyChainLoader`; prefer this
 * one for a tighter/wider strip (e.g. inside a Card header) instead of the truck's fixed box.
 */
export function ConveyorLoader({ label = "Processing...", size = "md", className }: Readonly<ConveyorLoaderProps>) {
  const s = SIZE[size];
  return (
    <output className={cn("flex flex-col items-center gap-3", className)} aria-live="polite">
      <div className={cn("relative overflow-hidden rounded-md", s.track)}>
        <div className="absolute inset-x-0 bottom-1 flex w-[200%] animate-conveyor-move items-center gap-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Package2 key={i} className={cn("shrink-0 text-brand-500 dark:text-brand-400", s.box)} />
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 animate-conveyor-belt rounded-full bg-[repeating-linear-gradient(90deg,var(--brand-600)_0,var(--brand-600)_6px,transparent_6px,transparent_10px)] opacity-70" />
      </div>
      {label && <p className={cn("font-medium text-slate-600 dark:text-slate-300", s.label)}>{label}</p>}
    </output>
  );
}
