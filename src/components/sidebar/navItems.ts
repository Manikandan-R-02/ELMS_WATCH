import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { APP_SCREENS } from "../../routes/appScreens";
import { useAuthStore } from "../../store/authStore";
import { isScreenAccessible } from "../../lib/screenRights";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

// Overview, Rules & Regulations and UI Preview are intentionally not listed here — hidden
// from the sidebar/breadcrumbs/command palette per request, but their routes
// (ROUTES.overview, ROUTES.rules, ROUTES.uiPreview) still exist and work if linked directly
// (e.g. LoginPage still redirects to ROUTES.overview after sign-in; UI Preview, the
// component-library demo, stays reachable at /ui-preview for developers).
//
// Only the business screens (APP_SCREENS) are listed, in the same order as the old
// ELmsWatch app's sidebar (see ELmsWatch/CLAUDE.md) — built or not, every one of them
// shows up here from day one; router.tsx renders a "being redesigned" placeholder for
// whichever ones aren't built yet.
export const navItems: NavItem[] = APP_SCREENS.map((screen) => ({ label: screen.label, path: screen.path, icon: screen.icon }));

/**
 * `navItems` filtered by the logged-in user's `screenRights` (see `lib/screenRights.ts` and
 * `authStore.ts`'s `ScreenRight` — the login API's shape, carried over from the old ElmsWatch
 * app's own sidebar filter). Use this instead of the raw `navItems` export anywhere a user
 * should only see/reach screens they're actually allowed into — Sidebar and CommandPalette
 * (Ctrl/Cmd+K "jump to"), currently. Breadcrumbs deliberately keeps reading the raw `navItems`
 * export instead — it's resolving "what page am I already on," not "what can I navigate to,"
 * so a screen a deep link landed on should still get a readable label even if this user
 * couldn't have reached it from the nav.
 *
 * The "Screen Rights" admin screen (ROUTES.screenRights) is in the nav already but is still a
 * placeholder until the backend's screen-rights endpoints exist; this hook only consumes
 * whatever the login response already provides. Note the login response doesn't list "Screen
 * Rights" itself yet, so `isScreenAccessible` shows it to every user (fail-open) — the real
 * page needs a backend rights entry (or an explicit admin check) before it ships.
 */
export function useVisibleNavItems(): NavItem[] {
  const screenRights = useAuthStore((s) => s.user?.screenRights);
  return useMemo(() => navItems.filter((item) => isScreenAccessible(item.label, screenRights)), [screenRights]);
}
