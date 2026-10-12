import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { Driver, DriveStep } from "driver.js";
import { headerTourSteps, navIntroStep } from "./tourSteps";
import { setScreenTour, waitForQuiet, waitForScreenTour } from "../../store/screenTourRegistry";
import { useVisibleNavItems } from "../sidebar/navItems";
import { resolveVisibleTarget, visibleTargetGetter } from "./tourUtils";
import type { TourStep } from "./onboarding.types";

/** Milliseconds to wait after a step's `before` ran, for the content it opens to mount. */
function settleDelay(step: TourStep): number {
  if (!step.before) return 0;
  if (step.settleMs !== undefined) return step.settleMs;
  return step.mountsOnDemand ? 250 : 0;
}

/** How long driver.js waits for a step's target to appear: a hidden (responsive) target will not show up, so it
 * barely waits; one that mounts on demand gets longer; any other uses the tour's default. */
function waitForElementMs(step: TourStep): number | undefined {
  if (step.requireVisible) return 50;
  return step.mountsOnDemand ? 3000 : undefined;
}

function nextButtonLabel(isFirst: boolean, isLast: boolean): string {
  if (isFirst) return "Start Tour";
  return isLast ? "Finish" : "Next";
}

/** The element a step points at: a lazily-resolved visible target, the raw selector, or none. */
function stepElement(step: TourStep): string | (() => Element) | undefined {
  const target = step.target;
  let element: string | (() => Element) | undefined = target;
  if (target && step.requireVisible) element = visibleTargetGetter(target);
  return element;
}
import { TourPointer, type TourPointerRect } from "./TourPointer";
import { useOnboardingStore } from "../../store/onboardingStore";
import { OnboardingContext } from "./onboardingContext";

/**
 * Mounted once in AppLayout (so it's available on every authenticated
 * route, after RequireAuth has already resolved — this never touches
 * auth/session state itself). Owns the driver.js instance and drives the
 * cross-route tour: a step in tourSteps.ts optionally names a `route`, and
 * when the next/previous step's route differs from the current one, this
 * provider navigates there via the app's existing react-router setup, then
 * lets driver.js's own `waitForElement` + `skipMissingElement` (which is
 * MutationObserver-based internally, not a setTimeout poll) wait for the
 * new page's target to mount — or skip that step gracefully if it never
 * appears (e.g. a conditionally-rendered element). No custom polling here.
 */
export function OnboardingProvider({ children }: Readonly<{ children: ReactNode }>) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isTourActive, setIsTourActive] = useState(false);
  const [pointerRect, setPointerRect] = useState<TourPointerRect | null>(null);
  const driverRef = useRef<Driver | null>(null);
  const locationRef = useRef(location.pathname);
  const completedThisRunRef = useRef(false);
  // Set by the app-wide tour just before it starts a run: called once when THAT run ends, with whether it ran
  // to its last step (as opposed to being skipped/closed). It is how "this screen's tour is over" becomes "next".
  const chainRef = useRef<((completed: boolean) => void) | null>(null);
  const autoStartAttemptedRef = useRef(false);

  locationRef.current = location.pathname;

  function updatePointer(el: Element | undefined) {
    if (!el) {
      setPointerRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setPointerRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }

  function buildSteps(steps: TourStep[]): DriveStep[] {
    // A tour whose steps prepare page state (`before` — open a modal, switch a tab) drives its own
    // Next/Back, so the step it lands on is the one whose `before` actually runs. The default
    // driver.js transition can't do that: it looks for the next target first, and a modal's
    // content doesn't exist yet.
    const preparesState = steps.some((s) => s.before);
    // A `requireVisible` step whose target is currently hidden (responsive breakpoint) is skipped
    // by driver.js; mirror that here so we never aim `before` at a step that won't be shown.
    const isHidden = (s: TourStep) => !!s.requireVisible && !!s.target && !resolveVisibleTarget(s.target);
    function neighbour(from: number, direction: 1 | -1): number {
      for (let j = from + direction; j >= 0 && j < steps.length; j += direction) {
        if (!isHidden(steps[j])) return j;
      }
      return -1;
    }
    function goTo(index: number, driver: Driver) {
      const target = steps[index];
      if (target.route && target.route !== locationRef.current) navigate(target.route);
      target.before?.();
      const settle = settleDelay(target);
      if (settle > 0) setTimeout(() => driver.isActive() && driver.moveTo(index), settle);
      else driver.moveTo(index);
    }

    return steps.map((step, index) => {
      const nextStep = steps[index + 1];
      const prevStep = steps[index - 1];
      const nextRoute = nextStep?.route;
      const prevRoute = prevStep?.route;
      const isFirst = index === 0;
      const isLast = index === steps.length - 1;

      return {
        element: stepElement(step),
        // A target that only exists once `before` has opened something is not "missing": don't let
        // driver.js skip it, or end the tour early when only such steps remain ahead.
        skipMissingElement: step.mountsOnDemand ? false : undefined,
        // A `requireVisible` target's absence is a responsive-breakpoint fact (e.g. the header
        // search bar collapses below `sm`), not a mount-timing race — it won't resolve no matter
        // how long we wait, so give it a near-instant timeout instead of the global 4s. Without
        // this, tapping "Next" out of a step ahead of two consecutive hidden targets (as happens
        // on a phone width, where both the search and period-picker steps are hidden) made the
        // tour appear frozen for up to 8 seconds before it gave up and skipped both.
        waitForElement: waitForElementMs(step),
        onHighlightStarted: () => step.onEnter?.(),
        onDeselected: () => step.onExit?.(),
        popover: {
          title: step.title,
          description: step.description,
          side: step.side,
          align: step.align,
          showButtons: isFirst ? ["next", "close"] : ["next", "previous", "close"],
          nextBtnText: step.nextLabel ?? nextButtonLabel(isFirst, isLast),
          prevBtnText: "Back",
          // Route-aware transitions: only override next/prev when the adjacent
          // step actually lives on a different route than where we are right
          // now — every other step falls through to driver.js's own default
          // (moveNext/movePrevious), which is a same-page highlight swap.
          // A tour that prepares page state (`before`) overrides every transition instead.
          ...(preparesState
            ? {
                onNextClick: (_el: Element | undefined, _s: DriveStep, opts: { driver: Driver }) => {
                  const j = neighbour(index, 1);
                  if (j < 0) opts.driver.moveNext();
                  else goTo(j, opts.driver);
                },
                onPrevClick: (_el: Element | undefined, _s: DriveStep, opts: { driver: Driver }) => {
                  const j = neighbour(index, -1);
                  if (j < 0) opts.driver.movePrevious();
                  else goTo(j, opts.driver);
                },
              }
            : {
                ...(nextRoute && nextRoute !== locationRef.current
                  ? {
                      onNextClick: (_el: Element | undefined, _s: DriveStep, opts: { driver: Driver }) => {
                        navigate(nextRoute);
                        opts.driver.moveNext();
                      },
                    }
                  : {}),
                ...(prevRoute && prevRoute !== locationRef.current
                  ? {
                      onPrevClick: (_el: Element | undefined, _s: DriveStep, opts: { driver: Driver }) => {
                        navigate(prevRoute);
                        opts.driver.movePrevious();
                      },
                    }
                  : {}),
              }),
        },
      } satisfies DriveStep;
    });
  }

  // Shared by both the cross-route first-run tour (`startTour`) and a single-page,
  // on-demand screen tour (`startScreenTour`) — the only real difference between
  // them is whether starting/finishing touches `onboardingStore` and whether we
  // force-navigate to a known starting route first.
  const runTour = useCallback(async (steps: TourStep[], trackCompletion: boolean, onEnd?: () => void) => {
    if (driverRef.current?.isActive()) return;
    completedThisRunRef.current = false;

    // Loaded on demand rather than imported at the top of this module — this
    // provider is mounted in AppLayout (every authenticated page), but most
    // page loads never actually start a tour, so there's no reason to ship
    // driver.js + its CSS in that page's initial bundle.
    const [{ driver }] = await Promise.all([import("driver.js"), import("driver.js/dist/driver.css")]);

    // Runs the caller's cleanup exactly once, from whichever exit path fires first. driver.js's own
    // `onDestroyed` isn't reliable enough to be the only one: it is skipped when the tour ends
    // before the first animation frame has marked a step active (e.g. in a background tab).
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      setIsTourActive(false);
      setPointerRect(null);
      driverRef.current = null;
      // Hand the page back as the tour found it (close modals the tour opened, etc.).
      onEnd?.();
      // The app-wide tour's "what comes next" (see `playMainTour`).
      const chain = chainRef.current;
      chainRef.current = null;
      chain?.(completedThisRunRef.current);
    };
    // The user backed out before finishing: Escape, the X, an overlay click, or the Skip button.
    const abandon = (tour: Driver) => {
      if (!completedThisRunRef.current && trackCompletion) {
        useOnboardingStore.getState().markSkipped();
      }
      end();
      tour.destroy();
    };

    const d = driver({
      allowClose: true,
      overlayOpacity: 0.6,
      stagePadding: 6,
      stageRadius: 10,
      // driver.js's stage-morph animation between steps is requestAnimationFrame-driven
      // and only swaps in the new popover once that RAF loop reaches its halfway point
      // (see driver.js's internal transition logic) — on a throttled/backgrounded tab
      // that can stall indefinitely, leaving the popover permanently hidden mid-transition
      // (observed while testing). With animate off, driver.js shows the new popover
      // synchronously instead, at the cost of the animated spotlight-resize between steps.
      animate: false,
      smoothScroll: true,
      popoverClass: "app-tour-popover",
      showProgress: steps.length > 1,
      progressText: "{{current}} of {{total}}",
      skipMissingElement: true,
      waitForElement: 4000,
      steps: buildSteps(steps),
      // Escape/overlay-click/the "x" button already exit the tour (`allowClose`,
      // keyboard control is on by default) — this adds an explicit, clearly
      // labeled "Skip" button next to Back/Next on every non-final step, so
      // touch users (no Escape key) and anyone who'd miss the small "x" have
      // an obvious way out on every kind of device.
      onPopoverRender: (popover, opts) => {
        if (opts.driver.isLastStep()) return;
        const skipBtn = document.createElement("button");
        skipBtn.type = "button";
        skipBtn.textContent = "Skip";
        skipBtn.className = "driver-popover-footer-btn app-tour-skip-btn";
        skipBtn.addEventListener("click", () => abandon(opts.driver));
        popover.footerButtons.insertBefore(skipBtn, popover.footerButtons.firstChild);
      },
      onHighlighted: (el) => updatePointer(el),
      onDeselected: () => setPointerRect(null),
      onDoneClick: (_el, _step, opts) => {
        completedThisRunRef.current = true;
        if (trackCompletion) useOnboardingStore.getState().markCompleted();
        end();
        opts.driver.destroy();
      },
      // Fires for user-initiated close (Escape, the X button, overlay click) — NOT for our own
      // `opts.driver.destroy()` calls, so this is where "the user backed out before finishing"
      // is detected. The Skip button reaches the same `abandon` directly.
      onDestroyStarted: (_el, _step, opts) => abandon(opts.driver),
      onDestroyed: () => end(),
    });

    driverRef.current = d;
    setIsTourActive(true);
    // The first step may need a modal/tab open too — same hook every later step gets on Next/Back.
    steps[0]?.before?.();
    d.drive(0);
    // Deliberately empty — every value this reads (`driverRef`, `locationRef`,
    // `completedThisRunRef`, `navigate`) is either a ref or react-router's
    // stable `navigate` function, so this never needs to change identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navItems = useVisibleNavItems();

  // The app-wide tour: for each screen in the menu, in the menu's order — point at its menu item, open the screen,
  // run that screen's own tour — then the header's global controls. Skipping or closing at any point stops the
  // whole thing (and, for the tracked first-run tour, counts as skipped so it isn't offered again).
  const playMainTour = useCallback(
    (items: { label: string; path: string }[], track: boolean) => {
      const abort = () => {
        if (track) useOnboardingStore.getState().markSkipped();
      };
      const playHeader = () => {
        chainRef.current = null;
        void runTour(headerTourSteps(), track);
      };
      const openScreenAndTour = async (index: number) => {
        const { path } = items[index];
        // A screen already on display keeps its registration; otherwise wait for the new screen's.
        if (locationRef.current !== path) {
          setScreenTour(null);
          navigate(path);
        }
        const start = await waitForScreenTour(() => locationRef.current === path);
        if (!start) {
          playScreen(index + 1); // a screen without a tour (a placeholder): nothing to walk through
          return;
        }
        await waitForQuiet();
        chainRef.current = (completed) => (completed ? playScreen(index + 1) : abort());
        start();
      };
      const playScreen = (index: number) => {
        if (index >= items.length) {
          playHeader();
          return;
        }
        chainRef.current = (completed) => (completed ? void openScreenAndTour(index) : abort());
        void runTour([navIntroStep(items[index], index, items.length)], false);
      };
      playScreen(0);
    },
    [runTour, navigate]
  );

  const startTour = useCallback(() => playMainTour(navItems, true), [playMainTour, navItems]);
  const startScreenTour = useCallback((steps: TourStep[], onEnd?: () => void) => runTour(steps, false, onEnd), [runTour]);

  // Keep the pointer glued to its target across resize/scroll — driver.js
  // repositions its own stage/popover on these already; this just mirrors
  // that for our extra pointer element, which isn't part of driver.js itself.
  useEffect(() => {
    if (!isTourActive) return;
    function reposition() {
      updatePointer(driverRef.current?.getActiveElement());
    }
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTourActive]);

  // Auto-start exactly once for a genuinely new user, after auth/layout have
  // already settled (this effect only runs once AppLayout — which sits
  // behind RequireAuth — has mounted). Never re-triggers for a returning
  // user, whether they finished the tour or skipped it.
  useEffect(() => {
    if (autoStartAttemptedRef.current) return;
    autoStartAttemptedRef.current = true;
    const { hasCompletedTour, hasSkippedTour } = useOnboardingStore.getState();
    if (hasCompletedTour || hasSkippedTour) return;
    startTour();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tear down the driver.js instance if this provider ever unmounts mid-tour
  // (e.g. logout navigates away from AppLayout) instead of leaking listeners.
  useEffect(() => {
    return () => driverRef.current?.destroy();
  }, []);

  const value = useMemo(
    () => ({ startTour, startScreenTour, isTourActive }),
    [startTour, startScreenTour, isTourActive]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <TourPointer rect={pointerRect} />
    </OnboardingContext.Provider>
  );
}
