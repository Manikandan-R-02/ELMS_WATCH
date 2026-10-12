import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "../../lib/cn";
import { FieldShell } from "./FieldShell";

const boxBaseClass = cn(
  "flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded border transition",
  "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/30 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-white dark:peer-focus-visible:ring-offset-slate-900",
  "peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
);

function boxToneClass(checked: boolean, hasError?: boolean) {
  if (checked) return "border-brand-600 bg-brand-600";
  return hasError ? "border-red-400 dark:border-red-500/60" : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900";
}

export interface CheckboxOptionProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  indeterminate?: boolean;
  disabled?: boolean;
  hasError?: boolean;
  name?: string;
  id?: string;
}

/** Bare checkbox + label row, shared by the standalone `Checkbox` and `CheckboxGroup`'s items. */
export function CheckboxOption({
  checked,
  onChange,
  label,
  description,
  indeterminate,
  disabled,
  hasError,
  name,
  id,
}: Readonly<CheckboxOptionProps>) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate && !checked;
  }, [indeterminate, checked]);

  return (
    <label className={cn("flex items-start gap-2.5", disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer")}>
      <span className="relative mt-0.5 flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center">
        <input
          ref={ref}
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span className={cn(boxBaseClass, boxToneClass(checked, hasError))}>
          {checked && !indeterminate && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
          {indeterminate && !checked && <Minus className="h-3 w-3 text-white" strokeWidth={3} />}
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

export interface CheckboxProps {
  label?: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  name?: string;
  containerClassName?: string;
  /** Inline style applied to the outer wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
}

/** Single standalone checkbox — for a list of checkboxes bound to one array value, use `CheckboxGroup`. */
export function Checkbox({
  label,
  description,
  checked,
  onChange,
  indeterminate,
  disabled,
  required,
  error,
  helperText,
  name,
  containerClassName,
  style,
}: Readonly<CheckboxProps>) {
  const autoId = useId();

  return (
    <FieldShell error={error} helperText={helperText} className={containerClassName} style={style}>
      <CheckboxOption
        id={autoId}
        name={name}
        checked={checked}
        onChange={onChange}
        indeterminate={indeterminate}
        disabled={disabled}
        hasError={!!error}
        label={
          label ? (
            <>
              {label}
              {required && <span className="ml-0.5 text-red-500">*</span>}
            </>
          ) : undefined
        }
        description={description}
      />
    </FieldShell>
  );
}

export interface CheckboxGroupOption<T = string> {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
}

export interface CheckboxGroupProps<T = string> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  options: CheckboxGroupOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  /** Stack items in a column (default) or wrap them in a row. */
  orientation?: "vertical" | "horizontal";
  containerClassName?: string;
  /** Inline style applied to the outer wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
}

/** A set of checkboxes bound to one `T[]` value — same field contract (label/error/helperText) as every other field. */
export function CheckboxGroup<T = string>({
  label,
  error,
  helperText,
  required,
  disabled,
  options,
  value,
  onChange,
  orientation = "vertical",
  containerClassName,
  style,
}: Readonly<CheckboxGroupProps<T>>) {
  function toggle(option: CheckboxGroupOption<T>, next: boolean) {
    onChange(next ? [...value, option.value] : value.filter((v) => v !== option.value));
  }

  return (
    <FieldShell label={label} required={required} error={error} helperText={helperText} className={containerClassName} style={style}>
      <div className={cn("flex gap-x-5 gap-y-2.5", orientation === "horizontal" ? "flex-row flex-wrap" : "flex-col")}>
        {options.map((option) => (
          <CheckboxOption
            key={String(option.value)}
            checked={value.includes(option.value)}
            onChange={(checked) => toggle(option, checked)}
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
