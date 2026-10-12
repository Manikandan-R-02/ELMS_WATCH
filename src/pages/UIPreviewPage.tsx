import { Suspense, useEffect, useState, type ComponentType } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs } from "../components/common/Tabs";
import { LocationLoader } from "../components/loader/LocationLoader";
import { lazyWithReload } from "../lib/lazyWithReload";
import { uiPreviewCategories } from "./uiPreviewCategories";

/**
 * Every component category lives under one route/nav entry ("UI Preview") instead of
 * nine separate pages — switching categories is a tab click, not a navigation. Each
 * tab's page is still lazy-loaded (via lazyWithReload, same as router.tsx) so only the
 * active category's chunk (and its dependencies, e.g. recharts for Charts) downloads.
 */

const FieldsPreviewPage = lazyWithReload(() => import("./FieldsPreviewPage").then((m) => ({ default: m.FieldsPreviewPage })));
const ButtonsPreviewPage = lazyWithReload(() => import("./ButtonsPreviewPage").then((m) => ({ default: m.ButtonsPreviewPage })));
const CardsPreviewPage = lazyWithReload(() => import("./CardsPreviewPage").then((m) => ({ default: m.CardsPreviewPage })));
const TablePreviewPage = lazyWithReload(() => import("./TablePreviewPage").then((m) => ({ default: m.TablePreviewPage })));
const DateTimePreviewPage = lazyWithReload(() => import("./DateTimePreviewPage").then((m) => ({ default: m.DateTimePreviewPage })));
const ModalsPreviewPage = lazyWithReload(() => import("./ModalsPreviewPage").then((m) => ({ default: m.ModalsPreviewPage })));
const BadgesPreviewPage = lazyWithReload(() => import("./BadgesPreviewPage").then((m) => ({ default: m.BadgesPreviewPage })));
const ChartsPreviewPage = lazyWithReload(() => import("./ChartsPreviewPage").then((m) => ({ default: m.ChartsPreviewPage })));
const LoaderPreviewPage = lazyWithReload(() => import("./LoaderPreviewPage").then((m) => ({ default: m.LoaderPreviewPage })));
const CommonPreviewPage = lazyWithReload(() => import("./CommonPreviewPage").then((m) => ({ default: m.CommonPreviewPage })));

const PANELS: Record<string, ComponentType> = {
  fields: FieldsPreviewPage,
  buttons: ButtonsPreviewPage,
  cards: CardsPreviewPage,
  table: TablePreviewPage,
  datetime: DateTimePreviewPage,
  modals: ModalsPreviewPage,
  badges: BadgesPreviewPage,
  charts: ChartsPreviewPage,
  loader: LoaderPreviewPage,
  common: CommonPreviewPage,
};

const DEFAULT_TAB = "fields";

export function UIPreviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const [active, setActive] = useState(requested && PANELS[requested] ? requested : DEFAULT_TAB);

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", active);
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const ActivePanel = PANELS[active];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title">UI Preview</h1>
        <p className="text-body mt-1">
          Every component category from the shared library, in one place — switch tabs instead of navigating pages.
        </p>
      </div>
      <div data-tour="ui-preview-tabs">
        <Tabs items={uiPreviewCategories} value={active} onChange={setActive} />
      </div>
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <LocationLoader />
          </div>
        }
      >
        <ActivePanel />
      </Suspense>
    </div>
  );
}
