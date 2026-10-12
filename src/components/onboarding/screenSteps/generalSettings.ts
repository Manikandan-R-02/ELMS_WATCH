import type { TourStep } from "../onboarding.types";

/**
 * On-demand "Show tour" walkthrough for GeneralSettingsPage — started from that
 * page's own help modal (see `useOnboarding().startScreenTour`), not part of the
 * cross-route first-run tour in `tourSteps.ts`. One file per screen under this
 * folder so multiple screens' tours can be authored/edited independently without
 * touching a single shared registry file.
 */
export const generalSettingsTourSteps: TourStep[] = [
  {
    id: "general-settings-header",
    target: '[data-tour="general-settings-header"]',
    title: "General Settings",
    description: "Controls the comma-separator style and decimal precision used for every amount and quantity across the app — set once, applied everywhere.",
    side: "bottom",
    align: "start",
  },
  {
    id: "general-settings-fields",
    target: '[data-tour="general-settings"]',
    title: "Pick your format",
    description: "Choose a separator style and how many decimal places amounts and quantities should show. Nothing is saved yet — this is just a draft.",
    side: "bottom",
    align: "start",
  },
  {
    id: "general-settings-preview",
    target: '[data-tour="general-settings-preview"]',
    title: "Live preview",
    description: "These pills update instantly as you change the settings above, so you can see the result before committing to it.",
    side: "top",
    align: "start",
  },
  {
    id: "general-settings-save",
    target: '[data-tour="general-settings-header"]',
    title: "Save when ready",
    description: "Click Save (top right) to apply your changes everywhere, or Reset to restore the default formatting.",
    side: "bottom",
    align: "end",
  },
];
