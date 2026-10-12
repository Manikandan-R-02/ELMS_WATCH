import { NETWORK_ERROR } from "../lib/safeMessage";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { detectBrowserInfo, fetchClientIp } from "../lib/deviceInfo";
import { apiBaseUrl } from "../api/baseUrls";
import { usePeriodStore } from "./periodStore";

/**
 * One entry of the login response's `screenRights` array — matches the old ElmsWatch app's
 * shape exactly (`src/components/sidebar/index.jsx`): matching is done purely by
 * case/whitespace-normalized `screenName` against a screen's nav label, `accessible === true`
 * grants access. A screen absent from this array entirely is shown by default (fail-open) —
 * see `screenRights.ts`'s `isScreenAccessible`.
 */
export interface ScreenRight {
  screenName: string;
  accessible: boolean;
  [key: string]: unknown;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  // Raw fields from the login-credential-service response (see LmsLoginResponse
  // below) — kept for session bookkeeping. `screenRights` now also gates the sidebar/command
  // palette nav (see `components/sidebar/navItems.ts`'s `useVisibleNavItems` and
  // `lib/screenRights.ts`) — everything else here is still unused beyond that.
  profilePK?: string;
  sessionId?: string;
  userId?: string;
  userType?: number;
  destination?: string;
  userTypeName?: string;
  period?: string;
  resultPK?: string;
  passwordExpiryDays?: number;
  screenRights?: ScreenRight[];
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0];
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts.at(-1) ?? first;
  return `${first[0]}${last[0]}`.toUpperCase();
}

/** The login payload itself. The new backend sends numeric ids (`userId: 24`, `resultPK: 2158`)
 * and no `profilePK`; the old one sent them as strings. `login` normalizes both to strings. */
interface LmsLoginData {
  apistatusmsg?: string | null;
  /** The auth token the new backend returns in the body; sent as `Authorization: Bearer` on every
   * call except login. */
  authToken?: string | null;
  sessionId?: string;
  profilePK?: string | number;
  userId?: string | number;
  userType?: number;
  destination?: string;
  userName?: string;
  userTypeName?: string;
  period?: string;
  resultPK?: string | number;
  passwordExpiryDays?: number;
  screenRights?: ScreenRight[];
}

/** Shape of the login-credential-service response. The new backend wraps the payload:
 * `{ success, message, data: <payload> }`. The old one (production gateway, see
 * ELmsWatch/src/authContext.js) put the payload at the top level next to `statusCode`/`message`. */
interface LmsLoginResponse extends LmsLoginData {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: LmsLoginData | null;
}

/** The login `period` (DD-MM-YYYY) is the LMS's open reporting month. The old app made it the
 * app-wide default month (layouts/admin/index.jsx), so do the same; anything unparseable leaves
 * the period store on its own default (the current month). */
function applyLoginPeriod(period: string | undefined): void {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(period ?? "");
  if (!match) return;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return;
  usePeriodStore.getState().setSelectedMonth(new Date(Number(match[3]), month - 1, 1));
}

// ── The login response carries the auth token in its body (`data.authToken`); every call
//    except login sends it back as `Authorization: Bearer` (see axiosClient.ts). No cookies
//    are involved — the app doesn't send credentials, so the AUTH_TOKEN cookie the backend
//    may also set is ignored. The token is kept in a module-level variable, mirrored to
//    sessionStorage (its own key) so a page refresh doesn't lose it, and cleared on logout
//    or when the tab closes. It is deliberately NOT in the zustand store, so the `persist`
//    middleware below never serializes it with the profile and devtools state exports never
//    show it. Trade-off: sessionStorage is readable by any script running on the page. ──
const TOKEN_STORAGE_KEY = "scm-auth-token";

function readStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

let inMemoryToken: string | null = readStoredToken();

export const getToken = (): string | null => inMemoryToken;

export const setToken = (token: string | null): void => {
  inMemoryToken = token;
  try {
    if (token) sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    else sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Storage blocked (private mode, quota): the in-memory copy still works until a refresh.
  }
};

export const buildAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

interface AuthState {
  isLoggedIn: boolean;
  user: AuthUser | null;
  /** true only while `bootstrap()` is restoring the saved session on app load. */
  bootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Call once on app boot — restores the saved session (profile + token) from sessionStorage. */
  bootstrap: () => Promise<void>;
}

type PersistedAuthState = Pick<AuthState, "isLoggedIn" | "user">;

/** The server refused the sign-in (wrong email/password, locked, expired…). Whatever reason or database text it
 * sent is deliberately not carried — the login page shows one fixed message. */
export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid credentials. Please try again.");
    this.name = "InvalidCredentialsError";
  }
}

export const useAuthStore = create<AuthState>()(
  persist<AuthState, [], [], PersistedAuthState>(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      bootstrapping: true,

      // Wired to the real login-credential-service (see ELmsWatch/src/authContext.js
      // for the reference implementation this mirrors) rather than a generic
      // /auth/login convention — the backend expects `emailId` (not `email`) plus
      // device-fingerprint fields, and reports success via `success: true` (new backend) or
      // `statusCode === 1025` (old).
      login: async (email, password) => {
        const clientIp = await fetchClientIp();
        const payload = {
          emailId: email,
          password,
          browser: detectBrowserInfo(),
          ipV4Address: clientIp,
          ipAddress: clientIp,
          macAddres: "Not available via browser",
        };

        let data: LmsLoginResponse;
        let httpOk = false;
        try {
          const response = await fetch(
            `${apiBaseUrl()}/login-credential-service/loginController/findUsers`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
              // No credentials and no Authorization header: login is the one call that doesn't
              // authenticate, and the token comes back in the response body.
            }
          );
          data = await response.json();
          httpOk = response.ok;
        } catch (err) {
          // A network-level failure (fetch throwing — offline, CORS, the gateway
          // being down) must surface as a real error, same as a reachable
          // backend rejecting the credentials below. Silently returning here
          // instead of throwing would let `LoginPage.handleSubmit`'s `await
          // login(...)` resolve as if it succeeded — it would show the
          // "Signed in" toast and call `navigate(ROUTES.overview)` before
          // `RequireAuth` immediately bounces the still-logged-out user back
          // to `/login`, a broken flow even though no unauthorized access is
          // ever granted (isLoggedIn never gets set to true).
          console.error("Login request failed", err);
          throw new Error(NETWORK_ERROR);
        }

        // New backend: `{ success: true, data: {…} }`. Old backend: `statusCode 1025` +
        // `message "Success"` with the payload at the top level.
        const succeeded = httpOk && (data.success === true || (data.statusCode === 1025 && data.message === "Success"));
        // New: the user fields live under `data`. Old: they're on the response itself.
        const body: LmsLoginData = data.data ?? data;
        if (!succeeded) {
          throw new InvalidCredentialsError();
        }

        // Never handed to `set()`, so it can't end up in the persisted profile copy of this
        // store — see the note above `TOKEN_STORAGE_KEY`.
        setToken(body.authToken ?? null);

        // `userId`/`userType` are what every screen's API calls send (`currentUserContext()`),
        // so they must come from `body`, and ids are normalized to strings (the new backend
        // sends numbers).
        const asText = (value: string | number | undefined) => (value == null ? undefined : String(value));
        const userId = asText(body.userId);
        const profilePK = asText(body.profilePK);
        const name = body.userName ?? email;
        set({
          isLoggedIn: true,
          bootstrapping: false,
          user: {
            id: userId ?? profilePK ?? email,
            name,
            email,
            role: body.userTypeName ?? "User",
            initials: initialsFrom(name),
            profilePK,
            sessionId: body.sessionId,
            userId,
            userType: body.userType,
            destination: body.destination,
            userTypeName: body.userTypeName,
            period: body.period,
            resultPK: asText(body.resultPK),
            passwordExpiryDays: body.passwordExpiryDays,
            screenRights: body.screenRights ?? [],
          },
        });
        applyLoginPeriod(body.period);
      },

      // Wired to the same login-credential-service as `login` above (mirrors
      // ELmsWatch/src/components/navbar/index.jsx's logout call — that file hits
      // a raw IP:port directly instead of the gateway; we go through the gateway
      // here for consistency with `login`, same as the rest of this store).
      logout: () => {
        const resultPK = get().user?.resultPK;
        // Captured before `setToken(null)` clears it below — the logout call still needs to
        // authenticate as the session it's invalidating. Empty (no `Authorization`) when there's
        // no token, e.g. the old production gateway.
        const authHeaders = buildAuthHeaders();
        setToken(null);
        set({ isLoggedIn: false, user: null });

        // Only the real backend hands back a resultPK — a demo-fallback session
        // (see `login`'s catch block) has nothing to invalidate server-side.
        // Fire-and-forget either way: logout must succeed locally regardless.
        if (resultPK) {
          fetch(`${apiBaseUrl()}/login-credential-service/loginController/logOut/${resultPK}`, {
            method: "GET",
            headers: { Accept: "application/json", ...authHeaders },
          }).catch(() => {});
        }
      },

      bootstrap: async () => {
        // The login-credential-service (see `login` above) has no session-restore
        // endpoint — the old ElmsWatch app didn't validate sessions server-side
        // either, it just trusted whatever was in localStorage (utils/auth.js).
        // This store's `persist` middleware already rehydrates `isLoggedIn`/`user`
        // from sessionStorage before this runs, so there's nothing to fetch here;
        // this just clears the boot-time loading flag once that rehydration has
        // had a chance to apply. The auth token is restored from sessionStorage when
        // `inMemoryToken` is first created (see the note above `TOKEN_STORAGE_KEY`), so a
        // refreshed tab keeps working until the token expires (then a 401 ends the session).
        set({ bootstrapping: false });
        // The period store isn't persisted, so a refreshed tab would otherwise fall back to the
        // current month instead of the login period.
        applyLoginPeriod(get().user?.period);
      },
    }),
    {
      name: "scm-auth",
      // Session-scoped, not localStorage: cleared when the tab closes instead
      // of lingering on disk indefinitely, which shrinks the window an
      // attacker with local file access has to read stale login state.
      storage: {
        getItem: (name) => {
          const value = sessionStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
      // Only ever persist the non-sensitive profile shell — the token is a
      // module variable above and is structurally impossible to include here.
      partialize: (state) => ({ isLoggedIn: state.isLoggedIn, user: state.user }),
    }
  )
);

export const logout = () => useAuthStore.getState().logout();
