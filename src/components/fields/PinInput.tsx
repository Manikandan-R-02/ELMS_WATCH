import { useId, useRef, type ClipboardEvent, type CSSProperties, type KeyboardEvent } from "react";
import { cn } from "../../lib/cn";
import { FieldShell, fieldBorderClass } from "./FieldShell";

export interface PinInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  /** Number of digit boxes. Default 6. */
  length?: number;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  containerClassName?: string;
  /** Inline style applied to the outer field wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
}

/** Segmented one-time-code / PIN input — auto-advances on digit entry, supports backspace-to-previous and pasting a full code. */
export function PinInput({
  label,
  error,
  helperText,
  required,
  disabled,
  length = 6,
  value,
  onChange,
  autoFocus,
  containerClassName,
  style,
}: Readonly<PinInputProps>) {
  const autoId = useId();
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function commit(nextDigits: string[]) {
    onChange(nextDigits.join("").slice(0, length));
  }

  function handleChange(index: number, raw: string) {
    const char = raw.replaceAll(/\D/g, "").slice(-1);
    const next = digits.slice();
    next[index] = char;
    commit(next);
    if (char && index < length - 1) boxRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      boxRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      boxRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      boxRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replaceAll(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    boxRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  const boxIds = digits.map((_, i) => `${autoId}-${i}`);

  return (
    <FieldShell label={label} htmlFor={`${autoId}-0`} required={required} error={error} helperText={helperText} className={containerClassName} style={style}>
      <div className="flex gap-2">
        {boxIds.map((boxId, i) => (
          <input
            key={boxId}
            id={boxId}
            ref={(el) => {
              boxRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digits[i]}
            disabled={disabled}
            autoFocus={autoFocus && i === 0}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={cn(
              "h-12 w-10 rounded-lg border bg-white text-center text-lg font-semibold text-slate-900 shadow-sm outline-none transition sm:h-14 sm:w-12",
              "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
              "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
              "dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800",
              fieldBorderClass(error)
            )}
          />
        ))}
      </div>
    </FieldShell>
  );
}
