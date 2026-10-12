import { Card } from "../components/cards/Card";
import { TextButton } from "../components/buttons/TextButton";
import { PreviewPage, PreviewSection, ComponentApi } from "./PreviewSection";

export function CardsPreviewPage() {
  return (
    <PreviewPage title="Cards" description="A single Card primitive with configurable rounding, border, elevation and header/footer slots.">
      <PreviewSection title="Rounding variants">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card rounding="all" className="text-center text-xs text-slate-500">all</Card>
          <Card rounding="top" className="text-center text-xs text-slate-500">top</Card>
          <Card rounding="left" className="text-center text-xs text-slate-500">left</Card>
          <Card rounding="none" className="text-center text-xs text-slate-500">none</Card>
        </div>
      </PreviewSection>

      <PreviewSection title="Header / footer / hover">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card header={<h3 className="text-sm font-semibold">Card with header</h3>}>
            <p className="text-sm text-slate-500 dark:text-slate-400">Body content goes here.</p>
          </Card>
          <Card
            header={<h3 className="text-sm font-semibold">Card with footer</h3>}
            footer={
              <div className="flex justify-end gap-2">
                <TextButton size="sm" variant="outline" tone="neutral">Cancel</TextButton>
                <TextButton size="sm">Save</TextButton>
              </div>
            }
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">Actions live in the footer slot.</p>
          </Card>
          <Card hoverable>
            <p className="text-sm text-slate-500 dark:text-slate-400">Hoverable card — lifts on hover.</p>
          </Card>
          <Card bordered={false} elevated={false} className="bg-brand-50 dark:bg-brand-500/10">
            <p className="text-sm text-brand-700 dark:text-brand-300">Customized: no border/shadow, tinted background.</p>
          </Card>
        </div>
        <ComponentApi
          importCode={'import { Card } from "../components/cards/Card";'}
          props={[
            { name: "rounding", type: '"all" | "none" | "top" | "bottom" | "left" | "right" | "top-left" | ...', default: '"all"', description: "Uses the app-wide corner radius (appearance drawer slider)." },
            { name: "header / footer", type: "ReactNode", description: "Optional slots with their own border and padding." },
            { name: "padded", type: "boolean", default: "true", description: "Padding on the body area." },
            { name: "hoverable", type: "boolean", default: "false", description: "Lift + shadow transition on hover." },
            { name: "bordered / elevated", type: "boolean", description: "Default from the appearance drawer's \"Card Style\" setting (border vs. shadow) when omitted." },
          ]}
        />
      </PreviewSection>
    </PreviewPage>
  );
}
