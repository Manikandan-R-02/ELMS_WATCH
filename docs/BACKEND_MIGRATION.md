# Backend Migration Plan — ELMS Watch

Status: **Planning only. No code changed yet.**

## 1. Context

- The new backend is fully set up by the backend team.
- The existing (old) backend must be removed.
- **API endpoint paths stay the same**, but the **service/controller names and response structures may change**.
- The old frontend (`ELmsWatch`, reference only) calls the old backend through an API gateway. The new frontend (this project) will call the new backend.

## 2. Old backend — how it is reached today (reference)

Source: `ELmsWatch/src/authContext.js` (live configuration).

| Constant | Base URL (live) |
|---|---|
| `BASE_URL`, `DASH_URL`, `SMRY_URL`, `DTLS_URL`, `INST_URL`, `CAT_URL`, `ITEM_URL`, `ING_URL`, `WASTE_URL`, `USR_MASTER_URL`, `LOGIN_URL` | `https://lmswatch.socat.com:8443/api-gateway` |

Other hard-coded bases found in the old code (must be removed or replaced too):

- `ELmsWatch/src/views/admin/DataTrackerReport/DataTrackerReport.jsx` — `https://lmswatch.socat.com:8443/api-gateway`
- `ELmsWatch/src/views/admin/DailyPrj/newCl.jsx`, `oldDPCode.js` — `http://137.59.55.54:5003`
- `ELmsWatch/src/views/admin/monthClosing/index.jsx` — `MONTH_CLOSING_URL` (value to be confirmed)
- `ELmsWatch/src/api/api.js` — `http://103.73.191.2:8773/` (old direct IP, appears unused by most screens)

Old service paths seen in code (examples, not exhaustive):

- `/item-ingredient-analysis-service/itemIngredientAnalysisController/categoryDropDown`
- `/item-ingredient-analysis-service/itemIngredientAnalysisController/listOfItemIngredientAnalysis`
- `/item-breakup-service/itemBreakupController/categoryDropDown`
- `/login-credential-service/loginController/listOfUserMaster`
- `/login-credential-service/loginController/saveUserMaster`
- `/login-credential-service/loginController/modifyOfUserMaster`
- `/login-credential-service/loginController/statusUpdateOfUser`

Old modules calling the API (for the endpoint inventory in section 5): `Location1`, `LmsSummary`, `LmsDashboard`, `LmsDetails`, `LmsPrediction`, `mmsEstimations`, `StockOnHand`, `LocationConsumptions`, `categoryanalysis`, `ingredientanalysis`, `itemanalysis`, `wastecost`, `userMaster`, `userLog`, `locationMaster`, `locationRights`, `DataTrackerReport`, `DailyPrj`, `monthClosing`.

## 3. Principles for the migration

1. **Keep endpoint paths identical** where possible, so the frontend changes stay small.
2. **Isolate the change in one layer.** All calls go through the new `src/api/axiosClient.ts` and per-resource services. Screens must not hard-code base URLs or service names.
3. **Adapt response shapes in one place** (mapper/adapter functions per resource). Screens should consume the new shape through typed models, not raw backend JSON.
4. **Config via `.env`**, not hard-coded constants (e.g. `VITE_API_BASE_URL`).
5. **Remove old backend references** only after the new endpoint for that screen is verified.

## 3a. Auth flow (simple)

- **Login** (`POST .../loginController/findUsers`): the response is `{ success, message, data }`. `data.authToken` is the auth token; `data.userId`, `data.userType`, `data.period`, `data.screenRights` etc. are the user fields. The backend may also set an `AUTH_TOKEN` cookie, but the frontend ignores it (no credentials are sent).
- **Other calls:** the frontend sends `Authorization: Bearer <data.authToken>` on every call except login. The token is kept in memory and in `sessionStorage` so a refresh keeps the session; it is cleared on logout and when the tab closes.
- **Token expired:** any call returns **HTTP 401**. `axiosClient.ts` already handles this: it logs out and fires `auth:session-expired`.
- **Session modal (to build):** on `auth:session-expired`, show a "Session expired" modal with a "Login again" button that goes to the login page. Show it only once even if several calls fail together.
- **Login errors:** a 401 from the login call itself (wrong password) shows a normal login error, not the session modal.
- **Route guard (to build):** if there is no session, a protected page redirects to login.
- **Cookie max age:** not confirmed yet. The frontend does not need it, because the 401 handles expiry.

**Needed from backend:** CORS allowing the frontend origin and the `Authorization` header (sent once, not duplicated by the gateway). Cookie settings no longer matter to the frontend.

## 3b. New backend (deployed)

- Test server: `http://103.39.133.98:8080`
- Login-related sample: `GET/POST http://103.39.133.98:8080/login-credential-service/loginController/findUsers`
  - Currently fails with a **CORS error** from the browser. Backend team is fixing it.
- **Watch out:** this server is plain **HTTP**. Browsers refuse `Secure` cookies over HTTP, so `COOKIE_SECURE` must be `false` on this server, or the cookie will never be stored. The production HTTPS gateway needs `true`.
- Confirm with backend which path is the **login** endpoint (`/login` in the Java snippet vs `findUsers` above).

**CORS fix needed from backend (for cookie login):**
- `Access-Control-Allow-Origin`: the exact frontend origin (not `*`)
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Headers`: include `Content-Type` and `Authorization`
- Handle the `OPTIONS` preflight

**Frontend checklist (start tomorrow):**
1. `axiosClient.ts`: add `withCredentials: true`; set base URL from `.env`.
2. Session-expired listener + modal (401 → "Login again").
3. Route guard for protected pages.
4. Test login on the new server, then one screen at a time.

## 4. Migration steps (proposed)

1. **Get from backend team:**
   - New base URL(s) for each service (single gateway or several hosts).
   - Final list of endpoints per module with request and response schemas.
   - Auth/session mechanism (token header, cookie, login endpoint).
   - Environment list (dev / staging / prod) and CORS policy.
2. **Set up config:** `.env` entries for base URL(s); `axiosClient.ts` with base URL, auth header, timeout, and global error handling.
3. **Build endpoint map:** old path → new path → new controller/service → request shape → response shape. (Template in section 5.)
4. **Per resource:** create a service file (`src/api/<resource>.ts`) and a mapper that converts the new response to the frontend model. Keep the existing UI model unchanged where possible.
5. **Screen by screen:** switch one screen to the new API, test against the new backend, then move to the next.
6. **Remove old backend code:** delete old base URL constants, old IP addresses, and dead `api.js` usage once no screen references them.
7. **Verify:** run each migrated screen, compare numbers with the old site where data overlaps, check error and empty states.

## 5. Endpoint inventory template

Fill one row per endpoint. Old columns come from the old code; new columns come from the backend team.

| Module | Old method + path | Old service/controller | New method + path | New service/controller | Request change | Response change | Mapper needed | Status |
|---|---|---|---|---|---|---|---|---|
| Login | | `login-credential-service/loginController` | | | | | | Not started |
| User Master | `POST .../loginController/saveUserMaster` | `login-credential-service` | | | | | | Not started |
| User Master | `GET .../loginController/listOfUserMaster` | `login-credential-service` | | | | | | Not started |
| User Master | `POST .../loginController/modifyOfUserMaster` | `login-credential-service` | | | | | | Not started |
| User Master | `POST .../loginController/statusUpdateOfUser` | `login-credential-service` | | | | | | Not started |
| Item Analysis | `GET .../itemIngredientAnalysisController/categoryDropDown` | `item-ingredient-analysis-service` | | | | | | Not started |
| Item Analysis | `POST .../itemIngredientAnalysisController/listOfItemIngredientAnalysis` | `item-ingredient-analysis-service` | | | | | | Not started |
| Ingredient Analysis | `GET .../itemBreakupController/categoryDropDown` | `item-breakup-service` | | | | | | Not started |
| *(add remaining modules from section 2)* | | | | | | | | |

## 6. Open questions for the backend team

1. Final base URL(s) for dev, staging, and production.
2. Are endpoint paths unchanged for every module, or only some? Which ones change?
3. New controller/service names — is there a mapping list?
4. Response envelope: does every response still use the same wrapper (e.g. `status`, `message`, `data`)? Any changed field names, types, or date/number formats?
5. Authentication: token type, header name, expiry, refresh flow.
6. Error format: HTTP codes and error body shape.
7. Pagination, sorting, and filter parameters — any changes?
8. Is `monthClosing`'s `MONTH_CLOSING_URL` part of the new backend?
9. Is the old direct IP (`103.73.191.2`) and `137.59.55.54:5003` service retired completely?

## 7. Next step

Once the backend team shares the new base URL, endpoint list, and sample responses, fill in section 5 and start with the login/auth flow, since every other call depends on it.
