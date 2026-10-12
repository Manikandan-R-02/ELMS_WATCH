/** Fired on `window` by `axiosClient` when the backend answers 401 (the session/token has expired).
 * `SessionExpiredHandler` listens for it, shows the session modal, and redirects to login. */
export const SESSION_EXPIRED_EVENT = "auth:session-expired";

/** How long the session modal counts down before sending the user to the login page. */
export const SESSION_REDIRECT_SECONDS = 10;
