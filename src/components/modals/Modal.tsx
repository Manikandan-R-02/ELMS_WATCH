import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { lockScroll, unlockScroll } from "../../lib/scrollLock";
import { useFocusTrap } from "../../hooks/useFocusTrap";

/** Elements that already do something on Enter themselves — the modal's own Enter-to-confirm must
 * not fire on top of them (Enter on a focused "Cancel" used to cancel *and* confirm). */
const ENTER_HANDLED_BY_TARGET = new Set(["TEXTAREA", "BUTTON", "A", "SELECT"]);

const sizeClass = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  icon?: ReactNode;
  /** A large icon badge that floats above the card's top edge, overlapping it — the
   * enterprise "notification/confirmation" look (see StatusModals.tsx). When set, it
   * replaces the classic inline icon+title header row: `title` still renders, but as a
   * bold heading below the badge instead of beside a small icon. */
  hero?: ReactNode;
  size?: keyof typeof sizeClass;
  children?: ReactNode;
  footer?: ReactNode;
  closeOnBackdrop?: boolean;
  accentClassName?: string;
  /** Pressing Enter anywhere in the modal runs this — the keyboard equivalent of clicking its
   * primary action (e.g. "Apply"/"View details"/"Confirm"), so a reader who's finished filling
   * in a form of dropdowns doesn't have to reach for the mouse. Skipped automatically whenever a
   * field already used Enter for its own purpose first (an open `SelectSearch` panel selecting
   * its highlighted option, a date picker confirming a segment, …) — those call
   * `preventDefault()` on the key event, which this checks for, so the two behaviors never fire
   * on the same keystroke. Omit for a modal with no single obvious "confirm" action. */
  onEnter?: () => void;
}

export function Modal({
  open,
  onClose,
  title,
  icon,
  hero,
  size = "md",
  children,
  footer,
  closeOnBackdrop = true,
  accentClassName,
  onEnter,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // Focus moves into the dialog when it opens, Tab stays inside it, and focus goes back to whatever
  // opened it on close — without this a keyboard user was left on the trigger *behind* the
  // backdrop, tabbing through the page underneath. Escape is handled below with the Enter logic.
  // `focusFirstField`: a form modal opens with the cursor already in its first input / dropdown.
  useFocusTrap(open, dialogRef, { focusFirstField: true });

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Enter-to-confirm only when nothing else owns the key: not a textarea (newline), not a
      // focused button/link/select (it activates itself — Enter on "Cancel" must only cancel), and
      // not a field that already handled Enter (an open SelectSearch/date picker calls
      // `preventDefault()` when it picks its highlighted option).
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      if (e.key === "Enter" && onEnter && !e.defaultPrevented && !ENTER_HANDLED_BY_TARGET.has(tag)) {
        onEnter();
      }
    }
    document.addEventListener("keydown", onKey);
    lockScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockScroll();
    };
  }, [open, onClose, onEnter]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Native button so the click is keyboard-accessible; tabIndex -1 keeps it out of the tab order
          because Escape already closes the dialog. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close dialog"
        className="absolute inset-0 animate-fade-in bg-slate-900/50 backdrop-blur-sm dark:bg-black/70"
        onClick={closeOnBackdrop ? onClose : undefined}
        disabled={!closeOnBackdrop}
      />
      {/* Outer wrapper stays overflow-visible so the hero badge can overlap the card's
          top edge; the rounded/clipped surface is the nested div below. */}
      <dialog
        ref={dialogRef}
        open
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn("relative w-full animate-scale-in bg-transparent text-inherit outline-none", sizeClass[size])}
      >
        {hero && <div className="absolute -top-7 left-6 z-10">{hero}</div>}

        {/* `max-h-[85vh]` + `flex flex-col` caps the whole card to the viewport so it never
            spills off-screen on a short window; only the body scrolls (`overflow-y-auto`) —
            the hero/title and footer stay put, same as a native OS dialog. */}
        <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-[var(--app-radius)] bg-white shadow-elevated ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
          {accentClassName && !hero && <div className={cn("h-1.5 w-full shrink-0", accentClassName)} />}

          {hero ? (
            <>
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X className="h-[1.125rem] w-[1.125rem]" />
              </button>
              {title && (
                <div id={titleId} className="shrink-0 px-6 pb-1 pt-10 pr-10 text-xl font-bold leading-snug text-slate-900 dark:text-slate-50">
                  {title}
                </div>
              )}
            </>
          ) : (
            (title || icon) && (
              <div className="flex shrink-0 items-start gap-3.5 px-6 pt-6">
                {icon && <div className="shrink-0">{icon}</div>}
                <div id={titleId} className="flex-1 pt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  <X className="h-[1.125rem] w-[1.125rem]" />
                </button>
              </div>
            )
          )}

          <div className={cn("min-h-0 overflow-y-auto px-6 text-sm text-slate-600 dark:text-slate-300", hero ? "pb-5 pt-1" : "py-5")}>
            {children}
          </div>

          {footer && (
            <div
              className={cn(
                "shrink-0",
                hero
                  ? // Column on narrow screens — two `flex-1` buttons squeezed into a row can force a
                    // longer label to wrap, making the pair uneven height (see HelpCenterModal's
                    // "Restart tour" / "Got it" footer). Stacking full-width below `sm:` avoids that.
                    "flex flex-col gap-2.5 px-6 pb-6 pt-1 sm:flex-row sm:gap-3"
                  : "flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30"
              )}
            >
              {footer}
            </div>
          )}
        </div>
      </dialog>
    </div>,
    document.body
  );
}
