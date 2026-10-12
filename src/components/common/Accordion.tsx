import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

export interface AccordionItem {
  id: string;
  title: string;
  icon?: ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Ids expanded by default. */
  defaultOpen?: string[];
  /** Allow more than one section open at once. Default true. */
  multiple?: boolean;
  className?: string;
}

/** Simple, accessible expand/collapse list — used for FAQ-style and reference/manual content. */
export function Accordion({ items, defaultOpen = [], multiple = true, className }: Readonly<AccordionProps>) {
  const [open, setOpen] = useState<Set<string>>(new Set(defaultOpen));

  function toggle(id: string) {
    setOpen((prev) => {
      const next = multiple ? new Set(prev) : new Set<string>();
      if (prev.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className={cn("divide-y divide-slate-100 dark:divide-slate-800", className)}>
      {items.map((item) => {
        const isOpen = open.has(item.id);
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 py-3.5 text-left transition hover:text-brand-700 dark:hover:text-brand-300"
            >
              {item.icon && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">{item.icon}</span>}
              <span className="text-card-title flex-1">{item.title}</span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen && <div className="text-body pb-4 pl-11 pr-2">{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
}
