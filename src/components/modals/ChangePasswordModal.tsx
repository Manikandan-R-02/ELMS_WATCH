import { safeMessage } from "../../lib/safeMessage";
import { toApiError } from "../../api/types";
import { useEffect, useState, type SyntheticEvent } from "react";
import axios from "axios";
import { KeyRound, Mail } from "lucide-react";
import { Modal } from "./Modal";
import { TextInput } from "../fields/TextInput";
import { PasswordInput } from "../fields/PasswordInput";
import { TextButton } from "../buttons/TextButton";
import { FormErrorBanner } from "../common/FormErrorBanner";
import { useAuthStore } from "../../store/authStore";
import { showSuccessToast } from "../../store/toastStore";
import axiosClient from "../../api/axiosClient";

const FORM_ID = "change-password-form";

interface UpdatePasswordResponse {
  /** The new backend answers in a `{ success, message, data }` envelope. */
  success?: boolean;
  statusCode?: number;
  status?: boolean;
  message?: string;
  apistatusmsg?: string;
}

export interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

interface FieldErrors {
  email?: string;
  newPassword?: string;
  confirmPassword?: string;
}

/**
 * Wired to the same login-credential-service the old ElmsWatch login page used
 * for its password-expiry sub-flow (`userPasswordUpdateByAdmin` — see
 * ELmsWatch/src/views/admin/login/index.jsx). Surfaced from the profile menu
 * instead of the login page here, since a signed-in user can change their
 * password any time, not only when it's expired — that inline login-page
 * sub-flow was deliberately not ported (see LoginPage.tsx).
 */
export function ChangePasswordModal({ open, onClose }: Readonly<ChangePasswordModalProps>) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [email, setEmail] = useState(user?.email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // The email is the signed-in person's own; refresh it whenever the dialog opens (the account may have changed
  // since this component was first mounted).
  useEffect(() => {
    if (open) setEmail(user?.email ?? "");
  }, [open, user?.email]);

  function resetAndClose() {
    setEmail(user?.email ?? "");
    setNewPassword("");
    setConfirmPassword("");
    setFieldErrors({});
    setFormError("");
    setSubmitting(false);
    onClose();
  }

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = "Email address is required.";
    if (!newPassword.trim()) errors.newPassword = "New password is required.";
    if (!confirmPassword.trim()) errors.confirmPassword = "Please confirm the new password.";
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      // Through axiosClient, not a standalone `fetch` — this is an authenticated call like any
      // other, so it needs the same base URL and Bearer token every other screen's API calls get
      // from the shared client. See AGENTS.md rule 4 — bypassing axiosClient breaks this invisibly.
      const { data } = await axiosClient.post<UpdatePasswordResponse>(
        "/login-credential-service/loginController/userPasswordUpdateByAdmin",
        { emailId: email, password: confirmPassword },
        { keepOnNavigation: true }
      );

      const success = data.success === true || data.statusCode === 200 || data.status === true || data.message?.toLowerCase() === "success";

      if (!success) {
        throw new Error(safeMessage(data.apistatusmsg || data.message, "Failed to update password. Please try again."));
      }

      // The old password no longer works against the session this tab is holding —
      // sign the user out so their next sign-in exercises the new one.
      showSuccessToast("Password updated", "Sign in again with your new password.");
      resetAndClose();
      logout();
    } catch (err) {
      const apiMessage = axios.isAxiosError<UpdatePasswordResponse>(err) ? err.response?.data?.apistatusmsg || err.response?.data?.message : undefined;
      setFormError(apiMessage ? safeMessage(apiMessage) : toApiError(err).message);
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="Change password"
      icon={
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <KeyRound className="h-[1.375rem] w-[1.375rem]" />
        </span>
      }
      accentClassName="bg-brand-500"
      footer={
        <>
          <TextButton variant="outline" tone="neutral" onClick={resetAndClose} disabled={submitting}>
            Cancel
          </TextButton>
          <TextButton type="submit" form={FORM_ID} loading={submitting}>
            Save
          </TextButton>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <FormErrorBanner message={formError} />}

        <TextInput
          label="Email"
          type="email"
          required
          disabled={submitting}
          leadingIcon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
          }}
          error={fieldErrors.email}
        />
        <PasswordInput
          label="New password"
          placeholder="Enter a new password"
          autoComplete="new-password"
          required
          disabled={submitting}
          leadingIcon={<KeyRound className="h-4 w-4" />}
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            if (fieldErrors.newPassword) setFieldErrors((p) => ({ ...p, newPassword: undefined }));
          }}
          error={fieldErrors.newPassword}
        />
        <PasswordInput
          label="Confirm new password"
          placeholder="Re-enter the new password"
          autoComplete="new-password"
          required
          disabled={submitting}
          showStrength={false}
          leadingIcon={<KeyRound className="h-4 w-4" />}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (fieldErrors.confirmPassword) setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
          }}
          error={fieldErrors.confirmPassword}
        />
      </form>
    </Modal>
  );
}
