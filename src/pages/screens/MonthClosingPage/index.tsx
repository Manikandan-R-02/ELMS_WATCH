import { useState } from "react";
import { format, isValid, parse } from "date-fns";
import { AlertTriangle, CalendarCheck2, Lock, ShieldAlert } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/cards/Card";
import { TextButton } from "../../../components/buttons/TextButton";
import { ConfirmModal, FailureModal, SuccessModal } from "../../../components/modals/StatusModals";
import { useAuthStore } from "../../../store/authStore";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { useRegisterScreenTour } from "../../../hooks/useRegisterScreenTour";
import { monthClosingTourSteps } from "../../../components/onboarding/screenSteps/monthClosing";
import { closeCurrentMonth } from "./api";
import type { MonthCloseResult } from "./data";
import { HelpModal } from "../../../components/modals/HelpModal";

const USAGE_STEPS = [
  { q: "What does Close Month do?", a: "Locks the current working period for every screen in the app and advances the whole application to the next month. This is global — it isn't per-location." },
  { q: "Can I undo it?", a: "No. There is no reopen action — double-check the period shown before confirming." },
  { q: "What happens right after closing?", a: "The page reloads automatically so every screen picks up the new working period." },
];

/** The old app stored the active period as `DD-MM-YYYY` on the logged-in user (see
 * `authStore.ts`'s `AuthUser.period`, set from the login response) — parsed here only for
 * display; the close request itself takes no parameters. */
function parsePeriod(period: string | undefined): Date | null {
  if (!period) return null;
  const parsed = parse(period, "dd-MM-yyyy", new Date());
  return isValid(parsed) ? parsed : null;
}

function handleSuccessContinue() {
  // Matches the old screen's own behavior: a full reload so every screen (header period
  // picker, dashboards already loaded with the old month) picks up the new active period
  // instead of each one needing its own manual refresh logic.
  globalThis.location.reload();
}

export function MonthClosingPage() {
  const user = useAuthStore((s) => s.user);
  const { startScreenTour } = useOnboarding();
  useRegisterScreenTour(() => startScreenTour(monthClosingTourSteps));
  const [helpOpen, setHelpOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [result, setResult] = useState<MonthCloseResult | null>(null);

  const currentPeriod = parsePeriod(user?.period);
  const periodLabel = currentPeriod ? format(currentPeriod, "MMMM yyyy") : user?.period || "Unknown";

  async function handleConfirm() {
    setClosing(true);
    const outcome = await closeCurrentMonth();
    setClosing(false);
    setConfirmOpen(false);
    setResult(outcome);
  }

  return (
    <div className="space-y-3">
      <PageHeader
        icon={CalendarCheck2}
        title="Month Closing"
        dataTour="month-closing-header"
        onHelp={() => setHelpOpen(true)}
        badge={{ icon: Lock, label: `Current period: ${periodLabel}` }}
      />

      <Card data-tour="month-closing-card">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <ShieldAlert className="h-7 w-7" />
          </span>
          <div>
            <h2 className="text-card-title">Close {periodLabel}</h2>
            <p className="text-body-sm mt-1">
              Closing a month is permanent and cannot be undone. Once closed, no further entries can be made for this
              period and the whole application advances to the next month.
            </p>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-left dark:border-yellow-500/30 dark:bg-yellow-500/10">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
            <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
              Do not close a month that has already been closed, or one still under review.
            </p>
          </div>

          <TextButton
            data-tour="month-closing-button"
            tone="danger"
            size="lg"
            onClick={() => setConfirmOpen(true)}
            disabled={!currentPeriod && !user?.period}
          >
            Close Month
          </TextButton>
        </div>
      </Card>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title={`Close ${periodLabel}?`}
        tone="danger"
        confirmLabel="Close Month"
        loading={closing}
        details={[{ label: "Period", value: periodLabel }]}
      >
        This action cannot be undone. Every screen in the app will move to the next working period.
      </ConfirmModal>

      <SuccessModal
        open={!!result?.ok}
        onClose={handleSuccessContinue}
        title="Month Closed Successfully"
        primaryActionLabel="Continue"
        onPrimaryAction={handleSuccessContinue}
        details={result?.newPeriod ? [{ label: "New period", value: format(new Date(result.newPeriod), "MMMM yyyy") }] : undefined}
      >
        {periodLabel} has been closed.
      </SuccessModal>

      <FailureModal
        open={!!result && !result.ok}
        onClose={() => setResult(null)}
        title="Couldn't close the month"
        primaryActionLabel="Try Again"
        onPrimaryAction={() => {
          setResult(null);
          setConfirmOpen(true);
        }}
      >
        {result?.message || "Something went wrong. Please try again."}
      </FailureModal>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} onShowTour={() => startScreenTour(monthClosingTourSteps)} steps={USAGE_STEPS} />
    </div>
  );
}
