import { cn } from "../../lib/cn";

const sizeClass = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-9 w-9 border-[3px]",
};

export interface LoaderProps {
  size?: keyof typeof sizeClass;
  className?: string;
  label?: string;
}

export function Loader({ size = "md", className, label }: Readonly<LoaderProps>) {
  return (
    <output className="flex flex-col items-center gap-2" aria-live="polite">
      <span
        className={cn(
          "inline-block animate-spin rounded-full border-brand-200 border-t-brand-600 dark:border-slate-700 dark:border-t-brand-400",
          sizeClass[size],
          className
        )}
      />
      {label && <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>}
    </output>
  );
}
