# Esfita Component Template

Reusable Vite + React + TypeScript + Tailwind CSS v4 + Zustand + Axios starter, shared across every Esfita product —
not tied to any single project. Run the app and browse every section from the sidebar — each page doubles as living
documentation for whichever team is building on it.

> **Using an AI coding assistant on this repo?** Read [AGENTS.md](AGENTS.md) first — it's the enforceable ruleset (accent theming, component reuse, prop conventions) that keeps AI-generated code consistent with the rest of the template **and consistent across every project built from it**.

## Starting a new project from this template

This repo is copied, not forked-per-feature — every new product starts from a fresh copy. Before building product
screens:

1. Swap `src/assets/esfita-logo-*.png` (and what `Logo.tsx` renders) for the new brand, if different from Esfita's.
2. Update `package.json`'s `name` and `index.html`'s `<title>`.
3. Replace the SCM-flavored example copy — the login page's hero text, the Overview page's hero headline/bullets —
   with copy for the actual product. These are content, not architecture; nothing else needs to change.
4. Pick a default accent color in `src/theme/accentColors.ts`/`themeStore` if the product has an established brand
   color other than blue.
5. Set `VITE_API_BASE_URL` in `.env` (see `.env.example`).

Everything else — every component, the theming system, the folder structure, the security and performance
defaults — is meant to stay identical across projects. See `AGENTS.md`'s "Using this template for a new project"
section for the full project-specific vs. universal breakdown, and keep that file (not just this README) updated
in each project's copy if a team deliberately adapts a convention.

## Stack

- **Vite + React + TypeScript**
- **Tailwind CSS v4** — runtime-editable accent scale (`src/index.css`), dark mode via the `dark` class (`@custom-variant dark`)
- **Zustand** — theme, layout, loader and toast stores, plus a `createResourceStore` factory for API-backed state
- **Axios** — single client (`src/api/axiosClient.ts`) wired to the global loader and a `session-expired` event
- **react-router-dom**, **date-fns**, **recharts**, **lucide-react**

## Run

```bash
npm install
npm run dev
```

## Folder structure

```
src/
  api/           axiosClient, createResourceStore, useApiRequest, error typing
  theme/         accentColors.ts — the selectable palette + applyAccentColor()
  components/
    fields/      TextInput, NumberInput, PasswordInput, TextArea, SelectSearch, MultiSelectSearch,
                 Checkbox(Group), RadioGroup, FloatingInput, PinInput, Switch, Rating, Slider,
                 RangeSlider, TagsInput, ColorPicker, FileUpload
    cards/       Card (rounding/border/elevation/header/footer, radius- and style-aware)
    table/       Table, Pagination (accent-tinted header), TableDatePicker (dense, portaled DatePicker
                 preset for an editable date column — see "Table date pickers" below)
    loader/      Loader, GlobalLoader (reads loaderStore), SupplyChainLoader, ConveyorLoader, ScanLoader
                 (three themed loaders, each size="sm"|"md"|"lg"), Skeleton, DotsLoader
    datetime/    DatePicker, MonthPicker, YearPicker, DateRangePicker, TimePicker, TimeRangePicker —
                 every one accepts `portal` (renders the panel into document.body, fixed-positioned
                 against the trigger, so it isn't clipped by a table/modal/scrolling ancestor) and
                 `dense` (compact trigger padding)
    sidebar/     Sidebar (vertical/horizontal, logout button), SettingsDrawer, navItems
    modals/      Modal (base) + Success/Failure/Warning/Session/Info/ConfirmModal
    buttons/     TextButton, IconButton, SlideButton, actionConfig (shared action→icon/color/label map) +
                 {Action}SlideButton / {Action}TextButton / {Action}RoundedButton presets for Add/List/View/
                 Modify/Bulk Upload/Save/Refresh/Cancel/Delete
    header/      Header (accent-colored, command palette trigger, theme toggle, profile menu with logout)
    charts/      StatCard (variant: solid/soft/outline/minimal/pill/sparkline/progress, tone, size),
                 LineAreaChartCard, BarChartCard, PieChartCard, MultiLineChartCard, RadialGaugeChartCard
    badges/      StatusBadge (icon), TextBadge (dot)
    toast/       ToastContainer (solid success/error/warning/info)
    common/      Logo, Accordion, CodeBlock (copy-to-clipboard), PropsTable, CommandPalette (⌘K), Breadcrumbs,
                 RouteErrorBoundary (catches lazy-route render errors, see Performance below)
  layout/        AppLayout (switches between vertical/horizontal shells, boxed/full container, mounts
                 CommandPalette + Breadcrumbs)
  pages/         One preview page per component category (each demo followed by a ComponentApi import+props
                 block — see PreviewSection.tsx), OverviewPage (hero + stats + embedded user manual), LoginPage
                 (standalone route), NotFoundPage (path="*" catch-all for unknown URLs)
  store/         themeStore, layoutStore, loaderStore, toastStore, commandPaletteStore
  hooks/         useClickOutside, useDebouncedValue
  lib/           cn() (clsx + tailwind-merge)
  router.tsx     Route table — every page is lazy-loaded via lazyWithReload (React.lazy + stale-chunk
                 auto-reload), wrapped in one Suspense (SupplyChainLoader fallback) and a RouteErrorBoundary.
                 App.tsx only renders <AppRouter />.
```

## Performance

- **Route-level code splitting** (`src/router.tsx`) — every page is lazy-loaded. The initial bundle went from one
  ~880 kB blob to a ~30 kB entry chunk; each page (and whatever it needs — e.g. recharts) downloads only when
  visited.
- **Resilient lazy loading** (`src/router.tsx`) — routes are wrapped with `lazyWithReload`, not raw `React.lazy`.
  If a chunk 404s because the visitor has an older build open in their tab (a new deploy shipped and their chunk
  hash no longer exists on the server), it auto-reloads once so they land on the current build instead of seeing
  an error — a common real-world failure mode for code-split SPAs that's easy to miss until it happens in
  production. `RouteErrorBoundary` (`src/components/common/RouteErrorBoundary.tsx`) wraps the route tree as the
  fallback for anything that isn't a stale chunk — a genuine render error, or a fetch that still fails after the
  reload — showing a "Reload page" card instead of a blank screen.
- **`path="*"` catch-all** (`src/pages/NotFoundPage.tsx`) — an unmatched URL renders a proper "Page not found" page
  with a link back to Overview, instead of an empty `<Outlet />`.
- **Vendor chunk splitting** (`vite.config.ts`, `manualChunks`) — React/Router, general utilities, and recharts
  (~350 kB / ~93 kB gzipped) each build into their own cacheable chunk.
- **`useDebouncedValue`** (`src/hooks/`) — used by the Table page's search box; reach for it before any text input
  drives a filter or a network call.
- **`React.memo`** on the recharts card components (`ChartCards.tsx`) — skips expensive re-renders when a parent
  re-renders for an unrelated reason.

## Security

- **Content-Security-Policy** meta tag (`index.html`) restricts script execution to same-origin bundles.
- **CSRF** — `axiosClient` sets `xsrfCookieName`/`xsrfHeaderName` (the standard double-submit-cookie pattern),
  dormant until your backend sets an `XSRF-TOKEN` cookie.
- **Expired tokens are cleared on 401**, not left in storage.
- **No `dangerouslySetInnerHTML`, no `eval`** anywhere in the codebase — keep it that way; sanitize (e.g. DOMPurify)
  immediately before the one spot that ever needs to render untrusted HTML.
- **The demo auth token lives in `localStorage`** — documented as a trade-off in `axiosClient.ts`, not an
  oversight. Prefer an httpOnly, Secure, SameSite cookie for a real deployment.

Full explanations (with the reasoning behind each choice) are in the app itself — run it and open the "Performance"
and "Security" sections of the User Manual on the Overview page — or in [AGENTS.md](AGENTS.md) rules 16–20.

## Theming architecture

Every `bg-brand-*` / `text-brand-*` / `border-brand-*` / `ring-brand-*` Tailwind utility resolves through **runtime CSS custom properties**, not compiled hex values:

```
.bg-brand-600 { background-color: var(--color-brand-600); }   /* Tailwind's compiled utility */
--color-brand-600: var(--brand-600);                          /* @theme indirection, src/index.css */
--brand-600: #2563eb;                                          /* set on :root by applyAccentColor() */
```

Picking a color in the appearance drawer calls `applyAccentColor(name)` ([`src/theme/accentColors.ts`](src/theme/accentColors.ts)), which rewrites the 11 `--brand-*` shades on `document.documentElement`. Because every accent-colored element ultimately reads through that same variable, the header, the active sidebar item, the table header tint, buttons, badges, and modals all repaint instantly — no per-component color logic needed.

The same pattern drives the corner-radius slider (`--app-radius`, consumed by `rounded-[var(--app-radius)]` on Card/Modal) and dark mode (`.dark` class toggled on `<html>`).

**Theme mode defaults to `"system"`** — it follows `prefers-color-scheme` (with a live listener for OS changes) until the user explicitly picks Light or Dark from the header toggle or the appearance drawer, at which point it's pinned to that persisted choice.

## Conventions for the team

- **Never branch on `isDark`.** Style both themes with Tailwind's `dark:` variant directly (`bg-white dark:bg-slate-900`) — the `dark` class is toggled once on `<html>`, so every component just needs light + dark classes and it works everywhere automatically.
- **Never hardcode accent colors** (`bg-blue-600`, etc.) on anything meant to follow the app theme — use `bg-brand-*` / `text-brand-*` so it repaints when the user changes the accent color. Fixed semantic colors (red for danger, green for success, yellow for warning) are intentionally hardcoded and should stay that way.
- **API calls always go through `axiosClient`** so the global loader and 401 handling stay centralized. For a CRUD resource, create a store with `createResourceStore<T>('/your-endpoint')`; for a one-off call, use `useApiRequest`.
- **Buttons**: the 9 standard actions (Add, List, View, Modify, Bulk Upload, Save, Refresh, Cancel, Delete) each have a preset in all three button families — `{Action}SlideButton`, `{Action}TextButton`, `{Action}RoundedButton` — instead of composing `TextButton`/`IconButton`/`SlideButton` ad hoc. They're all generated from `src/components/buttons/actionConfig.tsx`; change an action's icon/label/color once there instead of editing three components. Every preset still accepts `tone`/`label`/`icon`/`variant`/`size` to override for a one-off screen.
- **Modals** all accept arbitrary `children` and an optional `footer` override — use the presets (color-coded: green success, red failure, yellow warning, blue info, neutral session, purple/brand confirm) and only reach for the base `Modal` for a fully custom dialog.
- **Toasts** (`showSuccessToast`, `showErrorToast`, `showWarningToast`, `showInfoToast` from `store/toastStore.ts`) use the same color language as the modals — reach for a toast for non-blocking feedback, a modal when the user must acknowledge or decide.
- Every input/table/picker component accepts a `containerClassName` (and a plain `className`/`style` on the control itself) so you can adjust width/height/layout without fighting the component's internal styling.

## Suggested next steps (not yet implemented — flag if you want these)

1. **Form validation** — wire up `react-hook-form` + `zod` around the field components for consistent validation/error wiring instead of manual `useState` per field.
2. **Real auth** — the login page and header/sidebar logout buttons are UI-only; wire them to your actual auth endpoint and have the `session-expired` window event (already dispatched by `axiosClient` on 401) open `SessionModal` automatically.
3. **RTL polish** — direction toggling flips the vertical sidebar's side and sets `dir="rtl"`, but icon-only affordances (chevrons, calendar arrows) aren't mirrored yet; worth a pass if an RTL locale ships.
4. **Storybook** (or keep the current preview pages, just add controls) if the team wants isolated, prop-driven component playgrounds beyond the current fixed-example pages.
5. **Table row selection / column visibility toggle**, and **virtualizing `Table`** (react-window or similar) for row counts beyond what a paginated API returns — see the Performance section above.
6. **RangeSlider dual-thumb keyboard nudging** — the two native range inputs stack for mouse/touch drag, but simultaneous keyboard control (arrow keys on one thumb without the other stealing focus order) could use a dedicated a11y pass if the team leans on it heavily.
