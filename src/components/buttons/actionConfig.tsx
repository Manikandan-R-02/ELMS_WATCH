import {
  Download,
  Eye,
  List,
  Plus,
  RefreshCw,
  Save,
  SquarePen,
  Trash2,
  UploadCloud,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ButtonTone } from "./TextButton";

export interface ActionDef {
  icon: LucideIcon;
  label: string;
  tone: ButtonTone;
}

/**
 * Single source of truth for the team's standard row/table actions — one entry
 * here drives the matching `{Key}SlideButton`, `{Key}TextButton`, and
 * `{Key}RoundedButton` exports (see SlideButton.tsx, ActionTextButtons.tsx,
 * ActionRoundedButtons.tsx). Change an action's default color/label/icon once,
 * here, and every button family picks it up.
 */
export const ACTIONS = {
  plus: { icon: Plus, label: "Add New", tone: "brand" },
  list: { icon: List, label: "List", tone: "purple" },
  view: { icon: Eye, label: "View", tone: "indigo" },
  modify: { icon: SquarePen, label: "Modify", tone: "cyan" },
  bulkUpload: { icon: UploadCloud, label: "Bulk Upload", tone: "brand" },
  download: { icon: Download, label: "Download", tone: "success" },
  save: { icon: Save, label: "Save", tone: "success" },
  refresh: { icon: RefreshCw, label: "Refresh", tone: "warning" },
  cancel: { icon: X, label: "Cancel", tone: "neutral" },
  delete: { icon: Trash2, label: "Delete", tone: "danger" },
} satisfies Record<string, ActionDef>;

export type ActionKey = keyof typeof ACTIONS;
