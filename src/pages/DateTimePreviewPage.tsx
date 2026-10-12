import { useState } from "react";
import { DatePicker } from "../components/datetime/DatePicker";
import { MonthPicker } from "../components/datetime/MonthPicker";
import { YearPicker } from "../components/datetime/YearPicker";
import { DateRangePicker, type DateRange } from "../components/datetime/DateRangePicker";
import { TimePicker, type TimeValue } from "../components/datetime/TimePicker";
import { TimeRangePicker, type TimeRange } from "../components/datetime/TimeRangePicker";
import { PreviewPage, PreviewSection, ComponentApi } from "./PreviewSection";

export function DateTimePreviewPage() {
  const [date, setDate] = useState<Date | null>(null);
  const [month, setMonth] = useState<Date | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [time, setTime] = useState<TimeValue | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>({ from: null, to: null });

  return (
    <PreviewPage title="Date & Time" description="Date, month, year, and range pickers built on date-fns, plus time and time-range pickers.">
      <PreviewSection title="Single pickers">
        <div className="grid gap-4 sm:grid-cols-3">
          <DatePicker label="Date" value={date} onChange={setDate} />
          <MonthPicker label="Month" value={month} onChange={setMonth} />
          <YearPicker label="Year" value={year} onChange={setYear} minYear={2000} maxYear={2035} />
        </div>
        <ComponentApi
          importCode={'import { DatePicker } from "../components/datetime/DatePicker";\nimport { MonthPicker } from "../components/datetime/MonthPicker";\nimport { YearPicker } from "../components/datetime/YearPicker";'}
          props={[
            { name: "value / onChange", type: "Date | null / (date) => void", description: "DatePicker/MonthPicker; YearPicker uses number | null." },
            { name: "minDate / maxDate", type: "Date", description: "DatePicker only — disables days outside the range." },
            { name: "minYear / maxYear", type: "number", description: "YearPicker only." },
            { name: "displayFormat", type: "string", default: '"dd MMM yyyy"', description: "DatePicker only — a date-fns format string." },
            { name: "portal", type: "boolean", default: "false", description: "Every picker in this folder accepts this — renders the panel into document.body, fixed-positioned against the trigger, so it isn't clipped inside a table cell, modal, or scrolling toolbar. See TableDatePicker for a ready-made preset." },
            { name: "dense", type: "boolean", default: "false", description: "Every picker accepts this — compact trigger padding for tight spaces like a table cell." },
            { name: "inverted", type: "boolean", default: "false", description: "Every picker accepts this — translucent white-on-color trigger for placement directly on a solid-color surface (e.g. the Header), instead of the default white/slate card look. See Header.tsx's month picker." },
            { name: "containerClassName / style", type: "—", description: "Size the field wrapper, same as the other field components." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Date range" description="Click a start day, then an end day, then Apply.">
        <div className="max-w-xs">
          <DateRangePicker label="Stay dates" value={range} onChange={setRange} />
        </div>
        <ComponentApi
          importCode={'import { DateRangePicker, type DateRange } from "../components/datetime/DateRangePicker";'}
          props={[
            { name: "value", type: "{ from: Date | null; to: Date | null }", description: "Controlled range." },
            { name: "onChange", type: "(range: DateRange) => void", description: "Fires when \"Apply\" is pressed with both ends set." },
            { name: "minDate / maxDate", type: "Date", description: "Disables days outside the range." },
          ]}
        />
      </PreviewSection>

      <PreviewSection
        title="Time pickers"
        description={'TimePicker walks through Hour → Minute → AM/PM one step at a time (click a stepper pill up top to jump back). TimeRangePicker locks "End time" until "Start time" is set, and clears an end time that\'s no longer after a changed start time.'}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TimePicker label="Time" value={time} onChange={setTime} />
          <TimeRangePicker label="Working hours" value={timeRange} onChange={setTimeRange} />
        </div>
        <ComponentApi
          importCode={'import { TimePicker, type TimeValue } from "../components/datetime/TimePicker";\nimport { TimeRangePicker, type TimeRange } from "../components/datetime/TimeRangePicker";'}
          props={[
            { name: "value", type: "{ hour: number; minute: number; meridiem: \"AM\" | \"PM\" } | null", description: "TimePicker." },
            { name: "minuteStep", type: "number", default: "5", description: "Interval shown in the minute grid." },
            { name: "showNow", type: "boolean", default: "true", description: "Show a \"Now\" shortcut in the panel that sets the current time and closes." },
            { name: "value (range)", type: "{ from: TimeValue | null; to: TimeValue | null }", description: "TimeRangePicker — renders two TimePickers with an arrow between them." },
            { name: "(range validation)", type: "—", description: "\"End time\" is disabled until \"Start time\" is set; if a later start time change makes the existing end time invalid, it's cleared automatically; picking an end time at or before the start shows an inline error." },
          ]}
        />
      </PreviewSection>
    </PreviewPage>
  );
}
