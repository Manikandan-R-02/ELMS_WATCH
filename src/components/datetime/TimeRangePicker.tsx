import { ArrowRight, Lock } from "lucide-react";
import { TimePicker, type TimeValue } from "./TimePicker";

export interface TimeRange {
  from: TimeValue | null;
  to: TimeValue | null;
}

export interface TimeRangePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  minuteStep?: number;
  containerClassName?: string;
  /** Render each TimePicker's panel into `document.body`, fixed-positioned against its trigger — use inside a table cell, modal, or any scrolling/clipping ancestor. Default false. */
  portal?: boolean;
}

/** Minutes since midnight — for comparing two TimeValues chronologically. */
function toMinutes(t: TimeValue): number {
  const hour24 = (t.hour % 12) + (t.meridiem === "PM" ? 12 : 0);
  return hour24 * 60 + t.minute;
}

export function TimeRangePicker({
  label,
  error,
  helperText,
  required,
  disabled,
  value,
  onChange,
  minuteStep,
  containerClassName,
  portal,
}: Readonly<TimeRangePickerProps>) {
  const toLocked = !disabled && !value.from;
  const rangeError =
    value.from && value.to && toMinutes(value.to) <= toMinutes(value.from)
      ? "End time must be after the start time."
      : undefined;
  const resolvedError = error ?? rangeError;

  function handleFromChange(from: TimeValue) {
    // An already-picked "to" that's no longer after the new "from" is now invalid — clear it
    // so the field can't silently hold a range that no longer makes sense, and the user re-picks it.
    const nextTo = value.to && toMinutes(value.to) > toMinutes(from) ? value.to : null;
    onChange({ from, to: nextTo });
  }

  return (
    <div className={containerClassName}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <div className="flex flex-col items-stretch gap-2 min-[26rem]:flex-row min-[26rem]:items-center">
        <TimePicker
          value={value.from}
          onChange={handleFromChange}
          placeholder="Start time"
          disabled={disabled}
          minuteStep={minuteStep}
          containerClassName="min-w-0 flex-1"
          portal={portal}
        />
        <ArrowRight className="mt-0 h-4 w-4 shrink-0 rotate-90 self-center text-slate-300 min-[26rem]:rotate-0 dark:text-slate-600" />
        <TimePicker
          value={value.to}
          onChange={(to) => onChange({ ...value, to })}
          placeholder={toLocked ? "Select start time first" : "End time"}
          disabled={disabled || toLocked}
          minuteStep={minuteStep}
          containerClassName="min-w-0 flex-1"
          portal={portal}
        />
      </div>
      {toLocked && !resolvedError && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
          <Lock className="h-3 w-3" /> Pick a start time to unlock the end time.
        </p>
      )}
      {resolvedError && <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{resolvedError}</p>}
      {!resolvedError && helperText && <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{helperText}</p>}
    </div>
  );
}
