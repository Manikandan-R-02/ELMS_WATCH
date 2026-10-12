/** The operating system, from the modern `userAgentData` where the browser has it, otherwise from the user-agent text. */
function platformName(ua: string): string {
  const hinted = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform;
  if (hinted) return hinted;
  if (/windows/i.test(ua)) return "Windows";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/mac os|macintosh/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Unknown";
}

/**
 * Device/browser fingerprinting for the login-credential-service payload — the
 * real backend (see authStore.ts) logs `browser`/`ipV4Address`/`ipAddress` on
 * every login attempt, matching the old ElmsWatch login page's behavior.
 */

export function detectBrowserInfo(): string {
  const ua = navigator.userAgent;
  let name = "Unknown";
  if (/chrome|chromium|crios/i.test(ua)) name = "Chrome";
  else if (/firefox|fxios/i.test(ua)) name = "Firefox";
  else if (/safari/i.test(ua)) name = "Safari";
  else if (/opr\//i.test(ua)) name = "Opera";
  else if (/edg/i.test(ua)) name = "Edge";
  else if (/trident/i.test(ua)) name = "Internet Explorer";
  return `${name} (${platformName(ua)})`;
}

/**
 * Best-effort public IP lookup via ipify — same third-party the old login page used. Falls back
 * to "Unknown" on any failure. `login()` (authStore.ts) awaits this *before* calling the real
 * login endpoint, so a network with no route to the public internet (a LAN-only deployment
 * accessed via a private IP like 192.168.x.x, for example) must not be able to hang this call —
 * without a request has no way to time out on its own and would silently block the actual login
 * call from ever firing. 3s is generous for a same-continent DNS+TLS+response round trip while
 * still keeping the delay imperceptible on a real failure.
 */
export async function fetchClientIp(): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch("https://api.ipify.org?format=json", { signal: controller.signal });
    const data: { ip?: string } = await response.json();
    return data.ip ?? "Unknown";
  } catch {
    return "Unknown";
  } finally {
    clearTimeout(timeout);
  }
}
