import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SessionModal } from "../modals/StatusModals";
import { logout } from "../../store/authStore";
import { ROUTES } from "../../routes/paths";
import { SESSION_EXPIRED_EVENT, SESSION_REDIRECT_SECONDS } from "../../lib/sessionEvents";

/**
 * Mounted once in `AppLayout`. When any API call answers 401, `axiosClient` fires
 * `SESSION_EXPIRED_EVENT`; this shows the session modal, which counts down
 * `SESSION_REDIRECT_SECONDS` and then — or sooner, on "Log out now" — signs the user out and
 * sends them to the login page. Several calls failing at once open one modal, not several.
 *
 * A wrong password on the login screen never reaches this: login is a plain `fetch`, not an
 * `axiosClient` call, so it shows its own inline error.
 */
export function SessionExpiredHandler() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    globalThis.addEventListener(SESSION_EXPIRED_EVENT, show);
    return () => globalThis.removeEventListener(SESSION_EXPIRED_EVENT, show);
  }, []);

  const finish = useCallback(() => {
    setOpen(false);
    logout();
    navigate(ROUTES.login, { replace: true });
  }, [navigate]);

  return (
    <SessionModal open={open} countdownSeconds={SESSION_REDIRECT_SECONDS} onClose={finish} onExpire={finish} title="Session expired">
      Your session has expired. Please log in again to continue.
    </SessionModal>
  );
}
