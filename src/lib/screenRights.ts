import type { ScreenRight } from "../store/authStore";

/**
 * Mirrors the old ElmsWatch app's sidebar screen-rights filter
 * (`src/components/sidebar/index.jsx`) exactly:
 *  - No `screenRights` on the logged-in user at all (empty array, or field missing entirely —
 *    e.g. a demo-fallback session, or a backend that hasn't rolled this out yet) → every screen
 *    stays visible. Fail-open at the "no rights data" level, not per-screen.
 *  - Once `screenRights` is non-empty, a screen whose (case/whitespace-normalized) label isn't
 *    mentioned in the array at all is still shown by default (fail-open per-screen too) — the
 *    array only ever *restricts* screens it explicitly governs.
 *  - A screen that IS mentioned is shown only when its entry has `accessible === true`.
 * One manual remap carried over from the old app: its "General Settings" nav label matches a
 * `screenName` of "Common Entity" in the API response.
 */
const SCREEN_NAME_REMAP: Record<string, string> = {
  "General Settings": "Common Entity",
};

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

export function isScreenAccessible(screenLabel: string, screenRights: ScreenRight[] | undefined): boolean {
  if (!Array.isArray(screenRights) || screenRights.length === 0) return true;

  const screenName = normalize(SCREEN_NAME_REMAP[screenLabel] ?? screenLabel);
  const governed = screenRights.some((s) => normalize(s.screenName) === screenName);
  if (!governed) return true;

  return screenRights.some((s) => normalize(s.screenName) === screenName && s.accessible === true);
}
