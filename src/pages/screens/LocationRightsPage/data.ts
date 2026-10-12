/**
 * Types for the Location Rights screen — the rebuild of the old ElmsWatch app's
 * `views/admin/locationRights/index.jsx`. Per user, this maps every location to a single
 * allowed/restricted boolean — there is no separate per-screen permission axis in that screen.
 *
 * The old screen tracked selection as an array of *array indices* into its location list, which
 * only stayed correct because a separately-sorted/filtered view carried a `realIdx` back-pointer
 * into the original array. This rebuild keys selection by `pk` instead, so sorting or filtering
 * the table can never desync it from the row it's supposed to represent.
 *
 * IMPORTANT: despite the old code naming its per-row identifier `pkThree`, the live backend
 * response confirms `pkThree` is actually the *requested user's* pk, repeated identically on
 * every row (it matches the `{userPk}` path segment `fetchLocationAccess` was called with) — it
 * is not unique per location. The row's own unique id is the shared `pk` field the response also
 * carries. `pkThree` is still round-tripped verbatim in `saveLocationRights`'s payload (matching
 * the old app's exact request shape), but all client-side selection/keying uses `pk`.
 */

export interface RightsUserOption {
  pk: number;
  name: string;
}

export interface LocationAccessRow {
  /** The row's own unique id — use this for selection state and as the table's `rowKey`. */
  pk: number;
  /** NOT unique — see the file-level note above. Only round-tripped into the save payload. */
  pkThree: number;
  code: string;
  name: string;
  check: boolean;
}
