import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, HelpCircle, Info, ShieldAlert, XCircle, type LucideIcon } from "lucide-react";
import { Modal } from "./Modal";
import { TextButton, type ButtonTone } from "../buttons/TextButton";
import { cn } from "../../lib/cn";

export interface StatusModalDetail {
  label: string;
  value: ReactNode;
}

export interface StatusModalListItem {
  label: string;
  sublabel?: string;
}

export interface StatusModalList {
  heading: string;
  items: StatusModalListItem[];
}

const AVATAR_COLORS = [
  "bg-brand-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-cyan-500",
];

interface StatusModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  /** A short, high-visibility callout rendered just below the title — e.g. "Check your inbox
   * for an email with the details." Renders as a tone-tinted banner, not a plain line of text. */
  banner?: ReactNode;
  /** Extra label/value rows rendered in a two-column grid below `children` — for a status that
   * needs to show more context than a one-line message (date/time, an error code, a record count). */
  details?: StatusModalDetail[];
  /** An optional named list of avatar rows below `details` — e.g. attendees, affected users. */
  list?: StatusModalList;
  /** Extra content/actions rendered in the footer, alongside the default action button. */
  footer?: ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
}

function heroIcon(bgClassName: string, Icon: LucideIcon) {
  return (
    <span
      className={cn(
        "flex h-14 w-14 animate-modal-icon-pop items-center justify-center rounded-2xl shadow-lg ring-4 ring-white dark:ring-slate-900",
        bgClassName
      )}
    >
      <Icon className="h-7 w-7 text-white" />
    </span>
  );
}

function Banner({ tone, icon: Icon, children }: Readonly<{ tone: "danger" | "warning" | "brand" | "success"; icon: LucideIcon; children: ReactNode }>) {
  const toneClass = {
    danger: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    warning: "bg-yellow-50 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400",
    brand: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  }[tone];
  return (
    <div className={cn("mt-3 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium", toneClass)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function DetailGrid({ details }: Readonly<{ details: StatusModalDetail[] }>) {
  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
      {details.map((d) => (
        <div key={d.label} className="min-w-0">
          <dt className="text-caption">{d.label}</dt>
          <dd className="mt-0.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{d.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function AvatarList({ list }: Readonly<{ list: StatusModalList }>) {
  return (
    <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
      <p className="text-caption">{list.heading}</p>
      <ul className="mt-2 space-y-2">
        {list.items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white",
                AVATAR_COLORS[i % AVATAR_COLORS.length]
              )}
            >
              {item.label.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
              {item.label}
              {item.sublabel && <span className="ml-1.5 font-normal text-slate-400 dark:text-slate-500">{item.sublabel}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExtraContent({ details, list }: Readonly<{ details?: StatusModalDetail[]; list?: StatusModalList }>) {
  return (
    <>
      {details && details.length > 0 && <DetailGrid details={details} />}
      {list && list.items.length > 0 && <AvatarList list={list} />}
    </>
  );
}

/** Full-width, pill-shaped footer buttons — the enterprise-notification look (see the reference
 * design in StatusModals' consumers) uses two equal-width buttons rather than right-aligned ones. */
function pillFooterButton(tone: ButtonTone, variant: "solid" | "outline", label: ReactNode, onClick?: () => void, disabled?: boolean, loading?: boolean) {
  return (
    <TextButton
      variant={variant}
      tone={tone}
      size="lg"
      className="flex-1 rounded-full"
      onClick={onClick}
      disabled={disabled}
      loading={loading}
    >
      {label}
    </TextButton>
  );
}

export function SuccessModal({
  open,
  onClose,
  title = "Success",
  children = "Your changes were saved successfully.",
  banner,
  details,
  list,
  footer,
  primaryActionLabel = "Done",
  onPrimaryAction,
}: Readonly<StatusModalProps>) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      onEnter={onPrimaryAction ?? onClose}
      title={title}
      hero={heroIcon("bg-emerald-500", CheckCircle2)}
      footer={
        footer ?? (
          <>
            {pillFooterButton("neutral", "outline", "Close", onClose)}
            {pillFooterButton("success", "solid", primaryActionLabel, onPrimaryAction ?? onClose)}
          </>
        )
      }
    >
      {children}
      {banner && <Banner tone="success" icon={CheckCircle2}>{banner}</Banner>}
      <ExtraContent details={details} list={list} />
    </Modal>
  );
}

export function FailureModal({
  open,
  onClose,
  title = "Something went wrong",
  children = "We couldn't complete your request. Please try again.",
  banner,
  details,
  list,
  footer,
  primaryActionLabel = "Try again",
  onPrimaryAction,
}: Readonly<StatusModalProps>) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      onEnter={onPrimaryAction}
      title={title}
      hero={heroIcon("bg-red-500", XCircle)}
      footer={
        footer ?? (
          <>
            {pillFooterButton("neutral", "outline", "Close", onClose)}
            {pillFooterButton("danger", "solid", primaryActionLabel, onPrimaryAction)}
          </>
        )
      }
    >
      {children}
      {banner && <Banner tone="danger" icon={AlertTriangle}>{banner}</Banner>}
      <ExtraContent details={details} list={list} />
    </Modal>
  );
}

export function WarningModal({
  open,
  onClose,
  title = "Are you sure?",
  children = "This action may have consequences that cannot be undone.",
  banner,
  details,
  list,
  footer,
  primaryActionLabel = "Continue",
  onPrimaryAction,
}: Readonly<StatusModalProps>) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      onEnter={onPrimaryAction}
      title={title}
      hero={heroIcon("bg-yellow-500", AlertTriangle)}
      footer={
        footer ?? (
          <>
            {pillFooterButton("neutral", "outline", "Cancel", onClose)}
            {pillFooterButton("warning", "solid", primaryActionLabel, onPrimaryAction)}
          </>
        )
      }
    >
      {children}
      {banner && <Banner tone="warning" icon={AlertTriangle}>{banner}</Banner>}
      <ExtraContent details={details} list={list} />
    </Modal>
  );
}

export function InfoModal({
  open,
  onClose,
  title = "Good to know",
  children,
  banner,
  details,
  list,
  footer,
  primaryActionLabel = "Got it",
  onPrimaryAction,
}: Readonly<StatusModalProps>) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      onEnter={onPrimaryAction ?? onClose}
      title={title}
      hero={heroIcon("bg-brand-500", Info)}
      footer={footer ?? pillFooterButton("brand", "solid", primaryActionLabel, onPrimaryAction ?? onClose)}
    >
      {children}
      {banner && <Banner tone="brand" icon={Info}>{banner}</Banner>}
      <ExtraContent details={details} list={list} />
    </Modal>
  );
}

export interface SessionModalProps {
  open: boolean;
  /** Manual "Log out now" action — also fired if the countdown is dismissed early. */
  onClose: () => void;
  /** Called once the countdown reaches zero — wire this to `navigate(ROUTES.login)`. */
  onExpire: () => void;
  title?: string;
  children?: ReactNode;
  /** Extra callout below the message — see `StatusModalProps.banner`. */
  banner?: ReactNode;
  /** Seconds shown/counted down before `onExpire` fires. Defaults to 7. */
  countdownSeconds?: number;
  logoutLabel?: string;
}

/**
 * There's no "stay signed in" escape hatch by design — once the session has actually expired
 * (or is forced to for inactivity), the only choices are wait for the automatic redirect or log
 * out immediately. `closeOnBackdrop={false}` for the same reason — this isn't dismissible by
 * clicking away.
 */
export function SessionModal({
  open,
  onClose,
  onExpire,
  title = "Session expiring",
  children = "Your session has expired due to inactivity.",
  banner,
  countdownSeconds = 7,
  logoutLabel = "Log out now",
}: Readonly<SessionModalProps>) {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);

  useEffect(() => {
    if (!open) return;
    setSecondsLeft(countdownSeconds);
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [open, countdownSeconds]);

  useEffect(() => {
    if (open && secondsLeft === 0) onExpire();
  }, [open, secondsLeft, onExpire]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeOnBackdrop={false}
      title={title}
      hero={heroIcon("bg-slate-500 dark:bg-slate-600", ShieldAlert)}
      footer={pillFooterButton("neutral", "outline", logoutLabel, onClose)}
    >
      {children}
      {banner && <Banner tone="warning" icon={AlertTriangle}>{banner}</Banner>}
      <div className="mt-3 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
        <div
          key={open ? "running" : "idle"}
          className="h-1 origin-left animate-toast-progress bg-slate-500 dark:bg-slate-400"
          style={{ animationDuration: `${countdownSeconds * 1000}ms` }}
        />
      </div>
      <p className="mt-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
        Redirecting to login in {secondsLeft}s...
      </p>
    </Modal>
  );
}

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  children?: ReactNode;
  /** A short, high-visibility callout below the title — see `StatusModalProps.banner`. */
  banner?: ReactNode;
  /** Extra label/value rows rendered below `children` — see `StatusModalDetail`. */
  details?: StatusModalDetail[];
  /** An optional named list of avatar rows below `details` — see `StatusModalList`. */
  list?: StatusModalList;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Use "danger" only for destructive confirmations (delete, remove, revoke). Defaults to "brand" (blue) to
   * match the rest of the app's white-and-blue surfaces; "purple" remains available for a one-off screen that
   * wants a routine confirmation to visually stand apart from primary brand actions. */
  tone?: "brand" | "purple" | "danger";
  loading?: boolean;
}

const CONFIRM_TONE: Record<"brand" | "purple" | "danger", { bg: string; button: ButtonTone }> = {
  brand: { bg: "bg-brand-500", button: "brand" },
  purple: { bg: "bg-purple-500", button: "purple" },
  danger: { bg: "bg-red-500", button: "danger" },
};

/** Generic Yes/No confirmation dialog — use for destructive or consequential actions. */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Please confirm",
  children = "Are you sure you want to proceed with this action?",
  banner,
  details,
  list,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "brand",
  loading,
}: Readonly<ConfirmModalProps>) {
  const t = CONFIRM_TONE[tone];
  return (
    <Modal
      open={open}
      onClose={onClose}
      onEnter={loading ? undefined : onConfirm}
      title={title}
      hero={heroIcon(t.bg, HelpCircle)}
      footer={
        <>
          {pillFooterButton("neutral", "outline", cancelLabel, onClose, loading)}
          {pillFooterButton(t.button, "solid", confirmLabel, onConfirm, loading, loading)}
        </>
      }
    >
      {children}
      {banner && <Banner tone={tone === "danger" ? "danger" : "brand"} icon={AlertTriangle}>{banner}</Banner>}
      <ExtraContent details={details} list={list} />
    </Modal>
  );
}
