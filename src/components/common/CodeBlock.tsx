import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "../../lib/cn";

export interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

/** Dark, monospace code block with a copy-to-clipboard button. Use for import snippets and usage examples. */
export function CodeBlock({ code, language, className }: Readonly<CodeBlockProps>) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — silently ignore, the code is still visible/selectable
    }
  }

  return (
    <div className={cn("group relative overflow-hidden rounded-lg bg-slate-900 dark:bg-black", className)}>
      {language && (
        <div className="border-b border-white/10 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
          {language}
        </div>
      )}
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy code"
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-slate-400 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

/** Inline `code` styling for prose — pair with CodeBlock for multi-line snippets. */
export function InlineCode({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.8em] text-brand-700 dark:bg-slate-800 dark:text-brand-300">
      {children}
    </code>
  );
}
