/**
 * Month Closing's single HTTP call — confirmed by reading the old ElmsWatch app's
 * `views/admin/monthClosing/index.jsx`. Unlike every other screen's endpoint, this one is on a
 * *different* host than the `api-gateway` every other screen calls — a separate internal service,
 * not a typo. Its address comes from `VITE_MONTH_CLOSING_URL` (the server's base, e.g.
 * `http://103.73.189.202:5000`) instead of being hardcoded here, so the build also allows that
 * origin in the page's Content-Security-Policy (see `build/cspPlugin.ts`) — a literal here would
 * be blocked by the browser. The service is plain `http://`, not `https://`: a real backend/infra
 * concern (flagged here, not something the frontend can fix by itself). Still routed through
 * `axiosClient` (an absolute `url` argument overrides axios's configured `baseURL`) so it keeps
 * the shared loader/interceptor behavior.
 */
import { safeMessage } from "../../../lib/safeMessage";
import axiosClient from "../../../api/axiosClient";
import { isAxiosError } from "axios";
import type { MonthCloseApiResponse, MonthCloseResult } from "./data";

/** `text` without any `/` at its end (a loop, not a regex: `/\/+$/` backtracks badly on long runs of slashes). */
function withoutTrailingSlashes(text: string): string {
  let end = text.length;
  while (end > 0 && text[end - 1] === "/") end--;
  return text.slice(0, end);
}

export async function closeCurrentMonth(): Promise<MonthCloseResult> {
  const base = withoutTrailingSlashes((import.meta.env.VITE_MONTH_CLOSING_URL ?? "").trim());
  if (!base) return { ok: false, message: "Month closing isn't configured for this environment (VITE_MONTH_CLOSING_URL)." };

  try {
    const { data } = await axiosClient.post<MonthCloseApiResponse>(
      `${base}/pull/month-closing`,
      {},
      { headers: { Accept: "application/json" }, keepOnNavigation: true }
    );

    const ok = data?.status === "ok" && (!data.eiis_period_update || data.eiis_period_update.status === "ok");
    if (!ok) {
      return { ok: false, message: safeMessage(data?.message || data?.error, "Month closing failed. Please try again.") };
    }
    return { ok: true, newPeriod: data?.new_lms_period };
  } catch (err) {
    if (isAxiosError<MonthCloseApiResponse>(err)) {
      const body = err.response?.data;
      return { ok: false, message: safeMessage(body?.error || body?.message, "Couldn't reach the server. Please try again.") };
    }
    return { ok: false, message: safeMessage(err instanceof Error ? err.message : undefined, "Couldn't reach the server. Please try again.") };
  }
}
