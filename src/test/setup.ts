// Runs once before every test file (see vitest.config.ts's `setupFiles`) — extends `expect` with
// jest-dom's DOM-specific matchers (`toBeInTheDocument`, `toHaveTextContent`, ...) for every test
// in the project, so individual test files don't need to import this themselves.
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// React Testing Library doesn't unmount a previous test's render automatically under Vitest (that
// auto-cleanup is a Jest-specific default) — without this, a second `render()` in the same file
// leaves the first one's DOM behind too, so queries like `getByText` start matching elements from
// both renders at once.
afterEach(cleanup);

// jsdom doesn't implement ResizeObserver — several components (Table.tsx's horizontal-scroll
// edge-chevron detection and its truncated-cell measurement) use a real one in the browser. A
// no-op stub is enough for tests: they only need the component to mount without throwing, not to
// actually react to layout changes jsdom can't produce anyway.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

// jsdom has no layout, so it doesn't implement `scrollIntoView` either — the dropdowns/pickers call
// it to keep the keyboard-highlighted option visible. A no-op is all a test needs.
Element.prototype.scrollIntoView ??= function scrollIntoView() {};
