import { CreditCard, DollarSign, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { StatCard } from "../components/charts/StatCard";
import { LineAreaChartCard, BarChartCard, PieChartCard, MultiLineChartCard, ComparisonChartCard, DistributionChartCard, RadialGaugeChartCard } from "../components/charts/ChartCards";
import { PreviewPage, PreviewSection, ComponentApi } from "./PreviewSection";

const revenue = [
  { name: "Mon", value: 4200 }, { name: "Tue", value: 5100 }, { name: "Wed", value: 4800 },
  { name: "Thu", value: 6300 }, { name: "Fri", value: 7100 }, { name: "Sat", value: 5900 }, { name: "Sun", value: 6600 },
];
const orders = [
  { name: "Jan", value: 320 }, { name: "Feb", value: 410 }, { name: "Mar", value: 380 },
  { name: "Apr", value: 500 }, { name: "May", value: 460 }, { name: "Jun", value: 610 },
];
const channels = [
  { name: "Web", value: 45 }, { name: "Mobile", value: 30 }, { name: "Partner", value: 15 }, { name: "Retail", value: 10 },
];
const yearComparison = [
  { name: "Jan", thisYear: 320, lastYear: 260 }, { name: "Feb", thisYear: 410, lastYear: 340 },
  { name: "Mar", thisYear: 380, lastYear: 300 }, { name: "Apr", thisYear: 500, lastYear: 420 },
  { name: "May", thisYear: 460, lastYear: 390 }, { name: "Jun", thisYear: 610, lastYear: 480 },
];
const revenueTrend = [4200, 4600, 4300, 5100, 4800, 5900, 6300, 6100, 6600, 7100];
// Deliberately more than DistributionChartCard's legend/bar-truncation thresholds — shows off
// the center-total treatment (no legend past 8) and the "Top 12 of N" bar-view truncation.
const manyLocations = [
  { name: "OMA11303", value: 3599 }, { name: "OMA11362", value: 2317 }, { name: "OMA11334", value: 2195 },
  { name: "OMA11355", value: 2144 }, { name: "OMA11357", value: 2040 }, { name: "OMA16041", value: 1851 },
  { name: "OMA11350", value: 1837 }, { name: "OMA11297", value: 1697 }, { name: "OMA11326", value: 1520 },
  { name: "OMA11351", value: 1410 }, { name: "OMA11339", value: 1280 }, { name: "OMA11345", value: 1190 },
  { name: "OMA11360", value: 980 }, { name: "OMA14001", value: 860 }, { name: "OMA17081", value: 740 },
];

export function ChartsPreviewPage() {
  return (
    <PreviewPage title="Charts" description="Recharts-based cards for dashboards, plus icon stat cards for KPI rows.">
      <PreviewSection title="Stat cards" description={'Solid, colored backgrounds (variant="solid", the default) — used for the Overview page\'s own KPI strip too.'}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Revenue" value="$48,204" icon={CreditCard} trend={{ value: "+12.4%", direction: "up" }} tone="brand" />
          <StatCard label="Orders" value="1,204" icon={ShoppingCart} trend={{ value: "+4.1%", direction: "up" }} tone="emerald" />
          <StatCard label="Active Users" value="8,912" icon={Users} trend={{ value: "-1.2%", direction: "down" }} tone="violet" />
          <StatCard label="Pending Shipments" value="76" icon={Package} tone="amber" />
        </div>
        <ComponentApi
          importCode={'import { StatCard } from "../components/charts/StatCard";'}
          props={[
            { name: "label / value", type: "string / string | number", description: "The metric name and its current value." },
            { name: "icon", type: "LucideIcon", description: "Rendered in a tinted/translucent badge — color follows tone and variant." },
            { name: "tone", type: '"brand" | "emerald" | "amber" | "red" | "violet"', default: '"brand"', description: "Accent color — \"brand\" follows the app's accent color." },
            { name: "variant", type: '"solid" | "soft" | "outline" | "minimal" | "pill" | "sparkline" | "progress"', default: '"solid"', description: "Visual style — see the sections below for each." },
            { name: "size", type: '"xs" | "sm" | "md"', default: '"md"', description: '"sm" is a denser card for sidebars, tight grids, or a table header strip; "xs" is denser still — a dense-enterprise-report KPI row where six-plus cards share one line.' },
            { name: "trend", type: '{ value: string; direction: "up" | "down" }', description: "Optional — renders a small pill/inline badge under or beside the value." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Stat card variants" description="Same data, four visual styles — pick whichever fits the surface it sits on.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Revenue" value="$48,204" icon={CreditCard} trend={{ value: "+12.4%", direction: "up" }} tone="brand" variant="solid" />
          <StatCard label="Total Revenue" value="$48,204" icon={CreditCard} trend={{ value: "+12.4%", direction: "up" }} tone="brand" variant="soft" />
          <StatCard label="Total Revenue" value="$48,204" icon={CreditCard} trend={{ value: "+12.4%", direction: "up" }} tone="brand" variant="outline" />
          <StatCard label="Total Revenue" value="$48,204" icon={CreditCard} trend={{ value: "+12.4%", direction: "up" }} tone="brand" variant="minimal" />
        </div>
      </PreviewSection>

      <PreviewSection title="Sparkline & progress stat cards" description={'variant="sparkline" renders a lightweight pure-SVG trend line (no chart library) under the value; variant="progress" renders a linear progress bar toward a target — both use the outline-card layout.'}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Revenue" value="$48,204" icon={CreditCard} trend={{ value: "+12.4%", direction: "up" }} tone="brand" variant="sparkline" sparklineData={revenueTrend} />
          <StatCard label="Active Users" value="8,912" icon={Users} trend={{ value: "-1.2%", direction: "down" }} tone="red" variant="sparkline" sparklineData={[9200, 9050, 8990, 9100, 8800, 8912]} />
          <StatCard label="Warehouse capacity" value="68%" icon={Package} tone="amber" variant="progress" progress={68} progressLabel="6,800 of 10,000 units" />
          <StatCard label="Monthly quota" value="$32,100" icon={DollarSign} tone="emerald" variant="progress" progress={92} progressLabel="92% of $35,000 target" />
        </div>
        <ComponentApi
          importCode={'<StatCard variant="sparkline" sparklineData={[4200, 4600, ...]} ... />\n<StatCard variant="progress" progress={68} progressLabel="6,800 of 10,000 units" ... />'}
          props={[
            { name: "sparklineData", type: "number[]", description: 'variant="sparkline" only — most-recent-last series, auto-scaled to fit.' },
            { name: "progress", type: "number", description: 'variant="progress" only — 0-100, clamped.' },
            { name: "progressLabel", type: "string", default: '"{progress}%"', description: "Caption under the bar." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Compact KPI strip" description={'variant="minimal" size="sm" — a circular solid-color icon badge, value+label beside it, and a colored left accent bar. Built for a row of small KPI cards like this.'}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Sales" value="230k" icon={TrendingUp} tone="violet" size="sm" variant="minimal" />
          <StatCard label="Customers" value="3456" icon={Users} tone="brand" size="sm" variant="minimal" />
          <StatCard label="Products" value="3456" icon={Package} tone="amber" size="sm" variant="minimal" />
          <StatCard label="Orders" value="12658" icon={ShoppingCart} tone="red" size="sm" variant="minimal" />
          <StatCard label="Revenue" value="$948,560" icon={DollarSign} tone="emerald" size="sm" variant="minimal" />
        </div>
      </PreviewSection>

      <PreviewSection title="Pill KPI strip" description={'variant="pill" — fully rounded (rounded-full), a thin border all the way around instead of a left accent bar, solid-color circular icon badge, value+label stacked beside it. Same compact row use case as the minimal variant above, different shape.'}>
        <div className="flex flex-wrap gap-3">
          <StatCard label="Sales" value="230k" icon={TrendingUp} tone="violet" size="sm" variant="pill" />
          <StatCard label="Customers" value="3456" icon={Users} tone="brand" size="sm" variant="pill" />
          <StatCard label="Products" value="3456" icon={Package} tone="amber" size="sm" variant="pill" />
          <StatCard label="Orders" value="12658" icon={ShoppingCart} tone="red" size="sm" variant="pill" />
          <StatCard label="Revenue" value="$948,560" icon={DollarSign} tone="emerald" size="sm" variant="pill" />
        </div>
        <ComponentApi
          importCode={'<StatCard label="Sales" value="230k" icon={TrendingUp} tone="violet" size="sm" variant="pill" />'}
          props={[
            { name: "variant", type: '"pill"', description: "Same StatCard props as every other variant (label, value, icon, tone, trend, size) — just a different shape." },
            { name: "trend", type: '{ value: string; direction: "up" | "down" }', description: "Optional — renders after the label as a small inline badge, same as the minimal variant." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Small stat cards" description={'size="sm" — the same four variants, compact enough for a sidebar widget, a dense grid, or a strip above a table.'}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Revenue" value="$48.2k" icon={CreditCard} trend={{ value: "+12.4%", direction: "up" }} tone="brand" size="sm" variant="solid" />
          <StatCard label="Orders" value="1,204" icon={ShoppingCart} trend={{ value: "+4.1%", direction: "up" }} tone="emerald" size="sm" variant="soft" />
          <StatCard label="Users" value="8,912" icon={Users} trend={{ value: "-1.2%", direction: "down" }} tone="violet" size="sm" variant="outline" />
          <StatCard label="Pending" value="76" icon={Package} tone="amber" size="sm" variant="minimal" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <StatCard label="Refunds" value="12" icon={Package} tone="red" size="sm" variant="minimal" trend={{ value: "-2", direction: "down" }} />
          <StatCard label="New signups" value="342" icon={Users} tone="brand" size="sm" variant="minimal" trend={{ value: "+18%", direction: "up" }} />
        </div>
      </PreviewSection>

      <PreviewSection title="Trend & distribution charts">
        <div className="grid gap-4 lg:grid-cols-2">
          <LineAreaChartCard title="Weekly revenue" subtitle="Last 7 days" data={revenue} />
          <BarChartCard title="Monthly orders" subtitle="Last 6 months" data={orders} />
          <PieChartCard title="Orders by channel" subtitle="This month" data={channels} className="lg:col-span-2" />
        </div>
        <ComponentApi
          importCode={'import { LineAreaChartCard, BarChartCard, PieChartCard } from "../components/charts/ChartCards";'}
          props={[
            { name: "title / subtitle", type: "string", description: "Card header." },
            { name: "data", type: "Record<string, string | number>[]", description: "Recharts-shaped data — e.g. [{ name: \"Mon\", value: 4200 }]." },
            { name: "dataKey / xKey / nameKey", type: "string", default: '"value" / "name" / "name"', description: "Override if your data uses different field names." },
            { name: "className", type: "string", description: "e.g. lg:col-span-2 to make the pie chart span the full grid width." },
            { name: "series (BarChartCard)", type: "{key,label,color}[]", description: "Grouped multi-series bars (e.g. Cost vs Waste per category) instead of a single dataKey." },
            { name: "colors (BarChartCard)", type: "string[]", description: "Single-series mode only — a color per bar/category instead of one flat fill, cycling if there are more bars than colors." },
            { name: "barSize (BarChartCard)", type: "number", description: "Caps each bar's pixel width — narrower than the default auto-width for charts with few categories." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Distribution chart with a Pie/Bar/Rank toggle" description="Same one-value-per-category data as the pie chart above, but with a built-in chart-type switcher and a center total — this is what Overall Summary's Categories by Cost / Total Cost Distribution panels actually use.">
        <DistributionChartCard title="Warehouse locations by cost" subtitle="This month" centerLabel="Total cost" formatValue={(v) => `$${v.toLocaleString()}`} data={manyLocations} />
        <ComponentApi
          importCode={'import { DistributionChartCard } from "../components/charts/ChartCards";'}
          props={[
            { name: "data", type: "{ name, value }[]", description: "One entry per category — e.g. cost by location." },
            { name: "defaultChartType", type: '"pie" | "bar" | "barHorizontal"', default: '"pie"', description: 'Which shape is selected on first render — "Rank" in the toggle is the horizontal-bar option, best for many long category names.' },
            { name: "centerLabel / formatValue", type: "string / (value) => string", description: "Caption under the pie's center total, and how that total (plus tooltip/axis values) is formatted — defaults to toLocaleString()." },
            { name: "onSelect", type: "(point, index) => void", description: "Makes every slice/bar a drill-down trigger — gets a pointer cursor automatically." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Comparison & gauge charts">
        <div className="grid gap-4 lg:grid-cols-2">
          <MultiLineChartCard
            title="Orders: this year vs. last year"
            subtitle="Jan - Jun"
            data={yearComparison}
            series={[
              { key: "thisYear", label: "This year", color: "#2563eb" },
              { key: "lastYear", label: "Last year", color: "#94a3b8" },
            ]}
          />
          <RadialGaugeChartCard title="SLA compliance" subtitle="This month" value={87} caption="of on-time deliveries" color="#10b981" />
        </div>
        <div className="mt-4">
          <ComparisonChartCard
            title="Orders: this year vs. last year"
            subtitle="Same data as above, but with a built-in Area/Line/Bar toggle (top-right) instead of a fixed variant — this is what the Location Summary and Overall Summary Cost Comparison panels actually use, so a reader can pick whichever chart shape reads best for them."
            data={yearComparison}
            series={[
              { key: "thisYear", label: "This year", color: "#2563eb" },
              { key: "lastYear", label: "Last year", color: "#10b981" },
            ]}
          />
        </div>
        <ComponentApi
          importCode={'import { MultiLineChartCard, ComparisonChartCard, RadialGaugeChartCard } from "../components/charts/ChartCards";'}
          props={[
            { name: "series", type: "{ key, label, color }[]", description: "MultiLineChartCard / ComparisonChartCard — one line/series per entry, e.g. this year vs. last year." },
            { name: "data / xKey", type: "—", description: "MultiLineChartCard / ComparisonChartCard — same shape as the other chart cards." },
            { name: "variant", type: '"line" | "area"', description: 'MultiLineChartCard only — "area" adds a gradient fill under each series, a light/dark-aware tooltip, and a glowing active dot. Default "line" is unchanged.' },
            { name: "defaultChartType", type: '"area" | "line" | "bar"', description: "ComparisonChartCard only — which chart shape is selected on first render; the reader can still switch via the built-in toggle. Default \"area\"." },
            { name: "value", type: "number", description: "RadialGaugeChartCard — 0-100, drawn as a single-ring radial gauge." },
            { name: "caption / color", type: "string", description: "RadialGaugeChartCard — caption under the percentage; color defaults to the brand blue." },
          ]}
        />
      </PreviewSection>
    </PreviewPage>
  );
}
