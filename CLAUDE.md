# CLAUDE.md — AGS ELMS WITH NEW TEMPLATE (current work: ELMS Watch redesign)

## What this folder is

This is the **active development project** — a from-scratch redesign of the ELMS Watch application, built on a
Vite + React + TypeScript + Tailwind CSS v4 + Zustand + Axios component template. This is where all new work
happens.

**The full, authoritative engineering ruleset lives in [AGENTS.md](AGENTS.md) — read it before writing or editing
any code here.** It covers the component library, theming architecture (CSS-variable-driven accent color/dark
mode/radius), the action-button convention, API/loader/toast/modal conventions, routing, and the folder map. This
file (CLAUDE.md) only adds the project-level orientation AGENTS.md doesn't cover: what this project *is for*,
where to look for old-app behavior, and workspace-level rules like the no-emoji policy.

## Two-project workspace — read this first

This workspace has two sibling project folders open together:

- **`ELmsWatch`** (sibling folder) — the OLD, currently-live app. **Reference only — never edit it.** Use it to
  look up how a screen currently behaves: field lists, table columns, filters, business rules, calculations. See
  that folder's own `CLAUDE.md` for its structure. It's a Create React App / JavaScript / Chakra+Tailwind app —
  visually and technically unrelated to this project; don't copy its markup or styling, only its *behavior*.
- **`AGS ELMS WITH NEW TEMPLATE`** (this folder) — the NEW app. **All active development happens here.** Every
  real screen gets rebuilt from scratch using this project's component library and conventions (per `AGENTS.md`),
  using the old app only as a functional spec.

When asked to build or rebuild a screen (e.g. "rebuild the Stock On Hand page"), the workflow is:
1. Look up the equivalent screen in `../ELmsWatch/src/views/admin/<Name>/` to learn its fields/columns/logic.
2. Build it here using this project's existing components (`src/components/*`) — never hand-roll a new
   input/button/table/card (`AGENTS.md` rule 1).
3. Place it under `src/pages/screens/` (see "Screens vs. previews" below), wire it into `src/routes/paths.ts`,
   `src/router.tsx`, and `src/components/sidebar/navItems.ts`.

## Workspace-wide rule: no emojis, anywhere

**Never use emoji characters in any file in this project** — not in UI copy, code comments, commit messages, docs,
console logs, or toast/modal text. This applies to actual emoji glyphs (👍 🎉 🚀 etc.), not standard typographic
symbols already in use for legitimate UI purposes (e.g. the `⌘` command-key glyph in keyboard-shortcut hints, or
`→` arrows in prose) — those are fine. Where the app needs a visual marker that might tempt an emoji (a tour
pointer, a status indicator, a callout), use a `lucide-react` icon instead — see
`src/components/onboarding/TourPointer.tsx` for the pattern (a `ChevronDown` icon, not an emoji, used as the
onboarding-tour pointer).

## Screens vs. previews — `src/pages/` structure

`src/pages/` currently holds two kinds of things, and the split matters:

- **Component previews** (top level of `src/pages/`, e.g. `ButtonsPreviewPage.tsx`, `FieldsPreviewPage.tsx`) —
  living documentation for the component library itself, shown under the single `/ui-preview` route
  (`AGENTS.md` rule 18a). Not real product screens.
- **`src/pages/screens/`** — real, product-level application screens (actual ELMS functionality reachable from
  the sidebar). `GeneralSettingsPage.tsx` lives here now. **Every new business screen rebuilt from the old app
  (Stock On Hand, LMS Dashboard, Location Master, etc.) should be added under `src/pages/screens/`, not loose in
  `src/pages/`.** Remember the relative-import depth is one level deeper than the old flat `src/pages/*.tsx`
  files (e.g. `../../components/...`, not `../components/...`).

When adding a new screen here, also update: `src/routes/paths.ts` (add a `ROUTES.*` constant), `src/router.tsx`
(lazy import + `<Route>`, pointing at `./pages/screens/<Name>`), and `src/components/sidebar/navItems.ts` (if it
should appear in the sidebar/command palette/breadcrumbs).

## Quick orientation for a new chat session

- This is a **template-derived UI shell** with two real product screens so far (`GeneralSettingsPage`, plus the
  hidden `RulesPage`) and a large set of component-preview pages — most of the actual ELMS business functionality
  has **not been rebuilt yet**. Don't assume a screen exists; check `src/pages/screens/` and `src/routes/paths.ts`.
- Full stack/architecture rules: [AGENTS.md](AGENTS.md).
- Old-app behavioral reference: `../ELmsWatch` (see its `CLAUDE.md`).
- Run `npx tsc --noEmit -p tsconfig.app.json` and `npm run build` before considering any change done
  (`AGENTS.md`, "When adding a new component" step 7).
