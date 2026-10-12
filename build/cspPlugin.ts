import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

/**
 * The app's Content-Security-Policy, defined ONCE and written to both places that enforce it:
 *  - the `<meta http-equiv="Content-Security-Policy">` tag in `index.html`, and
 *  - the `Content-Security-Policy` response header in IIS's `web.config` (copied into the build
 *    from `public/web.config`).
 * A browser enforces every policy it receives, so if the two ever disagree the stricter one wins
 * and API calls are blocked even though the other allows them — which is exactly how a stale
 * hand-written header in `web.config` blocked login after deployment. Both files now hold the
 * placeholder `__CSP_POLICY__`, filled in here at build time.
 *
 * `connect-src` is built from the SAME `VITE_*` environment values the app bundle is built with,
 * so the policy and the code can never name different servers. It lists origins
 * (`scheme://host:port`), never paths: CSP path matching is exact unless the path ends in "/",
 * and the app calls several paths on one server (`/api-gateway/...` for data,
 * `/login-credential-service/...` for login/logout), so a path-scoped entry for one silently
 * blocks the other.
 */

export const POLICY_PLACEHOLDER = "__CSP_POLICY__";

/** Environment variables whose values are API addresses the app really calls from the browser. */
export const API_URL_ENV_KEYS = [
  "VITE_API_BASE_URL",
  "VITE_MONTH_CLOSING_URL",
] as const;

/** Always allowed: the public-IP lookup the login request fingerprint uses (`lib/deviceInfo.ts`). */
const ALWAYS_ALLOWED = ["https://api.ipify.org"];

type Env = Record<string, string | undefined>;

/** `scheme://host:port` of every http(s) address in the env. A blank value, a relative one such
 * as "/api-gateway" (same origin, already covered by 'self') or garbage is ignored. Extra origins
 * can be added with `VITE_CSP_EXTRA_CONNECT_SRC` (space separated). */
export function connectSrcOrigins(env: Env): string[] {
  const origins = new Set<string>();
  const add = (raw: string | undefined) => {
    const value = raw?.trim();
    if (!value) return;
    try {
      const url = new URL(value);
      if (url.protocol === "http:" || url.protocol === "https:") origins.add(url.origin);
    } catch {
      // Not an absolute URL — nothing to allow.
    }
  };
  for (const key of API_URL_ENV_KEYS) add(env[key]);
  for (const extra of (env.VITE_CSP_EXTRA_CONNECT_SRC ?? "").split(/\s+/)) add(extra);
  return [...origins];
}

/** The `connect-src` value, e.g. `'self' https://api.example.com http://10.0.0.5:8080 https://api.ipify.org`. */
export function connectSrcDirective(env: Env): string {
  return ["'self'", ...connectSrcOrigins(env), ...ALWAYS_ALLOWED].join(" ");
}

/**
 * The whole policy. `frameAncestors` is only meaningful as an HTTP header — a `<meta>` policy
 * ignores it (and logs a console warning) — so it is added for the `web.config` header only.
 */
export function contentSecurityPolicy(env: Env, { frameAncestors = false }: { frameAncestors?: boolean } = {}): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self'",
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    `connect-src ${connectSrcDirective(env)}`,
    "object-src 'none'",
    ...(frameAncestors ? ["frame-ancestors 'none'"] : []),
    "base-uri 'self'",
    "form-action 'self'",
  ];
  return `${directives.join("; ")};`;
}

/** Fills the placeholder in `web.config`'s header value (which also carries `frame-ancestors`). */
export function applyPolicyToWebConfig(xml: string, env: Env): string {
  return xml.replaceAll(POLICY_PLACEHOLDER, contentSecurityPolicy(env, { frameAncestors: true }));
}

/** Fills the placeholder in `index.html`'s meta tag, in the dev server and in the build. */
export function applyPolicyToHtml(html: string, env: Env): string {
  return html.replaceAll(POLICY_PLACEHOLDER, contentSecurityPolicy(env));
}

export function cspPlugin(env: Env): Plugin {
  let outDir = "";
  return {
    name: "csp-policy",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    transformIndexHtml: {
      order: "pre",
      handler: (html) => applyPolicyToHtml(html, env),
    },
    // `public/web.config` is copied into the build untouched, so fill its placeholder afterwards.
    closeBundle() {
      const webConfig = resolve(outDir, "web.config");
      if (!existsSync(webConfig)) return;
      const xml = readFileSync(webConfig, "utf-8");
      if (xml.includes(POLICY_PLACEHOLDER)) writeFileSync(webConfig, applyPolicyToWebConfig(xml, env), "utf-8");
    },
  };
}
