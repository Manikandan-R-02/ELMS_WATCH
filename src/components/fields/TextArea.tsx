import { forwardRef, useId, type CSSProperties, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { FieldShell, fieldBaseClass, fieldBorderClass } from "./FieldShell";

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
  showCharCount?: boolean;
  containerClassName?: string;
  /** Inline style applied to the outer field wrapper — use `style` for the textarea itself. */
  containerStyle?: CSSProperties;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      maxLength,
      showCharCount = !!maxLength,
      className,
      containerClassName,
      containerStyle,
      id,
      value,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const textareaId = id ?? autoId;
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <FieldShell
        label={label}
        htmlFor={textareaId}
        required={props.required}
        error={error}
        helperText={helperText}
        charCount={maxLength && showCharCount ? { current: currentLength, max: maxLength } : undefined}
        className={containerClassName}
        style={containerStyle}
      >
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          maxLength={maxLength}
          rows={rows}
          className={cn(fieldBaseClass, fieldBorderClass(error), "resize-y", className)}
          {...props}
        />
      </FieldShell>
    );
  }
);
TextArea.displayName = "TextArea";
