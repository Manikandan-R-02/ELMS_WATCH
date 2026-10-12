import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { useLayoutStore } from "../../store/layoutStore";

export type CardRounding =
  | "all"
  | "none"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

const roundingClass: Record<CardRounding, string> = {
  all: "rounded-[var(--app-radius)]",
  none: "rounded-none",
  top: "rounded-t-[var(--app-radius)]",
  bottom: "rounded-b-[var(--app-radius)]",
  left: "rounded-l-[var(--app-radius)]",
  right: "rounded-r-[var(--app-radius)]",
  "top-left": "rounded-tl-[var(--app-radius)]",
  "top-right": "rounded-tr-[var(--app-radius)]",
  "bottom-left": "rounded-bl-[var(--app-radius)]",
  "bottom-right": "rounded-br-[var(--app-radius)]",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  rounding?: CardRounding;
  padded?: boolean;
  hoverable?: boolean;
  /** Defaults to the appearance drawer's "Card Style" setting when omitted. */
  bordered?: boolean;
  /** Defaults to the appearance drawer's "Card Style" setting when omitted. */
  elevated?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}

export function Card({
  rounding = "all",
  padded = true,
  hoverable = false,
  bordered,
  elevated,
  header,
  footer,
  className,
  children,
  ...props
}: Readonly<CardProps>) {
  const cardStyle = useLayoutStore((s) => s.cardStyle);
  const resolvedBordered = bordered ?? cardStyle === "border";
  const resolvedElevated = elevated ?? cardStyle === "shadow";

  return (
    <div
      className={cn(
        "flex flex-col bg-white dark:bg-slate-900",
        roundingClass[rounding],
        resolvedBordered && "border border-slate-200 dark:border-slate-800",
        resolvedElevated && "shadow-soft",
        hoverable && "transition hover:-translate-y-0.5 hover:shadow-elevated",
        className
      )}
      {...props}
    >
      {header && (
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          {header}
        </div>
      )}
      <div className={cn(padded && "p-5", "flex-1")}>{children}</div>
      {footer && (
        <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          {footer}
        </div>
      )}
    </div>
  );
}
