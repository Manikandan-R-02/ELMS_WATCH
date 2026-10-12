import {
  LayoutDashboard,
  MapPin,
  Building2,
  Activity,
  CalendarClock,
  UtensilsCrossed,
  PackageSearch,
  ClipboardList,
  Target,
  Gauge,
  FileText,
  Tags,
  Utensils,
  PieChart,
  Trash2,
  Users,
  KeyRound,
  History,
  CalendarCheck2,
  Settings2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "./paths";

export interface AppScreen {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
  /** True once this screen has a real, hand-built page — false renders the shared
   * `ComingSoonPage` placeholder instead (see router.tsx). Screens are being redesigned
   * one at a time from the old ELmsWatch app; flip this to true as each one lands. */
  built: boolean;
  /** Replaces `ComingSoonPage`'s default "still in the old app" text while `built` is false —
   * for a screen that needs its own explanation (e.g. one that has no old-app equivalent). */
  note?: string;
}

/**
 * The 20 business screens carried over from the old ELmsWatch app, in the SAME order as
 * its sidebar (see ELmsWatch/src/routes.js and ELmsWatch/CLAUDE.md), plus Screen Rights — new
 * in this app (the old app had no screen-rights management), placed beside Location Rights.
 * Both `navItems.ts` (sidebar/command-palette/breadcrumbs) and `router.tsx` (route table)
 * derive from this one list, so the order and per-screen built/pending state only ever need
 * to change here.
 */
export const APP_SCREENS: AppScreen[] = [
  { key: "overallSummary", label: "Overall Summary", path: ROUTES.overallSummary, icon: LayoutDashboard, built: true },
  { key: "locationSummary", label: "Location Summary", path: ROUTES.locationSummary, icon: MapPin, built: true },
  { key: "locationDetails", label: "Location Details", path: ROUTES.locationDetails, icon: Building2, built: true },
  { key: "locationInsight", label: "Location Insight", path: ROUTES.locationInsight, icon: Activity, built: true },
  { key: "dailyPrj", label: "Daily PRJ", path: ROUTES.dailyPrj, icon: CalendarClock, built: true },
  { key: "consumptionAnalysis", label: "Consumption Analysis", path: ROUTES.consumptionAnalysis, icon: UtensilsCrossed, built: true },
  { key: "stockOnHand", label: "Stock on Hand", path: ROUTES.stockOnHand, icon: PackageSearch, built: true },
  { key: "dataTrackerReport", label: "Data Tracker Report", path: ROUTES.dataTrackerReport, icon: ClipboardList, built: true },
  { key: "targetPrj", label: "Target Prj", path: ROUTES.targetPrj, icon: Target, built: true },
  { key: "productivity", label: "Productivity", path: ROUTES.productivity, icon: Gauge, built: true },
  { key: "report", label: "Report", path: ROUTES.report, icon: FileText, built: true },
  { key: "categoryAnalysis", label: "Category Analysis", path: ROUTES.categoryAnalysis, icon: Tags, built: true },
  { key: "itemAnalysis", label: "Item Analysis", path: ROUTES.itemAnalysis, icon: Utensils, built: true },
  { key: "itemBreakup", label: "Item Breakup", path: ROUTES.itemBreakup, icon: PieChart, built: true },
  { key: "wasteCostAnalysis", label: "WasteCost Analysis", path: ROUTES.wasteCostAnalysis, icon: Trash2, built: true },
  { key: "userMaster", label: "User Master", path: ROUTES.userMaster, icon: Users, built: true },
  { key: "locationRights", label: "Location Rights", path: ROUTES.locationRights, icon: KeyRound, built: true },
  {
    key: "screenRights",
    label: "Screen Rights",
    path: ROUTES.screenRights,
    icon: ShieldCheck,
    built: false,
    note: "Choose which screens each user can open. The page is waiting on the backend's screen-rights endpoints (load a user's rights, save changes).",
  },
  { key: "userLog", label: "User Log", path: ROUTES.userLog, icon: History, built: true },
  { key: "monthClosing", label: "Month Closing", path: ROUTES.monthClosing, icon: CalendarCheck2, built: true },
  { key: "generalSettings", label: "General Settings", path: ROUTES.generalSettings, icon: Settings2, built: true },
];
