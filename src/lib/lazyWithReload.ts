import { lazy, type ComponentType } from "react";

/**
 * Wraps a `() => import(...)` with one auto-recovery: after a new deploy, a chunk URL
 * from a page still open in someone's browser can 404 ("Failed to fetch dynamically
 * imported module"), because that hash no longer exists on the server. Rather than
 * showing an error for what's really just a stale asset reference, reload the page
 * once — the fresh HTML points at the new chunk hashes and the navigation succeeds.
 * sessionStorage guards against a reload loop if the import keeps failing for a real
 * reason (network down, genuine 404); RouteErrorBoundary catches that case.
 *
 * Shared by router.tsx (route-level code splitting) and UIPreviewPage.tsx
 * (tab-level code splitting within the single /ui-preview route).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches React's own `lazy<T extends ComponentType<any>>` signature, so a component with specific props (e.g. ComingSoonPage's `title`/`icon`) is still assignable.
export function lazyWithReload<T extends { default: ComponentType<any> }>(importer: () => Promise<T>) {
  return lazy(async () => {
    try {
      return await importer();
    } catch (error) {
      const key = "chunk-reload-attempted";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        globalThis.location.reload();
        return new Promise<T>(() => {});
      }
      sessionStorage.removeItem(key);
      throw error;
    }
  });
}
