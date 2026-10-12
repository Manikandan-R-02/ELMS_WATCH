import { useEffect, useMemo, useState } from "react";
import { KeyRound, SquarePen, UserPlus, Users } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/cards/Card";
import { ResponsiveSearchBar } from "../../../components/search/ResponsiveSearchBar";
import { Table, type Column } from "../../../components/table/Table";
import { TextBadge } from "../../../components/badges/StatusBadge";
import { IconButton } from "../../../components/buttons/IconButton";
import { PlusSlideButton, RefreshSlideButton } from "../../../components/buttons/SlideButton";
import { PlusRoundedButton, RefreshRoundedButton } from "../../../components/buttons/ActionRoundedButtons";
import { useApiRequest } from "../../../api/useApiRequest";
import { useSortedPaged } from "../../../hooks/useSortedPaged";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { showSuccessToast } from "../../../store/toastStore";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../../hooks/useRegisterScreenTour";
import { userMasterTourSteps } from "../../../components/onboarding/screenSteps/userMaster";
import { fetchUsers } from "./api";
import { roleFromUserType, roleLabel, statusFromApi, type AppUser } from "./data";
import { AddUserModal } from "./AddUserModal";
import { EditUserModal } from "./EditUserModal";
import { ResetPasswordModal } from "./ResetPasswordModal";
import { HelpModal } from "../../../components/modals/HelpModal";

const USAGE_STEPS = [
  { q: "What does this screen do?", a: "Lists every application user, with their role and account status, and lets an admin add new users, edit their basic details/role/status, or reset a user's password." },
  { q: "How do I add a user?", a: 'Click "Add User", fill in the required fields (name, user name, role, email, mobile, password), and submit — the email must be unique and the password must meet the strength requirement shown under that field.' },
  { q: "How do I deactivate a user?", a: 'Open "Modify" on their row, turn off Account Status, then Save Changes — you\'ll be asked to confirm since this blocks their next sign-in.' },
  { q: "How do I reset someone's password?", a: 'Click the key icon on their row, enter and confirm a new password, then Reset Password. This does not require their current password.' },
];

export function UserMasterPage() {
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(startTour);
  const [helpOpen, setHelpOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const [addOpen, setAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [resettingUser, setResettingUser] = useState<AppUser | null>(null);

  const users = useApiRequest(fetchUsers);

  function reload() {
    users.run();
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allUsers = useMemo(() => users.data ?? [], [users.data]);

  // One concatenated haystack per user (name, username, email, role) — same convention every
  // other screen's search uses (see TargetPRJ/ProductivityPage/DataTrackerReportPage), so the
  // suggestion dropdown's entries are guaranteed to actually match once clicked, instead of a
  // suggestion string that doesn't correspond to any single field the filter checks.
  const userHaystack = useMemo(
    () => new Map(allUsers.map((u) => [u.userPk, `${u.firstName} ${u.lastName} ${u.userName} ${u.emailId} ${roleLabel(roleFromUserType(u.userType))}`.toLowerCase()])),
    [allUsers]
  );

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((u) => userHaystack.get(u.userPk)?.includes(q));
  }, [allUsers, userHaystack, debouncedSearch]);

  // Must be an actual substring of `userHaystack`'s entry for the same user (same field order,
  // no extra punctuation) so clicking a suggestion is guaranteed to match it via the filter above.
  const userSuggestions = useMemo(() => allUsers.map((u) => `${u.firstName} ${u.lastName} ${u.userName}`.trim()), [allUsers]);

  const { rows, sortKey, sortDirection, onSortChange, pagination } = useSortedPaged(
    filtered,
    (row, key) => {
      if (key === "role") return roleLabel(roleFromUserType(row.userType));
      if (key === "status") return statusFromApi(row.status);
      return (row as unknown as Record<string, string>)[key] ?? "";
    },
    10,
    { key: "userName", direction: "asc" }
  );

  const columns: Column<AppUser>[] = [
    { key: "index", header: "#", align: "center", width: "52px", render: (_row, i) => (pagination.page - 1) * pagination.pageSize + i + 1 },
    {
      key: "userName",
      header: "User Name",
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            {row.userName.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block whitespace-normal break-words font-medium text-slate-800 dark:text-slate-100">
              {row.firstName} {row.lastName}
            </span>
            <span className="block whitespace-normal break-all text-xs text-slate-400 dark:text-slate-500">{row.userName}</span>
          </span>
        </span>
      ),
    },
    { key: "emailId", header: "Email ID", sortable: true, accessor: (row) => row.emailId },
    { key: "role", header: "User Type", sortable: true, render: (row) => roleLabel(roleFromUserType(row.userType)) },
    {
      key: "status",
      header: "Status",
      sortable: true,
      align: "center",
      render: (row) => {
        const active = statusFromApi(row.status) === "Active";
        return <TextBadge status={active ? "success" : "error"} label={active ? "Active" : "Inactive"} />;
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => (
        <span className="flex items-center justify-center gap-1.5">
          <IconButton icon={SquarePen} label="Modify user" tone="cyan" size="sm" onClick={() => setEditingUser(row)} data-tour="user-master-modify" />
          <IconButton icon={KeyRound} label="Reset password" tone="purple" size="sm" onClick={() => setResettingUser(row)} data-tour="user-master-reset" />
        </span>
      ),
    },
  ];

  // "Show tour" (help modal) — walks every control, opening the Add User dialog and the Modify / Reset
  // Password dialogs (on the first listed user) for the steps that show them. Each control sets the whole
  // view (see `TourStep.before`) and the end puts the dialogs back as they were when the tour started. The
  // tour never submits anything.
  function startTour() {
    const startAdd = addOpen;
    const startEditing = editingUser;
    const startResetting = resettingUser;
    const firstUser = allUsers.at(0) ?? null;
    const closeAll = () => {
      setAddOpen(false);
      setEditingUser(null);
      setResettingUser(null);
    };
    startScreenTour(
      userMasterTourSteps({
        hasUsers: firstUser !== null,
        showList: closeAll,
        openAdd: () => {
          closeAll();
          setAddOpen(true);
        },
        openEdit: () => {
          closeAll();
          setEditingUser(firstUser);
        },
        openReset: () => {
          closeAll();
          setResettingUser(firstUser);
        },
      }),
      () => {
        setAddOpen(startAdd);
        setEditingUser(startEditing);
        setResettingUser(startResetting);
      }
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        icon={Users}
        title="User Master"
        dataTour="user-master-header"
        onHelp={() => setHelpOpen(true)}
        badge={{ icon: Users, label: `${allUsers.length} users` }}
        actions={
          <>
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <RefreshRoundedButton label="Refresh" onClick={reload} data-tour="user-master-refresh" />
              <PlusRoundedButton label="Add User" onClick={() => setAddOpen(true)} data-tour="user-master-add" />
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <RefreshSlideButton label="Refresh" onClick={reload} data-tour="user-master-refresh" />
              <PlusSlideButton label="Add User" onClick={() => setAddOpen(true)} data-tour="user-master-add" />
            </div>
          </>
        }
      />

      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <h2 className="text-card-title">All Users</h2>
          </div>
          <div data-tour="user-master-search">
            <ResponsiveSearchBar value={search} onChange={setSearch} placeholder="Search name, email, or role..." suggestions={userSuggestions} />
          </div>
        </div>
        <div className="mx-5 mt-3 border-b border-slate-200 dark:border-slate-800" />
        <div className="px-5 pb-5 pt-4" data-tour="user-master-table">
          <Table
            columns={columns}
            data={rows}
            rowKey={(row) => row.userPk}
            loading={users.loading}
            emptyMessage={debouncedSearch ? "No users match your search" : "No users found"}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={onSortChange}
            pagination={pagination}
          />
        </div>
      </Card>

      <AddUserModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        existingEmails={allUsers.map((u) => u.emailId)}
        onCreated={() => {
          showSuccessToast("User created", "The new user can now sign in.");
          reload();
        }}
      />
      <EditUserModal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSaved={() => {
          showSuccessToast("User updated", "Their details were saved.");
          reload();
        }}
      />
      <ResetPasswordModal
        open={!!resettingUser}
        onClose={() => setResettingUser(null)}
        user={resettingUser}
        onSaved={() => showSuccessToast("Password reset", "The user's password was updated.")}
      />

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} onShowTour={startTour} steps={USAGE_STEPS} />
    </div>
  );
}
