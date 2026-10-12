/**
 * Shared keyboard conventions for every date/time picker. Focus never leaves the picker's text
 * input while its panel is open (the panel is often portaled to `document.body`, so tabbing into it
 * would jump focus to the end of the page) — instead the input's own keydown moves a highlighted
 * "active" cell around the grid, and the input points screen readers at it via
 * `aria-activedescendant`.
 */

/** Keys that reopen a closed picker from its focused input (after Escape, or after picking). */
export const OPEN_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp"]);

/** The highlighted-but-not-yet-picked cell. Layered on top of the selected style, so a cell can
 * visibly be both "current value" and "where the keyboard is". */
export const ACTIVE_CELL_CLASS = "ring-2 ring-brand-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-900";
