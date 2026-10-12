import { ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";

export interface TourPointerRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TourPointerProps {
  rect: TourPointerRect | null;
}

/**
 * A small animated hand that floats just above the currently highlighted
 * tour target, pointing down at it — driver.js's own spotlight+popover
 * don't include this, so it's a small custom addition rather than a new
 * animation library (reuses the same CSS-keyframe approach already used
 * for every other animation in this app — see index.css's `tour-point`
 * keyframe). `pointer-events-none` so it never blocks a click, and
 * `OnboardingProvider` renders it with `rect: null` (i.e. not at all) for
 * centered/targetless steps like Welcome/Finish, since there's nothing to
 * point at.
 */
export function TourPointer({ rect }: TourPointerProps) {
  if (!rect) return null;

  const top = rect.top - 30;
  const left = rect.left + rect.width / 2;

  return createPortal(
    <div
      className="pointer-events-none fixed z-[10001] -translate-x-1/2 animate-tour-point select-none text-brand-500 drop-shadow-lg"
      style={{ top, left }}
      aria-hidden="true"
    >
      <ChevronDown size={28} strokeWidth={3} />
    </div>,
    document.body
  );
}
