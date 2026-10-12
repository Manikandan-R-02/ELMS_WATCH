import { useId, type CSSProperties } from "react";
import { cn } from "../../lib/cn";
import { FieldShell } from "./FieldShell";

const trackClass = "h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700";

const thumbInputClass = cn(
  "absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent",
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none",
  "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand-600 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm",
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none",
  "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand-600 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-sm",
  "disabled:[&::-webkit-slider-thumb]:cursor-not-allowed disabled:[&::-webkit-slider-thumb]:border-slate-300"
);

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  helperText?: string;
  /** Show the current numeric value next to the label. Default true. */
  showValue?: boolean;
  /** Format the displayed value — e.g. `(v) => `${v}%`` for a percentage. Default: the raw number. */
  formatValue?: (value: number) => string;
  /**
   * Raw CSS `background` for the track, e.g. a `linear-gradient(...)` rainbow strip for a color
   * picker built on top of this slider (see SettingsDrawer's accent-color picker). Overrides the
   * default `bg-slate-200`/`dark:bg-slate-700` flat track color; the brand-colored progress fill
   * (see `showFill`) still renders on top unless disabled, so pair this with `showFill={false}`
   * when the track background itself already encodes meaning (like a gradient) that a solid fill
   * overlay would obscure.
   */
  trackBackground?: string;
  /** Render the brand-colored "filled" portion from the track's start up to the thumb. Default
   * true; set false for a track whose background (see `trackBackground`) shouldn't be overlaid. */
  showFill?: boolean;
  containerClassName?: string;
  /** Inline style applied to the outer wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
}

/** Single-value range slider. For a min/max pair (e.g. a price filter), use `RangeSlider`. */
export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  required,
  label,
  error,
  helperText,
  showValue = true,
  formatValue = String,
  trackBackground,
  showFill = true,
  containerClassName,
  style,
}: Readonly<SliderProps>) {
  const autoId = useId();
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <FieldShell
      htmlFor={autoId}
      label={label && showValue ? undefined : label}
      required={required}
      error={error}
      helperText={helperText}
      className={containerClassName}
      style={style}
    >
      {label && showValue && (
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor={autoId} className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          <span className="text-xs font-semibold tabular-nums text-brand-600 dark:text-brand-400">{formatValue(value)}</span>
        </div>
      )}
      <div className={cn("relative flex items-center py-1.5", disabled && "opacity-50")}>
        <div className={trackClass} style={trackBackground ? { background: trackBackground } : undefined}>
          {showFill && <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />}
        </div>
        <input
          id={autoId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className={thumbInputClass}
        />
      </div>
    </FieldShell>
  );
}

export interface RangeSliderValue {
  min: number;
  max: number;
}

export interface RangeSliderProps {
  value: RangeSliderValue;
  onChange: (value: RangeSliderValue) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Smallest allowed gap between the two thumbs. Default: `step`. */
  minGap?: number;
  disabled?: boolean;
  label?: string;
  error?: string;
  helperText?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  containerClassName?: string;
  /** Inline style applied to the outer wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
}

/** Dual-thumb range slider for a min/max pair — e.g. a price or quantity filter. */
export function RangeSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  minGap = step,
  disabled,
  label,
  error,
  helperText,
  showValue = true,
  formatValue = String,
  containerClassName,
  style,
}: Readonly<RangeSliderProps>) {
  const minPct = ((value.min - min) / (max - min)) * 100;
  const maxPct = ((value.max - min) / (max - min)) * 100;

  function handleMinChange(next: number) {
    onChange({ min: Math.min(next, value.max - minGap), max: value.max });
  }

  function handleMaxChange(next: number) {
    onChange({ min: value.min, max: Math.max(next, value.min + minGap) });
  }

  return (
    <FieldShell
      label={label && !showValue ? label : undefined}
      error={error}
      helperText={helperText}
      className={containerClassName}
      style={style}
    >
      {label && showValue && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
          <span className="text-xs font-semibold tabular-nums text-brand-600 dark:text-brand-400">
            {formatValue(value.min)} &ndash; {formatValue(value.max)}
          </span>
        </div>
      )}
      <div className={cn("relative flex items-center py-1.5", disabled && "opacity-50")}>
        <div className={trackClass}>
          <div className="h-full rounded-full bg-brand-600" style={{ marginLeft: `${minPct}%`, width: `${maxPct - minPct}%` }} />
        </div>
        <input
          type="range"
          aria-label="Minimum"
          min={min}
          max={max}
          step={step}
          value={value.min}
          disabled={disabled}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          className={cn(thumbInputClass, "pointer-events-none z-10")}
        />
        <input
          type="range"
          aria-label="Maximum"
          min={min}
          max={max}
          step={step}
          value={value.max}
          disabled={disabled}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          className={cn(thumbInputClass, "pointer-events-none z-20")}
        />
      </div>
    </FieldShell>
  );
}
