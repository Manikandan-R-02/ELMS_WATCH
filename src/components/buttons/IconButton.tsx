import { forwardRef, type ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import type { ButtonTone } from "./TextButton";

const toneClass: Record<ButtonTone, string> = {
  brand: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500/40",
  neutral: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 focus-visible:ring-slate-400/40",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/40",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500/40",
  warning: "bg-yellow-500 text-white hover:bg-yellow-600 focus-visible:ring-yellow-500/40",
  purple: "bg-purple-600 text-white hover:bg-purple-700 focus-visible:ring-purple-500/40",
  cyan: "bg-cyan-600 text-white hover:bg-cyan-700 focus-visible:ring-cyan-500/40",
  pink: "bg-pink-600 text-white hover:bg-pink-700 focus-visible:ring-pink-500/40",
  indigo: "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500/40",
};

const sizeClass = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const iconSizeClass = {
  sm: "h-3.5 w-3.5",
  md: "h-[1.125rem] w-[1.125rem]",
  lg: "h-5 w-5",
};

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  tone?: ButtonTone;
  size?: keyof typeof sizeClass;
  variant?: "solid" | "outline" | "ghost";
}

/** Classes for the non-solid variants (solid colours come from `toneClass`). */
const NON_SOLID_VARIANT_CLASS: Record<string, string> = {
  outline: "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
  ghost: "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
};

/** Fully-rounded, icon-only button. Always pass `label` for accessibility (used as aria-label + title). */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, label, tone = "brand", size = "md", variant = "solid", className, ...props }, ref) => {
    const variantClass = variant === "solid" ? toneClass[tone] : NON_SOLID_VARIANT_CLASS[variant];

    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center rounded-full transition focus:outline-none focus-visible:ring-4 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50",
          sizeClass[size],
          variantClass,
          className
        )}
        {...props}
      >
        <Icon className={iconSizeClass[size]} />
      </button>
    );
  }
);
IconButton.displayName = "IconButton";
