import { ScrollText } from "lucide-react";
import agentsMd from "../../AGENTS.md?raw";
import { Card } from "../components/cards/Card";
import { Markdown } from "../components/common/Markdown";

/**
 * Renders AGENTS.md (the enforceable ruleset) straight from the repo root via Vite's `?raw`
 * import, so this page and the file can never drift apart — editing AGENTS.md is enough.
 */
export function RulesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ScrollText className="h-6 w-6 text-brand-600 dark:text-brand-400" />
        <div>
          <h1 className="text-page-title">Rules &amp; Regulations</h1>
          <p className="text-body-sm mt-0.5">
            The full contents of <code className="font-mono">AGENTS.md</code> at the project root — the enforceable
            ruleset for anyone (human or AI) building on this template.
          </p>
        </div>
      </div>
      <Card>
        <Markdown content={agentsMd} />
      </Card>
    </div>
  );
}
