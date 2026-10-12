import { create } from "zustand";
import type { ReactNode } from "react";

interface BreadcrumbActionsState {
  actions: ReactNode | null;
  setActions: (node: ReactNode | null) => void;
}

/**
 * Lets a page slot content (e.g. a search field) into the right side of the global breadcrumb
 * row (`Breadcrumbs.tsx`, mounted once in `AppLayout`) instead of its own toolbar — for controls
 * a screen wants pinned to that top-right corner on every viewport, not just desktop. Not
 * persisted: this is transient per-page UI, not a layout preference. A page sets it in a
 * `useEffect` on mount and clears it (`setActions(null)`) on unmount so it doesn't leak into
 * whatever screen is navigated to next.
 */
export const useBreadcrumbActionsStore = create<BreadcrumbActionsState>((set) => ({
  actions: null,
  setActions: (actions) => set({ actions }),
}));
