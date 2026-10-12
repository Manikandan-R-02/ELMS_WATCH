import { MapPin } from "lucide-react";
import { cn } from "../../lib/cn";

/** The five stops on the little route: [x, y] in the 300 × 80 map viewBox. */
const STOPS: [number, number][] = [
  [30, 36],
  [105, 16],
  [165, 40],
  [235, 14],
  [280, 38],
];
const ROUTE = STOPS.map(([x, y]) => `${x},${y}`).join(" ");

export interface AppLoaderProps {
  /** The line under the spinner. */
  label?: string;
  /** A smaller card without the route strip and the sub-title — for a tight spot. */
  compact?: boolean;
  className?: string;
}

/**
 * The app's loading card, shown for every screen render and every API call (see `GlobalLoader`, the route
 * fallbacks in `router.tsx` / `AppLayout.tsx` and `RequireAuth`): a "Location Management" header, a small map
 * strip where a route draws itself through five pulsing stops, and a ring spinner with "Loading locations…".
 * It is sized to its content (never wider than 16.5rem or 88% of the screen), so it fits a phone as well as a desktop,
 * and every animation stops for people who ask their system for reduced motion.
 */
export function AppLoader({ label = "Loading locations…", compact = false, className }: Readonly<AppLoaderProps>) {
  return (
    <output
     
      aria-live="polite"
      aria-label={label}
      className={cn(
        "w-[min(88vw,16.5rem)] rounded-2xl border border-brand-100 bg-white/95 p-3 shadow-elevated backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
          <MapPin className="h-4 w-4" fill="currentColor" fillOpacity={0.15} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight text-slate-900 dark:text-slate-50">Location Management</p>
          {!compact && (
            <p className="mt-0.5 text-[0.625rem] leading-snug text-slate-500 dark:text-slate-400">
              Managing locations <span aria-hidden="true">•</span> Syncing data <span aria-hidden="true">•</span> Preparing your workspace
            </p>
          )}
        </div>
      </div>

      {!compact && (
        <div className="mt-2.5 overflow-hidden rounded-lg border border-brand-100 bg-brand-50/70 dark:border-slate-700 dark:bg-slate-800/60" aria-hidden="true">
          <svg viewBox="0 0 300 52" className="block h-auto w-full">
            {/* faint street grid */}
            <g className="stroke-brand-100 dark:stroke-slate-700" strokeWidth="1" fill="none">
              <path d="M0 14H300M0 40H300M60 0L45 52M140 0L125 52M220 0L205 52" />
            </g>
            <polyline
              points={ROUTE}
              pathLength={1}
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-loader-line motion-reduce:animate-none stroke-brand-400 dark:stroke-brand-300"
              style={{ strokeDasharray: 1 }}
            />
            {STOPS.map(([x, y], i) => (
              <g
                key={x}
                className="animate-loader-dot motion-reduce:animate-none"
                style={{ animationDelay: `${i * 0.25}s`, transformBox: "fill-box", transformOrigin: "center" }}
              >
                <circle cx={x} cy={y} r="8" className="fill-brand-100 dark:fill-brand-500/25" />
                <circle cx={x} cy={y} r="4.5" className="fill-brand-600 dark:fill-brand-400" />
              </g>
            ))}
          </svg>
        </div>
      )}

      <div className={cn("flex flex-col items-center gap-1", compact ? "mt-2" : "mt-2.5")}>
        <span className="relative flex h-9 w-9 items-center justify-center" aria-hidden="true">
          <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full animate-spin motion-reduce:animate-none [animation-duration:1.6s]">
            <circle cx="24" cy="24" r="20" fill="none" strokeWidth="4" strokeDasharray="5 4.2" className="stroke-brand-500 dark:stroke-brand-400" />
          </svg>
          <svg viewBox="0 0 20 20" className="relative h-4 w-4">
            <rect x="1.5" y="1.5" width="17" height="17" rx="3" className="fill-brand-100 stroke-brand-400 dark:fill-brand-500/20 dark:stroke-brand-300" strokeWidth="1.5" />
            <path d="M7.2 1.5V18.5M12.8 1.5V18.5M1.5 7.2H18.5M1.5 12.8H18.5" className="stroke-brand-400 dark:stroke-brand-300" strokeWidth="1" />
          </svg>
        </span>
        <p className="text-xs font-semibold text-brand-600 dark:text-brand-300">{label}</p>
      </div>
    </output>
  );
}
