import { useRef } from "react";
import { createPortal } from "react-dom";
import {
  AlignLeft,
  AlignRight,
  Copy,
  Layers,
  LayoutPanelLeft,
  Maximize,
  Minimize,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Rows,
  Square,
  Sun,
  X,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { useLayoutStore } from "../../store/layoutStore";
import { useThemeStore } from "../../store/themeStore";
import { ACCENT_COLORS, getAccentColor } from "../../theme/accentColors";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { Slider } from "../fields/Slider";
import { showSuccessToast, showErrorToast } from "../../store/toastStore";

/**
 * Right-side app drawer where the user can tune the whole app's appearance:
 * theme mode, direction, accent color, layout type, container width,
 * sidebar type, card style and corner radius.
 */
export function SettingsDrawer() {
  const drawerOpen = useLayoutStore((s) => s.drawerOpen);
  const closeDrawer = useLayoutStore((s) => s.closeDrawer);
  const orientation = useLayoutStore((s) => s.orientation);
  const setOrientation = useLayoutStore((s) => s.setOrientation);
  const container = useLayoutStore((s) => s.container);
  const setContainer = useLayoutStore((s) => s.setContainer);
  const sidebarCollapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useLayoutStore((s) => s.setSidebarCollapsed);
  const cardStyle = useLayoutStore((s) => s.cardStyle);
  const setCardStyle = useLayoutStore((s) => s.setCardStyle);
  const radius = useLayoutStore((s) => s.radius);
  const setRadius = useLayoutStore((s) => s.setRadius);

  const mode = useThemeStore((s) => s.mode);
  const resolvedMode = useThemeStore((s) => s.resolvedMode);
  const setMode = useThemeStore((s) => s.setMode);
  const accent = useThemeStore((s) => s.accent);
  const setAccent = useThemeStore((s) => s.setAccent);
  const direction = useThemeStore((s) => s.direction);
  const setDirection = useThemeStore((s) => s.setDirection);

  // Same keyboard containment as Modal (focus in, Tab stays inside, Escape closes, focus returns to
  // the gear button) — this drawer covers the page behind a backdrop exactly like a dialog does.
  const panelRef = useRef<HTMLDialogElement>(null);
  useFocusTrap(drawerOpen, panelRef, { onEscape: closeDrawer });

  if (!drawerOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex justify-end">
      {/* Native button for the backdrop click; tabIndex -1 keeps it out of the tab order (Escape closes the drawer). */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close settings"
        className="absolute inset-0 animate-fade-in bg-slate-900/40 backdrop-blur-sm"
        onClick={closeDrawer}
      />
      <dialog
        ref={panelRef}
        open
        aria-modal="true"
        aria-labelledby="settings-drawer-title"
        tabIndex={-1}
        className="relative flex h-full w-full max-w-sm animate-slide-in-right flex-col bg-white text-inherit shadow-elevated outline-none dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 id="settings-drawer-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">Theme Settings</h2>
          <button
            onClick={closeDrawer}
            aria-label="Close"
            className="rounded-full border border-slate-200 p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6">
          <Section title="Theme Mode">
            <ToggleRow>
              <ToggleOption active={resolvedMode === "light"} onClick={() => setMode("light")} icon={<Sun className="h-4 w-4" />} label="Light" />
              <ToggleOption active={resolvedMode === "dark"} onClick={() => setMode("dark")} icon={<Moon className="h-4 w-4" />} label="Dark" />
            </ToggleRow>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              {mode === "system" ? "Following your system preference." : "Manually overridden — pick a mode above."}
            </p>
          </Section>

          <Section title="Direction">
            <ToggleRow>
              <ToggleOption active={direction === "ltr"} onClick={() => setDirection("ltr")} icon={<AlignLeft className="h-4 w-4" />} label="LTR" />
              <ToggleOption active={direction === "rtl"} onClick={() => setDirection("rtl")} icon={<AlignRight className="h-4 w-4" />} label="RTL" />
            </ToggleRow>
          </Section>

          <Section title="Theme Colors">
            <AccentColorPicker accent={accent} setAccent={setAccent} />
          </Section>

          <Section title="Layout Type">
            <ToggleRow>
              <ToggleOption active={orientation === "vertical"} onClick={() => setOrientation("vertical")} icon={<LayoutPanelLeft className="h-4 w-4" />} label="Vertical" />
              <ToggleOption active={orientation === "horizontal"} onClick={() => setOrientation("horizontal")} icon={<Rows className="h-4 w-4" />} label="Horizontal" />
            </ToggleRow>
          </Section>

          <Section title="Container">
            <ToggleRow>
              <ToggleOption active={container === "boxed"} onClick={() => setContainer("boxed")} icon={<Minimize className="h-4 w-4" />} label="Boxed" />
              <ToggleOption active={container === "full"} onClick={() => setContainer("full")} icon={<Maximize className="h-4 w-4" />} label="Full" />
            </ToggleRow>
          </Section>

          <Section title="Sidebar Type">
            <ToggleRow>
              <ToggleOption active={!sidebarCollapsed} onClick={() => setSidebarCollapsed(false)} icon={<PanelLeft className="h-4 w-4" />} label="Full" />
              <ToggleOption active={sidebarCollapsed} onClick={() => setSidebarCollapsed(true)} icon={<PanelLeftClose className="h-4 w-4" />} label="Collapse" />
            </ToggleRow>
          </Section>

          <Section title="Card Style">
            <ToggleRow>
              <ToggleOption active={cardStyle === "border"} onClick={() => setCardStyle("border")} icon={<Square className="h-4 w-4" />} label="Border" />
              <ToggleOption active={cardStyle === "shadow"} onClick={() => setCardStyle("shadow")} icon={<Layers className="h-4 w-4" />} label="Shadow" />
            </ToggleRow>
          </Section>

          <Section title="Border Radius">
            <input
              type="range"
              min={0}
              max={24}
              step={2}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600 dark:bg-slate-700"
            />
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Current value: {radius}px</p>
          </Section>
        </div>
      </dialog>
    </div>,
    document.body
  );
}

function Section({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      {children}
    </section>
  );
}

// `ACCENT_COLORS` is already ordered as a continuous hue sweep (blue → indigo → … → sky), so its
// 500-shade stops make a genuine rainbow gradient, not an arbitrary one — reused as-is below.
const ACCENT_GRADIENT = `linear-gradient(to right, ${ACCENT_COLORS.map((c) => c.shades[500]).join(", ")})`;

/**
 * Replaces the old grid-of-round-swatches accent picker with a single rainbow-gradient slider +
 * HEX readout, matching the app's own `Slider` field instead of a one-off control (see rule 1 in
 * AGENTS.md). Still only resolves to one of `ACCENT_COLORS`' named presets — not an arbitrary
 * hue — because every accent color needs a full light/dark-tuned 50–950 shade ramp (see
 * `accentColors.ts`) for the rest of the app's `brand-*` utilities to work, not just one hex
 * value; dragging the thumb snaps to the nearest preset's position along the gradient instead of
 * picking a truly continuous color.
 */
function AccentColorPicker({ accent, setAccent }: Readonly<{ accent: string; setAccent: (name: string) => void }>) {
  const index = Math.max(0, ACCENT_COLORS.findIndex((c) => c.name === accent));
  const current = getAccentColor(accent);

  // Some browsers (and permission-restricted embeds) throw `writeText` synchronously
  // instead of returning a rejected promise — `try`/`catch` around an `await` covers
  // both cases, unlike a bare `.then()/.catch()` chain which only covers the latter.
  async function copyHex() {
    try {
      await navigator.clipboard.writeText(current.shades[500]);
      showSuccessToast("Copied", `${current.shades[500]} copied to clipboard.`);
    } catch {
      showErrorToast("Couldn't copy", "Your browser blocked clipboard access.");
    }
  }

  return (
    <div>
      <Slider
        value={index}
        onChange={(i) => setAccent(ACCENT_COLORS[i].name)}
        min={0}
        max={ACCENT_COLORS.length - 1}
        step={1}
        showValue={false}
        trackBackground={ACCENT_GRADIENT}
        showFill={false}
      />
      <p className="-mt-1 mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">{current.label}</p>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
        <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: current.shades[500] }} />
        <span className="text-caption shrink-0">HEX</span>
        <span className="flex-1 truncate font-mono text-sm text-slate-700 dark:text-slate-200">{current.shades[500]}</span>
        <button
          type="button"
          onClick={copyHex}
          aria-label="Copy hex value"
          title="Copy hex value"
          className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function ToggleOption({
  active,
  onClick,
  icon,
  label,
}: Readonly<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}>) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-full border px-3 py-2.5 text-sm font-medium transition",
        active
          ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
          : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
