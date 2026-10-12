import { Tabs, TabPanel } from "../../../components/common/Tabs";
import { BarChartCard, MultiLineChartCard } from "../../../components/charts/ChartCards";
import type { LocationInsightGraphTab as GraphTab } from "../../../components/onboarding/screenSteps/locationInsight";
import type { SeriesPoint, SplitPrjPoint } from "./data";

const GRAPH_TABS = [
  { id: "cumulDailyCost" as const, label: "Cumul Daily Cost" },
  { id: "dailyConsumption" as const, label: "Daily Consumption" },
  { id: "mandays" as const, label: "Mandays" },
  { id: "splitByPrj" as const, label: "Split By PRJ" },
];

interface InsightGraphsProps {
  cumulDailyCost: SeriesPoint[];
  dailyConsumption: SeriesPoint[];
  mandays: SeriesPoint[];
  splitByPrj: SplitPrjPoint[];
  /** Owned by the page (not local state) so the "Show tour" walkthrough can switch charts. */
  tab: GraphTab;
  onTabChange: (tab: GraphTab) => void;
}

/** "Graphical Presentation" card — mirrors the old app's 4-tab chart switcher (index.jsx
 * `graphTabConfig`/`activeGraph`, ~line 520) exactly: one chart visible at a time rather than
 * `LocationDetailsPage/DetailGraphs`'s 3-tab mix, since this screen has no filter/drill-down on
 * top of any of them — just the reporting month and the picked location. */
export function InsightGraphs({ cumulDailyCost, dailyConsumption, mandays, splitByPrj, tab, onTabChange }: Readonly<InsightGraphsProps>) {
  return (
    <div className="space-y-4">
      <div data-tour="location-insight-tabs">
        <Tabs items={GRAPH_TABS} value={tab} onChange={(id) => onTabChange(id as GraphTab)} />
      </div>
      <TabPanel active={tab === "cumulDailyCost"}>
        <MultiLineChartCard
          title="Cumul Daily Cost"
          subtitle="Cost per manday, cumulative through the month"
          data={cumulDailyCost}
          xKey="date"
          variant="area"
          series={[{ key: "value", label: "Cumul daily cost", color: "#2563eb" }]}
        />
      </TabPanel>
      <TabPanel active={tab === "dailyConsumption"}>
        <BarChartCard title="Daily Consumption" subtitle="Amount by date" data={dailyConsumption} xKey="date" dataKey="value" />
      </TabPanel>
      <TabPanel active={tab === "mandays"}>
        <MultiLineChartCard
          title="Mandays"
          subtitle="Daily mandays for the reporting month"
          data={mandays}
          xKey="date"
          variant="area"
          series={[{ key: "value", label: "Mandays", color: "#10b981" }]}
        />
      </TabPanel>
      <TabPanel active={tab === "splitByPrj"}>
        <MultiLineChartCard
          title="Split By PRJ"
          subtitle="Cost split into Food / Cleaning / Disposal / Others"
          data={splitByPrj}
          xKey="date"
          series={[
            { key: "food", label: "Food", color: "#2563eb" },
            { key: "cleaning", label: "Cleaning", color: "#10b981" },
            { key: "disposal", label: "Disposal", color: "#f59e0b" },
            { key: "others", label: "Others", color: "#a855f7" },
          ]}
        />
      </TabPanel>
    </div>
  );
}
