import { useId, type CSSProperties } from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/cn";
import { FieldShell, fieldBorderClass } from "./FieldShell";

export const DEFAULT_COLOR_SWATCHES = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#64748b", "#0f172a",
];

function isValidHex(v: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);
}

export interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  /** Preset swatches shown above the custom picker. Default: a curated 18-color palette. */
  swatches?: string[];
  /** Show the native OS color picker + editable hex field below the swatches. Default true. */
  allowCustom?: boolean;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  /** Inline style applied to the outer wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
}

/** Swatch grid + optional native color input/hex field, for tagging, labels, or theme-style pickers — not tied to the app's own accent color (see `accentColors.ts` for that). */
export function ColorPicker({
  value,
  onChange,
  swatches = DEFAULT_COLOR_SWATCHES,
  allowCustom = true,
  disabled,
  required,
  label,
  error,
  helperText,
  containerClassName,
  style,
}: Readonly<ColorPickerProps>) {
  const autoId = useId();

  return (
    <FieldShell label={label} required={required} error={error} helperText={helperText} className={containerClassName} style={style}>
      <div className={cn("flex flex-col gap-3", disabled && "pointer-events-none opacity-50")}>
        <div className="flex flex-wrap gap-2">
          {swatches.map((swatch) => {
            const active = swatch.toLowerCase() === value.toLowerCase();
            return (
              <button
                key={swatch}
                type="button"
                aria-label={swatch}
                onClick={() => onChange(swatch)}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-white transition dark:ring-offset-slate-900",
                  active ? "ring-brand-600" : "ring-transparent hover:ring-slate-200 dark:hover:ring-slate-700"
                )}
                style={{ backgroundColor: swatch }}
              >
                {active && <Check className="h-3.5 w-3.5 text-white drop-shadow" strokeWidth={3} />}
              </button>
            );
          })}
        </div>

        {allowCustom && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-2 py-1.5 shadow-sm",
              fieldBorderClass(error),
              "bg-white dark:bg-slate-900"
            )}
          >
            <input
              id={autoId}
              type="color"
              value={isValidHex(value) ? value : "#000000"}
              onChange={(e) => onChange(e.target.value)}
              className="h-6 w-6 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
              aria-label="Custom color"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#2563eb"
              className="w-full bg-transparent font-mono text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        )}
      </div>
    </FieldShell>
  );
}
