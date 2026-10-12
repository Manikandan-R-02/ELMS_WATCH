import { forwardRef, useId, type CSSProperties, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { FieldShell, fieldBaseClass, fieldBorderClass } from "./FieldShell";

export interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
  showCharCount?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /**
   * "inline" (default) floats the icon transparently inside the field, flush with the text.
   * "addon" sets it in its own bordered, tinted box attached to the field — a more prominent,
   * segmented look for a unit/currency prefix or a clearly-actionable trailing icon.
   */
  iconVariant?: "inline" | "addon";
  containerClassName?: string;
  /** Inline style applied to the outer field wrapper (label + input + helper text) — use `style` for the input itself. */
  containerStyle?: CSSProperties;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      error,
      helperText,
      maxLength,
      showCharCount = !!maxLength,
      leadingIcon,
      trailingIcon,
      iconVariant = "inline",
      className,
      containerClassName,
      containerStyle,
      id,
      value,
      disabled,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const currentLength = typeof value === "string" ? value.length : 0;

    const charCount = maxLength && showCharCount ? { current: currentLength, max: maxLength } : undefined;

    if (iconVariant === "addon" && (leadingIcon || trailingIcon)) {
      return (
        <FieldShell
          label={label}
          htmlFor={inputId}
          required={props.required}
          error={error}
          helperText={helperText}
          charCount={charCount}
          className={containerClassName}
          style={containerStyle}
        >
          <div
            className={cn(
              "flex w-full overflow-hidden rounded-lg border shadow-sm transition",
              fieldBorderClass(error),
              "focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20",
              disabled && "cursor-not-allowed bg-slate-100 dark:bg-slate-800"
            )}
          >
            {leadingIcon && (
              <span className="flex shrink-0 items-center border-r border-slate-200 bg-slate-50 px-3 text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                {leadingIcon}
              </span>
            )}
            <input
              ref={ref}
              id={inputId}
              value={value}
              maxLength={maxLength}
              disabled={disabled}
              className={cn(
                "w-full bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400",
                "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
                "dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800",
                className
              )}
              {...props}
            />
            {trailingIcon && (
              <span className="flex shrink-0 items-center border-l border-slate-200 bg-slate-50 px-3 text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                {trailingIcon}
              </span>
            )}
          </div>
        </FieldShell>
      );
    }

    return (
      <FieldShell
        label={label}
        htmlFor={inputId}
        required={props.required}
        error={error}
        helperText={helperText}
        charCount={charCount}
        className={containerClassName}
        style={containerStyle}
      >
        <div className="relative">
          {leadingIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            value={value}
            maxLength={maxLength}
            disabled={disabled}
            className={cn(
              fieldBaseClass,
              fieldBorderClass(error),
              leadingIcon && "pl-9",
              trailingIcon && "pr-9",
              className
            )}
            {...props}
          />
          {trailingIcon && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              {trailingIcon}
            </span>
          )}
        </div>
      </FieldShell>
    );
  }
);
TextInput.displayName = "TextInput";
