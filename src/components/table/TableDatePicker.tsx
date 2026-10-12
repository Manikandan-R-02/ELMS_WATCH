import type { CSSProperties } from "react";
import { DatePicker, type DatePickerProps } from "../datetime/DatePicker";
import { cn } from "../../lib/cn";

export interface TableDatePickerProps
  extends Omit<DatePickerProps, "label" | "helperText" | "portal" | "dense" | "style"> {
  /** Inline style applied to the field wrapper. */
  style?: CSSProperties;
}

/**
 * Drop-in `DatePicker` preset for an editable table cell: no label, dense trigger padding, and
 * the calendar panel is portaled to `document.body` so it never gets clipped by the table's
 * horizontal scroll container. Use it as a column's `render` for an inline-editable date column —
 * e.g. `{ key: "shipDate", header: "Ship date", render: (row) => <TableDatePicker value={row.shipDate} onChange={(d) => update(row.id, d)} /> }`.
 */
export function TableDatePicker({ containerClassName, ...props }: Readonly<TableDatePickerProps>) {
  return (
    <DatePicker
      {...props}
      portal
      dense
      containerClassName={cn("min-w-[9rem]", containerClassName)}
    />
  );
}
