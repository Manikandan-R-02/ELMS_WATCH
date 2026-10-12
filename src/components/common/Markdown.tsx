import type { ReactNode } from "react";
import { CodeBlock, InlineCode } from "./CodeBlock";

/** One piece of inline markup found in a line: where it starts and ends, and what it holds. */
interface InlineToken {
  kind: "bold" | "code" | "link";
  start: number;
  end: number;
  inner: string;
  href?: string;
}

/** `**bold**` starting exactly at `at`, or null. */
function boldAt(text: string, at: number): InlineToken | null {
  if (!text.startsWith("**", at)) return null;
  const close = text.indexOf("**", at + 2);
  if (close <= at + 2) return null;
  return { kind: "bold", start: at, end: close + 2, inner: text.slice(at + 2, close) };
}

/** `` `code` `` starting exactly at `at`, or null. */
function codeAt(text: string, at: number): InlineToken | null {
  if (text[at] !== "`") return null;
  const close = text.indexOf("`", at + 1);
  if (close <= at + 1) return null;
  return { kind: "code", start: at, end: close + 1, inner: text.slice(at + 1, close) };
}

/** `[text](url)` starting exactly at `at`, or null. */
function linkAt(text: string, at: number): InlineToken | null {
  if (text[at] !== "[") return null;
  const mid = text.indexOf("](", at + 1);
  if (mid <= at + 1) return null;
  const close = text.indexOf(")", mid + 2);
  if (close <= mid + 2) return null;
  return { kind: "link", start: at, end: close + 1, inner: text.slice(at + 1, mid), href: text.slice(mid + 2, close) };
}

/** The first piece of inline markup at or after `from`. A plain scan with `indexOf` — no regular expression, so a
 * long line of unmatched `*`, `` ` `` or `[` can never make it slow. */
function nextInlineToken(text: string, from: number): InlineToken | null {
  for (let at = from; at < text.length; at++) {
    const token = boldAt(text, at) ?? codeAt(text, at) ?? linkAt(text, at);
    if (token) return token;
  }
  return null;
}

/** Parses **bold**, `inline code`, and [text](url) within a single line of markdown. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let index = 0;
  let token = nextInlineToken(text, cursor);

  while (token) {
    if (token.start > cursor) nodes.push(text.slice(cursor, token.start));
    const key = `${keyPrefix}-${index++}`;
    if (token.kind === "bold") {
      nodes.push(<strong key={key}>{renderInline(token.inner, key)}</strong>);
    } else if (token.kind === "code") {
      nodes.push(<InlineCode key={key}>{token.inner}</InlineCode>);
    } else {
      nodes.push(
        <a key={key} href={token.href} className="text-brand-600 underline hover:text-brand-700 dark:text-brand-400">
          {token.inner}
        </a>
      );
    }
    cursor = token.end;
    token = nextInlineToken(text, cursor);
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

/** Lines that start a new block; a paragraph or list item stops at one of these. */
const BLOCK_STARTS = [/^#{1,3}\s/, /^```/, /^\s*[-*]\s/, /^\s*\d+\.\s/, /^>\s?/, /^(?:-{3,}|\*{3,})$/];
function startsBlock(line: string): boolean {
  return BLOCK_STARTS.some((pattern) => pattern.test(line));
}
const UL_MARKER = /^\s*[-*]\s/;
const OL_MARKER = /^\s*\d+\.\s/;

/** Shared state while walking the lines: the next React key and the current line index. */
interface Cursor {
  lines: string[];
  i: number;
  key: number;
}

/** A fenced ``` code block. Consumes through the closing fence. */
function readCodeBlock(c: Cursor): ReactNode {
  const language = c.lines[c.i].slice(3).trim() || undefined;
  const codeLines: string[] = [];
  c.i++;
  while (c.i < c.lines.length && !c.lines[c.i].startsWith("```")) {
    codeLines.push(c.lines[c.i]);
    c.i++;
  }
  c.i++;
  return <CodeBlock key={c.key++} code={codeLines.join("\n")} language={language} className="my-3" />;
}

const HEADING_CLASSES = ["text-page-title mt-6", "text-section-title mt-6", "text-card-title mt-4"] as const;
const HEADING_TAGS = ["h1", "h2", "h3"] as const;

/** A `#`, `##`, or `###` heading on a single line. */
function readHeading(c: Cursor): ReactNode {
  const line = c.lines[c.i];
  const level = (/^#+/.exec(line)?.[0] ?? "#").length;
  const text = line.replace(/^#{1,3}\s/, "");
  const depth = Math.min(level, 3) - 1; // `####` and deeper read as a level-3 heading
  const cls = HEADING_CLASSES[depth];
  const Tag = HEADING_TAGS[depth];
  const key = c.key++;
  c.i++;
  return <Tag key={key} className={cls}>{renderInline(text, `h${c.key}`)}</Tag>;
}

/** A `> quote` block: consecutive quoted lines, each rendered as a paragraph. */
function readBlockquote(c: Cursor): ReactNode {
  const quoteLines: string[] = [];
  while (c.i < c.lines.length && /^>\s?/.test(c.lines[c.i])) {
    quoteLines.push(c.lines[c.i].replace(/^>\s?/, ""));
    c.i++;
  }
  const key = c.key++;
  const quoteItems = quoteLines.map((text, idx) => ({ id: `bq${key}-${idx}`, text }));
  return (
    <blockquote key={key} className="my-3 border-l-2 border-brand-400 pl-3 text-body-sm italic dark:border-brand-500">
      {quoteItems.map((q) => (
        <p key={q.id}>{renderInline(q.text, q.id)}</p>
      ))}
    </blockquote>
  );
}

/**
 * A bullet or numbered list. Each item may continue onto indented lines that have no marker of
 * their own (a lazy continuation), which are joined into the same item.
 */
function readList(c: Cursor, marker: RegExp, ordered: boolean): ReactNode {
  const items: string[] = [];
  while (c.i < c.lines.length && marker.test(c.lines[c.i])) {
    const parts = [c.lines[c.i].replace(marker, "")];
    c.i++;
    while (c.i < c.lines.length && c.lines[c.i].trim() !== "" && !startsBlock(c.lines[c.i])) {
      parts.push(c.lines[c.i].trim());
      c.i++;
    }
    items.push(parts.join(" "));
  }
  const key = c.key++;
  const prefix = ordered ? "ol" : "ul";
  const listItems = items
    .map((text, idx) => ({ id: `${prefix}${key}-${idx}`, text }))
    .map((item) => <li key={item.id}>{renderInline(item.text, item.id)}</li>);
  return ordered ? (
    <ol key={key} className="text-body-sm my-2 list-decimal space-y-1.5 pl-5">
      {listItems}
    </ol>
  ) : (
    <ul key={key} className="text-body-sm my-2 list-disc space-y-1.5 pl-5">
      {listItems}
    </ul>
  );
}

/** A paragraph: consecutive plain lines, joined with spaces. */
function readParagraph(c: Cursor): ReactNode {
  const paraLines: string[] = [];
  while (c.i < c.lines.length && c.lines[c.i].trim() !== "" && !startsBlock(c.lines[c.i])) {
    paraLines.push(c.lines[c.i]);
    c.i++;
  }
  const key = c.key++;
  return (
    <p key={key} className="text-body-sm my-2">
      {renderInline(paraLines.join(" "), `p${c.key}`)}
    </p>
  );
}

/**
 * Minimal, dependency-free markdown renderer — covers the subset AGENTS.md/README.md actually use
 * (headings, bold/inline code/links, fenced code blocks, bullet/numbered lists, blockquotes, rules).
 * Not a general-purpose markdown engine; extend the block readers above if a doc needs more.
 */
export function Markdown({ content }: Readonly<{ content: string }>) {
  const c: Cursor = { lines: content.replaceAll("\r\n", "\n").split("\n"), i: 0, key: 0 };
  const blocks: ReactNode[] = [];

  while (c.i < c.lines.length) {
    const line = c.lines[c.i];

    if (line.trim() === "") {
      c.i++;
    } else if (line.startsWith("```")) {
      blocks.push(readCodeBlock(c));
    } else if (/^#{1,3}\s/.test(line)) {
      blocks.push(readHeading(c));
    } else if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push(<hr key={c.key++} className="my-4 border-slate-200 dark:border-slate-800" />);
      c.i++;
    } else if (/^>\s?/.test(line)) {
      blocks.push(readBlockquote(c));
    } else if (UL_MARKER.test(line)) {
      blocks.push(readList(c, UL_MARKER, false));
    } else if (OL_MARKER.test(line)) {
      blocks.push(readList(c, OL_MARKER, true));
    } else {
      blocks.push(readParagraph(c));
    }
  }

  return <div className="max-w-none">{blocks}</div>;
}
