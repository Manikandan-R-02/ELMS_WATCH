import type { Side, Alignment } from "driver.js";

/**
 * One step of a guided tour. Deliberately just data — no DOM/driver.js logic
 * lives here, so a new step (or a whole new page-specific tour array, e.g.
 * once a real Location Management or Reports page exists) can be added by
 * only editing `tourSteps.ts`, never `OnboardingProvider.tsx`.
 */
export interface TourStep {
  /** Stable id for debugging — never shown to the user. */
  id: string;
  /**
   * Route this step's target lives on. Omit for a step that's reachable from
   * any route (e.g. header/sidebar chrome, which is mounted by AppLayout on
   * every authenticated page) or for a route-agnostic step (Welcome/Finish).
   */
  route?: string;
  /** CSS selector matching a `data-tour="..."` attribute. Omit for a centered, targetless step. */
  target?: string;
  /**
   * Treat a `display:none` target (e.g. a `hidden sm:flex` header control
   * collapsed on a small screen) as absent, so the step is skipped instead
   * of spotlighting an invisible element. Don't set this for an
   * off-canvas-but-technically-visible element like the mobile sidebar
   * drawer — use `onEnter`/`onExit` for that instead (see the `sidebar` step).
   */
  requireVisible?: boolean;
  title: string;
  description: string;
  side?: Side;
  align?: Alignment;
  /** Text of the Next button, when the default ("Start Tour" / "Next" / "Finish") doesn't fit. */
  nextLabel?: string;
  /** Runs right before this step highlights — e.g. open the mobile sidebar drawer. */
  onEnter?: () => void;
  /** Runs when the user moves off this step — e.g. close the mobile sidebar drawer again. */
  onExit?: () => void;
  /**
   * Puts the page into the state this step's target needs — open a modal, switch a tab — and runs
   * BEFORE the engine looks for the target (unlike `onEnter`, which runs after the target was
   * already found, too late for something that doesn't exist yet). It runs on Next, Back and at
   * tour start, so it must set the *complete* state the step needs, not just toggle one thing:
   * every step on a page that has modals/tabs should say which are open, so going Back from a
   * modal step closes the modal again. Must be safe to call repeatedly.
   */
  before?: () => void;
  /**
   * The target doesn't exist until `before` has run (modal content, an inactive tab's panel).
   * Without this flag the engine treats a not-yet-mounted target as "missing" and skips the step,
   * and also ends the tour early when only such steps remain. Pair it with a closing targetless
   * step so there is always a step after the last on-demand one.
   */
  mountsOnDemand?: boolean;
  /** Milliseconds to wait after `before` before showing the step — lets a modal's 150ms open
   * animation finish so the spotlight isn't measured mid-scale. Defaults to 250 when
   * `mountsOnDemand` is set, otherwise 0. */
  settleMs?: number;
}
