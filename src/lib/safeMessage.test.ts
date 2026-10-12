import { describe, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { GENERIC_ERROR, NETWORK_ERROR, TIMEOUT_ERROR, safeMessage } from "./safeMessage";
import { toApiError } from "../api/types";

vi.spyOn(console, "error").mockImplementation(() => {});

describe("safeMessage", () => {
  it("lets a short business message through", () => {
    expect(safeMessage("No data available for the selected period.")).toBe("No data available for the selected period.");
  });

  it.each([
    "ORA-00942: table or view does not exist",
    "java.sql.SQLException: Connection refused",
    "could not execute statement; SQL [n/a]; constraint [uk_user]",
    "NullPointerException at com.esfita.Service.run(Service.java:42)",
    "Request failed with status code 500",
    "Network Error",
    "timeout of 30000ms exceeded",
    "<html><body>502 Bad Gateway</body></html>",
    '{"error":"boom"}',
    "http://103.39.133.98:8080/failed",
    "x".repeat(200),
  ])("hides technical text: %s", (raw) => {
    expect(safeMessage(raw)).toBe(GENERIC_ERROR);
  });

  it("uses the fallback for blank or non-text values", () => {
    expect(safeMessage("  ", "Fallback")).toBe("Fallback");
    expect(safeMessage(undefined, "Fallback")).toBe("Fallback");
  });
});

describe("toApiError", () => {
  const config = { headers: new AxiosHeaders() };
  const reply = (status: number, data: unknown) => ({ data, status, statusText: "", headers: {}, config });

  it("hides a 500 body's text, keeps a short 4xx business message", () => {
    const e500 = new AxiosError("Request failed with status code 500", "ERR_BAD_RESPONSE", config, undefined, reply(500, { message: "ORA-01017: invalid username" }));
    expect(toApiError(e500)).toMatchObject({ message: GENERIC_ERROR, status: 500 });
    const e400 = new AxiosError("Request failed with status code 400", "ERR_BAD_REQUEST", config, undefined, reply(400, { message: "Email already exists" }));
    expect(toApiError(e400).message).toBe("Email already exists");
  });

  it("says plainly when the server can't be reached or is too slow", () => {
    expect(toApiError(new AxiosError("Network Error", "ERR_NETWORK", config)).message).toBe(NETWORK_ERROR);
    expect(toApiError(new AxiosError("timeout of 30000ms exceeded", "ECONNABORTED", config)).message).toBe(TIMEOUT_ERROR);
  });

  it("hides a plain Error's technical text", () => {
    expect(toApiError(new Error("socket hang up")).message).toBe(GENERIC_ERROR);
  });
});
