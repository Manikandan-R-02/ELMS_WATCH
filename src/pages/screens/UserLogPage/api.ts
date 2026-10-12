/**
 * User Log's two HTTP calls — the same `login-credential-service` endpoints and paths as the old ElmsWatch
 * app (`views/admin/userLog/index.jsx`): `/login-credential-service/loginController/retreiveUserLog` and
 * `…/retreiveUserLogByExcel` (note the "retreive" spelling — it is the backend's own). Both take the same
 * `retrieveType`-keyed body (1=day, 2=week, 3=month, 4=year, plus `day` or `yearInt`).
 *
 *  - `retreiveUserLog` now answers in the `{ success, message, data }` envelope — `data` is the list of log
 *    rows (only the user, role, login and logout fields are read).
 *  - `retreiveUserLogByExcel` answers with the workbook itself (a file, as in the old app); the new swagger
 *    gives no response structure for it, so `downloadUserLogExcel` goes through `requestFile`, which saves a
 *    real file, shows the backend's own message for a JSON error, or opens a JSON file link.
 */
import { format, startOfMonth } from "date-fns";
import axiosClient from "../../../api/axiosClient";
import { listPayload, type ListBody } from "../../../api/apiHelpers";
import { requestFile } from "../../../api/fileDownload";
import type { UserLogEntry, UserLogQuery } from "./data";

const BASE = "/login-credential-service/loginController";

interface RetrievePayload {
  day?: string;
  retrieveType: 1 | 2 | 3 | 4;
  yearInt?: number;
}

/** The date the filename label is based on: the first of the month for a month query, else the picked date. */
function labelDate(query: Extract<UserLogQuery, { date: Date }>): Date {
  return query.period === "month" ? startOfMonth(query.date) : query.date;
}

export function buildPayload(query: UserLogQuery): RetrievePayload {
  switch (query.period) {
    case "day":
      return { day: format(query.date, "yyyy-MM-dd"), retrieveType: 1 };
    case "week":
      return { day: format(query.date, "yyyy-MM-dd"), retrieveType: 2 };
    case "month":
      return { day: format(startOfMonth(query.date), "yyyy-MM-dd"), retrieveType: 3 };
    case "year":
      return { retrieveType: 4, yearInt: query.year };
  }
}

/** A safe, descriptive filename for the exported workbook — matches the old screen's
 * `user_log_{period}_{label}.xlsx` naming, alphanumeric-only so it's valid on every OS. */
export function userLogFilename(query: UserLogQuery): string {
  const label =
    query.period === "year"
      ? String(query.year)
      : format(labelDate(query), "yyyy-MM-dd");
  const safeLabel = label.replaceAll(/\W/g, "_");
  return `user_log_${query.period}_${safeLabel}.xlsx`;
}

interface UserLogApi {
  userEmailId?: string;
  userName?: string;
  userTypeWord?: string;
  loginStr?: string;
  logoutStr?: string;
}

export function mapUserLogEntry(row: UserLogApi): UserLogEntry {
  return {
    userEmailId: row.userEmailId ?? "",
    userName: row.userName ?? "",
    userTypeWord: row.userTypeWord,
    loginStr: row.loginStr,
    logoutStr: row.logoutStr,
  };
}

export async function fetchUserLog(query: UserLogQuery): Promise<UserLogEntry[]> {
  const { data } = await axiosClient.post<ListBody<UserLogApi>>(`${BASE}/retreiveUserLog`, buildPayload(query));
  return listPayload(data).map(mapUserLogEntry);
}

// ─── Excel export ────────────────────────────────────────────────────────────────────────────────

/** Triggers a browser download of the Excel workbook for the same query. The response structure is not
 * documented, so `requestFile` (src/api/fileDownload.ts) saves a real file, shows a JSON error's own message, or
 * opens a JSON file link — see its header. */
export async function downloadUserLogExcel(query: UserLogQuery): Promise<void> {
  await requestFile(
    () => axiosClient.post<Blob>(`${BASE}/retreiveUserLogByExcel`, buildPayload(query), { responseType: "blob" }),
    userLogFilename(query)
  );
}
