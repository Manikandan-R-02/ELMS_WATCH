import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Loader } from "../loader/Loader";

export type ButtonVariant = "solid" | "outline" | "ghost" | "link";
export type ButtonTone = "brand" | "neutral" | "danger" | "success" | "warning" | "purple" | "cyan" | "pink" | "indigo";
export type ButtonSize = "sm" | "md" | "lg";

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

const variantClass: Record<ButtonVariant, Record<ButtonTone, string>> = {
  solid: {
    brand: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500/40",
    neutral: "bg-slate-800 text-white hover:bg-slate-900 focus-visible:ring-slate-500/40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
    danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/40",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500/40",
    warning: "bg-yellow-500 text-white hover:bg-yellow-600 focus-visible:ring-yellow-500/40",
    purple: "bg-purple-600 text-white hover:bg-purple-700 focus-visible:ring-purple-500/40",
    cyan: "bg-cyan-600 text-white hover:bg-cyan-700 focus-visible:ring-cyan-500/40",
    pink: "bg-pink-600 text-white hover:bg-pink-700 focus-visible:ring-pink-500/40",
    indigo: "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500/40",
  },
  outline: {
    brand: "border border-brand-300 text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-500/10",
    neutral: "border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800",
    danger: "border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-500/10",
    success: "border border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-500/10",
    warning: "border border-yellow-300 text-yellow-600 hover:bg-yellow-50 dark:border-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-500/10",
    purple: "border border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-500/10",
    cyan: "border border-cyan-300 text-cyan-600 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-400 dark:hover:bg-cyan-500/10",
    pink: "border border-pink-300 text-pink-600 hover:bg-pink-50 dark:border-pink-800 dark:text-pink-400 dark:hover:bg-pink-500/10",
    indigo: "border border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-500/10",
  },
  ghost: {
    brand: "text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10",
    neutral: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
    danger: "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10",
    success: "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10",
    warning: "text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-500/10",
    purple: "text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-500/10",
    cyan: "text-cyan-600 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-500/10",
    pink: "text-pink-600 hover:bg-pink-50 dark:text-pink-400 dark:hover:bg-pink-500/10",
    indigo: "text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10",
  },
  link: {
    brand: "text-brand-600 underline-offset-4 hover:underline dark:text-brand-400",
    neutral: "text-slate-600 underline-offset-4 hover:underline dark:text-slate-300",
    danger: "text-red-600 underline-offset-4 hover:underline dark:text-red-400",
    success: "text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400",
    warning: "text-yellow-600 underline-offset-4 hover:underline dark:text-yellow-400",
    purple: "text-purple-600 underline-offset-4 hover:underline dark:text-purple-400",
    cyan: "text-cyan-600 underline-offset-4 hover:underline dark:text-cyan-400",
    pink: "text-pink-600 underline-offset-4 hover:underline dark:text-pink-400",
    indigo: "text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400",
  },
};

export interface TextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export const TextButton = forwardRef<HTMLButtonElement, TextButtonProps>(
  (
    {
      variant = "solid",
      tone = "brand",
      size = "md",
      leadingIcon,
      trailingIcon,
      loading,
      fullWidth,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center rounded-lg font-medium transition focus:outline-none focus-visible:ring-4 active:scale-95",
          sizeClass[size],
          variant !== "link" && variantClass[variant][tone],
          variant === "link" && variantClass.link[tone],
          fullWidth && "w-full",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {loading ? <Loader size="sm" className="!border-current/30 !border-t-current" /> : leadingIcon}
        {children}
        {!loading && trailingIcon}
      </button>
    );
  }
);
TextButton.displayName = "TextButton";
