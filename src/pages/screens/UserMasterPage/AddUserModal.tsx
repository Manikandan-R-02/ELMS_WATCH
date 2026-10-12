import { useState, type SyntheticEvent } from "react";
import { Mail, Phone, ShieldCheck, User as UserIcon } from "lucide-react";
import { Modal } from "../../../components/modals/Modal";
import { TextInput } from "../../../components/fields/TextInput";
import { PasswordInput } from "../../../components/fields/PasswordInput";
import { SelectSearch } from "../../../components/fields/SelectSearch";
import { TextButton } from "../../../components/buttons/TextButton";
import { FormErrorBanner } from "../../../components/common/FormErrorBanner";
import { toApiError } from "../../../api/types";
import { createUser } from "./api";
import { EMAIL_RULE, MOBILE_RULE, PASSWORD_HINT, PASSWORD_RULE, ROLE_OPTIONS, type CreateUserInput, type UserRole } from "./data";

const FORM_ID = "add-user-form";

export interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** Already-loaded emails, checked case-insensitively — same duplicate guard as the old Create form. */
  existingEmails: string[];
}

interface FormState {
  firstName: string;
  lastName: string;
  userName: string;
  role: UserRole | null;
  destination: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  userName: "",
  role: null,
  destination: "",
  email: "",
  mobile: "",
  password: "",
  confirmPassword: "",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

/** Longest email address the form accepts. */
const EMAIL_MAX_LENGTH = 50;

export function AddUserModal({ open, onClose, onCreated, existingEmails }: Readonly<AddUserModalProps>) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetAndClose() {
    setForm(EMPTY_FORM);
    setErrors({});
    setFormError("");
    setSubmitting(false);
    onClose();
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.firstName.trim()) next.firstName = "First name is required.";
    if (!form.lastName.trim()) next.lastName = "Last name is required.";
    if (!form.userName.trim()) next.userName = "User name is required.";
    if (!form.role) next.role = "Select a role.";

    if (!form.email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RULE.test(form.email.trim())) next.email = "Enter a valid email address.";
    else if (existingEmails.some((e) => e.toLowerCase() === form.email.trim().toLowerCase())) {
      next.email = "This email is already registered.";
    }

    if (!form.mobile.trim()) next.mobile = "Mobile number is required.";
    else if (!MOBILE_RULE.test(form.mobile.trim())) next.mobile = "Enter a valid 10-digit mobile number.";

    if (!form.password) next.password = "Password is required.";
    else if (!PASSWORD_RULE.test(form.password)) next.password = PASSWORD_HINT;
    if (!form.confirmPassword) next.confirmPassword = "Confirm the password.";
    else if (form.password && form.confirmPassword !== form.password) next.confirmPassword = "Passwords do not match.";

    return next;
  }

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !form.role) return;

    const payload: CreateUserInput = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      userName: form.userName.trim(),
      destination: form.destination.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      password: form.password,
      role: form.role,
    };

    setSubmitting(true);
    try {
      await createUser(payload);
      onCreated();
      resetAndClose();
    } catch (err) {
      setFormError(toApiError(err).message || "Couldn't create the user. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="Add User"
      icon={
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <UserIcon className="h-[1.375rem] w-[1.375rem]" />
        </span>
      }
      accentClassName="bg-brand-500"
      size="lg"
      footer={
        <>
          <TextButton variant="outline" tone="neutral" onClick={resetAndClose} disabled={submitting}>
            Cancel
          </TextButton>
          <TextButton type="submit" form={FORM_ID} loading={submitting} data-tour="user-master-add-submit">
            Create User
          </TextButton>
        </>
      }
    >
      <form id={FORM_ID} data-tour="user-master-add-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <FormErrorBanner message={formError} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput label="First Name" required maxLength={30} autoComplete="off" disabled={submitting} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} error={errors.firstName} />
          <TextInput label="Last Name" required maxLength={30} autoComplete="off" disabled={submitting} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} error={errors.lastName} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput label="User Name" required maxLength={30} autoComplete="off" disabled={submitting} value={form.userName} onChange={(e) => set("userName", e.target.value)} error={errors.userName} />
          <SelectSearch
            label="User Role"
            required
            portal
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(v) => set("role", v)}
            placeholder="Select a role"
            disabled={submitting}
            error={errors.role}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput label="Destination" maxLength={30} autoComplete="off" disabled={submitting} value={form.destination} onChange={(e) => set("destination", e.target.value)} helperText="Optional" />
          <TextInput
            label="Email Address"
            type="email"
            autoComplete="off"
            required
            maxLength={EMAIL_MAX_LENGTH}
            disabled={submitting}
            leadingIcon={<Mail className="h-4 w-4" />}
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            error={errors.email}
          />
        </div>
        <TextInput
          label="Mobile No"
          required
          autoComplete="off"
          inputMode="numeric"
          maxLength={10}
          disabled={submitting}
          leadingIcon={<Phone className="h-4 w-4" />}
          value={form.mobile}
          onChange={(e) => set("mobile", e.target.value.replaceAll(/\D/g, ""))}
          error={errors.mobile}
        />

        <div data-tour="user-master-add-password" className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="mb-3 flex items-center gap-1.5 text-label">
            <ShieldCheck className="h-3.5 w-3.5" /> Security
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PasswordInput
              label="Password"
              required
              autoComplete="new-password"
              disabled={submitting}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              error={errors.password}
              helperText={errors.password ? undefined : PASSWORD_HINT}
            />
            <PasswordInput
              label="Confirm Password"
              required
              autoComplete="new-password"
              disabled={submitting}
              showStrength={false}
              value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
              error={errors.confirmPassword}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
