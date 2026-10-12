import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { AppLoader } from "../loader/AppLoader";
import { ROUTES } from "../../routes/paths";

/**
 * Gates every route nested under it behind a session. Waits out `bootstrap()`
 * (restoring the saved session on app load, see authStore.ts) before
 * deciding, so a refreshed tab with a still-valid session doesn't flash
 * through the login page while that check is in flight.
 */
export function RequireAuth() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const bootstrapping = useAuthStore((s) => s.bootstrapping);
  const location = useLocation();

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <AppLoader />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
