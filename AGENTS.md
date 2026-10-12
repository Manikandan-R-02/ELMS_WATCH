# AGENTS.md — instructions for AI coding assistants

This file is for AI tools (Claude, Copilot, Cursor, etc.) working in **any repository started from this template**.
Read it before generating or editing any UI code here. It exists so every project — and every team member, human or
AI, working on any of those projects — produces consistent, on-brand code instead of each one reinventing its own
button, its own modal, its own color system. If a user's request conflicts with a rule below, follow the user's
explicit instruction but flag the conflict in your response.

## What this project is

A Vite + React + TypeScript + Tailwind CSS v4 + Zustand + Axios **component template**, maintained centrally and
copied into every new Esfita product. It is **not** tied to one product — it started as the SCM (supply chain
management) app's UI layer, but the component library, theming architecture, and conventions in this file apply
identically to whatever product a given copy of this repo becomes. It is not an app with business logic — it is the
shared building-block library every screen should be built from. `npm run dev` opens a set of preview pages (one per
component category) that double as living documentation; check them before assuming a component doesn't exist.

## Using this template for a new project

Every project starts as a copy of this repo. Two categories of content, and they need different treatment:

**Project-specific — customize these for the new product, don't leave them as SCM leftovers:**
- Brand assets in `src/assets/` and what `src/components/common/Logo.tsx` points at.
- `package.json`'s `name`, and `index.html`'s `<title>`.
- Marketing/example copy that's clearly about supply chain management as a *subject*, not a UI pattern — the login
  page's hero copy, the Overview page's hero headline and highlight bullets, and the truck-and-crate visual in
  `SupplyChainLoader.tsx` (the loader *mechanism* — `GlobalLoader` + `loaderStore` — is universal; the truck/crate
  artwork is just one example of a themed loader and is fine to redraw for a product where that metaphor doesn't
  fit, e.g. a finance or HR tool — this project already did that redraw: `LocationLoader.tsx`, a pin-and-radar
  animation, is what `GlobalLoader` actually renders now; `SupplyChainLoader` is kept only as an unused sibling
  example).
- `Header.tsx`'s `CURRENT_USER` mock and any other placeholder/demo data used only to make the preview pages look
  populated.
- The default accent color (`src/theme/accentColors.ts` / `themeStore`'s initial `accent`) — blue is a neutral
  default, not a requirement; change it if the new product has an established brand color.
- `.env` / `VITE_API_BASE_URL` — per-project, never committed.

**Universal — keep identical across every project, don't fork or "improve locally":**
- Every component's public API (props, naming conventions) in `src/components/*`.
- The theming architecture (CSS-variable indirection for accent color / radius, `dark:` variant usage, the
  categorized type scale, scrollbar styling) — see "Theming architecture" below.
- The action-button convention (`actionConfig.tsx` driving `{Action}SlideButton` / `{Action}TextButton` /
  `{Action}RoundedButton`), the modal/toast color language, the folder structure, the security defaults
  (`axiosClient.ts`, the CSP in `index.html`), and the performance patterns (route-level lazy loading, vendor chunk
  splitting).
- This file. If a project's team deliberately adapts a rule here (e.g. a different default accent, an extra
  standard action beyond the 9 listed below), edit **this file** in that project's copy so it stays authoritative —
  don't let the decision live only in someone's memory or a Slack thread. An AI assistant should treat whatever
  `AGENTS.md` says in the repo it's currently working in as the source of truth for that project, even where it
  has diverged from this original text — but should flag such a divergence if it looks like an accidental drift
  rather than a deliberate decision (e.g. someone hardcoded a hex color instead of updating the accent default).

If you're an AI assistant asked to build something and you're not sure whether a piece of content is "the SCM
example" or "the actual product": ask, rather than assuming either way.

## Hard rules (do not violate these)

1. **Never build a new input/button/card/modal/table/badge/picker from scratch.** Import the existing component from
   `src/components/*` and compose it. If it genuinely can't do what's needed, extend the existing component with a
   new prop — do not fork it into a parallel one-off component.
2. **Never hardcode an accent color** (`bg-blue-600`, `text-indigo-500`, `#2563eb`, etc.) on anything that should
   follow the app's theme. Use `bg-brand-*` / `text-brand-*` / `border-brand-*` / `ring-brand-*` instead — these
   resolve through a runtime CSS variable that the appearance drawer rewrites when the user changes the accent
   color. See "Theming architecture" below. Fixed semantic colors are the exception and should stay hardcoded:
   red/danger, emerald/success, yellow/warning, and the brand-blue-for-info convention used in badges/toasts/modals.
3. **Never write `isDark` conditionals in a component** (`isDark ? 'bg-slate-900' : 'bg-white'`). Style both themes
   directly with Tailwind's `dark:` variant on the same element (`bg-white dark:bg-slate-900`). The `dark` class is
   toggled once on `<html>` by `themeStore`; every component just needs both sets of classes and it works
   everywhere with zero prop threading.
4. **All API calls go through `src/api/axiosClient.ts`**, never a raw `fetch` or a second axios instance. For a
   CRUD resource, create a store with `createResourceStore<T>('/your-endpoint')` (`src/api/createResourceStore.ts`).
   For a one-off call, use `useApiRequest` (`src/api/useApiRequest.ts`). This keeps the global loader and 401
   session-expiry handling centralized — bypassing the client silently breaks both.
5. **Every component must expose sizing/layout escape hatches.** Native-HTML-based components (buttons, text
   inputs, cards, textareas) already get `className`/`style` for free via prop spreading — use them, don't wrap the
   component in an extra styled `<div>`. Composite components that don't spread onto a single DOM node (pickers,
   `SelectSearch`) expose `containerClassName` + `style` explicitly for the same purpose — use those instead of
   reaching into the component's internals.
6. **Respect `maxLength`/`minLength`/`min`/`max` on every field you add.** `TextInput`, `TextArea`, `PasswordInput`
   pass these straight through to the native input, so just set them. `NumberInput` has its own `maxLength` (digit
   count) plus `min`/`max` (value clamping) — always set sensible bounds for numeric fields (quantities, percentages,
   phone digits, etc.) instead of leaving them unbounded.
7. **Use the named action-button presets, don't compose generic buttons for these 10 standard actions**: Add
   (`plus`), List, View, Modify, Bulk Upload, Download, Save, Refresh, Cancel, Delete. Each action is available in
   all three button families — `{Action}SlideButton` (icon-first, hover-expands — table/row actions, and the
   default choice for a toolbar action on `sm:` and up), `{Action}TextButton` (icon + always-visible label —
   toolbars/forms/modal footers), and `{Action}RoundedButton` (icon-only, fully rounded — dense toolbars, and the
   default swap-in for a `SlideButton` toolbar action below `sm:`, since hover-to-reveal has no equivalent on touch)
   — e.g. `PlusSlideButton`, `PlusTextButton`, `PlusRoundedButton`. All three families are generated from one shared
   config, `src/components/buttons/actionConfig.tsx` — **edit an action's icon/label/color there** if the team's
   convention changes, don't hand-edit three separate components. Default team colors: Add → brand/blue, List →
   purple, View → indigo, Modify → cyan, Bulk Upload → brand/blue, Download → success/green, Save → success/green,
   Refresh → warning/yellow, Cancel → neutral/gray, Delete → danger/red. Every preset still accepts `tone` (and
   `label`/`icon`/`variant`/`size`) to override for a one-off screen — e.g. `<DeleteSlideButton tone="warning" />`
   — without touching the shared default. `ButtonTone` is
   `brand | neutral | danger | success | warning | purple | cyan | pink | indigo`.
7a. **Loading states use the project's own pin-and-radar loader**, not a generic spinner, for anything
    full-screen. `GlobalLoader` (mounted once in `AppLayout`) already shows automatically for every `axiosClient`
    call and every route change — you don't need to trigger it yourself for those, and it never appears on the
    login page (that page's own async work — the login request — uses the submit button's inline `loading` state
    instead, not `axiosClient`/`loaderStore`). For any other async UI work (a manual fetch, a client-side
    computation), call `useLoaderStore.getState().setManualLoading(true/false)` rather than building a one-off
    overlay. For a loading state scoped to one section of a page (not the whole screen), use `<LocationLoader />`
    (`src/components/loader/LocationLoader.tsx`) inline — `SupplyChainLoader`/`ConveyorLoader`/`ScanLoader` remain
    as alternate themed siblings if a future product pivot wants a different metaphor. Use the plain
    `<Loader />` only for small spaces like a button's `loading` state. When the eventual content has a known
    shape (a card, a list row, a profile block), prefer `<Skeleton />` (`src/components/loader/Skeleton.tsx`) over
    a spinner so the layout doesn't jump once data arrives. For very tight inline spaces (a table cell, a chat
    bubble, status text) where even `<Loader size="sm" />` feels heavy, use `<DotsLoader />`.
8. **Use the modal presets for their intended status**, not a bare `Modal`: `SuccessModal` (green), `FailureModal`
   (red), `WarningModal` (yellow), `InfoModal` (brand blue), `SessionModal` (forced session-expiry — see below),
   `ConfirmModal` (generic Yes/No — defaults to `tone="brand"` (blue), matching the app's white-and-blue surfaces;
   pass `tone="purple"` only when a routine confirmation should visually stand apart from primary brand actions,
   and `tone="danger"` only for delete/revoke-style actions). All accept arbitrary `children` and an optional
   `footer` override, so you rarely need the base `Modal` directly. They render via `Modal`'s `hero` mode — a
   tone-colored icon badge floating above the card's top edge, a bold title below it, full-width pill footer
   buttons — instead of the older small inline icon+title row (that row still exists in `Modal` as the
   default/classic mode for non-status modals like `ChangePasswordModal`, which has form fields near the top that
   a giant icon would crowd). Every status preset also accepts three optional props for richer content instead of
   a plain message: `banner` (a short, tone-tinted callout line), `details` (`{label, value}[]`, rendered as a
   two-column grid — date/time-style key facts), and `list` (`{heading, items: {label, sublabel?}[]}`, a named
   list of colored avatar-initial rows — e.g. attendees, affected users). See `ModalsPreviewPage.tsx`'s Success
   demo for the reference usage of all three together. `SessionModal` has no "stay signed in" escape hatch by
   design — it shows a live countdown (`countdownSeconds`, default 7) with a shrinking progress bar and calls
   `onExpire` when it hits zero (wire that to `navigate(ROUTES.login)`); its own footer is a single "Log out now"
   button (`onClose`), and `closeOnBackdrop` is always off.
9. **Use toasts for non-blocking feedback, modals for anything the user must acknowledge or decide.**
   `showSuccessToast` / `showErrorToast` / `showWarningToast` / `showInfoToast` (`src/store/toastStore.ts`) render as
   solid, dark-toned pills with white text (not light tints) — keep new toast/banner-style components consistent
   with that, don't reintroduce pastel backgrounds.
10. **Don't add a second logo, brand mark, or hardcoded product-name text anywhere.** The brand asset is
    `src/components/common/Logo.tsx`, which auto-picks the color or white PNG from `src/assets/` based on the
    current theme/surface. Use `<Logo />` (auto), `<Logo variant="white" />` (forced white, for a colored/dark
    surface you control regardless of theme), or `<Logo variant="color" />`. If a project's brand mark changes,
    swap the two PNGs in `src/assets/` — the component and every place that renders it stay untouched.
11. **Use the categorized type scale, not raw `text-*`/`font-*` combinations, for structural text.** Utility classes
    (defined once in `src/index.css`, so both light/dark are baked in — no `dark:` needed at the call site):
    `text-display` (rare, hero copy), `text-page-title` (one per page — see `PreviewPage`), `text-section-title`
    (card/section headers — see `PreviewSection`, `ChartHeader`), `text-card-title` (a card's own heading, e.g. the
    Overview tiles), `text-body` (default paragraph copy), `text-body-sm` (secondary/description copy),
    `text-caption` (small muted metadata), `text-label` (form field labels — already used by `FieldShell`),
    `text-eyebrow` (small uppercase kicker above a heading). Reach for a raw `text-sm text-slate-500` only when
    none of these categories fit — and if you find yourself doing that often for the same kind of text, add a new
    category to `index.css` instead of repeating the combination.
12. **One font, loaded once.** The whole app renders in Inter (loaded via Google Fonts `<link>` in `index.html`,
    applied through the `--font-sans` theme token / the `font-sans` Tailwind utility, and set explicitly on `body`
    in `index.css`). Don't add another `font-family`, another Google Fonts `<link>`, or a per-component
    `font-[...]` override — if a heading needs to look heavier, use `font-semibold`/`font-bold` on Inter, not a
    different typeface.
13. **Scrollbars are deliberately thin and neutral everywhere** (`src/index.css`, a global `*` rule — 6px, slate-
    colored, brightening to the accent color only on hover). This is intentional so scrollable areas (tables,
    dropdowns, the sidebar nav, modal bodies) don't visually compete with content. Don't override
    `scrollbar-width`/`::-webkit-scrollbar` locally on a new component; if the global rule is genuinely wrong for
    a specific case, fix it in `index.css` so the change applies everywhere.
14. **Every preview page documents its own components — keep that pattern going.** Each demo in
    `src/pages/*PreviewPage.tsx` is followed by a `<ComponentApi importCode={...} props={[...]} />`
    (`src/pages/PreviewSection.tsx`) — a collapsible import statement + props table, built from
    `src/components/common/CodeBlock.tsx` (copy-to-clipboard) and `src/components/common/PropsTable.tsx`. When you
    add or change a component, add or update its `ComponentApi` block in the same commit — the live demo and the
    documented API must never drift apart. `src/pages/OverviewPage.tsx`'s "User manual" accordion is the
    prose-level summary; it links back to this file for the enforceable detail.
15. **Reuse the navigation infrastructure instead of hardcoding page lists.** The command palette
    (`Ctrl/Cmd+K`, `src/components/common/CommandPalette.tsx`) and the breadcrumb trail
    (`src/components/common/Breadcrumbs.tsx`, mounted once in `AppLayout`) are both derived from
    `src/components/sidebar/navItems.ts`. Add a new page there and it appears in the sidebar, the command palette,
    and breadcrumbs automatically — don't hand-roll a second navigation list.
16. **Every clickable thing must be keyboard-operable — use a real `<button>`, not a `<span>`/`<div>` with
    `onClick`.** A native button is focusable and fires on Enter/Space for free; a styled div is neither. When two
    interactive elements must visually nest (e.g. a clear "×" inside what looks like one field), render them as
    sibling `<button>`s positioned with CSS rather than nesting a button inside a button (invalid HTML — see how
    `SelectSearch`'s clear button sits beside, not inside, the trigger button). A `<tr onClick>` (see `Table`) also
    needs `tabIndex={0}`, `role="button"`, and an `onKeyDown` handling Enter/Space — copy that pattern for any new
    clickable-row UI instead of a bare `onClick`.
17. **Every field's `error` prop renders below the field and reddens the border/focus ring — including the
    non-`FieldShell` ones.** `SearchBar` follows the same contract (`error`/`helperText` props) even though it
    doesn't route through `FieldShell` internally — match that when building a new field type; don't invent a
    different validation-display convention per component.
18. **New pages are lazy-loaded in `src/router.tsx`, not imported eagerly in `App.tsx`.** `App.tsx` only renders
    `<AppRouter />`; the route table, the lazy imports, and the `<Suspense>` fallback (the `LocationLoader`, for
    visual consistency with `GlobalLoader`) all live in `router.tsx`. Route **paths** are centralized in
    `src/routes/paths.ts` (`ROUTES.login`, `ROUTES.overview`, etc.) — `router.tsx` maps each `ROUTES.*` constant to
    its lazy-loaded page, and every `navigate(...)`/`<Link to>`/`<Navigate to>` elsewhere in the app imports from
    `ROUTES` instead of hardcoding the string, so a path only changes in one place. Adding a route means adding a
    key to `ROUTES`, one `lazyWithReload(() => import(...))` line, and one `<Route>` in `router.tsx` — don't add a
    static top-level import of a page component anywhere else, it defeats the code-splitting. Use `lazyWithReload`
    (`src/lib/lazyWithReload.ts`, wraps `React.lazy` — shared by `router.tsx` for route-level splitting and
    `UIPreviewPage.tsx` for tab-level splitting), not `lazy` directly: after a new deploy, a browser tab left open
    on an old build will get a 404 fetching a stale chunk hash ("Failed to fetch dynamically imported module") —
    `lazyWithReload` catches that once per session and hard-reloads so the user lands on the current build instead
    of seeing an error. `RouteErrorBoundary` (`src/components/common/RouteErrorBoundary.tsx`, wrapping `<Routes>`)
    is the fallback for everything else: a genuine render error, or a chunk fetch that fails even after the reload
    (offline, real 404). It shows a "Reload page" card rather than a blank screen — don't let a new page's render
    errors go uncaught on the assumption Suspense alone covers it. Unmatched URLs hit `path="*"` → `NotFoundPage`
    (`src/pages/NotFoundPage.tsx`) instead of rendering nothing inside `AppLayout`.
18a. **(`/ui-preview` is no longer listed in the sidebar, command palette or first-run tour — it stays routable at
    that URL for developers, so keep adding previews there as described below.)**
    **Every component-preview category lives inside the single `/ui-preview` route (`UIPreviewPage.tsx`), not its
    own route.** The category list — id, label, icon, description — is centralized in
    `src/pages/uiPreviewCategories.ts`, which drives both `UIPreviewPage`'s tab strip and `OverviewPage`'s "Component
    categories" browse grid (each card deep-links to `/ui-preview?tab=<id>`). Add a new preview page (e.g. for a new
    component category) by: creating `src/pages/XPreviewPage.tsx` as usual, adding one `lazyWithReload` entry + one
    `PANELS` key in `UIPreviewPage.tsx`, and one entry in `uiPreviewCategories.ts` — don't add it as a top-level
    route or a separate `navItems` entry.
19. **Performance patterns already in place — reuse them, don't reinvent:** `useDebouncedValue`
    (`src/hooks/useDebouncedValue.ts`) before any text input drives a filter or network call; `React.memo` on
    presentational components that re-render expensively for unrelated reasons (see the recharts cards in
    `ChartCards.tsx`); vendor chunk splitting in `vite.config.ts` (`manualChunks`) for any new heavy dependency —
    add it to the relevant chunk bucket (or a new one) rather than letting it bloat the shared `vendor` chunk.
20. **Security defaults are in `axiosClient.ts` and `index.html` — don't work around them.** The CSP meta tag in
    `index.html` restricts `script-src` to same-origin; if a new dependency needs to load a worker or an external
    script, add the specific origin/directive it needs rather than loosening the policy broadly. `connect-src` (what axios/fetch may call) is generated at build time
    by `build/cspPlugin.ts` from the origins of the `VITE_*` API addresses (`VITE_API_BASE_URL`,
    `VITE_MONTH_CLOSING_URL`, plus anything in
    `VITE_CSP_EXTRA_CONNECT_SRC`) — to allow a new API server set its env var, never hand-edit `index.html`, and
    never hardcode an absolute API URL in code (the browser would block it). The build machine must have those
    variables set, or the policy and the bundle will both lack the address. A CSP *header* sent by the web
    server/proxy/CDN is enforced in addition to the meta tag, so its `connect-src` must list the same origins (or
    be removed) — otherwise calls are blocked even though `dist/index.html` allows them. `axiosClient`'s
    XSRF config (`xsrfCookieName`/`xsrfHeaderName`) and its "drop the token on 401" behavior are load-bearing for
    real auth — if you wire up a backend, prefer an httpOnly cookie over the current `localStorage` token (see the
    comment in `axiosClient.ts`) rather than just relying on the demo mechanism as-is. Never use
    `dangerouslySetInnerHTML` on server- or user-provided content without sanitizing it immediately beforehand
    (e.g. DOMPurify) — there is currently zero usage of it in this codebase; keep it that way unless there's no
    other option.
21. **Every real screen under `src/pages/screens/` starts with `<PageHeader>`** (`src/components/common/PageHeader.tsx`)
    — icon, title, optional help button (`onHelp`, opens an `InfoModal` walking through the page), optional status
    `badge`, and right-aligned `actions` (the screen's Save/Refresh/etc. buttons). Don't hand-roll a new hero/header
    block per screen — extend `PageHeader`'s props if it's missing something a screen needs. See
    `GeneralSettingsPage.tsx` for the reference usage, including the `sm:hidden`/`sm:flex` pattern for swapping
    slide-buttons for rounded-buttons in `actions` on small screens.

## Theming architecture (read this before touching colors)

Every `bg-brand-*` / `text-brand-*` / `border-brand-*` / `ring-brand-*` Tailwind utility resolves through **runtime
CSS custom properties**, not compiled hex values:

```
.bg-brand-600 { background-color: var(--color-brand-600); }   /* Tailwind's compiled utility, src/index.css */
--color-brand-600: var(--brand-600);                          /* @theme indirection, src/index.css */
--brand-600: #2563eb;                                          /* set on :root by applyAccentColor(), runtime */
```

Picking a color in the appearance drawer calls `applyAccentColor(name)` (`src/theme/accentColors.ts`), which
rewrites the 11 `--brand-*` shades on `document.documentElement`. Every accent-colored element — header, active
sidebar item, table header, buttons, badges, stat cards — reads through that same variable chain, so they all
repaint instantly with no per-component color logic. **When adding a new component that should follow the app's
theme, use `brand-*` Tailwind classes and nothing else.**

The same variable-indirection pattern drives:
- **Corner radius**: `--app-radius`, consumed via `rounded-[var(--app-radius)]` on `Card`/`Modal`/the profile menu.
  Set new large-surface components (cards, panels, dialogs) the same way instead of a fixed `rounded-2xl`.
- **Dark mode**: the `.dark` class toggled on `<html>` by `themeStore`, which defaults to `mode: "system"`
  (follows `prefers-color-scheme`, with a live listener for OS changes) until the user explicitly overrides it.
- **Card style**: `Card`'s `bordered`/`elevated` props default from `layoutStore.cardStyle` ("border" vs "shadow")
  when not explicitly passed — don't hardcode a card look that fights the user's chosen style.
- **Direction**: `dir="ltr"|"rtl"` set on `<html>` by `themeStore.direction`; `AppLayout` flips the vertical
  sidebar's side accordingly. RTL icon-mirroring (chevrons, calendar arrows) is not yet done — flag it if you add
  a new directional icon.
- **Solid brand-colored surfaces in dark mode**: a *large* solid-fill surface (the top `Header`, the sidebar's
  active-item highlight, `PageHeader`'s hero band) should pair `bg-brand-600` with `dark:bg-brand-500` — one shade
  lighter, same hue — so it doesn't read as a flat near-black block against the dark theme's slate background.
  This is a deliberate, hardcoded exception to "use `brand-*` and nothing else" (rule 2): since `--brand-500` is
  always lighter than `--brand-600` for every preset in `accentColors.ts`, the pairing holds for whichever accent
  color the user has picked, in both themes. Small accent chips/badges/buttons don't need this — it's specifically
  for surfaces large enough that the color *is* the background, not just an accent on one.

## Folder map

```
src/
  api/            axiosClient, createResourceStore, useApiRequest, error typing, apiHelpers.ts
                  (formatDateForApi/currentUserContext — shared by every screen's own api.ts)
  theme/          accentColors.ts — the selectable palette + applyAccentColor()
  routes/         paths.ts — centralized ROUTES path constants, imported by router.tsx, navItems.ts, and
                  any component that navigates (never hardcode a path string elsewhere)
  router.tsx      Route table — every page lazy-loaded via lazyWithReload (React.lazy + stale-chunk
                  auto-reload), one Suspense (LocationLoader fallback), RouteErrorBoundary wrapping
                  <Routes>, path="*" → NotFoundPage
  components/
    fields/       TextInput (leadingIcon/trailingIcon, iconVariant="addon" for a bordered icon box),
                  NumberInput, PasswordInput, TextArea, SelectSearch, MultiSelectSearch,
                  Checkbox, CheckboxGroup, RadioGroup, RadioButton (primitive),
                  FloatingInput (floating-label variant), PinInput (segmented OTP/PIN),
                  Switch (on/off toggle), Rating (star rating, half-star + read-only),
                  Slider (single range input), RangeSlider (dual-thumb min/max),
                  TagsInput (chip/tag entry), ColorPicker (swatches + custom hex),
                  FileUpload (drag-drop dropzone with previews), FieldShell (shared wrapper)
    search/       SearchBar (normal + slide variants, light/dark tone, error/helperText),
                  ResponsiveSearchBar (the "slide" icon-only field on `sm:`+ / plain always-open
                  field below `sm:` pairing every toolbar search on this project uses — see
                  OverallSummaryPage; `LocationSearchBox`, LocationSummaryPage's own autocomplete
                  variant, hand-rolls the same pairing because it also needs a suggestions
                  dropdown this plain version doesn't have)
    cards/        Card
    table/        Table (keyboard-accessible clickable rows, zebra-striped (`odd:`/`even:` row backgrounds) —
                  dense by design: `text-[0.7rem]` uppercase headers, `text-[0.8125rem]` body cells, `px-3 py-2`
                  padding, tuned for enterprise-report-style screens with many columns (e.g. LocationSummaryPage's
                  month-comparison tables) where a larger default font would force horizontal scrolling; a
                  `Column`'s `header` is `ReactNode`, not just a string — pair it with an icon via a small
                  `<span className="inline-flex items-center gap-1">` wrapper, see
                  `HeaderLabel.tsx` for the shared helper), Pagination,
                  TableDatePicker (dense, portaled DatePicker preset for an editable date column)
    loader/       Loader, GlobalLoader, LocationLoader (this project's default themed full-screen loader — a
                  pin dropping onto a pulsing radar ring; see "Using this template" above re: reskinning),
                  SupplyChainLoader/ConveyorLoader (pick-pack/fulfillment themed)/ScanLoader (barcode/inventory-scan themed —
                  all three accept size="sm"|"md"|"lg"), Skeleton (content-shaped placeholder),
                  DotsLoader (compact inline loader)
    datetime/     DatePicker, MonthPicker, YearPicker, DateRangePicker, TimePicker, TimeRangePicker, PickerShell
                  (every picker accepts `portal` — renders its panel into document.body, fixed-positioned
                  against the trigger, so it isn't clipped inside a table cell/modal/scrolling toolbar —
                  and `dense` for compact trigger padding)
    sidebar/      Sidebar (vertical/horizontal + collapse + logout), SettingsDrawer, navItems (the full,
                  unfiltered list — also drives Breadcrumbs, see rule 15) + `useVisibleNavItems()` (navItems
                  filtered by the logged-in user's `screenRights` from the login response, via
                  `lib/screenRights.ts` — use this, not the raw `navItems` export, anywhere a user should only
                  see/reach screens they're allowed into; Sidebar and CommandPalette both do. The
                  "Screen Rights" admin screen is in the nav (`appScreens.ts`, `built: false`) as a placeholder
                  until the backend's screen-rights endpoints exist)
    modals/       Modal (base) + Success/Failure/Warning/Session/Info/ConfirmModal — each status modal accepts
                  an optional `details` prop (`StatusModalDetail[]`, label/value rows below the message) for
                  a status that needs to show more than a one-line message
    buttons/      TextButton, IconButton, SlideButton, actionConfig (shared action→icon/label/color map),
                  ActionTextButtons, ActionRoundedButtons (the {Action}SlideButton/{Action}TextButton/
                  {Action}RoundedButton preset families — see rule 7)
    header/       Header (command palette trigger, theme toggle, profile menu)
    charts/       StatCard (variant: solid/soft/outline/minimal/pill/sparkline/progress, size: sm/md),
                  LineAreaChartCard, BarChartCard (single-series via `dataKey`, or grouped multi-series bars via
                  `series: {key,label,color}[]` — same shape as MultiLineChartCard's `series`; `compact` shrinks
                  it to h-48 for a dense grid of many small charts, see LocationSummaryPage/LocationGraphs.tsx),
                  PieChartCard (fixed donut — hides its legend past 8 slices, see `LEGEND_SLICE_LIMIT`),
                  MultiLineChartCard (multi-series comparison, fixed `variant="line"|"area"`),
                  ComparisonChartCard (same two/multi-series comparison data as MultiLineChartCard, but with a
                  built-in Area/Line/Bar `Segmented` toggle in the card header instead of a fixed `variant` — the
                  reader picks the chart shape; used by Location Summary's and Overall Summary's own Cost
                  Comparison panels), DistributionChartCard (one-value-per-category data, e.g. cost by category/
                  location — a built-in Pie/Bar/Rank(horizontal-bar) toggle, a center total on the pie view so it
                  never reads as an empty ring, and bar views cap at the top 12 entries so many-category data
                  stays legible instead of cramming 30+ bars into one card; used by Overall Summary's Categories
                  by Cost / Total Cost Distribution / category-drill-down panels), RadialGaugeChartCard
                  (single-metric radial gauge), LegendTable (searchable, paginated {name,value} legend —
                  the standard sidekick beside a DistributionChartCard, e.g. Consumption/WasteCost
                  Analysis's category → item drill-down) — all chart cards memoized
    badges/       StatusBadge (icon), TextBadge (dot)
    toast/        ToastContainer (mount once; showSuccessToast/showErrorToast/showWarningToast/showInfoToast
                  from toastStore.ts trigger it — solid-icon bubble, colored countdown progress bar along the
                  bottom edge, auto-dismisses after `duration` (default 3000ms), fade+slide-out on close/expiry)
    common/       Logo, Accordion, CodeBlock (copy-to-clipboard), PropsTable, CommandPalette (Ctrl/Cmd+K),
                  Breadcrumbs, RouteErrorBoundary (catches lazy-route render errors, see rule 18), Tabs
                  (underline tab strip + TabPanel — drives UIPreviewPage, see rule 18a; each `TabItem` can carry
                  an `icon`; defaults to wrapping onto multiple rows on narrow screens/many tabs — pass
                  `className="flex-nowrap overflow-x-auto"` for a single horizontally-scrollable row instead,
                  see LocationSummaryPage), Tooltip (hover/focus
                  label for icon-only triggers), PageHeader (the solid-blue hero header — icon, title, optional
                  help button + status badge, right-aligned actions — used atop every real screen; see rule 21),
                  Segmented (compact pill-style toggle row for a small set of mutually-exclusive view/range
                  options — e.g. "3/6/9/12 months", "Contract/Segment/Operation Manager")
  layout/         AppLayout
  pages/          UIPreviewPage (single route hosting every component-preview category as a lazy-loaded tab,
                  see rule 18a) + one *PreviewPage per category (each demo followed by a ComponentApi
                  import+props block — see rule 14) + CommonPreviewPage (Tabs/Tooltip/Accordion demos),
                  uiPreviewCategories.ts (shared category list — tabs + OverviewPage's browse grid),
                  OverviewPage (hero + stats + embedded user manual), LoginPage (standalone route),
                  NotFoundPage (path="*" catch-all)
    screens/      Real product/app screens (not component previews) — pages that are actual product
                  functionality reachable from the sidebar, e.g. GeneralSettingsPage. As the app grows
                  past component-preview pages, put new product screens here rather than loose in
                  `pages/` directly, so `pages/` stays sorted into "previews" (top level) vs. "real
                  screens" (this folder). A screen big enough to need its own sub-components/API module
                  (see `LocationSummaryPage/` and `OverallSummaryPage/`: `index.tsx` + `data.ts` (types
                  only — no mock data, see rule below) + `api.ts` (every real HTTP call for that screen,
                  through `axiosClient`) + per-view table/modal components) gets its own folder instead
                  of one giant file — a small screen (GeneralSettingsPage) stays a single `.tsx`.
                  `ComingSoonPage.tsx` is the shared placeholder rendered for every screen in
                  `src/routes/appScreens.ts` not yet built (see that file's own doc comment — it's the
                  single ordered list, mirroring the old ElmsWatch app's sidebar order, that both
                  `navItems.ts` and `router.tsx` read from; flip a screen's `built: true` and give it a
                  real router.tsx entry once it's rebuilt).
  store/          themeStore, layoutStore, loaderStore, toastStore, commandPaletteStore, authStore
                  (login/logout/bootstrap, `ScreenRight[]` type — see sidebar/navItems.ts above),
                  (the one backend's base URLs live in `src/api/baseUrls.ts`, from `.env`)
  hooks/          useClickOutside, useDebouncedValue, useSortedPaged (client-side sort+paginate for a
                  report-style table — pairs with `components/table/Table`'s `pagination` prop),
                  useFocusTrap (keyboard containment for any overlay: focus in on open, Tab wraps
                  inside, Escape closes, focus returns to the opener — used by Modal, SettingsDrawer,
                  the mobile Sidebar drawer and CommandPalette; use it for any new overlay rather
                  than hand-rolling focus handling)
  lib/            cn() (clsx + tailwind-merge), lazyWithReload() (React.lazy + stale-chunk auto-reload,
                  shared by router.tsx and UIPreviewPage.tsx), scrollLock, deviceInfo.ts
                  (detectBrowserInfo/fetchClientIp — login payload fields), screenRights.ts
                  (isScreenAccessible — see sidebar/navItems.ts above)
```

## When adding a new component

1. Check `src/pages/*PreviewPage.tsx` first — it may already exist.
2. Match the existing prop-naming conventions in its category: `label`/`error`/`helperText`/`required`/`disabled`
   for fields; `containerClassName` + `style` for composite (non-native-element) components; `tone` for semantic
   color variants; `variant` for structural variants (solid/outline/ghost, normal/slide, etc.).
3. Support both themes with `dark:` classes, both directions where layout is order-sensitive, and the accent
   variable (`brand-*`) where the element should track the user's chosen color.
4. Add a section to the relevant preview page demonstrating it, so the next person (human or AI) can find it.
5. Add or update its `<ComponentApi>` block (rule 14) in the same commit.
6. If it's a new top-level file/folder under `src/`, add one line to the "Folder map" above — a stale folder map
   is actively misleading (an AI reading it may assume a component doesn't exist and rebuild it, violating rule 1).
7. Run `npx tsc --noEmit -p tsconfig.app.json` and `npm run build` before considering the change done.

## Full conventions & rationale

See [README.md](README.md) for the complete stack overview, theming deep-dive, and the running list of suggested
next steps. This file (AGENTS.md) is the enforceable ruleset; the README is the narrative explanation.
