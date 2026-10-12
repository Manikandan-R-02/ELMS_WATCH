/**
 * Types for the User Log screen — the rebuild of the old ElmsWatch app's
 * `views/admin/userLog/index.jsx`. Despite the generic name, this only ever tracks two event
 * types per user per period: login time and logout time — there is no create/update/delete/
 * screen-visit audit trail in the old screen's data model, so none is invented here either.
 */

export type UserLogPeriod = "day" | "week" | "month" | "year";

export interface UserLogEntry {
  userEmailId: string;
  userName: string;
  userTypeWord?: string;
  loginStr?: string;
  logoutStr?: string;
}

export type UserLogQuery =
  | { period: "day"; date: Date }
  | { period: "week"; date: Date }
  | { period: "month"; date: Date }
  | { period: "year"; year: number };

export const PERIOD_OPTIONS: { label: string; value: UserLogPeriod }[] = [
  { label: "Current Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];
