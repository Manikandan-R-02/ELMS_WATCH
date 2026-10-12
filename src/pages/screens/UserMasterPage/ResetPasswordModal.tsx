import { useEffect, useState, type SyntheticEvent } from "react";
import { KeyRound } from "lucide-react";
import { Modal } from "../../../components/modals/Modal";
import { PasswordInput } from "../../../components/fields/PasswordInput";
import { TextButton } from "../../../components/buttons/TextButton";
import { FormErrorBanner } from "../../../components/common/FormErrorBanner";
import { toApiError } from "../../../api/types";
import { resetUserPassword } from "./api";
import { PASSWORD_HINT, PASSWORD_RULE, type AppUser } from "./data";

const FORM_ID = "reset-password-form";

export interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  user: AppUser | null;
}

interface FieldErrors {
  password?: string;
  confirmPassword?: string;
}

export function ResetPasswordModal({ open, onClose, onSaved, user }: Readonly<ResetPasswordModalProps>) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword("");
      setConfirmPassword("");
      setErrors({});
      setFormError("");
    }
  }, [open]);

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    if (!user) return;

    const nextErrors: FieldErrors = {};
    if (!password) nextErrors.password = "New password is required.";
    else if (!PASSWORD_RULE.test(password)) nextErrors.password = PASSWORD_HINT;
    if (!confirmPassword) nextErrors.confirmPassword = "Confirm the new password.";
    else if (password && confirmPassword !== password) nextErrors.confirmPassword = "Passwords do not match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await resetUserPassword(user.userPk, password);
      onSaved();
      onClose();
    } catch (err) {
      setFormError(toApiError(err).message || "Couldn't reset the password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reset Password"
      icon={
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
          <KeyRound className="h-[1.375rem] w-[1.375rem]" />
        </span>
      }
      accentClassName="bg-purple-500"
      footer={
        <>
          <TextButton variant="outline" tone="neutral" onClick={onClose} disabled={submitting}>
            Cancel
          </TextButton>
          <TextButton type="submit" form={FORM_ID} tone="purple" loading={submitting} data-tour="user-master-reset-submit">
            Reset Password
          </TextButton>
        </>
      }
    >
      <form id={FORM_ID} data-tour="user-master-reset-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {user && (
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white">
              {user.userName.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user.userName}</p>
              <p className="truncate text-xs text-slate-400 dark:text-slate-500">{user.emailId}</p>
            </div>
          </div>
        )}

        {formError && <FormErrorBanner message={formError} />}

        <PasswordInput
          label="New Password"
          required
          autoComplete="new-password"
          disabled={submitting}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((er) => ({ ...er, password: undefined }));
          }}
          error={errors.password}
          helperText={errors.password ? undefined : PASSWORD_HINT}
        />
        <PasswordInput
          label="Confirm New Password"
          required
          autoComplete="new-password"
          disabled={submitting}
          showStrength={false}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors((er) => ({ ...er, confirmPassword: undefined }));
          }}
          error={errors.confirmPassword}
        />
      </form>
    </Modal>
  );
}
