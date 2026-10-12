import { AlertCircle } from "lucide-react";

export interface FormErrorBannerProps {
  message: string;
}

/**
 * A modal/form-level error banner — the same markup `ChangePasswordModal` introduced, now shared
 * so every submit-failure banner across the app (Add/Modify User, Reset Password, and any future
 * form modal) stays visually and structurally identical instead of being copy-pasted per file.
 */
export function FormErrorBanner({ message }: Readonly<FormErrorBannerProps>) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 animate-error-slide-in dark:border-red-900 dark:bg-red-500/10"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
        <AlertCircle className="h-4 w-4" />
      </span>
      <p className="text-xs text-red-600 dark:text-red-400">{message}</p>
    </div>
  );
}
