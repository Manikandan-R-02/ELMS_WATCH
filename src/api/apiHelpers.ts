/**
 * Small request-building helpers shared by every screen's `api.ts` that talks to the real
 * ElmsWatch gateway (`location-summary-service`, `lms-dashboard-watch-service`, …) — both
 * expect the same `DD-MM-YYYY` date format and the same `userId`/`userType` fields lifted off
 * the logged-in user, so this lives in one place instead of being copy-pasted per screen.
 */
import { safeMessage } from "../lib/safeMessage";
import { format } from "date-fns";
import { useAuthStore } from "../store/authStore";

export function formatDateForApi(date: Date): string {
  return format(date, "dd-MM-yyyy");
}

/** `userId`/`userType` are only populated after a real (non-demo-fallback) login — see
 * `authStore.ts`'s login note on the gateway not yet being CORS-reachable from local dev. */
export function currentUserContext(): { userId: string; userType: number } {
  const user = useAuthStore.getState().user;
  return { userId: user?.userId ?? "", userType: user?.userType ?? 0 };
}

/** The new backend wraps every response in `{ success, message, data }`. */
export interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

/** Returns the envelope's `data`. `success: false` is a failure even on an HTTP 200, so it throws
 * the backend's own message — which `useApiRequest` then shows in the screen's error banner. */
export function unwrapEnvelope<T>(envelope: ApiEnvelope<T>): T | undefined {
  if (envelope.success === false) throw new Error(safeMessage(envelope.message));
  return envelope.data;
}

/**
 * For an endpoint whose NEW response shape hasn't been confirmed yet (Location Details, Location
 * Insight — only their service name has changed so far). Accepts both shapes:
 *  - the new `{ success, message, data: <payload> }` envelope → returns `data` (and throws the
 *    backend's message on `success: false`), or
 *  - the old bare payload → returns it unchanged.
 * Once an endpoint's real response is known, give it its own mapper (as Overall Summary and
 * Location Summary have) and stop using this.
 */
export function unwrapPayload<T extends object>(body: T | ApiEnvelope<T>): T {
  const envelope = body as ApiEnvelope<T>;
  if (envelope.success === false) throw new Error(safeMessage(envelope.message));
  if ("success" in envelope && envelope.data && typeof envelope.data === "object") return envelope.data;
  return body as T;
}

/** A list response in either shape: the new `{ success, data: [...] }` or the old `{ responseContents: [...] }`. */
export interface ListBody<T> {
  success?: boolean;
  message?: string;
  data?: T[];
  responseContents?: T[];
}

/** Same idea as `unwrapPayload`, for a list endpoint. */
export function listPayload<T>(body: ListBody<T>): T[] {
  if (body.success === false) throw new Error(safeMessage(body.message));
  return body.data ?? body.responseContents ?? [];
}

/** True for a failure worth retrying — the request timed out, the connection dropped, or the
 * server had a transient problem (5xx). False for anything that would fail again identically
 * (a 4xx — bad params, not found, unauthorized), where retrying just wastes the reader's time
 * before showing the same error. */
function isRetryableError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  if (code === "ERR_CANCELED") return false; // the person left the screen: nobody is waiting for this any more
  if (code === "ECONNABORTED" || code === "ERR_NETWORK") return true;
  const status = (err as { response?: { status?: number } })?.response?.status;
  return status === undefined || status >= 500;
}

/**
 * Retries a slow/heavy request instead of surfacing a timeout straight to the reader — some
 * reports (e.g. Daily PRJ's all-locations summary) are large enough that the gateway
 * occasionally needs a second attempt, and a bare "couldn't load" banner over data that would
 * have arrived a few seconds later is a worse experience than a slightly longer wait. Only
 * retries genuinely transient failures (see `isRetryableError`); a real 4xx (bad request,
 * unauthorized, …) fails immediately since trying again can't change the answer. Each attempt
 * gets a longer timeout than the last, and a short delay separates attempts so a struggling
 * backend gets a moment to recover instead of being hit again immediately.
 */
export async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 1500): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === attempts || !isRetryableError(err)) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw lastError;
}

/** Text for an API id or name: strings and numbers as text, anything else (null, objects) as the fallback. */
export function textOf(value: unknown, fallback = ""): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}
