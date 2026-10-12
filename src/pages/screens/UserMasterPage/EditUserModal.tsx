import { useState, type SyntheticEvent } from "react";
import { SquarePen } from "lucide-react";
import { Modal } from "../../../components/modals/Modal";
import { TextInput } from "../../../components/fields/TextInput";
import { SelectSearch } from "../../../components/fields/SelectSearch";
import { Switch } from "../../../components/fields/Switch";
import { TextButton } from "../../../components/buttons/TextButton";
import { ConfirmModal } from "../../../components/modals/StatusModals";
import { FormErrorBanner } from "../../../components/common/FormErrorBanner";
import { toApiError } from "../../../api/types";
import { updateUser } from "./api";
import { ROLE_OPTIONS, matchRole, statusFromApi, type AccountStatus, type AppUser, type UserRole } from "./data";

const FORM_ID = "edit-user-form";

export interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  user: AppUser | null;
}

interface FormState {
  firstName: string;
  lastName: string;
  userName: string;
  role: UserRole | null;
  status: AccountStatus;
}

function formFromUser(user: AppUser | null): FormState {
  if (!user) return { firstName: "", lastName: "", userName: "", role: null, status: "Active" };
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    userName: user.userName,
    role: matchRole(user.userType),
    status: statusFromApi(user.status),
  };
}

type FieldErrors = Partial<Record<"firstName" | "lastName" | "userName" | "role", string>>;

/** A fresh form for each user, already filled in with that user's details from the very first render — it is
 * only mounted while the dialog is open for a user, and keyed by the user, so reopening (for the same person or
 * another) never shows the previous values or an empty form that fills in a moment later. */
export function EditUserModal(props: Readonly<EditUserModalProps>) {
  if (!props.open || !props.user) return null;
  return <EditUserDialog key={props.user.userPk} {...props} />;
}

function EditUserDialog({ open, onClose, onSaved, user }: Readonly<EditUserModalProps>) {
  const [form, setForm] = useState<FormState>(() => formFromUser(user));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (key !== "status" && (errors as Partial<Record<string, string>>)[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.firstName.trim()) next.firstName = "First name is required.";
    if (!form.lastName.trim()) next.lastName = "Last name is required.";
    if (!form.userName.trim()) next.userName = "User name is required.";
    if (!form.role) next.role = "Select a role.";
    return next;
  }

  async function save() {
    if (!user || !form.role) return;
    setSubmitting(true);
    setFormError("");
    try {
      await updateUser(user, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        userName: form.userName.trim(),
        role: form.role,
        status: form.status,
      });
      onSaved();
      onClose();
    } catch (err) {
      setFormError(toApiError(err).message || "Couldn't update the user. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !form.role) return;

    // Deactivating access is consequential enough to confirm — same gate the header's own
    // logout uses — while a routine name/role edit saves immediately.
    const wasActive = statusFromApi(user?.status) === "Active";
    if (wasActive && form.status === "In-Active") {
      setConfirmDeactivate(true);
      return;
    }
    void save();
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Modify User"
        icon={
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
            <SquarePen className="h-[1.375rem] w-[1.375rem]" />
          </span>
        }
        accentClassName="bg-cyan-500"
        footer={
          <>
            <TextButton variant="outline" tone="neutral" onClick={onClose} disabled={submitting}>
              Cancel
            </TextButton>
            <TextButton type="submit" form={FORM_ID} tone="cyan" loading={submitting} data-tour="user-master-edit-save">
              Save Changes
            </TextButton>
          </>
        }
      >
        <form id={FORM_ID} data-tour="user-master-edit-form" onSubmit={handleSubmit} noValidate className="space-y-4">
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

          <div data-tour="user-master-edit-status" className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
            <Switch
              label="Account Status"
              description={form.status === "Active" ? "This user can currently sign in." : "This user is blocked from signing in."}
              checked={form.status === "Active"}
              onChange={(checked) => set("status", checked ? "Active" : "In-Active")}
              disabled={submitting}
            />
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={() => {
          setConfirmDeactivate(false);
          void save();
        }}
        title="Deactivate this user?"
        tone="danger"
        confirmLabel="Deactivate"
        loading={submitting}
      >
        {form.userName || user?.userName} will no longer be able to sign in until reactivated.
      </ConfirmModal>
    </>
  );
}
