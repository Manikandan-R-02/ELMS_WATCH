import type { ReactNode } from "react";
import { HelpCircle, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

export interface PageHeaderBadge {
  icon?: LucideIcon;
  label: string;
}

export interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  badge?: PageHeaderBadge;
  /** Shows a small "?" button next to the title that opens the page's usage/help modal. */
  onHelp?: () => void;
  /** Save/Refresh/etc. action buttons rendered on the right — pass both the slide-button and
   * rounded-button variants' worth of markup (see GeneralSettingsPage for the sm:hidden / sm:flex pattern). */
  actions?: ReactNode;
  /** Forwarded to the outer element — e.g. a `data-tour` hook for the onboarding tour. */
  dataTour?: string;
  className?: string;
}

/**
 * The blue gradient hero header used at the top of every real product screen (see AGENTS.md's
 * `src/pages/screens/` convention) — icon bubble, title, optional help button and status badge on
 * the left, action buttons on the right. First extracted from GeneralSettingsPage; reuse this
 * instead of hand-rolling a new header block for each screen.
 */
export function PageHeader({ icon: Icon, title, badge, onHelp, actions, dataTour, className }: Readonly<PageHeaderProps>) {
  const BadgeIcon = badge?.icon;
  return (
    <div
      data-tour={dataTour}
      className={cn(
        "relative overflow-hidden rounded-t-[var(--app-radius)] bg-gradient-to-r from-brand-800 to-brand-600 px-2 py-2 text-white dark:from-brand-600 dark:to-brand-400 sm:px-5",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-semibold leading-tight sm:text-lg">{title}</h1>
              {onHelp && (
                <button
                  type="button"
                  onClick={onHelp}
                  aria-label="How to use this page"
                  title="How to use this page"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {badge && (
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white/90">
                {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
                {badge.label}
              </span>
            )}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
