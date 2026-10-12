import { memo, useMemo, useState, type ReactNode } from "react";
import { AlignLeft, AreaChart as AreaChartIcon, BarChart3, Eye, EyeOff, LineChart as LineChartIcon, PieChart as PieChartIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  Rectangle,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
  type PieSectorShapeProps,
} from "recharts";
import { Card } from "../cards/Card";
import { Segmented } from "../common/Segmented";
import { cn } from "../../lib/cn";

/** Fixed-order categorical palette for multi-slice/multi-bar single-series charts (PieChartCard,
 * BarChartCard's `colors` prop) — distinct hues, not shades of one color, so slices/bars read as
 * separate categories at a glance instead of blending together. Validated via the dataviz
 * skill's `validate_palette.js` (CVD-safe adjacent pairs, normal-vision floor, lightness band —
 * see the skill for the full report); assign in this fixed order, never re-sort or cycle
 * arbitrarily. Multi-series charts with an explicit legend (BarChartCard's `series`,
 * MultiLineChartCard) keep their own caller-supplied colors — this palette is only the fallback
 * for "however many categories the data happens to have," where no caller-chosen color exists. */
const CATEGORICAL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

/** `<Bar shape={...}>`: draws each bar in the colour `colorAt` gives for its position (one colour per bar instead
 * of one flat series fill). */
function coloredBar(colorAt: (index: number) => string) {
  return function ColoredBar(props: BarShapeProps) {
    return <Rectangle {...props} fill={colorAt(props.index)} />;
  };
}

/** How far a hovered slice grows outward, in pixels. */
const PIE_HOVER_GROWTH = 6;

/** `<Pie shape={...}>`: the same for pie slices; the hovered slice grows slightly so it stands out. */
function coloredSlice(colorAt: (index: number) => string, hoveredIndex: number | null = null) {
  return function ColoredSlice(props: PieSectorShapeProps) {
    const grow = props.isActive || props.index === hoveredIndex ? PIE_HOVER_GROWTH : 0;
    return <Sector {...props} fill={colorAt(props.index)} outerRadius={(props.outerRadius ?? 0) + grow} />;
  };
}

/** The colour of the n-th category in the shared palette (cycling). */
const categoricalAt = (index: number) => CATEGORICAL[index % CATEGORICAL.length];

const AXIS_COLOR_CLASS = "text-slate-400";
const compactFormatter = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

/** Short axis numbers in the same Indian grouping the rest of the app uses — 376,795 → "3.8L", 5,274 → "5.3K" —
 * so a tick never needs more than ~5 characters and can't be cut off at the card edge. Exact values stay in the
 * tooltip. */
export function compactNumber(value: number): string {
  if (!Number.isFinite(value)) return "";
  if (Math.abs(value) < 1000) return String(Math.round(value * 100) / 100);
  return compactFormatter.format(value);
}

/** Props for a numeric `<YAxis>`: its width is measured from the longest tick the data can produce (instead of
 * recharts' fixed 60px minus a negative chart margin, which clipped values like "300,000"), so every label is
 * fully visible whatever the formatter or the magnitude. */
function yAxisProps(data: Record<string, string | number>[], keys: string[], format: (value: number) => string = compactNumber) {
  let max = 0;
  let min = 0;
  for (const row of data) {
    for (const key of keys) {
      const v = Number(row[key]);
      if (Number.isFinite(v)) {
        max = Math.max(max, v);
        min = Math.min(min, v);
      }
    }
  }
  const longest = Math.max(format(max).length, format(min).length, 1);
  return {
    tick: { fontSize: 12 },
    stroke: "currentColor",
    className: AXIS_COLOR_CLASS,
    axisLine: false,
    tickLine: false,
    tickFormatter: format,
    width: Math.min(110, Math.max(36, longest * 7 + 10)),
  } as const;
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  data: Record<string, string | number>[];
  className?: string;
}

// Recharts re-renders are relatively expensive (SVG layout + animation); memo() skips
// that work when a parent re-renders for an unrelated reason (e.g. a sibling's state
// change) but this card's own props (title/data/etc.) haven't actually changed.
export const LineAreaChartCard = memo(function LineAreaChartCard({ title, subtitle, data, className, dataKey = "value", xKey = "name" }: ChartCardProps & { dataKey?: string; xKey?: string }) {
  return (
    <Card className={className}>
      <ChartHeader title={title} subtitle={subtitle} />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="currentColor" className="text-slate-400" axisLine={false} tickLine={false} />
            <YAxis {...yAxisProps(data, [dataKey])} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} />
            <Area type="monotone" dataKey={dataKey} stroke="#2563eb" strokeWidth={2} fill="url(#areaFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
});

export interface BarChartCardProps extends ChartCardProps {
  dataKey?: string;
  xKey?: string;
  /** One bar series per key, grouped side-by-side per X category — e.g. Cost vs Waste per
   * location. Overrides `dataKey`/single-series rendering when passed. */
  series?: { key: string; label: string; color: string }[];
  /** Single-series mode only (no `series` prop) — a color per category/bar instead of one flat
   * fill, cycling if there are more bars than colors. */
  colors?: string[];
  /** Compact height (h-48 instead of h-64) — for a dense grid of many small charts. */
  compact?: boolean;
  /** Caps each bar's pixel width (recharts still centers/gaps them) — narrower than the
   * default auto-width, which can look overly chunky with few categories. */
  barSize?: number;
  /** Single-series mode only (no `series` prop) — makes each bar a drill-down trigger (e.g. a
   * "top locations by X" chart jumping to that location's detail screen). Gets a pointer
   * cursor automatically; the row/category clicked is passed as `data[index]`. */
  onBarClick?: (point: Record<string, string | number>, index: number) => void;
}

export const BarChartCard = memo(function BarChartCard({ title, subtitle, data, className, dataKey = "value", xKey = "name", series, colors, compact, barSize, onBarClick }: BarChartCardProps) {
  return (
    <Card className={className}>
      <ChartHeader title={title} subtitle={subtitle} />
      <div className={compact ? "h-48" : "h-64"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="currentColor" className="text-slate-400" axisLine={false} tickLine={false} />
            <YAxis {...yAxisProps(data, series ? series.map((x) => x.key) : [dataKey])} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} cursor={{ fill: "rgba(37,99,235,0.06)" }} />
            {series && series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {series ? (
              series.map((s) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[6, 6, 0, 0]} barSize={barSize} />)
            ) : (
              <Bar
                dataKey={dataKey}
                fill="#2563eb"
                radius={[6, 6, 0, 0]}
                barSize={barSize}
                className={onBarClick ? "cursor-pointer" : undefined}
                onClick={onBarClick ? (_point, index) => onBarClick(data[index], index) : undefined}
                shape={coloredBar((i) => (colors ? colors[i % colors.length] : "#2563eb"))}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
});

const PIE_LABEL_RADIAN = Math.PI / 180;
const PIE_LABEL_FONT_SIZE = 11;
/** Minimum vertical distance between two labels in one column, so none overlap. */
const PIE_LABEL_GAP = 14;
/** Rough pixel width of one label character at `PIE_LABEL_FONT_SIZE` — only used to decide when a name must be
 * shortened because the card is too narrow for it. */
const PIE_LABEL_CHAR_WIDTH = 5.9;
/** Gap between the ring and the label column. */
const PIE_LABEL_COLUMN_OFFSET = 30;
/** Slice padding used by every pie here (kept in one place because the label layout has to mirror it). */
const PIE_PADDING_ANGLE = 2;
/** Pies start at 12 o'clock and run clockwise, largest slice first — the same direction as the old app's charts. */
const PIE_START_ANGLE = 90;
const PIE_END_ANGLE = -270;

interface PieLabelSlot {
  y: number;
  right: boolean;
}

interface NaturalLabel {
  index: number;
  y: number;
  right: boolean;
}

/** Each labelled slice's side of the ring and its natural label height, from the slice's mid-angle. Mid-angles are
 * worked out the way recharts lays slices out (clockwise from `PIE_START_ANGLE`, `PIE_PADDING_ANGLE` between them);
 * a zero slice has no label. */
function naturalLabelPositions(values: number[], total: number, cy: number, outerRadius: number): NaturalLabel[] {
  const labelled = values.filter((v) => v > 0).length;
  const sweep = 360 - Math.max(labelled - 1, 0) * PIE_PADDING_ANGLE;
  let start = PIE_START_ANGLE;
  const positions: NaturalLabel[] = [];
  for (const [index, v] of values.entries()) {
    if (v <= 0) continue;
    const angle = (v / total) * sweep;
    const mid = start - angle / 2;
    start -= angle + PIE_PADDING_ANGLE;
    positions.push({
      index,
      y: cy + (outerRadius + 14) * Math.sin(-mid * PIE_LABEL_RADIAN),
      right: Math.cos(-mid * PIE_LABEL_RADIAN) >= 0,
    });
  }
  return positions;
}

/** Pushes one column's labels (sorted top to bottom) apart by `PIE_LABEL_GAP`, inside `minY..maxY`. */
function spreadColumn(column: NaturalLabel[], minY: number, maxY: number) {
  for (const [i, label] of column.entries()) {
    label.y = Math.min(Math.max(label.y, minY), maxY);
    if (i > 0) label.y = Math.max(label.y, column[i - 1].y + PIE_LABEL_GAP);
  }
  for (let i = column.length - 1; i >= 0; i--) {
    if (i < column.length - 1) column[i].y = Math.min(column[i].y, column[i + 1].y - PIE_LABEL_GAP);
    column[i].y = Math.max(column[i].y, minY);
  }
}

/** Where each slice's label goes: the slice's own side of the ring, as close to its natural height as possible,
 * pushed apart so labels never overlap (and kept inside the chart). A zero slice has no label (`null`). */
function layoutPieLabels(values: number[], cy: number, outerRadius: number): (PieLabelSlot | null)[] {
  const slots: (PieLabelSlot | null)[] = values.map(() => null);
  const total = values.filter((v) => v > 0).reduce((sum, v) => sum + v, 0);
  if (total <= 0) return slots;

  const natural = naturalLabelPositions(values, total, cy, outerRadius);
  const minY = 10;
  const maxY = Math.max(cy * 2 - 10, minY);
  for (const right of [true, false]) {
    const column = natural.filter((n) => n.right === right).sort((p, q) => p.y - q.y);
    spreadColumn(column, minY, maxY);
    for (const n of column) slots[n.index] = { y: n.y, right };
  }
  return slots;
}

interface PieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  percent?: number;
  name?: string | number;
  index?: number;
  fill?: string;
}

/** `<Pie label={...}>` renderer drawing each slice as "NAME: 16.8%" — the format of the old app's Highcharts
 * labels — at the end of a leader line in the slice's own colour, in a tidy column on its side of the ring.
 * Every slice with a value is labelled (tiny ones included: the layout spreads them apart instead of hiding
 * them); a name is shortened with an ellipsis only when the card is too narrow to fit it whole. */
function createPieLabelRenderer(values: number[], colorAt: (index: number) => string, activeIndex: number | null = null) {
  let cacheKey = "";
  let cache: (PieLabelSlot | null)[] = [];
  return function renderPieLabel(props: PieLabelProps) {
    const { cx = 0, cy = 0, midAngle = 0, outerRadius = 0, percent = 0, name, index = 0 } = props;
    if (percent <= 0) return null;
    const key = `${cx}|${cy}|${outerRadius}`;
    if (key !== cacheKey) {
      cacheKey = key;
      cache = layoutPieLabels(values, cy, outerRadius);
    }
    const slot = cache[index];
    if (!slot) return null;

    const cos = Math.cos(-midAngle * PIE_LABEL_RADIAN);
    const sin = Math.sin(-midAngle * PIE_LABEL_RADIAN);
    const edgeX = cx + (outerRadius + 1) * cos;
    const edgeY = cy + (outerRadius + 1) * sin;
    const bendX = cx + (outerRadius + 12) * cos;
    const bendY = cy + (outerRadius + 12) * sin;
    const columnX = slot.right ? cx + outerRadius + PIE_LABEL_COLUMN_OFFSET : cx - outerRadius - PIE_LABEL_COLUMN_OFFSET;
    const textX = columnX + (slot.right ? 4 : -4);

    const suffix = `: ${(percent * 100).toFixed(1)}%`;
    const room = Math.floor((slot.right ? cx * 2 - textX - 4 : textX - 4) / PIE_LABEL_CHAR_WIDTH);
    const label = String(name ?? "");
    const nameRoom = Math.max(room - suffix.length, 5);
    const shown = label.length > nameRoom ? `${label.slice(0, nameRoom - 1)}…` : label;

    // While a slice is hovered its label turns bold with a thicker leader line and every other label softens, so the
    // pair is easy to find; with nothing hovered all labels look the same.
    const active = activeIndex === index;
    const softened = activeIndex !== null && !active;
    return (
      <g opacity={softened ? 0.35 : 1}>
        <polyline points={`${edgeX},${edgeY} ${bendX},${bendY} ${columnX},${slot.y}`} fill="none" stroke={colorAt(index)} strokeWidth={active ? 2.5 : 1} />
        <text
          x={textX}
          y={slot.y}
          textAnchor={slot.right ? "start" : "end"}
          dominantBaseline="central"
          fontSize={PIE_LABEL_FONT_SIZE}
          fontWeight={active ? 700 : 400}
          className="fill-slate-700 dark:fill-slate-200"
        >
          {shown + suffix}
        </text>
      </g>
    );
  };
}

export const PieChartCard = memo(function PieChartCard({
  title,
  subtitle,
  data,
  className,
  dataKey = "value",
  nameKey = "name",
  onSliceClick,
}: ChartCardProps & { dataKey?: string; nameKey?: string; /** Makes each slice a drill-down trigger — e.g. a category slice loading its per-location breakdown. Gets a pointer cursor automatically. */ onSliceClick?: (point: Record<string, string | number>, index: number) => void }) {
  const renderLabel = useMemo(() => createPieLabelRenderer(data.map((d) => Number(d[dataKey]) || 0), categoricalAt), [data, dataKey]);
  const sliceShape = useMemo(() => coloredSlice(categoricalAt), []);
  return (
    <Card className={className}>
      <ChartHeader title={title} subtitle={subtitle} />
      {/* Taller + a smaller ring than a legend-only pie — the radiating labels below need
          margin between the ring and the card edge to not get clipped. */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              innerRadius={58}
              outerRadius={88}
              paddingAngle={PIE_PADDING_ANGLE}
              startAngle={PIE_START_ANGLE}
              endAngle={PIE_END_ANGLE}
              label={renderLabel}
              labelLine={false}
              className={onSliceClick ? "cursor-pointer" : undefined}
              onClick={onSliceClick ? (_point, index) => onSliceClick(data[index], index) : undefined}
              shape={sliceShape}
              isAnimationActive={false}
            />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
});

export interface MultiLineChartCardProps {
  title: string;
  subtitle?: string;
  data: Record<string, string | number>[];
  /** One line per key, e.g. [{ key: "thisYear", label: "This year", color: "#2563eb" }, ...]. */
  series: { key: string; label: string; color: string }[];
  xKey?: string;
  className?: string;
  /** "line" (default) — plain comparison lines, unchanged from before. "area" — each series
   * gets its own soft gradient fill under a smoother, thicker line plus a glowing active dot on
   * hover; reach for this on a card's headline chart (e.g. a Cost Comparison panel) where the
   * extra visual weight earns its place, not on dense grids of small multiples. */
  variant?: "line" | "area";
}

/** Multiple series on one chart — e.g. this year vs. last year, or a comparison across warehouses. */
export const MultiLineChartCard = memo(function MultiLineChartCard({ title, subtitle, data, series, xKey = "name", className, variant = "line" }: MultiLineChartCardProps) {
  const gradientIds = series.map((s) => `mlc-fill-${s.key}`);
  return (
    <Card className={className}>
      <ChartHeader title={title} subtitle={subtitle} />
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {variant === "area" ? (
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <defs>
                {series.map((s, i) => (
                  <linearGradient key={s.key} id={gradientIds[i]} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="currentColor" className="text-slate-400" axisLine={false} tickLine={false} />
              <YAxis {...yAxisProps(data, series.map((x) => x.key))} />
              <Tooltip content={<ThemedTooltip />} cursor={{ stroke: "var(--brand-400)", strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              {series.map((s, i) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2.5}
                  fill={`url(#${gradientIds[i]})`}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="currentColor" className="text-slate-400" axisLine={false} tickLine={false} />
              <YAxis {...yAxisProps(data, series.map((x) => x.key))} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {series.map((s) => (
                <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
});

export interface ComparisonChartCardProps {
  title: string;
  subtitle?: string;
  data: Record<string, string | number>[];
  /** One series per key, e.g. [{ key: "current", label: "Current month", color: "#2563eb" }, ...]. */
  series: { key: string; label: string; color: string }[];
  xKey?: string;
  className?: string;
  /** Which chart type is selected on first render — the reader can still switch away via the
   * toggle. Default "area". */
  defaultChartType?: "area" | "line" | "bar";
}

const COMPARISON_CHART_TYPES = [
  { label: "Area", value: "area" as const, icon: AreaChartIcon },
  { label: "Line", value: "line" as const, icon: LineChartIcon },
  { label: "Bar", value: "bar" as const, icon: BarChart3 },
];

/** Like `MultiLineChartCard`, but with a built-in Area/Line/Bar toggle instead of a single fixed
 * `variant` prop — for a headline comparison chart (e.g. Cost Comparison on Location Summary /
 * Overall Summary) where different readers want different chart shapes for the same two-series
 * data, without three separate cards competing for space. The toggle is local UI state, not a
 * prop — each card remembers its own choice independently. */
export const ComparisonChartCard = memo(function ComparisonChartCard({
  title,
  subtitle,
  data,
  series,
  xKey = "name",
  className,
  defaultChartType = "area",
}: ComparisonChartCardProps) {
  const [chartType, setChartType] = useState<"area" | "line" | "bar">(defaultChartType);
  const gradientIds = series.map((s) => `comparison-fill-${s.key}`);

  return (
    <Card className={className}>
      <ChartHeader
        title={title}
        subtitle={subtitle}
        actions={<Segmented options={COMPARISON_CHART_TYPES} value={chartType} onChange={setChartType} />}
      />
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" && (
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <defs>
                {series.map((s, i) => (
                  <linearGradient key={s.key} id={gradientIds[i]} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="currentColor" className="text-slate-400" axisLine={false} tickLine={false} />
              <YAxis {...yAxisProps(data, series.map((x) => x.key))} />
              <Tooltip content={<ThemedTooltip />} cursor={{ stroke: "var(--brand-400)", strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              {series.map((s, i) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2.5}
                  fill={`url(#${gradientIds[i]})`}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                />
              ))}
            </AreaChart>
          )}
          {chartType !== "area" && (chartType === "line") && (
            <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="currentColor" className="text-slate-400" axisLine={false} tickLine={false} />
              <YAxis {...yAxisProps(data, series.map((x) => x.key))} />
              <Tooltip content={<ThemedTooltip />} cursor={{ stroke: "var(--brand-400)", strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              {series.map((s) => (
                <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} />
              ))}
            </LineChart>
          )}
          {chartType !== "area" && chartType !== "line" && (
            <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="currentColor" className="text-slate-400" axisLine={false} tickLine={false} />
              <YAxis {...yAxisProps(data, series.map((x) => x.key))} />
              <Tooltip content={<ThemedTooltip />} cursor={{ fill: "rgba(37,99,235,0.06)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              {series.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[6, 6, 0, 0]} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
});

export interface DistributionChartCardProps {
  title: string;
  subtitle?: string;
  /** One entry per category — e.g. `{ name: "Meat", value: 12000 }`. */
  data: { name: string; value: number }[];
  className?: string;
  /** Which chart shape is selected on first render — the reader can still switch via the
   * built-in toggle. Default "pie". */
  defaultChartType?: "pie" | "bar" | "barHorizontal";
  /** Short caption under the pie's center total, e.g. "Total cost". */
  centerLabel?: string;
  /** Formats the center total and tooltip/axis values — defaults to `Number.toLocaleString()`. */
  formatValue?: (value: number) => string;
  /** Makes each slice/bar a drill-down trigger (e.g. loading that category's own breakdown, or
   * navigating to a detail screen). Gets a pointer cursor automatically. */
  onSelect?: (point: { name: string; value: number }, index: number) => void;
  /** For a chart that already sits under its own section heading (inside a card): no card border, padding or
   * title of its own — just the Labels / Pie / Bar / Rank switch above the chart. Without it, a heading, a card
   * and a second heading stack up around the same chart. */
  embedded?: boolean;
}

const DISTRIBUTION_CHART_TYPES = [
  { label: "Pie", value: "pie" as const, icon: PieChartIcon },
  { label: "Bar", value: "bar" as const, icon: BarChart3 },
  { label: "Rank", value: "barHorizontal" as const, icon: AlignLeft },
];

/** Past this many categories, the bar views show only the top N by value (still sorted, still
 * accurate — just not 30+ illegible bars crammed into one card) — the pie view keeps showing
 * every slice, each with its own radiating data label (see `renderPieLabel`) plus a hover
 * tooltip, so nothing is hidden there the way a legend would need to be past this size. */
const DISTRIBUTION_BAR_LIMIT = 12;
/** Longest category name the Rank view's axis shows before ending it with an ellipsis (the tooltip has the full name). */
const RANK_NAME_MAX = 24;

/** A "one value per category" breakdown — e.g. cost by category, cost by location — with a
 * built-in Pie/Bar/Rank(horizontal-bar) toggle instead of a single fixed chart, plus a center
 * total and per-slice data labels on the pie view (see `renderPieLabel`) so it never reads as
 * an empty/dull ring. Same "let the reader pick the shape" pattern as `ComparisonChartCard` —
 * see Overall Summary's Categories-by-Cost / Total Cost Distribution panels and Location
 * Summary's own distribution charts for reference usage. */
type DistributionPoint = DistributionChartCardProps["data"][number];

/** A pie slice; `isOthers` marks the combined "Others" slice (not a real category, so it cannot be drilled into). */
type PiePoint = DistributionPoint & { isOthers?: boolean };

/** A pie with more slices than this shows its largest ones and folds the rest into one grey "Others" slice: past
 * about this many, slivers and their labels pile up into an unreadable fan. Every entry is still in the table
 * beside the chart, and the Bar / Rank views keep their own top-N cap. */
const PIE_SLICE_LIMIT = 20;
const OTHERS_FILL = "#94a3b8";

/** The slices a pie draws: everything when it is small enough, otherwise the biggest plus a combined "Others". */
export function pieSlices(sorted: DistributionPoint[]): PiePoint[] {
  if (sorted.length <= PIE_SLICE_LIMIT) return sorted;
  const keep = sorted.slice(0, PIE_SLICE_LIMIT - 1);
  const rest = sorted.slice(PIE_SLICE_LIMIT - 1);
  return [...keep, { name: `Others (${rest.length})`, value: rest.reduce((sum, d) => sum + d.value, 0), isOthers: true }];
}

/** Eye / Eye-off toggle that shows or hides the pie's data labels. */
function LabelsToggle({ showLabels, onToggle }: Readonly<{ showLabels: boolean; onToggle: () => void }>) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={showLabels ? "Hide data labels" : "Show data labels"}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
        showLabels
          ? "bg-white text-brand-700 shadow-soft dark:bg-slate-700 dark:text-brand-300"
          : "bg-slate-100 text-slate-500 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      )}
    >
      {showLabels ? <Eye className="h-3.5 w-3.5 shrink-0" /> : <EyeOff className="h-3.5 w-3.5 shrink-0" />}
      Labels
    </button>
  );
}

interface DistributionBarsProps {
  barData: DistributionPoint[];
  sorted: DistributionPoint[];
  horizontal: boolean;
  title: string;
  formatValue: (v: number) => string;
  clickable: boolean;
  onPick: (point: DistributionPoint, index: number) => void;
}

/** The bar and rank (horizontal bar) views of a distribution. */
function DistributionBars({ barData, sorted, horizontal, title, formatValue, clickable, onPick }: Readonly<DistributionBarsProps>) {
  const bar = (
    <Bar
      dataKey="value"
      name={title}
      radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
      className={clickable ? "cursor-pointer" : undefined}
      onClick={clickable ? (_point, index) => onPick(barData[index], index) : undefined}
      shape={coloredBar((i) => categoricalAt(sorted.indexOf(barData[i])))}
    />
  );
  const axes = horizontal ? (
    <>
      <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-slate-100 dark:stroke-slate-800" />
      <XAxis type="number" tick={{ fontSize: 12 }} stroke="currentColor" className="text-slate-400" axisLine={false} tickLine={false} tickFormatter={compactNumber} />
      <YAxis
        type="category"
        dataKey="name"
        width={Math.min(200, Math.max(60, Math.max(...barData.map((d) => Math.min(String(d.name).length, RANK_NAME_MAX)), 1) * 7.4 + 14))}
        tick={{ fontSize: 12 }}
        stroke="currentColor"
        className="text-slate-400"
        axisLine={false}
        tickLine={false}
        interval={0}
        tickFormatter={(name: string) => (String(name).length > RANK_NAME_MAX ? `${String(name).slice(0, RANK_NAME_MAX - 1)}…` : String(name))}
      />
    </>
  ) : (
    <>
      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={70} interval={0} tickFormatter={(name: string) => (String(name).length > 18 ? `${String(name).slice(0, 17)}…` : String(name))} />
      <YAxis {...yAxisProps(barData, ["value"], formatValue)} />
    </>
  );
  return (
    <div className={horizontal ? "h-80" : "h-72"}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={barData}
          layout={horizontal ? "vertical" : undefined}
          margin={horizontal ? { top: 8, right: 24, left: 8, bottom: 0 } : { top: 8, right: 12, left: 4, bottom: 0 }}
        >
          {axes}
          <Tooltip content={<ThemedTooltip />} cursor={{ fill: "rgba(37,99,235,0.06)" }} />
          {bar}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DistributionPieProps {
  sorted: PiePoint[];
  total: number;
  showLabels: boolean;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
  formatValue: (v: number) => string;
  centerLabel?: string;
  clickable: boolean;
  onPick: (point: DistributionPoint, index: number) => void;
}

/** The pie view of a distribution, with a centre total and per-slice labels. */
function DistributionPie({
  sorted,
  total,
  showLabels,
  hoveredIndex,
  setHoveredIndex,
  formatValue,
  centerLabel,
  clickable,
  onPick,
}: Readonly<DistributionPieProps>) {
  const sliceColor = useMemo(() => (index: number) => (sorted[index]?.isOthers ? OTHERS_FILL : categoricalAt(index)), [sorted]);
  const renderLabel = useMemo(() => createPieLabelRenderer(sorted.map((d) => d.value), sliceColor, hoveredIndex), [sorted, sliceColor, hoveredIndex]);
  const sliceShape = useMemo(() => coloredSlice(sliceColor, hoveredIndex), [sliceColor, hoveredIndex]);
  return (
    <div className="relative h-[28rem]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            // Largest-first order (same sort the bar/rank views already use) instead of the
            // raw data order — groups similarly-sized slices together so their radiating
            // labels fan out more evenly instead of criss-crossing between a big slice and a
            // tiny one sitting next to it.
            data={sorted}
            dataKey="value"
            nameKey="name"
            innerRadius={66}
            outerRadius={98}
            paddingAngle={PIE_PADDING_ANGLE}
            startAngle={PIE_START_ANGLE}
            endAngle={PIE_END_ANGLE}
            label={showLabels ? renderLabel : undefined}
            labelLine={false}
            className={clickable ? "cursor-pointer" : undefined}
            onClick={clickable ? (_point, index) => !sorted[index].isOthers && onPick(sorted[index], index) : undefined}
            onMouseEnter={(_point, index) => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            shape={sliceShape}
            // No draw-in animation: it restarts whenever the chart re-renders (every hover) and hides the labels
            // while it runs. The slices and their labels are simply there.
            isAnimationActive={false}
          />
          <Tooltip content={<ThemedTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center total — keeps the ring from reading as an empty/dull shape; mirrors the old
          ElmsWatch app's own Highcharts center-text treatment on this exact chart. Fades out
          while a slice is hovered so it never overlaps the hover tooltip (see `hoveredIndex`
          above). */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex flex-col items-center justify-center transition-opacity",
          hoveredIndex !== null && "opacity-0"
        )}
      >
        <span className="text-xl font-semibold text-slate-900 dark:text-slate-50">{formatValue(total)}</span>
        {centerLabel && <span className="text-caption mt-0.5">{centerLabel}</span>}
      </div>
    </div>
  );
}

export const DistributionChartCard = memo(function DistributionChartCard({
  title,
  subtitle,
  data,
  className,
  defaultChartType = "pie",
  centerLabel,
  formatValue = (v) => v.toLocaleString(),
  onSelect,
  embedded = false,
}: DistributionChartCardProps) {
  const [chartType, setChartType] = useState<"pie" | "bar" | "barHorizontal">(defaultChartType);
  // Data labels default on for every pie, regardless of slice count — the Hide/Show toggle next
  // to it is exactly for a reader who finds a busy, many-slice chart's labels too crowded and
  // wants to turn them off, not something they should have to turn *on* first for a chart to be
  // useful at a glance.
  const [showLabels, setShowLabels] = useState(true);
  // Recharts' hover tooltip follows the cursor within the chart's own box — for a slice near
  // the top/bottom of the ring, that can land right in the donut's hole, on top of the center
  // total below. Hiding the center total while a slice is actively hovered (instead of trying
  // to out-guess the tooltip's own positioning) guarantees they never visually collide.
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const barData = sorted.slice(0, DISTRIBUTION_BAR_LIMIT);
  const truncated = sorted.length > DISTRIBUTION_BAR_LIMIT;
  const clickable = !!onSelect;

  const slices = pieSlices(sorted);
  const pieFolded = slices.length < sorted.length;

  function handlePick(point: DistributionPoint, index: number) {
    onSelect?.({ name: String(point.name), value: Number(point.value) }, index);
  }

  const switches = (
    <div className="flex flex-wrap items-center gap-2">
      {chartType === "pie" && <LabelsToggle showLabels={showLabels} onToggle={() => setShowLabels((v) => !v)} />}
      <Segmented options={DISTRIBUTION_CHART_TYPES} value={chartType} onChange={setChartType} />
    </div>
  );
  const Frame = embedded ? "div" : Card;

  return (
    <Frame className={className}>
      {embedded ? <div className="mb-2 flex justify-end">{switches}</div> : <ChartHeader title={title} subtitle={subtitle} actions={switches} />}
      {chartType === "pie" ? (
        <>
        <DistributionPie
          sorted={slices}
          total={total}
          showLabels={showLabels}
          hoveredIndex={hoveredIndex}
          setHoveredIndex={setHoveredIndex}
          formatValue={formatValue}
          centerLabel={centerLabel}
          clickable={clickable}
          onPick={handlePick}
        />
        {pieFolded && (
          <p className="text-caption mt-1 text-center">
            Showing the largest {slices.length - 1} of {sorted.length}; the rest are combined as "Others" — see the table for every entry.
          </p>
        )}
        </>
      ) : (
        <>
          <DistributionBars
            barData={barData}
            sorted={sorted}
            horizontal={chartType === "barHorizontal"}
            title={title}
            formatValue={formatValue}
            clickable={clickable}
            onPick={handlePick}
          />
          {truncated && (
            <p className="text-caption mt-2 text-center">
              Top {DISTRIBUTION_BAR_LIMIT} of {sorted.length} — switch to Pie to see every entry.
            </p>
          )}
        </>
      )}
    </Frame>
  );
});

/** A themed tooltip (light/dark aware, matches the app's card styling) — recharts' built-in
 * `contentStyle` is a plain inline-style object, so it can't read Tailwind's `dark:` variants;
 * this renders a real element instead so it always matches the surrounding page. */
function ThemedTooltip({ active, payload, label }: Readonly<{ active?: boolean; payload?: { name?: string; value?: number | string; color?: string }[]; label?: string }>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-elevated backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
      {label && <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">{label}</p>}
      <div className="space-y-0.5">
        {payload.map((p) => (
          <div key={`${p.name}-${p.color}`} className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-slate-500 dark:text-slate-400">{p.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-slate-800 dark:text-slate-100">
              {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface RadialGaugeChartCardProps {
  title: string;
  subtitle?: string;
  /** 0-100. */
  value: number;
  /** Center caption under the percentage, e.g. "of monthly target". */
  caption?: string;
  color?: string;
  className?: string;
}

/** Single-metric radial gauge — e.g. "% of monthly target reached", warehouse capacity used, SLA compliance. */
export const RadialGaugeChartCard = memo(function RadialGaugeChartCard({ title, subtitle, value, caption, color = "#2563eb", className }: RadialGaugeChartCardProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <Card className={className}>
      <ChartHeader title={title} subtitle={subtitle} />
      <div className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={[{ value: pct, fill: color }]}
            innerRadius="70%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            barSize={16}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "rgba(148,163,184,0.18)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{pct}%</span>
          {caption && <span className="text-caption mt-0.5">{caption}</span>}
        </div>
      </div>
    </Card>
  );
});

/** `actions` is an optional right-aligned slot (e.g. `ComparisonChartCard`'s chart-type
 * `Segmented` toggle) — omit it for the plain title/subtitle-only header every other chart
 * card here uses. */
export function ChartHeader({ title, subtitle, actions }: Readonly<{ title: string; subtitle?: string; actions?: ReactNode }>) {
  return (
    <div className={cn("mb-4", actions && "flex flex-wrap items-start justify-between gap-3")}>
      <div>
        <h3 className="text-section-title">{title}</h3>
        {subtitle && <p className="text-caption">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
