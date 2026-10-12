import { forwardRef, useId, type CSSProperties, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { FieldShell, fieldBorderClass } from "./FieldShell";

export interface FloatingInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "placeholder"> {
  /** Sits inside the field and floats up into the border on focus or once filled — this replaces `placeholder`, it doesn't take one. */
  label: string;
  error?: string;
  helperText?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  containerClassName?: string;
  /** Inline style applied to the outer field wrapper — use `style` for the input itself. */
  containerStyle?: CSSProperties;
}

/**
 * Text input with a Material-style "notched outline" floating label: empty and
 * unfocused, the label sits centered like a placeholder; focused or filled, it
 * floats up and breaks the border, Material-outlined-style.
 *
 * The border gap is a real `<fieldset>`/`<legend>` — browsers already render a
 * gap in a fieldset's border around its legend for free, so the notch needs no
 * JS text-width measurement. The legend holds an invisible copy of the label
 * (sized to match) and its `max-width` animates 0 → auto to open/close the gap;
 * the visible label is a separately-positioned `<label>` on top of it. Both key
 * off `group-has-[:not(:placeholder-shown)]` / `group-focus-within`, so a single
 * `group` wrapper drives everything without needing the input to be a direct
 * sibling of anything.
 */
export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, error, helperText, leadingIcon, trailingIcon, className, containerClassName, containerStyle, id, required, disabled, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;

    return (
      <FieldShell error={error} helperText={helperText} className={containerClassName} style={containerStyle}>
        <div className="group relative">
          {leadingIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3 text-slate-400">
              {leadingIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            placeholder=" "
            required={required}
            disabled={disabled}
            className={cn(
              "relative z-10 w-full rounded-lg bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none transition",
              "disabled:cursor-not-allowed disabled:text-slate-400 dark:text-slate-100 dark:disabled:text-slate-500",
              leadingIcon && "pl-9",
              trailingIcon && "pr-9",
              className
            )}
            {...props}
          />

          {/* Notched outline */}
          <fieldset
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 m-0 min-w-0 rounded-lg border px-2 transition-colors",
              fieldBorderClass(error),
              "group-focus-within:border-brand-500",
              disabled && "bg-slate-100 dark:bg-slate-800"
            )}
          >
            <legend
              className={cn(
                "ml-1 max-w-0 overflow-hidden whitespace-nowrap px-0 text-xs transition-[max-width,padding] duration-150",
                "group-focus-within:max-w-full group-focus-within:px-1",
                "group-has-[:not(:placeholder-shown)]:max-w-full group-has-[:not(:placeholder-shown)]:px-1"
              )}
            >
              <span className="invisible">
                {label}
                {required && "*"}
              </span>
            </legend>
          </fieldset>

          {/* Visible label — floats to sit on the notch above; centered like a placeholder when empty and unfocused. */}
          <label
            htmlFor={inputId}
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm text-slate-400 transition-all",
              "group-focus-within:top-0 group-focus-within:text-xs group-focus-within:text-brand-600",
              "group-has-[:not(:placeholder-shown)]:top-0 group-has-[:not(:placeholder-shown)]:text-xs group-has-[:not(:placeholder-shown)]:text-slate-500",
              disabled && "cursor-not-allowed",
              "dark:text-slate-500 dark:group-focus-within:text-brand-400 dark:group-has-[:not(:placeholder-shown)]:text-slate-400",
              leadingIcon && "left-9"
            )}
          >
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>

          {trailingIcon && (
            <span className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center pr-3 text-slate-400">
              {trailingIcon}
            </span>
          )}
        </div>
      </FieldShell>
    );
  }
);
FloatingInput.displayName = "FloatingInput";
