/**
 * User Master's HTTP calls — the same five endpoints, on the same `login-credential-service`
 * (`/login-credential-service/loginController/…`) as the old ElmsWatch app
 * (`views/admin/userMaster/index.jsx`) and as `ChangePasswordModal.tsx`'s own `userPasswordUpdateByAdmin`.
 * Only the response changed: every call now answers in the `{ success, message, data }` envelope.
 *
 *  - `GET listOfUserMaster` — `data` is the list of users.
 *  - `POST saveUserMaster` / `modifyOfUserMaster` / `statusUpdateOfUser` / `userPasswordUpdateByAdmin` — `data`
 *    is just a message string. A `success: false` answer on an HTTP 200 is a failure, so it throws the
 *    backend's message, which each modal then shows in its error banner.
 *
 * The user DTO is shared and very wide; the list maps only the fields this screen shows, and in particular
 * never keeps `password` (the swagger lists it on every user).
 */
import axiosClient from "../../../api/axiosClient";
import { currentUserContext, listPayload, unwrapEnvelope as unwrap, type ApiEnvelope, type ListBody } from "../../../api/apiHelpers";
import { ROLE_FK, apiStatusCode, type AccountStatus, type AppUser, type CreateUserInput, type EditUserInput } from "./data";

const BASE = "/login-credential-service/loginController";

/** One user as the backend sends it — only what is read. */
interface UserApi {
  userPk?: number | string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  emailId?: string;
  mobileNo?: string;
  userType?: string;
  status?: string;
  destination?: string;
}

export function mapUser(u: UserApi): AppUser {
  return {
    userPk: Number(u.userPk) || 0,
    firstName: u.firstName ?? "",
    lastName: u.lastName ?? "",
    userName: u.userName ?? "",
    emailId: u.emailId ?? "",
    mobileNo: u.mobileNo ?? "",
    userType: u.userType ?? "",
    status: u.status ?? "",
    destination: u.destination,
  };
}

/** `userId` off the logged-in user, falling back to `1` (the old app's own hardcoded
 * `createdBy`/`lastActBy`) only when it's unavailable — e.g. a demo-fallback session. */
function currentUserId(): number {
  const n = Number(currentUserContext().userId);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

async function post(path: string, body: object): Promise<void> {
  const { data: envelope } = await axiosClient.post<ApiEnvelope<string>>(`${BASE}/${path}`, body, { keepOnNavigation: true });
  unwrap(envelope);
}

export async function fetchUsers(): Promise<AppUser[]> {
  const { data } = await axiosClient.get<ListBody<UserApi>>(`${BASE}/listOfUserMaster`);
  return listPayload(data).map(mapUser);
}

export async function createUser(input: CreateUserInput): Promise<void> {
  await post("saveUserMaster", {
    firstName: input.firstName,
    lastName: input.lastName,
    userName: input.userName,
    emailId: input.email,
    password: input.password,
    mobileNo: input.mobile,
    roleFk: ROLE_FK[input.role],
    destination: input.destination,
    createdBy: currentUserId(),
  });
}

/**
 * Basic-info update. Deliberately omits `password` from the payload — the old modal sent it from
 * the already-loaded row with a hardcoded fallback (`"securePass123"`) whenever it was missing
 * (the list endpoint never actually returns a password), which meant editing a user's name could
 * silently overwrite their real password with that fallback. `emailId`/`mobileNo` are still sent
 * (from the real row, not a fallback) since the endpoint's contract expects them alongside the
 * edited fields. Status is toggled through the separate `statusUpdateOfUser` call, same as before.
 */
export async function updateUser(original: AppUser, edited: EditUserInput): Promise<void> {
  await post("modifyOfUserMaster", {
    userPk: original.userPk,
    firstName: edited.firstName,
    lastName: edited.lastName,
    userName: edited.userName,
    emailId: original.emailId,
    mobileNo: original.mobileNo,
    roleFk: ROLE_FK[edited.role],
    createdBy: currentUserId(),
  });
  await setUserStatus(original.userPk, edited.status);
}

export async function setUserStatus(userPk: number, status: AccountStatus): Promise<void> {
  await post("statusUpdateOfUser", { userPk, status: apiStatusCode(status) });
}

export async function resetUserPassword(userPk: number, password: string): Promise<void> {
  await post("userPasswordUpdateByAdmin", { userPk, password, lastActBy: currentUserId() });
}
