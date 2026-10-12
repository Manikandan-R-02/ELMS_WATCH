import type { KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays,
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { cn } from "../../lib/cn";
import { IconButton } from "../buttons/IconButton";
import { ACTIVE_CELL_CLASS } from "./pickerKeys";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export interface MonthGridProps {
  month: Date;
  onMonthChange: (month: Date) => void;
  selected?: Date | null;
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  onSelectDay: (day: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  /** The keyboard-highlighted day (see `nextActiveDay`) — gets an outline ring. */
  active?: Date | null;
  /** Prefix for each day cell's DOM id (see `dayCellId`), so the picker's input can point
   * `aria-activedescendant` at the highlighted day. */
  cellIdBase?: string;
}

export function dayCellId(cellIdBase: string, day: Date) {
  return `${cellIdBase}-${format(day, "yyyy-MM-dd")}`;
}

/**
 * The day grid's keyboard model, shared by DatePicker and DateRangePicker so both move the same
 * way: arrows = one day / one week, Page Up/Down = one month (with Shift, one year), Home/End =
 * start/end of the week. Returns null for any other key. Clamped to `minDate`/`maxDate` so the
 * highlight can never land somewhere Enter wouldn't be allowed to pick.
 */
export function nextActiveDay(active: Date, e: KeyboardEvent, minDate?: Date, maxDate?: Date): Date | null {
  let next: Date;
  switch (e.key) {
    case "ArrowLeft":
      next = addDays(active, -1);
      break;
    case "ArrowRight":
      next = addDays(active, 1);
      break;
    case "ArrowUp":
      next = addDays(active, -7);
      break;
    case "ArrowDown":
      next = addDays(active, 7);
      break;
    case "PageUp":
      next = e.shiftKey ? addYears(active, -1) : addMonths(active, -1);
      break;
    case "PageDown":
      next = e.shiftKey ? addYears(active, 1) : addMonths(active, 1);
      break;
    case "Home":
      next = startOfWeek(active);
      break;
    case "End":
      next = startOfDay(endOfWeek(active));
      break;
    default:
      return null;
  }
  if (minDate && isBefore(next, startOfDay(minDate))) next = startOfDay(minDate);
  if (maxDate && isAfter(next, maxDate)) next = startOfDay(maxDate);
  return next;
}

export function MonthGrid({
  month,
  onMonthChange,
  selected,
  rangeStart,
  rangeEnd,
  onSelectDay,
  minDate,
  maxDate,
  active,
  cellIdBase,
}: Readonly<MonthGridProps>) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });

  function isDisabled(day: Date) {
    if (minDate && isBefore(day, minDate)) return true;
    if (maxDate && isAfter(day, maxDate)) return true;
    return false;
  }

  return (
    // `w-full` + a minimum, not a fixed `w-64` — see MonthPicker's identical note: a portaled
    // panel is at least as wide as its field, and a fixed-width grid left an empty band beside it.
    <div className="w-full min-w-64">
      <div className="mb-2 flex items-center justify-between">
        <IconButton icon={ChevronLeft} label="Previous month" variant="ghost" size="sm" tabIndex={-1} onClick={() => onMonthChange(subMonths(month, 1))} />
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{format(month, "MMMM yyyy")}</span>
        <IconButton icon={ChevronRight} label="Next month" variant="ghost" size="sm" tabIndex={-1} onClick={() => onMonthChange(addMonths(month, 1))} />
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center" aria-hidden>
        {WEEKDAYS.map((d) => (
          <span key={d} className="text-[11px] font-medium text-slate-400">
            {d}
          </span>
        ))}
      </div>
      <div // NOSONAR - custom listbox: a native <select> cannot offer search, grouping or this keyboard model
        role="listbox" aria-label={format(month, "MMMM yyyy")} className="mt-1 grid grid-cols-7 gap-y-1 text-center">
        {days.map((day) => {
          const inRange = rangeStart && rangeEnd && isWithinInterval(day, { start: rangeStart, end: rangeEnd });
          const isRangeEdge = (rangeStart && isSameDay(day, rangeStart)) || (rangeEnd && isSameDay(day, rangeEnd));
          const isSelected = selected && isSameDay(day, selected);
          const outsideMonth = !isSameMonth(day, month);
          const disabled = isDisabled(day);
          const isActive = !!active && isSameDay(day, active);

          return (
            <button // NOSONAR - option of the custom listbox above; a native <option> cannot hold this button markup
              key={day.toISOString()}
              id={cellIdBase ? dayCellId(cellIdBase, day) : undefined}
              type="button"
              role="option"
              aria-selected={!!(isSelected || isRangeEdge)}
              aria-label={format(day, "EEEE, d MMMM yyyy")}
              aria-disabled={disabled || undefined}
              tabIndex={-1}
              disabled={disabled}
              onClick={() => onSelectDay(day)}
              className={cn(
                "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs transition",
                outsideMonth && "text-slate-300 dark:text-slate-600",
                !outsideMonth && "text-slate-700 dark:text-slate-200",
                inRange && !isRangeEdge && "rounded-none bg-brand-50 dark:bg-brand-500/10",
                (isSelected || isRangeEdge) && "bg-brand-600 font-semibold text-white hover:bg-brand-700",
                !isSelected && !isRangeEdge && !disabled && "hover:bg-slate-100 dark:hover:bg-slate-800",
                disabled && "cursor-not-allowed opacity-30",
                isActive && ACTIVE_CELL_CLASS
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
