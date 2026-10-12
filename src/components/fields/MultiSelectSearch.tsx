import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { useClickOutside } from "../../hooks/useClickOutside";
import { useFlipPosition } from "../../hooks/useFlipPosition";
import { FieldShell, fieldBaseClass, fieldBorderClass } from "./FieldShell";
import type { SelectOption } from "./SelectSearch";

export interface MultiSelectSearchProps<T = string> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** Autofocus the search input the moment the dropdown opens. Default true. */
  autoFocusSearch?: boolean;
  emptyMessage?: string;
  /** Show selected items as removable chips inside the trigger instead of a "N selected" count. Default true. */
  showChips?: boolean;
  /** Cap how many chips render before collapsing the rest into a "+N" badge. */
  maxVisibleChips?: number;
  containerClassName?: string;
  /** Inline style applied to the outer field wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
}

/** Multi-select dropdown with a search field built into the open panel — same interaction model as SelectSearch, but for T[] instead of T | null. */
export function MultiSelectSearch<T = string>({
  label,
  error,
  helperText,
  options,
  value,
  onChange,
  placeholder = "Select options",
  searchPlaceholder = "Search...",
  disabled,
  required,
  autoFocusSearch = true,
  emptyMessage = "No results found",
  showChips = true,
  maxVisibleChips = 3,
  containerClassName,
  style,
}: Readonly<MultiSelectSearchProps<T>>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const autoId = useId();
  const listId = useId();

  useClickOutside(containerRef, () => setOpen(false), open);
  const { placement } = useFlipPosition({ open, triggerRef: containerRef, panelRef });

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selectedOptions = useMemo(() => options.filter((o) => value.includes(o.value)), [options, value]);

  useEffect(() => {
    if (open && autoFocusSearch) {
      const raf = requestAnimationFrame(() => searchRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
    if (!open) setQuery("");
  }, [open, autoFocusSearch]);

  useEffect(() => setActiveIndex(0), [query, open]);

  // Keep the keyboard highlight in view as it moves through a long, scrolling list.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  /** Escape unmounts the search box that has focus — hand focus back to the trigger instead of
   * letting it fall to `<body>` (same fix as SelectSearch). */
  function closeAndFocusTrigger() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function toggleOption(option: SelectOption<T>) {
    if (option.disabled) return;
    const isSelected = value.includes(option.value);
    onChange(isSelected ? value.filter((v) => v !== option.value) : [...value, option.value]);
  }

  function removeValue(v: T) {
    onChange(value.filter((x) => x !== v));
  }

  // Selects every *currently filtered* option (so typing a search query and hitting "Select
  // all" selects just those matches, not the entire list) — merged with whatever's already
  // selected rather than replacing it, so it composes with a prior selection instead of
  // clobbering it.
  function selectAllFiltered() {
    const selectable = filtered.filter((o) => !o.disabled).map((o) => o.value);
    onChange(Array.from(new Set([...value, ...selectable])));
  }
  const allFilteredSelected = filtered.length > 0 && filtered.every((o) => o.disabled || value.includes(o.value));

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      // Trigger focused with the panel closed: arrows open it, same as SelectSearch. Everything
      // else (notably Escape) is left alone so an enclosing Modal still gets it.
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt) toggleOption(opt);
    } else if (e.key === "Escape") {
      // See SelectSearch.tsx's identical fix — stops this Escape from also closing an
      // ancestor modal in the same keystroke.
      e.stopPropagation();
      closeAndFocusTrigger();
    } else if (e.key === "Backspace" && query === "" && selectedOptions.length > 0) {
      const lastSelected = selectedOptions.at(-1);
      if (lastSelected) removeValue(lastSelected.value);
    }
  }

  const visibleChips = selectedOptions.slice(0, maxVisibleChips);
  const hiddenCount = selectedOptions.length - visibleChips.length;

  return (
    <FieldShell label={label} htmlFor={autoId} required={required} error={error} helperText={helperText} className={containerClassName} style={style}>
      <div // NOSONAR - wrapper only tracks hover/focus to show its popup; it is not an interactive control itself
        ref={containerRef}
        className="relative"
        // Tabbing past the panel's last control (or Shift+Tab out the top) closes it, instead of
        // leaving it open over the next field — the panel isn't portaled, so "focus left this
        // whole widget" is exactly "focus left the container".
        onBlur={(e) => {
          if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
        }}
      >
        <button
          ref={triggerRef}
          id={autoId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onKeyDown={handleKeyDown}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            fieldBaseClass,
            fieldBorderClass(error),
            "flex min-h-[2.5rem] w-full flex-wrap items-center gap-1.5 py-1.5 text-left"
          )}
        >
          {selectedOptions.length === 0 && <span className="text-slate-400">{placeholder}</span>}

          {showChips ? (
            <>
              {visibleChips.map((opt) => (
                <span
                  key={String(opt.value)}
                  className="flex items-center gap-1 rounded-md bg-brand-50 py-0.5 pl-2 pr-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                >
                  {opt.label}
                  {/* Mouse-only shortcut. It sits *inside* the trigger <button>, where a second
                      focusable control is invalid HTML (rule 16) and isn't even announced — the
                      keyboard way to remove a value is Backspace in the search box, or toggling
                      the option off in the list. */}
                  <span
                    aria-hidden="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeValue(opt.value);
                    }}
                    className="cursor-pointer rounded-full p-0.5 hover:bg-brand-100 dark:hover:bg-brand-500/20"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </span>
              ))}
              {hiddenCount > 0 && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  +{hiddenCount}
                </span>
              )}
            </>
          ) : (
            selectedOptions.length > 0 && (
              <span className="text-slate-700 dark:text-slate-200">{selectedOptions.length} selected</span>
            )
          )}

          <ChevronDown className={cn("ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          // z-50, not z-20 — a table's sticky header/columns and scroll chevrons (see Table.tsx)
          // can sit as high as z-30 right below a field like this one (e.g. the "Comparison
          // months" picker above the Month Comparison table), which at z-20 let the table's
          // sticky bits render on top of this open dropdown instead of under it.
          // Flips above the trigger when there isn't room below (and there's more room above) —
          // see useFlipPosition.
          <div
            ref={panelRef}
            className={cn(
              "absolute z-50 w-full animate-scale-in overflow-hidden rounded-lg border border-slate-200 bg-white shadow-elevated dark:border-slate-700 dark:bg-slate-900",
              placement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
            )}
          >
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

            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5 text-xs text-slate-400 dark:border-slate-800">
              <span>{value.length} selected</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={allFilteredSelected}
                  onClick={selectAllFiltered}
                  className="font-medium text-brand-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400"
                >
                  Select all
                </button>
                <button
                  type="button"
                  disabled={value.length === 0}
                  onClick={() => onChange([])}
                  className="font-medium text-brand-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400"
                >
                  Clear all
                </button>
              </div>
            </div>

            <ul // NOSONAR - custom listbox: a native <select> cannot offer search, grouping or this keyboard model
              ref={listRef}
              id={listId}
              className="max-h-56 overflow-y-auto p-1"
              role="listbox" // NOSONAR - custom listbox: a native <select> cannot offer search, grouping or this keyboard model
              aria-multiselectable="true"
              aria-label={label ?? placeholder}
            >
              {filtered.length === 0 && <li className="px-3 py-2 text-sm text-slate-400">{emptyMessage}</li>}
              {filtered.map((option, idx) => {
                const isSelected = value.includes(option.value);
                return (
                  <li key={String(option.value)} role="none">
                  <button // NOSONAR - option of the custom listbox above; a native <option> cannot hold this button markup
                    type="button"
                    id={`${listId}-${idx}`}
                    data-index={idx}
                    role="option"
                    tabIndex={-1}
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => toggleOption(option)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200",
                      idx === activeIndex && "bg-brand-50 dark:bg-brand-500/10",
                      option.disabled && "cursor-not-allowed opacity-40"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        isSelected
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </FieldShell>
  );
}
