import { Download, Plus } from "lucide-react";
import { TextButton } from "../components/buttons/TextButton";
import { IconButton } from "../components/buttons/IconButton";
import {
  PlusSlideButton,
  ListSlideButton,
  ViewSlideButton,
  ModifySlideButton,
  BulkUploadSlideButton,
  DownloadSlideButton,
  SaveSlideButton,
  RefreshSlideButton,
  CancelSlideButton,
  DeleteSlideButton,
} from "../components/buttons/SlideButton";
import {
  PlusTextButton,
  ListTextButton,
  ViewTextButton,
  ModifyTextButton,
  BulkUploadTextButton,
  DownloadTextButton,
  SaveTextButton,
  RefreshTextButton,
  CancelTextButton,
  DeleteTextButton,
} from "../components/buttons/ActionTextButtons";
import {
  PlusRoundedButton,
  ListRoundedButton,
  ViewRoundedButton,
  ModifyRoundedButton,
  BulkUploadRoundedButton,
  DownloadRoundedButton,
  SaveRoundedButton,
  RefreshRoundedButton,
  CancelRoundedButton,
  DeleteRoundedButton,
} from "../components/buttons/ActionRoundedButtons";
import { PreviewPage, PreviewSection, ComponentApi } from "./PreviewSection";

export function ButtonsPreviewPage() {
  return (
    <PreviewPage
      title="Buttons"
      description="Every standard action (Add, List, View, Modify, Bulk Upload, Download, Save, Refresh, Cancel, Delete) is available as a SlideButton, a TextButton, and a fully-rounded IconButton — each with a consistent default color that any screen can override."
    >
      <PreviewSection title="Slide buttons — {Action}SlideButton" description="Icon-first, hover to reveal the label. Use these for table/row actions on sm: and up — swap to the matching RoundedButton below sm: (see DailyPrjPage/ConsumptionAnalysisPage's Refresh/Download buttons for the reference sm:hidden/sm:flex pattern), since hover-to-reveal has no equivalent on touch.">
        <div className="flex flex-wrap items-center gap-3">
          <PlusSlideButton />
          <ListSlideButton />
          <ViewSlideButton />
          <ModifySlideButton />
          <BulkUploadSlideButton />
          <DownloadSlideButton />
          <SaveSlideButton />
          <RefreshSlideButton />
          <CancelSlideButton />
          <DeleteSlideButton />
        </div>
        <ComponentApi
          importCode={'import { PlusSlideButton, ListSlideButton, /* ... */ } from "../components/buttons/SlideButton";'}
          props={[
            { name: "label", type: "string", description: "Defaults to the action's name (e.g. \"Add New\") — override for context." },
            { name: "tone", type: "ButtonTone", description: "brand | neutral | danger | success | warning | purple | cyan | pink | indigo — defaults to the action's team color." },
            { name: "icon", type: "LucideIcon", description: "Override the default icon." },
            { name: "size", type: '"sm" | "md"', default: '"md"' , description: "Icon-only box size before it expands on hover." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Text buttons — {Action}TextButton" description="Icon + label, always visible. Use in toolbars, forms, and modal footers.">
        <div className="flex flex-wrap items-center gap-3">
          <PlusTextButton />
          <ListTextButton />
          <ViewTextButton />
          <ModifyTextButton />
          <BulkUploadTextButton />
          <DownloadTextButton />
          <SaveTextButton />
          <RefreshTextButton />
          <CancelTextButton variant="outline" />
          <DeleteTextButton />
        </div>
        <ComponentApi
          importCode={'import { PlusTextButton, ListTextButton, /* ... */ } from "../components/buttons/ActionTextButtons";'}
          props={[
            { name: "label, tone, icon", type: "—", description: "Same override pattern as the SlideButton presets." },
            { name: "variant", type: '"solid" | "outline" | "ghost" | "link"', default: '"solid"', description: "Inherited from the underlying TextButton." },
            { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Inherited from the underlying TextButton." },
            { name: "loading, disabled, fullWidth", type: "boolean", description: "Inherited from the underlying TextButton." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Rounded icon buttons — {Action}RoundedButton" description="Icon-only, fully rounded. Always pass a `label` override for context-specific accessibility text if the default doesn't fit.">
        <div className="flex flex-wrap items-center gap-3">
          <PlusRoundedButton />
          <ListRoundedButton />
          <ViewRoundedButton />
          <ModifyRoundedButton />
          <BulkUploadRoundedButton />
          <DownloadRoundedButton />
          <SaveRoundedButton />
          <RefreshRoundedButton />
          <CancelRoundedButton />
          <DeleteRoundedButton />
        </div>
        <ComponentApi
          importCode={'import { PlusRoundedButton, ListRoundedButton, /* ... */ } from "../components/buttons/ActionRoundedButtons";'}
          props={[
            { name: "label", type: "string", description: "Doubles as the aria-label — override with page-specific context (e.g. \"Delete order #1042\")." },
            { name: "tone, size, variant", type: "—", description: "Inherited from the underlying IconButton (variant: solid | outline | ghost)." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="One config drives all three families" description="Change an action's icon, label, or default color once, in actionConfig.tsx, and every SlideButton/TextButton/RoundedButton preset picks it up.">
        <ComponentApi
          importCode={`// src/components/buttons/actionConfig.tsx
export const ACTIONS = {
  plus: { icon: Plus, label: "Add New", tone: "brand" },
  delete: { icon: Trash2, label: "Delete", tone: "danger" },
  // ...
};`}
          defaultOpen
          props={[
            { name: "icon", type: "LucideIcon", description: "Used by all three preset families." },
            { name: "label", type: "string", description: "Default label / aria-label for all three families." },
            { name: "tone", type: "ButtonTone", description: "Default color for all three families." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Customization" description="Every preset still accepts the base component's full prop set — override tone, variant, label, icon, size, or disabled/loading state per screen.">
        <div className="flex flex-wrap items-center gap-3">
          <SaveTextButton label="Save Draft" tone="neutral" variant="outline" />
          <DeleteSlideButton tone="warning" label="Archive" />
          <PlusRoundedButton tone="purple" size="lg" />
        </div>
      </PreviewSection>

      <PreviewSection title="Base components" description="For anything outside the standard action set, compose TextButton / IconButton / SlideButton directly.">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <TextButton>Primary</TextButton>
            <TextButton tone="neutral">Neutral</TextButton>
            <TextButton tone="danger">Danger</TextButton>
            <TextButton tone="success">Success</TextButton>
            <TextButton tone="warning">Warning</TextButton>
          </div>
          <div className="flex flex-wrap gap-3">
            <TextButton variant="outline">Outline</TextButton>
            <TextButton variant="ghost">Ghost</TextButton>
            <TextButton variant="link">Link button</TextButton>
            <TextButton leadingIcon={<Plus className="h-4 w-4" />}>With icon</TextButton>
            <TextButton loading>Loading</TextButton>
            <TextButton disabled>Disabled</TextButton>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <IconButton icon={Plus} label="Add" />
            <IconButton icon={Download} label="Download" tone="success" />
            <IconButton icon={Plus} label="Add" variant="outline" />
            <IconButton icon={Plus} label="Add" variant="ghost" />
            <IconButton icon={Plus} label="Add" size="sm" />
            <IconButton icon={Plus} label="Add" size="lg" />
          </div>
        </div>
      </PreviewSection>
    </PreviewPage>
  );
}
