import { useState, type ButtonHTMLAttributes, type MouseEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import type { ButtonTone } from "./TextButton";
import { ACTIONS } from "./actionConfig";

export type SlideButtonTone = ButtonTone;

const toneClass: Record<SlideButtonTone, string> = {
  brand: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500/40",
  neutral:
    "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 focus-visible:ring-slate-400/40",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/40",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500/40",
  warning: "bg-yellow-500 text-white hover:bg-yellow-600 focus-visible:ring-yellow-500/40",
  purple: "bg-purple-600 text-white hover:bg-purple-700 focus-visible:ring-purple-500/40",
  cyan: "bg-cyan-600 text-white hover:bg-cyan-700 focus-visible:ring-cyan-500/40",
  pink: "bg-pink-600 text-white hover:bg-pink-700 focus-visible:ring-pink-500/40",
  indigo: "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500/40",
};

export interface SlideButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  tone?: SlideButtonTone;
  /** Fixed icon-only sizing before hover reveals the label. */
  size?: "sm" | "md";
}

/**
 * Icon-first button that slides open to reveal its label on genuine mouse hover.
 *
 * Deliberately does NOT use Tailwind's `hover:`/`group-hover:` (CSS `:hover`) for the reveal.
 * On touch devices, tapping an element makes the browser apply `:hover` and then leave it
 * applied until something else is tapped — so a CSS-only implementation looks like "tap/click
 * reveals the slide" instead of "hovering reveals the slide". Driving the reveal from real
 * `mouseenter`/`mouseleave` events instead means only an actual pointer hovering over the
 * button expands it; a tap alone fires `click` without ever firing `mouseenter`, so it no
 * longer expands on tap. `focus-visible` keeps its ring for keyboard accessibility but does not
 * trigger the expand, matching the original hover-only intent.
 *
 * Use the named presets (PlusSlideButton, ModifySlideButton, ...) for the
 * team's standard actions instead of composing this directly where possible —
 * each preset still accepts a `tone`/`label`/`icon` override if a screen needs
 * something different. See actionConfig.tsx for the shared color convention
 * (also used by the matching TextButton and RoundedButton presets).
 */
export function SlideButton({
  icon: Icon,
  label,
  tone = "brand",
  size = "md",
  className,
  onMouseEnter,
  onMouseLeave,
  ...props
}: Readonly<SlideButtonProps>) {
  const [hovered, setHovered] = useState(false);
  const iconBox = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  function handleMouseEnter(e: MouseEvent<HTMLButtonElement>) {
    setHovered(true);
    onMouseEnter?.(e);
  }
  function handleMouseLeave(e: MouseEvent<HTMLButtonElement>) {
    setHovered(false);
    onMouseLeave?.(e);
  }

  return (
    <button
      type="button"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "inline-flex cursor-pointer items-center overflow-hidden rounded-full shadow-soft transition-all duration-300 ease-out active:scale-95",
        iconBox,
        hovered && "w-auto max-w-[220px] pr-4",
        "focus:outline-none focus-visible:ring-4",
        toneClass[tone],
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      aria-label={label}
      {...props}
    >
      <span className={cn("flex shrink-0 items-center justify-center", iconBox)}>
        <Icon className={iconSize} />
      </span>
      <span
        className={cn(
          "max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-300",
          hovered && "max-w-[180px] opacity-100"
        )}
      >
        {label}
      </span>
    </button>
  );
}

type PresetProps = Omit<SlideButtonProps, "icon" | "label"> & { label?: string };

function slidePreset(action: keyof typeof ACTIONS) {
  const { icon, label: defaultLabel, tone: defaultTone } = ACTIONS[action];
  const Preset = ({ label = defaultLabel, tone = defaultTone, ...props }: PresetProps) => (
    <SlideButton icon={icon} label={label} tone={tone} {...props} />
  );
  Preset.displayName = `${action[0].toUpperCase()}${action.slice(1)}SlideButton`;
  return Preset;
}

export const PlusSlideButton = slidePreset("plus");
export const ListSlideButton = slidePreset("list");
export const ViewSlideButton = slidePreset("view");
export const ModifySlideButton = slidePreset("modify");
export const BulkUploadSlideButton = slidePreset("bulkUpload");
export const DownloadSlideButton = slidePreset("download");
export const SaveSlideButton = slidePreset("save");
export const RefreshSlideButton = slidePreset("refresh");
export const CancelSlideButton = slidePreset("cancel");
export const DeleteSlideButton = slidePreset("delete");

export type { LucideIcon } from "lucide-react";