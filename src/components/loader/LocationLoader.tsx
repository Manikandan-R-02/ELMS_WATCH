import type { CSSProperties } from "react";
import { cn } from "../../lib/cn";

/** Overall footprint (px) per size — matches the other themed loaders' `h-12`/`h-16`/`h-24`. */
const STAGE_PX = { sm: 48, md: 64, lg: 96 } as const;
const LABEL_TEXT_CLASS = { sm: "text-xs", md: "text-sm", lg: "text-base" } as const;

/** The design's own reference frame — every dimension below is "at 420px stage", scaled down to
 * the actual rendered size by `STAGE_PX[size] / REFERENCE_STAGE`. Keeping the numbers in this
 * shape (rather than pre-computing 3 fixed tables) makes the component a direct, checkable port
 * of the original design instead of a re-derived approximation. */
const REFERENCE_STAGE = 420;
/** Three concentric ring outlines, outer to inner — always visible together (not a fade-in/
 * fade-out ripple), forming a "radar bullseye" under the pin's drop point, per the reference
 * design. Each is lighter/thinner than the one inside it, matching how the reference image
 * reads: faint outer rings, a crisper inner one. */
const RINGS = [
  { width: 230, height: 72, borderWidth: 4, tone: "border-slate-200 dark:border-slate-700" },
  { width: 150, height: 47, borderWidth: 4, tone: "border-slate-300 dark:border-slate-600" },
  { width: 80, height: 25, borderWidth: 4, tone: "border-slate-400/80 dark:border-slate-500" },
] as const;
const CENTER = { width: 44, height: 14 };
const PIN = { width: 118, height: 136, marginTop: -190, marginLeft: -59 };

export interface LocationLoaderProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * The app's default themed loading indicator — a location pin that drops with an elastic
 * squash-and-bounce landing onto a "radar bullseye" (three concentric rings, always visible
 * together, gently breathing in unison) with a solid shadow at its center that pulses in sync
 * with the impact — read as a location being repeatedly pinpointed rather than a generic
 * spinner. Used by `GlobalLoader`
 * (every axiosClient call + route change, scoped to the page content area — see AppLayout.tsx),
 * the route-level Suspense fallback, and `RequireAuth`'s session-bootstrap gate — everywhere
 * except the login page, which has its own presentation.
 *
 * `SupplyChainLoader` (this template's original truck-and-crate artwork) still exists as a
 * sibling — swap back to it, or draw a different themed loader, if this project's subject ever
 * changes; the loader *mechanism* (GlobalLoader + loaderStore) is unchanged either way.
 */
export function LocationLoader({ label = "Loading", size = "md", className }: Readonly<LocationLoaderProps>) {
  const stagePx = STAGE_PX[size];
  const scale = stagePx / REFERENCE_STAGE;
  const px = (v: number) => `${v * scale}px`;

  function ringStyle(ring: (typeof RINGS)[number]): CSSProperties {
    return {
      top: "68%",
      width: px(ring.width),
      height: px(ring.height),
      marginTop: px(-ring.height / 2),
      marginLeft: px(-ring.width / 2),
      borderWidth: px(ring.borderWidth),
    };
  }
  const centerStyle: CSSProperties = {
    top: "68%",
    width: px(CENTER.width),
    height: px(CENTER.height),
    marginTop: px(-CENTER.height / 2),
    marginLeft: px(-CENTER.width / 2),
  };
  const pinStyle: CSSProperties = {
    top: "68%",
    width: px(PIN.width),
    height: px(PIN.height),
    marginTop: px(PIN.marginTop),
    marginLeft: px(PIN.marginLeft),
  };

  return (
    <output className={cn("flex flex-col items-center gap-3", className)} aria-live="polite">
      <div className="relative" style={{ width: stagePx, height: stagePx }} aria-hidden="true">
        {/* The bullseye — 3 concentric rings, always visible together (not a fading
            ripple), gently breathing in unison so it still reads as "loading". Each ring
            gets the animation directly (not a shared wrapper) — a `transform`-animated
            wrapper would become a new containing block for these `absolute` children and
            reposition them relative to itself instead of the stage. */}
        {RINGS.map((ring) => (
          <div
            key={ring.width}
            className={cn("motion-reduce:animate-none animate-pin-drop-rings absolute left-1/2 rounded-full", ring.tone)}
            style={ringStyle(ring)}
          />
        ))}
        <div className="motion-reduce:animate-none animate-pin-drop-shadow absolute left-1/2 rounded-full bg-slate-700 dark:bg-slate-300" style={centerStyle} />
        <div className="motion-reduce:animate-none animate-pin-drop absolute left-1/2 origin-bottom" style={pinStyle}>
          <svg viewBox="0 0 30 34" className="block h-full w-full">
            <path
              className="fill-slate-900 dark:fill-slate-50"
              d="M15 0C23.3 0 30 6.7 30 15c0 11-15 19-15 19s-15-8-15-19C0 6.7 6.7 0 15 0z"
            />
            <circle cx="15" cy="14" r="6.5" className="fill-white dark:fill-slate-900" />
          </svg>
        </div>
      </div>
      {label && <p className={cn("font-medium tracking-wide text-slate-500 dark:text-slate-400", LABEL_TEXT_CLASS[size])}>{label}</p>}
    </output>
  );
}
