import type { TourStep } from "../onboarding.types";

/**
 * What the tour is allowed to change on LocationRightsPage. Each one sets the *complete* state a step
 * needs — it always closes the save confirmation first — so Next, Back and "start over" all land in a
 * known place (see `TourStep.before`). The tour never saves anything.
 */
export interface LocationRightsTourControls {
  /** At least one user is listed, so a user's locations can be shown. */
  hasUsers: boolean;
  /** Show the page with the save confirmation closed; whichever user is chosen stays as it is. */
  showPage: () => void;
  /** Show the locations table with the save confirmation closed. Selects the first listed user when no
   * user is chosen, since the table only exists for a chosen user. */
  showTable: () => void;
  /** Open the "Save Location Rights?" confirmation (selecting the first listed user if none is chosen). */
  openConfirm: () => void;
}

/**
 * On-demand "Show tour" walkthrough for LocationRightsPage — started from that page's own help modal
 * (see `useOnboarding().startScreenTour`). Visits every control in reading order: Reset, Save Rights, the
 * user picker, then — for a user — Refresh, the selected count, search, the select-all and per-row
 * checkboxes, the Allowed / Restricted pill, and the Save confirmation. Steps that need a user's locations
 * or the dialog set `mountsOnDemand` + `before`.
 */
export function locationRightsTourSteps(c: LocationRightsTourControls): TourStep[] {
  const page = c.showPage;

  const steps: TourStep[] = [
    {
      id: "location-rights-header",
      target: '[data-tour="location-rights-header"]',
      before: page,
      title: "Location Rights",
      description:
        "Controls which locations a chosen user is allowed to access — pick a user, then check or uncheck each location they should be able to see. The ? button beside the title opens this guide again.",
      side: "bottom",
      align: "start",
    },
    {
      id: "location-rights-reset",
      target: '[data-tour="location-rights-reset"]',
      requireVisible: true,
      before: page,
      title: "Reset",
      description: "Clears the chosen user and every unsaved checkbox change, so you can start again.",
      side: "bottom",
      align: "end",
    },
    {
      id: "location-rights-save",
      target: '[data-tour="location-rights-save"]',
      requireVisible: true,
      before: page,
      title: "Save Rights",
      description: "Stays off until a user's locations have loaded. It asks you to confirm, then saves the full access list for that user and resets the screen.",
      side: "bottom",
      align: "end",
    },
    {
      id: "location-rights-user",
      target: '[data-tour="location-rights-user"]',
      before: page,
      title: "Select a user",
      description: "Choose a user from the list to load and edit their current location access; type to search it.",
      side: "bottom",
      align: "start",
    },
  ];

  if (!c.hasUsers) {
    steps.push({
      id: "location-rights-finish",
      before: page,
      title: "No users to pick yet",
      description:
        "The locations table, its toolbar and the save confirmation appear once a user is chosen, so they are skipped while the user list is empty. Reload the page, then open this guide again from the ? button beside the title.",
    });
    return steps;
  }

  const table = c.showTable;
  steps.push(
    {
      id: "location-rights-refresh",
      target: '[data-tour="location-rights-refresh"]',
      requireVisible: true,
      before: table,
      mountsOnDemand: true,
      title: "Refresh",
      description: "The tour picks the first user for you. Refresh reloads that user's access list from the server and discards any unsaved checkbox changes.",
      side: "bottom",
      align: "start",
    },
    {
      id: "location-rights-selected",
      target: '[data-tour="location-rights-selected"]',
      before: table,
      mountsOnDemand: true,
      title: "Selected count",
      description: "How many locations are currently ticked for this user, including changes you have not saved yet.",
      side: "bottom",
      align: "end",
    },
    {
      id: "location-rights-search",
      target: '[data-tour="location-rights-search"]',
      requireVisible: true,
      before: table,
      mountsOnDemand: true,
      title: "Search locations",
      description: "Type a location ID or name to narrow the table; the suggestions list the locations.",
      side: "bottom",
      align: "end",
    },
    {
      id: "location-rights-select-all",
      target: '[data-tour="location-rights-select-all"]',
      before: table,
      mountsOnDemand: true,
      title: "Select all",
      description: "Ticks or unticks every location currently matching your search (not just this page). It shows a dash when only some are ticked.",
      side: "bottom",
      align: "start",
    },
    {
      id: "location-rights-table",
      target: '[data-tour="location-rights-table"]',
      before: table,
      mountsOnDemand: true,
      title: "Toggle access per location",
      description:
        "Tick a row's checkbox to allow that location, or click its green Allowed / red Restricted pill — both do the same. Click Location ID or Location Name to sort, and use the page controls under the table.",
      side: "top",
      align: "start",
    },
    {
      id: "location-rights-confirm",
      target: '[data-tour="location-rights-confirm"]',
      before: c.openConfirm,
      mountsOnDemand: true,
      title: "Confirm the save",
      description:
        "Shows the user and how many locations are allowed. Save Rights sends the whole list; Cancel, Esc or a click outside closes this without saving. If the server refuses, its own message appears.",
      side: "bottom",
      align: "center",
    },
    {
      id: "location-rights-finish",
      before: page,
      title: "That's the whole screen",
      description: "You've seen every control on Location Rights. Open this guide again any time from the ? button beside the title.",
    }
  );
  return steps;
}
