import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Settings2 } from "lucide-react";
import { IconButton } from "../buttons/IconButton";
import { CheckboxOption } from "../fields/Checkbox";
import { useClickOutside } from "../../hooks/useClickOutside";

export interface ColumnVisibilityOption {
  key: string;
  label: string;
}

export interface ColumnVisibilityMenuProps {
  columns: ColumnVisibilityOption[];
  hiddenKeys: Set<string>;
  onChange: (next: Set<string>) => void;
  /** Tooltip / aria-label on the trigger button. */
  label?: string;
}

/**
 * A settings-gear button that opens a "customize columns" menu — a "Select all" master
 * checkbox plus one checkbox per column. Deliberately its own free-standing component (not
 * built into `Table` itself) so a screen can place the trigger wherever makes sense — e.g. a
 * shared toolbar row above several tabs' worth of tables — instead of it being pinned inside
 * one specific table's own card. That also sidesteps a real bug the in-table version had: the
 * panel is portaled to `document.body` and fixed-positioned against the trigger, so it can
 * never be clipped by a table card's `overflow-hidden` (which is exactly what happened when it
 * lived inside `Table`'s own wrapper — unchecking columns shrank that wrapper and the still-open
 * panel got cut off mid-list, seam through the rounded corner).
 */
export function ColumnVisibilityMenu({ columns, hiddenKeys, onChange, label = "Customize visible columns" }: Readonly<ColumnVisibilityMenuProps>) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  useClickOutside([triggerRef, panelRef], () => setOpen(false), open);

  // Escape closes the menu and returns focus to the trigger — `useClickOutside` only handles a
  // mouse click outside, so a keyboard-only user with the panel open had no way to dismiss it
  // short of tabbing all the way through every checkbox.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
      triggerButtonRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // This menu is right-aligned to the trigger with a fixed 240px width (not the shared hook's
  // default left-aligned/trigger-width layout), so the flip check is done locally below rather
  // than via useFlipPosition — same "flip up when no room below, and there's more room above"
  // rule as every other floating panel in the app.
  useLayoutEffect(() => {
    if (!open) return;
    function reposition() {
      const trigger = triggerRef.current;
      const panelEl = panelRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const panelWidth = 240;
      const panelHeight = panelEl?.offsetHeight ?? 0;
      const gap = 6;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < panelHeight + gap && rect.top > spaceBelow;
      setPanelStyle({
        position: "fixed",
        top: openUpward ? undefined : rect.bottom + gap,
        bottom: openUpward ? window.innerHeight - rect.top + gap : undefined,
        left: Math.min(rect.right - panelWidth, window.innerWidth - panelWidth - 8),
        width: panelWidth,
      });
    }
    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  const allVisible = hiddenKeys.size === 0;
  const noneVisible = hiddenKeys.size === columns.length;

  function toggleColumn(key: string, show: boolean) {
    const next = new Set(hiddenKeys);
    if (show) next.delete(key);
    else next.add(key);
    onChange(next);
  }

  return (
    <div ref={triggerRef} className="relative inline-flex">
      <IconButton ref={triggerButtonRef} icon={Settings2} label={label} variant="outline" tone="neutral" size="sm" onClick={() => setOpen((v) => !v)} />
      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={panelStyle}
            className="z-50 animate-scale-in overflow-hidden rounded-lg border border-slate-200 bg-white shadow-elevated dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
              <CheckboxOption
                checked={allVisible}
                indeterminate={!allVisible && !noneVisible}
                onChange={(show) => onChange(show ? new Set() : new Set(columns.map((c) => c.key)))}
                label={<span className="font-semibold">Select all</span>}
              />
            </div>
            <div className="max-h-64 space-y-0.5 overflow-y-auto p-2">
              {columns.map((col) => (
                <div key={col.key} className="rounded-md px-1 py-1 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <CheckboxOption checked={!hiddenKeys.has(col.key)} onChange={(show) => toggleColumn(col.key, show)} label={col.label} />
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
