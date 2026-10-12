import { navItemFor, revealNavItem } from "../../lib/revealNavItem";
import { useLayoutStore } from "../../store/layoutStore";
import type { TourStep } from "./onboarding.types";

/** One line on what each screen is for, shown when the tour reaches its menu item. */
const SCREEN_BLURBS: Record<string, string> = {
  "Overall Summary": "The big picture for the month: locations, POB, mandays, cost, daily cost comparison and cost by category.",
  "Location Summary": "Every location side by side — cost, mandays, waste and month comparisons, with charts and a column picker.",
  "Location Details": "One location in depth: cost comparison, inventory trend and consumption by period.",
  "Location Insight": "Trends and insights for a single location over time.",
  "Daily PRJ": "Per-manday cost (PRJ) for every location, and day by day for the one you pick, against its target.",
  "Consumption Analysis": "What each location consumed: quantity and amount by item, category and source type.",
  "Stock on Hand": "Closing stock by location and item, with days holding and stock amount.",
  "Data Tracker Report": "The month's data-entry tracker for every location, with an Excel download.",
  "Target Prj": "View and update each location's PRJ targets for the month.",
  "Productivity": "View and update each location's productivity values.",
  "Report": "Generate any of the Excel reports for a month.",
  "Category Analysis": "Cost and quantity by item category, drilling down to items.",
  "Item Analysis": "Item-level analysis for a location, with category and source-type filters.",
  "Item Breakup": "Where an item's cost comes from, location by location.",
  "WasteCost Analysis": "Waste cost by location, category and day.",
  "User Master": "Create, edit and reset users.",
  "Location Rights": "Choose which locations each user can see.",
  "Screen Rights": "Choose which screens each user can open.",
  "User Log": "Who signed in, from where and when, with an Excel export.",
  "Month Closing": "Close the current month and roll the period forward.",
  "General Settings": "Number formatting — separators and decimals — applied across every screen.",
};

/**
 * One screen's turn in the app-wide tour: a single step pointing at that screen's menu item. When the person
 * continues, the tour opens the screen and runs the screen's own tour; when that ends, the next menu item
 * gets its turn (see `playMainTour` in `OnboardingProvider.tsx`).
 *
 * In the horizontal menu the step first scrolls its tab fully into view; below the `lg` breakpoint the vertical
 * menu is an off-canvas drawer, opened for the step and closed afterwards (`openMobileSidebar(true)` skips the
 * slide-in, because the tour measures its target the instant a step starts).
 */
export function navIntroStep(item: { label: string; path: string }, index: number, total: number): TourStep {
  const horizontal = () => useLayoutStore.getState().orientation === "horizontal";
  const blurb = SCREEN_BLURBS[item.label] ?? `Opens ${item.label}.`;
  return {
    id: `nav-${item.path}`,
    target: `[data-tour-nav="${item.path}"]`,
    title: `${item.label} (${index + 1} of ${total})`,
    description: `${blurb} Continue to open it and walk through its controls.`,
    side: "bottom",
    align: "start",
    nextLabel: "Open this screen",
    onEnter: () => {
      if (horizontal()) revealNavItem(navItemFor(item.path), { instant: true });
      else useLayoutStore.getState().openMobileSidebar(true);
    },
    onExit: () => useLayoutStore.getState().closeMobileSidebar(),
  };
}

/** The last part of the app-wide tour, after every screen: the header's global controls. */
export function headerTourSteps(): TourStep[] {
  return [
    {
      id: "search",
      target: '[data-tour="global-search"]',
      requireVisible: true,
      title: "Jump to anything",
      description: "Search and jump straight to any page — or press Ctrl/Cmd+K from anywhere in the app.",
      side: "bottom",
      align: "start",
    },
    {
      id: "period-picker",
      target: '[data-tour="period-picker"]',
      requireVisible: true,
      title: "Reporting period",
      description: "Pick the month you want to report on — this selection is shared across every screen that reads it.",
      side: "bottom",
      align: "end",
    },
    {
      id: "appearance",
      target: '[data-tour="appearance-settings"]',
      title: "Appearance",
      description: "Customize theme mode, accent color, layout, and more — changes apply instantly across the app.",
      side: "bottom",
      align: "end",
    },
    {
      id: "help",
      target: '[data-tour="help-center"]',
      title: "Help, anytime",
      description: "Reopen quick tips here whenever you need a refresher — including restarting this tour.",
      side: "bottom",
      align: "end",
    },
    {
      id: "finish",
      title: "You're all set!",
      description: "You now know your way around ELMS Watch. Every screen also has its own ? guide for its controls. Restart this tour anytime from the Help center.",
    },
  ];
}
