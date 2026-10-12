import { Suspense, type ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { AppLoader } from "./components/loader/AppLoader";
import { RouteErrorBoundary } from "./components/common/RouteErrorBoundary";
import { RequireAuth } from "./components/common/RequireAuth";
import { lazyWithReload } from "./lib/lazyWithReload";
import { ROUTES } from "./routes/paths";
import { APP_SCREENS } from "./routes/appScreens";

/**
 * Every route is code-split with React.lazy — each page only downloads when a user
 * actually navigates there, instead of bloating the initial bundle. See vite.config.ts
 * for the complementary vendor chunk splitting. Route *paths* live in ./routes/paths.ts;
 * this file only maps a path to its lazy-loaded page component.
 */

const LoginPage = lazyWithReload(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const UIPreviewPage = lazyWithReload(() => import("./pages/UIPreviewPage").then((m) => ({ default: m.UIPreviewPage })));
const RulesPage = lazyWithReload(() => import("./pages/RulesPage").then((m) => ({ default: m.RulesPage })));
const GeneralSettingsPage = lazyWithReload(() => import("./pages/screens/GeneralSettingsPage").then((m) => ({ default: m.GeneralSettingsPage })));
const LocationSummaryPage = lazyWithReload(() => import("./pages/screens/LocationSummaryPage").then((m) => ({ default: m.LocationSummaryPage })));
const OverallSummaryPage = lazyWithReload(() => import("./pages/screens/OverallSummaryPage").then((m) => ({ default: m.OverallSummaryPage })));
const LocationDetailsPage = lazyWithReload(() => import("./pages/screens/LocationDetailsPage").then((m) => ({ default: m.LocationDetailsPage })));
const LocationInsightPage = lazyWithReload(() => import("./pages/screens/LocationInsightPage").then((m) => ({ default: m.LocationInsightPage })));
const DailyPrjPage = lazyWithReload(() => import("./pages/screens/DailyPrjPage").then((m) => ({ default: m.DailyPrjPage })));
const ConsumptionAnalysisPage = lazyWithReload(() => import("./pages/screens/ConsumptionAnalysisPage").then((m) => ({ default: m.ConsumptionAnalysisPage })));
const StockOnHandPage = lazyWithReload(() => import("./pages/screens/StockOnHandPage").then((m) => ({ default: m.StockOnHandPage })));
const DataTrackerReportPage = lazyWithReload(() => import("./pages/screens/DataTrackerReportPage").then((m) => ({ default: m.DataTrackerReportPage })));
const TargetPrjPage = lazyWithReload(() => import("./pages/screens/TargetPRJ").then((m) => ({ default: m.TargetPrjPage })));
const ProductivityPage = lazyWithReload(() => import("./pages/screens/ProductivityPage").then((m) => ({ default: m.ProductivityPage })));
const ReportPage = lazyWithReload(() => import("./pages/screens/ReportPage").then((m) => ({ default: m.ReportPage })));
const UserMasterPage = lazyWithReload(() => import("./pages/screens/UserMasterPage").then((m) => ({ default: m.UserMasterPage })));
const LocationRightsPage = lazyWithReload(() => import("./pages/screens/LocationRightsPage").then((m) => ({ default: m.LocationRightsPage })));
const MonthClosingPage = lazyWithReload(() => import("./pages/screens/MonthClosingPage").then((m) => ({ default: m.MonthClosingPage })));
const WasteCostAnalysisPage = lazyWithReload(() => import("./pages/screens/WasteCostAnalysisPage").then((m) => ({ default: m.WasteCostAnalysisPage })));
const ItemBreakupPage = lazyWithReload(() => import("./pages/screens/ItemBreakupPage").then((m) => ({ default: m.ItemBreakupPage })));
const ItemAnalysisPage = lazyWithReload(() => import("./pages/screens/ItemAnalysisPage").then((m) => ({ default: m.ItemAnalysisPage })));
const CategoryAnalysisPage = lazyWithReload(() => import("./pages/screens/CategoryAnalysisPage").then((m) => ({ default: m.CategoryAnalysisPage })));
const UserLogPage = lazyWithReload(() => import("./pages/screens/UserLogPage").then((m) => ({ default: m.UserLogPage })));
const ComingSoonPage = lazyWithReload(() => import("./pages/screens/ComingSoonPage").then((m) => ({ default: m.ComingSoonPage })));
const NotFoundPage = lazyWithReload(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

/** Only ever shown for a route with no `AppLayout` around it yet (the login page's own lazy
 * chunk, or the very first paint before anything has mounted) — every route nested under
 * `AppLayout` suspends against `AppLayout`'s own inner `<Suspense>` instead (see AppLayout.tsx),
 * so switching screens never unmounts the header/sidebar/top-nav out from under the reader. */
function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <AppLoader />
    </div>
  );
}

/** Screens with a real, hand-built page — everything else in APP_SCREENS renders ComingSoonPage. */
const BUILT_SCREEN_ELEMENTS: Record<string, ReactElement> = {
  generalSettings: <GeneralSettingsPage />,
  locationSummary: <LocationSummaryPage />,
  overallSummary: <OverallSummaryPage />,
  locationDetails: <LocationDetailsPage />,
  locationInsight: <LocationInsightPage />,
  dailyPrj: <DailyPrjPage />,
  consumptionAnalysis: <ConsumptionAnalysisPage />,
  stockOnHand: <StockOnHandPage />,
  dataTrackerReport: <DataTrackerReportPage />,
  targetPrj: <TargetPrjPage />,
  productivity: <ProductivityPage />,
  report: <ReportPage />,
  userMaster: <UserMasterPage />,
  locationRights: <LocationRightsPage />,
  monthClosing: <MonthClosingPage />,
  userLog: <UserLogPage />,
  wasteCostAnalysis: <WasteCostAnalysisPage />,
  itemBreakup: <ItemBreakupPage />,
  itemAnalysis: <ItemAnalysisPage />,
  categoryAnalysis: <CategoryAnalysisPage />,
};

export function AppRouter() {
  return (
    <BrowserRouter>
      <RouteErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path={ROUTES.login} element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                {/* The template's "component library" landing page is retired for this
                    product — every authenticated route (and a post-login redirect from
                    LoginPage) lands on Overall Summary instead. See OnboardingProvider.tsx's
                    startTour(), which still navigates here as "a known page to start from" —
                    that now resolves to Overall Summary for free. */}
                <Route path={ROUTES.overview} element={<Navigate to={ROUTES.overallSummary} replace />} />
                <Route path={ROUTES.uiPreview} element={<UIPreviewPage />} />
                <Route path={ROUTES.rules} element={<RulesPage />} />
                {APP_SCREENS.map((screen) => (
                  <Route
                    key={screen.key}
                    path={screen.path}
                    element={BUILT_SCREEN_ELEMENTS[screen.key] ?? <ComingSoonPage title={screen.label} icon={screen.icon} description={screen.note} />}
                  />
                ))}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </BrowserRouter>
  );
}
