import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../lib/cn";

interface FieldShellProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  charCount?: { current: number; max: number };
  className?: string;
  /** Inline style applied to the outer wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
  children: ReactNode;
}

export function FieldShell({
  label,
  htmlFor,
  required,
  error,
  helperText,
  charCount,
  className,
  style,
  children,
}: Readonly<FieldShellProps>) {
  const nearLimit = charCount && charCount.max - charCount.current <= 10;
  const overLimit = charCount && charCount.current > charCount.max;

  return (
    <div className={cn("flex flex-col gap-1.5", className)} style={style}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={htmlFor}
            className="text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          {charCount && (
            <span
              className={cn(
                "text-xs tabular-nums text-slate-400 dark:text-slate-500",
                nearLimit && "text-amber-500 dark:text-amber-400",
                overLimit && "text-red-500 dark:text-red-400"
              )}
            >
              {charCount.current}/{charCount.max}
            </span>
          )}
        </div>
      )}
      {children}
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-400 dark:text-slate-500">{helperText}</p>}
    </div>
  );
}

export const fieldBaseClass = cn(
  "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400",
  "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
  "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
  "dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800"
);

/** Border colour of a field: red while it shows an error message, neutral otherwise. */
export function fieldBorderClass(error?: string) {
  return error
    ? "border-red-400 dark:border-red-500/60"
    : "border-slate-200 dark:border-slate-700";
}
