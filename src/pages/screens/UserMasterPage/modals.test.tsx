import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./api", () => ({ updateUser: vi.fn(), resetUserPassword: vi.fn(), createUser: vi.fn() }));

import { EditUserModal } from "./EditUserModal";
import { ResetPasswordModal } from "./ResetPasswordModal";
import { updateUser, resetUserPassword } from "./api";
import type { AppUser } from "./data";

const USER: AppUser = {
  userPk: 42,
  firstName: "Asha",
  lastName: "Nair",
  userName: "asha.n",
  emailId: "asha@example.com",
  mobileNo: "9876543210",
  userType: "Location's User",
  status: "Active",
};

describe("EditUserModal", () => {
  beforeEach(() => vi.mocked(updateUser).mockReset());

  it("opens already filled in with the selected user's details", async () => {
    render(<EditUserModal open onClose={() => {}} onSaved={() => {}} user={USER} />);
    await waitFor(() => expect(screen.getByLabelText(/first name/i)).toHaveValue("Asha"));
    expect(screen.getByLabelText(/last name/i)).toHaveValue("Nair");
    expect(screen.getByLabelText(/user name/i)).toHaveValue("asha.n");
    expect(screen.getByRole("button", { name: /user role/i })).toHaveTextContent("Location's User");
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("fills in the next user when reopened for someone else", async () => {
    const { rerender } = render(<EditUserModal open onClose={() => {}} onSaved={() => {}} user={USER} />);
    await waitFor(() => expect(screen.getByLabelText(/first name/i)).toHaveValue("Asha"));
    rerender(<EditUserModal open={false} onClose={() => {}} onSaved={() => {}} user={null} />);
    rerender(<EditUserModal open onClose={() => {}} onSaved={() => {}} user={{ ...USER, userPk: 7, firstName: "Ravi", userType: "Admin", status: "In-Active" }} />);
    await waitFor(() => expect(screen.getByLabelText(/first name/i)).toHaveValue("Ravi"));
    expect(screen.getByRole("button", { name: /user role/i })).toHaveTextContent("Admin");
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("does not guess a role it doesn't recognise: the role stays empty and must be chosen before saving", async () => {
    const user = userEvent.setup();
    render(<EditUserModal open onClose={() => {}} onSaved={() => {}} user={{ ...USER, userType: "Some Other Type" }} />);
    await waitFor(() => expect(screen.getByLabelText(/first name/i)).toHaveValue("Asha"));
    expect(screen.getByRole("button", { name: /user role/i })).not.toHaveTextContent("Location's User");
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    expect(await screen.findByText("Select a role.")).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("asks the browser not to autofill its name fields", async () => {
    render(<EditUserModal open onClose={() => {}} onSaved={() => {}} user={USER} />);
    expect(await screen.findByLabelText(/first name/i)).toHaveAttribute("autocomplete", "off");
    expect(screen.getByLabelText(/user name/i)).toHaveAttribute("autocomplete", "off");
  });

  it("saves the edited values for that user", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<EditUserModal open onClose={() => {}} onSaved={onSaved} user={USER} />);
    const first = await screen.findByLabelText(/first name/i);
    await waitFor(() => expect(first).toHaveValue("Asha"));
    await user.clear(first);
    await user.type(first, "Ashwini");
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(updateUser).toHaveBeenCalled());
    expect(vi.mocked(updateUser).mock.calls[0][0]).toBe(USER);
    expect(vi.mocked(updateUser).mock.calls[0][1]).toMatchObject({ firstName: "Ashwini", lastName: "Nair", userName: "asha.n", role: "User", status: "Active" });
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });
});

describe("ResetPasswordModal", () => {
  beforeEach(() => vi.mocked(resetUserPassword).mockReset());

  it("shows who the password is for, with empty password boxes", async () => {
    render(<ResetPasswordModal open onClose={() => {}} onSaved={() => {}} user={USER} />);
    expect(await screen.findByText("asha.n")).toBeInTheDocument();
    expect(screen.getByText("asha@example.com")).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password/i)).toHaveValue("");
    expect(screen.getByLabelText(/confirm new password/i)).toHaveValue("");
  });

  it("asks the browser NOT to autofill a saved password into the new-password boxes", async () => {
    render(<ResetPasswordModal open onClose={() => {}} onSaved={() => {}} user={USER} />);
    expect(await screen.findByLabelText(/^new password/i)).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByLabelText(/confirm new password/i)).toHaveAttribute("autocomplete", "new-password");
  });

  it("sends the new password for that user", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordModal open onClose={() => {}} onSaved={() => {}} user={USER} />);
    await user.type(await screen.findByLabelText(/^new password/i), "Str0ng!Pass");
    await user.type(screen.getByLabelText(/confirm new password/i), "Str0ng!Pass");
    await user.click(screen.getByRole("button", { name: /^reset password$/i }));
    await waitFor(() => expect(resetUserPassword).toHaveBeenCalledWith(42, "Str0ng!Pass"));
  });
});
