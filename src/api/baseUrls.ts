/**
 * The one backend this app talks to: `VITE_API_BASE_URL`, its gateway address
 * (e.g. `http://<server>:8080/api-gateway`, read from `.env` at build time). EVERY call goes through it —
 * login and logout included (`/login-credential-service/...`).
 *
 * Auth is a token from the login response body, sent as `Authorization: Bearer` on every call except login
 * itself (see `authStore.ts` `buildAuthHeaders`) — not a cookie, which a cross-origin HTTP backend can never
 * receive.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

export function apiBaseUrl(): string {
  return API_BASE_URL;
}
