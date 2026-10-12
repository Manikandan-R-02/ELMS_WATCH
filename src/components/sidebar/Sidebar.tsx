import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronsLeft, LogOut, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { lockScroll, unlockScroll } from "../../lib/scrollLock";
import { useLayoutStore } from "../../store/layoutStore";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { ConfirmModal } from "../modals/StatusModals";
import { IconButton } from "../buttons/IconButton";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { navItemFor, revealNavItem } from "../../lib/revealNavItem";
import { useVisibleNavItems } from "./navItems";

/** Tailwind's `lg` breakpoint — at and above it the sidebar is a permanent, always-visible column;
 * below it, an off-canvas drawer. */
const DESKTOP_QUERY = "(min-width: 64rem)";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => globalThis.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const mql = globalThis.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(mql.matches);
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

interface TooltipState {
  label: string;
  top: number;
  left: number;
}

/** Where the off-canvas drawer sits: in view when open, otherwise pushed off its own edge (the right edge in RTL). */
function drawerTransform(open: boolean, rtl: boolean): string {
  if (open) return "translateX(0)";
  return rtl ? "translateX(100%)" : "translateX(-100%)";
}

export function Sidebar() {
  const orientation = useLayoutStore((s) => s.orientation);
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const toggleCollapsed = useLayoutStore((s) => s.toggleSidebarCollapsed);
  const mobileOpen = useLayoutStore((s) => s.mobileSidebarOpen);
  const mobileInstant = useLayoutStore((s) => s.mobileSidebarInstant);
  const closeMobile = useLayoutStore((s) => s.closeMobileSidebar);
  const direction = useThemeStore((s) => s.direction);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const navItems = useVisibleNavItems();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Lock page scroll while the mobile drawer is open, same as Modal.
  useEffect(() => {
    if (orientation !== "vertical" || !mobileOpen) return;
    lockScroll();
    return () => unlockScroll();
  }, [orientation, mobileOpen]);

  // Below `lg` the drawer is a modal overlay: same keyboard containment as Modal (focus in, Tab
  // stays inside, Escape closes, focus back on the menu button).
  const isDesktop = useIsDesktop();
  const asideRef = useRef<HTMLElement>(null);
  const drawerActive = orientation === "vertical" && mobileOpen && !isDesktop;
  useFocusTrap(drawerActive, asideRef, { onEscape: closeMobile });

  function showTooltip(label: string) {
    return (e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>) => {
      if (!collapsed) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({ label, top: rect.top + rect.height / 2, left: rect.right });
    };
  }
  const hideTooltip = () => setTooltip(null);

  if (orientation === "horizontal") {
    return <HorizontalNav />;
  }

  const isRtl = direction === "rtl";

  function handleNavClick() {
    // On mobile the nav is an off-canvas drawer — tapping a destination should close it.
    closeMobile();
  }

  return (
    <>
      {/* Backdrop — mobile/tablet only, sits under the drawer and above page content. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}
      <aside
        ref={asideRef}
        tabIndex={-1}
        // While the mobile drawer is slid off-screen its links are still in the DOM — `inert` takes
        // them out of the Tab order, so a phone/tablet keyboard user doesn't tab through a menu
        // they can't see. Never applied at desktop width, where the sidebar is always visible.
        inert={!isDesktop && !mobileOpen}
        className={cn(
          "fixed inset-y-0 z-50 flex h-full w-72 max-w-[85vw] shrink-0 flex-col bg-white outline-none dark:bg-slate-900",
          // Skipped for one open at a time (see `mobileSidebarInstant`) — the onboarding tour opens
          // the drawer and immediately measures it, and a 200ms slide-in means that measurement
          // lands on the drawer's still-offscreen starting position instead of its settled one.
          mobileInstant ? "transition-none" : "transition-transform duration-200 ease-out",
          isRtl ? "right-0 border-l border-slate-200 dark:border-slate-800" : "left-0 border-r border-slate-200 dark:border-slate-800",
          "lg:sticky lg:top-16 lg:z-30 lg:h-[calc(100vh-4rem)] lg:max-w-none lg:!transform-none lg:transition-all",
          collapsed ? "lg:w-[72px]" : "lg:w-64"
        )}
        // Inline style (not a `translate-x-*` utility class) so opening/closing the
        // drawer always forces a style recompute — toggling the utility class
        // between renders was observed to sometimes leave the old CSS `translate`
        // value in place. `lg:!transform-none` above wins at desktop width, so
        // this never affects the sticky, always-visible desktop sidebar.
        style={{ transform: drawerTransform(mobileOpen, isRtl) }}
      >
        <div className="flex items-center justify-between px-3 pb-1 pt-3 lg:hidden">
          <span className="text-eyebrow px-1">Menu</span>
          <button
            onClick={closeMobile}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav data-tour="sidebar-nav" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              data-tour-nav={item.path}
              onClick={handleNavClick}
              onMouseEnter={showTooltip(item.label)}
              onMouseLeave={hideTooltip}
              onFocus={showTooltip(item.label)}
              onBlur={hideTooltip}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-gradient-to-r from-brand-800 to-brand-600 text-white shadow-soft dark:from-brand-600 dark:to-brand-400"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )
              }
            >
              <item.icon className="h-[1.125rem] w-[1.125rem] shrink-0" />
              <span className={cn("truncate", collapsed && "lg:hidden")}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 border-t border-slate-100 p-3 dark:border-slate-800">
          <button
            onClick={toggleCollapsed}
            onMouseEnter={showTooltip(collapsed ? "Expand" : "Collapse")}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip(collapsed ? "Expand" : "Collapse")}
            onBlur={hideTooltip}
            className={cn(
              "hidden w-full items-center gap-2 rounded-lg py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 lg:flex dark:hover:bg-slate-800 dark:hover:text-slate-300",
              collapsed ? "justify-center" : "px-3"
            )}
          >
            <ChevronsLeft className={cn("h-4 w-4 shrink-0 transition-transform", collapsed && "rotate-180")} />
            {!collapsed && "Collapse"}
          </button>
          <button
            onClick={() => setLogoutConfirmOpen(true)}
            onMouseEnter={showTooltip("Log out")}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip("Log out")}
            onBlur={hideTooltip}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-500/10",
              collapsed && "lg:justify-center lg:px-0"
            )}
          >
            <LogOut className="h-[1.125rem] w-[1.125rem] shrink-0" />
            <span className={cn(collapsed && "lg:hidden")}>Log out</span>
          </button>
        </div>

        {tooltip && <FloatingTooltip {...tooltip} />}
      </aside>

      <ConfirmModal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          closeMobile();
          logout();
          navigate("/login");
        }}
        title="Log out?"
        confirmLabel="Log out"
      >
        You'll need to sign in again to continue.
      </ConfirmModal>
    </>
  );
}

/**
 * Horizontal-orientation top nav. The item row can be wider than the viewport (21
 * screens), so it scrolls internally with its native scrollbar hidden — edge
 * chevrons (shown only when there's more to reveal in that direction) page the row
 * by roughly one viewport-width per click, and the row itself still supports
 * native touch swipe / trackpad scroll since it's a real scroll container.
 */
function HorizontalNav() {
  const navItems = useVisibleNavItems();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);
    window.addEventListener("resize", updateScrollState);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  // The current screen's tab is always shown whole — also when the screen was reached some other way (the
  // browser's Back button, the command palette, a link, the first load), not only by clicking the tab.
  useEffect(() => {
    const frame = requestAnimationFrame(() => revealNavItem(navItemFor(pathname)));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  function scrollByPage(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <nav
      data-tour="sidebar-nav"
      className="sticky top-16 z-30 flex items-center relative border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      {canScrollLeft && (
        <div className="absolute inset-y-0 left-0 z-10 flex items-center bg-gradient-to-r from-white from-60% to-transparent pr-6 pl-2 dark:from-slate-900">
          <IconButton
            icon={ChevronLeft}
            label="Scroll left"
            variant="outline"
            size="sm"
            onClick={() => scrollByPage(-1)}
          />
        </div>
      )}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className={cn(
          "no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto scroll-smooth px-4 py-2 transition-[padding]",
          canScrollLeft && "pl-12",
          canScrollRight && "pr-12"
        )}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            data-tour-nav={item.path}
            onClick={(e) => revealNavItem(e.currentTarget)}
            className={({ isActive }) =>
              cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                isActive
                  ? "bg-gradient-to-r from-brand-800 to-brand-600 text-white dark:from-brand-600 dark:to-brand-400"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )
            }
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </NavLink>
        ))}
      </div>
      {canScrollRight && (
        <div className="absolute inset-y-0 right-0 z-10 flex items-center bg-gradient-to-l from-white from-60% to-transparent pr-2 pl-6 dark:from-slate-900">
          <IconButton
            icon={ChevronRight}
            label="Scroll right"
            variant="outline"
            size="sm"
            onClick={() => scrollByPage(1)}
          />
        </div>
      )}
    </nav>
  );
}

/**
 * Rendered via portal and positioned with `fixed` (computed from the trigger's own
 * bounding rect) so it always floats outside the sidebar, regardless of any
 * `overflow` on an ancestor — an absolutely-positioned tooltip nested inside the
 * scrollable nav list would otherwise get clipped by that scroll container.
 */
function FloatingTooltip({ label, top, left }: TooltipState) {
  return createPortal(
    <span
      className="pointer-events-none fixed z-[60] -translate-y-1/2 whitespace-nowrap rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-elevated dark:bg-brand-500"
      style={{ top, left: left + 8 }}
    >
      {label}
    </span>,
    document.body
  );
}
