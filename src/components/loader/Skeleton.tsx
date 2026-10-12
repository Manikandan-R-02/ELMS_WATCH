import type { CSSProperties } from "react";
import { cn } from "../../lib/cn";

const variantClass = {
  text: "h-3 w-full rounded-md",
  rect: "h-24 w-full rounded-lg",
  circle: "h-10 w-10 rounded-full",
};

export interface SkeletonProps {
  variant?: keyof typeof variantClass;
  /** Stacked placeholder lines — only used when variant="text". The last line renders shorter, like a paragraph's ragged edge. */
  lines?: number;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
}

/** Content-shaped loading placeholder — use in place of a spinner while a card, list, or table row's real data is still loading. */
export function Skeleton({ variant = "text", lines = 1, width, height, className, style }: Readonly<SkeletonProps>) {
  if (variant === "text" && lines > 1) {
    return (
      <output className="flex flex-col gap-2" aria-label="Loading">
        {Array.from({ length: lines }, (_, i) => `line-${i}`).map((lineId, i) => (
          <span
            key={lineId}
            className={cn("block animate-pulse rounded-md bg-slate-200 dark:bg-slate-800", variantClass.text, i === lines - 1 && "w-2/3", className)}
            style={i === lines - 1 ? { height: style?.height ?? height } : { ...style, width, height }}
          />
        ))}
      </output>
    );
  }

  return (
    <output
      aria-label="Loading"
      className={cn("block animate-pulse bg-slate-200 dark:bg-slate-800", variantClass[variant], className)}
      style={{ width, height, ...style }}
    />
  );
}
