/**
 * Saves a file that a backend call produces, for the Excel exports whose response is not documented. A
 * `responseType: "blob"` request hides a JSON reply inside the blob, so this looks at what came back instead
 * of blindly saving it as a workbook (which would leave the reader with a broken `.xlsx`):
 *
 *  - a real file is saved under the given filename;
 *  - a JSON reply with `success: false` (or an HTTP error whose body is JSON) throws the backend's own message;
 *  - a JSON reply that carries a file link (`download_url` / `downloadUrlPath`, top level or inside `data`)
 *    opens that link instead;
 *  - an empty file, or JSON with neither a link nor a message, throws a plain explanation.
 *
 * Used by User Log's and Consumption Analysis's Excel downloads.
 */
import { safeMessage } from "../lib/safeMessage";
import { isAxiosError } from "axios";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** The part of an axios response this needs. */
export interface FileResponse {
  data: Blob;
  headers?: Record<string, unknown>;
}

interface JsonReply {
  success?: boolean;
  message?: string;
  error?: string;
  download_url?: string;
  downloadUrlPath?: string;
  data?: unknown;
}

/** The file link of a JSON reply, if it carries one. */
function linkOf(reply: JsonReply): string | undefined {
  const inner = reply.data && typeof reply.data === "object" ? (reply.data as JsonReply) : undefined;
  const asString = typeof reply.data === "string" && /^(https?:)?\//.test(reply.data) ? reply.data : undefined;
  return reply.download_url || reply.downloadUrlPath || inner?.download_url || inner?.downloadUrlPath || asString || undefined;
}

function parseJson(text: string): JsonReply | null {
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === "object" ? (parsed as JsonReply) : null;
  } catch {
    return null;
  }
}

function isTextual(type: string): boolean {
  return type.includes("json") || type.startsWith("text/");
}

function saveAs(href: string, filename: string, revoke: boolean) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  if (revoke) URL.revokeObjectURL(href);
}

/** The backend's own message out of an error response that arrived as a blob. */
async function blobErrorMessage(err: unknown): Promise<string | null> {
  if (!isAxiosError(err) || !(err.response?.data instanceof Blob)) return null;
  const reply = parseJson(await err.response.data.text());
  return safeMessage(reply?.message || reply?.error, "") || null;
}

/** Runs the request (which must ask for `responseType: "blob"`) and saves, links or reports what came back. */
export async function requestFile(request: () => Promise<FileResponse>, filename: string): Promise<void> {
  let response: FileResponse;
  try {
    response = await request();
  } catch (err) {
    const message = await blobErrorMessage(err);
    if (message) throw new Error(message);
    throw err;
  }

  const blob = response.data;
  const headerType = response.headers?.["content-type"];
  const type = (typeof headerType === "string" ? headerType : blob.type).toLowerCase();

  if (isTextual(type)) {
    const reply = parseJson(await blob.text());
    if (reply?.success === false) throw new Error(safeMessage(reply.message || reply.error, "The export failed. Please try again."));
    const link = reply ? linkOf(reply) : undefined;
    if (link) {
      saveAs(link, filename, false);
      return;
    }
    throw new Error(safeMessage(reply?.message || reply?.error, "The server did not return a file. Please try again."));
  }

  if (blob.size === 0) throw new Error("The server returned an empty file.");
  const file = new Blob([blob], { type: XLSX_TYPE });
  saveAs(URL.createObjectURL(file), filename, true);
}
