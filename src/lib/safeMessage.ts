/**
 * Keeps server and database internals off the screen. Every message that originates outside the app
 * (an API's `message`, an axios error, a thrown backend string) goes through `safeMessage` before a user
 * can read it: a short, plain business message ("No data for this period") passes through unchanged, but
 * anything that looks technical — SQL/Oracle/JDBC text, exception names, stack frames, HTTP status text,
 * HTML, JSON, URLs — is replaced by a neutral message. The original is still logged to the console for
 * developers.
 */
export const GENERIC_ERROR = "Something went wrong. Please try again, or contact your administrator if it keeps happening.";
export const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again.";
export const TIMEOUT_ERROR = "The server took too long to respond. Please try again.";

/** Longest message shown as-is; anything longer is treated as a dump rather than a sentence. */
const MAX_MESSAGE_LENGTH = 160;

/**
 * What marks a message as technical: whole words from the database / server / HTTP world (split over several
 * small patterns so each one stays readable), then shapes that give technical text away — HTML tags, braces
 * (JSON), stack frames, URLs and "error code".
 */
const TECHNICAL_PATTERNS: RegExp[] = [
  /\b(?:sql\w*|ora-\d+|jdbc|hibernate|jpa|exception|java|javax)\b/i,
  /\b(?:stack ?trace|nullpointer|springframework|constraint|deadlock|database|db)\b/i,
  /\b(?:query|syntax|status code|network error|timeout|timed out|axios|cors)\b/i,
  /\b(?:econn\w*|enotfound|errno|socket|tomcat|nginx|gateway|internal server error)\b/i,
  /\b(?:bad gateway|service unavailable|undefined|null|nan)\b/i,
  /\b(?:org\.\w+|com\.\w+\.\w+)\b/i,
  /<\/?[a-z!][^>]*>/i,
  /[{}]/,
  /\bat [\w.$]+\(/,
  /https?:\/\//i,
  /\berror code\b/i,
];

export function safeMessage(raw: unknown, fallback: string = GENERIC_ERROR): string {
  if (typeof raw !== "string") return fallback;
  const text = raw.trim();
  if (!text) return fallback;
  if (text.length > MAX_MESSAGE_LENGTH || TECHNICAL_PATTERNS.some((pattern) => pattern.test(text))) {
    console.error("Hidden technical message:", text);
    return fallback;
  }
  return text;
}
