import type { TourStep } from "../onboarding.types";

/**
 * What the tour is allowed to change on UserMasterPage. Each one sets the *complete* state a step needs
 * — it always closes every dialog first — so Next, Back and "start over" all land in a known place (see
 * `TourStep.before`). The tour never submits a form.
 */
export interface UserMasterTourControls {
  /** At least one user is listed, so the Modify and Reset Password dialogs can be opened. */
  hasUsers: boolean;
  /** Show the user list with every dialog closed. */
  showList: () => void;
  /** Open the Add User dialog. */
  openAdd: () => void;
  /** Open the Modify User dialog on the first listed user. */
  openEdit: () => void;
  /** Open the Reset Password dialog on the first listed user. */
  openReset: () => void;
}

/**
 * On-demand "Show tour" walkthrough for UserMasterPage — started from that page's own help modal (see
 * `useOnboarding().startScreenTour`). Visits every control in reading order: Refresh, Add User, search,
 * the user table with its Modify and Reset Password buttons, then each dialog — the Add User form, its
 * password section and Create User button; the Modify User form, Account Status switch and Save Changes;
 * and the Reset Password form and button. Steps inside a dialog set `mountsOnDemand` + `before`.
 */
export function userMasterTourSteps(c: UserMasterTourControls): TourStep[] {
  const list = c.showList;

  const steps: TourStep[] = [
    {
      id: "user-master-header",
      target: '[data-tour="user-master-header"]',
      before: list,
      title: "User Master",
      description:
        "Lists every application user with their role and account status, and lets an admin add users, edit their details, role and status, or reset a password. The ? button beside the title opens this guide again.",
      side: "bottom",
      align: "start",
    },
    {
      id: "user-master-refresh",
      target: '[data-tour="user-master-refresh"]',
      requireVisible: true,
      before: list,
      title: "Refresh",
      description: "Reloads the user list from the server.",
      side: "bottom",
      align: "end",
    },
    {
      id: "user-master-add",
      target: '[data-tour="user-master-add"]',
      requireVisible: true,
      before: list,
      title: "Add User",
      description: "Opens the form for a new user.",
      side: "bottom",
      align: "end",
    },
    {
      id: "user-master-search",
      target: '[data-tour="user-master-search"]',
      before: list,
      title: "Find a user",
      description: "Search by name, user name, email or role to narrow the list; the suggestions list the users.",
      side: "bottom",
      align: "end",
    },
    {
      id: "user-master-table",
      target: '[data-tour="user-master-table"]',
      before: list,
      title: "Users",
      description:
        "One row per user with their email, user type and a green Active or red Inactive badge. Headings sort and the page controls move through the list.",
      side: "top",
      align: "start",
    },
  ];

  if (c.hasUsers) {
    steps.push(
      {
        id: "user-master-modify",
        target: '[data-tour="user-master-modify"]',
        requireVisible: true,
        before: list,
        title: "Modify a user",
        description: "The pencil opens that user's details, role and account status for editing.",
        side: "left",
        align: "center",
      },
      {
        id: "user-master-reset",
        target: '[data-tour="user-master-reset"]',
        requireVisible: true,
        before: list,
        title: "Reset a password",
        description: "The key sets a new password for that user without needing their current one.",
        side: "left",
        align: "center",
      }
    );
  }

  const add = c.openAdd;
  steps.push(
    {
      id: "user-master-add-form",
      target: '[data-tour="user-master-add-form"]',
      before: add,
      mountsOnDemand: true,
      title: "Add User form",
      description:
        "First name, last name, user name, user role, email and mobile number are required (mobile is 10 digits); Destination is optional. The email must not already belong to another user.",
      side: "bottom",
      align: "center",
    },
    {
      id: "user-master-add-password",
      target: '[data-tour="user-master-add-password"]',
      before: add,
      mountsOnDemand: true,
      title: "Password",
      description: "At least 8 characters with a letter, a number and a special character, entered twice — both must match before the user can be created.",
      side: "top",
      align: "center",
    },
    {
      id: "user-master-add-submit",
      target: '[data-tour="user-master-add-submit"]',
      before: add,
      mountsOnDemand: true,
      title: "Create User",
      description: "Creates the user and reloads the list. If the server refuses, its own message appears at the top of the form; Cancel, Esc or a click outside closes it without creating anyone.",
      side: "top",
      align: "end",
    }
  );

  if (!c.hasUsers) {
    steps.push({
      id: "user-master-finish",
      before: list,
      title: "No users to edit yet",
      description:
        "The Modify User and Reset Password dialogs open from a user's row, so they are skipped while the list is empty. Add a user or press Refresh, then open this guide again from the ? button beside the title.",
    });
    return steps;
  }

  const edit = c.openEdit;
  const reset = c.openReset;
  steps.push(
    {
      id: "user-master-edit-form",
      target: '[data-tour="user-master-edit-form"]',
      before: edit,
      mountsOnDemand: true,
      title: "Modify User form",
      description: "The tour opens the first user for you. Change the name, user name or role; the email, mobile number and password are not edited here.",
      side: "bottom",
      align: "center",
    },
    {
      id: "user-master-edit-status",
      target: '[data-tour="user-master-edit-status"]',
      before: edit,
      mountsOnDemand: true,
      title: "Account Status",
      description: "Turn it off to block the user from signing in. Saving a deactivation asks you to confirm first.",
      side: "top",
      align: "center",
    },
    {
      id: "user-master-edit-save",
      target: '[data-tour="user-master-edit-save"]',
      before: edit,
      mountsOnDemand: true,
      title: "Save Changes",
      description: "Saves the details and the status, then reloads the list. If the server refuses, its own message appears at the top of the form.",
      side: "top",
      align: "end",
    },
    {
      id: "user-master-reset-form",
      target: '[data-tour="user-master-reset-form"]',
      before: reset,
      mountsOnDemand: true,
      title: "Reset Password form",
      description: "Shows who it is for. Enter the new password twice; it needs at least 8 characters with a letter, a number and a special character.",
      side: "bottom",
      align: "center",
    },
    {
      id: "user-master-reset-submit",
      target: '[data-tour="user-master-reset-submit"]',
      before: reset,
      mountsOnDemand: true,
      title: "Reset Password",
      description: "Sets the new password right away; the user's next sign-in must use it. If the server refuses, its own message appears at the top of the form.",
      side: "top",
      align: "end",
    },
    {
      id: "user-master-finish",
      before: list,
      title: "That's the whole screen",
      description: "You've seen every control on User Master. Open this guide again any time from the ? button beside the title.",
    }
  );
  return steps;
}
