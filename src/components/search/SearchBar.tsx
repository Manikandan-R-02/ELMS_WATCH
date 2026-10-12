import { forwardRef, useId, useRef, useState, type InputHTMLAttributes } from "react";
import { Search, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { useClickOutside } from "../../hooks/useClickOutside";

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  /** "normal" is an always-open field; "slide" starts as a colored icon button and opens into a field on click/focus. */
  variant?: "normal" | "slide";
  /** Fixed width for the "normal" variant, or the expanded width for "slide" once open. */
  width?: number | string;
  tone?: "light" | "dark";
  /** Shown below the field in red; also forces the "slide" variant open so the message stays visible. */
  error?: string;
  /** Muted hint shown below the field when there's no error. */
  helperText?: string;
  containerClassName?: string;
}

type SearchTone = NonNullable<SearchBarProps["tone"]>;

/** Input colours: the error outline wins, then the tone (light by default). */
function fieldToneFor(hasError: boolean, tone: SearchTone): string {
  if (hasError) {
    return "bg-white text-slate-700 placeholder:text-slate-400 border border-red-400 focus:ring-2 focus:ring-red-500/20 dark:border-red-500/60 dark:bg-slate-900 dark:text-slate-200";
  }
  if (tone === "dark") {
    return "bg-white text-slate-700 placeholder:text-slate-400 border border-transparent focus:ring-2 focus:ring-white/50";
  }
  return "bg-white text-slate-700 placeholder:text-slate-400 border border-brand-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-brand-800 dark:bg-slate-900 dark:text-slate-200";
}

/** Search-icon colour: muted while the field is open, otherwise tone-dependent. */
function iconClassFor(open: boolean, tone: SearchTone): string {
  if (open) return "text-slate-400";
  return tone === "dark" ? "text-brand-600" : "text-white";
}

/** The round trigger button's colour when a slide-out search is collapsed. */
function closedTriggerClassFor(tone: SearchTone): string {
  return tone === "dark" ? "bg-white shadow-soft hover:bg-white/90" : "bg-brand-600 shadow-soft hover:bg-brand-700";
}

/** Input width and visibility: the slide variant is a 36px dot until it opens. */
function inputSizeClassFor(isSlide: boolean, open: boolean): string {
  if (!isSlide) return "w-full";
  return open ? "opacity-100 shadow-elevated" : "w-9 cursor-pointer opacity-0";
}

/** "light" tone is styled for placement on white/slate surfaces; "dark" tone is for colored/dark surfaces (e.g. an accent-colored header). */
export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      value,
      onChange,
      onClear,
      variant = "normal",
      width = 280,
      tone = "light",
      error,
      helperText,
      className,
      containerClassName,
      placeholder = "Search...",
      id,
      style,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const [expanded, setExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const isSlide = variant === "slide";
    const open = !isSlide || expanded || value.length > 0 || !!error;
    const closedTrigger = isSlide && !open;

    useClickOutside(
      containerRef,
      () => {
        if (isSlide && value.length === 0 && !error) setExpanded(false);
      },
      isSlide && expanded
    );

    const openFieldToneClass = fieldToneFor(!!error, tone);
    const iconToneClass = iconClassFor(open, tone);

    return (
      <div className={cn(!isSlide && "inline-flex flex-col gap-1.5")} style={isSlide ? undefined : { width, ...style }}>
        <div ref={containerRef} className={cn("relative flex items-center", containerClassName)} style={isSlide ? style : undefined}>
          {/* A real button: clicking it opens a slide-out field and focuses the input. */}
          <button
            type="button"
            aria-label="Search"
            tabIndex={isSlide && !open ? 0 : -1}
            onClick={() => {
              if (isSlide) setExpanded(true);
              document.getElementById(inputId)?.focus();
            }}
            className={cn(
              "absolute left-0 z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
              iconToneClass,
              closedTrigger && closedTriggerClassFor(tone),
              isSlide && "cursor-pointer"
            )}
          >
            <Search className="h-4 w-4" />
          </button>
          <input
            ref={ref}
            id={inputId}
            type="text"
            value={value}
            placeholder={placeholder}
            aria-label={placeholder ?? "Search"}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => isSlide && setExpanded(true)}
            aria-invalid={!!error}
            className={cn(
              "h-9 rounded-full pl-9 pr-8 text-sm outline-none transition-all duration-300 ease-out",
              openFieldToneClass,
              inputSizeClassFor(isSlide, open),
              className
            )}
            style={isSlide ? { width: open ? width : 36 } : undefined}
            {...props}
          />
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                onClear?.();
              }}
              aria-label="Clear search"
              className="absolute right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:opacity-70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-400 dark:text-slate-500">{helperText}</p>}
      </div>
    );
  }
);
SearchBar.displayName = "SearchBar";
