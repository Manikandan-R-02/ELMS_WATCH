import { useId, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";
import { IconButton } from "../buttons/IconButton";
import { PickerShell } from "./PickerShell";
import { applyDigitMask, YEAR_INPUT_LENGTH, YEAR_SEGMENTS, YEAR_SEPARATORS } from "./dateMask";
import { ACTIVE_CELL_CLASS } from "./pickerKeys";
import { KeyboardHint } from "./KeyboardHint";

export interface YearPickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  value: number | null;
  onChange: (year: number) => void;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  containerClassName?: string;
  /** Inline style applied to the outer field wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
  /** Render the panel into `document.body`, fixed-positioned against the trigger — use inside a table cell, modal, or any scrolling/clipping ancestor. Default false. */
  portal?: boolean;
  /** Compact trigger padding — for dense contexts like an inline table-cell picker. Default false. */
  dense?: boolean;
}

/** One cell in the 3-column grid per arrow; Up/Down is a row (3 years); Page Up/Down a decade. */
const YEAR_KEY_STEPS: Partial<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -3,
  ArrowDown: 3,
  PageUp: -10,
  PageDown: 10,
};

const decadeOf = (y: number) => Math.floor(y / 10) * 10;

export function YearPicker({
  label,
  error,
  helperText,
  required,
  disabled,
  value,
  onChange,
  placeholder = "Select year or type yyyy",
  minYear,
  maxYear,
  containerClassName,
  style,
  portal,
  dense,
}: Readonly<YearPickerProps>) {
  const [open, setOpen] = useState(false);
  const [decadeStart, setDecadeStart] = useState(decadeOf(value ?? new Date().getFullYear()));
  const [text, setText] = useState("");
  const [active, setActive] = useState(value ?? new Date().getFullYear());
  const [navigated, setNavigated] = useState(false);
  const cellIdBase = useId();
  const years = Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i);

  function isYearDisabled(y: number) {
    return (minYear !== undefined && y < minYear) || (maxYear !== undefined && y > maxYear);
  }

  function clampYear(y: number) {
    let result = y;
    if (minYear !== undefined) result = Math.max(minYear, result);
    if (maxYear !== undefined) result = Math.min(maxYear, result);
    return result;
  }

  function tryParse(raw: string): number | null {
    if (raw.length !== YEAR_INPUT_LENGTH) return null;
    const y = Number(raw);
    if (isYearDisabled(y)) return null;
    return y;
  }

  function handleInputChange(raw: string) {
    const masked = applyDigitMask(raw, YEAR_SEGMENTS, YEAR_SEPARATORS);
    setText(masked);
    setNavigated(false);
    const parsed = tryParse(masked);
    if (parsed !== null) {
      onChange(parsed);
      setDecadeStart(decadeOf(parsed));
      setActive(parsed);
    }
  }

  function commit() {
    const parsed = tryParse(text);
    if (parsed === null) {
      setText(value ? String(value) : "");
    } else {
      onChange(parsed);
      setDecadeStart(decadeOf(parsed));
      setOpen(false);
    }
  }

  function select(y: number) {
    if (isYearDisabled(y)) return;
    onChange(y);
    // Keep `text` in sync with the click — otherwise a blur right after selecting (e.g. tabbing
    // or clicking another button) fires `commit()` against the stale text from when the panel
    // opened, re-applying the *old* value and silently undoing the click (see MonthPicker.tsx).
    setText(String(y));
    setDecadeStart(decadeOf(y));
    setOpen(false);
  }

  function moveActive(next: number) {
    const clamped = clampYear(next);
    setActive(clamped);
    setDecadeStart(decadeOf(clamped));
    setNavigated(true);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    const step = YEAR_KEY_STEPS[e.key];
    if (step !== undefined) {
      e.preventDefault();
      moveActive(active + step);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      moveActive(e.key === "Home" ? decadeOf(active) : decadeOf(active) + 9);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (navigated) select(active);
      else commit();
    }
  }

  const activeInView = years.includes(active);

  return (
    <PickerShell
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      displayValue={value ? String(value) : ""}
      placeholder={placeholder}
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          const start = clampYear(value ?? new Date().getFullYear());
          setText(value ? String(value) : "");
          setActive(start);
          setDecadeStart(decadeOf(start));
          setNavigated(false);
        }
      }}
      containerClassName={containerClassName}
      style={style}
      portal={portal}
      dense={dense}
      inputValue={text}
      onInputChange={handleInputChange}
      onInputKeyDown={handleKeyDown}
      onInputBlur={commit}
      activeDescendantId={activeInView ? `${cellIdBase}-${active}` : undefined}
      panel={
        <div className="w-full min-w-56">
          <div className="mb-2 flex items-center justify-between">
            <IconButton icon={ChevronLeft} label="Previous decade" variant="ghost" size="sm" tabIndex={-1} onClick={() => setDecadeStart((d) => d - 10)} />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {decadeStart} - {decadeStart + 9}
            </span>
            <IconButton icon={ChevronRight} label="Next decade" variant="ghost" size="sm" tabIndex={-1} onClick={() => setDecadeStart((d) => d + 10)} />
          </div>
          <div // NOSONAR - custom listbox: a native <select> cannot offer search, grouping or this keyboard model
            role="listbox" aria-label={`Years ${decadeStart} to ${decadeStart + 9}`} className="grid grid-cols-3 gap-1.5">
            {years.map((y) => {
              const disabledYear = isYearDisabled(y);
              const isEdge = y < decadeStart || y > decadeStart + 9;
              return (
                <button // NOSONAR - option of the custom listbox above; a native <option> cannot hold this button markup
                  key={y}
                  id={`${cellIdBase}-${y}`}
                  type="button"
                  role="option"
                  aria-selected={y === value}
                  aria-disabled={disabledYear || undefined}
                  tabIndex={-1}
                  disabled={disabledYear}
                  onClick={() => select(y)}
                  className={cn(
                    "rounded-lg px-2 py-2 text-xs font-medium transition",
                    isEdge ? "text-slate-300 dark:text-slate-600" : "text-slate-600 dark:text-slate-300",
                    y === value ? "bg-brand-600 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800",
                    disabledYear && "cursor-not-allowed opacity-30 hover:bg-transparent",
                    activeInView && y === active && ACTIVE_CELL_CLASS
                  )}
                >
                  {y}
                </button>
              );
            })}
          </div>
          <KeyboardHint text="Arrows move · PgUp/PgDn change decade · Enter selects" />
        </div>
      }
    />
  );
}
