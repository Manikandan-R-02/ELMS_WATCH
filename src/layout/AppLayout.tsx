import { cancelScreenRequests } from "../api/axiosClient";
import { Suspense, useEffect, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "../components/header/Header";
import { Sidebar } from "../components/sidebar/Sidebar";
import { SettingsDrawer } from "../components/sidebar/SettingsDrawer";
import { GlobalLoader } from "../components/loader/GlobalLoader";
import { AppLoader } from "../components/loader/AppLoader";
import { ToastContainer } from "../components/toast/ToastContainer";
import { CommandPalette } from "../components/common/CommandPalette";
import { SessionExpiredHandler } from "../components/common/SessionExpiredHandler";
import { Breadcrumbs } from "../components/common/Breadcrumbs";
import { OnboardingProvider } from "../components/onboarding/OnboardingProvider";
import { useLayoutStore } from "../store/layoutStore";
import { useThemeStore } from "../store/themeStore";
import { useLoaderStore } from "../store/loaderStore";
import { cn } from "../lib/cn";

/** Each business screen is its own lazy chunk (see router.tsx) — this `<Suspense>` is scoped to
 * just the outlet content instead of sitting above `AppLayout` itself, so a screen's chunk still
 * loading (or a slow/hung request behind `GlobalLoader`) never unmounts the header/sidebar/top
 * nav out from under the reader. Landing on the wrong screen, or one that's slow to load, no
 * longer traps them — the chrome stays up and every nav link stays clickable the whole time. */
function OutletFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <AppLoader />
    </div>
  );
}

/** Briefly shows the global loader on every route change, so navigating between screens gets the same loading feedback as an API call. */
function useRouteChangeLoader() {
  const location = useLocation();
  const setManualLoading = useLoaderStore((s) => s.setManualLoading);

  // Leaving a screen cancels its unfinished requests (a heavy report the person no longer wants must not keep
  // the network busy and the loader spinning on the next screen). A layout effect, so it runs before the next
  // screen's own effects start their requests.
  useLayoutEffect(() => {
    cancelScreenRequests();
  }, [location.pathname]);

  useEffect(() => {
    setManualLoading(true);
    const timer = setTimeout(() => setManualLoading(false), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
}

export function AppLayout() {
  const orientation = useLayoutStore((s) => s.orientation);
  const container = useLayoutStore((s) => s.container);
  const direction = useThemeStore((s) => s.direction);
  const containerClass = container === "boxed" ? "max-w-7xl" : "max-w-none";
  useRouteChangeLoader();

  if (orientation === "horizontal") {
    return (
      <OnboardingProvider>
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
          <Header />
          <Sidebar />
          {/* `GlobalLoader` first, before `<main>` — its own zero-height sticky anchor (see
              GlobalLoader.tsx) needs to start out already positioned at the top of this column,
              not below a screen's worth of content. */}
          <div className="flex-1">
            <GlobalLoader />
            <main className={cn("mx-auto px-4 py-6 sm:px-6", containerClass)}>
              <Breadcrumbs />
              <Suspense fallback={<OutletFallback />}>
                <Outlet />
              </Suspense>
            </main>
          </div>
          <SettingsDrawer />
          <ToastContainer />
          <CommandPalette />
          <SessionExpiredHandler />
        </div>
      </OnboardingProvider>
    );
  }

  return (
    <OnboardingProvider>
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
        <Header />
        <div className={cn("flex flex-1", direction === "rtl" && "flex-row-reverse")}>
          <Sidebar />
          {/* `GlobalLoader` first, before `<main>` — its own zero-height sticky anchor (see
              GlobalLoader.tsx) needs to start out already positioned at the top of this column,
              not below a screen's worth of content. */}
          <div className="flex min-w-0 flex-1 flex-col">
            <GlobalLoader />
            <main className={cn("mx-auto w-full flex-1 px-4 py-6 sm:px-6", containerClass)}>
              <Breadcrumbs />
              <Suspense fallback={<OutletFallback />}>
                <Outlet />
              </Suspense>
            </main>
          </div>
        </div>
        <SettingsDrawer />
        <ToastContainer />
        <CommandPalette />
        <SessionExpiredHandler />
      </div>
    </OnboardingProvider>
  );
}
