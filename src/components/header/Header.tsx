import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, KeyRound, LogOut, Menu, Moon, Search, Settings, Sun, User } from "lucide-react";
import { cn } from "../../lib/cn";
import { showInfoToast } from "../../store/toastStore";
import { useClickOutside } from "../../hooks/useClickOutside";
import { useThemeStore } from "../../store/themeStore";
import { useLayoutStore } from "../../store/layoutStore";
import { useCommandPaletteStore } from "../../store/commandPaletteStore";
import { useAuthStore } from "../../store/authStore";
import { usePeriodStore } from "../../store/periodStore";
import { Logo } from "../common/Logo";
import { ROUTES } from "../../routes/paths";
import { ChangePasswordModal } from "../modals/ChangePasswordModal";
import { ConfirmModal } from "../modals/StatusModals";
import { HelpCenterModal } from "../modals/HelpCenterModal";
import { MonthPicker } from "../datetime/MonthPicker";

// Shown before a real session exists (e.g. the demo login fallback in authStore.ts),
// so the header never renders empty while `bootstrap()` is still restoring the saved session.
const FALLBACK_USER = {
  name: "Manikandan R",
  email: "manikandan.r@esfita.in",
  role: "Administrator",
  initials: "MR",
};

export function Header() {
  const resolvedMode = useThemeStore((s) => s.resolvedMode);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const openDrawer = useLayoutStore((s) => s.openDrawer);
  const orientation = useLayoutStore((s) => s.orientation);
  const toggleMobileSidebar = useLayoutStore((s) => s.toggleMobileSidebar);
  const openCommandPalette = useCommandPaletteStore((s) => s.setOpen);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const selectedMonth = usePeriodStore((s) => s.selectedMonth);
  const setSelectedMonth = usePeriodStore((s) => s.setSelectedMonth);
  const CURRENT_USER = user ?? FALLBACK_USER;
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [helpCenterOpen, setHelpCenterOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useClickOutside(profileRef, () => setProfileOpen(false), profileOpen);

  // Opening the profile menu puts focus on its first item, so it's usable from the keyboard
  // straight away (standard menu-button behavior).
  useEffect(() => {
    if (!profileOpen) return;
    const raf = requestAnimationFrame(() => profileMenuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
    return () => cancelAnimationFrame(raf);
  }, [profileOpen]);

  function handleProfileKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!profileOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setProfileOpen(false);
      profileButtonRef.current?.focus();
      return;
    }
    const items = Array.from(profileMenuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next: number | null = null;
    if (e.key === "ArrowDown") next = (index + 1) % items.length;
    else if (e.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next === null) return;
    e.preventDefault();
    items[next].focus();
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-2 bg-gradient-to-r from-brand-800 to-brand-600 px-3 shadow-soft dark:from-brand-600 dark:to-brand-400 sm:gap-4 sm:px-6">
      {orientation === "vertical" && (
        <button
          onClick={toggleMobileSidebar}
          aria-label="Open menu"
          title="Open menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 lg:hidden"
        >
          <Menu className="h-[1.125rem] w-[1.125rem]" />
        </button>
      )}

      <Logo variant="white" className="h-9 w-auto shrink-0 object-contain" />

      <button
        data-tour="global-search"
        onClick={() => openCommandPalette(true)}
        className="ml-2 hidden max-w-xs flex-1 items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-white/70 transition hover:bg-white/20 sm:ml-4 sm:flex"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left text-sm">Jump to...</span>
        <kbd className="shrink-0 rounded border border-white/20 px-1.5 py-0.5 font-mono text-[0.65rem]">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        {/* Reporting period — every data screen reads this from periodStore instead of
            keeping its own local copy (see store/periodStore.ts). `inverted` blends the
            trigger into the brand-colored header instead of showing a white card.
            Desktop only, same as the rest of the header's secondary controls. */}
        <div data-tour="period-picker" className="hidden md:block">
          <MonthPicker
            value={selectedMonth}
            onChange={setSelectedMonth}
            dense
            portal
            inverted
            style={{ width: 176 }}
          />
        </div>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title="Toggle theme"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15"
        >
          {resolvedMode === "dark" ? <Sun className="h-[1.125rem] w-[1.125rem]" /> : <Moon className="h-[1.125rem] w-[1.125rem]" />}
        </button>
        <button
          data-tour="appearance-settings"
          onClick={openDrawer}
          aria-label="Open appearance settings"
          title="Appearance settings"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15"
        >
          <Settings className="h-[1.125rem] w-[1.125rem]" />
        </button>
        <button
          data-tour="help-center"
          onClick={() => setHelpCenterOpen(true)}
          aria-label="Help center"
          title="Help center"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15"
        >
          <HelpCircle className="h-[1.125rem] w-[1.125rem]" />
        </button>

        <div // NOSONAR - wrapper only forwards pointer/keyboard events for its popup; it is deliberately non-semantic
          ref={profileRef}
          role="presentation"
          className="relative ml-1"
          onKeyDown={handleProfileKeyDown}
          // Tabbing out of the menu closes it (focus left for something outside the whole widget).
          onBlur={(e) => {
            if (profileOpen && !e.currentTarget.contains(e.relatedTarget as Node | null)) setProfileOpen(false);
          }}
        >
          <button
            ref={profileButtonRef}
            onClick={() => setProfileOpen((v) => !v)}
            aria-label="Open profile menu"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white ring-2 ring-white/30 transition hover:ring-white/60 focus-visible:outline-none focus-visible:ring-white"
          >
            {CURRENT_USER.initials}
          </button>

          {profileOpen && (
            <div
              ref={profileMenuRef}
              role="menu"
              aria-label="Profile"
              className={cn(
                "absolute right-0 z-50 mt-2 w-64 animate-scale-in overflow-hidden rounded-[var(--app-radius)] border border-slate-200 bg-white shadow-elevated dark:border-slate-700 dark:bg-slate-900"
              )}
            >
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-base font-semibold text-white dark:bg-brand-500">
                  {CURRENT_USER.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{CURRENT_USER.name}</p>
                  <p className="truncate text-xs text-slate-400 dark:text-slate-500">{CURRENT_USER.email}</p>
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <User className="h-3.5 w-3.5" />
                  {CURRENT_USER.role}
                </div>
              </div>
              <button
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  setChangePasswordOpen(true);
                }}
                className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <KeyRound className="h-4 w-4" />
                Change password
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  setLogoutConfirmOpen(true);
                }}
                className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-slate-800 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
      <HelpCenterModal open={helpCenterOpen} onClose={() => setHelpCenterOpen(false)} />
      <ConfirmModal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          const name = user?.name;
          logout();
          navigate(ROUTES.login);
          showInfoToast(name ? `Goodbye, ${name}` : "Goodbye", "You've been signed out safely. See you again soon.");
        }}
        title="Log out?"
        confirmLabel="Log out"
      >
        You'll need to sign in again to continue.
      </ConfirmModal>
    </header>
  );
}
