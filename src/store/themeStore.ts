import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyAccentColor } from "../theme/accentColors";

export type ThemeMode = "light" | "dark" | "system";
export type Direction = "ltr" | "rtl";

interface ThemeState {
  /** "system" tracks the OS preference until the user explicitly picks light/dark. */
  mode: ThemeMode;
  /** The mode actually painted right now (system resolved to light/dark). */
  resolvedMode: "light" | "dark";
  accent: string;
  direction: Direction;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  setAccent: (accent: string) => void;
  setDirection: (direction: Direction) => void;
  /** Call once on app boot to paint the DOM from the persisted/system preference. */
  hydrate: () => void;
}

function systemPrefersDark() {
  return globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Turns the stored "system" preference into a concrete light/dark value. */
function resolveMode(mode: "light" | "dark" | "system") {
  if (mode !== "system") return mode;
  return systemPrefersDark() ? "dark" : "light";
}

function paintMode(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

function paintDirection(direction: Direction) {
  document.documentElement.setAttribute("dir", direction);
}

let systemListenerAttached = false;

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "system",
      resolvedMode: "light",
      accent: "blue",
      direction: "ltr",

      setMode: (mode) => {
        const resolvedMode = resolveMode(mode);
        paintMode(resolvedMode);
        set({ mode, resolvedMode });
      },

      toggle: () => {
        const next = get().resolvedMode === "dark" ? "light" : "dark";
        paintMode(next);
        set({ mode: next, resolvedMode: next });
      },

      setAccent: (accent) => {
        applyAccentColor(accent);
        set({ accent });
      },

      setDirection: (direction) => {
        paintDirection(direction);
        set({ direction });
      },

      hydrate: () => {
        const { mode, accent, direction } = get();
        const resolvedMode = resolveMode(mode);
        paintMode(resolvedMode);
        paintDirection(direction);
        applyAccentColor(accent);
        set({ resolvedMode });

        if (!systemListenerAttached) {
          systemListenerAttached = true;
          globalThis.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
            if (useThemeStore.getState().mode === "system") {
              const resolved = e.matches ? "dark" : "light";
              paintMode(resolved);
              useThemeStore.setState({ resolvedMode: resolved });
            }
          });
        }
      },
    }),
    { name: "template-theme" }
  )
);