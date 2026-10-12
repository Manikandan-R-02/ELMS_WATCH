import { useState } from "react";
import { HelpCircle, Info, Settings, Star } from "lucide-react";
import { Tabs, TabPanel } from "../components/common/Tabs";
import { Tooltip } from "../components/common/Tooltip";
import { Accordion } from "../components/common/Accordion";
import { IconButton } from "../components/buttons/IconButton";
import { PreviewPage, PreviewSection, ComponentApi } from "./PreviewSection";

const TABS_PROPS = [
  { name: "items", type: "TabItem[]", description: "{ id, label, icon? } — the tab strip." },
  { name: "value", type: "string", description: "The active tab's id." },
  { name: "onChange", type: "(id: string) => void", description: "Called with the clicked tab's id." },
];

const TOOLTIP_PROPS = [
  { name: "content", type: "ReactNode", description: "The label shown on hover/focus." },
  { name: "placement", type: '"top" | "bottom" | "left" | "right"', description: 'Defaults to "top".' },
  { name: "children", type: "ReactNode", description: "The trigger element — wrap a button or icon." },
];

const demoTabs = [
  { id: "one", label: "Overview", icon: Info },
  { id: "two", label: "Favorites", icon: Star },
  { id: "three", label: "Settings", icon: Settings },
];

const accordionItems = [
  { id: "a", title: "What is this tab?", content: "A shared place to demo cross-cutting common/ components (Tabs, Tooltip, Accordion) alongside the field/button/card categories." },
  { id: "b", title: "Where do these live?", content: "src/components/common/ — Tabs.tsx and Tooltip.tsx, next to Accordion, Breadcrumbs, CommandPalette, and Logo." },
];

export function CommonPreviewPage() {
  const [activeTab, setActiveTab] = useState("one");

  return (
    <PreviewPage title="Common" description="Cross-cutting building blocks that don't belong to one field/button/card category — tabs, tooltips, and expand/collapse content.">
      <PreviewSection title="Tabs" description="Underline tab strip driving this very page's tab switcher — see UIPreviewPage.tsx.">
        <Tabs items={demoTabs} value={activeTab} onChange={setActiveTab} />
        <TabPanel active={activeTab === "one"}>
          <p className="text-body-sm">Overview panel content.</p>
        </TabPanel>
        <TabPanel active={activeTab === "two"}>
          <p className="text-body-sm">Favorites panel content.</p>
        </TabPanel>
        <TabPanel active={activeTab === "three"}>
          <p className="text-body-sm">Settings panel content.</p>
        </TabPanel>
        <ComponentApi importCode={'import { Tabs, TabPanel } from "../components/common/Tabs";'} props={TABS_PROPS} />
      </PreviewSection>

      <PreviewSection title="Tooltip" description="Hover or focus a trigger — works with the keyboard too, not just a mouse.">
        <div className="flex flex-wrap items-center gap-6">
          <Tooltip content="Help & documentation">
            <IconButton icon={HelpCircle} label="Help" variant="ghost" />
          </Tooltip>
          <Tooltip content="Appears below the trigger" placement="bottom">
            <IconButton icon={Settings} label="Settings" variant="ghost" />
          </Tooltip>
          <Tooltip content="Appears to the right" placement="right">
            <IconButton icon={Star} label="Star" variant="ghost" />
          </Tooltip>
        </div>
        <ComponentApi importCode={'import { Tooltip } from "../components/common/Tooltip";'} props={TOOLTIP_PROPS} />
      </PreviewSection>

      <PreviewSection title="Accordion" description="Expand/collapse content — already used for the Overview page's user manual.">
        <Accordion items={accordionItems} defaultOpen={["a"]} />
      </PreviewSection>
    </PreviewPage>
  );
}
