import axios, { type InternalAxiosRequestConfig } from "axios";
import { showLoader, hideLoader } from "../store/loaderStore";
import { setToken, buildAuthHeaders } from "../store/authStore";
import { SESSION_EXPIRED_EVENT } from "../lib/sessionEvents";
import { apiBaseUrl } from "./baseUrls";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Skip the global loader overlay for this request (e.g. background polling). */
    silent?: boolean;
    /** Keep this request running when the person moves to another screen. Every request is cancelled on leaving its
     * screen by default (a slow call from a screen nobody is looking at must not keep the network busy and the
     * loader spinning); set this only for a write — a save must finish even if the person navigates away. */
    keepOnNavigation?: boolean;
  }
}

/** Requests started while a screen is on display share this controller; `cancelScreenRequests()` aborts them. */
let screenRequests = new AbortController();

/** Cancels every in-flight request of the screen being left (see `keepOnNavigation` for the exception) and starts a
 * fresh set for the next screen. Called by the app layout on every route change. */
export function cancelScreenRequests(): void {
  screenRequests.abort();
  screenRequests = new AbortController();
}

/** True for the error a cancelled request ends with — not a failure, and never worth retrying or showing. */
export function isRequestCanceled(error: unknown): boolean {
  return axios.isCancel(error);
}

export const axiosClient = axios.create({
  // No static `baseURL` here — set per-request below from `baseUrls.ts` (the one backend, `VITE_API_BASE_URL`).
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.silent) showLoader();

  config.baseURL = apiBaseUrl();
  if (!config.keepOnNavigation && !config.signal) config.signal = screenRequests.signal;

  // The auth token from the login response body goes out as `Authorization: Bearer` on every
  // call made through this client — everything except login, which `authStore.ts` sends with a
  // plain `fetch`. No cookies / `withCredentials`. `buildAuthHeaders()` only adds the header
  // when a token exists (it is absent only before login).
  const { Authorization } = buildAuthHeaders();
  if (Authorization) config.headers.Authorization = Authorization;

  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    if (!response.config.silent) hideLoader();
    return response;
  },
  (error) => {
    if (!error.config?.silent) hideLoader();

    if (error.response?.status === 401) {
      // Never keep a rejected/expired token around — reduces the window an
      // attacker (or a stale tab) could replay it.
      setToken(null);
      // The session modal (SessionExpiredHandler) takes it from here: it counts down, then logs
      // out and redirects to login. Not `logout()` here — that would flip `isLoggedIn` and have
      // RequireAuth bounce the user to the login page before the modal could ever show. Several
      // calls failing together just raise the event several times; the modal opens once.
      globalThis.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
