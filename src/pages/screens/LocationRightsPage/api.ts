/**
 * Location Rights' three HTTP calls — the same `login-credential-service` endpoints and paths as the old
 * ElmsWatch app (`views/admin/locationRights/index.jsx`), now answering in the `{ success, message, data }`
 * envelope. The first two names (`userDropdownByLocatinRights`, note the "Locatin" typo) are copied verbatim
 * from the backend — "fixing" the spelling here would 404.
 *
 *  - `GET userDropdownByLocatinRights` — `data` is the list of users for the picker (only `pk` and `name` are read).
 *  - `GET userDropdownByLocatinRights/{userFk}` — `data` is every location with that user's `check` flag.
 *  - `POST saveLocationRights` — the body is a bare array (one entry per location); `data` is a message string.
 *    A `success: false` answer on an HTTP 200 is a failure, so it throws the backend's message.
 *
 * Every row is the backend's one very wide shared DTO, of which only a handful of fields are read. A location
 * may arrive as `code`/`name` (what the old app read) or as `locationId`/`locationName`; both are accepted.
 */
import axiosClient from "../../../api/axiosClient";
import { listPayload, textOf, unwrapEnvelope as unwrap, type ApiEnvelope, type ListBody } from "../../../api/apiHelpers";
import type { LocationAccessRow, RightsUserOption } from "./data";

const BASE = "/login-credential-service/loginController";

interface RightsUserApi {
  pk?: number | string;
  name?: string;
}

interface LocationAccessApi {
  pk?: number | string;
  pkThree?: number | string;
  code?: string;
  name?: string;
  id?: string;
  locationId?: string;
  locationName?: string;
  check?: boolean | string;
}

export function mapRightsUser(u: RightsUserApi): RightsUserOption {
  return { pk: Number(u.pk) || 0, name: u.name ?? "" };
}

export function mapLocationAccess(r: LocationAccessApi): LocationAccessRow {
  return {
    pk: Number(r.pk) || 0,
    pkThree: Number(r.pkThree) || 0,
    code: textOf(r.code || r.locationId || r.id, ""),
    name: r.name || r.locationName || "",
    check: r.check === true || r.check === "true",
  };
}

export async function fetchRightsUsers(): Promise<RightsUserOption[]> {
  const { data } = await axiosClient.get<ListBody<RightsUserApi>>(`${BASE}/userDropdownByLocatinRights`);
  return listPayload(data).map(mapRightsUser);
}

export async function fetchLocationAccess(userPk: number): Promise<LocationAccessRow[]> {
  const { data } = await axiosClient.get<ListBody<LocationAccessApi>>(`${BASE}/userDropdownByLocatinRights/${userPk}`);
  return listPayload(data).map(mapLocationAccess);
}

/** Sends the full location list back (not a diff), each with its final allowed flag — same
 * contract the old screen's `saveLocationRights` used. `allowedPks` is keyed by each row's unique
 * `pk` (see data.ts's note on why `pkThree` can't be used for this), but `pkThree` itself is still
 * echoed back in the payload exactly as the old app sent it. */
export async function saveLocationRights(rows: LocationAccessRow[], allowedPks: Set<number>): Promise<void> {
  const payload = rows.map((row) => ({
    pkThree: row.pkThree,
    locationId: row.code,
    check: allowedPks.has(row.pk),
  }));
  const { data: envelope } = await axiosClient.post<ApiEnvelope<string>>(`${BASE}/saveLocationRights`, payload, { keepOnNavigation: true });
  unwrap(envelope);
}
