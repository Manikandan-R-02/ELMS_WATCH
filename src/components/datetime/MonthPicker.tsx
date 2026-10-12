import { useId, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, format, isSameMonth, setMonth, startOfMonth } from "date-fns";
import { cn } from "../../lib/cn";
import { IconButton } from "../buttons/IconButton";
import { PickerShell } from "./PickerShell";
import { applyDigitMask, MONTH_INPUT_LENGTH, MONTH_SEGMENTS, MONTH_SEPARATORS } from "./dateMask";
import { ACTIVE_CELL_CLASS } from "./pickerKeys";
import { KeyboardHint } from "./KeyboardHint";

export interface MonthPickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  containerClassName?: string;
  /** Inline style applied to the outer field wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
  /** Render the panel into `document.body`, fixed-positioned against the trigger — use inside a table cell, modal, or any scrolling/clipping ancestor. Default false. */
  portal?: boolean;
  /** Compact trigger padding — for dense contexts like an inline table-cell picker. Default false. */
  dense?: boolean;
  /** Translucent white-on-color styling for placement directly on a solid-color surface (e.g. the brand-colored Header). Default false. */
  inverted?: boolean;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i);
const MONTH_TEXT_FORMAT = "MM/yyyy";

/** Arrow keys move one cell in the 3-column grid (so Up/Down is a row = 3 months); Page Up/Down
 * jumps a whole year. Home/End are handled separately (they depend on the active year). */
const MONTH_KEY_STEPS: Partial<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -3,
  ArrowDown: 3,
  PageUp: -12,
  PageDown: 12,
};

export function MonthPicker({
  label,
  error,
  helperText,
  required,
  disabled,
  value,
  onChange,
  placeholder = "Select month or type mm/yyyy",
  containerClassName,
  style,
  portal,
  dense,
  inverted,
}: Readonly<MonthPickerProps>) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(value?.getFullYear() ?? new Date().getFullYear());
  const [text, setText] = useState("");
  // The keyboard-highlighted month — separate from `value`, so arrowing around only browses; the
  // field doesn't change until Enter (or a click) actually picks one.
  const [active, setActive] = useState<Date>(startOfMonth(value ?? new Date()));
  // Whether the last interaction was keyboard navigation (then Enter picks `active`) or typing
  // (then Enter commits the typed text) — the two can disagree mid-edit.
  const [navigated, setNavigated] = useState(false);
  const cellIdBase = useId();

  function tryParse(raw: string): Date | null {
    const match = /^(\d{2})\/(\d{4})$/.exec(raw);
    if (!match) return null;
    const mm = Number(match[1]);
    const yyyy = Number(match[2]);
    if (mm < 1 || mm > 12) return null;
    return new Date(yyyy, mm - 1, 1);
  }

  function handleInputChange(raw: string) {
    const masked = applyDigitMask(raw, MONTH_SEGMENTS, MONTH_SEPARATORS);
    setText(masked);
    setNavigated(false);
    if (masked.length === MONTH_INPUT_LENGTH) {
      const parsed = tryParse(masked);
      if (parsed) {
        onChange(parsed);
        setYear(parsed.getFullYear());
        setActive(parsed);
      }
    }
  }

  function commit() {
    const parsed = tryParse(text);
    if (parsed) {
      onChange(parsed);
      setYear(parsed.getFullYear());
      setOpen(false);
    } else {
      setText(value ? format(value, MONTH_TEXT_FORMAT) : "");
    }
  }

  function select(month: Date) {
    onChange(month);
    // Keep `text` in sync with the click — otherwise a blur right after selecting (e.g. tabbing
    // or clicking another button) fires `commit()` against the stale text from when the panel
    // opened, re-applying the *old* value and silently undoing the click.
    setText(format(month, MONTH_TEXT_FORMAT));
    setYear(month.getFullYear());
    setOpen(false);
  }

  function moveActive(next: Date) {
    setActive(next);
    setYear(next.getFullYear());
    setNavigated(true);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    const step = MONTH_KEY_STEPS[e.key];
    if (step !== undefined) {
      e.preventDefault();
      moveActive(addMonths(active, step));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      moveActive(setMonth(active, e.key === "Home" ? 0 : 11));
    } else if (e.key === "Enter") {
      // preventDefault so an enclosing Modal's own Enter-to-confirm doesn't also fire.
      e.preventDefault();
      if (navigated) select(active);
      else commit();
    }
  }

  const activeInView = active.getFullYear() === year;

  return (
    <PickerShell
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      displayValue={value ? format(value, "MMMM yyyy") : ""}
      placeholder={placeholder}
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          const start = startOfMonth(value ?? new Date());
          setText(value ? format(value, MONTH_TEXT_FORMAT) : "");
          setActive(start);
          setYear(start.getFullYear());
          setNavigated(false);
        }
      }}
      containerClassName={containerClassName}
      style={style}
      portal={portal}
      dense={dense}
      inverted={inverted}
      inputValue={text}
      onInputChange={handleInputChange}
      onInputKeyDown={handleKeyDown}
      onInputBlur={commit}
      activeDescendantId={activeInView ? `${cellIdBase}-${active.getMonth()}` : undefined}
      panel={
        // `w-full` + a minimum, not a fixed `w-56`: in portal mode the panel is stretched to at
        // least the field's width, and a fixed-width grid inside it hugged the left edge with an
        // empty band down the right side.
        <div className="w-full min-w-56">
          <div className="mb-2 flex items-center justify-between">
            <IconButton icon={ChevronLeft} label="Previous year" variant="ghost" size="sm" tabIndex={-1} onClick={() => setYear((y) => y - 1)} />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{year}</span>
            <IconButton icon={ChevronRight} label="Next year" variant="ghost" size="sm" tabIndex={-1} onClick={() => setYear((y) => y + 1)} />
          </div>
          <div // NOSONAR - custom listbox: a native <select> cannot offer search, grouping or this keyboard model
            role="listbox" aria-label={`Months of ${year}`} className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((m) => {
              const candidate = setMonth(new Date(year, 0, 1), m);
              const isSelected = !!value && isSameMonth(candidate, value);
              const isActive = activeInView && active.getMonth() === m;
              return (
                <button // NOSONAR - option of the custom listbox above; a native <option> cannot hold this button markup
                  key={m}
                  id={`${cellIdBase}-${m}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  aria-label={format(candidate, "MMMM yyyy")}
                  tabIndex={-1}
                  onClick={() => select(candidate)}
                  className={cn(
                    "rounded-lg px-2 py-2 text-xs font-medium text-slate-600 transition dark:text-slate-300",
                    isSelected ? "bg-brand-600 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800",
                    isActive && ACTIVE_CELL_CLASS
                  )}
                >
                  {format(candidate, "MMM")}
                </button>
              );
            })}
          </div>
          <KeyboardHint text="Arrows move · PgUp/PgDn change year · Enter selects" />
        </div>
      }
    />
  );
}
