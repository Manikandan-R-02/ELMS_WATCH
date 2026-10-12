import { useId, type CSSProperties, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { FieldShell } from "./FieldShell";

const SIZE_META = {
  sm: { track: "h-4 w-7", thumb: "h-3 w-3", translate: "translate-x-3" },
  md: { track: "h-5 w-9", thumb: "h-4 w-4", translate: "translate-x-4" },
} as const;

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  /** Put the label before the track (default) or after it. */
  labelPosition?: "start" | "end";
  size?: "sm" | "md";
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  name?: string;
  containerClassName?: string;
  /** Inline style applied to the outer wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
}

/** Boolean on/off toggle — for a field that takes effect immediately (settings, feature flags), unlike `Checkbox` which usually gates a form submission. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  labelPosition = "start",
  size = "md",
  disabled,
  required,
  error,
  helperText,
  name,
  containerClassName,
  style,
}: Readonly<SwitchProps>) {
  const autoId = useId();
  const meta = SIZE_META[size];

  const track = (
    <span className="relative inline-flex shrink-0">
      <input
        id={autoId}
        name={name}
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <span
        className={cn(
          meta.track,
          "flex items-center rounded-full border transition-colors",
          checked ? "border-brand-600 bg-brand-600" : "border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-700",
          error && !checked && "border-red-400 dark:border-red-500/60",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/30 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-white dark:peer-focus-visible:ring-offset-slate-900",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        )}
      >
        <span
          className={cn(
            meta.thumb,
            "ml-0.5 rounded-full bg-white shadow-sm transition-transform",
            checked && meta.translate
          )}
        />
      </span>
    </span>
  );

  const labelNode = (label || description) && (
    <label htmlFor={autoId} className={cn("text-sm text-slate-700 dark:text-slate-200", disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer")}>
      {label}
      {required && <span className="ml-0.5 text-red-500">*</span>}
      {description && <span className="block text-xs text-slate-400 dark:text-slate-500">{description}</span>}
    </label>
  );

  return (
    <FieldShell error={error} helperText={helperText} className={containerClassName} style={style}>
      <span className={cn("inline-flex items-start gap-2.5", labelPosition === "end" && "flex-row-reverse justify-end")}>
        {track}
        {labelNode}
      </span>
    </FieldShell>
  );
}
