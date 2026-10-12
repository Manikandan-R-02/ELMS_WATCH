import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosClient", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("../../../api/apiHelpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../api/apiHelpers")>();
  return { ...actual, currentUserContext: () => ({ userId: "24", userType: 1 }) };
});

import axiosClient from "../../../api/axiosClient";
import { createUser, fetchUsers, mapUser, resetUserPassword, setUserStatus, updateUser } from "./api";
import type { AppUser } from "./data";

const get = vi.mocked(axiosClient.get);
const post = vi.mocked(axiosClient.post);
const BASE = "/login-credential-service/loginController";
const OK = { data: { success: true, message: "ok", data: "Done" } };

const API_USER = {
  userPk: 7,
  firstName: "Asha",
  lastName: "K",
  userName: "asha",
  emailId: "asha@x.com",
  password: "secret-hash",
  mobileNo: "9876543210",
  roleFk: 2,
  userType: "User",
  status: "a",
  destination: "Dubai",
  createdBy: 1,
};

const USER: AppUser = { userPk: 7, firstName: "Asha", lastName: "K", userName: "asha", emailId: "asha@x.com", mobileNo: "9876543210", userType: "User", status: "a" };

describe("UserMasterPage api (login-credential-service)", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  describe("fetchUsers", () => {
    it("GETs listOfUserMaster and reads the envelope's data", async () => {
      get.mockResolvedValue({ data: { success: true, data: [API_USER] } });
      const users = await fetchUsers();
      expect(get).toHaveBeenCalledWith(`${BASE}/listOfUserMaster`);
      expect(users).toHaveLength(1);
      expect(users[0]).toMatchObject({ userPk: 7, firstName: "Asha", userName: "asha", emailId: "asha@x.com", userType: "User", status: "a", destination: "Dubai" });
    });

    it("never keeps the password the shared DTO lists on every user", async () => {
      get.mockResolvedValue({ data: { success: true, data: [API_USER] } });
      const [user] = await fetchUsers();
      expect(user).not.toHaveProperty("password");
      expect(JSON.stringify(user)).not.toContain("secret-hash");
    });

    it("also reads the old responseContents shape, fills missing fields, and treats no data as an empty list", async () => {
      get.mockResolvedValueOnce({ data: { responseContents: [{ userPk: 9 }] } });
      await expect(fetchUsers()).resolves.toEqual([{ userPk: 9, firstName: "", lastName: "", userName: "", emailId: "", mobileNo: "", userType: "", status: "", destination: undefined }]);

      get.mockResolvedValueOnce({ data: { success: true } });
      await expect(fetchUsers()).resolves.toEqual([]);
      expect(mapUser({ userPk: "12" }).userPk).toBe(12);
    });

    it("throws the backend's message on success:false", async () => {
      get.mockResolvedValue({ data: { success: false, message: "Not allowed" } });
      await expect(fetchUsers()).rejects.toThrow("Not allowed");
    });
  });

  describe("createUser", () => {
    it("POSTs saveUserMaster with the form fields, the role's numeric roleFk and the signed-in user as createdBy", async () => {
      post.mockResolvedValue(OK);
      await createUser({ firstName: "A", lastName: "B", userName: "ab", destination: "X", email: "a@b.co", mobile: "9876543210", password: "Pass#1234", role: "Admin" });
      expect(post).toHaveBeenCalledWith(`${BASE}/saveUserMaster`, {
        firstName: "A",
        lastName: "B",
        userName: "ab",
        emailId: "a@b.co",
        password: "Pass#1234",
        mobileNo: "9876543210",
        roleFk: 1,
        destination: "X",
        createdBy: 24,
      }, { keepOnNavigation: true });
    });

    it("surfaces success:false (e.g. a duplicate email) as the thrown message", async () => {
      post.mockResolvedValue({ data: { success: false, message: "Email already exists" } });
      await expect(createUser({ firstName: "A", lastName: "B", userName: "ab", destination: "", email: "a@b.co", mobile: "9876543210", password: "Pass#1234", role: "User" })).rejects.toThrow("Email already exists");
    });
  });

  describe("updateUser", () => {
    it("POSTs modifyOfUserMaster without a password, then statusUpdateOfUser with the short status code", async () => {
      post.mockResolvedValue(OK);
      await updateUser(USER, { firstName: "Asha2", lastName: "K", userName: "asha", role: "Guest", status: "In-Active" });
      expect(post).toHaveBeenNthCalledWith(1, `${BASE}/modifyOfUserMaster`, {
        userPk: 7,
        firstName: "Asha2",
        lastName: "K",
        userName: "asha",
        emailId: "asha@x.com",
        mobileNo: "9876543210",
        roleFk: 3,
        createdBy: 24,
      }, { keepOnNavigation: true });
      expect(post.mock.calls[0][1]).not.toHaveProperty("password");
      expect(post).toHaveBeenNthCalledWith(2, `${BASE}/statusUpdateOfUser`, { userPk: 7, status: "i" }, { keepOnNavigation: true });
    });

    it("stops before the status call when modifyOfUserMaster answers success:false", async () => {
      post.mockResolvedValueOnce({ data: { success: false, message: "User not found" } });
      await expect(updateUser(USER, { firstName: "A", lastName: "B", userName: "ab", role: "User", status: "Active" })).rejects.toThrow("User not found");
      expect(post).toHaveBeenCalledTimes(1);
    });
  });

  it("setUserStatus POSTs statusUpdateOfUser with 'a' for Active", async () => {
    post.mockResolvedValue(OK);
    await setUserStatus(7, "Active");
    expect(post).toHaveBeenCalledWith(`${BASE}/statusUpdateOfUser`, { userPk: 7, status: "a" }, { keepOnNavigation: true });
  });

  it("resetUserPassword POSTs userPasswordUpdateByAdmin with userPk, password and lastActBy", async () => {
    post.mockResolvedValue(OK);
    await resetUserPassword(7, "New#Pass12");
    expect(post).toHaveBeenCalledWith(`${BASE}/userPasswordUpdateByAdmin`, { userPk: 7, password: "New#Pass12", lastActBy: 24 }, { keepOnNavigation: true });

    post.mockResolvedValueOnce({ data: { success: false, message: "Weak password" } });
    await expect(resetUserPassword(7, "x")).rejects.toThrow("Weak password");
  });
});
