import { useLoaderStore } from "../../store/loaderStore";
import { AppLoader } from "./AppLoader";

/**
 * Mount once inside `AppLayout`'s own content wrapper (the `relative` element that sits below
 * the header and beside the sidebar/top nav), as the FIRST child there — before `<main>`, not
 * after — so its own natural (pre-scroll) document position already sits right at the top of
 * that wrapper (see below for why the ordering matters). Reads the shared loader store, so any
 * axios call (via axiosClient), route change, or manual `setManualLoading(true)` call anywhere
 * in the app shows this overlay automatically.
 *
 * Positioning here takes two layers to get right:
 *  - The outer element is `sticky top-16 h-0` — zero-height, so it never adds real layout space
 *    (an ordinary `h-full`/`absolute inset-0` overlay here would otherwise stretch the whole
 *    column to match the *tallest* sibling, e.g. a sidebar nav list taller than the viewport,
 *    inflating the page). Being `sticky` (not `absolute`) means it tracks the viewport as the
 *    page scrolls instead of staying pinned to a fixed document coordinate — critical because an
 *    `absolute` overlay's document position doesn't move with scroll the way a `sticky` header
 *    does, so on a page taller than one screen it can drift out of alignment with the (sticky)
 *    header/sidebar and either uncover them or paint over them once scrolled far enough.
 *  - The inner element is `absolute inset-x-0 top-0 h-[calc(100vh-4rem)]` — anchored to the
 *    zero-height outer element's own (correctly viewport-tracked) position, sized to exactly one
 *    screen's worth of height below the header, and centers the pin inside that. This is what
 *    actually paints the dimmed backdrop and the pin, both always exactly matching the visible
 *    viewport region regardless of how tall the page is or where it's scrolled to.
 */
export function GlobalLoader() {
  const isLoading = useLoaderStore((s) => s.isLoading);

  if (!isLoading) return null;

  return (
    // z-[35]: above the page and the top menu strip (z-30) but BELOW the header (z-40) — so the header's
    // dropdowns (profile menu, period picker, settings) stay on top of the dimmed page while it loads.
    <div className="sticky top-16 z-[35] h-0">
      <div className="absolute inset-x-0 top-0 flex h-[calc(100vh-4rem)] items-center justify-center bg-white/80 dark:bg-slate-950/80">
        <AppLoader />
      </div>
    </div>
  );
}
