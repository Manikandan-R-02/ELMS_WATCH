import { useId, useState, type CSSProperties, type KeyboardEvent } from "react";
import { format, isAfter, isBefore, isSameMonth, isValid, parse, startOfDay } from "date-fns";

/** Input text for a date range: "from - to", "from - ..." while only the start is picked, or "". */
function rangeLabel(from: Date | null | undefined, to: Date | null | undefined, fmt: string): string {
  if (from && to) return `${format(from, fmt)} - ${format(to, fmt)}`;
  if (from) return `${format(from, fmt)} - ...`;
  return "";
}
import { PickerShell } from "./PickerShell";
import { dayCellId, MonthGrid, nextActiveDay } from "./MonthGrid";
import { KeyboardHint } from "./KeyboardHint";
import { TextButton } from "../buttons/TextButton";
import { applyDigitMask, DATE_INPUT_FORMAT, RANGE_SEGMENTS, RANGE_SEPARATORS } from "./dateMask";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface DateRangePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  displayFormat?: string;
  containerClassName?: string;
  /** Inline style applied to the outer field wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
  /** Render the panel into `document.body`, fixed-positioned against the trigger — use inside a table cell, modal, or any scrolling/clipping ancestor. Default false. */
  portal?: boolean;
  /** Compact trigger padding — for dense contexts like an inline table-cell picker. Default false. */
  dense?: boolean;
}

const RANGE_TEXT_LENGTH = 23; // "dd/MM/yyyy - dd/MM/yyyy"

function toRangeText(range: DateRange): string {
  if (range.from && range.to) {
    return `${format(range.from, DATE_INPUT_FORMAT)} - ${format(range.to, DATE_INPUT_FORMAT)}`;
  }
  if (range.from) {
    return `${format(range.from, DATE_INPUT_FORMAT)} - `;
  }
  return "";
}

function parseDatePart(part: string): Date | null {
  const parsed = parse(part, DATE_INPUT_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

export function DateRangePicker({
  label,
  error,
  helperText,
  required,
  disabled,
  value,
  onChange,
  placeholder = "Select range or type dd/mm/yyyy - dd/mm/yyyy",
  minDate,
  maxDate,
  displayFormat = "dd MMM yyyy",
  containerClassName,
  style,
  portal,
  dense,
}: Readonly<DateRangePickerProps>) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(value.from ?? new Date());
  const [draft, setDraft] = useState<DateRange>(value);
  const [text, setText] = useState("");
  // Keyboard-highlighted day. Enter picks it into the draft (first the start, then the end); an
  // Enter without moving first applies a complete draft — the keyboard twin of clicking Apply.
  const [active, setActive] = useState<Date>(startOfDay(value.from ?? new Date()));
  const [navigated, setNavigated] = useState(false);
  const cellIdBase = useId();

  const displayValue = rangeLabel(value.from, value.to, displayFormat);

  function isOutOfRange(day: Date) {
    if (minDate && isBefore(day, minDate)) return true;
    if (maxDate && isAfter(day, maxDate)) return true;
    return false;
  }

  function handleSelectDay(day: Date) {
    if (!draft.from || (draft.from && draft.to)) {
      setDraft({ from: day, to: null });
      return;
    }
    if (isBefore(day, draft.from)) {
      setDraft({ from: day, to: draft.from });
    } else {
      setDraft({ from: draft.from, to: day });
    }
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
      if (navigated) {
        if (!isOutOfRange(active)) handleSelectDay(active);
        setNavigated(false);
      } else {
        commit();
      }
    }
  }

  function handleInputChange(raw: string) {
    const masked = applyDigitMask(raw, RANGE_SEGMENTS, RANGE_SEPARATORS);
    setText(masked);
    setNavigated(false);

    const from = masked.length >= 10 ? parseDatePart(masked.slice(0, 10)) : null;
    const to = masked.length === RANGE_TEXT_LENGTH ? parseDatePart(masked.slice(13, 23)) : null;

    if (from && isOutOfRange(from)) return;
    if (to && isOutOfRange(to)) return;

    if (from && to) {
      const ordered = isBefore(to, from) ? { from: to, to: from } : { from, to };
      setDraft(ordered);
      setMonth(ordered.from);
      setActive(ordered.to);
    } else if (from) {
      setDraft({ from, to: null });
      setMonth(from);
      setActive(from);
    }
  }

  function commit() {
    if (draft.from && draft.to) {
      onChange(draft);
      setOpen(false);
    } else {
      setText(toRangeText(value));
    }
  }

  return (
    <PickerShell
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      displayValue={displayValue}
      placeholder={placeholder}
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          const start = startOfDay(value.from ?? new Date());
          setDraft(value);
          setText(toRangeText(value));
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
            rangeStart={draft.from}
            rangeEnd={draft.to}
            onSelectDay={handleSelectDay}
            minDate={minDate}
            maxDate={maxDate}
            active={active}
            cellIdBase={cellIdBase}
          />
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <span className="text-xs text-slate-400">
              {draft.from ? format(draft.from, "dd MMM") : "Start"} &rarr; {draft.to ? format(draft.to, "dd MMM") : "End"}
            </span>
            <TextButton
              size="sm"
              tabIndex={-1}
              disabled={!draft.from || !draft.to}
              onClick={() => {
                onChange(draft);
                setOpen(false);
              }}
            >
              Apply
            </TextButton>
          </div>
          <KeyboardHint text="Arrows move · Enter picks start, then end · Enter again applies" />
        </div>
      }
    />
  );
}
