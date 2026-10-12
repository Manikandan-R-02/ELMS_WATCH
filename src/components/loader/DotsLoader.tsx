import { cn } from "../../lib/cn";

const sizeClass = {
  sm: "h-1 w-1",
  md: "h-1.5 w-1.5",
  lg: "h-2 w-2",
};

export interface DotsLoaderProps {
  size?: keyof typeof sizeClass;
  className?: string;
  label?: string;
}

/** Compact three-dot loader — an alternative to `Loader`'s spinner for very tight spaces (a table cell, a chat bubble, inline status text). */
export function DotsLoader({ size = "md", className, label }: Readonly<DotsLoaderProps>) {
  return (
    <output className={cn("inline-flex items-center gap-1", className)} aria-live="polite" aria-label={label ?? "Loading"}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn("animate-bounce rounded-full bg-brand-600 dark:bg-brand-400", sizeClass[size])}
          style={{ animationDelay: `${i * 0.12}s`, animationDuration: "0.8s" }}
        />
      ))}
    </output>
  );
}
