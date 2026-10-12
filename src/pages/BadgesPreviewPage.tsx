import { StatusBadge, TextBadge, type BadgeStatus } from "../components/badges/StatusBadge";
import { PreviewPage, PreviewSection, ComponentApi } from "./PreviewSection";

const statuses: { status: BadgeStatus; label: string }[] = [
  { status: "success", label: "Completed" },
  { status: "error", label: "Failed" },
  { status: "warning", label: "At risk" },
  { status: "info", label: "Info" },
  { status: "pending", label: "Pending" },
  { status: "neutral", label: "Draft" },
];

const BADGE_PROPS = [
  { name: "status", type: '"success" | "error" | "warning" | "info" | "pending" | "neutral"', description: "Drives the color." },
  { name: "label", type: "string", description: "The visible text." },
];

export function BadgesPreviewPage() {
  return (
    <PreviewPage title="Badges" description="Icon badges for emphasis, dot badges for dense tables.">
      <PreviewSection title="Icon status badge" description="Use in cards, page headers, and anywhere a status needs emphasis.">
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <StatusBadge key={s.status} status={s.status} label={s.label} />
          ))}
        </div>
        <ComponentApi importCode={'import { StatusBadge } from "../components/badges/StatusBadge";'} props={BADGE_PROPS} />
      </PreviewSection>
      <PreviewSection title="Text (dot) status badge" description="Quieter — use in dense table cells where an icon would add too much visual weight.">
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <TextBadge key={s.status} status={s.status} label={s.label} />
          ))}
        </div>
        <ComponentApi importCode={'import { TextBadge } from "../components/badges/StatusBadge";'} props={BADGE_PROPS} />
      </PreviewSection>
    </PreviewPage>
  );
}
