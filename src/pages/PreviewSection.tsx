import { useState, type ReactNode } from "react";
import { ChevronDown, Code2 } from "lucide-react";
import { Card } from "../components/cards/Card";
import { CodeBlock } from "../components/common/CodeBlock";
import { PropsTable, type PropRow } from "../components/common/PropsTable";
import { cn } from "../lib/cn";

export function PreviewPage({ title, description, children }: Readonly<{ title: string; description: string; children: ReactNode }>) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title">{title}</h1>
        <p className="text-body mt-1">{description}</p>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

export function PreviewSection({ title, description, children }: Readonly<{ title: string; description?: string; children: ReactNode }>) {
  return (
    <Card header={
      <div>
        <h2 className="text-section-title">{title}</h2>
        {description && <p className="text-body-sm mt-0.5">{description}</p>}
      </div>
    }>
      {children}
    </Card>
  );
}

export interface ComponentApiProps {
  /** e.g. `import { TextInput } from "../components/fields";` */
  importCode: string;
  props: PropRow[];
  /** Collapsed by default to keep the demo the focus — expand to see the reference. */
  defaultOpen?: boolean;
}

/** Import snippet + props table, collapsed by default — drop at the end of a PreviewSection's demo. */
export function ComponentApi({ importCode, props, defaultOpen = false }: Readonly<ComponentApiProps>) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
      >
        <Code2 className="h-3.5 w-3.5" />
        Import &amp; props
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <CodeBlock code={importCode} language="tsx" />
          <PropsTable rows={props} />
        </div>
      )}
    </div>
  );
}
