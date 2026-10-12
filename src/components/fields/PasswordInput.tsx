import { forwardRef, useId, useMemo, useState, type CSSProperties, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/cn";
import { FieldShell, fieldBaseClass, fieldBorderClass } from "./FieldShell";

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label?: string;
  error?: string;
  helperText?: string;
  /** Shows a live weak/fair/good/strong meter under the field. Default true. */
  showStrength?: boolean;
  /** Optional inline leading icon (e.g. a lock) — same convention as TextInput's `leadingIcon`. */
  leadingIcon?: ReactNode;
  containerClassName?: string;
  /** Inline style applied to the outer field wrapper — use `style` for the input itself. */
  containerStyle?: CSSProperties;
}

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function scorePassword(value: string): StrengthLevel {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return Math.min(4, score) as StrengthLevel;
}

const STRENGTH_META: Record<StrengthLevel, { label: string; barClass: string; textClass: string }> = {
  0: { label: "Too short", barClass: "bg-slate-200 dark:bg-slate-700", textClass: "text-slate-400" },
  1: { label: "Weak", barClass: "bg-red-500", textClass: "text-red-500" },
  2: { label: "Fair", barClass: "bg-yellow-500", textClass: "text-yellow-600 dark:text-yellow-400" },
  3: { label: "Good", barClass: "bg-brand-500", textClass: "text-brand-600 dark:text-brand-400" },
  4: { label: "Strong", barClass: "bg-emerald-500", textClass: "text-emerald-600 dark:text-emerald-400" },
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      label,
      error,
      helperText,
      showStrength = true,
      leadingIcon,
      className,
      containerClassName,
      containerStyle,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = useState(false);
    const autoId = useId();
    const inputId = id ?? autoId;
    const strValue = typeof value === "string" ? value : "";
    const strength = useMemo(() => scorePassword(strValue), [strValue]);
    const meta = STRENGTH_META[strength];

    return (
      <FieldShell
        label={label}
        htmlFor={inputId}
        required={props.required}
        error={error}
        helperText={helperText}
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
            type={visible ? "text" : "password"}
            value={value}
            className={cn(fieldBaseClass, fieldBorderClass(error), "pr-10", leadingIcon && "pl-9", className)}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {showStrength && strValue.length > 0 && (
          <div className="mt-1.5">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn("h-1 flex-1 rounded-full bg-slate-200 dark:bg-slate-700", i < strength && meta.barClass)}
                />
              ))}
            </div>
            <p className={cn("mt-1 text-xs font-medium", meta.textClass)}>{meta.label}</p>
          </div>
        )}
      </FieldShell>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
