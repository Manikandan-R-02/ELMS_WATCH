import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type DragEvent } from "react";
import { File as FileIcon, Trash2, UploadCloud } from "lucide-react";
import { cn } from "../../lib/cn";
import { FieldShell } from "./FieldShell";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export interface FileUploadProps {
  /** Currently selected files — this component doesn't hold its own file list, so it can be reset/pre-filled from outside. */
  files: File[];
  onChange: (files: File[]) => void;
  /** Native `accept` attribute, e.g. "image/*" or ".pdf,.docx". */
  accept?: string;
  multiple?: boolean;
  /** Rejects (and reports via `onReject`) any file over this size. */
  maxSizeMB?: number;
  /** Caps the total number of files; further drops/selections are ignored past the limit. */
  maxFiles?: number;
  /** Called with files that failed the size/type check instead of being silently dropped. */
  onReject?: (rejected: { file: File; reason: string }[]) => void;
  /** Show an image thumbnail for image files instead of the generic file icon. Default true. */
  showPreview?: boolean;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  /** Inline style applied to the outer wrapper — set width/height/margins etc. directly. */
  style?: CSSProperties;
}

/** Drag-and-drop dropzone with a file list — size/type validation, image thumbnails, no upload logic baked in (wire `onChange` to your own upload call). */
export function FileUpload({
  files,
  onChange,
  accept,
  multiple = true,
  maxSizeMB,
  maxFiles,
  onReject,
  showPreview = true,
  disabled,
  required,
  label,
  error,
  helperText,
  containerClassName,
  style,
}: Readonly<FileUploadProps>) {
  const autoId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const previews = useMemo(
    () => files.map((f) => (showPreview && f.type.startsWith("image/") ? URL.createObjectURL(f) : null)),
    [files, showPreview]
  );
  useEffect(() => {
    return () => {
      for (const url of previews) if (url) URL.revokeObjectURL(url);
    };
  }, [previews]);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const incomingArr = Array.from(incoming);
      const accepted: File[] = [];
      const rejected: { file: File; reason: string }[] = [];
      let budget = maxFiles === undefined ? Infinity : maxFiles - files.length;

      for (const file of incomingArr) {
        if (budget <= 0) {
          rejected.push({ file, reason: "Max file count reached" });
          continue;
        }
        if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
          rejected.push({ file, reason: `Exceeds ${maxSizeMB} MB` });
          continue;
        }
        accepted.push(file);
        budget--;
      }

      if (accepted.length) onChange(multiple ? [...files, ...accepted] : accepted.slice(0, 1));
      if (rejected.length) onReject?.(rejected);
    },
    [files, maxFiles, maxSizeMB, multiple, onChange, onReject]
  );

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragActive(false);
    if (disabled) return;
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  function remove(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <FieldShell label={label} htmlFor={autoId} required={required} error={error} helperText={helperText} className={containerClassName} style={style}>
      <label
        htmlFor={autoId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          // The real (visually hidden, `sr-only`) file input takes keyboard focus and opens the file
          // dialog on Enter/Space by itself — this ring is what shows a keyboard user it's there.
          "flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-brand-500/40 has-[input:focus-visible]:border-brand-500",
          dragActive ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-slate-200 dark:border-slate-700",
          error && "border-red-400 dark:border-red-500/60",
          disabled ? "cursor-not-allowed bg-slate-100 dark:bg-slate-800" : "cursor-pointer hover:border-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
        )}
      >
        <input
          ref={inputRef}
          id={autoId}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
          className="sr-only"
        />
        <UploadCloud className="h-6 w-6 text-slate-400" />
        <span className="block text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium text-brand-600 dark:text-brand-400">Click to upload</span> or drag and drop
        </span>
        {!!(accept || maxSizeMB) && (
          <span className="block text-xs text-slate-400 dark:text-slate-500">
            {accept ? accept.replaceAll(",", ", ") : "Any file type"}
            {maxSizeMB ? ` · up to ${maxSizeMB} MB` : ""}
          </span>
        )}
      </label>

      {files.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            >
              {previews[i] ? (
                <img src={previews[i]} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
              ) : (
                <FileIcon className="h-8 w-8 shrink-0 rounded bg-slate-100 p-1.5 text-slate-400 dark:bg-slate-800" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-700 dark:text-slate-200">{file.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{formatBytes(file.size)}</p>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Remove ${file.name}`}
                  className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </FieldShell>
  );
}
