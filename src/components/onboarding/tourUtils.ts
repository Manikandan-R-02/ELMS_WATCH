/**
 * Resolves a tour target, treating a `display:none` element (e.g. a header
 * control collapsed by a responsive `hidden sm:flex` class) as absent.
 * Returning `undefined` here is what makes driver.js's own
 * `skipMissingElement` skip the step instead of spotlighting an invisible
 * element — see the `requireVisible` flag on `TourStep`.
 *
 * When several elements carry the same `data-tour` value — the usual
 * `sm:hidden` rounded button + `hidden sm:flex` slide button pair, where
 * only one is ever displayed — the first one that is actually visible wins,
 * so a hidden twin earlier in the DOM no longer hides the step.
 *
 * Deliberately does NOT catch a translated-off-screen-but-laid-out element
 * (e.g. the mobile sidebar drawer, which uses `transform`, not `display`) —
 * `getClientRects()` still reports rects for that case. Handle that kind of
 * "present but needs to be opened first" target via a step's `onEnter`/
 * `onExit` instead (see the `sidebar` step in tourSteps.ts).
 */
export function resolveVisibleTarget(selector: string): Element | undefined {
  return Array.from(document.querySelectorAll(selector)).find((el) => el.getClientRects().length > 0);
}

/**
 * For a step's lazily-resolved target: a function driver.js calls when the step is about to show. It returns the
 * visible element, or nothing when there is none — driver.js then treats the step's target as missing and skips
 * it. driver.js types the callback as always returning an `Element`, hence the assertion.
 */
export function visibleTargetGetter(selector: string): () => Element {
  const resolve = () => resolveVisibleTarget(selector);
  return resolve as unknown as () => Element;
}
