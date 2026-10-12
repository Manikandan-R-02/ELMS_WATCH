import type { TourStep } from "../onboarding.types";

/**
 * What the tour is allowed to change on TargetPrjPage. Each one sets the *complete* state a step needs
 * — it always starts from the dialog closed — so Next, Back and "start over" all land in a known place
 * (see `TourStep.before`). The tour never edits or saves a value.
 */
export interface TargetPrjTourControls {
  /** At least one location is listed, so the "Update Target" dialog can be opened. */
  hasLocations: boolean;
  /** Show the location list with the dialog closed. */
  showTable: () => void;
  /** Open the "PRJ / SRC & Target Value" dialog on the first listed location. */
  openModal: () => void;
}

/**
 * On-demand "Show tour" walkthrough for TargetPrjPage — started from that page's own help modal (see
 * `useOnboarding().startScreenTour`). Visits every control in reading order: the reporting month,
 * Refresh, search, Download, the location list with its Update Target buttons and unsaved markers, then
 * the dialog's target values and its Reset / Update buttons. Steps inside the dialog set
 * `mountsOnDemand` + `before`.
 */
export function targetPrjTourSteps(c: TargetPrjTourControls): TourStep[] {
  const table = c.showTable;

  const steps: TourStep[] = [
    {
      id: "target-prj-header",
      target: '[data-tour="target-prj-header"]',
      before: table,
      title: "Target Prj Summary",
      description:
        "Every location's PRJ / SRC target values for the reporting month. The ? button beside the title opens this guide again.",
      side: "bottom",
      align: "start",
    },
    {
      id: "target-prj-period",
      target: '[data-tour="period-picker"]',
      requireVisible: true,
      before: table,
      title: "Change the period",
      description: "Use the month picker in the top header to switch the reporting month — the list and any unsaved edits reload for the newly selected month.",
      side: "bottom",
      align: "end",
    },
    {
      id: "target-prj-refresh",
      target: '[data-tour="target-prj-refresh"]',
      requireVisible: true,
      before: table,
      title: "Refresh",
      description: "Clears the search, closes any open dialog and reloads the targets from the server for the reporting month.",
      side: "bottom",
      align: "end",
    },
    {
      id: "target-prj-search",
      target: '[data-tour="target-prj-search"]',
      requireVisible: true,
      before: table,
      title: "Search",
      description: "Type a location ID or name, or a PRJ / SRC, to narrow the list; the suggestions list the locations.",
      side: "bottom",
      align: "end",
    },
    {
      id: "target-prj-download",
      target: '[data-tour="target-prj-download"]',
      requireVisible: true,
      before: table,
      title: "Download",
      description: "Saves the locations currently listed, with every PRJ / SRC target, as a CSV file.",
      side: "bottom",
      align: "end",
    },
    {
      id: "target-prj-unsaved",
      target: '[data-tour="target-prj-unsaved"]',
      requireVisible: true,
      before: table,
      title: "Unsaved changes",
      description: "Appears beside the search once a target value has been edited but not saved yet, with how many.",
      side: "bottom",
      align: "end",
    },
    {
      id: "target-prj-table",
      target: '[data-tour="target-prj-table"]',
      before: table,
      title: "Locations",
      description:
        "One row per location. Headings sort, and the page controls move through the list. A small amber dot beside Update Target marks a location with unsaved edits.",
      side: "top",
      align: "start",
    },
  ];

  if (!c.hasLocations) {
    steps.push({
      id: "target-prj-finish",
      before: table,
      title: "No locations to update yet",
      description:
        "The Update Target dialog appears once a location is listed for the reporting month. Pick another month or press Refresh, then open this guide again from the ? button beside the title.",
    });
    return steps;
  }

  const modal = c.openModal;
  steps.push(
    {
      id: "target-prj-update",
      target: '[data-tour="target-prj-update"]',
      requireVisible: true,
      before: table,
      title: "Update Target",
      description: "Opens that location's PRJ / SRC breakdown so you can edit its targets.",
      side: "left",
      align: "center",
    },
    {
      id: "target-prj-modal-table",
      target: '[data-tour="target-prj-modal-table"]',
      before: modal,
      mountsOnDemand: true,
      title: "PRJ / SRC & Target Value",
      description:
        "The tour opens the first location for you. Each PRJ / SRC has a Target Value box: click it and type to replace the number, negative values and decimals are allowed. An edited box gets an amber border until it is saved or reset.",
      side: "bottom",
      align: "center",
    },
    {
      id: "target-prj-modal-reset",
      target: '[data-tour="target-prj-modal-reset"]',
      before: modal,
      mountsOnDemand: true,
      title: "Reset",
      description: "Puts this location's edited values back to what was loaded. It stays off until something is edited.",
      side: "top",
      align: "end",
    },
    {
      id: "target-prj-modal-save",
      target: '[data-tour="target-prj-modal-save"]',
      before: modal,
      mountsOnDemand: true,
      title: "Update",
      description:
        "Saves only this location's edited values to the server, then closes the dialog and reloads the list. It stays off until something is edited, and shows the server's message if the save fails.",
      side: "top",
      align: "end",
    },
    {
      id: "target-prj-finish",
      before: table,
      title: "That's the whole screen",
      description: "You've seen every control on Target Prj Summary. Open this guide again any time from the ? button beside the title.",
    }
  );
  return steps;
}
