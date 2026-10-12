/**
 * Centralized route path constants. Every `<Route path>`, `navigate(...)`, `<Link to>`,
 * and `navItems` entry should import from here instead of hardcoding a URL string, so a
 * path only ever needs to change in one place.
 */
export const ROUTES = {
  login: "/login",
  overview: "/",
  uiPreview: "/ui-preview",
  rules: "/rules",
  generalSettings: "/general-settings",
  // Business screens — see src/routes/appScreens.ts for the full ordered list (icon, sidebar
  // label, and whether each has a real page yet) that both the sidebar and router.tsx read from.
  overallSummary: "/overall-summary",
  locationSummary: "/location-summary",
  locationDetails: "/location-details",
  locationInsight: "/location-insight",
  dailyPrj: "/daily-prj",
  consumptionAnalysis: "/consumption-analysis",
  stockOnHand: "/stock-on-hand",
  dataTrackerReport: "/data-tracker-report",
  targetPrj: "/target-prj",
  productivity: "/productivity",
  report: "/report",
  categoryAnalysis: "/category-analysis",
  itemAnalysis: "/item-analysis",
  itemBreakup: "/item-breakup",
  wasteCostAnalysis: "/wastecost-analysis",
  userMaster: "/user-master",
  locationRights: "/location-rights",
  screenRights: "/screen-rights",
  userLog: "/user-log",
  monthClosing: "/month-closing",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
