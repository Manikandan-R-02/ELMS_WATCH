import { AlertTriangle, CheckCircle2, Circle, Clock, Info, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

export type BadgeStatus = "success" | "error" | "warning" | "info" | "neutral" | "pending";

const statusMeta: Record<BadgeStatus, { icon: LucideIcon; classes: string; dot: string }> = {
  success: {
    icon: CheckCircle2,
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20",
    dot: "bg-emerald-500",
  },
  error: {
    icon: XCircle,
    classes: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20",
    dot: "bg-red-500",
  },
  warning: {
    icon: AlertTriangle,
    classes: "bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-400/20",
    dot: "bg-yellow-500",
  },
  info: {
    icon: Info,
    classes: "bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-400/20",
    dot: "bg-brand-500",
  },
  pending: {
    icon: Clock,
    classes: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-400/20",
    dot: "bg-violet-500",
  },
  neutral: {
    icon: Circle,
    classes: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/10",
    dot: "bg-slate-400",
  },
};

export interface StatusBadgeProps {
  status: BadgeStatus;
  label: string;
  className?: string;
}

/** Badge with a status icon. */
export function StatusBadge({ status, label, className }: Readonly<StatusBadgeProps>) {
  const meta = statusMeta[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        meta.classes,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

/** Badge with a solid color dot instead of an icon — quieter, for dense tables. */
export function TextBadge({ status, label, className }: Readonly<StatusBadgeProps>) {
  const meta = statusMeta[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        meta.classes,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {label}
    </span>
  );
}
