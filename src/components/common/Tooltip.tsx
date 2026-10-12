import { useId, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: TooltipPlacement;
  className?: string;
}

const placementClass: Record<TooltipPlacement, string> = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
};

/**
 * Hover/focus label for icon-only buttons and truncated text. Shows on both mouse hover
 * and keyboard focus so it stays usable without a pointer. Not portaled — fine for the
 * common case (toolbar icons, table cell labels); a trigger near a clipping edge (a
 * scrollable panel, a modal boundary) may need the panel repositioned via `className`.
 */
export function Tooltip({ content, children, placement = "top", className }: Readonly<TooltipProps>) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span // NOSONAR - wrapper only tracks hover/focus to show its popup; it is not an interactive control itself
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined} className="inline-flex">
        {children}
      </span>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-[120] animate-fade-in whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-elevated dark:bg-slate-700",
            placementClass[placement],
            className
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
