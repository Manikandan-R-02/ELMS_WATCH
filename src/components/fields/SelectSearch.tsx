import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { useClickOutside } from "../../hooks/useClickOutside";
import { useFlipPosition } from "../../hooks/useFlipPosition";
import { FieldShell, fieldBaseClass, fieldBorderClass } from "./FieldShell";

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface SelectSearchProps<T = string> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption<T>[];
  value?: T | null;
  onChange: (value: T | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  required?: boolean;
  /** Autofocus the search input the moment the dropdown opens. Default true. */
  autoFocusSearch?: boolean;
  emptyMessage?: string;
  containerClassName?: string;
  /** Inline style applied to the outer field wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
  /** Render the option panel into `document.body`, fixed-positioned against the trigger — use inside
   * a modal body, table cell, or any scrolling/clipping ancestor so the panel isn't cut off (see
   * DatePicker/MonthPicker's own `portal` prop for the same pattern). Default false. */
  portal?: boolean;
  /** Hide the search input row — for a short, fixed option list (e.g. a page-size picker) where
   * typing to filter only adds a step. Arrow keys/Enter/Escape still work: the trigger button
   * itself takes over the same `handleKeyDown` the search input would otherwise own. Default true. */
  searchable?: boolean;
}

export function SelectSearch<T = string>({
  label,
  error,
  helperText,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  disabled,
  clearable = true,
  required,
  autoFocusSearch = true,
  emptyMessage = "No results found",
  containerClassName,
  style,
  portal = false,
  searchable = true,
}: Readonly<SelectSearchProps<T>>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const autoId = useId();
  const listId = useId();

  useClickOutside(portal ? [containerRef, panelRef] : containerRef, () => setOpen(false), open);

  const { placement, panelStyle } = useFlipPosition({ open, triggerRef: containerRef, panelRef, portal });

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selected = options.find((o) => o.value === value) ?? null;

  useEffect(() => {
    if (open && searchable && autoFocusSearch) {
      const raf = requestAnimationFrame(() => searchRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
    if (!open) setQuery("");
  }, [open, searchable, autoFocusSearch]);

  // Opening starts the highlight on the current value (so Enter straight away keeps it); typing a
  // search resets it to the first match.
  useEffect(() => {
    if (!open) return;
    const selectedIndex = filtered.findIndex((o) => o.value === value);
    setActiveIndex(!query && selectedIndex >= 0 ? selectedIndex : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  // Keep the keyboard highlight in view as it moves through a long, scrolling list.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  /** Closing from inside the (often portaled) panel must hand focus back to the trigger — the
   * search box that had it is about to unmount, which otherwise drops focus onto `<body>` and
   * leaves a keyboard user with no idea where they are. */
  function closeAndFocusTrigger() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function selectOption(option: SelectOption<T>) {
    if (option.disabled) return;
    onChange(option.value);
    closeAndFocusTrigger();
  }

  /** Next enabled option index in `direction`, or the current one if there isn't one. */
  function stepActive(from: number, direction: 1 | -1) {
    for (let i = from + direction; i >= 0 && i < filtered.length; i += direction) {
      if (!filtered[i].disabled) return i;
    }
    return from;
  }

  // Tab closes the panel and returns focus to the trigger *without* preventDefault — the browser
  // then performs this same Tab from the trigger, landing on the next field as expected.
  function handleTabKey() {
    if (!open) return;
    setOpen(false);
    if (document.activeElement !== triggerRef.current) triggerRef.current?.focus();
  }

  // While closed, only the keys that open the panel are handled. Anything else (notably Escape)
  // is left alone so an enclosing Modal still receives it.
  function handleClosedKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  function handleOpenKey(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => stepActive(i, 1));
        return;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => stepActive(i, -1));
        return;
      case "Home":
        e.preventDefault();
        setActiveIndex(stepActive(-1, 1));
        return;
      case "End":
        e.preventDefault();
        setActiveIndex(stepActive(filtered.length, -1));
        return;
      case "Enter": {
        e.preventDefault();
        const opt = filtered[activeIndex];
        if (opt) selectOption(opt);
        return;
      }
      case "Escape":
        // Stop this Escape from also closing an ancestor (e.g. a `Modal` this field lives
        // inside) in the same keystroke — one Escape should close one thing at a time.
        e.stopPropagation();
        closeAndFocusTrigger();
        return;
      default:
        // Typing while focus is still on the trigger (e.g. `autoFocusSearch={false}`) moves into
        // the search box — the keystroke itself then lands there, so no character is lost.
        if (searchable && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement !== searchRef.current) {
          searchRef.current?.focus();
        }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Tab") handleTabKey();
    else if (open) handleOpenKey(e);
    else handleClosedKey(e);
  }

  const panelNode = open && (
    <div
      ref={panelRef}
      style={portal ? panelStyle : undefined}
      className={cn(
        "w-full animate-scale-in overflow-hidden rounded-lg border border-slate-200 bg-white shadow-elevated dark:border-slate-700 dark:bg-slate-900",
        // Portaled to document.body as a sibling of Modal's own z-[200] portal — needs to
        // outrank that (and the toast/command-palette layers above it) to actually show up
        // when opened from inside a modal. Non-portal stays z-20, scoped to its own field.
        portal ? "fixed z-[250]" : "absolute z-20",
        // Flips above the trigger when there isn't room below (and there's more room above) —
        // see useFlipPosition. Portal mode positions via panelStyle instead of these classes.
        !portal && (placement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5")
      )}
    >
      {searchable && (
        <div className="relative border-b border-slate-100 p-2 dark:border-slate-800">
          <Search className="pointer-events-none absolute left-[1.125rem] top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            aria-controls={listId}
            aria-activedescendant={filtered[activeIndex] ? `${listId}-${activeIndex}` : undefined}
            className="w-full rounded-md bg-slate-50 py-1.5 pl-7 pr-2 text-sm outline-none placeholder:text-slate-400 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      )}
      <ul // NOSONAR - custom listbox: a native <select> cannot offer search, grouping or this keyboard model
        ref={listRef}
        id={listId}
        className="max-h-56 overflow-y-auto p-1"
        role="listbox" // NOSONAR - custom listbox: a native <select> cannot offer search, grouping or this keyboard model
        aria-label={label ?? placeholder}
      >
        {filtered.length === 0 && <li className="px-3 py-2 text-sm text-slate-400">{emptyMessage}</li>}
        {filtered.map((option, idx) => (
          // Native button for each option (focus stays on the input via aria-activedescendant, so
          // tabIndex -1 keeps these out of the Tab order); the li is presentational only.
          <li key={String(option.value)} role="none">
            <button // NOSONAR - option of the custom listbox above; a native <option> cannot hold this button markup
              type="button"
              id={`${listId}-${idx}`}
              data-index={idx}
              role="option"
              tabIndex={-1}
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => selectOption(option)}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200",
                idx === activeIndex && "bg-brand-50 dark:bg-brand-500/10",
                option.disabled && "cursor-not-allowed opacity-40"
              )}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && <Check className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <FieldShell label={label} htmlFor={autoId} required={required} error={error} helperText={helperText} className={containerClassName} style={style}>
      <div ref={containerRef} className="relative">
        <button
          ref={triggerRef}
          id={autoId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          // Focus stays here while open when there's no search box (or `autoFocusSearch` is off),
          // so the trigger must drive the list itself in those cases.
          aria-activedescendant={open && !searchable && filtered[activeIndex] ? `${listId}-${activeIndex}` : undefined}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={handleKeyDown}
          className={cn(
            fieldBaseClass,
            fieldBorderClass(error),
            "flex items-center justify-between gap-2 text-left",
            clearable && selected && !disabled && "pr-14"
          )}
        >
          <span className={cn("truncate", !selected && "text-slate-400")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className="pointer-events-none h-4 w-4 shrink-0 text-slate-400 transition-transform data-[open=true]:rotate-180" data-open={open} />
        </button>
        {clearable && selected && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            aria-label="Clear selection"
            className="absolute right-8 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {!portal && panelNode}
      </div>
      {portal && panelNode && createPortal(panelNode, document.body)}
    </FieldShell>
  );
}
