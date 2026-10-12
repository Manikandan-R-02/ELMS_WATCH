import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  Command,
  Gauge,
  Layers,
  MessageSquareWarning,
  Palette,
  Plug,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
  Type,
} from "lucide-react";
import { Card } from "../components/cards/Card";
import { StatCard } from "../components/charts/StatCard";
import { Accordion, type AccordionItem } from "../components/common/Accordion";
import { Logo } from "../components/common/Logo";
import { CodeBlock, InlineCode } from "../components/common/CodeBlock";
import { TextButton } from "../components/buttons/TextButton";
import { useCommandPaletteStore } from "../store/commandPaletteStore";
import { ROUTES } from "../routes/paths";
import { uiPreviewCategories } from "./uiPreviewCategories";

const STATS = [
  { label: "Component categories", value: String(uiPreviewCategories.length), icon: Layers, tone: "brand" as const },
  { label: "Action button presets", value: "27", icon: SlidersHorizontal, tone: "violet" as const },
  { label: "Accent colors", value: "17", icon: Palette, tone: "amber" as const },
  { label: "Feedback presets", value: "9", icon: MessageSquareWarning, tone: "emerald" as const },
];

export function OverviewPage() {
  const openCommandPalette = useCommandPaletteStore((s) => s.setOpen);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[var(--app-radius)] bg-gradient-to-r from-brand-800 to-brand-600 p-8 text-white sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-white/10" />
        <div className="relative">
          <Logo variant="white" className="h-8 w-auto object-contain" />
          <h1 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
            The shared component library for every SCM screen.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-base">
            Vite + React + TypeScript + Tailwind CSS v4 + Zustand + Axios. Every field, button, table, modal, and
            chart your team needs is already built, themed, and documented — browse a category or read the manual
            below before building something new.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to={ROUTES.uiPreview}>
              <TextButton variant="outline" className="border-white/40 bg-white text-brand-700 hover:bg-white/90">
                Browse components
              </TextButton>
            </Link>
            <TextButton
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
              onClick={() => document.getElementById("user-manual")?.scrollIntoView({ behavior: "smooth" })}
            >
              Read the user manual
            </TextButton>
            <button
              onClick={() => openCommandPalette(true)}
              className="flex items-center gap-1.5 text-xs text-white/70 transition hover:text-white"
            >
              <Command className="h-3.5 w-3.5" />
              or press <kbd className="rounded border border-white/30 px-1.5 py-0.5 font-mono">⌘K</kbd> to jump anywhere
            </button>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} tone={s.tone} />
        ))}
      </div>

      {/* Component categories */}
      <div>
        <h2 className="text-section-title">Component categories</h2>
        <p className="text-body-sm mt-1">
          Every category below is live inside <InlineCode>UI Preview</InlineCode> — interact with the real
          components, not screenshots. Each one also documents its own import path and props.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {uiPreviewCategories.map((category) => (
            <Link key={category.id} to={`${ROUTES.uiPreview}?tab=${category.id}`}>
              <Card hoverable className="h-full">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    <category.icon className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-300" />
                </div>
                <h3 className="text-card-title mt-3">{category.label}</h3>
                <p className="text-body-sm mt-1">{category.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* User manual */}
      <div id="user-manual" className="scroll-mt-20">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          <h2 className="text-section-title">User manual</h2>
        </div>
        <p className="text-body-sm mt-1">
          The conventions every screen should follow. The full, enforceable ruleset also lives in{" "}
          <InlineCode>AGENTS.md</InlineCode> at the project root — point your AI coding assistant at it.
        </p>
        <Card className="mt-4" padded={false}>
          <Accordion className="px-5" defaultOpen={["getting-started"]} items={MANUAL_ITEMS} />
        </Card>
      </div>
    </div>
  );
}

const MANUAL_ITEMS: AccordionItem[] = [
  {
    id: "getting-started",
    title: "Getting started",
    icon: <Plug className="h-4 w-4" />,
    content: (
      <div className="space-y-2">
        <p>Install dependencies and start the dev server:</p>
        <CodeBlock code={"npm install\nnpm run dev"} language="bash" />
        <p>
          Every preset component is exported from its category's <InlineCode>index.ts</InlineCode> (e.g.{" "}
          <InlineCode>src/components/buttons</InlineCode>) — import from there rather than reaching into individual
          files. Each preview page also has its own <strong>"Import &amp; props"</strong> panel under every demo
          (click to expand) with the exact import statement and a props table — copy it directly instead of
          guessing prop names.
        </p>
      </div>
    ),
  },
  {
    id: "theming",
    title: "Theming & appearance",
    icon: <Palette className="h-4 w-4" />,
    content: (
      <div className="space-y-2">
        <p>
          Open the appearance drawer (gear icon in the header) to change theme mode, direction, accent color,
          layout type, container width, sidebar type, card style, and corner radius — every change applies
          instantly across the whole app.
        </p>
        <p>
          Theme mode defaults to <InlineCode>system</InlineCode> (follows the OS light/dark preference) until a
          user picks one explicitly. Accent color defaults to blue.
        </p>
        <p>
          <strong>For developers:</strong> use <InlineCode>bg-brand-*</InlineCode> /{" "}
          <InlineCode>text-brand-*</InlineCode> / <InlineCode>border-brand-*</InlineCode> for anything that should
          follow the chosen accent color — never hardcode a hex or a fixed Tailwind color name for it. Style both
          themes with the <InlineCode>dark:</InlineCode> variant directly; never branch on an{" "}
          <InlineCode>isDark</InlineCode> boolean.
        </p>
      </div>
    ),
  },
  {
    id: "buttons",
    title: "Buttons & standard actions",
    icon: <SlidersHorizontal className="h-4 w-4" />,
    content: (
      <div className="space-y-2">
        <p>
          Nine standard actions (Add, List, View, Modify, Bulk Upload, Save, Refresh, Cancel, Delete) each have a
          ready-made, consistently colored preset in all three button families:
        </p>
        <CodeBlock
          language="tsx"
          code={"<PlusSlideButton />   // icon-first, hover-expands — table/row actions\n<PlusTextButton />    // icon + always-visible label — toolbars, forms\n<PlusRoundedButton /> // icon-only, fully rounded — dense toolbars"}
        />
        <p>
          Every preset still accepts <InlineCode>tone</InlineCode>, <InlineCode>label</InlineCode>,{" "}
          <InlineCode>icon</InlineCode>, <InlineCode>variant</InlineCode>, and <InlineCode>size</InlineCode> to
          override for a one-off screen. The shared color/icon/label config lives in{" "}
          <InlineCode>src/components/buttons/actionConfig.tsx</InlineCode> — change it there once, not per
          component.
        </p>
      </div>
    ),
  },
  {
    id: "fields",
    title: "Forms & fields",
    icon: <Type className="h-4 w-4" />,
    content: (
      <div className="space-y-2">
        <p>
          <InlineCode>TextInput</InlineCode>, <InlineCode>TextArea</InlineCode>, and{" "}
          <InlineCode>PasswordInput</InlineCode> pass <InlineCode>maxLength</InlineCode>/
          <InlineCode>minLength</InlineCode> straight through to the native input — always set sensible bounds.{" "}
          <InlineCode>NumberInput</InlineCode> blocks non-digit keystrokes instead of showing +/- steppers, and
          takes its own <InlineCode>maxLength</InlineCode> (digit count) plus <InlineCode>min</InlineCode>/
          <InlineCode>max</InlineCode> for value clamping.
        </p>
        <p>
          <InlineCode>PasswordInput</InlineCode> includes a visibility toggle and a live strength meter (
          <InlineCode>{'showStrength={false}'}</InlineCode> to hide it, e.g. on a login form).
        </p>
        <p>
          Every field accepts <InlineCode>containerClassName</InlineCode>/<InlineCode>containerStyle</InlineCode> to
          size the field's wrapper, and a plain <InlineCode>className</InlineCode>/<InlineCode>style</InlineCode>{" "}
          for the input itself.
        </p>
      </div>
    ),
  },
  {
    id: "feedback",
    title: "Feedback — modals, toasts & loading",
    icon: <MessageSquareWarning className="h-4 w-4" />,
    content: (
      <div className="space-y-2">
        <p>
          Use a <strong>toast</strong> (<InlineCode>showSuccessToast</InlineCode> /{" "}
          <InlineCode>showErrorToast</InlineCode> / <InlineCode>showWarningToast</InlineCode> /{" "}
          <InlineCode>showInfoToast</InlineCode>) for non-blocking feedback, and a <strong>modal</strong> preset (
          <InlineCode>SuccessModal</InlineCode>, <InlineCode>FailureModal</InlineCode>,{" "}
          <InlineCode>WarningModal</InlineCode>, <InlineCode>InfoModal</InlineCode>,{" "}
          <InlineCode>SessionModal</InlineCode>, <InlineCode>ConfirmModal</InlineCode>) when the user must
          acknowledge or decide something. Both share the same solid, dark-toned color language: green success, red
          failure, yellow warning, blue info.
        </p>
        <p>
          <InlineCode>GlobalLoader</InlineCode> shows automatically for every API call (via{" "}
          <InlineCode>axiosClient</InlineCode>) and every route change — you rarely need to trigger it manually. For
          a section-scoped loading state, drop in <InlineCode>{"<LocationLoader />"}</InlineCode> inline.
        </p>
      </div>
    ),
  },
  {
    id: "api",
    title: "API layer",
    icon: <Plug className="h-4 w-4" />,
    content: (
      <div className="space-y-2">
        <p>
          All requests go through <InlineCode>src/api/axiosClient.ts</InlineCode> so the global loader and
          401/session-expiry handling stay centralized.
        </p>
        <CodeBlock
          language="tsx"
          code={"// CRUD resource\nconst useOrders = createResourceStore<Order>('/orders');\n\n// one-off call\nconst { run, loading, data } = useApiRequest(fetchSomething);"}
        />
      </div>
    ),
  },
  {
    id: "typography",
    title: "Typography & layout",
    icon: <Type className="h-4 w-4" />,
    content: (
      <div className="space-y-2">
        <p>
          The whole app renders in a single typeface (Inter) with a categorized type scale defined once in{" "}
          <InlineCode>src/index.css</InlineCode>: <InlineCode>text-page-title</InlineCode>,{" "}
          <InlineCode>text-section-title</InlineCode>, <InlineCode>text-card-title</InlineCode>,{" "}
          <InlineCode>text-body</InlineCode>, <InlineCode>text-body-sm</InlineCode>,{" "}
          <InlineCode>text-caption</InlineCode>, <InlineCode>text-label</InlineCode>,{" "}
          <InlineCode>text-eyebrow</InlineCode>. Use these instead of ad hoc{" "}
          <InlineCode>text-sm text-slate-500</InlineCode>-style combinations so headings and body copy stay
          consistent everywhere. Scrollbars are also global and deliberately thin/neutral — don't override them
          locally.
        </p>
      </div>
    ),
  },
  {
    id: "advanced",
    title: "Advanced features in this template",
    icon: <Rocket className="h-4 w-4" />,
    content: (
      <div className="space-y-3">
        <p>A few product-grade patterns are already wired in, beyond the base component set:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Command palette</strong> (<InlineCode>Ctrl/Cmd+K</InlineCode>, or the "Jump to..." button in the
            header) — instant fuzzy navigation between every screen, the same pattern used by Linear, Vercel, and
            GitHub. See <InlineCode>src/components/common/CommandPalette.tsx</InlineCode>.
          </li>
          <li>
            <strong>Breadcrumbs</strong> — auto-derived from the current route, mounted once in{" "}
            <InlineCode>AppLayout</InlineCode>. No per-page wiring; add a route to <InlineCode>navItems</InlineCode>{" "}
            and its breadcrumb exists automatically.
          </li>
          <li>
            <strong>Copy-to-clipboard code blocks</strong> — every snippet in this manual and in each preview
            page's "Import &amp; props" panel has a hover-to-reveal copy button (
            <InlineCode>src/components/common/CodeBlock.tsx</InlineCode>).
          </li>
          <li>
            <strong>Self-documenting preview pages</strong> — each demo has a collapsible "Import &amp; props"
            reference (<InlineCode>ComponentApi</InlineCode> in <InlineCode>src/pages/PreviewSection.tsx</InlineCode>
            ) so the live example and the API reference never drift apart.
          </li>
          <li>
            <strong>Accordion</strong> — this manual itself (<InlineCode>src/components/common/Accordion.tsx</InlineCode>
            ) is a reusable component, not one-off markup — use it for FAQs, settings groups, or any other
            progressive-disclosure content.
          </li>
        </ul>
        <p className="text-body-sm">
          Auth/session is wired end to end now (<InlineCode>src/store/authStore.ts</InlineCode>,{" "}
          <InlineCode>RequireAuth.tsx</InlineCode>) — see the Security section below. Still worth adding: hooking
          the 401 <InlineCode>auth:session-expired</InlineCode> event up to <InlineCode>SessionModal</InlineCode>{" "}
          instead of an immediate redirect, and a skeleton-loader variant for content that streams in
          progressively rather than blocking behind the global loader.
        </p>
      </div>
    ),
  },
  {
    id: "performance",
    title: "Performance",
    icon: <Gauge className="h-4 w-4" />,
    content: (
      <div className="space-y-3">
        <p>Concrete, measured optimizations already in this template — not just advice:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Route-level code splitting.</strong> Every page is <InlineCode>React.lazy</InlineCode>-loaded
            in <InlineCode>src/router.tsx</InlineCode>, wrapped in one <InlineCode>{"<Suspense>"}</InlineCode> with
            the truck loader as the fallback. Before: one ~880&nbsp;kB bundle loaded on every visit. After: a
            ~30&nbsp;kB entry chunk, and each page (plus whatever it needs — e.g. recharts) only downloads when a
            user actually navigates there.
          </li>
          <li>
            <strong>Vendor chunk splitting</strong> (<InlineCode>vite.config.ts</InlineCode>,{" "}
            <InlineCode>manualChunks</InlineCode>) — React/React Router, general utilities (axios, zustand,
            date-fns), and recharts each build into their own chunk. recharts alone is ~350&nbsp;kB (~93&nbsp;kB
            gzipped) and now only loads for the one page that uses it, instead of shipping to every visitor.
          </li>
          <li>
            <strong>Debounced search</strong> (<InlineCode>src/hooks/useDebouncedValue.ts</InlineCode>) — the
            Table page's search box waits 250ms after the user stops typing before filtering/would-fire an API
            call, instead of doing it on every keystroke. Use this hook any time a text input drives a filter or a
            network request.
          </li>
          <li>
            <strong>Memoized chart cards</strong> (<InlineCode>React.memo</InlineCode> on{" "}
            <InlineCode>LineAreaChartCard</InlineCode>/<InlineCode>BarChartCard</InlineCode>/
            <InlineCode>PieChartCard</InlineCode>) — recharts re-renders (SVG layout + animation) are relatively
            expensive; memoizing skips that work when a parent re-renders for an unrelated reason but this card's
            own data hasn't changed.
          </li>
          <li>
            <strong>The global loader batches, not spams.</strong> <InlineCode>loaderStore</InlineCode> tracks a
            request counter, not a boolean, so N concurrent API calls show one loader that clears only once all of
            them finish — no flicker from calls resolving at different times.
          </li>
        </ul>
        <p className="text-body-sm">
          Worth adding next: virtualizing <InlineCode>Table</InlineCode> for very large row counts (react-window
          or similar — the current implementation renders every row in the current page, which is fine at the
          typical 10–100 rows a paginated API returns, but not for an unpaginated 10,000-row grid).
        </p>
      </div>
    ),
  },
  {
    id: "security",
    title: "Security",
    icon: <ShieldCheck className="h-4 w-4" />,
    content: (
      <div className="space-y-3">
        <p>What's already hardened, and what's deliberately left as a decision for your backend:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>XSS is React's default posture</strong> — JSX escapes all interpolated values automatically.
            This template contains zero <InlineCode>dangerouslySetInnerHTML</InlineCode> and zero{" "}
            <InlineCode>eval</InlineCode>; keep it that way. If you ever need to render server-provided HTML,
            sanitize it (e.g. DOMPurify) immediately before the one spot that needs it — never trust it by default.
          </li>
          <li>
            <strong>Content-Security-Policy</strong> (<InlineCode>index.html</InlineCode>) restricts script
            execution to same-origin bundles only — blocks the classic "inject a &lt;script&gt; tag" XSS payload
            even if one slipped through — and whitelists only Google Fonts for styles/fonts. Add your API's origin
            to <InlineCode>connect-src</InlineCode> once you have one.
          </li>
          <li>
            <strong>CSRF protection is wired but dormant</strong> — <InlineCode>axiosClient</InlineCode> sets{" "}
            <InlineCode>xsrfCookieName</InlineCode>/<InlineCode>xsrfHeaderName</InlineCode>, the standard
            double-submit-cookie pattern. It does nothing until your backend sets an{" "}
            <InlineCode>XSRF-TOKEN</InlineCode> cookie, at which point axios starts echoing it back automatically.
          </li>
          <li>
            <strong>Expired tokens are dropped, not kept around.</strong> On a 401,{" "}
            <InlineCode>axiosClient</InlineCode> clears the stored token before dispatching{" "}
            <InlineCode>auth:session-expired</InlineCode> — an old rejected token never lingers in storage.
          </li>
          <li>
            <strong>Field-level input constraints double as a defense layer.</strong>{" "}
            <InlineCode>NumberInput</InlineCode> rejects non-digit keystrokes outright (not just on submit), and
            every text field's <InlineCode>maxLength</InlineCode> caps payload size before it ever reaches a
            request body — cheap, real protection against malformed/oversized input, independent of your backend's
            own validation (which you still need — never trust the client alone).
          </li>
          <li>
            <strong>The auth token lives in sessionStorage only, never localStorage.</strong>{" "}
            <InlineCode>src/store/authStore.ts</InlineCode> reads the token from the login response body
            (<InlineCode>data.authToken</InlineCode>) and <InlineCode>axiosClient.ts</InlineCode> sends it as an{" "}
            <InlineCode>Authorization: Bearer</InlineCode> header on every call except login — no cookies. It is
            kept in a module variable mirrored to <InlineCode>sessionStorage</InlineCode> (its own key, never the
            zustand store), so a refresh keeps the session and closing the tab clears it. Anything running on the
            page can read <InlineCode>sessionStorage</InlineCode>, so the XSS rules above still matter. Only a
            non-sensitive <InlineCode>{"{ isLoggedIn, user }"}</InlineCode> shell is persisted with the profile.
          </li>
          <li>
            <strong>Routes are gated, not just hidden.</strong> <InlineCode>RequireAuth.tsx</InlineCode> wraps
            every authenticated route in <InlineCode>router.tsx</InlineCode> and redirects to{" "}
            <InlineCode>/login</InlineCode> when there's no session — previously every preview page was reachable
            by URL with no login at all.
          </li>
        </ul>
        <p className="text-body-sm">
          Out of scope for a frontend template, but worth knowing: a meta-tag CSP can't set{" "}
          <InlineCode>X-Frame-Options</InlineCode>/<InlineCode>frame-ancestors</InlineCode> or{" "}
          <InlineCode>Strict-Transport-Security</InlineCode> — those must be real HTTP response headers from your
          server or CDN. Rate limiting, request signing, and server-side authorization checks all belong on the
          backend regardless of what the client does.
        </p>
      </div>
    ),
  },
];
