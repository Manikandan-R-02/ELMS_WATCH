import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  POLICY_PLACEHOLDER,
  applyPolicyToHtml,
  applyPolicyToWebConfig,
  connectSrcDirective,
  connectSrcOrigins,
  contentSecurityPolicy,
  cspPlugin,
} from "./cspPlugin.ts";

const DEPLOYED_ENV = {
  VITE_API_BASE_URL: "http://103.39.133.98:8080/api-gateway",
  VITE_MONTH_CLOSING_URL: "http://103.73.189.202:5000",
};

describe("connectSrcOrigins", () => {
  it("allows the origin of every API address the app calls — never a path", () => {
    expect(connectSrcOrigins(DEPLOYED_ENV)).toEqual([
      "http://103.39.133.98:8080",
      "http://103.73.189.202:5000",
    ]);
  });

  it("reduces the gateway address (a path on one server — login and every other call) to that server's single origin", () => {
    expect(connectSrcOrigins({ VITE_API_BASE_URL: "http://103.39.133.98:8080/api-gateway" })).toEqual(["http://103.39.133.98:8080"]);
  });

  it("ignores blank, relative and invalid values", () => {
    expect(connectSrcOrigins({ VITE_API_BASE_URL: "/api-gateway", VITE_MONTH_CLOSING_URL: "not a url" })).toEqual([]);
    expect(connectSrcOrigins({})).toEqual([]);
  });

  it("ignores non-http schemes", () => {
    expect(connectSrcOrigins({ VITE_API_BASE_URL: "javascript:alert(1)", VITE_MONTH_CLOSING_URL: "ftp://example.com" })).toEqual([]);
  });

  it("adds extra origins from VITE_CSP_EXTRA_CONNECT_SRC", () => {
    expect(connectSrcOrigins({ VITE_CSP_EXTRA_CONNECT_SRC: "https://a.example.com:9000   https://b.example.com/path" })).toEqual([
      "https://a.example.com:9000",
      "https://b.example.com",
    ]);
  });
});

describe("connectSrcDirective", () => {
  it("is 'self', then the API origins, then the IP lookup", () => {
    expect(connectSrcDirective({ VITE_API_BASE_URL: "https://api.example.com/v1" })).toBe("'self' https://api.example.com https://api.ipify.org");
  });

  it("still allows the same origin and the IP lookup when nothing is configured", () => {
    expect(connectSrcDirective({})).toBe("'self' https://api.ipify.org");
  });
});

describe("contentSecurityPolicy", () => {
  it("carries the generated connect-src, so the deployed login server is allowed", () => {
    const policy = contentSecurityPolicy(DEPLOYED_ENV);
    expect(policy).toContain("connect-src 'self' http://103.39.133.98:8080 http://103.73.189.202:5000 https://api.ipify.org;");
  });

  it("keeps the rest of the policy the app relies on", () => {
    const policy = contentSecurityPolicy(DEPLOYED_ENV);
    for (const part of ["default-src 'self'", "script-src 'self'", "worker-src 'self' blob:", "object-src 'none'", "base-uri 'self'", "form-action 'self'"]) {
      expect(policy).toContain(part);
    }
  });

  it("adds frame-ancestors only for the HTTP header (a <meta> policy ignores it)", () => {
    expect(contentSecurityPolicy(DEPLOYED_ENV)).not.toContain("frame-ancestors");
    expect(contentSecurityPolicy(DEPLOYED_ENV, { frameAncestors: true })).toContain("frame-ancestors 'none'");
  });
});

describe("one policy for the page and the server header", () => {
  const html = `<meta http-equiv="Content-Security-Policy" content="${POLICY_PLACEHOLDER}" />`;
  const webConfig = `<add name="Content-Security-Policy" value="${POLICY_PLACEHOLDER}" />`;

  it("puts the same connect-src into index.html and into the web.config header", () => {
    const connectSrc = /connect-src [^;]*;/;
    const inHtml = connectSrc.exec(applyPolicyToHtml(html, DEPLOYED_ENV))?.[0];
    const inHeader = connectSrc.exec(applyPolicyToWebConfig(webConfig, DEPLOYED_ENV))?.[0];
    expect(inHtml).toBeDefined();
    expect(inHeader).toBe(inHtml);
  });

  it("leaves no placeholder behind", () => {
    expect(applyPolicyToHtml(html, DEPLOYED_ENV)).not.toContain(POLICY_PLACEHOLDER);
    expect(applyPolicyToWebConfig(webConfig, DEPLOYED_ENV)).not.toContain(POLICY_PLACEHOLDER);
  });

  it("index.html and public/web.config hold only the placeholder — no hand-written policy to drift", () => {
    for (const file of ["../index.html", "../public/web.config"]) {
      const text = readFileSync(fileURLToPath(new URL(file, import.meta.url)), "utf-8");
      expect(text, file).toContain(POLICY_PLACEHOLDER);
      expect(text, `${file} must not contain a literal connect-src`).not.toMatch(/connect-src\s+['a-z]/i);
    }
  });
});

describe("cspPlugin", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  type PluginHooks = {
    configResolved: (config: { root: string; build: { outDir: string } }) => void;
    closeBundle: () => void;
    transformIndexHtml: { handler: (html: string) => string };
  };
  const hooks = (env: Record<string, string>) => cspPlugin(env) as unknown as PluginHooks;

  it("fills the page's policy", () => {
    const html = hooks({ VITE_API_BASE_URL: "http://10.0.0.5:8080/api-gateway" }).transformIndexHtml.handler(`content="${POLICY_PLACEHOLDER}"`);
    expect(html).toContain("connect-src 'self' http://10.0.0.5:8080 https://api.ipify.org;");
  });

  it("rewrites web.config in the build output after it was copied there", () => {
    const root = mkdtempSync(join(tmpdir(), "csp-plugin-"));
    dirs.push(root);
    mkdirSync(join(root, "dist"));
    const file = join(root, "dist", "web.config");
    writeFileSync(file, `<add name="Content-Security-Policy" value="${POLICY_PLACEHOLDER}" />`);

    const plugin = hooks(DEPLOYED_ENV);
    plugin.configResolved({ root, build: { outDir: "dist" } });
    plugin.closeBundle();

    const result = readFileSync(file, "utf-8");
    expect(result).not.toContain(POLICY_PLACEHOLDER);
    expect(result).toContain("http://103.39.133.98:8080");
    expect(result).toContain("frame-ancestors 'none'");
  });

  it("does nothing when the build has no web.config", () => {
    const root = mkdtempSync(join(tmpdir(), "csp-plugin-"));
    dirs.push(root);
    const plugin = hooks(DEPLOYED_ENV);
    plugin.configResolved({ root, build: { outDir: "dist" } });
    expect(() => plugin.closeBundle()).not.toThrow();
  });
});
