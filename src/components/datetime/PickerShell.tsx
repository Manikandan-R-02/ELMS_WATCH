import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";
import { useClickOutside } from "../../hooks/useClickOutside";
import { useFlipPosition } from "../../hooks/useFlipPosition";
import { FieldShell } from "../fields/FieldShell";
import { OPEN_KEYS } from "./pickerKeys";

export interface PickerShellProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  displayValue: string;
  placeholder?: string;
  icon?: ReactNode;
  panel: ReactNode;
  containerClassName?: string;
  /** Inline style applied to the outer field wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
  panelClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Raw, editable text shown while the field is open — lets the user type a value directly. */
  inputValue?: string;
  onInputChange?: (raw: string) => void;
  onInputKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  onInputBlur?: () => void;
  /**
   * Render the floating panel into `document.body` (fixed-positioned against the trigger) instead of
   * absolutely inside this field. Use this for any picker placed in a clipping/scrolling ancestor —
   * a table cell, a modal body, a horizontally-scrollable toolbar — so the panel isn't cut off.
   * Flips above the trigger automatically when there isn't room below. Default false (cheaper, no
   * portal/measurement) — the existing absolute layout is fine for a picker with open space around it.
   */
  portal?: boolean;
  /** Compact trigger padding — for dense contexts like an inline table-cell picker. Default false. */
  dense?: boolean;
  /** Translucent white-on-color styling for placement directly on a solid-color surface (e.g. the brand-colored Header) instead of a page background. Default false. */
  inverted?: boolean;
  /** DOM id of the keyboard-highlighted cell in `panel` — announced to screen readers through the
   * input's `aria-activedescendant` while the panel is open (see `pickerKeys.ts`). */
  activeDescendantId?: string;
}

/** Shared trigger + floating panel shell used by every date/time picker. */
/** Input box colours: the inverted (on-colour) style, or the light style with an optional error outline. */
function surfaceClass(inverted: boolean, hasError: boolean): string {
  if (inverted) {
    return "border-white/20 bg-white/15 text-white hover:bg-white/20 focus-within:border-white/40 focus-within:bg-white/20 focus-within:ring-2 focus-within:ring-white/20";
  }
  return cn(
    "bg-white text-slate-900 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 dark:bg-slate-900 dark:text-slate-100",
    hasError ? "border-red-400 dark:border-red-500/60" : "border-slate-200 dark:border-slate-700"
  );
}

/** Where the open panel sits: fixed when portaled, otherwise above or below the trigger. */
function panelPositionClass(portal: boolean, placement: string): string {
  if (portal) return "fixed";
  return cn("absolute", placement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5");
}

export function PickerShell({
  label,
  error,
  helperText,
  required,
  disabled,
  displayValue,
  placeholder = "Select...",
  icon = <CalendarDays className="h-4 w-4" />,
  panel,
  containerClassName,
  style,
  panelClassName,
  open: openProp,
  onOpenChange,
  inputValue = "",
  onInputChange,
  onInputKeyDown,
  onInputBlur,
  portal = false,
  dense = false,
  inverted = false,
  activeDescendantId,
}: Readonly<PickerShellProps>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  };
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const panelId = useId();
  useClickOutside(portal ? [ref, panelRef] : ref, () => setOpen(false), open);

  const { placement, panelStyle: flipPanelStyle } = useFlipPosition({ open, triggerRef: ref, panelRef, portal });
  // Position only — never size — from `useFlipPosition`'s trigger-width measurement. A calendar
  // grid's natural width is fixed content (a 7-column day grid, a 3-column month/year grid, …),
  // not a list that should stretch to match whatever's beside it: tying the panel's width to the
  // trigger's meant a picker sitting in a wide grid column (e.g. ItemAnalysisPage/
  // CategoryAnalysisPage's filter row) rendered its calendar stretched across that same width,
  // spreading day cells out with huge gaps instead of a normal compact grid. Each picker's own
  // panel already sets its own floor (`min-w-56`/`min-w-64`), which still protects a *narrow*
  // trigger from clipping a wider grid — so the only thing dropped here is forcibly stretching a
  // panel past its natural width to match a wide one.
  const panelStyle: CSSProperties = portal
    ? { position: flipPanelStyle.position, visibility: flipPanelStyle.visibility, left: flipPanelStyle.left, top: flipPanelStyle.top, bottom: flipPanelStyle.bottom }
    : {};

  function handleInputKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      // Only swallow Escape while the panel is open — see SelectSearch.tsx's identical fix: one
      // Escape closes one thing. With the panel already closed, it must still reach an ancestor
      // modal so that modal can close.
      if (open) {
        e.stopPropagation();
        setOpen(false);
      }
      return;
    }
    if (!open && OPEN_KEYS.has(e.key)) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    onInputKeyDown?.(e);
  }

  const panelNode = open && (
    <div // NOSONAR - wrapper only forwards pointer/keyboard events for its popup; it is deliberately non-semantic
      ref={panelRef}
      id={panelId}
      role="presentation"
      style={portal ? panelStyle : undefined}
      // Stops a click on a day/month/year/time cell from ever blurring the text input above —
      // without this, mousedown on a cell fires the input's onBlur (which commits whatever raw
      // text is currently typed and closes the panel) *before* the cell's own onClick runs, so
      // the click either lands on an already-unmounted button or gets overridden by that stale
      // commit. This was the real cause behind "picking a month doesn't stick": the click mostly
      // did fire, it just kept losing a race to the input's own blur-driven commit.
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        "z-50 max-w-[calc(100vw-2rem)] animate-scale-in overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-elevated dark:border-slate-700 dark:bg-slate-900",
        panelPositionClass(portal, placement),
        panelClassName
      )}
    >
      <div className="max-h-[70vh] overflow-y-auto">{panel}</div>
    </div>
  );

  return (
    <FieldShell label={label} htmlFor={inputId} required={required} error={error} helperText={helperText} className={containerClassName} style={style}>
      <div ref={ref} className="relative">
        <div
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border text-sm shadow-sm transition",
            dense ? "px-2 py-1 text-xs" : "px-3 py-2",
            surfaceClass(inverted, !!error),
            disabled && !inverted && "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
            disabled && inverted && "cursor-not-allowed opacity-60"
          )}
        >
          <span className={inverted ? "text-white/70" : "text-slate-400"}>{icon}</span>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            aria-activedescendant={open ? activeDescendantId : undefined}
            aria-invalid={!!error}
            disabled={disabled}
            value={open ? inputValue : displayValue}
            placeholder={placeholder}
            onFocus={() => setOpen(true)}
            onChange={(e) => onInputChange?.(e.target.value)}
            onKeyDown={handleInputKey}
            // Tabbing away must close the panel too — otherwise a half-typed value that doesn't
            // parse (so the picker's own commit doesn't close it) left the panel stranded open
            // over the next field.
            onBlur={() => {
              onInputBlur?.();
              setOpen(false);
            }}
            className={cn(
              "w-full truncate bg-transparent text-left outline-none",
              inverted ? "placeholder:text-white/60" : "placeholder:text-slate-400 dark:placeholder:text-slate-500",
              "disabled:cursor-not-allowed"
            )}
          />
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            // Keep focus in the input (no blur-driven close racing this click), and focus it when
            // opening — so a mouse-opened panel is keyboard-drivable straight away too.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (open) {
                setOpen(false);
                return;
              }
              inputRef.current?.focus();
              setOpen(true);
            }}
            className="shrink-0 disabled:cursor-not-allowed"
            aria-label={open ? "Close" : "Open"}
          >
            <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", inverted ? "text-white/70" : "text-slate-400", open && "rotate-180")} />
          </button>
        </div>
        {!portal && panelNode}
      </div>
      {portal && panelNode && createPortal(panelNode, document.body)}
    </FieldShell>
  );
}
