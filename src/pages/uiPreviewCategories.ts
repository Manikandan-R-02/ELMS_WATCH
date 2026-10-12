import {
  BadgeCheck,
  CalendarClock,
  LayoutGrid,
  LoaderCircle,
  MousePointerClick,
  PanelsTopLeft,
  Rows3,
  SlidersHorizontal,
  SquareStack,
  Table2,
  type LucideIcon,
} from "lucide-react";

export interface UIPreviewCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

/**
 * The tab list for UIPreviewPage, and the source for OverviewPage's "Component
 * categories" browse grid (each card deep-links to `/ui-preview?tab=<id>`). One list,
 * two views — add a category here and both pick it up.
 */
export const uiPreviewCategories: UIPreviewCategory[] = [
  { id: "fields", label: "Fields", icon: SlidersHorizontal, description: "Inputs, selects, pickers, and every other form control." },
  { id: "buttons", label: "Buttons", icon: MousePointerClick, description: "Text, slide, and rounded button families, plus the action presets." },
  { id: "cards", label: "Cards", icon: SquareStack, description: "The base surface component for grouped content." },
  { id: "table", label: "Table", icon: Table2, description: "Keyboard-accessible data table with pagination." },
  { id: "datetime", label: "Date & Time", icon: CalendarClock, description: "Date, month, year, time, and range pickers." },
  { id: "modals", label: "Modals", icon: PanelsTopLeft, description: "Status modals and the confirm/session dialogs." },
  { id: "badges", label: "Badges", icon: BadgeCheck, description: "Icon and dot status badges." },
  { id: "charts", label: "Charts", icon: Rows3, description: "Stat cards and the recharts-backed chart cards." },
  { id: "loader", label: "Loader", icon: LoaderCircle, description: "Global, inline, and skeleton loading states." },
  { id: "common", label: "Common", icon: LayoutGrid, description: "Tabs, tooltips, accordion, and other cross-cutting pieces." },
];
