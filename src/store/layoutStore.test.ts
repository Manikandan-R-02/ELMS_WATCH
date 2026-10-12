import { beforeEach, describe, expect, it } from "vitest";
import { useLayoutStore } from "./layoutStore";

describe("layoutStore", () => {
  beforeEach(() => {
    useLayoutStore.setState({
      orientation: "vertical",
      sidebarCollapsed: false,
      drawerOpen: false,
      mobileSidebarOpen: false,
      mobileSidebarInstant: false,
      container: "boxed",
      cardStyle: "shadow",
      radius: 16,
    });
  });

  it("sets the layout preferences", () => {
    const s = useLayoutStore.getState();
    s.setOrientation("horizontal");
    s.setContainer("full");
    s.setCardStyle("border");
    s.setSidebarCollapsed(true);
    expect(useLayoutStore.getState()).toMatchObject({ orientation: "horizontal", container: "full", cardStyle: "border", sidebarCollapsed: true });
    s.toggleSidebarCollapsed();
    expect(useLayoutStore.getState().sidebarCollapsed).toBe(false);
  });

  it("opens and closes the drawer", () => {
    useLayoutStore.getState().openDrawer();
    expect(useLayoutStore.getState().drawerOpen).toBe(true);
    useLayoutStore.getState().closeDrawer();
    expect(useLayoutStore.getState().drawerOpen).toBe(false);
  });

  it("opens the mobile sidebar, optionally instantly, and resets the flag on close or toggle", () => {
    const s = useLayoutStore.getState();
    s.openMobileSidebar(true);
    expect(useLayoutStore.getState()).toMatchObject({ mobileSidebarOpen: true, mobileSidebarInstant: true });
    s.closeMobileSidebar();
    expect(useLayoutStore.getState()).toMatchObject({ mobileSidebarOpen: false, mobileSidebarInstant: false });
    s.openMobileSidebar();
    expect(useLayoutStore.getState().mobileSidebarInstant).toBe(false);
    s.toggleMobileSidebar();
    expect(useLayoutStore.getState().mobileSidebarOpen).toBe(false);
  });

  it("paints the corner radius onto the document", () => {
    useLayoutStore.getState().setRadius(8);
    expect(useLayoutStore.getState().radius).toBe(8);
    expect(document.documentElement.style.getPropertyValue("--app-radius")).toBe("8px");
    useLayoutStore.setState({ radius: 12 });
    useLayoutStore.getState().hydrate();
    expect(document.documentElement.style.getPropertyValue("--app-radius")).toBe("12px");
  });
});
