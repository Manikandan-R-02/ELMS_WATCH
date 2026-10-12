import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "../../lib/cn";
import { useToastStore, type Toast, type ToastType } from "../../store/toastStore";

const TOAST_META: Record<ToastType, { icon: typeof CheckCircle2; iconClass: string; barClass: string }> = {
  success: {
    icon: CheckCircle2,
    iconClass: "bg-emerald-500 text-white",
    barClass: "bg-emerald-500",
  },
  error: {
    icon: XCircle,
    iconClass: "bg-red-500 text-white",
    barClass: "bg-red-500",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "bg-yellow-500 text-white",
    barClass: "bg-yellow-500",
  },
  info: {
    icon: Info,
    iconClass: "bg-brand-500 text-white",
    barClass: "bg-brand-500",
  },
};

/** Mount once near the app root. Trigger toasts from anywhere with showSuccessToast/showErrorToast/showWarningToast/showInfoToast. */
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="pointer-events-none fixed left-4 right-4 top-4 z-[300] flex flex-col gap-2.5 sm:left-auto sm:w-full sm:max-w-sm">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>,
    document.body
  );
}

function ToastItem({ toast, onDismiss }: Readonly<{ toast: Toast; onDismiss: () => void }>) {
  const meta = TOAST_META[toast.type];
  const Icon = meta.icon;
  const [leaving, setLeaving] = useState(false);

  function close() {
    setLeaving(true);
    setTimeout(onDismiss, 180);
  }

  useEffect(() => {
    const timer = setTimeout(close, toast.duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.duration]);

  return (
    <div
      className={cn(
        "pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl bg-white p-4 pb-3.5 shadow-elevated ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10",
        leaving ? "animate-toast-out" : "animate-toast-in"
      )}
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", meta.iconClass)}>
        <Icon className="h-[1.125rem] w-[1.125rem]" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{toast.description}</p>
        )}
      </div>
      <button
        onClick={close}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-100 dark:bg-slate-700/60">
        <div
          className={cn("h-full origin-left animate-toast-progress", meta.barClass)}
          style={{ animationDuration: `${toast.duration}ms` }}
        />
      </div>
    </div>
  );
}
