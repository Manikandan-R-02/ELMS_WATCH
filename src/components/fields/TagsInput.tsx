import { useId, useState, type CSSProperties, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { FieldShell, fieldBorderClass } from "./FieldShell";

export interface TagsInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  /** Keys that commit the current text as a tag, besides Enter. Default [","]. */
  delimiters?: string[];
  /** Max number of tags allowed — the input disables once reached. */
  maxTags?: number;
  /** Reject duplicate tag text (case-insensitive). Default true. */
  preventDuplicates?: boolean;
  /** Only accept tags matching this pattern; invalid entries are dropped silently. */
  validate?: (tag: string) => boolean;
  disabled?: boolean;
  required?: boolean;
  containerClassName?: string;
  /** Inline style applied to the outer wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
}

/** Free-text chip/tag input — type a value and press Enter (or a delimiter) to add it. Backspace on an empty field removes the last tag. */
/** The text box's placeholder: the caller's own while no tag exists yet, "Max N tags" once the limit is reached. */
function inputPlaceholder(tagCount: number, placeholder: string | undefined, atLimit: boolean, maxTags: number | undefined): string | undefined {
  if (tagCount === 0) return placeholder;
  return atLimit ? `Max ${maxTags} tags` : "";
}

export function TagsInput({
  label,
  error,
  helperText,
  value,
  onChange,
  placeholder = "Type and press Enter",
  delimiters = [","],
  maxTags,
  preventDuplicates = true,
  validate,
  disabled,
  required,
  containerClassName,
  style,
}: Readonly<TagsInputProps>) {
  const autoId = useId();
  const [draft, setDraft] = useState("");
  const atLimit = maxTags !== undefined && value.length >= maxTags;

  function commit(raw: string) {
    const tag = raw.trim();
    if (!tag || atLimit) return;
    if (validate && !validate(tag)) return;
    if (preventDuplicates && value.some((v) => v.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
    setDraft("");
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || delimiters.includes(e.key)) {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      remove(value.length - 1);
    }
  }

  return (
    <FieldShell label={label} htmlFor={autoId} required={required} error={error} helperText={helperText} className={containerClassName} style={style}>
      <div
        className={cn(
          "flex w-full flex-wrap items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5 shadow-sm transition",
          fieldBorderClass(error),
          "focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20",
          disabled && "cursor-not-allowed bg-slate-100 dark:bg-slate-800",
          "dark:bg-slate-900"
        )}
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${tag}`}
                className="rounded-full text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-200"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        <input
          id={autoId}
          type="text"
          value={draft}
          disabled={disabled || atLimit}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => commit(draft)}
          placeholder={inputPlaceholder(value.length, placeholder, atLimit, maxTags)}
          className="min-w-[6rem] flex-1 bg-transparent px-1 py-0.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>
    </FieldShell>
  );
}
