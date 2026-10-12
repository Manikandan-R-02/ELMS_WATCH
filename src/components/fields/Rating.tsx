import { memo, useId, useState, type CSSProperties } from "react";
import { Star } from "lucide-react";
import { cn } from "../../lib/cn";
import { FieldShell } from "./FieldShell";

const SIZE_CLASS = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" } as const;

export interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  /** Allow selecting half-star increments (0.5, 1, 1.5, ...). Default false. */
  allowHalf?: boolean;
  /** View-only — hides hover feedback and ignores clicks. Set when there's no `onChange`. */
  readOnly?: boolean;
  disabled?: boolean;
  label?: string;
  error?: string;
  helperText?: string;
  /** Show the numeric value (e.g. "4.5/5") next to the stars. Default false. */
  showValue?: boolean;
  containerClassName?: string;
  /** Inline style applied to the outer wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
}

const Stars = memo(function Stars({
  value,
  hoverValue,
  max,
  size,
  allowHalf,
  interactive,
  onHover,
  onLeave,
  onPick,
  name,
}: {
  value: number;
  hoverValue: number | null;
  max: number;
  size: "sm" | "md" | "lg";
  allowHalf: boolean;
  interactive: boolean;
  onHover: (v: number) => void;
  onLeave: () => void;
  onPick: (v: number) => void;
  name: string;
}) {
  const display = hoverValue ?? value;
  const sizeClass = SIZE_CLASS[size];

  return (
    <fieldset aria-label={name} className="m-0 inline-flex min-w-0 items-center gap-0.5 border-0 p-0" onMouseLeave={interactive ? onLeave : undefined}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
        const fillPct = Math.max(0, Math.min(1, display - (star - 1))) * 100;
        return (
          <span key={star} className="relative inline-flex">
            <Star className={cn(sizeClass, "text-slate-200 dark:text-slate-700")} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPct}%` }}>
              <Star className={cn(sizeClass, "text-amber-400")} fill="currentColor" strokeWidth={0} />
            </span>
            {interactive && (
              <>
                {allowHalf && (
                  <button
                    type="button"
                    aria-label={`Rate ${star - 0.5} out of ${max}, ${name}`}
                    className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
                    onMouseEnter={() => onHover(star - 0.5)}
                    onClick={() => onPick(star - 0.5)}
                  />
                )}
                <button
                  type="button"
                  aria-label={`Rate ${star} out of ${max}, ${name}`}
                  className={cn("absolute inset-y-0 cursor-pointer", allowHalf ? "left-1/2 w-1/2" : "inset-x-0")}
                  onMouseEnter={() => onHover(star)}
                  onClick={() => onPick(star)}
                />
              </>
            )}
          </span>
        );
      })}
    </fieldset>
  );
});

/** Star rating — interactive when `onChange` is passed, otherwise renders as a static display (e.g. a review summary, a table cell). */
export function Rating({
  value,
  onChange,
  max = 5,
  size = "md",
  allowHalf = false,
  readOnly = false,
  disabled = false,
  label,
  error,
  helperText,
  showValue = false,
  containerClassName,
  style,
}: Readonly<RatingProps>) {
  const autoId = useId();
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const interactive = !!onChange && !readOnly && !disabled;

  return (
    <FieldShell label={label} error={error} helperText={helperText} className={containerClassName} style={style}>
      <div className={cn("inline-flex items-center gap-2", disabled && "opacity-50")}>
        <Stars
          value={value}
          hoverValue={interactive ? hoverValue : null}
          max={max}
          size={size}
          allowHalf={allowHalf}
          interactive={interactive}
          onHover={setHoverValue}
          onLeave={() => setHoverValue(null)}
          onPick={(v) => onChange?.(v)}
          name={autoId}
        />
        {showValue && (
          <span className="text-sm font-medium tabular-nums text-slate-600 dark:text-slate-300">
            {value}/{max}
          </span>
        )}
      </div>
    </FieldShell>
  );
}
