import { useId, useState, type CSSProperties, type KeyboardEvent } from "react";
import { format, isAfter, isBefore, isSameMonth, isValid, parse, startOfDay } from "date-fns";
import { PickerShell } from "./PickerShell";
import { dayCellId, MonthGrid, nextActiveDay } from "./MonthGrid";
import { KeyboardHint } from "./KeyboardHint";
import { applyDigitMask, DATE_INPUT_FORMAT, DATE_INPUT_LENGTH, DATE_SEGMENTS, DATE_SEPARATORS } from "./dateMask";

export interface DatePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  displayFormat?: string;
  containerClassName?: string;
  /** Inline style applied to the outer field wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
  /** Render the calendar panel into `document.body`, fixed-positioned against the trigger — use inside a table cell, modal, or any scrolling/clipping ancestor so it isn't cut off. Default false. */
  portal?: boolean;
  /** Compact trigger padding — for dense contexts like an inline table-cell picker. Default false. */
  dense?: boolean;
}

export function DatePicker({
  label,
  error,
  helperText,
  required,
  disabled,
  value,
  onChange,
  placeholder = "Select date or type dd/mm/yyyy",
  minDate,
  maxDate,
  displayFormat = "dd MMM yyyy",
  containerClassName,
  style,
  portal,
  dense,
}: Readonly<DatePickerProps>) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(value ?? new Date());
  const [text, setText] = useState("");
  // Keyboard-highlighted day (arrows browse, Enter picks) — see MonthPicker for the same pattern.
  const [active, setActive] = useState<Date>(startOfDay(value ?? new Date()));
  const [navigated, setNavigated] = useState(false);
  const cellIdBase = useId();

  function isOutOfRange(day: Date) {
    if (minDate && isBefore(day, minDate)) return true;
    if (maxDate && isAfter(day, maxDate)) return true;
    return false;
  }

  function tryParse(raw: string): Date | null {
    if (raw.length !== DATE_INPUT_LENGTH) return null;
    const parsed = parse(raw, DATE_INPUT_FORMAT, new Date());
    if (!isValid(parsed) || isOutOfRange(parsed)) return null;
    return parsed;
  }

  function handleInputChange(raw: string) {
    const masked = applyDigitMask(raw, DATE_SEGMENTS, DATE_SEPARATORS);
    setText(masked);
    setNavigated(false);
    const parsed = tryParse(masked);
    if (parsed) {
      onChange(parsed);
      setMonth(parsed);
      setActive(startOfDay(parsed));
    }
  }

  function select(day: Date) {
    if (isOutOfRange(day)) return;
    onChange(day);
    // Keep `text` in sync with the click — otherwise a blur right after selecting (e.g. tabbing
    // or clicking another button) fires `commit()` against the stale text from when the panel
    // opened, re-applying the *old* value and silently undoing the click.
    setText(format(day, DATE_INPUT_FORMAT));
    setMonth(day);
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    const next = nextActiveDay(active, e, minDate, maxDate);
    if (next) {
      e.preventDefault();
      setActive(next);
      if (!isSameMonth(next, month)) setMonth(next);
      setNavigated(true);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (navigated) select(active);
      else commit();
    }
  }

  function commit() {
    const parsed = tryParse(text);
    if (parsed) {
      onChange(parsed);
      setMonth(parsed);
      setOpen(false);
    } else {
      setText(value ? format(value, DATE_INPUT_FORMAT) : "");
    }
  }

  return (
    <PickerShell
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      displayValue={value ? format(value, displayFormat) : ""}
      placeholder={placeholder}
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          const start = startOfDay(value ?? new Date());
          setText(value ? format(value, DATE_INPUT_FORMAT) : "");
          setActive(start);
          setMonth(start);
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
      activeDescendantId={isSameMonth(active, month) ? dayCellId(cellIdBase, active) : undefined}
      panel={
        <div>
          <MonthGrid
            month={month}
            onMonthChange={setMonth}
            selected={value}
            onSelectDay={select}
            minDate={minDate}
            maxDate={maxDate}
            active={active}
            cellIdBase={cellIdBase}
          />
          <KeyboardHint text="Arrows move · PgUp/PgDn change month (+Shift: year) · Enter selects" />
        </div>
      }
    />
  );
}
