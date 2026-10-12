/**
 * Types + shared lookups for the User Master screen — the rebuild of the old ElmsWatch app's
 * `views/admin/userMaster/index.jsx`. That screen used two *different* value sets for the same
 * role across its Create form (`Admin`/`User`/`Guest`, mapped to display labels) and its Edit
 * modal (the display labels used directly as values) — a real bug that silently desynced whenever
 * either dropdown was touched. This rebuild standardizes on one canonical `UserRole` everywhere;
 * `ROLE_FK` is the only place role names turn into the backend's numeric `roleFk`.
 */

export type UserRole = "Admin" | "User" | "Guest";

export interface RoleOption {
  value: UserRole;
  label: string;
}

/** Display labels copied verbatim from the old app's dropdowns — "Location's User"/"Super User"
 * are the labels shown to the reader even though the underlying role name is User/Guest. */
export const ROLE_OPTIONS: RoleOption[] = [
  { value: "Admin", label: "Admin" },
  { value: "User", label: "Location's User" },
  { value: "Guest", label: "Super User" },
];

export const ROLE_FK: Record<UserRole, number> = { Admin: 1, User: 2, Guest: 3 };

export function roleLabel(role: UserRole): string {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
}

/** Best-effort match of whatever the backend's `userType` field holds back to our canonical
 * `UserRole` — accepts either the role name or its display label, since existing records may have
 * been written by the old app's inconsistent Create/Edit value sets. */
export function roleFromUserType(userType: string | undefined): UserRole {
  return matchRole(userType) ?? "User";
}

/** The same lookup without the fallback: `null` when the backend's `userType` is not one we recognise. The
 * Modify form uses this so an unrecognised role shows an empty "User Role" (and must be chosen) instead of
 * quietly showing — and then saving — "Location's User". */
export function matchRole(userType: string | undefined): UserRole | null {
  const needle = userType?.trim().toLowerCase();
  return ROLE_OPTIONS.find((r) => r.value.toLowerCase() === needle || r.label.toLowerCase() === needle)?.value ?? null;
}

export type AccountStatus = "Active" | "In-Active";

export function statusFromApi(status: string | undefined): AccountStatus {
  return status?.trim().toLowerCase().startsWith("a") ? "Active" : "In-Active";
}

/** The backend's own short status code — "a"/"i" — used by `statusUpdateOfUser`. */
export function apiStatusCode(status: AccountStatus): "a" | "i" {
  return status === "Active" ? "a" : "i";
}

export interface AppUser {
  userPk: number;
  firstName: string;
  lastName: string;
  userName: string;
  emailId: string;
  mobileNo: string;
  userType: string;
  status: string;
  destination?: string;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  userName: string;
  destination: string;
  email: string;
  mobile: string;
  password: string;
  role: UserRole;
}

export interface EditUserInput {
  firstName: string;
  lastName: string;
  userName: string;
  role: UserRole;
  status: AccountStatus;
}

export const EMAIL_RULE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const MOBILE_RULE = /^\d{10}$/;
/** At least 8 characters, one letter, one number, one special character — the old app showed this
 * exact rule as a decorative hint on both the Create form and the admin password-reset modal but
 * never actually enforced it (and never checked the confirm field matched, either). Both gaps are
 * fixed here since they're pure client-side validation, not a backend-contract concern. */
export const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
export const PASSWORD_HINT = "At least 8 characters, with one letter, one number, and one special character.";
