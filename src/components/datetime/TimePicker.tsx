import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Clock } from "lucide-react";
import { cn } from "../../lib/cn";
import { PickerShell } from "./PickerShell";
import { applyDigitMask, TIME_INPUT_LENGTH, TIME_SEGMENTS, TIME_SEPARATORS } from "./dateMask";
import { ACTIVE_CELL_CLASS } from "./pickerKeys";
import { KeyboardHint } from "./KeyboardHint";

export interface TimeValue {
  hour: number; // 1-12
  minute: number; // 0-59
  meridiem: "AM" | "PM";
}

function tryParse(raw: string): { hour: number; minute: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(raw);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function formatTimeValue(t: TimeValue) {
  return `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")} ${t.meridiem}`;
}

export interface TimePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  value: TimeValue | null;
  onChange: (value: TimeValue) => void;
  placeholder?: string;
  minuteStep?: number;
  /** Show a "Now" shortcut in the panel that sets the current time. Default true. */
  showNow?: boolean;
  containerClassName?: string;
  /** Inline style applied to the outer field wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Render the panel into `document.body`, fixed-positioned against the trigger — use inside a table cell, modal, or any scrolling/clipping ancestor. Default false. */
  portal?: boolean;
  /** Compact trigger padding — for dense contexts like an inline table-cell picker. Default false. */
  dense?: boolean;
}

type Step = "hour" | "minute" | "meridiem";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MERIDIEMS = ["AM", "PM"] as const;
/** Columns per step's grid — arrow Up/Down move by one row. */
const STEP_COLUMNS: Record<Step, number> = { hour: 4, minute: 4, meridiem: 2 };

function toInputText(t: TimeValue | null) {
  return t ? `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}` : "";
}

function currentTimeValue(minuteStep: number): TimeValue {
  const now = new Date();
  const hour24 = now.getHours();
  const meridiem: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minute = (Math.round(now.getMinutes() / minuteStep) * minuteStep) % 60;
  return { hour, minute, meridiem };
}

export function TimePicker({
  label,
  error,
  helperText,
  required,
  disabled,
  value,
  onChange,
  placeholder = "Select time or type hh:mm",
  minuteStep = 5,
  showNow = true,
  containerClassName,
  style,
  open: openProp,
  onOpenChange,
  portal,
  dense,
}: Readonly<TimePickerProps>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  };
  const [text, setText] = useState("");
  // Progressive disclosure: pick the hour, then the picker advances to minute, then AM/PM —
  // one focused decision at a time instead of three columns competing for attention at once.
  const [step, setStep] = useState<Step>("hour");
  // Keyboard-highlighted cell within the current step's grid (arrows browse, Enter picks).
  const [activeIndex, setActiveIndex] = useState(0);
  const [navigated, setNavigated] = useState(false);
  const cellIdBase = useId();
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep);
  const current: TimeValue = value ?? { hour: 12, minute: 0, meridiem: "AM" };
  // Mirrors `current` but is updated synchronously inside `set`, so two `set`
  // calls fired back-to-back in the same tick (e.g. typing a digit then an
  // AM/PM key) chain off each other instead of both reading the same stale
  // `value` prop and the second overwriting the first.
  const currentRef = useRef(current);
  currentRef.current = current;

  function set(partial: Partial<TimeValue>) {
    const next = { ...currentRef.current, ...partial };
    currentRef.current = next;
    onChange(next);
    // Keep `text` in sync with every pick — otherwise a blur right after the final pick (e.g.
    // clicking another field) fires `commit()` against the stale text from when the panel opened,
    // re-applying the *old* value and silently undoing the pick (see MonthPicker.tsx for the same
    // root cause and full explanation).
    setText(toInputText(next));
  }

  function itemCount(s: Step) {
    const counts: Record<string, number> = { hour: HOURS.length, minute: minutes.length };
    return counts[s] ?? MERIDIEMS.length;
  }

  /** Where the highlight starts on a step — on its current value, so Enter right away keeps it. */
  function selectedIndexFor(s: Step) {
    const t = currentRef.current;
    if (s === "hour") return Math.max(0, HOURS.indexOf(t.hour));
    if (s === "minute") return Math.max(0, minutes.indexOf(t.minute));
    return t.meridiem === "AM" ? 0 : 1;
  }

  function goToStep(s: Step) {
    setStep(s);
    setActiveIndex(selectedIndexFor(s));
    setNavigated(false);
  }

  function pickAt(s: Step, index: number) {
    if (s === "hour") {
      set({ hour: HOURS[index] });
      goToStep("minute");
    } else if (s === "minute") {
      set({ minute: minutes[index] });
      goToStep("meridiem");
    } else {
      set({ meridiem: MERIDIEMS[index] });
      setOpen(false);
    }
  }

  function handleInputChange(raw: string) {
    const masked = applyDigitMask(raw, TIME_SEGMENTS, TIME_SEPARATORS);
    setText(masked);
    setNavigated(false);
    if (masked.length === TIME_INPUT_LENGTH) {
      const parsed = tryParse(masked);
      if (parsed) set(parsed);
    }
  }

  function commit() {
    const parsed = tryParse(text);
    if (parsed) {
      set(parsed);
      setOpen(false);
    } else {
      setText(toInputText(value));
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const key = e.key.toLowerCase();
    if (key === "a") set({ meridiem: "AM" });
    if (key === "p") set({ meridiem: "PM" });
    if (!open) return;
    if (key === "n" && showNow) {
      e.preventDefault();
      set(currentTimeValue(minuteStep));
      setOpen(false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (navigated) pickAt(step, activeIndex);
      else commit();
      return;
    }
    const cols = STEP_COLUMNS[step];
    const last = itemCount(step) - 1;
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols };
    let next: number | null = null;
    if (e.key in moves) next = activeIndex + moves[e.key];
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    setActiveIndex(Math.min(last, Math.max(0, next)));
    setNavigated(true);
  }

  return (
    <PickerShell
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      displayValue={value ? formatTimeValue(value) : ""}
      placeholder={placeholder}
      icon={<Clock className="h-4 w-4" />}
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setText(toInputText(value));
          goToStep("hour");
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
      activeDescendantId={`${cellIdBase}-${step}-${activeIndex}`}
      panelClassName="p-0"
      panel={
        <div className="w-full min-w-64">
          {/* Stepper — shows progress and lets you jump back to re-pick an earlier step. */}
          <div className="flex items-center justify-center gap-0.5 border-b border-slate-100 bg-slate-50/60 px-2 py-1.5 dark:border-slate-800 dark:bg-slate-800/40">
            <StepPill caption="Hour" value={String(current.hour).padStart(2, "0")} active={step === "hour"} onClick={() => goToStep("hour")} />
            <span className="text-sm font-bold text-slate-300 dark:text-slate-600">:</span>
            <StepPill caption="Min" value={String(current.minute).padStart(2, "0")} active={step === "minute"} onClick={() => goToStep("minute")} />
            <StepPill caption="Period" value={current.meridiem} active={step === "meridiem"} onClick={() => goToStep("meridiem")} />
          </div>

          <div className="p-2">
            {step === "hour" && (
              <TimeGrid
                items={HOURS}
                selected={current.hour}
                format={(h) => String(h).padStart(2, "0")}
                activeIndex={activeIndex}
                idFor={(i) => `${cellIdBase}-hour-${i}`}
                label="Hour"
                onSelect={(i) => pickAt("hour", i)}
              />
            )}
            {step === "minute" && (
              <TimeGrid
                items={minutes}
                selected={current.minute}
                format={(m) => String(m).padStart(2, "0")}
                activeIndex={activeIndex}
                idFor={(i) => `${cellIdBase}-minute-${i}`}
                label="Minute"
                onSelect={(i) => pickAt("minute", i)}
              />
            )}
            {step === "meridiem" && (
              <div // NOSONAR - custom listbox: a native <select> cannot offer search, grouping or this keyboard model
                role="listbox" aria-label="AM or PM" className="grid grid-cols-2 gap-2 py-1">
                {MERIDIEMS.map((m, i) => (
                  <button // NOSONAR - option of the custom listbox above; a native <option> cannot hold this button markup
                    key={m}
                    id={`${cellIdBase}-meridiem-${i}`}
                    type="button"
                    role="option"
                    aria-selected={current.meridiem === m}
                    tabIndex={-1}
                    onClick={() => pickAt("meridiem", i)}
                    className={cn(
                      "rounded-xl border-2 py-4 text-sm font-bold transition",
                      current.meridiem === m
                        ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                        : "border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800",
                      activeIndex === i && ACTIVE_CELL_CLASS
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {showNow && (
            <div className="border-t border-slate-100 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                tabIndex={-1}
                onClick={() => {
                  set(currentTimeValue(minuteStep));
                  setOpen(false);
                }}
                className="w-full rounded-lg py-1.5 text-center text-xs font-semibold text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
              >
                Now
              </button>
            </div>
          )}
          <div className="px-2 pb-2">
            <KeyboardHint text={`Arrows move · Enter picks & moves on · A/P sets AM/PM${showNow ? " · N = now" : ""}`} />
          </div>
        </div>
      }
    />
  );
}

function StepPill({ caption, value, active, onClick }: Readonly<{ caption: string; value: string; active: boolean; onClick: () => void }>) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onClick}
      className={cn(
        "flex min-w-[3.5rem] flex-col items-center rounded-lg px-2 py-1 transition",
        active ? "bg-brand-600 text-white shadow-soft" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      )}
    >
      <span className="text-sm font-bold leading-tight tabular-nums">{value}</span>
      <span className={cn("text-[0.6rem] font-medium uppercase leading-tight tracking-wide", active ? "text-white/70" : "text-slate-400 dark:text-slate-500")}>
        {caption}
      </span>
    </button>
  );
}

function TimeGrid({
  items,
  selected,
  onSelect,
  format,
  activeIndex,
  idFor,
  label,
}: Readonly<{
  items: number[];
  selected: number;
  onSelect: (index: number) => void;
  format: (v: number) => string;
  activeIndex: number;
  idFor: (index: number) => string;
  label: string;
}>) {
  const selectedRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // This component only exists in the tree while its step is the active one, so
  // "just mounted" is exactly the moment to bring the current selection into view.
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center" });
  }, []);

  // Keep the keyboard highlight visible as it moves through the scrollable minute list.
  useEffect(() => {
    gridRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <div // NOSONAR - custom listbox: a native <select> cannot offer search, grouping or this keyboard model
      ref={gridRef} role="listbox" aria-label={label} className="grid max-h-52 grid-cols-4 gap-1.5 overflow-y-auto p-0.5">
      {items.map((item, index) => {
        const isSelected = item === selected;
        return (
          <button // NOSONAR - option of the custom listbox above; a native <option> cannot hold this button markup
            key={item}
            id={idFor(index)}
            data-index={index}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            role="option"
            aria-selected={isSelected}
            tabIndex={-1}
            onClick={() => onSelect(index)}
            className={cn(
              "rounded-lg py-2 text-center text-sm font-medium tabular-nums transition",
              isSelected
                ? "bg-brand-600 font-semibold text-white shadow-soft"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
              index === activeIndex && ACTIVE_CELL_CLASS
            )}
          >
            {format(item)}
          </button>
        );
      })}
    </div>
  );
}
