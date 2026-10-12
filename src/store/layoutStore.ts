import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SidebarOrientation = "vertical" | "horizontal";
export type ContainerWidth = "boxed" | "full";
export type CardStyle = "border" | "shadow";

function paintRadius(px: number) {
  document.documentElement.style.setProperty("--app-radius", `${px}px`);
}

interface LayoutState {
  orientation: SidebarOrientation;
  setOrientation: (o: SidebarOrientation) => void;
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Off-canvas sidebar drawer shown below the `lg` breakpoint when orientation is "vertical". */
  mobileSidebarOpen: boolean;
  /** True for exactly one open, right after `openMobileSidebar(true)` — Sidebar.tsx reads this to
   * skip its slide-in transition for that one open, then this resets. See that flag's call site
   * (the onboarding tour's sidebar step) for why: a driver.js highlight measures the drawer's
   * position the instant it opens, and a 200ms CSS transition means that measurement lands on the
   * drawer's still-offscreen starting position instead of its settled one. */
  mobileSidebarInstant: boolean;
  openMobileSidebar: (instant?: boolean) => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
  container: ContainerWidth;
  setContainer: (c: ContainerWidth) => void;
  cardStyle: CardStyle;
  setCardStyle: (s: CardStyle) => void;
  radius: number;
  setRadius: (px: number) => void;
  hydrate: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      orientation: "vertical",
      setOrientation: (orientation) => set({ orientation }),
      sidebarCollapsed: false,
      toggleSidebarCollapsed: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      drawerOpen: false,
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
      mobileSidebarOpen: false,
      mobileSidebarInstant: false,
      openMobileSidebar: (instant) => set({ mobileSidebarOpen: true, mobileSidebarInstant: !!instant }),
      closeMobileSidebar: () => set({ mobileSidebarOpen: false, mobileSidebarInstant: false }),
      toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen, mobileSidebarInstant: false })),
      container: "boxed",
      setContainer: (container) => set({ container }),
      cardStyle: "shadow",
      setCardStyle: (cardStyle) => set({ cardStyle }),
      radius: 16,
      setRadius: (radius) => {
        paintRadius(radius);
        set({ radius });
      },
      hydrate: () => paintRadius(get().radius),
    }),
    {
      name: "template-layout",
      // Transient open/close UI state shouldn't survive a reload — only the
      // user's actual layout preferences do.
      partialize: (state) => ({
        orientation: state.orientation,
        sidebarCollapsed: state.sidebarCollapsed,
        container: state.container,
        cardStyle: state.cardStyle,
        radius: state.radius,
      }),
    }
  )
);
