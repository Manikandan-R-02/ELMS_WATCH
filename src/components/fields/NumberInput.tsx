import { forwardRef, useEffect, useId, useState, type CSSProperties, type InputHTMLAttributes, type KeyboardEvent } from "react";
import { cn } from "../../lib/cn";
import { FieldShell, fieldBaseClass, fieldBorderClass } from "./FieldShell";

export interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "onChange" | "value" | "maxLength"> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: number | "";
  onChange?: (value: number | "") => void;
  min?: number;
  max?: number;
  /** Allow a decimal point and one fractional part. Default false (integers only). */
  allowDecimal?: boolean;
  /** Allow a leading minus sign. Default false. */
  allowNegative?: boolean;
  /** Maximum number of digits the user can type. */
  maxLength?: number;
  showCharCount?: boolean;
  containerClassName?: string;
  /** Inline style applied to the outer field wrapper — use `style` for the input itself. */
  containerStyle?: CSSProperties;
}

/** Plain numeric text field — blocks non-digit keystrokes instead of showing +/- steppers. */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      label,
      error,
      helperText,
      value,
      onChange,
      min,
      max,
      allowDecimal = false,
      allowNegative = false,
      maxLength,
      showCharCount = !!maxLength,
      className,
      containerClassName,
      containerStyle,
      id,
      disabled,
      onKeyDown,
      onBlur,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const [draft, setDraft] = useState(value === "" || value === undefined ? "" : String(value));

    useEffect(() => {
      const external = value === "" || value === undefined ? "" : String(value);
      setDraft((current) => (Number(current) === Number(external) && current !== "" ? current : external));
    }, [value]);

    function clamp(n: number) {
      let result = n;
      if (min !== undefined) result = Math.max(min, result);
      if (max !== undefined) result = Math.min(max, result);
      return result;
    }

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
      const allowedControlKeys = [
        "Backspace", "Delete", "Tab", "Escape", "Enter",
        "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End",
      ];
      const isControl = allowedControlKeys.includes(e.key) || e.metaKey || e.ctrlKey;
      const isDigit = /^\d$/.test(e.key);
      const isDecimalPoint = allowDecimal && e.key === "." && !draft.includes(".");
      const isMinus = allowNegative && e.key === "-" && (e.currentTarget.selectionStart ?? 0) === 0 && !draft.includes("-");

      if (!isControl && !isDigit && !isDecimalPoint && !isMinus) {
        e.preventDefault();
      }
      onKeyDown?.(e);
    }

    return (
      <FieldShell
        label={label}
        htmlFor={inputId}
        required={props.required}
        error={error}
        helperText={helperText}
        charCount={maxLength && showCharCount ? { current: draft.replaceAll(/[-.]/g, "").length, max: maxLength } : undefined}
        className={containerClassName}
        style={containerStyle}
      >
        <input
          ref={ref}
          id={inputId}
          type="text"
          inputMode={allowDecimal ? "decimal" : "numeric"}
          value={draft}
          disabled={disabled}
          maxLength={maxLength ? maxLength + Number(allowNegative) + Number(allowDecimal) : undefined}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            const raw = e.target.value;
            const pattern = allowDecimal ? /^-?\d*(?:\.\d*)?$/ : /^-?\d*$/;
            if (!pattern.test(raw)) return;
            setDraft(raw);

            if (raw === "" || raw === "-" || raw.endsWith(".")) {
              if (raw === "") onChange?.("");
              return;
            }
            const num = Number(raw);
            if (!Number.isNaN(num)) onChange?.(clamp(num));
          }}
          onBlur={(e) => {
            if (draft !== "" && (draft === "-" || draft.endsWith("."))) {
              const num = Number(draft);
              const next = Number.isNaN(num) ? "" : clamp(num);
              setDraft(next === "" ? "" : String(next));
              onChange?.(next);
            }
            onBlur?.(e);
          }}
          className={cn(fieldBaseClass, fieldBorderClass(error), className)}
          {...props}
        />
      </FieldShell>
    );
  }
);
NumberInput.displayName = "NumberInput";
