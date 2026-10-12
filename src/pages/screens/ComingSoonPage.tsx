import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/cards/Card";

export interface ComingSoonPageProps {
  title: string;
  icon: LucideIcon;
  /** Shown instead of the default "still exists in the old ELmsWatch app" text. */
  description?: string;
}

/**
 * Placeholder for one of the 20 business screens carried over from the old ElmsWatch app (see
 * ELmsWatch/CLAUDE.md and src/routes/appScreens.ts) that hasn't been rebuilt here yet — the
 * sidebar shows every screen in the old app's original order from day one, but each one only
 * gets a real page once it's actually redesigned. Flip that screen's `built: true` in
 * appScreens.ts and swap its router.tsx entry for a real component when that happens.
 */
export function ComingSoonPage({ title, icon, description }: Readonly<ComingSoonPageProps>) {
  return (
    <div className="space-y-4">
      <PageHeader icon={icon} title={title} badge={{ label: "Being redesigned" }} />
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          <Construction className="h-7 w-7" />
        </span>
        <div>
          <p className="text-card-title">{description ? "This screen isn't ready yet" : "This screen hasn't been redesigned yet"}</p>
          <p className="text-body-sm mx-auto mt-1 max-w-sm">
            {description ??
              `"${title}" still exists in the old ELmsWatch app and is on the list to be rebuilt here, one screen at a time.`}
          </p>
        </div>
      </Card>
    </div>
  );
}
