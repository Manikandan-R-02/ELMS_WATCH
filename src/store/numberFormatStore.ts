import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * App-wide number formatting — every amount/quantity on every screen should
 * render through `formatAmount`/`formatQty`/`formatInteger` below instead of
 * calling `toLocaleString`/`toFixed` directly, so the separator style and
 * decimal precision stay controlled from one place: the General Settings
 * screen (src/pages/screens/GeneralSettingsPage.tsx). Mirrors the old ElmsWatch app's
 * src/utils/numFormatter.js — same settings shape, same localStorage-only
 * persistence (no backend endpoint exists for this yet; see that screen's
 * header comment for the plan to wire one in later).
 */

export type NumberFormatLocale = "en-IN" | "en-US";

export interface NumberFormatSettings {
  locale: NumberFormatLocale;
  amountDecimals: number;
  qtyDecimals: number;
}

export const DEFAULT_NUMBER_FORMAT_SETTINGS: NumberFormatSettings = {
  locale: "en-IN",
  amountDecimals: 2,
  qtyDecimals: 2,
};

export const NUMBER_FORMAT_LOCALES: { value: NumberFormatLocale; label: string }[] = [
  { value: "en-IN", label: "Indian (1,23,45,678.90)" },
  { value: "en-US", label: "International (1,234,5678.90)" },
];

export const DECIMAL_PLACE_OPTIONS = [0, 1, 2, 3, 4];

interface NumberFormatState extends NumberFormatSettings {
  setSettings: (patch: Partial<NumberFormatSettings>) => void;
  reset: () => void;
}

export const useNumberFormatStore = create<NumberFormatState>()(
  persist(
    (set) => ({
      ...DEFAULT_NUMBER_FORMAT_SETTINGS,
      setSettings: (patch) => set(patch),
      reset: () => set(DEFAULT_NUMBER_FORMAT_SETTINGS),
    }),
    { name: "elmswatch-number-format" }
  )
);

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "string" ? Number.parseFloat(value.replaceAll(",", "")) : value;
  return Number.isNaN(n) ? 0 : n;
}

function formatWithDecimals(value: number | string, decimals: number): string {
  const { locale } = useNumberFormatStore.getState();
  return toNumber(value).toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats a monetary amount using the app-wide amount-decimal + separator
 * setting. Reads the store imperatively (`getState()`), so it works from any
 * non-reactive context (a table column formatter, a chart tooltip) — for a
 * value that should repaint live when the setting changes, prefer
 * `useNumberFormatStore()` directly in the component instead.
 */
export function formatAmount(value: number | string): string {
  const { amountDecimals } = useNumberFormatStore.getState();
  return formatWithDecimals(value, amountDecimals);
}

/** Formats a quantity using the app-wide qty-decimal + separator setting. */
export function formatQty(value: number | string): string {
  const { qtyDecimals } = useNumberFormatStore.getState();
  return formatWithDecimals(value, qtyDecimals);
}

/** Formats a plain count/whole number (e.g. item counts) with the app-wide separator, no decimals. */
export function formatInteger(value: number | string): string {
  return formatWithDecimals(value, 0);
}
