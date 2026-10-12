import { useId, type CSSProperties, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { FieldShell } from "./FieldShell";

export interface RadioButtonProps {
  checked: boolean;
  onChange: () => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  hasError?: boolean;
  name: string;
  value?: string;
  id?: string;
}

/** Bare radio dot + label row. Reach for `RadioGroup` for the common "pick one of N" case — use this directly only for a custom, non-list layout that still needs to share a `name`. */
/** Ring colour of a radio circle: brand when selected, red on a validation error, neutral otherwise. */
function radioBorderTone(checked: boolean, hasError: boolean | undefined): string {
  if (checked) return "border-brand-600";
  return hasError ? "border-red-400 dark:border-red-500/60" : "border-slate-300 dark:border-slate-600";
}

export function RadioButton({ checked, onChange, label, description, disabled, hasError, name, value, id }: Readonly<RadioButtonProps>) {
  return (
    <label className={cn("flex items-start gap-2.5", disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer")}>
      <span className="relative mt-0.5 flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center">
        <input
          id={id}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={(e) => e.target.checked && onChange()}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span
          className={cn(
            "flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full border bg-white transition dark:bg-slate-900",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/30 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-white dark:peer-focus-visible:ring-offset-slate-900",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            radioBorderTone(checked, hasError)
          )}
        >
          {checked && <span className="h-2 w-2 rounded-full bg-brand-600" />}
        </span>
      </span>
      {(label || description) && (
        <span className="text-sm text-slate-700 dark:text-slate-200">
          {label}
          {description && <span className="block text-xs text-slate-400 dark:text-slate-500">{description}</span>}
        </span>
      )}
    </label>
  );
}

export interface RadioOption<T = string> {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps<T = string> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  options: RadioOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Shared `name` for the underlying radio inputs — auto-generated when omitted. */
  name?: string;
  /** Stack items in a column (default) or wrap them in a row. */
  orientation?: "vertical" | "horizontal";
  containerClassName?: string;
  /** Inline style applied to the outer wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
}

/** A set of mutually-exclusive radio buttons bound to one `T | null` value — same field contract (label/error/helperText) as every other field. */
export function RadioGroup<T = string>({
  label,
  error,
  helperText,
  required,
  disabled,
  options,
  value,
  onChange,
  name,
  orientation = "vertical",
  containerClassName,
  style,
}: Readonly<RadioGroupProps<T>>) {
  const autoId = useId();
  const groupName = name ?? autoId;

  return (
    <FieldShell label={label} required={required} error={error} helperText={helperText} className={containerClassName} style={style}>
      <div role="radiogroup" aria-label={label} className={cn("flex gap-x-5 gap-y-2.5", orientation === "horizontal" ? "flex-row flex-wrap" : "flex-col")}>
        {options.map((option) => (
          <RadioButton
            key={String(option.value)}
            name={groupName}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            label={option.label}
            description={option.description}
            disabled={disabled || option.disabled}
            hasError={!!error}
          />
        ))}
      </div>
    </FieldShell>
  );
}
