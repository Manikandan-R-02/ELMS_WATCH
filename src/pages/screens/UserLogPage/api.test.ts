import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";

vi.mock("../../../api/axiosClient", () => ({ default: { post: vi.fn() } }));

import axiosClient from "../../../api/axiosClient";
import { downloadUserLogExcel, fetchUserLog, mapUserLogEntry, userLogFilename } from "./api";
import type { UserLogQuery } from "./data";

const post = vi.mocked(axiosClient.post);
const BASE = "/login-credential-service/loginController";

describe("UserLogPage api (login-credential-service)", () => {
  beforeEach(() => {
    post.mockReset();
  });

  describe("fetchUserLog", () => {
    const ROW = {
      userName: "Asha",
      userEmailId: "a@x.com",
      userTypeWord: "Admin",
      loginStr: "08-10-2026 09:00",
      logoutStr: "08-10-2026 17:00",
      ipAddress: "10.0.0.1",
      macId: "aa:bb",
      browser: "Chrome",
      userFk: 5,
    };

    it("builds a retrieveType=1 payload for a day query", async () => {
      post.mockResolvedValue({ data: { success: true, data: [] } });
      await fetchUserLog({ period: "day", date: new Date(2026, 8, 15) });
      expect(post).toHaveBeenCalledWith(`${BASE}/retreiveUserLog`, { day: "2026-09-15", retrieveType: 1 });
    });

    it("builds a retrieveType=2 payload for a week query", async () => {
      post.mockResolvedValue({ data: { success: true, data: [] } });
      await fetchUserLog({ period: "week", date: new Date(2026, 8, 15) });
      expect(post).toHaveBeenCalledWith(`${BASE}/retreiveUserLog`, { day: "2026-09-15", retrieveType: 2 });
    });

    it("builds a retrieveType=3 payload rounded to the start of the month for a month query", async () => {
      post.mockResolvedValue({ data: { success: true, data: [] } });
      await fetchUserLog({ period: "month", date: new Date(2026, 8, 15) });
      expect(post).toHaveBeenCalledWith(`${BASE}/retreiveUserLog`, { day: "2026-09-01", retrieveType: 3 });
    });

    it("builds a retrieveType=4 payload with yearInt for a year query", async () => {
      post.mockResolvedValue({ data: { success: true, data: [] } });
      await fetchUserLog({ period: "year", year: 2025 });
      expect(post).toHaveBeenCalledWith(`${BASE}/retreiveUserLog`, { retrieveType: 4, yearInt: 2025 });
    });

    it("reads the envelope's data and keeps only the fields the screen shows", async () => {
      post.mockResolvedValue({ data: { success: true, data: [ROW] } });
      await expect(fetchUserLog({ period: "year", year: 2026 })).resolves.toEqual([
        { userName: "Asha", userEmailId: "a@x.com", userTypeWord: "Admin", loginStr: "08-10-2026 09:00", logoutStr: "08-10-2026 17:00" },
      ]);
    });

    it("also reads the old responseContents shape, fills missing text, and treats no data as an empty list", async () => {
      post.mockResolvedValueOnce({ data: { responseContents: [{ userEmailId: "a@x.com" }] } });
      await expect(fetchUserLog({ period: "year", year: 2026 })).resolves.toEqual([
        { userName: "", userEmailId: "a@x.com", userTypeWord: undefined, loginStr: undefined, logoutStr: undefined },
      ]);

      post.mockResolvedValueOnce({ data: { success: true } });
      await expect(fetchUserLog({ period: "year", year: 2026 })).resolves.toEqual([]);
      expect(mapUserLogEntry({}).userName).toBe("");
    });

    it("throws the backend's message on success:false", async () => {
      post.mockResolvedValue({ data: { success: false, message: "Not allowed" } });
      await expect(fetchUserLog({ period: "year", year: 2026 })).rejects.toThrow("Not allowed");
    });
  });

  describe("userLogFilename", () => {
    it("builds a sanitized filename for a year query", () => {
      const query: UserLogQuery = { period: "year", year: 2026 };
      expect(userLogFilename(query)).toBe("user_log_year_2026.xlsx");
    });

    it("builds a sanitized filename for a month query, using the 1st of the month", () => {
      const query: UserLogQuery = { period: "month", date: new Date(2026, 8, 15) };
      expect(userLogFilename(query)).toBe("user_log_month_2026_09_01.xlsx");
    });

    it("builds a sanitized filename for a day query", () => {
      const query: UserLogQuery = { period: "day", date: new Date(2026, 8, 15) };
      expect(userLogFilename(query)).toBe("user_log_day_2026_09_15.xlsx");
    });
  });

  describe("downloadUserLogExcel", () => {
    const QUERY: UserLogQuery = { period: "year", year: 2026 };
    const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    let click: ReturnType<typeof vi.spyOn>;
    let createUrl: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      createUrl = vi.fn(() => "blob:fake");
      Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: vi.fn() });
      click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    });

    afterEach(() => {
      click.mockRestore();
    });

    function reply(body: BlobPart, type: string) {
      return { data: new Blob([body], { type }), headers: { "content-type": type } };
    }

    it("POSTs retreiveUserLogByExcel with the same body, asking for a blob", async () => {
      post.mockResolvedValue(reply("PK-binary", XLSX));
      await downloadUserLogExcel(QUERY);
      expect(post).toHaveBeenCalledWith(`${BASE}/retreiveUserLogByExcel`, { retrieveType: 4, yearInt: 2026 }, { responseType: "blob" });
    });

    it("saves a real workbook under the user_log_… filename", async () => {
      post.mockResolvedValue(reply("PK-binary", XLSX));
      await downloadUserLogExcel(QUERY);
      expect(createUrl).toHaveBeenCalledTimes(1);
      expect(click).toHaveBeenCalledTimes(1);
      const link = click.mock.contexts[0] as HTMLAnchorElement;
      expect(link.download).toBe("user_log_year_2026.xlsx");
    });

    it("throws the backend's message when a JSON reply says success:false (it would otherwise be saved as a broken .xlsx)", async () => {
      post.mockResolvedValue(reply(JSON.stringify({ success: false, message: "No records to export" }), "application/json"));
      await expect(downloadUserLogExcel(QUERY)).rejects.toThrow("No records to export");
      expect(click).not.toHaveBeenCalled();
    });

    it("opens the file link when the reply is JSON carrying one (download_url or downloadUrlPath, top level or in data)", async () => {
      post.mockResolvedValueOnce(reply(JSON.stringify({ success: true, download_url: "https://host/dl?file=a.xlsx" }), "application/json"));
      await downloadUserLogExcel(QUERY);
      expect((click.mock.contexts[0] as HTMLAnchorElement).href).toBe("https://host/dl?file=a.xlsx");

      post.mockResolvedValueOnce(reply(JSON.stringify({ success: true, data: { downloadUrlPath: "https://host/dl?file=b.xlsx" } }), "application/json"));
      await downloadUserLogExcel(QUERY);
      expect((click.mock.contexts[1] as HTMLAnchorElement).href).toBe("https://host/dl?file=b.xlsx");
      expect(createUrl).not.toHaveBeenCalled();
    });

    it("says so when the JSON reply has neither a link nor a message, and when the file is empty", async () => {
      post.mockResolvedValueOnce(reply("{}", "application/json"));
      await expect(downloadUserLogExcel(QUERY)).rejects.toThrow("The server did not return a file.");

      post.mockResolvedValueOnce(reply("", XLSX));
      await expect(downloadUserLogExcel(QUERY)).rejects.toThrow("The server returned an empty file.");
    });

    it("turns an HTTP error whose JSON body arrived as a blob into the backend's own message", async () => {
      const config = { headers: new AxiosHeaders() };
      const body = new Blob([JSON.stringify({ message: "Export failed on the server" })], { type: "application/json" });
      post.mockRejectedValue(new AxiosError("Request failed with status code 500", "ERR_BAD_RESPONSE", config, undefined, { data: body, status: 500, statusText: "", headers: {}, config }));
      await expect(downloadUserLogExcel(QUERY)).rejects.toThrow("Export failed on the server");
    });

    it("rethrows an error that has no readable body unchanged", async () => {
      post.mockRejectedValue(new Error("Network Error"));
      await expect(downloadUserLogExcel(QUERY)).rejects.toThrow("Network Error");
    });
  });
});
