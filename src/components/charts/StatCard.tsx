import type { KeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";
import { Card } from "../cards/Card";

export type StatTone = "brand" | "emerald" | "amber" | "red" | "violet";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; direction: "up" | "down" };
  tone?: StatTone;
  /**
   * "solid" (default) — colored background, white text; the original look, used on the Overview page's KPI strip.
   * "soft" — light tinted background, colored text/icon.
   * "outline" — white/dark card, colored border and icon, neutral value text.
   * "minimal" — single compact row: a solid-color circular icon badge, value+label stacked beside it, optional trend at the end, with a colored left accent bar.
   * "pill" — fully rounded (rounded-full), thin all-around border, no accent bar: a solid-color circular icon badge on the left, value+label stacked beside it. Built for a tight horizontal row of KPI pills (see the "Pill KPI strip" section on the Charts preview page).
   * "sparkline" — outline-style card with a small inline trend line under the value (pass `sparklineData`) — a lightweight pure-SVG line, no chart library involved.
   * "progress" — outline-style card with a linear progress bar toward a target (pass `progress`, 0-100) — for stock levels, budget usage, quota consumption.
   */
  variant?: "solid" | "soft" | "outline" | "minimal" | "pill" | "sparkline" | "progress";
  /** "md" (default) matches the existing KPI-strip size; "sm" is a denser card for sidebars, tight grids, or a
   * table header strip; "xs" is denser still — a compact, dense-enterprise-report KPI row (e.g. a filter toolbar
   * strip) where six-plus cards need to sit on one line without dominating the page. */
  size?: "xs" | "sm" | "md";
  /** variant="sparkline" only — a short series of numbers rendered as a trend line, most recent last. */
  sparklineData?: number[];
  /** variant="progress" only — 0-100, clamped. */
  progress?: number;
  /** variant="progress" only — small caption under the bar, e.g. "68 of 100 units". Defaults to "{progress}%". */
  progressLabel?: string;
  /** Makes the whole card a button — e.g. drilling into the table/chart that backs this figure.
   * Adds hover/focus affordances and keyboard (Enter/Space) activation on top of the click. */
  onClick?: () => void;
  className?: string;
}

// Card defaults to dark:bg-slate-900 — repeat solid tones under dark: too, otherwise dark mode would fall back to it.
const TONE: Record<
  StatTone,
  {
    solid: string;
    soft: string;
    softIcon: string;
    softText: string;
    outlineBorder: string;
    outlineIcon: string;
    /** A more saturated border — the left accent bar on the "minimal" variant reads better at full color than the pale `outlineBorder` tint. */
    accentBorder: string;
    accentText: string;
    /** A pale ring color for the "minimal" variant's icon badge — an extra rounded border around
     * the already-solid-color circle, in the same tone as the left accent bar, so the two read
     * as one color story instead of the icon looking like a separate flat dot. */
    iconRing: string;
    trendUp: string;
    trendDown: string;
  }
> = {
  brand: {
    solid: "bg-brand-600 dark:bg-brand-600",
    soft: "bg-brand-50 dark:bg-brand-500/10",
    softIcon: "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400",
    softText: "text-brand-700 dark:text-brand-300",
    outlineBorder: "border-brand-200 dark:border-brand-500/30",
    outlineIcon: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
    accentBorder: "border-brand-500 dark:border-brand-500",
    accentText: "text-brand-600 dark:text-brand-400",
    iconRing: "ring-brand-200 dark:ring-brand-500/30",
    trendUp: "text-emerald-600 dark:text-emerald-400",
    trendDown: "text-red-600 dark:text-red-400",
  },
  emerald: {
    solid: "bg-emerald-600 dark:bg-emerald-600",
    soft: "bg-emerald-50 dark:bg-emerald-500/10",
    softIcon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    softText: "text-emerald-700 dark:text-emerald-300",
    outlineBorder: "border-emerald-200 dark:border-emerald-500/30",
    outlineIcon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    accentBorder: "border-emerald-500 dark:border-emerald-500",
    accentText: "text-emerald-600 dark:text-emerald-400",
    iconRing: "ring-emerald-200 dark:ring-emerald-500/30",
    trendUp: "text-emerald-600 dark:text-emerald-400",
    trendDown: "text-red-600 dark:text-red-400",
  },
  amber: {
    solid: "bg-amber-600 dark:bg-amber-600",
    soft: "bg-amber-50 dark:bg-amber-500/10",
    softIcon: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    softText: "text-amber-700 dark:text-amber-300",
    outlineBorder: "border-amber-200 dark:border-amber-500/30",
    outlineIcon: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    accentBorder: "border-amber-500 dark:border-amber-500",
    accentText: "text-amber-600 dark:text-amber-400",
    iconRing: "ring-amber-200 dark:ring-amber-500/30",
    trendUp: "text-emerald-600 dark:text-emerald-400",
    trendDown: "text-red-600 dark:text-red-400",
  },
  red: {
    solid: "bg-red-600 dark:bg-red-600",
    soft: "bg-red-50 dark:bg-red-500/10",
    softIcon: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
    softText: "text-red-700 dark:text-red-300",
    outlineBorder: "border-red-200 dark:border-red-500/30",
    outlineIcon: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    accentBorder: "border-red-500 dark:border-red-500",
    accentText: "text-red-600 dark:text-red-400",
    iconRing: "ring-red-200 dark:ring-red-500/30",
    trendUp: "text-emerald-600 dark:text-emerald-400",
    trendDown: "text-red-600 dark:text-red-400",
  },
  violet: {
    solid: "bg-violet-600 dark:bg-violet-600",
    soft: "bg-violet-50 dark:bg-violet-500/10",
    softIcon: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
    softText: "text-violet-700 dark:text-violet-300",
    outlineBorder: "border-violet-200 dark:border-violet-500/30",
    outlineIcon: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    accentBorder: "border-violet-500 dark:border-violet-500",
    accentText: "text-violet-600 dark:text-violet-400",
    iconRing: "ring-violet-200 dark:ring-violet-500/30",
    trendUp: "text-emerald-600 dark:text-emerald-400",
    trendDown: "text-red-600 dark:text-red-400",
  },
};

const SIZE = {
  md: { pad: "p-5", pillPad: "py-2.5 pl-2.5 pr-5", label: "text-sm", value: "text-2xl", iconBox: "h-11 w-11", icon: "h-[1.375rem] w-[1.375rem]", trendText: "text-xs", showTrendCaption: true },
  sm: { pad: "p-3.5", pillPad: "py-1.5 pl-1.5 pr-3.5", label: "text-xs", value: "text-lg", iconBox: "h-8 w-8", icon: "h-4 w-4", trendText: "text-[0.65rem]", showTrendCaption: false },
  xs: { pad: "p-2.5", pillPad: "py-1 pl-1 pr-2.5", label: "text-[0.7rem]", value: "text-sm", iconBox: "h-6 w-6", icon: "h-3 w-3", trendText: "text-[0.6rem]", showTrendCaption: false },
} as const;

/** Pure-SVG trend line — no chart library, so it's cheap enough to render inside every card in a KPI grid. */
function Sparkline({ data, className }: Readonly<{ data: number[]; className?: string }>) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${28 - ((v - min) / span) * 26 - 1}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className={cn("h-7 w-full", className)}>
      <polyline points={points} fill="none" strokeWidth={2} vectorEffect="non-scaling-stroke" className="stroke-current" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparklineStat(p: Readonly<StatPartsProps>) {
  const { label, value, trend, t, s, sparklineData, className, interactive, interactiveClassName, clickAffordance } = p;
  return (
    <Card padded={false} elevated={false} className={cn("border", t.outlineBorder, s.pad, interactiveClassName, className)} {...interactive}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className={cn("truncate font-medium text-slate-500 dark:text-slate-400", s.label)}>{label}</p>
          <p className={cn("mt-1 font-semibold text-slate-900 dark:text-slate-50", s.value)}>{value}</p>
        </div>
        {trend && (
          <span className={cn("inline-flex shrink-0 items-center gap-0.5 font-semibold", s.trendText, trend.direction === "up" ? t.trendUp : t.trendDown)}>
            {trend.direction === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {trend.value}
          </span>
        )}
        {clickAffordance}
      </div>
      {sparklineData && <Sparkline data={sparklineData} className={cn("mt-2", t.accentText)} />}
    </Card>
  );
}

function ProgressStat(p: Readonly<StatPartsProps>) {
  const { label, value, Icon, t, s, progress, progressLabel, className, interactive, interactiveClassName, clickAffordance } = p;
  const pct = Math.max(0, Math.min(100, progress ?? 0));
  return (
    <Card padded={false} elevated={false} className={cn("border", t.outlineBorder, s.pad, interactiveClassName, className)} {...interactive}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className={cn("truncate font-medium text-slate-500 dark:text-slate-400", s.label)}>{label}</p>
          <p className={cn("mt-1 font-semibold text-slate-900 dark:text-slate-50", s.value)}>{value}</p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <span className={cn("flex items-center justify-center rounded-xl", t.outlineIcon, s.iconBox)}>
            <Icon className={s.icon} />
          </span>
          {clickAffordance}
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={cn("h-full rounded-full transition-[width]", t.solid)} style={{ width: `${pct}%` }} />
      </div>
      <p className={cn("mt-1.5 font-medium text-slate-400 dark:text-slate-500", s.trendText)}>{progressLabel ?? `${pct}%`}</p>
    </Card>
  );
}

function PillStat(p: Readonly<StatPartsProps>) {
  const { label, value, Icon, trend, t, s, className, interactive, interactiveClassName, clickAffordance } = p;
  return (
    <Card padded={false} bordered elevated={false} className={cn("rounded-full", interactiveClassName, className)} {...interactive}>
      <div className={cn("flex flex-row items-center gap-3", s.pillPad)}>
        <span className={cn("flex shrink-0 items-center justify-center rounded-full text-white", t.solid, s.iconBox)}>
          <Icon className={s.icon} />
        </span>
        <div className="min-w-0">
          <p className={cn("font-semibold text-slate-900 dark:text-slate-50", s.value)}>{value}</p>
          <p className={cn("truncate font-medium text-slate-400 dark:text-slate-500", s.label)}>{label}</p>
        </div>
        {trend && (
          <span className={cn("ml-1 inline-flex shrink-0 items-center gap-0.5 font-semibold", s.trendText, trend.direction === "up" ? t.trendUp : t.trendDown)}>
            {trend.direction === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {trend.value}
          </span>
        )}
        {clickAffordance}
      </div>
    </Card>
  );
}

function MinimalStat(p: Readonly<StatPartsProps>) {
  const { label, value, Icon, trend, t, s, className, interactive, interactiveClassName, clickAffordance, onClick } = p;
  return (
    <Card
      padded={false}
      bordered={false}
      elevated
      hoverable={!!onClick}
      className={cn(
        "group border-l-4 transition-colors",
        t.accentBorder,
        // Only a clickable card gets the hover tint — a static one shouldn't look interactive.
        onClick && "hover:bg-slate-50 dark:hover:bg-slate-800/60",
        interactiveClassName,
        className
      )}
      {...interactive}
    >
      <div className={cn("flex flex-row items-center gap-3", s.pad)}>
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-2 ring-offset-2 ring-offset-white transition-transform dark:ring-offset-slate-900",
            t.solid,
            t.iconRing,
            s.iconBox,
            onClick && "group-hover:scale-105"
          )}
        >
          <Icon className={s.icon} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("font-semibold text-slate-900 dark:text-slate-50", s.value)}>{value}</p>
          {/* Label now matches the left accent bar's tone instead of neutral slate — ties the
              icon ring, left border, and label into one color story per card. */}
          <p className={cn("truncate font-medium", t.accentText, s.label)}>{label}</p>
        </div>
        {trend && (
          <span className={cn("inline-flex shrink-0 items-center gap-0.5 font-semibold", s.trendText, trend.direction === "up" ? t.trendUp : t.trendDown)}>
            {trend.direction === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {trend.value}
          </span>
        )}
        {clickAffordance}
      </div>
    </Card>
  );
}

function OutlineStat(p: Readonly<StatPartsProps>) {
  const { label, value, Icon, trend, t, s, className, interactive, interactiveClassName, clickAffordance } = p;
  return (
    <Card padded={false} elevated={false} className={cn("border", t.outlineBorder, s.pad, interactiveClassName, className)} {...interactive}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className={cn("truncate font-medium text-slate-500 dark:text-slate-400", s.label)}>{label}</p>
          <p className={cn("mt-1 font-semibold text-slate-900 dark:text-slate-50", s.value)}>{value}</p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <span className={cn("flex items-center justify-center rounded-xl", t.outlineIcon, s.iconBox)}>
            <Icon className={s.icon} />
          </span>
          {clickAffordance}
        </div>
      </div>
      {trend && (
        <div className={cn("mt-2.5 inline-flex items-center gap-1 font-medium", s.trendText, trend.direction === "up" ? t.trendUp : t.trendDown)}>
          {trend.direction === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {trend.value}
          {s.showTrendCaption && <span className="font-normal text-slate-400 dark:text-slate-500">vs last period</span>}
        </div>
      )}
    </Card>
  );
}

function SoftStat(p: Readonly<StatPartsProps>) {
  const { label, value, Icon, trend, t, s, className, interactive, interactiveClassName, clickAffordance } = p;
  return (
    <Card padded={false} bordered={false} elevated={false} className={cn(t.soft, s.pad, interactiveClassName, className)} {...interactive}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className={cn("truncate font-medium", t.softText, s.label)}>{label}</p>
          <p className={cn("mt-1 font-semibold text-slate-900 dark:text-slate-50", s.value)}>{value}</p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <span className={cn("flex items-center justify-center rounded-xl", t.softIcon, s.iconBox)}>
            <Icon className={s.icon} />
          </span>
          {clickAffordance}
        </div>
      </div>
      {trend && (
        <div className={cn("mt-2.5 inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 font-medium dark:bg-black/15", s.trendText, trend.direction === "up" ? t.trendUp : t.trendDown)}>
          {trend.direction === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {trend.value}
        </div>
      )}
    </Card>
  );
}

function SolidStat(p: Readonly<StatPartsProps>) {
  const { label, value, Icon, trend, t, s, className, interactive, interactiveClassName, clickAffordanceOnColor, tone } = p;
  return (
    <Card
      padded={false}
      hoverable
      bordered={false}
      elevated
      className={cn(tone === "brand" ? "bg-gradient-to-r from-brand-800 to-brand-600" : t.solid, "text-white", s.pad, interactiveClassName, className)}
      {...interactive}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className={cn("truncate font-medium text-white/75", s.label)}>{label}</p>
          <p className={cn("mt-1.5 font-semibold text-white", s.value)}>{value}</p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <span className={cn("flex items-center justify-center rounded-xl bg-white/15", s.iconBox)}>
            <Icon className={s.icon} />
          </span>
          {clickAffordanceOnColor}
        </div>
      </div>
      {trend && (
        <div className={cn("mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 font-medium text-white", s.trendText)}>
          {trend.direction === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {trend.value}
          {s.showTrendCaption && <span className="font-normal text-white/70">vs last period</span>}
        </div>
      )}
    </Card>
  );
}

/** Everything the variant components share: tone and size classes, click behaviour and affordance. */
function buildStatContext(tone: StatTone, size: keyof typeof SIZE, onClick: StatCardProps["onClick"]) {
  const t = TONE[tone];
  const s = SIZE[size];
  const interactive = onClick
    ? {
        onClick,
        hoverable: true,
        role: "button" as const,
        tabIndex: 0,
        onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        },
      }
    : {};
  const interactiveClassName = onClick && "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900";
  // A rest-state affordance, not just a hover effect — without it, a clickable KPI tile looks
  // identical to every static one and people don't think to try clicking it.
  const clickAffordance = onClick ? (
    <ChevronRight className={cn("shrink-0 text-slate-300 dark:text-slate-600", s.icon)} />
  ) : null;
  // "solid" renders on a saturated color fill, where the neutral slate chevron above would be
  // nearly invisible — a translucent-white one instead, matching how that variant already
  // dims its own label text (`text-white/75`).
  const clickAffordanceOnColor = onClick ? <ChevronRight className={cn("shrink-0 text-white/60", s.icon)} /> : null;
  return { t, s, interactive, interactiveClassName, clickAffordance, clickAffordanceOnColor };
}

type StatContext = ReturnType<typeof buildStatContext>;
type StatPartsProps = StatContext &
  Pick<StatCardProps, "label" | "value" | "trend" | "tone" | "sparklineData" | "progress" | "progressLabel" | "onClick" | "className"> & {
    Icon: LucideIcon;
  };

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  tone = "brand",
  variant = "solid",
  size = "md",
  sparklineData,
  progress,
  progressLabel,
  onClick,
  className,
}: Readonly<StatCardProps>) {
  const parts: StatPartsProps = {
    ...buildStatContext(tone, size, onClick),
    label,
    value,
    Icon,
    trend,
    tone,
    sparklineData,
    progress,
    progressLabel,
    onClick,
    className,
  };
  if (variant === "sparkline") return <SparklineStat {...parts} />;
  if (variant === "progress") return <ProgressStat {...parts} />;
  if (variant === "pill") return <PillStat {...parts} />;
  if (variant === "minimal") return <MinimalStat {...parts} />;
  if (variant === "outline") return <OutlineStat {...parts} />;
  if (variant === "soft") return <SoftStat {...parts} />;
  return <SolidStat {...parts} />;
}
