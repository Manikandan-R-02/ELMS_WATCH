import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, Search } from "lucide-react";
import { cn } from "../../lib/cn";
import { lockScroll, unlockScroll } from "../../lib/scrollLock";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { useVisibleNavItems } from "../sidebar/navItems";
import { useCommandPaletteStore } from "../../store/commandPaletteStore";

/**
 * Global "jump to page" palette, opened with Ctrl/Cmd+K from anywhere in the app
 * (registered once here) or the header's shortcut button. A common pattern in
 * modern SaaS products (Linear, Vercel, GitHub) for fast keyboard-driven nav.
 */
export function CommandPalette() {
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);
  const navigate = useNavigate();
  const navItems = useVisibleNavItems();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return navItems;
    const q = query.toLowerCase();
    return navItems.filter((item) => item.label.toLowerCase().includes(q));
  }, [query, navItems]);

  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useCommandPaletteStore.getState().toggle();
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
      lockScroll();
      return () => unlockScroll();
    }
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  // Tab stays inside the palette (it has a single field — Tab used to drop focus into the page
  // behind the backdrop), and focus returns to where it was if the palette is dismissed.
  const panelRef = useRef<HTMLDialogElement>(null);
  useFocusTrap(open, panelRef);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  // Keep the highlighted result in view as arrows move through a list longer than the panel.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function go(path: string) {
    navigate(path);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[activeIndex];
      if (item) go(item.path);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-start justify-center px-4 pt-[15vh]">
      {/* Native button for the backdrop click; Escape already closes the palette, so tabIndex -1. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close"
        className="absolute inset-0 animate-fade-in bg-slate-900/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <dialog
        ref={panelRef}
        open
        aria-modal="true"
        aria-label="Jump to a screen"
        tabIndex={-1}
        className="relative w-full max-w-lg animate-scale-in overflow-hidden rounded-[var(--app-radius)] bg-white text-inherit shadow-elevated outline-none dark:bg-slate-900"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Jump to a screen..."
            aria-label="Jump to a screen"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          <kbd className="hidden shrink-0 rounded border border-slate-200 px-1.5 py-0.5 font-mono text-[0.65rem] text-slate-400 sm:inline dark:border-slate-700">
            Esc
          </kbd>
        </div>

        <ul // NOSONAR - custom listbox: a native <select> cannot offer search, grouping or this keyboard model
          ref={listRef}
          id={listId}
          className="max-h-80 overflow-y-auto p-2"
          role="listbox" // NOSONAR - custom listbox: a native <select> cannot offer search, grouping or this keyboard model
          aria-label="Screens"
        >
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-400">No matches</li>}
          {results.map((item, idx) => (
            // Native button per result (focus stays in the search box via aria-activedescendant).
            <li key={item.path} role="none">
              <button // NOSONAR - option of the custom listbox above; a native <option> cannot hold this button markup
                type="button"
                id={`${listId}-${idx}`}
                data-index={idx}
                role="option"
                tabIndex={-1}
                aria-selected={idx === activeIndex}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => go(item.path)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
                  idx === activeIndex
                    ? "bg-gradient-to-r from-brand-800 to-brand-600 text-white"
                    : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {idx === activeIndex && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 opacity-80" />}
              </button>
            </li>
          ))}
        </ul>
      </dialog>
    </div>,
    document.body
  );
}
