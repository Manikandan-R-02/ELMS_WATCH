import type { TourStep } from "../onboarding.types";

/**
 * On-demand "Show tour" walkthrough for WasteCostAnalysisPage — started from
 * that page's own help modal (see `useOnboarding().startScreenTour`).
 */
export const wasteCostAnalysisTourSteps: TourStep[] = [
  {
    id: "waste-cost-analysis-header",
    target: '[data-tour="waste-cost-analysis-header"]',
    title: "WasteCost Analysis",
    description: "Waste cost, weight, and percentage across your locations for a chosen year, optionally narrowed to one month and/or one location.",
    side: "bottom",
    align: "start",
  },
  {
    id: "waste-cost-analysis-filters",
    target: '[data-tour="waste-cost-analysis-filters"]',
    title: "Year, month, and location",
    description: 'Leave Month and Location on "All" for a year-wide, per-month overview. Pick a Month to see that month broken down by location. Pick a Location to see that location\'s trend across every month.',
    side: "bottom",
    align: "start",
  },
  {
    id: "waste-cost-analysis-overview",
    target: '[data-tour="waste-cost-analysis-overview"]',
    title: "Waste overview",
    description: "This table and the charts below it adapt to your filter selection — click a row's eye icon, or a chart slice, to drill into a single day.",
    side: "top",
    align: "start",
  },
  {
    id: "waste-cost-analysis-breakdown",
    target: '[data-tour="waste-cost-analysis-breakdown"]',
    title: "Loss reasons and top wasted food",
    description: "See which loss reasons account for the most waste by weight, and which food items contribute the most, ranked highest to lowest.",
    side: "top",
    align: "start",
  },
];
